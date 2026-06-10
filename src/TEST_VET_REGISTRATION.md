# Test Veterinarian Registration Flow

## Steps to Register as a New Veterinarian

### 1. Access Selection Screen
- Open the application
- Click "Veterinarian Access" button

### 2. Navigate to Registration
- Click "New Registration" button from the login screen

### 3. Complete Registration Form

Fill in all required fields marked with (*):

**Personal Information:**
- Full Name: Dr. Test Veterinarian
- Email: test.vet@example.com
- Password: TestPass123
- Confirm Password: TestPass123

**Professional Information:**
- Veterinary License Number: TEST-VET-001
- Hospital Affiliation: Test Equine Medical Center

### 4. Review Terms & Conditions
Scroll through the investigational drug use agreement which covers:
- Investigational status of PTP-102
- Risk acknowledgment
- Toxicity research information
- Liability terms
- Protocol compliance requirements
- Data use policies

### 5. Required Acknowledgments
Check all three required boxes:
- [ ] I acknowledge that PTP-102 is an investigational drug not approved by regulatory authorities
- [ ] I accept all treatment risks associated with administering this investigational compound
- [ ] I acknowledge that professional liability is mine and I maintain appropriate insurance coverage

### 6. Digital Signature
- Type your full name: Dr. Test Veterinarian
- This provides a legally binding electronic signature

### 7. Submit Registration
- Click "Accept Terms & Continue"
- System will:
  - Check if email already exists
  - Create new veterinarian account
  - Set tc_accepted to true
  - Log you into the application

### 8. Access Patient Management
- Upon successful registration, you'll see the patient management dashboard
- You can now enroll patients and manage cases

## Test Credentials Created

**Email:** test.vet@example.com  
**Password:** TestPass123  
**License:** TEST-VET-001  
**Hospital:** Test Equine Medical Center

## Validation Rules

- Full name: minimum 2 characters
- Email: must be valid email format
- Password: minimum 8 characters
- Passwords must match
- License number: minimum 3 characters
- Hospital affiliation: minimum 2 characters
- All three acknowledgment checkboxes must be checked
- Digital signature must be provided

## Error Handling

- **Email already exists**: Shows error message, suggests login instead
- **Missing required fields**: Shows validation summary with all missing items
- **Password mismatch**: Shows error on confirm password field
- **Database error**: Shows error message with details

## Notes

- Email is automatically normalized to lowercase and trimmed
- All timestamps (created_at, updated_at, tc_accepted_at) are set automatically
- Registration is single-step: no separate terms acceptance needed after account creation
- Once registered, veterinarian can immediately login and use the system
