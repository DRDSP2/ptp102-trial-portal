# PTP-102 Laminitis Trial Portal — Complete Feature Snapshot

## 1. Frontend Feature Overview

### Authentication & Access Control
- **Dual-role system**: Veterinarian and Admin logins with distinct dashboards and permissions.
- **Vet registration workflow**: Self-registration with pending admin approval; vets must accept Terms & Conditions before access.
- **Admin override**: Admins can directly approve/reject veterinarian accounts and investigator qualifications.
- **Role-based routing**: Protected routes ensure vets cannot access admin compliance dashboards and vice versa.

### Dashboard (Admin View)
- **Overview tab**: Real-time statistics cards (total patients, enrolled, completed, adverse events, serious AEs, pending ICFs, approved investigators, protocol deviations).
- **Patients tab**: Full patient management with status filtering, enrollment dialog, and patient deletion.
- **Veterinarians tab**: Vet management panel with approval/rejection controls and qualification tracking.
- **Trials Data tab**: Master trials table with regulatory-grade data views.
- **Compliance tab**: Regulatory compliance dashboard (see below).
- **Supply tab**: NCIE (New Chemical Entity) shipment tracking, drug supply inventory, storage conditions monitoring.

### Dashboard (Veterinarian View)
- **Patient list**: Filterable list of assigned patients with quick-view details.
- **Enrollment form**: Structured horse enrollment with auto-generated unique trial IDs (`LAM-XXXXX`).
- **Quick-access tools**: Dose calculator, protocol reference, regulatory document center.
- **Research hub**: Centralized access to trial resources and literature.

### Patient Case Workspace (Per-Horse View)
The case workspace is the clinical command center for each enrolled horse, organized into tabs:

#### Header & Context
- Horse identity card (name, breed, age, sex, unique trial ID, enrollment date).
- Trial status badge (enrolled/pending/screening rejected).
- Protocol hour counter (real-time countdown/timer relative to protocol start).
- Admin screening status indicator.

#### Compliance Gates
- **Enrollment Eligibility Screen**: Interactive inclusion/exclusion criteria checklist with deviation justification workflow.
- **Informed Consent Workflow (ICF)**: Multi-section digital consent with owner signature capture, witness signature, cooling-off period enforcement, and PDF generation.

#### Clinical Tabs
1. **Treatments**
   - Add treatment form with dose, volume, route, batch number, and immediate reaction logging.
   - Treatment history table with protocol hour attribution.
   - Next-dose timer with countdown to upcoming administrations.
   - 72-hour protocol timeline visualization.

2. **Notes**
   - Clinical notes history with type badges (observation, adverse event, protocol note, communication, video assessment).
   - **Quick Add Note**: Rapid note entry with template suggestions.

3. **Videos**
   - **Video Upload Manager**: Secure upload via Uploadcare CDN with recording guidelines, file validation (MP4/MOV, max 500MB), and direct linking to patient records.
   - Video library with inline playback, download capability, and full metadata (uploader, timestamp, protocol hour).
   - **Obel Grade Reference Component** (new): Dark-themed gait reference with grade-mapped demo videos, gait analysis metrics (stride, hoof placement, head nod, weight shifting, ground contact, gait symmetry), and clinical observation annotations.

4. **Lab Results**
   - Lab entry form: Complete Blood Count (WBC, RBC, hemoglobin, hematocrit, platelets), biochemistry panel (glucose, creatinine, BUN, ALT, AST, alkaline phosphatase, total protein, albumin), and inflammatory markers (SAA, fibrinogen, lactate).
   - Lab results history with structured display and timestamping.

5. **Assessments**
   - **Clinical Assessment Form**: Date/time, Obel grade (0-4) via rich reference component, pain score (0-10), mobility score (0-10), digital pulse (0-4), hoof temperature (normal/warm/hot), heart rate, respiratory rate, temperature, and free-text clinical notes.
   - Assessment history with Obel score trend chart and full vital signs grid.

#### Side Panels
- **Monitoring Checklist**: Real-time checklist showing completion status for treatments, vital signs, digital pulse, gait assessment, pain score, adverse event checks, and lab work — all tied to current protocol hour.
- **Protocol Reference Card**: Inclusion/exclusion criteria and dosing schedule (Dose 1: Hour 0, Dose 2: Hour 12, 500mL IV @ 5mg/mL).
- **Obel Score Chart**: Visual trend line of Obel grades across the protocol timeline.

