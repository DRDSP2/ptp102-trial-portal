-- Persist deal room terms/privacy consent in the existing deal access audit table.

ALTER TABLE deal_access_logs DROP CONSTRAINT IF EXISTS deal_access_logs_action_check;
ALTER TABLE deal_access_logs
  ADD CONSTRAINT deal_access_logs_action_check
  CHECK (action IN ('view','download','share','edit','propose_term_sheet','terms_consent'));

ALTER TABLE deal_access_logs ADD COLUMN IF NOT EXISTS action_detail text;

CREATE UNIQUE INDEX IF NOT EXISTS deal_access_logs_unique_terms_consent
  ON deal_access_logs (user_id, action, document_type)
  WHERE action = 'terms_consent';
