-- Migration to add password authentication fields
ALTER TABLE veterinarians
ADD COLUMN password_hash TEXT,
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expires_at TIMESTAMPTZ;

CREATE INDEX idx_veterinarians_reset_token ON veterinarians (reset_token);
