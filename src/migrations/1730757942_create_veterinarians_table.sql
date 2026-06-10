-- Migration to create veterinarians table for T&C acceptance tracking
CREATE TABLE veterinarians (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  license_number TEXT NOT NULL,
  hospital_affiliation TEXT NOT NULL,
  tc_accepted BOOLEAN NOT NULL DEFAULT false,
  tc_accepted_at TIMESTAMPTZ,
  signature_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_veterinarians_email ON veterinarians (email);
CREATE INDEX idx_veterinarians_tc_accepted ON veterinarians (tc_accepted);
