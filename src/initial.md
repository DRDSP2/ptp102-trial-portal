# Requirements
## Summary
A veterinary clinical trial management application for tracking horses enrolled in a laminitis trial of PTP-102. The app enables veterinary hospital staff to manage patient enrollment, record treatment administration, document clinical assessments, and monitor trial progress. It provides structured data collection for regulatory compliance and ensures consistent protocol adherence across the trial duration.

## Use cases
- Enroll and manage trial patients
  1) View list of all horses enrolled in the trial
  2) Add new horse to the trial with baseline information (name, age, breed, weight, owner contact)
  3) Record eligibility criteria verification and informed consent
  4) View and update patient demographics and trial status

- Record treatment administration
  1) Select a patient from the enrolled list
  2) Log PTP-102 treatment administration (date, time, dosage, route, administering veterinarian)
  3) Record any immediate reactions or observations
  4) View complete treatment history for each patient

- Document clinical assessments
  1) Access patient assessment form
  2) Record laminitis severity score using standardized grading system
  3) Document vital signs (temperature, heart rate, respiratory rate)
  4) Add clinical notes and digital hoof images
  5) Track assessment dates against protocol schedule

- Monitor trial progress
  1) View dashboard with trial enrollment metrics
  2) Track protocol compliance for each patient
  3) Identify upcoming scheduled assessments
  4) Generate patient status reports

## Plan
### Enroll and manage trial patients
1. [x] Create database schema for patients table with fields: id, horse_name, age, breed, weight, sex, owner_name, owner_contact, enrollment_date, trial_status, eligibility_verified, consent_date
2. [x] Generate sample patient data (15-20 horses in various trial stages)
3. [x] Build patients list page with table displaying key patient information
4. [x] Add filtering by trial status (screening, enrolled, completed, withdrawn)
5. [x] Create patient enrollment form with validation for required fields
6. [x] Implement patient detail view showing complete demographics and trial timeline
7. [x] Add ability to update patient status and contact information

### Record treatment administration
1. [] Create treatments table schema with fields: id, patient_id, administration_date, administration_time, dosage_mg, route, veterinarian_name, batch_number, immediate_reactions, notes
2. [] Generate sample treatment records linked to patients
3. [] Build treatment logging form with patient selector
4. [] Add dosage calculator based on patient weight
5. [] Implement treatment history view showing chronological administration records
6. [] Add validation to prevent duplicate treatments on same date
7. [] Create treatment schedule tracker showing next due dates

### Document clinical assessments
1. [] Create assessments table schema with fields: id, patient_id, assessment_date, assessment_type, lameness_grade, digital_pulse_score, hoof_temperature, heart_rate, respiratory_rate, temperature, pain_score, clinical_notes, veterinarian_name
2. [] Generate sample assessment data across trial timeline
3. [] Build assessment form with standardized laminitis scoring (Obel grading 0-4)
4. [] Add vital signs input section with normal range indicators
5. [] Implement assessment history view with trend visualization
6. [] Add ability to attach notes and flag adverse events
7. [] Create protocol schedule checklist showing completed vs pending assessments

### Monitor trial progress
1. [] Build trial dashboard with enrollment statistics card
2. [] Add treatment compliance metrics showing administration adherence
3. [] Create upcoming assessments widget with overdue highlighting
4. [] Implement patient status distribution chart
5. [] Add adverse events summary section
6. [] Create exportable patient report with complete trial participation data

