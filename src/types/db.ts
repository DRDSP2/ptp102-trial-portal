export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: number
          last_login: string | null
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: never
          last_login?: string | null
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: never
          last_login?: string | null
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      adverse_events: {
        Row: {
          action_taken: string
          admin_notified: boolean | null
          admin_notified_at: string | null
          causality: string
          created_at: string
          digital_signature: string | null
          event_description: string
          expected: boolean | null
          id: number
          is_ongoing: boolean | null
          outcome: string | null
          patient_id: number
          reporter_email: string
          reporter_name: string
          resolved_date: string | null
          serious: boolean | null
          severity: string
          signed_at: string | null
          sponsor_notified: boolean | null
          sponsor_notified_at: string | null
          start_date: string
          updated_at: string
          vet_assessment: string | null
          veterinarian_id: number | null
        }
        Insert: {
          action_taken: string
          admin_notified?: boolean | null
          admin_notified_at?: string | null
          causality: string
          created_at?: string
          digital_signature?: string | null
          event_description: string
          expected?: boolean | null
          id?: never
          is_ongoing?: boolean | null
          outcome?: string | null
          patient_id: number
          reporter_email: string
          reporter_name: string
          resolved_date?: string | null
          serious?: boolean | null
          severity: string
          signed_at?: string | null
          sponsor_notified?: boolean | null
          sponsor_notified_at?: string | null
          start_date: string
          updated_at?: string
          vet_assessment?: string | null
          veterinarian_id?: number | null
        }
        Update: {
          action_taken?: string
          admin_notified?: boolean | null
          admin_notified_at?: string | null
          causality?: string
          created_at?: string
          digital_signature?: string | null
          event_description?: string
          expected?: boolean | null
          id?: never
          is_ongoing?: boolean | null
          outcome?: string | null
          patient_id?: number
          reporter_email?: string
          reporter_name?: string
          resolved_date?: string | null
          serious?: boolean | null
          severity?: string
          signed_at?: string | null
          sponsor_notified?: boolean | null
          sponsor_notified_at?: string | null
          start_date?: string
          updated_at?: string
          vet_assessment?: string | null
          veterinarian_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "adverse_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adverse_events_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          client_hash: string | null
          entity_id: number | null
          entity_type: string
          field_name: string | null
          id: number
          ip_address: string | null
          new_value: string | null
          old_value: string | null
          patient_id: number | null
          previous_hash: string | null
          reason_for_change: string | null
          session_id: string | null
          sequence_number: number | null
          study_id: string | null
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          client_hash?: string | null
          entity_id?: number | null
          entity_type: string
          field_name?: string | null
          id?: never
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          patient_id?: number | null
          previous_hash?: string | null
          reason_for_change?: string | null
          session_id?: string | null
          sequence_number?: number | null
          study_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          client_hash?: string | null
          entity_id?: number | null
          entity_type?: string
          field_name?: string | null
          id?: never
          ip_address?: string | null
          new_value?: string | null
          old_value?: string | null
          patient_id?: number | null
          previous_hash?: string | null
          reason_for_change?: string | null
          session_id?: string | null
          sequence_number?: number | null
          study_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      clinical_assessments: {
        Row: {
          assessment_datetime: string
          clinical_notes: string | null
          created_at: string
          digital_pulse_score: number | null
          heart_rate: number | null
          hoof_temperature: string | null
          id: number
          mobility_score: number | null
          obel_grade: number | null
          pain_score: number | null
          patient_id: number
          protocol_hour: number | null
          respiratory_rate: number | null
          temperature: number | null
          updated_at: string
          veterinarian_name: string
        }
        Insert: {
          assessment_datetime: string
          clinical_notes?: string | null
          created_at?: string
          digital_pulse_score?: number | null
          heart_rate?: number | null
          hoof_temperature?: string | null
          id?: never
          mobility_score?: number | null
          obel_grade?: number | null
          pain_score?: number | null
          patient_id: number
          protocol_hour?: number | null
          respiratory_rate?: number | null
          temperature?: number | null
          updated_at?: string
          veterinarian_name: string
        }
        Update: {
          assessment_datetime?: string
          clinical_notes?: string | null
          created_at?: string
          digital_pulse_score?: number | null
          heart_rate?: number | null
          hoof_temperature?: string | null
          id?: never
          mobility_score?: number | null
          obel_grade?: number | null
          pain_score?: number | null
          patient_id?: number
          protocol_hour?: number | null
          respiratory_rate?: number | null
          temperature?: number | null
          updated_at?: string
          veterinarian_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_notes: {
        Row: {
          created_at: string
          id: number
          note_content: string
          note_type: string
          ocr_document_file_name: string | null
          ocr_document_mime_type: string | null
          ocr_document_url: string | null
          ocr_extracted_text: string | null
          ocr_processed_at: string | null
          patient_id: number
          protocol_hour: number | null
          updated_at: string
          veterinarian_name: string
          video_file_name: string | null
          video_uploaded_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          note_content: string
          note_type: string
          ocr_document_file_name?: string | null
          ocr_document_mime_type?: string | null
          ocr_document_url?: string | null
          ocr_extracted_text?: string | null
          ocr_processed_at?: string | null
          patient_id: number
          protocol_hour?: number | null
          updated_at?: string
          veterinarian_name: string
          video_file_name?: string | null
          video_uploaded_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          note_content?: string
          note_type?: string
          ocr_document_file_name?: string | null
          ocr_document_mime_type?: string | null
          ocr_document_url?: string | null
          ocr_extracted_text?: string | null
          ocr_processed_at?: string | null
          patient_id?: number
          protocol_hour?: number | null
          updated_at?: string
          veterinarian_name?: string
          video_file_name?: string | null
          video_uploaded_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_messages: {
        Row: {
          body: string
          compliance_warning_triggered: boolean | null
          created_at: string
          id: number
          message_classification: string
          parent_message_id: number | null
          read_by: string[] | null
          recipient_emails: string[]
          sender_email: string
          sender_role: string
          subject: string
        }
        Insert: {
          body: string
          compliance_warning_triggered?: boolean | null
          created_at?: string
          id?: never
          message_classification: string
          parent_message_id?: number | null
          read_by?: string[] | null
          recipient_emails: string[]
          sender_email: string
          sender_role: string
          subject: string
        }
        Update: {
          body?: string
          compliance_warning_triggered?: boolean | null
          created_at?: string
          id?: never
          message_classification?: string
          parent_message_id?: number | null
          read_by?: string[] | null
          recipient_emails?: string[]
          sender_email?: string
          sender_role?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "communication_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      electronic_signatures: {
        Row: {
          file_id: string | null
          id: string
          is_revoked: boolean | null
          signature_data: string
          signature_meaning: string
          signed_at: string | null
          signer_id: string
          verification_hash: string
        }
        Insert: {
          file_id?: string | null
          id?: string
          is_revoked?: boolean | null
          signature_data: string
          signature_meaning: string
          signed_at?: string | null
          signer_id: string
          verification_hash: string
        }
        Update: {
          file_id?: string | null
          id?: string
          is_revoked?: boolean | null
          signature_data?: string
          signature_meaning?: string
          signed_at?: string | null
          signer_id?: string
          verification_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "electronic_signatures_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_eligibility: {
        Row: {
          created_at: string
          deviation_justification: string | null
          eligibility_determination: string | null
          exclusion_chronic_laminitis_over_14d: boolean | null
          exclusion_concurrent_systemic_disease: boolean | null
          exclusion_owner_declined_consent: boolean | null
          exclusion_pregnant_or_lactating: boolean | null
          exclusion_prior_investigational_drug_30d: boolean | null
          id: number
          inclusion_age_2_to_20: boolean | null
          inclusion_diagnosed_acute_laminitis: boolean | null
          inclusion_no_prior_investigational_drug_30d: boolean | null
          inclusion_obel_grade_1_to_3: boolean | null
          inclusion_owner_consent: boolean | null
          inclusion_weight_over_200kg: boolean | null
          ineligible_reason: string | null
          patient_id: number
          screened_at: string | null
          screened_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deviation_justification?: string | null
          eligibility_determination?: string | null
          exclusion_chronic_laminitis_over_14d?: boolean | null
          exclusion_concurrent_systemic_disease?: boolean | null
          exclusion_owner_declined_consent?: boolean | null
          exclusion_pregnant_or_lactating?: boolean | null
          exclusion_prior_investigational_drug_30d?: boolean | null
          id?: never
          inclusion_age_2_to_20?: boolean | null
          inclusion_diagnosed_acute_laminitis?: boolean | null
          inclusion_no_prior_investigational_drug_30d?: boolean | null
          inclusion_obel_grade_1_to_3?: boolean | null
          inclusion_owner_consent?: boolean | null
          inclusion_weight_over_200kg?: boolean | null
          ineligible_reason?: string | null
          patient_id: number
          screened_at?: string | null
          screened_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deviation_justification?: string | null
          eligibility_determination?: string | null
          exclusion_chronic_laminitis_over_14d?: boolean | null
          exclusion_concurrent_systemic_disease?: boolean | null
          exclusion_owner_declined_consent?: boolean | null
          exclusion_pregnant_or_lactating?: boolean | null
          exclusion_prior_investigational_drug_30d?: boolean | null
          id?: never
          inclusion_age_2_to_20?: boolean | null
          inclusion_diagnosed_acute_laminitis?: boolean | null
          inclusion_no_prior_investigational_drug_30d?: boolean | null
          inclusion_obel_grade_1_to_3?: boolean | null
          inclusion_owner_consent?: boolean | null
          inclusion_weight_over_200kg?: boolean | null
          ineligible_reason?: string | null
          patient_id?: number
          screened_at?: string | null
          screened_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_eligibility_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      fda_correspondence: {
        Row: {
          correspondence_date: string
          correspondence_type: string
          created_at: string
          description: string | null
          document_url: string | null
          from_entity: string
          id: number
          related_protocol_version: string | null
          subject: string
          to_entity: string
          uploaded_by: string | null
        }
        Insert: {
          correspondence_date: string
          correspondence_type: string
          created_at?: string
          description?: string | null
          document_url?: string | null
          from_entity: string
          id?: never
          related_protocol_version?: string | null
          subject: string
          to_entity: string
          uploaded_by?: string | null
        }
        Update: {
          correspondence_date?: string
          correspondence_type?: string
          created_at?: string
          description?: string | null
          document_url?: string | null
          from_entity?: string
          id?: never
          related_protocol_version?: string | null
          subject?: string
          to_entity?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      file_audit_log: {
        Row: {
          action: string
          details: Json | null
          file_id: string | null
          id: string
          ip_address: unknown
          performed_at: string | null
          performed_by: string
          user_agent: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          file_id?: string | null
          id?: string
          ip_address?: unknown
          performed_at?: string | null
          performed_by: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          file_id?: string | null
          id?: string
          ip_address?: unknown
          performed_at?: string | null
          performed_by?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_audit_log_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      file_registry: {
        Row: {
          bucket_id: string
          checksum_sha256: string | null
          deleted_at: string | null
          deleted_by: string | null
          file_name: string
          file_size_bytes: number
          file_type: string
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          mime_type: string | null
          patient_id: string | null
          site_id: string | null
          storage_path: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          bucket_id: string
          checksum_sha256?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          file_name: string
          file_size_bytes: number
          file_type: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          patient_id?: string | null
          site_id?: string | null
          storage_path: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          bucket_id?: string
          checksum_sha256?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          file_name?: string
          file_size_bytes?: number
          file_type?: string
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          patient_id?: string | null
          site_id?: string | null
          storage_path?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_registry_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "trial_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      informed_consents: {
        Row: {
          created_at: string
          horse_age: number | null
          horse_breed: string | null
          horse_microchip: string | null
          horse_name: string | null
          horse_weight: number | null
          icf_can_sign_after: string | null
          icf_pdf_url: string | null
          icf_signed_at: string | null
          icf_status: string
          icf_viewed_at: string | null
          id: number
          investigator_signature: string | null
          investigator_signed_at: string | null
          owner_address: string | null
          owner_email: string | null
          owner_name: string
          owner_phone: string | null
          owner_relationship: string | null
          owner_signature: string | null
          patient_id: number
          section_acknowledgments: Json | null
          updated_at: string
          withdrawal_reason: string | null
          withdrawn_at: string | null
          witness_name: string | null
          witness_signature: string | null
        }
        Insert: {
          created_at?: string
          horse_age?: number | null
          horse_breed?: string | null
          horse_microchip?: string | null
          horse_name?: string | null
          horse_weight?: number | null
          icf_can_sign_after?: string | null
          icf_pdf_url?: string | null
          icf_signed_at?: string | null
          icf_status?: string
          icf_viewed_at?: string | null
          id?: never
          investigator_signature?: string | null
          investigator_signed_at?: string | null
          owner_address?: string | null
          owner_email?: string | null
          owner_name: string
          owner_phone?: string | null
          owner_relationship?: string | null
          owner_signature?: string | null
          patient_id: number
          section_acknowledgments?: Json | null
          updated_at?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          witness_name?: string | null
          witness_signature?: string | null
        }
        Update: {
          created_at?: string
          horse_age?: number | null
          horse_breed?: string | null
          horse_microchip?: string | null
          horse_name?: string | null
          horse_weight?: number | null
          icf_can_sign_after?: string | null
          icf_pdf_url?: string | null
          icf_signed_at?: string | null
          icf_status?: string
          icf_viewed_at?: string | null
          id?: never
          investigator_signature?: string | null
          investigator_signed_at?: string | null
          owner_address?: string | null
          owner_email?: string | null
          owner_name?: string
          owner_phone?: string | null
          owner_relationship?: string | null
          owner_signature?: string | null
          patient_id?: number
          section_acknowledgments?: Json | null
          updated_at?: string
          withdrawal_reason?: string | null
          withdrawn_at?: string | null
          witness_name?: string | null
          witness_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "informed_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      investigator_qualifications: {
        Row: {
          admin_rejection_reason: string | null
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          created_at: string
          cv_upload_url: string | null
          drug_storage_photo_url: string | null
          emergency_equipment_photo_url: string | null
          facility_checklist: Json | null
          facility_inspection_completed: boolean | null
          facility_inspection_date: string | null
          gcp_certificate_url: string | null
          gcp_completion_date: string | null
          gcp_expiry_date: string | null
          gcp_quiz_score: number | null
          gcp_training_completed: boolean | null
          id: number
          investigator_agreement_signature: string | null
          investigator_agreement_signed: boolean | null
          investigator_agreement_signed_at: string | null
          laminitis_case_volume_per_year: number | null
          license_number: string | null
          license_state: string | null
          prior_clinical_trial_experience: boolean | null
          prior_trials_count: number | null
          protocol_signature: string | null
          protocol_signed: boolean | null
          protocol_signed_at: string | null
          protocol_signed_version: string | null
          qualification_status: string
          records_area_photo_url: string | null
          updated_at: string
          veterinarian_id: number
          years_experience: number | null
        }
        Insert: {
          admin_rejection_reason?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          created_at?: string
          cv_upload_url?: string | null
          drug_storage_photo_url?: string | null
          emergency_equipment_photo_url?: string | null
          facility_checklist?: Json | null
          facility_inspection_completed?: boolean | null
          facility_inspection_date?: string | null
          gcp_certificate_url?: string | null
          gcp_completion_date?: string | null
          gcp_expiry_date?: string | null
          gcp_quiz_score?: number | null
          gcp_training_completed?: boolean | null
          id?: never
          investigator_agreement_signature?: string | null
          investigator_agreement_signed?: boolean | null
          investigator_agreement_signed_at?: string | null
          laminitis_case_volume_per_year?: number | null
          license_number?: string | null
          license_state?: string | null
          prior_clinical_trial_experience?: boolean | null
          prior_trials_count?: number | null
          protocol_signature?: string | null
          protocol_signed?: boolean | null
          protocol_signed_at?: string | null
          protocol_signed_version?: string | null
          qualification_status?: string
          records_area_photo_url?: string | null
          updated_at?: string
          veterinarian_id: number
          years_experience?: number | null
        }
        Update: {
          admin_rejection_reason?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          created_at?: string
          cv_upload_url?: string | null
          drug_storage_photo_url?: string | null
          emergency_equipment_photo_url?: string | null
          facility_checklist?: Json | null
          facility_inspection_completed?: boolean | null
          facility_inspection_date?: string | null
          gcp_certificate_url?: string | null
          gcp_completion_date?: string | null
          gcp_expiry_date?: string | null
          gcp_quiz_score?: number | null
          gcp_training_completed?: boolean | null
          id?: never
          investigator_agreement_signature?: string | null
          investigator_agreement_signed?: boolean | null
          investigator_agreement_signed_at?: string | null
          laminitis_case_volume_per_year?: number | null
          license_number?: string | null
          license_state?: string | null
          prior_clinical_trial_experience?: boolean | null
          prior_trials_count?: number | null
          protocol_signature?: string | null
          protocol_signed?: boolean | null
          protocol_signed_at?: string | null
          protocol_signed_version?: string | null
          qualification_status?: string
          records_area_photo_url?: string | null
          updated_at?: string
          veterinarian_id?: number
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investigator_qualifications_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          additional_notes: string | null
          albumin: number | null
          alkaline_phosphatase: number | null
          alt: number | null
          ast: number | null
          bun: number | null
          created_at: string
          creatinine: number | null
          fibrinogen: number | null
          glucose: number | null
          hematocrit: number | null
          hemoglobin: number | null
          id: number
          lactate: number | null
          patient_id: number
          platelets: number | null
          protocol_hour: number | null
          rbc: number | null
          serum_amyloid_a: number | null
          test_datetime: string
          total_protein: number | null
          updated_at: string
          wbc: number | null
        }
        Insert: {
          additional_notes?: string | null
          albumin?: number | null
          alkaline_phosphatase?: number | null
          alt?: number | null
          ast?: number | null
          bun?: number | null
          created_at?: string
          creatinine?: number | null
          fibrinogen?: number | null
          glucose?: number | null
          hematocrit?: number | null
          hemoglobin?: number | null
          id?: never
          lactate?: number | null
          patient_id: number
          platelets?: number | null
          protocol_hour?: number | null
          rbc?: number | null
          serum_amyloid_a?: number | null
          test_datetime: string
          total_protein?: number | null
          updated_at?: string
          wbc?: number | null
        }
        Update: {
          additional_notes?: string | null
          albumin?: number | null
          alkaline_phosphatase?: number | null
          alt?: number | null
          ast?: number | null
          bun?: number | null
          created_at?: string
          creatinine?: number | null
          fibrinogen?: number | null
          glucose?: number | null
          hematocrit?: number | null
          hemoglobin?: number | null
          id?: never
          lactate?: number | null
          patient_id?: number
          platelets?: number | null
          protocol_hour?: number | null
          rbc?: number | null
          serum_amyloid_a?: number | null
          test_datetime?: string
          total_protein?: number | null
          updated_at?: string
          wbc?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      media_uploads: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_url: string
          id: number
          media_category: string
          media_type: string
          patient_id: number
          protocol_hour: number | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_url: string
          id?: never
          media_category: string
          media_type: string
          patient_id: number
          protocol_hour?: number | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_url?: string
          id?: never
          media_category?: string
          media_type?: string
          patient_id?: number
          protocol_hour?: number | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_uploads_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_visits: {
        Row: {
          capa_items: Json | null
          completed: boolean | null
          corrective_actions: string | null
          created_at: string
          deviations_found: number | null
          findings: string | null
          id: number
          monitor_email: string | null
          monitor_name: string
          next_visit_due: string | null
          report_url: string | null
          site_id: number
          updated_at: string
          visit_date: string
          visit_type: string
        }
        Insert: {
          capa_items?: Json | null
          completed?: boolean | null
          corrective_actions?: string | null
          created_at?: string
          deviations_found?: number | null
          findings?: string | null
          id?: never
          monitor_email?: string | null
          monitor_name: string
          next_visit_due?: string | null
          report_url?: string | null
          site_id: number
          updated_at?: string
          visit_date: string
          visit_type: string
        }
        Update: {
          capa_items?: Json | null
          completed?: boolean | null
          corrective_actions?: string | null
          created_at?: string
          deviations_found?: number | null
          findings?: string | null
          id?: never
          monitor_email?: string | null
          monitor_name?: string
          next_visit_due?: string | null
          report_url?: string | null
          site_id?: number
          updated_at?: string
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_visits_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      ncie_shipment_log: {
        Row: {
          batch_lot_number: string
          bottles_received_at_clinic: number | null
          carrier: string | null
          condition_on_receipt: string | null
          created_at: string
          delivered_date: string | null
          expected_delivery_date: string | null
          expiration_date: string | null
          id: number
          quantity_ml_total: number | null
          quantity_vials: number
          received_at: string | null
          received_by_clinic_date: string | null
          received_by_clinic_name: string | null
          receiving_signature: string | null
          shipment_date: string
          shipment_notes: string | null
          shipment_status: string
          shipped_to_investigator: string | null
          shipped_to_site_id: number | null
          shipped_to_veterinarian_email: string | null
          shipped_to_veterinarian_id: number | null
          shipped_to_veterinarian_name: string | null
          storage_temperature_celsius: number | null
          tracking_number: string | null
        }
        Insert: {
          batch_lot_number: string
          bottles_received_at_clinic?: number | null
          carrier?: string | null
          condition_on_receipt?: string | null
          created_at?: string
          delivered_date?: string | null
          expected_delivery_date?: string | null
          expiration_date?: string | null
          id?: never
          quantity_ml_total?: number | null
          quantity_vials: number
          received_at?: string | null
          received_by_clinic_date?: string | null
          received_by_clinic_name?: string | null
          receiving_signature?: string | null
          shipment_date: string
          shipment_notes?: string | null
          shipment_status?: string
          shipped_to_investigator?: string | null
          shipped_to_site_id?: number | null
          shipped_to_veterinarian_email?: string | null
          shipped_to_veterinarian_id?: number | null
          shipped_to_veterinarian_name?: string | null
          storage_temperature_celsius?: number | null
          tracking_number?: string | null
        }
        Update: {
          batch_lot_number?: string
          bottles_received_at_clinic?: number | null
          carrier?: string | null
          condition_on_receipt?: string | null
          created_at?: string
          delivered_date?: string | null
          expected_delivery_date?: string | null
          expiration_date?: string | null
          id?: never
          quantity_ml_total?: number | null
          quantity_vials?: number
          received_at?: string | null
          received_by_clinic_date?: string | null
          received_by_clinic_name?: string | null
          receiving_signature?: string | null
          shipment_date?: string
          shipment_notes?: string | null
          shipment_status?: string
          shipped_to_investigator?: string | null
          shipped_to_site_id?: number | null
          shipped_to_veterinarian_email?: string | null
          shipped_to_veterinarian_id?: number | null
          shipped_to_veterinarian_name?: string | null
          storage_temperature_celsius?: number | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ncie_shipment_log_shipped_to_site_id_fkey"
            columns: ["shipped_to_site_id"]
            isOneToOne: false
            referencedRelation: "site_qualifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ncie_shipment_log_shipped_to_veterinarian_id_fkey"
            columns: ["shipped_to_veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          affected_limbs: string | null
          age: number
          body_condition_score: number | null
          breed: string
          consent_date: string | null
          coronary_band_condition: string | null
          created_at: string
          data_lock_status: string | null
          digital_pulse: string | null
          eligibility_verified: boolean
          enrolled_by_vet_email: string | null
          enrolled_by_veterinarian_id: number | null
          enrollment_date: string
          enrollment_heart_rate: number | null
          enrollment_icf_id: number | null
          enrollment_respiratory_rate: number | null
          enrollment_temperature: number | null
          exclusion_criteria_notes: string | null
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          gait: string | null
          hoof_tester_response: string | null
          hoof_wall_temperature: string | null
          horse_name: string
          id: number
          inclusion_criteria_met: boolean | null
          is_flagged: boolean
          laminitis_duration_days: number | null
          laminitis_grade: number | null
          owner_contact: string
          owner_name: string
          profile_picture_url: string | null
          protocol_start_time: string | null
          randomization_date: string | null
          randomized_group: string | null
          screened_at: string | null
          screened_by: string | null
          screening_notes: string | null
          screening_status: string | null
          sex: string
          site_id: number | null
          stance: string | null
          trial_status: string
          unique_id: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          affected_limbs?: string | null
          age: number
          body_condition_score?: number | null
          breed: string
          consent_date?: string | null
          coronary_band_condition?: string | null
          created_at?: string
          data_lock_status?: string | null
          digital_pulse?: string | null
          eligibility_verified?: boolean
          enrolled_by_vet_email?: string | null
          enrolled_by_veterinarian_id?: number | null
          enrollment_date?: string
          enrollment_heart_rate?: number | null
          enrollment_icf_id?: number | null
          enrollment_respiratory_rate?: number | null
          enrollment_temperature?: number | null
          exclusion_criteria_notes?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          gait?: string | null
          hoof_tester_response?: string | null
          hoof_wall_temperature?: string | null
          horse_name: string
          id?: never
          inclusion_criteria_met?: boolean | null
          is_flagged?: boolean
          laminitis_duration_days?: number | null
          laminitis_grade?: number | null
          owner_contact: string
          owner_name: string
          profile_picture_url?: string | null
          protocol_start_time?: string | null
          randomization_date?: string | null
          randomized_group?: string | null
          screened_at?: string | null
          screened_by?: string | null
          screening_notes?: string | null
          screening_status?: string | null
          sex: string
          site_id?: number | null
          stance?: string | null
          trial_status?: string
          unique_id?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          affected_limbs?: string | null
          age?: number
          body_condition_score?: number | null
          breed?: string
          consent_date?: string | null
          coronary_band_condition?: string | null
          created_at?: string
          data_lock_status?: string | null
          digital_pulse?: string | null
          eligibility_verified?: boolean
          enrolled_by_vet_email?: string | null
          enrolled_by_veterinarian_id?: number | null
          enrollment_date?: string
          enrollment_heart_rate?: number | null
          enrollment_icf_id?: number | null
          enrollment_respiratory_rate?: number | null
          enrollment_temperature?: number | null
          exclusion_criteria_notes?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          gait?: string | null
          hoof_tester_response?: string | null
          hoof_wall_temperature?: string | null
          horse_name?: string
          id?: never
          inclusion_criteria_met?: boolean | null
          is_flagged?: boolean
          laminitis_duration_days?: number | null
          laminitis_grade?: number | null
          owner_contact?: string
          owner_name?: string
          profile_picture_url?: string | null
          protocol_start_time?: string | null
          randomization_date?: string | null
          randomized_group?: string | null
          screened_at?: string | null
          screened_by?: string | null
          screening_notes?: string | null
          screening_status?: string | null
          sex?: string
          site_id?: number | null
          stance?: string | null
          trial_status?: string
          unique_id?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "patients_enrolled_by_veterinarian_id_fkey"
            columns: ["enrolled_by_veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_enrollment_icf_id_fkey"
            columns: ["enrollment_icf_id"]
            isOneToOne: false
            referencedRelation: "informed_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "site_qualifications"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_deviations: {
        Row: {
          admin_notified: boolean | null
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          corrective_action: string | null
          created_at: string
          description: string
          deviation_date: string
          deviation_type: string
          explanation: string | null
          id: number
          impact_assessment: string
          patient_id: number
          preventive_action: string | null
          status: string
          updated_at: string
          veterinarian_id: number | null
        }
        Insert: {
          admin_notified?: boolean | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          corrective_action?: string | null
          created_at?: string
          description: string
          deviation_date: string
          deviation_type: string
          explanation?: string | null
          id?: never
          impact_assessment: string
          patient_id: number
          preventive_action?: string | null
          status?: string
          updated_at?: string
          veterinarian_id?: number | null
        }
        Update: {
          admin_notified?: boolean | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          corrective_action?: string | null
          created_at?: string
          description?: string
          deviation_date?: string
          deviation_type?: string
          explanation?: string | null
          id?: never
          impact_assessment?: string
          patient_id?: number
          preventive_action?: string | null
          status?: string
          updated_at?: string
          veterinarian_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "protocol_deviations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocol_deviations_veterinarian_id_fkey"
            columns: ["veterinarian_id"]
            isOneToOne: false
            referencedRelation: "veterinarians"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_versions: {
        Row: {
          change_summary: string | null
          created_at: string
          description: string | null
          effective_date: string
          id: number
          is_current: boolean | null
          pdf_url: string
          previous_version: string | null
          uploaded_at: string
          uploaded_by: string
          version_number: string
        }
        Insert: {
          change_summary?: string | null
          created_at?: string
          description?: string | null
          effective_date: string
          id?: never
          is_current?: boolean | null
          pdf_url: string
          previous_version?: string | null
          uploaded_at?: string
          uploaded_by: string
          version_number: string
        }
        Update: {
          change_summary?: string | null
          created_at?: string
          description?: string | null
          effective_date?: string
          id?: never
          is_current?: boolean | null
          pdf_url?: string
          previous_version?: string | null
          uploaded_at?: string
          uploaded_by?: string
          version_number?: string
        }
        Relationships: []
      }
      radiograph_assessments: {
        Row: {
          affected_limb: string
          assessment_datetime: string
          created_at: string
          id: number
          image_url: string | null
          interpretation: string | null
          keenan_angle: number | null
          patient_id: number
          protocol_hour: number | null
          updated_at: string
          veterinarian_name: string
        }
        Insert: {
          affected_limb: string
          assessment_datetime: string
          created_at?: string
          id?: never
          image_url?: string | null
          interpretation?: string | null
          keenan_angle?: number | null
          patient_id: number
          protocol_hour?: number | null
          updated_at?: string
          veterinarian_name: string
        }
        Update: {
          affected_limb?: string
          assessment_datetime?: string
          created_at?: string
          id?: never
          image_url?: string | null
          interpretation?: string | null
          keenan_angle?: number | null
          patient_id?: number
          protocol_hour?: number | null
          updated_at?: string
          veterinarian_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "radiograph_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_tokens: {
        Row: {
          created_at: string
          email: string | null
          expires_at: string
          role: string | null
          token_hash: string
          user_email: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          expires_at: string
          role?: string | null
          token_hash: string
          user_email?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          expires_at?: string
          role?: string | null
          token_hash?: string
          user_email?: string | null
        }
        Relationships: []
      }
      site_qualifications: {
        Row: {
          activated_at: string | null
          closed_at: string | null
          created_at: string
          gcp_training_records: Json | null
          has_24h_emergency_coverage: boolean | null
          has_drug_storage_refrigeration: boolean | null
          has_drug_storage_security: boolean | null
          has_emergency_equipment: boolean | null
          has_laboratory: boolean | null
          has_radiography: boolean | null
          iacuc_approval_number: string | null
          id: number
          principal_investigator_credentials: string | null
          principal_investigator_email: string | null
          principal_investigator_name: string | null
          prior_therapeutic_areas: string | null
          prior_trial_experience_count: number | null
          qualified_at: string | null
          site_address: string | null
          site_name: string
          site_status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          closed_at?: string | null
          created_at?: string
          gcp_training_records?: Json | null
          has_24h_emergency_coverage?: boolean | null
          has_drug_storage_refrigeration?: boolean | null
          has_drug_storage_security?: boolean | null
          has_emergency_equipment?: boolean | null
          has_laboratory?: boolean | null
          has_radiography?: boolean | null
          iacuc_approval_number?: string | null
          id?: never
          principal_investigator_credentials?: string | null
          principal_investigator_email?: string | null
          principal_investigator_name?: string | null
          prior_therapeutic_areas?: string | null
          prior_trial_experience_count?: number | null
          qualified_at?: string | null
          site_address?: string | null
          site_name: string
          site_status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          closed_at?: string | null
          created_at?: string
          gcp_training_records?: Json | null
          has_24h_emergency_coverage?: boolean | null
          has_drug_storage_refrigeration?: boolean | null
          has_drug_storage_security?: boolean | null
          has_emergency_equipment?: boolean | null
          has_laboratory?: boolean | null
          has_radiography?: boolean | null
          iacuc_approval_number?: string | null
          id?: never
          principal_investigator_credentials?: string | null
          principal_investigator_email?: string | null
          principal_investigator_name?: string | null
          prior_therapeutic_areas?: string | null
          prior_trial_experience_count?: number | null
          qualified_at?: string | null
          site_address?: string | null
          site_name?: string
          site_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_settings: {
        Row: {
          created_at: string
          id: number
          inad_file_number: string | null
          last_fda_correspondence_date: string | null
          protocol_effective_date: string | null
          protocol_version: string
          sponsor_contact: string | null
          sponsor_name: string | null
          study_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          inad_file_number?: string | null
          last_fda_correspondence_date?: string | null
          protocol_effective_date?: string | null
          protocol_version?: string
          sponsor_contact?: string | null
          sponsor_name?: string | null
          study_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          inad_file_number?: string | null
          last_fda_correspondence_date?: string | null
          protocol_effective_date?: string | null
          protocol_version?: string
          sponsor_contact?: string | null
          sponsor_name?: string | null
          study_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      treatment_outcomes: {
        Row: {
          appetite_score: number | null
          assessment_date: string
          assessment_day: number
          body_weight: number | null
          created_at: string
          digital_pulse_score: number | null
          gait_video_url: string | null
          heart_rate: number | null
          hoof_temperature: string | null
          id: number
          keenan_angle: number | null
          mobility_score: number | null
          obel_grade: number | null
          pain_score: number | null
          patient_id: number
          protocol_hour: number | null
          radiograph_findings: string | null
          radiograph_url: string | null
          respiratory_rate: number | null
          signed_at: string | null
          temperature: number | null
          updated_at: string
          veterinarian_name: string
        }
        Insert: {
          appetite_score?: number | null
          assessment_date: string
          assessment_day: number
          body_weight?: number | null
          created_at?: string
          digital_pulse_score?: number | null
          gait_video_url?: string | null
          heart_rate?: number | null
          hoof_temperature?: string | null
          id?: never
          keenan_angle?: number | null
          mobility_score?: number | null
          obel_grade?: number | null
          pain_score?: number | null
          patient_id: number
          protocol_hour?: number | null
          radiograph_findings?: string | null
          radiograph_url?: string | null
          respiratory_rate?: number | null
          signed_at?: string | null
          temperature?: number | null
          updated_at?: string
          veterinarian_name: string
        }
        Update: {
          appetite_score?: number | null
          assessment_date?: string
          assessment_day?: number
          body_weight?: number | null
          created_at?: string
          digital_pulse_score?: number | null
          gait_video_url?: string | null
          heart_rate?: number | null
          hoof_temperature?: string | null
          id?: never
          keenan_angle?: number | null
          mobility_score?: number | null
          obel_grade?: number | null
          pain_score?: number | null
          patient_id?: number
          protocol_hour?: number | null
          radiograph_findings?: string | null
          radiograph_url?: string | null
          respiratory_rate?: number | null
          signed_at?: string | null
          temperature?: number | null
          updated_at?: string
          veterinarian_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_outcomes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          administration_datetime: string
          batch_number: string | null
          created_at: string
          dosage_mg: number
          id: number
          immediate_reactions: string | null
          notes: string | null
          patient_id: number
          protocol_hour: number | null
          route: string
          total_volume_ml: number | null
          updated_at: string
          veterinarian_name: string
        }
        Insert: {
          administration_datetime: string
          batch_number?: string | null
          created_at?: string
          dosage_mg: number
          id?: never
          immediate_reactions?: string | null
          notes?: string | null
          patient_id: number
          protocol_hour?: number | null
          route: string
          total_volume_ml?: number | null
          updated_at?: string
          veterinarian_name: string
        }
        Update: {
          administration_datetime?: string
          batch_number?: string | null
          created_at?: string
          dosage_mg?: number
          id?: never
          immediate_reactions?: string | null
          notes?: string | null
          patient_id?: number
          protocol_hour?: number | null
          route?: string
          total_volume_ml?: number | null
          updated_at?: string
          veterinarian_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_sites: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          name: string
          site_code: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          name: string
          site_code: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          name?: string
          site_code?: string
        }
        Relationships: []
      }
      veterinarians: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          consent_printed_at: string | null
          created_at: string
          email: string
          full_name: string
          hospital_affiliation: string
          id: number
          last_login: string | null
          license_number: string
          no_conflict_of_interest: boolean
          password_hash: string | null
          phone: string | null
          reset_token: string | null
          reset_token_expires_at: string | null
          signature_text: string | null
          tc_accepted: boolean
          tc_accepted_at: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          consent_printed_at?: string | null
          created_at?: string
          email: string
          full_name: string
          hospital_affiliation: string
          id?: never
          last_login?: string | null
          license_number: string
          no_conflict_of_interest?: boolean
          password_hash?: string | null
          phone?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          signature_text?: string | null
          tc_accepted?: boolean
          tc_accepted_at?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          consent_printed_at?: string | null
          created_at?: string
          email?: string
          full_name?: string
          hospital_affiliation?: string
          id?: never
          last_login?: string | null
          license_number?: string
          no_conflict_of_interest?: boolean
          password_hash?: string | null
          phone?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          signature_text?: string | null
          tc_accepted?: boolean
          tc_accepted_at?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
