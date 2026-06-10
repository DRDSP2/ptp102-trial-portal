-- ============================================================================
-- PTP-102 FDA CVM Compliance Framework Migration
-- ============================================================================
-- Tables: study_settings, investigator_qualifications, informed_consents,
--         protocol_versions, adverse_events, site_qualifications,
--         monitoring_visits, audit_logs, fda_correspondence,
--         protocol_deviations, communication_messages, enrollment_eligibility
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. STUDY SETTINGS (INAD number, protocol version, FDA correspondence tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE study_settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  inad_file_number TEXT,
  protocol_version TEXT NOT NULL DEFAULT '1.0',
  protocol_effective_date DATE,
  last_fda_correspondence_date DATE,
  study_title TEXT DEFAULT 'PTP-102 Laminitis Pilot Study',
  sponsor_name TEXT DEFAULT 'Byrock Technologies Ltd.',
  sponsor_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO study_settings (inad_file_number, protocol_version, protocol_effective_date, study_title)
VALUES ('INAD-PTP102-2025', '1.0', CURRENT_DATE, 'PTP-102 Laminitis Pilot Study');

-- ----------------------------------------------------------------------------
-- 2. INVESTIGATOR QUALIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE investigator_qualifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  veterinarian_id BIGINT NOT NULL REFERENCES veterinarians(id) ON DELETE CASCADE,
  -- Step 1: CV / Credentials
  license_number TEXT,
  license_state TEXT,
  years_experience INT,
  laminitis_case_volume_per_year INT,
  prior_clinical_trial_experience BOOLEAN DEFAULT false,
  prior_trials_count INT DEFAULT 0,
  cv_upload_url TEXT,
  -- Step 2: GCP Training
  gcp_training_completed BOOLEAN DEFAULT false,
  gcp_certificate_url TEXT,
  gcp_completion_date DATE,
  gcp_expiry_date DATE,
  gcp_quiz_score NUMERIC(5,2),
  -- Step 3: Facility Inspection
  facility_inspection_completed BOOLEAN DEFAULT false,
  facility_inspection_date DATE,
  drug_storage_photo_url TEXT,
  emergency_equipment_photo_url TEXT,
  records_area_photo_url TEXT,
  facility_checklist JSONB,
  -- Step 4 & 5: Agreements
  investigator_agreement_signed BOOLEAN DEFAULT false,
  investigator_agreement_signed_at TIMESTAMPTZ,
  investigator_agreement_signature TEXT,
  protocol_signed BOOLEAN DEFAULT false,
  protocol_signed_at TIMESTAMPTZ,
  protocol_signed_version TEXT,
  protocol_signature TEXT,
  -- Admin workflow
  qualification_status TEXT NOT NULL DEFAULT 'pending_submission'
    CHECK (qualification_status IN ('pending_submission', 'pending_review', 'approved', 'rejected', 'expired')),
  admin_reviewed_at TIMESTAMPTZ,
  admin_reviewed_by TEXT,
  admin_rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_qual_vet_id ON investigator_qualifications(veterinarian_id);
CREATE INDEX idx_inv_qual_status ON investigator_qualifications(qualification_status);

-- ----------------------------------------------------------------------------
-- 3. INFORMED CONSENTS (Owner ICF)
-- ----------------------------------------------------------------------------
CREATE TABLE informed_consents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  -- Owner Information
  owner_name TEXT NOT NULL,
  owner_address TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  owner_relationship TEXT DEFAULT 'owner',
  -- Horse Information (snapshot at time of consent)
  horse_name TEXT,
  horse_breed TEXT,
  horse_age INT,
  horse_weight NUMERIC(6,2),
  horse_microchip TEXT,
  -- Consent Status
  icf_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (icf_status IN ('pending', 'viewed', 'cooling_off', 'signed', 'withdrawn')),
  icf_viewed_at TIMESTAMPTZ,
  icf_can_sign_after TIMESTAMPTZ,
  icf_signed_at TIMESTAMPTZ,
  -- Signatures
  owner_signature TEXT,
  witness_name TEXT,
  witness_signature TEXT,
  investigator_signature TEXT,
  investigator_signed_at TIMESTAMPTZ,
  -- Section Acknowledgments (stored as JSONB)
  section_acknowledgments JSONB DEFAULT '{}',
  -- Document
  icf_pdf_url TEXT,
  -- Withdrawal
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_informed_consents_patient ON informed_consents(patient_id);
CREATE INDEX idx_informed_consents_status ON informed_consents(icf_status);

-- ----------------------------------------------------------------------------
-- 4. PROTOCOL VERSIONS
-- ----------------------------------------------------------------------------
CREATE TABLE protocol_versions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  version_number TEXT NOT NULL UNIQUE,
  effective_date DATE NOT NULL,
  description TEXT,
  pdf_url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_current BOOLEAN DEFAULT false,
  previous_version TEXT,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_protocol_versions_current ON protocol_versions(is_current);

-- Insert initial protocol version
INSERT INTO protocol_versions (version_number, effective_date, description, pdf_url, uploaded_by, is_current)
VALUES ('1.0', CURRENT_DATE, 'Initial PTP-102 Laminitis Pilot Study Protocol', '/protocols/PTP102-Protocol-v1.0.pdf', 'system', true);

-- ----------------------------------------------------------------------------
-- 5. ADVERSE EVENTS
-- ----------------------------------------------------------------------------
CREATE TABLE adverse_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  veterinarian_id BIGINT REFERENCES veterinarians(id),
  reporter_name TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  -- Event Details
  event_description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Mild', 'Moderate', 'Severe', 'Life-Threatening', 'Fatal')),
  causality TEXT NOT NULL CHECK (causality IN ('Unrelated', 'Unlikely', 'Possible', 'Probable', 'Definite')),
  start_date TIMESTAMPTZ NOT NULL,
  is_ongoing BOOLEAN DEFAULT true,
  resolved_date TIMESTAMPTZ,
  -- Actions & Outcome
  action_taken TEXT NOT NULL CHECK (action_taken IN ('None', 'Dose_Reduced', 'Dose_Withheld', 'Drug_Discontinued', 'Additional_Treatment')),
  outcome TEXT CHECK (outcome IN ('Recovered', 'Recovering', 'Not_Recovered', 'Fatal', 'Unknown')),
  -- Reporting
  admin_notified BOOLEAN DEFAULT false,
  admin_notified_at TIMESTAMPTZ,
  sponsor_notified BOOLEAN DEFAULT false,
  sponsor_notified_at TIMESTAMPTZ,
  -- Digital signature
  vet_assessment TEXT,
  digital_signature TEXT,
  signed_at TIMESTAMPTZ,
  -- FDA fields
  expected BOOLEAN DEFAULT false,
  serious BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ae_patient ON adverse_events(patient_id);
CREATE INDEX idx_ae_severity ON adverse_events(severity);
CREATE INDEX idx_ae_created ON adverse_events(created_at);
CREATE INDEX idx_ae_serious ON adverse_events(serious);

-- ----------------------------------------------------------------------------
-- 6. SITE QUALIFICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE site_qualifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_name TEXT NOT NULL,
  site_address TEXT,
  iacuc_approval_number TEXT,
  principal_investigator_name TEXT,
  principal_investigator_email TEXT,
  principal_investigator_credentials TEXT,
  -- Capabilities
  has_emergency_equipment BOOLEAN DEFAULT false,
  has_drug_storage_refrigeration BOOLEAN DEFAULT false,
  has_drug_storage_security BOOLEAN DEFAULT false,
  has_radiography BOOLEAN DEFAULT false,
  has_laboratory BOOLEAN DEFAULT false,
  has_24h_emergency_coverage BOOLEAN DEFAULT false,
  -- Experience
  prior_trial_experience_count INT DEFAULT 0,
  prior_therapeutic_areas TEXT,
  -- GCP Training
  gcp_training_records JSONB DEFAULT '[]',
  -- Status
  site_status TEXT NOT NULL DEFAULT 'pending_qualification'
    CHECK (site_status IN ('pending_qualification', 'qualified', 'activated', 'closed')),
  qualified_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_site_status ON site_qualifications(site_status);

-- ----------------------------------------------------------------------------
-- 7. MONITORING VISITS
-- ----------------------------------------------------------------------------
CREATE TABLE monitoring_visits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  site_id BIGINT NOT NULL REFERENCES site_qualifications(id) ON DELETE CASCADE,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('Pre-Study', 'Periodic', 'For-Cause', 'Close-Out')),
  visit_date DATE NOT NULL,
  monitor_name TEXT NOT NULL,
  monitor_email TEXT,
  findings TEXT,
  deviations_found INT DEFAULT 0,
  corrective_actions TEXT,
  capa_items JSONB DEFAULT '[]',
  next_visit_due DATE,
  report_url TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_monitoring_site ON monitoring_visits(site_id);
