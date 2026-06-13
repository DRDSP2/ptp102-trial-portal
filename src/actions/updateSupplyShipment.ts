import { action } from '@uibakery/data';

function updateSupplyShipment() {
  return action('updateSupplyShipment', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      UPDATE supply_shipment_log
      SET
        shipment_status = COALESCE({{params.shipmentStatus}}, shipment_status),
        received_at = COALESCE({{params.receivedAt}}, received_at),
        receiving_signature = COALESCE({{params.receivingSignature}}, receiving_signature),
        condition_on_receipt = COALESCE({{params.conditionOnReceipt}}, condition_on_receipt),
        storage_temperature_celsius = COALESCE({{params.storageTemperatureCelsius}}, storage_temperature_celsius),
        received_by_clinic_name = COALESCE({{params.receivedByClinicName}}, received_by_clinic_name),
        received_by_clinic_date = COALESCE({{params.receivedByClinicDate}}, received_by_clinic_date),
        bottles_received_at_clinic = COALESCE({{params.bottlesReceivedAtClinic}}, bottles_received_at_clinic),
        shipment_notes = COALESCE({{params.shipmentNotes}}, shipment_notes),
        delivered_date = COALESCE({{params.deliveredDate}}, delivered_date),
        carrier = COALESCE({{params.carrier}}, carrier),
        expected_delivery_date = COALESCE({{params.expectedDeliveryDate}}, expected_delivery_date),
        tracking_number = COALESCE({{params.trackingNumber}}, tracking_number),
        updated_at = NOW()
      WHERE id = {{params.shipmentId}}::int
      RETURNING *;
    `,
  });
}

export default updateSupplyShipment;
