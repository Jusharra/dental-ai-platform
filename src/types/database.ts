export type Practice = {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  phone: string | null
  email: string | null
  website: string | null
  tax_id: string | null
  subscription_tier: 'starter' | 'professional' | 'enterprise' | null
  subscription_status: 'trial' | 'active' | 'cancelled' | 'suspended'
  subscription_starts_at: string | null
  subscription_ends_at: string | null
  timezone: string
  business_hours: Record<string, { open: string; close: string }> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type UserRole = 'super_admin' | 'practice_owner' | 'manager' | 'staff'

export type User = {
  id: string
  practice_id: string | null
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  avatar_url: string | null
  job_title: string | null
  license_number: string | null
  license_state: string | null
  license_expiration: string | null
  dea_number: string | null
  npi_number: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export type PatientStatus = 'active' | 'inactive' | 'archived'

export type Patient = {
  id: string
  practice_id: string
  external_id: string | null
  patient_name: string
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  phone: string
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  insurance_provider: string | null
  insurance_id: string | null
  insurance_group: string | null
  subscriber_name: string | null
  subscriber_dob: string | null
  subscriber_relationship: 'self' | 'spouse' | 'child' | 'other' | null
  medical_conditions: string | null  // stored as encrypted text; decrypt with decryptJson<string[]>()
  allergies: string | null            // stored as encrypted text; decrypt with decryptJson<string[]>()
  medications: string | null          // stored as encrypted text; decrypt with decryptJson<string[]>()
  preferred_contact_method: 'phone' | 'email' | 'sms'
  can_receive_sms: boolean
  can_receive_email: boolean
  can_leave_voicemail: boolean
  consented_to_ai_calls: boolean
  ai_consent_date: string | null
  status: PatientStatus
  last_visit_date: string | null
  last_contact_date: string | null
  recall_due_date: string | null
  recall_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type InsuranceVerificationStatus = 'pending_patient' | 'pending_staff' | 'verified' | 'expired'

export type CdtCoverage = {
  pct: number | null
  freq: string | null
  wait?: string | null
}

export type CoveragBreakdown = Record<string, CdtCoverage>

export type InsuranceVerification = {
  id: string
  practice_id: string
  patient_id: string
  token: string
  token_expires_at: string
  status: InsuranceVerificationStatus
  sent_to_email: string | null
  sent_at: string | null
  // Patient-supplied
  p_subscriber_name: string | null
  p_subscriber_dob: string | null
  p_subscriber_relationship: string | null
  p_insurance_carrier: string | null
  p_member_id: string | null
  p_group_number: string | null
  p_card_front_url: string | null
  p_card_back_url: string | null
  patient_submitted_at: string | null
  // Staff verification — policy
  plan_name: string | null
  network_type: 'in_network' | 'out_of_network' | 'unknown' | null
  fee_schedule: string | null
  effective_date: string | null
  termination_date: string | null
  // Maximums & deductibles
  annual_maximum: number | null
  individual_deductible: number | null
  family_deductible: number | null
  individual_deductible_met: number | null
  family_deductible_met: number | null
  ortho_lifetime_max: number | null
  // Flags
  missing_tooth_clause: boolean
  aob_accepted: boolean
  // CDT coverage JSONB
  coverage_breakdown: CoveragBreakdown | null
  // Staff meta
  verified_by_user_id: string | null
  verified_date: string | null
  spoke_to: string | null
  reference_number: string | null
  verification_notes: string | null
  staff_verified_at: string | null
  created_at: string
  updated_at: string
  patient?: Patient
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type ConfirmationStatus = 'pending' | 'confirmed' | 'declined' | 'no_response'

export type Appointment = {
  id: string
  practice_id: string
  patient_id: string
  external_id: string | null
  provider_name: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  procedure_type: string | null
  procedure_reason: string | null
  procedure_notes: string | null
  status: AppointmentStatus
  confirmation_status: ConfirmationStatus
  confirmation_date: string | null
  confirmation_method: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
  patient?: Patient
}

export type CallType = 'inbound' | 'recall' | 'confirmation_7day' | 'confirmation_3day' | 'confirmation_1day' | 'reminder_3hour'

export type CallOutcome =
  | 'appointment_booked'
  | 'appointment_confirmed'
  | 'appointment_declined'
  | 'appointment_rescheduled'
  | 'no_answer'
  | 'voicemail'
  | 'wrong_number'
  | 'callback_requested'
  | 'other'

export type CallLog = {
  id: string
  practice_id: string
  patient_id: string | null
  appointment_id: string | null
  retell_call_id: string | null
  call_type: CallType
  phone_number: string
  call_date: string
  call_time: string
  call_duration_seconds: number | null
  call_outcome: CallOutcome | null
  transcript: string | null
  summary: string | null
  recording_url: string | null
  agent_type: string | null
  agent_id: string | null
  created_at: string
  patient?: Patient
}

export type RecallCampaign = {
  id: string
  practice_id: string
  campaign_name: string
  campaign_type: '6month_cleaning' | 'annual_checkup' | 'followup' | 'custom'
  target_recall_months: number
  status: 'draft' | 'active' | 'paused' | 'completed'
  total_patients: number
  contacted_count: number
  appointments_booked: number
  success_rate: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type CompliancePolicy = {
  id: string
  practice_id: string
  policy_type: string
  title: string
  content: string
  version: string
  effective_date: string
  review_date: string | null
  next_review_date: string | null
  status: 'draft' | 'active' | 'archived'
  document_url: string | null
  requires_staff_acknowledgment: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type BusinessAssociateAgreement = {
  id: string
  practice_id: string
  vendor_name: string
  vendor_contact_name: string | null
  vendor_email: string | null
  vendor_phone: string | null
  service_description: string
  service_category: string | null
  execution_date: string
  expiration_date: string | null
  auto_renews: boolean
  status: 'active' | 'expired' | 'terminated' | 'pending_renewal'
  baa_document_url: string | null
  renewal_reminder_sent: boolean
  reminder_sent_date: string | null
  created_at: string
  updated_at: string
}

export type TrainingRecord = {
  id: string
  practice_id: string
  user_id: string
  training_type: string
  training_name: string
  training_date: string
  hours: number | null
  instructor_name: string | null
  training_provider: string | null
  expiration_date: string | null
  status: 'completed' | 'expired' | 'pending_renewal'
  certificate_url: string | null
  created_at: string
  updated_at: string
  user?: User
}

export type LicenseCredential = {
  id: string
  practice_id: string
  user_id: string
  credential_type: string
  credential_name: string
  credential_number: string | null
  issuing_authority: string | null
  issuing_state: string | null
  issue_date: string | null
  expiration_date: string | null
  status: 'active' | 'expired' | 'pending_renewal' | 'suspended'
  document_url: string | null
  renewal_reminder_sent: boolean
  created_at: string
  updated_at: string
  user?: User
}

export type AuditLog = {
  id: string
  practice_id: string | null
  user_id: string | null
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'failed_login'
  resource_type: string
  resource_id: string | null
  changes: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}
