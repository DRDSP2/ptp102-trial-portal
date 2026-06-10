-- Migration to set password for drdsp@pm.me veterinarian account
UPDATE veterinarians
SET password_hash = 'PTP102'
WHERE email = 'drdsp@pm.me';