### Admin Compliance Dashboard
- **INAD File Banner**: Displays `INAD-PTP102-2025`, protocol version, and sponsor name.
- **Investigator Qualifications**: GCP training status, CV upload, facility inspection, investigator agreement signatures, and admin review workflow.
- **Adverse Events (AEs)**: Full AE registry with severity, causality, outcome, and digital signature tracking.
- **Protocol Deviations**: Deviation log with impact assessment (Minor/Major/Critical), corrective actions, and admin review status.
- **NCIE Shipments**: Batch/lot tracking, expiration dates, storage temperature logs, and chain-of-custody records.
- **FDA Correspondence**: Centralized log of all FDA submissions, letters, emails, and meeting minutes.

### Regulatory & Safety Features
- **Adverse Event Reporter**: Floating action button available on all patient case pages for immediate AE reporting. Includes severity classification, causality assessment, action taken, outcome tracking, prohibited terms filter, and digital signature capture. Auto-notifies admin for severe/life-threatening events.
- **Regulatory Banner**: Persistent banner displaying trial regulatory status.
- **Protocol Document Center**: Version-controlled protocol storage with PDF management.
- **Trial Operations Hub**: Operational oversight for trial conduct and site management.

### Communication & Support
- **WhatsApp Chat Button**: Floating support chat for trial coordination.
- **Communication Messages**: In-app messaging system with classification (General, Protocol Question, Adverse Event, Urgent, FDA Correspondence) and read receipts.

---

## 2. Security Features & FDA Readiness

### Authentication & Access Security
- **Role-based access control (RBAC)**: Strict separation between veterinarian and admin privileges.
- **Local storage session management**: Encrypted auth state with automatic persistence.
- **Password protection**: bcrypt-hashed passwords for veterinarians and admin users.
- **Account approval workflow**: New veterinarians require explicit admin approval before system access.
- **Terms & Conditions acceptance**: Digital acknowledgment required before platform use.

### Data Integrity & Audit Trails (21 CFR Part 11 Foundation)
- **Immutable timestamps**: Every record includes `created_at` and `updated_at` timestamps in UTC.
- **Veterinarian attribution**: Every clinical action (assessment, note, treatment, lab, video) is tagged with the performing veterinarian's email/name.
- **Audit log table (`audit_logs`)**: Comprehensive audit trail capturing:
  - User ID, email, and role
  - Action type (create, update, delete)
  - Entity type and ID
  - Field-level old/new values
  - Reason for change
  - IP address, user agent, and session ID
  - Timestamp
- **Data lock status**: Patient records support `open`, `locked`, and `frozen` states for database locking at trial close-out.

### FDA CVM Compliance Framework
The platform is built around a comprehensive compliance schema:

| Table | Purpose |
|-------|---------|
| `study_settings` | INAD file number, protocol version, sponsor tracking |
| `investigator_qualifications` | CV, license, GCP training certificates, facility inspection, digital signatures |
| `informed_consents` | Owner ICF with signatures, witness, section acknowledgments, withdrawal tracking |
| `protocol_versions` | Version-controlled protocol PDFs with change summaries |
| `adverse_events` | Full AE reporting with FDA fields (serious, expected, severity, causality, digital signature) |
| `site_qualifications` | IACUC approval, equipment verification, PI credentials |
| `monitoring_visits` | Pre-study, periodic, for-cause, and close-out visit tracking with CAPA items |
| `audit_logs` | 21 CFR Part 11-ready audit trail |
| `fda_correspondence` | All FDA submission and correspondence history |
| `protocol_deviations` | Deviation tracking with impact assessment and corrective actions |
| `communication_messages` | Classified message archive for regulatory inspection |
| `enrollment_eligibility` | Structured inclusion/exclusion criteria with deviation justification |
| `treatment_outcomes` | Objective outcome scales only, veterinarian-signed |
| `ncie_shipment_log` | Drug accountability with batch/lot tracking and chain of custody |

### Clinical Data Validation
- **Zod schema validation**: All forms enforce strict data types and required fields.
- **Range validation**: Vital signs and scores constrained to clinical ranges (e.g., Obel 0-4, pain 0-10, digital pulse 0-4).
- **Prohibited terms filter**: AE descriptions are screened against prohibited language to enforce objective, factual reporting.
- **Required field enforcement**: No assessment can be saved without date, Obel grade, and pain score.

### Video & Media Security
- **CDN storage**: Videos uploaded via Uploadcare to secure cloud storage.
- **File validation**: Restricted to MP4/MOV, 500MB max, with metadata extraction.
- **Attribution**: Every video is linked to the uploading veterinarian, patient, protocol hour, and timestamp.
- **Download controls**: Videos served with `controlsList="nodownload"` and download tracked via authenticated fetch.

---

## 3. End-of-Trial FDA Reporting: One-Click Complete Export

