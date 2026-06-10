# Authentication System - Troubleshooting Guide

## Last Updated: 2025-11-07 (FIXES IMPLEMENTED)

## ✅ FIXES IMPLEMENTED

### 1. PASSWORD HASHING (IMPLEMENTED)
**Status**: ✅ FIXED
**Solution**: Implemented bcryptjs password hashing
- Added bcryptjs library to package.json
- Created `utils/passwordHash.ts` with hash/verify functions
- Hash passwords during registration
- Verify passwords using bcrypt.compare() during login
- All new registrations use hashed passwords
- Password reset flow uses hashed passwords

**Migration Note**: Existing plain-text passwords in database will need manual migration

### 2. EMAIL NORMALIZATION (IMPLEMENTED)
**Status**: ✅ FIXED
**Solution**: Updated all SQL queries to use case-insensitive email matching
- All actions now use `LOWER(email) = LOWER({{params.email}})`
- Consistent email normalization across:
  - veterinarianLogin
  - checkEmailExists
  - googleOAuthLogin
  - checkVeterinarianAcceptance
  - requestPasswordReset
  - All other email-based queries

### 3. CONSOLIDATED LOGIN ACTIONS (IMPLEMENTED)
**Status**: ✅ FIXED
**Solution**: Removed debug actions, streamlined login flow
- Deleted `checkStoredPassword.ts` (debug action)
- Deleted `testLoginDebug.ts` (debug action)
- Deleted `checkEmailExists.ts` (caused permission issues during signup)
- Single secure login action: `veterinarianLogin`
- Login now returns user data for password verification
- Password verification happens in React component using bcrypt
- Email uniqueness enforced by database UNIQUE constraint

### 4. IMPROVED SECURITY (IMPLEMENTED)
**Status**: ✅ FIXED
**Solution**: Enhanced security checks and flows
- Login checks: tc_accepted AND verification_status
- Proper error messages without exposing sensitive info
- Password requirements enforced: 10+ chars, upper, lower, number
- Google OAuth users handled separately (no password)

## REMAINING CONSIDERATIONS

### 1. EXISTING PASSWORD MIGRATION
**Issue**: Users registered before this fix have plain-text passwords
**Impact**: Medium - affects existing users only
**Solution Options**:
- Force password reset for all existing users
- Create one-time migration to hash existing passwords
- Handle gracefully during login (detect plain-text, migrate on login)

**Recommended**: Create migration to hash existing passwords

**Admin Note**: Admin password 'PTP102' is currently plain-text in database
- Login supports both plain-text (backward compatibility) and bcrypt
- Should be hashed using utils/setupAdmin.ts function
- Current admin email: drdsp@pm.me

### 2. RATE LIMITING
**Issue**: No rate limiting on login attempts
**Impact**: Medium - vulnerable to brute force
**Recommendation**: Implement rate limiting (5 attempts per 15 minutes)

### 3. SESSION MANAGEMENT
**Issue**: localStorage-based session (client-side only)
**Impact**: Low - acceptable for MVP
**Recommendation**: Consider JWT tokens for production

### 4. TWO-FACTOR AUTHENTICATION
**Issue**: No 2FA available
**Impact**: Low - nice to have
**Recommendation**: Add 2FA for high-security requirements

## AUTHENTICATION FLOW (UPDATED)

### Registration Flow ✅
1. User fills registration form
2. Email validated (format only - client-side)
3. Password validated (strength requirements)
4. Password hashed using bcryptjs
5. Attempt INSERT with email UNIQUE constraint
6. If duplicate email → catch error and show friendly message
7. If successful → user created with: tc_accepted=true, verification_status='pending'
8. Redirected to pending approval screen

### Login Flow ✅
1. User enters email + password
2. SQL query: `LOWER(email) = LOWER(input) AND tc_accepted=true AND verification_status='approved'`
3. Returns user data including password_hash
4. bcrypt.compare(inputPassword, storedHash)
5. If match: login successful
6. If no match: error "Invalid email or password"

### Admin Login Flow ✅
1. Admin enters email + password
2. SQL query: `LOWER(email) = LOWER(input)` with UPDATE to set last_login
3. Returns admin data including password_hash
4. Check if password_hash === 'PTP102' (backward compatibility)
   - If yes: compare plain-text password directly
   - If no: use bcrypt.compare(inputPassword, storedHash)
5. If match: login successful, persist to localStorage
6. Google OAuth: authorized admin emails (drdsp@pm.me) auto-login
7. Works across all browsers via localStorage persistence

### Password Reset Flow ✅
1. User requests reset → generates secure token
2. Token stored with 1-hour expiry
3. User submits new password
4. Password hashed using bcryptjs
5. Database updated with hashed password
6. Token cleared

### Google OAuth Flow ✅
1. User authenticates with Google
2. Extract email from JWT
3. Check if user exists (case-insensitive)
4. If exists: check tc_accepted + verification_status
5. If approved: login successful
6. If new: create user → redirect to terms acceptance

## TESTING CHECKLIST (UPDATED)

### ✅ Completed Tests
- [x] Password hashing on registration
- [x] Password verification on login
- [x] Case-insensitive email matching
- [x] Email uniqueness validation
- [x] Password strength requirements
- [x] Consolidated login action
- [x] Error message improvements
- [x] Google OAuth flow

### Remaining Tests
- [ ] Existing user password migration
- [ ] Rate limiting (if implemented)
- [ ] Session timeout
- [ ] Concurrent login attempts
- [ ] SQL injection attempts
- [ ] XSS attempts

## DATABASE SCHEMA

### veterinarians table (UPDATED)
```sql
- password_hash TEXT (now stores bcrypt hashed passwords)
- tc_accepted BOOLEAN (default false)
- verification_status TEXT (default 'pending')
- last_login TIMESTAMPTZ (updated on successful login)
- password_reset_token TEXT (secure random token)
- password_reset_expires TIMESTAMPTZ (1-hour expiry)
