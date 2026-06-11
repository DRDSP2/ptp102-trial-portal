import { action } from '@uibakery/data';

function loadNCIEShipmentsByVet() {
  return action('loadNCIEShipmentsByVet', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT
        id,
        shipment_date,
        quantity_vials,
        quantity_ml_total,
        batch_lot_number,
        expiration_date,
        shipped_to_site_id,
        shipped_to_investigator,
        shipped_to_veterinarian_id,
        shipped_to_veterinarian_email,
        shipped_to_veterinarian_name,
        shipment_status,
        carrier,
        expected_delivery_date,
        delivered_date,
        receiving_signature,
        received_at,
        condition_on_receipt,
        storage_temperature_celsius,
        received_by_clinic_name,
        received_by_clinic_date,
        bottles_received_at_clinic,
        shipment_notes,
        tracking_number,
        created_at
      FROM ncie_shipment_log
      WHERE shipped_to_veterinarian_email = {{params.vetEmail}}
      ORDER BY created_at DESC;
    `,
  });
}

export default loadNCIEShipmentsByVet;
