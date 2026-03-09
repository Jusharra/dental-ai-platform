-- ============================================================
-- Webhook Security: per-practice secrets + audit logging
-- ============================================================

-- 1. Add webhook_secret column to practices
ALTER TABLE practices ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Generate a unique secret for any practice that doesn't have one
UPDATE practices
SET webhook_secret = encode(gen_random_bytes(32), 'hex')
WHERE webhook_secret IS NULL;

-- 2. Webhook audit log table
CREATE TABLE IF NOT EXISTS webhook_audit_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id      UUID        REFERENCES practices(id) ON DELETE CASCADE,
  event_type       TEXT        NOT NULL, -- 'inbound' | 'recall' | 'confirmation'
  accepted         BOOLEAN     NOT NULL,
  rejection_reason TEXT,                 -- null on success; code on denial
  ip_address       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for per-practice log queries
CREATE INDEX IF NOT EXISTS idx_webhook_audit_practice_time
  ON webhook_audit_logs(practice_id, created_at DESC);

-- RLS
ALTER TABLE webhook_audit_logs ENABLE ROW LEVEL SECURITY;

-- Practices can read their own audit logs
CREATE POLICY "practice_read_own_webhook_audit" ON webhook_audit_logs
  FOR SELECT USING (
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid()
    )
  );

-- Super admins can read all
CREATE POLICY "super_admin_read_all_webhook_audit" ON webhook_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