CREATE INDEX idx_monitoring_date ON monitoring_visits(visit_date);
CREATE INDEX idx_monitoring_next_due ON monitoring_visits(next_visit_due);

-- ----------------------------------------------------------------------------
-- 8. AUDIT LOGS (21 CFR Part 11 readiness)
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id BIGINT,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  reason_for_change TEXT,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_email);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ----------------------------------------------------------------------------
-- 9. FDA CORRESPONDENCE
-- ----------------------------------------------------------------------------
CREATE TABLE fda_correspondence (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  correspondence_type TEXT NOT NULL CHECK (correspondence_type IN ('Submission', 'Letter', 'Email', 'Phone_Call', 'Meeting_Minutes')),
  correspondence_date DATE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  from_entity TEXT NOT NULL,
  to_entity TEXT NOT NULL,
  related_protocol_version TEXT,
  document_url TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fda_date ON fda_correspondence(correspondence_date);
CREATE INDEX idx_fda_type ON fda_correspondence(correspondence_type);

-- ----------------------------------------------------------------------------
-- 10. PROTOCOL DEVIATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE protocol_deviations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  veterinarian_id BIGINT REFERENCES veterinarians(id),
  deviation_type TEXT NOT NULL,
  deviation_date DATE NOT NULL,
  description TEXT NOT NULL,
  explanation TEXT,
  impact_assessment TEXT NOT NULL CHECK (impact_assessment IN ('Minor', 'Major', 'Critical')),
  corrective_action TEXT,
  preventive_action TEXT,
  admin_notified BOOLEAN DEFAULT false,
  admin_reviewed_at TIMESTAMPTZ,
  admin_reviewed_by TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deviation_patient ON protocol_deviations(patient_id);
CREATE INDEX idx_deviation_impact ON protocol_deviations(impact_assessment);
CREATE INDEX idx_deviation_status ON protocol_deviations(status);

-- ----------------------------------------------------------------------------
-- 11. COMMUNICATION MESSAGES
-- ----------------------------------------------------------------------------
CREATE TABLE communication_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender_email TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  recipient_emails TEXT[] NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  message_classification TEXT NOT NULL CHECK (message_classification IN ('General', 'Protocol_Question', 'Adverse_Event', 'Urgent', 'FDA_Correspondence')),
  compliance_warning_triggered BOOLEAN DEFAULT false,
  parent_message_id BIGINT REFERENCES communication_messages(id),
  read_by TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comm_sender ON communication_messages(sender_email);
CREATE INDEX idx_comm_classification ON communication_messages(message_classification);
CREATE INDEX idx_comm_created ON communication_messages(created_at);

-- ----------------------------------------------------------------------------
-- 12. ENROLLMENT ELIGIBILITY (enhanced screening)
-- ----------------------------------------------------------------------------
CREATE TABLE enrollment_eligibility (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  -- Inclusion criteria (all must be Yes)
  inclusion_diagnosed_acute_laminitis BOOLEAN,
  inclusion_obel_grade_1_to_3 BOOLEAN,
  inclusion_age_2_to_20 BOOLEAN,
  inclusion_weight_over_200kg BOOLEAN,
  inclusion_owner_consent BOOLEAN,
  inclusion_no_prior_investigational_drug_30d BOOLEAN,
  -- Exclusion criteria (all must be No)
  exclusion_chronic_laminitis_over_14d BOOLEAN,
  exclusion_pregnant_or_lactating BOOLEAN,
  exclusion_concurrent_systemic_disease BOOLEAN,
  exclusion_prior_investigational_drug_30d BOOLEAN,
  exclusion_owner_declined_consent BOOLEAN,
  -- System enforcement
  eligibility_determination TEXT CHECK (eligibility_determination IN ('eligible', 'ineligible', 'requires_deviation')),
  ineligible_reason TEXT,
  deviation_justification TEXT,
  screened_by TEXT,
  screened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eligibility_patient ON enrollment_eligibility(patient_id);
CREATE INDEX idx_eligibility_determination ON enrollment_eligibility(eligibility_determination);

-- ----------------------------------------------------------------------------
-- 13. TREATMENT OUTCOMES (structured outcome tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE treatment_outcomes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assessment_day INT NOT NULL,
  assessment_date DATE NOT NULL,
  protocol_hour INT,
  -- Objective scales only
  obel_grade INT CHECK (obel_grade BETWEEN 0 AND 5),
  digital_pulse_score INT CHECK (digital_pulse_score BETWEEN 0 AND 4),
  hoof_temperature TEXT,
  pain_score INT CHECK (pain_score BETWEEN 0 AND 10),
  mobility_score INT CHECK (mobility_score BETWEEN 0 AND 10),
  heart_rate INT,
  respiratory_rate INT,
  temperature NUMERIC(4,1),
  body_weight NUMERIC(6,2),
  appetite_score INT CHECK (appetite_score BETWEEN 0 AND 5),
  -- Radiographic
  radiograph_url TEXT,
  radiograph_findings TEXT,
  keenan_angle NUMERIC(5,2),
  -- Gait video
  gait_video_url TEXT,
  -- No free-text assessment allowed - enforced in UI
  veterinarian_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outcomes_patient ON treatment_outcomes(patient_id);
CREATE INDEX idx_outcomes_day ON treatment_outcomes(assessment_day);

-- ----------------------------------------------------------------------------
-- 14. ENHANCE EXISTING PATIENTS TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS randomized_group TEXT CHECK (randomized_group IN ('treatment', 'placebo', 'control')),
ADD COLUMN IF NOT EXISTS randomization_date DATE,
ADD COLUMN IF NOT EXISTS site_id BIGINT REFERENCES site_qualifications(id),
ADD COLUMN IF NOT EXISTS enrolled_by_veterinarian_id BIGINT REFERENCES veterinarians(id),
ADD COLUMN IF NOT EXISTS enrollment_icf_id BIGINT REFERENCES informed_consents(id),
ADD COLUMN IF NOT EXISTS data_lock_status TEXT DEFAULT 'open' CHECK (data_lock_status IN ('open', 'locked', 'frozen'));

-- ----------------------------------------------------------------------------
-- 15. NCIE SHIPMENT LOG
-- ----------------------------------------------------------------------------
CREATE TABLE ncie_shipment_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shipment_date DATE NOT NULL,
  quantity_vials INT NOT NULL,
  quantity_ml_total NUMERIC(10,2),
  batch_lot_number TEXT NOT NULL,
  expiration_date DATE,
  shipped_to_site_id BIGINT REFERENCES site_qualifications(id),
  shipped_to_investigator TEXT,
  receiving_signature TEXT,
  received_at TIMESTAMPTZ,
  condition_on_receipt TEXT,
  storage_temperature_celsius NUMERIC(4,1),
  tracking_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ncie_batch ON ncie_shipment_log(batch_lot_number);
CREATE INDEX idx_ncie_site ON ncie_shipment_log(shipped_to_site_id);

-- Update applied migrations
