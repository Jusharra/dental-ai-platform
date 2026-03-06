-- ============================================================================
-- DENTAL AI PLATFORM - SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0
-- Date: February 27, 2026
-- Description: Complete database schema for dental AI automation + compliance
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Studio → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. Verify all tables created successfully
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Practices Table (Multi-tenant root)
CREATE TABLE practices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    tax_id TEXT,
    
    -- Subscription
    subscription_tier TEXT CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    subscription_status TEXT CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'suspended')) DEFAULT 'trial',
    subscription_starts_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    
    -- Settings
    timezone TEXT DEFAULT 'America/New_York',
    business_hours JSONB, -- { "monday": { "open": "09:00", "close": "17:00" }, ... }
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Users Table (Staff accounts - linked to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    
    -- Role-based access
    role TEXT CHECK (role IN ('super_admin', 'practice_owner', 'manager', 'staff')) NOT NULL,
    
    -- Profile
    avatar_url TEXT,
    job_title TEXT,
    
    -- Credentials (for compliance tracking)
    license_number TEXT,
    license_state TEXT,
    license_expiration DATE,
    dea_number TEXT,
    npi_number TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    
    -- External IDs (from PMS systems)
    external_id TEXT, -- ID from Dentrix, Open Dental, etc.

    -- Demographics
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    
    -- Contact
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    
    -- Insurance
    insurance_provider TEXT,
    insurance_id TEXT,
    insurance_group TEXT,
    
    -- Medical Information (encrypted in production)
    medical_conditions JSONB, -- ["diabetes", "hypertension"]
    allergies JSONB, -- ["penicillin", "latex"]
    medications JSONB, -- ["metformin", "lisinopril"]
    
    -- Communication Preferences
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('phone', 'email', 'sms')) DEFAULT 'phone',
    can_receive_sms BOOLEAN DEFAULT true,
    can_receive_email BOOLEAN DEFAULT true,
    can_leave_voicemail BOOLEAN DEFAULT true,
    
    -- AI Consent
    consented_to_ai_calls BOOLEAN DEFAULT false,
    ai_consent_date TIMESTAMPTZ,
    
    -- Status
    status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    last_visit_date DATE,
    last_contact_date DATE,
    
    -- Recall
    recall_due_date DATE,
    recall_reason TEXT,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    
    -- External ID
    external_id TEXT,

    -- Appointment Details
    provider_name TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    
    -- Procedure
    procedure_type TEXT, -- "cleaning", "filling", "crown", etc.
    procedure_reason TEXT,
    procedure_notes TEXT,
    
    -- Status
    status TEXT CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    
    -- Confirmation
    confirmation_status TEXT CHECK (confirmation_status IN ('pending', 'confirmed', 'declined', 'no_response')) DEFAULT 'pending',
    confirmation_date TIMESTAMPTZ,
    confirmation_method TEXT, -- "phone", "email", "sms"
    
    -- Cancellation
    cancelled_at TIMESTAMPTZ,
    cancelled_by TEXT,
    cancellation_reason TEXT,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI AUTOMATION TABLES
-- ============================================================================

-- Call Logs (All AI voice interactions)
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    
    -- Retell AI Details
    retell_call_id TEXT UNIQUE,
    
    -- Call Info
    call_type TEXT CHECK (call_type IN ('inbound', 'recall', 'confirmation_7day', 'confirmation_3day', 'confirmation_1day', 'reminder_3hour')) NOT NULL,
    phone_number TEXT NOT NULL,
    
    -- Timing
    call_date DATE NOT NULL,
    call_time TIME NOT NULL,
    call_duration_seconds INTEGER,
    
    -- Outcome
    call_outcome TEXT CHECK (call_outcome IN (
        'appointment_booked',
        'appointment_confirmed',
        'appointment_declined',
        'appointment_rescheduled',
        'no_answer',
        'voicemail',
        'wrong_number',
        'callback_requested',
        'other'
    )),
    
    -- Content
    transcript TEXT,
    summary TEXT,
    recording_url TEXT,
    
    -- Agent Used
    agent_type TEXT, -- "inbound_receptionist", "recall_agent", "confirmation_agent"
    agent_id TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recall Campaigns
