-- =====================================================
-- Reports: call cost tracking + report subscriptions
-- =====================================================

-- Add cost tracking to call_logs
ALTER TABLE call_logs
  ADD COLUMN IF NOT EXISTS retell_cost_cents INTEGER NOT NULL DEFAULT 0;

-- =====================================================
-- Report subscriptions (scheduled monthly email)
-- =====================================================
CREATE TABLE IF NOT EXISTS report_subscriptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id    UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  report_type    TEXT NOT NULL,       -- 'call_performance'|'confirmation'|'recall'|'insurance'|'executive'
  frequency      TEXT NOT NULL DEFAULT 'monthly',  -- 'monthly' for now
  recipient_email TEXT NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  last_sent_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE report_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "practice members can manage report subscriptions"
  ON report_subscriptions FOR ALL
  USING (
    practice_id IN (
      SELECT practice_id FROM users WHERE id = auth.uid()
    )
  );

CREATE TRIGGER update_report_subscriptions_updated_at
  BEFORE UPDATE ON report_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();