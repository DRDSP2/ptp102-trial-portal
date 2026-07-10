-- Deal access audit trail

CREATE TABLE deal_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  document_id uuid,
  document_type text,
  action text NOT NULL CHECK (action IN ('view','download','share','edit','propose_term_sheet')),
  ip_address inet,
  user_agent text,
  watermarked_snapshot_path text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE deal_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own logs" ON deal_access_logs FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admin view all logs" ON deal_access_logs FOR SELECT
  USING (is_admin());
CREATE POLICY "Authenticated insert logs" ON deal_access_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
