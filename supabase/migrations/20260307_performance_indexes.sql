-- =====================================================
-- Composite indexes for common query patterns
-- =====================================================

-- appointments: dashboard widget + upcoming list
CREATE INDEX IF NOT EXISTS idx_appointments_practice_date
  ON appointments (practice_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_practice_status_date
  ON appointments (practice_id, confirmation_status, appointment_date DESC);

-- call_logs: paginated list + stats queries
CREATE INDEX IF NOT EXISTS idx_call_logs_practice_date
  ON call_logs (practice_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_practice_type
  ON call_logs (practice_id, call_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_practice_outcome
  ON call_logs (practice_id, call_outcome, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_logs_practice_calldate
  ON call_logs (practice_id, call_date);

-- patients: paginated list with soft-delete filter
CREATE INDEX IF NOT EXISTS idx_patients_practice_deleted_created
  ON patients (practice_id, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_patients_practice_status
  ON patients (practice_id, status);

-- licenses: expiring licenses dashboard widget
CREATE INDEX IF NOT EXISTS idx_licenses_practice_status_expiry
  ON licenses_credentials (practice_id, status, expiration_date);

-- recall_campaign_patients: campaign detail patient list
CREATE INDEX IF NOT EXISTS idx_recall_campaign_patients_campaign
  ON recall_campaign_patients (campaign_id, contact_status);
