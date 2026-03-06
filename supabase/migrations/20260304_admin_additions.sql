-- ============================================================================
-- ADMIN / SUPER ADMIN ADDITIONS
-- ============================================================================
-- Phase 1: Adds fields to practices for admin management, creates
-- admin_settings table for platform-level config (Stripe, Cal.com, etc.),
-- and sets up RLS so only super_admin can read/write admin data.
-- ============================================================================

-- ── PRACTICES TABLE ADDITIONS ─────────────────────────────────────────────────

ALTER TABLE practices
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id        TEXT,
  ADD COLUMN IF NOT EXISTS mrr                    NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_ends_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_status      TEXT DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started','in_progress','complete')),
  ADD COLUMN IF NOT EXISTS logo_url               TEXT,
  ADD COLUMN IF NOT EXISTS notes                  TEXT,    -- internal FCG notes
  ADD COLUMN IF NOT EXISTS source                 TEXT;    -- how they found us

-- Index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_practices_stripe_customer
  ON practices(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- ── ADMIN SETTINGS TABLE ──────────────────────────────────────────────────────
-- Singleton row (one record for the entire platform).
-- Stores platform-level config: Stripe keys, Cal.com, support email, etc.
-- Only readable/writable by super_admin via service role.

CREATE TABLE IF NOT EXISTS admin_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Stripe
  stripe_secret_key     TEXT,
  stripe_publishable_key TEXT,
  stripe_webhook_secret TEXT,

  -- Plan price IDs (set once, used when creating Stripe subscriptions)
  stripe_price_capture  TEXT,   -- Serenity Capture flat monthly
  stripe_price_core     TEXT,   -- Serenity Core flat monthly
  stripe_price_complete TEXT,   -- Serenity Complete flat monthly
  stripe_price_overage  TEXT,   -- per-call overage metered price

  -- Cal.com
  calcom_api_key        TEXT,
  calcom_event_type_id  TEXT,   -- demo booking event type

  -- Email (platform-level Resend config, separate from per-practice)
  platform_resend_key   TEXT,
  platform_from_email   TEXT,
  platform_from_name    TEXT DEFAULT 'Dental AI Growth System',
  support_email         TEXT,

  -- Platform identity
  platform_name         TEXT DEFAULT 'Dental AI Growth System',
  company_name          TEXT DEFAULT 'First-Choice Cyber',
  platform_url          TEXT,

  -- Metadata
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_by            UUID REFERENCES users(id)
);

-- Only ever one row
CREATE UNIQUE INDEX IF NOT EXISTS admin_settings_singleton
  ON admin_settings ((true));

-- Seed the singleton row so the settings page can always UPDATE
INSERT INTO admin_settings (id)
VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- RLS: only accessible via service role (super_admin API routes bypass RLS)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- No regular user policies — all access goes through service-role API routes.
-- Super admin pages call server-side route handlers that use createServiceClient().

-- ── USERS TABLE SOFT-DELETE ───────────────────────────────────────────────────
-- Must come before the view below which references u.deleted_at.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── AUDIT LOG ADDITIONS ───────────────────────────────────────────────────────
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS impersonated_practice_id UUID REFERENCES practices(id),
  ADD COLUMN IF NOT EXISTS impersonated_by          UUID REFERENCES users(id);

-- ── HELPER VIEW: PRACTICE SUMMARY ─────────────────────────────────────────────
-- Used by the admin /practices list page for quick stats per practice.

CREATE OR REPLACE VIEW admin_practice_summary AS
SELECT
  p.id,
  p.name,
  p.subscription_tier,
  p.subscription_status,
  p.onboarding_status,
  p.mrr,
  p.trial_ends_at,
  p.source,
  p.created_at,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.logo_url,
  p.notes,
  (SELECT COUNT(*) FROM users    u WHERE u.practice_id = p.id AND u.deleted_at IS NULL)::INT  AS user_count,
  (SELECT COUNT(*) FROM patients pt WHERE pt.practice_id = p.id AND pt.deleted_at IS NULL)::INT AS patient_count,
  (SELECT COUNT(*) FROM call_logs cl WHERE cl.practice_id = p.id
     AND cl.created_at >= date_trunc('month', NOW()))::INT                                      AS calls_this_month,
  (SELECT MAX(cl2.created_at) FROM call_logs cl2 WHERE cl2.practice_id = p.id)                 AS last_call_at,
  (SELECT COUNT(*) FROM insurance_verifications iv
     WHERE iv.practice_id = p.id AND iv.status = 'pending_staff')::INT                         AS pending_verifications
FROM practices p
WHERE p.deleted_at IS NULL;