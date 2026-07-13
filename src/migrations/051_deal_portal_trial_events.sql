-- Trial events table for the deal room anonymised view

CREATE TABLE trial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id text NOT NULL,
  horse_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('treatment','assessment','lab','observation','adverse_event')),
  data jsonb DEFAULT '{}',
  event_timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trial_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diligence+ view anonymised trial events" ON trial_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM deal_profiles dp WHERE dp.user_id = auth.uid() AND dp.tier IN ('diligence','exclusive'))
         AND data->>'vet_name' IS NULL
         AND data->>'owner_name' IS NULL);

CREATE POLICY "Admin manage trial events" ON trial_events FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
