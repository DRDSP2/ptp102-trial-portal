-- Migration to fix admin authentication with bcrypt and add last_login
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Note: The password 'PTP102' needs to be hashed using bcrypt
-- This will be done by the application after this migration
-- Current plain text password will be replaced with bcrypt hash
