import { action } from '@uibakery/data';

function loadSupplyShipments() {
  return action('loadSupplyShipments', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT s.*, v.hospital_affiliation AS clinic_name, v.full_name AS vet_full_name
      FROM supply_shipment_log s
      LEFT JOIN veterinarians v ON s.shipped_to_veterinarian_id = v.id
      ORDER BY s.created_at DESC;
    `,
  });
}

export default loadSupplyShipments;
