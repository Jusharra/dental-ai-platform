-- ============================================================================
-- INSURANCE VERIFICATION FEATURE
-- ============================================================================
-- Adds subscriber fields to patients and creates insurance_verifications table
-- with patient-supplied fields and staff CDT code verification breakdown.
-- ============================================================================

-- Add subscriber fields to patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS subscriber_name TEXT,
  ADD COLUMN IF NOT EXISTS subscriber_dob DATE,
  ADD COLUMN IF NOT EXISTS subscriber_relationship TEXT
    CHECK (subscriber_relationship IN ('self', 'spouse', 'child', 'other'));

-- ============================================================================
-- INSURANCE VERIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

  -- Token for patient-facing public form
  token            TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Lifecycle status
  status TEXT NOT NULL DEFAULT 'pending_patient'
    CHECK (status IN ('pending_patient', 'pending_staff', 'verified', 'expired')),

  -- Email delivery tracking
  sent_to_email TEXT,
  sent_at       TIMESTAMPTZ,

  -- ── PATIENT-SUPPLIED FIELDS ───────────────────────────────────────────────
  p_subscriber_name         TEXT,
  p_subscriber_dob          DATE,
  p_subscriber_relationship TEXT,  -- self | spouse | child | other
  p_insurance_carrier       TEXT,
  p_member_id               TEXT,
  p_group_number            TEXT,
  p_card_front_url          TEXT,  -- Supabase Storage URL
  p_card_back_url           TEXT,  -- Supabase Storage URL
  patient_submitted_at      TIMESTAMPTZ,

  -- ── STAFF VERIFICATION — POLICY INFO ─────────────────────────────────────
  plan_name         TEXT,
  network_type      TEXT CHECK (network_type IN ('in_network', 'out_of_network', 'unknown')),
  fee_schedule      TEXT,
  effective_date    DATE,
  termination_date  DATE,

  -- ── MAXIMUMS & DEDUCTIBLES ────────────────────────────────────────────────
  annual_maximum             NUMERIC(10,2),
  individual_deductible      NUMERIC(10,2),
  family_deductible          NUMERIC(10,2),
  individual_deductible_met  NUMERIC(10,2),
  family_deductible_met      NUMERIC(10,2),
  ortho_lifetime_max         NUMERIC(10,2),

  -- ── FLAGS ─────────────────────────────────────────────────────────────────
  missing_tooth_clause  BOOLEAN DEFAULT false,
  aob_accepted          BOOLEAN DEFAULT false,

  -- ── CDT COVERAGE BREAKDOWN (JSONB) ───────────────────────────────────────
  -- Keyed by CDT code (lowercase), value: { pct: number, freq: string, wait?: string }
  -- Example:
  --   {
  --     "d1110": { "pct": 100, "freq": "2 per year" },
  --     "d0274": { "pct": 100, "freq": "1 per year" },
  --     "d4341": { "pct": 80, "freq": "1 per quad / 24 months" },
  --     "d2750": { "pct": 50, "freq": "1 per 5 years", "wait": "12 months" }
  --   }
  coverage_breakdown JSONB DEFAULT '{}',

  -- ── STAFF VERIFICATION META ───────────────────────────────────────────────
  verified_by_user_id  UUID REFERENCES users(id),
  verified_date        DATE,
  spoke_to             TEXT,
  reference_number     TEXT,
  verification_notes   TEXT,
  staff_verified_at    TIMESTAMPTZ,

  -- Metadata
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insver_patient  ON insurance_verifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_insver_practice ON insurance_verifications(practice_id);
CREATE INDEX IF NOT EXISTS idx_insver_token    ON insurance_verifications(token);
CREATE INDEX IF NOT EXISTS idx_insver_status   ON insurance_verifications(status);

-- Auto-update updated_at
CREATE TRIGGER update_insurance_verifications_updated_at
  BEFORE UPDATE ON insurance_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE insurance_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view practice verifications"
  ON insurance_verifications FOR SELECT
  USING (practice_id IN (
    SELECT practice_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can insert practice verifications"
  ON insurance_verifications FOR INSERT
  WITH CHECK (practice_id IN (
    SELECT practice_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Staff can update practice verifications"
  ON insurance_verifications FOR UPDATE
  USING (practice_id IN (
    SELECT practice_id FROM users WHERE id = auth.uid()
  ));

-- ============================================================================
-- SUPABASE STORAGE BUCKET (run separately in Storage UI if needed)
-- ============================================================================
-- Create bucket: insurance-cards
-- Bucket type: Private
-- The service role key uploads files; signed URLs are generated for viewing.
