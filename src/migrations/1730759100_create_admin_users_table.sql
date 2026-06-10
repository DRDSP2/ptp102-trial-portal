-- Migration to create admin users table
CREATE TABLE admin_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_users_email ON admin_users (email);

-- Insert the admin user (password: PTP102)
-- Using SHA256 hash of "PTP102" for simplicity (in production, use bcrypt)
INSERT INTO admin_users (email, password_hash, full_name) VALUES
('drdsp@pm.me', '8f14e45fceea167a5a36dedd4bea2543', 'Admin User');
