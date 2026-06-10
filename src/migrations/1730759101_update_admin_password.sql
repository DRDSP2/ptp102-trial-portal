-- Migration to update admin user password to plain text
UPDATE admin_users
SET password_hash = 'PTP102'
WHERE email = 'drdsp@pm.me';
