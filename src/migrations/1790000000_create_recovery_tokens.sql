CREATE TABLE recovery_tokens (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       TEXT NOT NULL,
  token_hash  TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'vet')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recovery_tokens_email   ON recovery_tokens (email);
CREATE INDEX idx_recovery_tokens_expires ON recovery_tokens (expires_at);

COMMENT ON TABLE recovery_tokens IS 'Single-use password recovery tokens. SHA-256 hashed, 15-minute expiry.';
