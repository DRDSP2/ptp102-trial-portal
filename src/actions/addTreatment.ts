import { action } from '@uibakery/data';

function addTreatment() {
  return action('addTreatment', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      WITH inserted_treatment AS (
        INSERT INTO treatments (
          patient_id, administration_datetime, dosage_mg, route,
          veterinarian_name, batch_number, immediate_reactions, notes, protocol_hour, total_volume_ml
        )
        VALUES (
          {{params.patientId}}::int,
          {{params.administrationDatetime}}::timestamptz,
          {{params.dosageMg}}::numeric,
          {{params.route}},
          {{params.veterinarianName}},
          {{params.batchNumber}},
          {{params.immediateReactions}},
          {{params.notes}},
          {{params.protocolHour}}::int,
          {{params.totalVolumeMl}}::numeric
        )
        RETURNING *
      ),
      updated_patient AS (
        UPDATE patients
        SET protocol_start_time = COALESCE(
          protocol_start_time,
          CASE 
            WHEN {{params.protocolHour}}::int = 0 
            THEN {{params.administrationDatetime}}::timestamptz
            ELSE NULL
          END
        )
        WHERE id = {{params.patientId}}::int
        RETURNING id
      )
      SELECT * FROM inserted_treatment;
    `,
  });
}

export default addTreatment;
