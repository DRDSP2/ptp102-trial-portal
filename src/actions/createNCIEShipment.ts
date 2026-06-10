import { action } from '@uibakery/data';

function createNCIEShipment() {
  return action('createNCIEShipment', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO ncie_shipment_log (
        shipment_date, quantity_vials, quantity_ml_total, batch_lot_number,
        expiration_date, shipped_to_site_id, shipped_to_investigator,
        receiving_signature, received_at, condition_on_receipt,
        storage_temperature_celsius, tracking_number
      )
      VALUES (
        {{params.shipmentDate}}::date, {{params.quantityVials}}::int,
        {{params.quantityMlTotal}}::numeric, {{params.batchLotNumber}},
        {{params.expirationDate}}::date, {{params.shippedToSiteId}}::int,
        {{params.shippedToInvestigator}}, {{params.receivingSignature}},
        {{params.receivedAt}}::timestamptz, {{params.conditionOnReceipt}},
        {{params.storageTemperatureCelsius}}::numeric, {{params.trackingNumber}}
      )
      RETURNING *;
    `,
  });
}

export default createNCIEShipment;
