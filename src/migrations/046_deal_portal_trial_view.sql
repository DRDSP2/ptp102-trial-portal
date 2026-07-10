-- Anonymised trial events view for the deal room

CREATE OR REPLACE VIEW trial_events_deal_room AS
SELECT
  trial_id,
  horse_id,
  event_type,
  (data->>'hour')::int as hour,
  (data->>'dose_mg')::numeric as dose_mg,
  data->>'outcome' as outcome,
  (data->>'pain_score')::int as pain_score,
  event_timestamp
FROM trial_events
WHERE event_type IN ('treatment', 'assessment', 'lab')
  AND data->>'vet_name' IS NULL
  AND data->>'owner_name' IS NULL;

-- RLS on the view is handled by the underlying table policy