CREATE TABLE recall_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    
    -- Campaign Details
    campaign_name TEXT NOT NULL,
    campaign_type TEXT CHECK (campaign_type IN ('6month_cleaning', 'annual_checkup', 'followup', 'custom')) DEFAULT '6month_cleaning',
    
    -- Targeting
    target_recall_months INTEGER DEFAULT 6, -- Recall patients due for X months
    
    -- Status
    status TEXT CHECK (status IN ('draft', 'active', 'paused', 'completed')) DEFAULT 'draft',
    
    -- Stats
    total_patients INTEGER DEFAULT 0,
    contacted_count INTEGER DEFAULT 0,
    appointments_booked INTEGER DEFAULT 0,
    success_rate DECIMAL,
    
    -- Scheduling
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recall Campaign Patients (many-to-many)
CREATE TABLE recall_campaign_patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES recall_campaigns(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
    
    -- Status
    contact_status TEXT CHECK (contact_status IN ('pending', 'contacted', 'booked', 'declined', 'no_response')) DEFAULT 'pending',
    last_contact_attempt TIMESTAMPTZ,
    contact_attempts INTEGER DEFAULT 0,
    
    -- Result
    booked_appointment_id UUID REFERENCES appointments(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(campaign_id, patient_id)
);

-- ============================================================================
-- COMPLIANCE TABLES
-- ============================================================================

-- Compliance Policies (HIPAA, OSHA, etc.)
CREATE TABLE compliance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    
    -- Policy Details
    policy_type TEXT CHECK (policy_type IN (
        'hipaa_privacy',
        'hipaa_security',
        'hipaa_breach_notification',
        'osha_bloodborne_pathogens',
        'osha_hazard_communication',
        'infection_control',
        'emergency_response',
        'custom'
    )) NOT NULL,
    
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Full policy text
    version TEXT NOT NULL,
    
    -- Dates
    effective_date DATE NOT NULL,
    review_date DATE,
    next_review_date DATE,
    
    -- Status
    status TEXT CHECK (status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
    
    -- Document
    document_url TEXT, -- PDF stored in Supabase Storage
    
    -- Acknowledgments
    requires_staff_acknowledgment BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy Acknowledgments (staff sign-off)
CREATE TABLE policy_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID REFERENCES compliance_policies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    
    UNIQUE(policy_id, user_id)
);

-- Risk Assessments (HIPAA Security Risk Analysis)
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    
    assessment_type TEXT CHECK (assessment_type IN ('hipaa_security', 'osha_safety', 'general_risk')) NOT NULL,
    assessment_date DATE NOT NULL,
    
    -- Scoring
    overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Findings
    findings JSONB, -- { "area": "access_control", "risk": "high", "description": "..." }
    
    -- Remediation
    remediation_plan JSONB,
    remediation_status TEXT CHECK (remediation_status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    
    -- Status
    status TEXT CHECK (status IN ('in_progress', 'completed', 'approved')) DEFAULT 'in_progress',
    
    -- Document
    report_url TEXT,
    
    -- Metadata
    completed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Associate Agreements
CREATE TABLE business_associate_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    
    -- Vendor Info
    vendor_name TEXT NOT NULL,
    vendor_contact_name TEXT,
    vendor_email TEXT,
    vendor_phone TEXT,
    
    -- Service
    service_description TEXT NOT NULL,
    service_category TEXT, -- "EHR", "Billing", "Cloud Storage", "AI Platform", etc.
    
    -- Agreement
    execution_date DATE NOT NULL,
    expiration_date DATE,
    auto_renews BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT CHECK (status IN ('active', 'expired', 'terminated', 'pending_renewal')) DEFAULT 'active',
    
    -- Documents
    baa_document_url TEXT,
    
    -- Reminders
    renewal_reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_date DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Records
CREATE TABLE training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Training Details
    training_type TEXT CHECK (training_type IN (
        'hipaa_annual',
        'osha_bloodborne_pathogens',
        'osha_hazard_communication',
        'cpr_bls',
        'acls',
        'fire_safety',
        'infection_control',
        'radiology_safety',
        'custom'
    )) NOT NULL,
    
    training_name TEXT NOT NULL,
    training_date DATE NOT NULL,
    
    -- Duration
    hours DECIMAL,
    
    -- Instructor
    instructor_name TEXT,
    training_provider TEXT,
    
    -- Expiration (if applicable)
    expiration_date DATE,
    
    -- Status
    status TEXT CHECK (status IN ('completed', 'expired', 'pending_renewal')) DEFAULT 'completed',
    
    -- Certificate
    certificate_url TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Licenses & Credentials
CREATE TABLE licenses_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    
    -- Credential Details
    credential_type TEXT CHECK (credential_type IN (
        'dental_license',
        'hygienist_license',
        'dea_registration',
        'npi_number',
        'cpr_certification',
        'acls_certification',
        'radiology_certification',
        'specialty_board_certification',
        'malpractice_insurance',
        'custom'
    )) NOT NULL,
    
    credential_name TEXT NOT NULL,
    credential_number TEXT,
    
    -- Issuing Authority
    issuing_authority TEXT,
    issuing_state TEXT,
    
    -- Dates
    issue_date DATE,
    expiration_date DATE,
    
    -- Status
    status TEXT CHECK (status IN ('active', 'expired', 'pending_renewal', 'suspended')) DEFAULT 'active',
    
    -- Document
    document_url TEXT,
    
    -- Reminders
    renewal_reminder_sent BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sterilization Logs (Infection Control)
CREATE TABLE sterilization_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    
    -- Test Details
    test_date DATE NOT NULL,
    test_time TIME,
    
    -- Equipment
    equipment_id TEXT, -- "Autoclave 1", "Autoclave 2"
    equipment_type TEXT, -- "steam_autoclave", "dry_heat", "chemical"
    
    -- Test Type
    test_type TEXT CHECK (test_type IN ('biological_indicator', 'chemical_indicator', 'mechanical_indicator')) NOT NULL,
    
    -- Result
    result TEXT CHECK (result IN ('pass', 'fail')) NOT NULL,
    
    -- Details
    batch_number TEXT,
    load_number TEXT,
    
    -- Personnel
    technician_name TEXT NOT NULL,
    technician_id UUID REFERENCES users(id),
    
    -- Corrective Action (if failed)
    corrective_action TEXT,
    retest_date DATE,
    retest_result TEXT CHECK (retest_result IN ('pass', 'fail')),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident Logs (HIPAA breaches, OSHA exposures, patient safety)
CREATE TABLE incident_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE NOT NULL,
    
    -- Incident Details
    incident_type TEXT CHECK (incident_type IN (
        'hipaa_breach',
        'osha_sharps_injury',
        'osha_exposure',
        'patient_safety',
        'equipment_failure',
        'medication_error',
        'other'
    )) NOT NULL,
    
    incident_date DATE NOT NULL,
    incident_time TIME,
    
    -- Description
    description TEXT NOT NULL,
    
    -- Severity
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    
    -- Affected Parties
    affected_individuals_count INTEGER,
    affected_user_id UUID REFERENCES users(id),
    affected_patient_id UUID REFERENCES patients(id),
    
    -- Regulatory Reporting
    reported_to_regulator BOOLEAN DEFAULT false,
    regulator_name TEXT, -- "OCR", "OSHA", "State Board"
    report_date DATE,
    report_number TEXT,
    
    -- Investigation
    investigation_status TEXT CHECK (investigation_status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    investigation_findings TEXT,
    
    -- Remediation
    remediation_plan TEXT,
    remediation_status TEXT CHECK (remediation_status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    remediation_completed_date DATE,
    
    -- Status
    status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
    
    -- Metadata
    reported_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDIT LOG TABLE (CRITICAL FOR HIPAA)
-- ============================================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Action
    action TEXT CHECK (action IN ('create', 'read', 'update', 'delete', 'export', 'login', 'logout', 'failed_login')) NOT NULL,
    
    -- Resource
    resource_type TEXT NOT NULL, -- "patient", "appointment", "policy", etc.
    resource_id UUID,
    
    -- Changes (for update actions)
    changes JSONB, -- { "before": {...}, "after": {...} }
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX idx_audit_logs_practice ON audit_logs(practice_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Practices
CREATE INDEX idx_practices_subscription ON practices(subscription_status);

-- Users
CREATE INDEX idx_users_practice ON users(practice_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Patients
CREATE INDEX idx_patients_practice ON patients(practice_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_patients_recall_due ON patients(recall_due_date) WHERE status = 'active';
CREATE INDEX idx_patients_search ON patients USING gin(to_tsvector('english', first_name || ' ' || last_name));

-- Appointments
CREATE INDEX idx_appointments_practice ON appointments(practice_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Call Logs
CREATE INDEX idx_call_logs_practice ON call_logs(practice_id);
CREATE INDEX idx_call_logs_patient ON call_logs(patient_id);
CREATE INDEX idx_call_logs_date ON call_logs(call_date);
CREATE INDEX idx_call_logs_type ON call_logs(call_type);

-- Compliance
CREATE INDEX idx_policies_practice ON compliance_policies(practice_id);
CREATE INDEX idx_baas_practice ON business_associate_agreements(practice_id);
CREATE INDEX idx_baas_expiration ON business_associate_agreements(expiration_date) WHERE status = 'active';
CREATE INDEX idx_training_practice ON training_records(practice_id);
CREATE INDEX idx_training_user ON training_records(user_id);
CREATE INDEX idx_licenses_practice ON licenses_credentials(practice_id);
CREATE INDEX idx_licenses_user ON licenses_credentials(user_id);
CREATE INDEX idx_licenses_expiration ON licenses_credentials(expiration_date) WHERE status = 'active';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recall_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recall_campaign_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_associate_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sterilization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's practice_id from JWT
CREATE OR REPLACE FUNCTION auth.user_practice_id()
RETURNS UUID AS $$
  SELECT practice_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'super_admin' FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE;

-- Practices: Users can only see their own practice
CREATE POLICY "Users can view their practice"
  ON practices FOR SELECT
  USING (id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice owners can update their practice"
  ON practices FOR UPDATE
  USING (id = auth.user_practice_id() AND (
    SELECT role IN ('practice_owner', 'super_admin') FROM users WHERE id = auth.uid()
  ));

-- Users: Can view users in their practice
CREATE POLICY "Users can view practice users"
  ON users FOR SELECT
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

-- Patients: Users can only access their practice patients
CREATE POLICY "Users can access practice patients"
  ON patients FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

-- Appointments: Same as patients
CREATE POLICY "Users can access practice appointments"
  ON appointments FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

-- Apply similar policies to all other tables
-- (For brevity, using same pattern)

CREATE POLICY "Practice access only" ON call_logs FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice access only" ON recall_campaigns FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice access only" ON compliance_policies FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice access only" ON risk_assessments FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice access only" ON business_associate_agreements FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice access only" ON training_records FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice access only" ON licenses_credentials FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice access only" ON sterilization_logs FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice access only" ON incident_logs FOR ALL
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

CREATE POLICY "Practice access only" ON audit_logs FOR SELECT
  USING (practice_id = auth.user_practice_id() OR auth.is_super_admin());

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_practices_updated_at BEFORE UPDATE ON practices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON compliance_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON recall_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: Create user record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, role, practice_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    (NEW.raw_user_meta_data->>'practice_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- INITIAL SEED DATA (Optional - for testing)
-- ============================================================================

-- Insert demo practice
INSERT INTO practices (id, name, address, city, state, zip_code, phone, email, subscription_tier, subscription_status)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Smile Dental Group',
  '123 Main Street',
  'San Francisco',
  'CA',
  '94102',
  '+14155551234',
  'admin@smiledental.com',
  'professional',
  'active'
);

-- Note: Users will be created via Supabase Auth signup

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

-- 1. ✅ Schema created
-- 2. ⚠️ Test authentication flow (signup → user record created)
-- 3. ⚠️ Test RLS policies (users can only see their practice data)
-- 4. ⚠️ Import Airtable data
-- 5. ⚠️ Connect Make.com webhooks

-- ============================================================================
-- MAINTENANCE NOTES
-- ============================================================================

-- Backup: Supabase provides automated daily backups
-- Migrations: Future schema changes should be done via migrations
-- Monitoring: Check Supabase dashboard for query performance

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
