-- ============================================================================
-- MFA (Multi-Factor Authentication) Support
-- HIPAA Requirement: All users must enroll MFA within 14-day grace period
-- ============================================================================

-- Track MFA enrollment state and grace period on each user
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_enrolled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mfa_grace_period_ends TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days');

-- Back-fill grace period for existing users who haven't enrolled
UPDATE users
  SET mfa_grace_period_ends = NOW() + INTERVAL '14 days'
  WHERE mfa_grace_period_ends IS NULL;

-- ============================================================================
-- Recovery codes — 8 single-use codes per user (SHA-256 hashed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mfa_recovery_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recovery codes"
  ON mfa_recovery_codes FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user
  ON mfa_recovery_codes(user_id) WHERE used_at IS NULL;

-- ============================================================================
-- Break glass access logs — audit trail for every emergency bypass
-- ============================================================================
CREATE TABLE IF NOT EXISTS break_glass_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  note TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE break_glass_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view break glass logs"
  ON break_glass_logs FOR SELECT
  USING ((SELECT role = 'super_admin' FROM users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_break_glass_logs_accessed_at
  ON break_glass_logs(accessed_at DESC);
