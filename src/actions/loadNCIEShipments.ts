import { action } from '@uibakery/data';

function loadNCIEShipments() {
  return action('loadNCIEShipments', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      SELECT n.*, sq.site_name
      FROM ncie_shipment_log n
      LEFT JOIN site_qualifications sq ON n.shipped_to_site_id = sq.id
      ORDER BY n.shipment_date DESC;
    `,
  });
}

export default loadNCIEShipments;
