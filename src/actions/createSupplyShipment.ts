import { action } from '@uibakery/data';

function createSupplyShipment() {
  return action('createSupplyShipment', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO supply_shipment_log (
        product_name, batch_lot_number, quantity_vials, bottle_volume_ml,
        shipped_to_veterinarian_id, shipped_to_veterinarian_email,
        shipped_to_veterinarian_name, shipment_status, shipment_date,
        expected_delivery_date, tracking_number, carrier, expiration_date,
        shipment_notes, low_threshold
      )
      VALUES (
        {{params.productName}}, {{params.batchLotNumber}},
        {{params.quantityVials}}::int, {{params.bottleVolumeMl}}::int,
        {{params.shippedToVeterinarianId}}::int, {{params.shippedToVeterinarianEmail}},
        {{params.shippedToVeterinarianName}}, {{params.shipmentStatus}},
        {{params.shipmentDate}}::date, {{params.expectedDeliveryDate}}::date,
        {{params.trackingNumber}}, {{params.carrier}}, {{params.expirationDate}}::date,
        {{params.shipmentNotes}}, {{params.lowThreshold}}::int
      )
      RETURNING *;
    `,
  });
}

export default createSupplyShipment;
