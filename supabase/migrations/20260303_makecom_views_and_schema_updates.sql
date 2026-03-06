-- ============================================================================
-- Migration: Make.com Views & Schema Updates
-- Run in Supabase Studio → SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. SCHEMA CHANGES
-- ============================================================================

-- Add check-in tracking to appointments (for Today's No-Shows detection)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- Add reminder-sent tracking to appointments (prevents Make.com double-calling)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_7day_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_3day_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_1day_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reminder_3hour_sent_at TIMESTAMPTZ;

-- Add 'call_failed' to call_outcome check constraint
ALTER TABLE call_logs DROP CONSTRAINT IF EXISTS call_logs_call_outcome_check;
ALTER TABLE call_logs ADD CONSTRAINT call_logs_call_outcome_check
  CHECK (call_outcome IN (
    'appointment_booked',
    'appointment_confirmed',
    'appointment_declined',
    'appointment_rescheduled',
    'no_answer',
    'voicemail',
    'call_failed',
    'wrong_number',
    'callback_requested',
    'other'
  ));

-- ============================================================================
-- 2. MAKE.COM QUERY VIEWS
-- These views are queried by Make.com scheduled scenarios.
-- Make.com connects using the Supabase service role key.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BASE VIEW: All appointments needing confirmation
-- Used as the foundation for all 4 reminder scenario views
-- Equivalent to Airtable "Appointments Needing Confirmation" view:
--   Days Until Appointment >= 2, Confirmation = Not Contacted, Status = Scheduled
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_appointments_needing_confirmation AS
SELECT
  a.id,
  a.practice_id,
  a.patient_id,
  a.provider_name,
  a.appointment_date,
  a.appointment_time,
  a.procedure_type,
  a.status,
  a.confirmation_status,
  a.reminder_7day_sent_at,
  a.reminder_3day_sent_at,
  a.reminder_1day_sent_at,
  a.reminder_3hour_sent_at,
  p.first_name,
  p.last_name,
  p.phone,
  p.email,
  p.consented_to_ai_calls,
  p.can_leave_voicemail
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.appointment_date >= CURRENT_DATE + INTERVAL '2 days'
  AND a.status = 'scheduled'
  AND a.confirmation_status = 'pending'
  AND p.consented_to_ai_calls = true
  AND p.deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 7-DAY CONFIRMATION REMINDER
-- Make.com scenario: "7-DAY CONFIRMATION REMINDER - Dentist"
-- Runs daily. Returns appointments exactly 7 days out not yet called.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_appointments_7day_reminder AS
SELECT * FROM v_appointments_needing_confirmation
WHERE appointment_date = CURRENT_DATE + INTERVAL '7 days'
  AND reminder_7day_sent_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3-DAY CONFIRMATION REMINDER
-- Make.com scenario: "3-DAY CONFIRMATION REMINDER - Dentist"
-- Runs daily. Returns appointments exactly 3 days out not yet called.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_appointments_3day_reminder AS
SELECT * FROM v_appointments_needing_confirmation
WHERE appointment_date = CURRENT_DATE + INTERVAL '3 days'
  AND reminder_3day_sent_at IS NULL;

-- ----------------------------------------------------------------------------
-- 1-DAY BEFORE CONFIRMATION REMINDER
-- Make.com scenario: "1-DAY BEFORE CONFIRMATION REMINDER - Dentist"
-- Runs daily. Returns appointments tomorrow not yet called.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_appointments_1day_reminder AS
SELECT * FROM v_appointments_needing_confirmation
WHERE appointment_date = CURRENT_DATE + INTERVAL '1 day'
  AND reminder_1day_sent_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3-HOUR BEFORE FINAL REMINDER
-- Make.com scenario: "3-HOUR BEFORE - FINAL REMINDER - Dentist"
-- Runs hourly. Returns today's appointments happening in the next 2.5–3.5 hours.
-- NOTE: Adjust the AT TIME ZONE value to match your practice timezone.
--   Common values: 'America/New_York', 'America/Chicago', 'America/Los_Angeles'
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_appointments_3hour_reminder AS
SELECT
  a.id,
  a.practice_id,
  a.patient_id,
  a.provider_name,
  a.appointment_date,
  a.appointment_time,
  a.procedure_type,
  a.status,
  a.confirmation_status,
  a.reminder_3hour_sent_at,
  p.first_name,
  p.last_name,
  p.phone,
  p.email,
  p.consented_to_ai_calls,
  p.can_leave_voicemail
FROM appointments a
JOIN patients p ON p.id = a.patient_id
WHERE a.appointment_date = CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed')
  AND a.reminder_3hour_sent_at IS NULL
  AND p.consented_to_ai_calls = true
  AND p.deleted_at IS NULL
  AND (a.appointment_time BETWEEN
    (NOW() AT TIME ZONE 'America/New_York' + INTERVAL '2 hours 30 minutes')::TIME
    AND (NOW() AT TIME ZONE 'America/New_York' + INTERVAL '3 hours 30 minutes')::TIME
  );

-- ----------------------------------------------------------------------------
-- PATIENTS DUE FOR RECALL
-- Make.com scenario: "Daily Recall Trigger - Dentist"
-- Equivalent to Airtable "Patients Due for Recall" view:
--   Recall Status >= 180 days, Status = Active
-- Excludes patients already called for recall in the past 30 days.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_patients_due_for_recall AS
SELECT
  p.id,
  p.practice_id,
  p.first_name,
  p.last_name,
  p.phone,
  p.email,
  p.last_visit_date,
  p.recall_due_date,
  p.recall_reason,
  (CURRENT_DATE - p.last_visit_date) AS days_since_last_visit
FROM patients p
WHERE p.status = 'active'
  AND p.deleted_at IS NULL
  AND p.consented_to_ai_calls = true
  AND (
    -- Last visit was 180+ days ago
    p.last_visit_date <= CURRENT_DATE - INTERVAL '180 days'
    -- OR a specific recall due date has passed
    OR (p.recall_due_date IS NOT NULL AND p.recall_due_date <= CURRENT_DATE)
  )
  -- Don't recall patients already called in the last 30 days
  AND NOT EXISTS (
    SELECT 1 FROM call_logs cl
    WHERE cl.patient_id = p.id
      AND cl.call_type = 'recall'
      AND cl.call_date >= CURRENT_DATE - INTERVAL '30 days'
  );

-- ============================================================================
-- 3. RPC FUNCTION: Mark reminder as sent
-- Make.com calls this immediately after triggering a Retell AI call
-- to prevent the same appointment being called again on the next run.
--
-- Usage in Make.com (Supabase module → Run a function):
--   Function: mark_reminder_sent
--   Args: { "p_reminder_type": "7day", "p_appointment_id": "uuid-here" }
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_reminder_sent(
  p_reminder_type TEXT,   -- '7day', '3day', '1day', '3hour'
  p_appointment_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_reminder_type = '7day' THEN
    UPDATE appointments SET reminder_7day_sent_at = NOW() WHERE id = p_appointment_id;
  ELSIF p_reminder_type = '3day' THEN
    UPDATE appointments SET reminder_3day_sent_at = NOW() WHERE id = p_appointment_id;
  ELSIF p_reminder_type = '1day' THEN
    UPDATE appointments SET reminder_1day_sent_at = NOW() WHERE id = p_appointment_id;
  ELSIF p_reminder_type = '3hour' THEN
    UPDATE appointments SET reminder_3hour_sent_at = NOW() WHERE id = p_appointment_id;
  END IF;
END;
$$;
