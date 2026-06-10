-- Backfill total_volume_ml for existing treatments by parsing notes field

UPDATE treatments
SET total_volume_ml = 
  CASE 
    WHEN notes LIKE '%Volume: %mL%' THEN
      CAST(
        SUBSTRING(
          notes FROM 'Volume: ([0-9.]+)mL'
        ) AS NUMERIC
      )
    ELSE NULL
  END
WHERE total_volume_ml IS NULL AND notes IS NOT NULL AND notes LIKE '%Volume: %mL%';
