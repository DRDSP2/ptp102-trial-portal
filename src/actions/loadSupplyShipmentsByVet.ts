import { action } from '@uibakery/data';

function loadSupplyShipmentsByVet() {
  return action('loadSupplyShipmentsByVet', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT s.*, v.hospital_affiliation AS clinic_name
      FROM supply_shipment_log s
      LEFT JOIN veterinarians v ON s.shipped_to_veterinarian_id = v.id
      WHERE s.shipped_to_veterinarian_email = {{params.vetEmail}}
      ORDER BY s.created_at DESC;
    `,
  });
}

export default loadSupplyShipmentsByVet;