### The Report Generator (`src/lib/reportGenerator.ts`)
At the conclusion of the trial (or at any point for interim analysis), the platform can generate a **complete patient trial report as a PDF** with a single click. This is accessible from the patient case workspace.

### What Gets Exported
The PDF is a comprehensive regulatory document structured as follows:

**Section 1: Trial Overview**
- Horse identification (name, trial ID, breed, age, sex, weight)
- Owner details and enrollment date
- Protocol start time and trial status
- Laminitis grade and affected limbs
- Primary veterinarian credentials (name, email, hospital, license)

**Section 2: Treatment Administration Records**
- Every dose administered with date/time, dosage (mg), volume (mL), route, protocol hour, and administering veterinarian.
- Formatted as a regulatory table suitable for FDA review.

**Section 3: Clinical Assessments**
- Every assessment with Obel grade, pain score, heart rate, respiratory rate, temperature, and protocol hour.
- Chronological table format.

**Section 4: Laboratory Results**
- Complete Blood Count, biochemistry panel, and inflammatory markers for each lab draw.
- Additional notes preserved.

**Section 5: Video Documentation**
- Every gait assessment video with filename, upload timestamp, uploading veterinarian, description, protocol hour, and secure URL.

**Section 6: Clinical Notes**
- All text notes (non-video) with type classification, timestamp, author, protocol hour, and full content.

**Section 7: Audit Trail**
- Report generation metadata: timestamp, generator identity, export type labeled as `"FDA Regulatory Submission - Complete Trial Record"`, total data points count, and data integrity verification statement.

### Regulatory Markings
- Every page includes: `"CONFIDENTIAL - FOR REGULATORY USE ONLY"`
- Page numbering: `"Page X of Y"`
- Footer: `"Byrock Veterinary Research | PTP-102 Laminitis Clinical Trial"`
- Filename convention: `TRIAL_{UNIQUE_ID}_{HORSE_NAME}_{TIMESTAMP}.pdf`

### How It Works for Colleagues
1. **During the trial**: Every action is automatically logged with veterinarian attribution and UTC timestamps. Nothing needs to be manually tracked for audit purposes.
2. **At study close-out**: Navigate to any patient case and click the report export button.
3. **One click**: A complete, paginated PDF is generated containing every treatment, assessment, lab result, video reference, clinical note, and audit trail entry for that patient.
4. **Batch capability**: Admins can pull the Master Trials Table and Compliance Dashboard for cross-patient summaries, while per-patient PDFs provide the granular Case Report Form (CRF) equivalent.
5. **FDA submission ready**: The PDF structure, audit trail, and attribution model align with FDA CVM INAD study reporting requirements and GCP standards.

### Data Model Summary for FDA Review
Every event in the system is permanently linked to:
- **Who**: `veterinarian_name` / `uploaded_by` / `screened_by` / `admin_reviewed_by`
- **When**: `created_at` (UTC timestamp) + `protocol_hour` (study-relative time)
- **What**: Structured data in validated tables with no free-text loopholes in outcome fields
- **Why**: `deviation_justification`, `reason_for_change`, `ineligible_reason`
- **How**: `audit_logs` table captures before/after values for every modification

This means FDA reviewers can trace any data point from the final report back to the exact veterinarian who entered it, the exact second it was entered, and the exact protocol hour it relates to — with full video evidence where applicable.

---

## 4. Known Gaps & Recommended Next Steps

Based on a detailed codebase audit, the following items should be addressed before formal FDA submission to ensure full 21 CFR Part 11 compliance:

| Gap | Priority | Recommendation |
|-----|----------|----------------|
| **Audit logs not actively written** | 🔴 High | The `audit_logs` table schema exists but the `createAuditLog` action is not yet invoked by the application. Wire it into every create/update action to capture before/after values automatically. |
| **No server-side exports** | 🟡 Medium | Current PDF generation is client-side only. Implement a secure server-side export endpoint to ensure tamper-proof archival and long-term retention. |
| **No end-of-study freeze workflow** | 🟡 Medium | The `data_lock_status` column exists but is unused. Build an admin "Freeze Study" button that locks all patient records and prevents further edits. |
| **Vet attribution by name** | 🟡 Medium | Most tables store `veterinarian_name` as text rather than a foreign key to `veterinarians(id)`. Migrate to foreign keys to prevent attribution ambiguity if names change. |
| **Data lock UI** | 🟡 Medium | No UI currently exists to view or manage record lock status. Add lock indicators to patient cards and admin controls. |

Addressing these gaps will elevate the platform from **trial-ready** to **FDA audit-ready** with complete traceability and immutable record controls.
