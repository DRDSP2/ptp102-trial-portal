-- Add total_volume_ml column to treatments table

ALTER TABLE treatments
ADD COLUMN total_volume_ml NUMERIC(10, 2);
