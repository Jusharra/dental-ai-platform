-- =====================================================
-- CRM Module: Lead management, email sequences,
-- calculator defaults, and governance scoring
-- =====================================================

-- =====================================================
-- Lead ID sequences (auto-generate T1-001, T2-001)
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS crm_lead_t1_seq START 1;
CREATE SEQUENCE IF NOT EXISTS crm_lead_t2_seq START 1;

-- =====================================================
-- CRM Leads (unified Track-1 + Track-2)
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_leads (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                   TEXT UNIQUE,
  track                     TEXT NOT NULL CHECK (track IN ('track_1', 'track_2')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contact
  first_name                TEXT NOT NULL,
  last_name                 TEXT,
  business_name             TEXT,
  email                     TEXT NOT NULL,
  phone                     TEXT,
  source                    TEXT NOT NULL DEFAULT 'Manual', -- 'Manual' triggers COLD template for Email 1

  -- Status & scoring
  status                    TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Booked', 'Unsubscribed')),
  lead_score                TEXT NOT NULL DEFAULT 'New' CHECK (lead_score IN ('New', 'Warm', 'Hot', 'Cold')),

  -- Email sequence
  email_sequence_stage      TEXT NOT NULL DEFAULT 'Email 1 of 9',
  last_email_sent           TIMESTAMPTZ,
  next_email_date           DATE,
  booking_link_clicked      BOOLEAN NOT NULL DEFAULT false,

  -- Misc
  notes                     TEXT,
  unsubscribe_token         UUID NOT NULL DEFAULT gen_random_uuid(),

  -- Track-1: Dental practice revenue loss
  practice_specialty        TEXT,
  monthly_appointments      INTEGER,
  after_hours_loss          NUMERIC(12,2),
  hold_time_loss            NUMERIC(12,2),
  no_show_loss              NUMERIC(12,2),
  total_annual_revenue_loss NUMERIC(12,2),

  -- Track-2: Governance / AI readiness
  job_title                 TEXT,
  organization_size         TEXT,
  currently_using_ai        TEXT CHECK (currently_using_ai IN ('Yes', 'No', 'Not Sure')),
  industry                  TEXT,
  governance_score          INTEGER,
  risk_level                TEXT CHECK (risk_level IN ('Low', 'Medium', 'High'))
);

-- Auto-generate lead_id on insert
CREATE OR REPLACE FUNCTION generate_crm_lead_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lead_id IS NULL THEN
    IF NEW.track = 'track_1' THEN
      NEW.lead_id := 'T1-' || LPAD(nextval('crm_lead_t1_seq')::text, 3, '0');
    ELSE
      NEW.lead_id := 'T2-' || LPAD(nextval('crm_lead_t2_seq')::text, 3, '0');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_crm_lead
  BEFORE INSERT ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION generate_crm_lead_id();

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
-- Service role (admin API routes) bypasses RLS automatically.
-- No user-facing policies needed — this is admin-only data.

-- =====================================================
-- Email Templates
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_email_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  TEXT UNIQUE NOT NULL,   -- e.g. T1-E1, T1-E1-COLD, T2-E5
  track        TEXT NOT NULL,          -- 'Track 1' | 'Track 2'
  email_number INTEGER NOT NULL CHECK (email_number BETWEEN 1 AND 9),
  is_cold      BOOLEAN NOT NULL DEFAULT false,
  subject_line TEXT NOT NULL DEFAULT '',
  body         TEXT NOT NULL DEFAULT '',
  when_to_send TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_crm_email_templates_updated_at
  BEFORE UPDATE ON crm_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed placeholder templates (Track 1 — 9 regular + 1 cold)
INSERT INTO crm_email_templates (template_id, track, email_number, is_cold, when_to_send, subject_line, body) VALUES
  ('T1-E1',      'Track 1', 1, false, 'Immediately',
   '[BUSINESS_NAME] is losing $[TOTAL_LOSS] annually',
   'Hi [FIRST_NAME],

I ran a quick analysis on [BUSINESS_NAME] and found you may be losing [TOTAL_LOSS] in annual revenue.

Here''s the breakdown:
• After-hours missed calls: [AFTER_HOURS_LOSS]/year
• Patients lost to hold times: [HOLD_TIME_LOSS]/year
• No-show revenue loss: [NO_SHOW_LOSS]/year

Most [SPECIALTY] practices don''t realize how much revenue slips through after-hours. We''ve built an AI receptionist that captures those calls 24/7.

Would you be open to a 15-minute call to see if it''s a fit?

[BOOKING_LINK]

Best,
Shay Goree
First-Choice Cyber

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T1-E1-COLD',  'Track 1', 1, true, 'Immediately (cold outreach)',
   'Quick question about [BUSINESS_NAME]',
   'Hi [FIRST_NAME],

I came across [BUSINESS_NAME] and had a quick question — are you currently capturing after-hours patient calls?

Most [SPECIALTY] practices lose [TOTAL_LOSS]/year just from missed calls and no-shows. We help fix that with an AI receptionist.

Worth a 15-minute chat?

[BOOKING_LINK]

Best,
Shay Goree
First-Choice Cyber

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T1-E2',      'Track 1', 2, false, 'Day 2',
   'Still thinking about it, [FIRST_NAME]?',
   'Hi [FIRST_NAME],

Just following up on my last email about [BUSINESS_NAME].

The [TOTAL_LOSS] annual loss I mentioned is based on real data from [SPECIALTY] practices like yours.

That''s [MONTHLY_LOSS]/month — or roughly [DAILY_LOSS] every single day.

Happy to walk you through how other practices have recovered this revenue.

[BOOKING_LINK]

Best,
Shay Goree

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T1-E3',      'Track 1', 3, false, 'Day 5',
   'How [SPECIALTY] practices are recovering missed revenue',
   'Hi [FIRST_NAME],

[Placeholder — add your Email 3 content here]

[BOOKING_LINK]

Best,
Shay Goree

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T1-E4',      'Track 1', 4, false, 'Day 7',
   '[FIRST_NAME], a quick story',
   'Hi [FIRST_NAME],

[Placeholder — add your Email 4 content here]

[BOOKING_LINK]

Best,
Shay Goree

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T1-E5',      'Track 1', 5, false, 'Day 10',
   'The cost of waiting',
   'Hi [FIRST_NAME],

[Placeholder — add your Email 5 content here]

[BOOKING_LINK]

Best,
Shay Goree

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T1-E6',      'Track 1', 6, false, 'Day 14',
   'Last check-in',
   'Hi [FIRST_NAME],

[Placeholder — add your Email 6 content here]

[BOOKING_LINK]

Best,
Shay Goree

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T1-E7',      'Track 1', 7, false, 'Day 17',
   'One more thought, [FIRST_NAME]',
   'Hi [FIRST_NAME],

[Placeholder — add your Email 7 content here]

[BOOKING_LINK]

Best,
Shay Goree

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T1-E8',      'Track 1', 8, false, 'Day 21',
   'Still here if you need me',
   'Hi [FIRST_NAME],

[Placeholder — add your Email 8 content here]

[BOOKING_LINK]

Best,
Shay Goree

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T1-E9',      'Track 1', 9, false, 'Day 28',
   'Closing the loop',
   'Hi [FIRST_NAME],

[Placeholder — add your Email 9 content here]

[BOOKING_LINK]

Best,
Shay Goree

---
To unsubscribe: [UNSUBSCRIBE_LINK]')
ON CONFLICT (template_id) DO NOTHING;

-- Seed Track 2 templates
INSERT INTO crm_email_templates (template_id, track, email_number, is_cold, when_to_send, subject_line, body) VALUES
  ('T2-E1',      'Track 2', 1, false, 'Immediately',
   'AI governance risk at [BUSINESS_NAME]',
   'Hi [FIRST_NAME],

Based on your profile, [BUSINESS_NAME] has a governance score of [GOVERNANCE_SCORE]/60 — placing you in the [RISK_LEVEL] risk tier.

[Placeholder — add your Track 2 Email 1 content here]

[BOOKING_LINK]

Best,
Shay Goree
First-Choice Cyber

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T2-E1-COLD',  'Track 2', 1, true, 'Immediately (cold outreach)',
   'Quick question about AI at [BUSINESS_NAME]',
   'Hi [FIRST_NAME],

[Placeholder — add your Track 2 Cold Email 1 content here]

[BOOKING_LINK]

Best,
Shay Goree
First-Choice Cyber

---
To unsubscribe: [UNSUBSCRIBE_LINK]'),

  ('T2-E2', 'Track 2', 2, false, 'Day 2',   'Placeholder subject', '[Placeholder body] [BOOKING_LINK]\n\n---\nTo unsubscribe: [UNSUBSCRIBE_LINK]'),
  ('T2-E3', 'Track 2', 3, false, 'Day 5',   'Placeholder subject', '[Placeholder body] [BOOKING_LINK]\n\n---\nTo unsubscribe: [UNSUBSCRIBE_LINK]'),
  ('T2-E4', 'Track 2', 4, false, 'Day 7',   'Placeholder subject', '[Placeholder body] [BOOKING_LINK]\n\n---\nTo unsubscribe: [UNSUBSCRIBE_LINK]'),
  ('T2-E5', 'Track 2', 5, false, 'Day 10',  'Placeholder subject', '[Placeholder body] [BOOKING_LINK]\n\n---\nTo unsubscribe: [UNSUBSCRIBE_LINK]'),
  ('T2-E6', 'Track 2', 6, false, 'Day 14',  'Placeholder subject', '[Placeholder body] [BOOKING_LINK]\n\n---\nTo unsubscribe: [UNSUBSCRIBE_LINK]'),
  ('T2-E7', 'Track 2', 7, false, 'Day 17',  'Placeholder subject', '[Placeholder body] [BOOKING_LINK]\n\n---\nTo unsubscribe: [UNSUBSCRIBE_LINK]'),
  ('T2-E8', 'Track 2', 8, false, 'Day 21',  'Placeholder subject', '[Placeholder body] [BOOKING_LINK]\n\n---\nTo unsubscribe: [UNSUBSCRIBE_LINK]'),
  ('T2-E9', 'Track 2', 9, false, 'Day 28',  'Placeholder subject', '[Placeholder body] [BOOKING_LINK]\n\n---\nTo unsubscribe: [UNSUBSCRIBE_LINK]')
ON CONFLICT (template_id) DO NOTHING;

-- =====================================================
-- Track-1 Calculator: Specialty defaults
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_specialty_defaults (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty               TEXT UNIQUE NOT NULL,
  avg_appt_value          NUMERIC(8,2) NOT NULL,
  after_hours_call_pct    NUMERIC(5,4) NOT NULL,  -- e.g. 0.25 = 25%
  hold_time_abandon_pct   NUMERIC(5,4) NOT NULL,
  no_show_rate_pct        NUMERIC(5,4) NOT NULL,
  weekly_calls_after_hours INTEGER NOT NULL,
  no_show_multiplier      NUMERIC(4,2) NOT NULL
);

ALTER TABLE crm_specialty_defaults ENABLE ROW LEVEL SECURITY;

INSERT INTO crm_specialty_defaults
  (specialty, avg_appt_value, after_hours_call_pct, hold_time_abandon_pct, no_show_rate_pct, weekly_calls_after_hours, no_show_multiplier)
VALUES
  ('Dental',        200, 0.25,  0.167, 0.22, 15, 1.2),
  ('Primary Care',  175, 0.20,  0.18,  0.20, 12, 1.0),
  ('Orthopedics',   350, 0.30,  0.15,  0.18, 18, 1.5),
  ('Cardiology',    400, 0.28,  0.14,  0.16, 16, 1.6),
  ('Dermatology',   225, 0.22,  0.17,  0.19, 14, 1.1),
  ('Ophthalmology', 275, 0.24,  0.16,  0.17, 13, 1.3),
  ('Other',         225, 0.22,  0.17,  0.21, 13, 1.1)
ON CONFLICT (specialty) DO NOTHING;

-- =====================================================
-- Track-2 Governance scoring rules
-- Risk levels: Low 0-25, Medium 26-45, High 46-60
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_governance_scoring (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer   TEXT NOT NULL,
  points   INTEGER NOT NULL,
  UNIQUE (question, answer)
);

ALTER TABLE crm_governance_scoring ENABLE ROW LEVEL SECURITY;

INSERT INTO crm_governance_scoring (question, answer, points) VALUES
  ('Currently Using AI?', 'Yes',       20),
  ('Currently Using AI?', 'No',         5),
  ('Currently Using AI?', 'Not Sure',  10),
  ('Job Title', 'CISO',                        20),
  ('Job Title', 'Chief Compliance Officer',    20),
  ('Job Title', 'CIO',                         15),
  ('Job Title', 'VP Risk & Compliance',        15),
  ('Job Title', 'VP Information Security',     18),
  ('Job Title', 'Other',                        8),
  ('Organization Size', 'Less than 50',   5),
  ('Organization Size', '50-500',        10),
  ('Organization Size', '500-5000',      15),
  ('Organization Size', '5000+',         20)
ON CONFLICT (question, answer) DO NOTHING;

-- =====================================================
-- updated_at trigger for crm_leads
-- =====================================================
CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Supabase pg_cron setup
-- Run these after enabling pg_cron + pg_net extensions
-- in Supabase Dashboard → Database → Extensions
--
-- Replace YOUR_APP_URL and YOUR_CRON_SECRET with real values.
--
-- SELECT cron.schedule(
--   'crm-email-sequences',
--   '0 8 * * *',
--   $$
--     SELECT net.http_get(
--       url := 'https://YOUR_APP_URL/api/cron/crm-email-sequences',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer YOUR_CRON_SECRET'
--       )
--     );
--   $$
-- );
--
-- SELECT cron.schedule(
--   'crm-cold-leads',
--   '0 0 * * *',
--   $$
--     SELECT net.http_get(
--       url := 'https://YOUR_APP_URL/api/cron/crm-cold-leads',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer YOUR_CRON_SECRET'
--       )
--     );
--   $$
-- );
-- =====================================================
