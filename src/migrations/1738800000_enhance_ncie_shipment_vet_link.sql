-- ============================================================================
-- Enhance NCIE Shipment Log for Vet-Specific Tracking
-- ============================================================================

ALTER TABLE ncie_shipment_log
ADD COLUMN IF NOT EXISTS shipped_to_veterinarian_id BIGINT REFERENCES veterinarians(id),
ADD COLUMN IF NOT EXISTS shipped_to_veterinarian_email TEXT,
ADD COLUMN IF NOT EXISTS shipped_to_veterinarian_name TEXT,
ADD COLUMN IF NOT EXISTS shipment_status TEXT NOT NULL DEFAULT 'pending_dispatch'
  CHECK (shipment_status IN ('pending_dispatch', 'dispatched', 'in_transit', 'held_at_customs', 'delivered', 'delivery_issue', 'received_by_clinic')),
ADD COLUMN IF NOT EXISTS carrier TEXT,
ADD COLUMN IF NOT EXISTS expected_delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS condition_on_receipt TEXT,
ADD COLUMN IF NOT EXISTS storage_temperature_celsius NUMERIC(4,1),
ADD COLUMN IF NOT EXISTS received_by_clinic_name TEXT,
ADD COLUMN IF NOT EXISTS received_by_clinic_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bottles_received_at_clinic INT,
ADD COLUMN IF NOT EXISTS shipment_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_ncie_vet ON ncie_shipment_log(shipped_to_veterinarian_id);
CREATE INDEX IF NOT EXISTS idx_ncie_vet_email ON ncie_shipment_log(shipped_to_veterinarian_email);
CREATE INDEX IF NOT EXISTS idx_ncie_status ON ncie_shipment_log(shipment_status);

-- Backfill existing rows with default status if they have a received_at timestamp
UPDATE ncie_shipment_log
SET shipment_status = CASE
  WHEN received_at IS NOT NULL THEN 'received_by_clinic'
  ELSE 'pending_dispatch'
END
WHERE shipment_status IS NULL;
