import { action } from '@uibakery/data';

function addLabResult() {
  return action('addLabResult', 'SQL', {
    databaseName: 'laminitis_trial_db',
    query: `
      INSERT INTO lab_results (
        patient_id, test_datetime, protocol_hour,
        wbc, rbc, hemoglobin, hematocrit, platelets,
        glucose, creatinine, bun, alt, ast, alkaline_phosphatase,
        total_protein, albumin, serum_amyloid_a, fibrinogen, lactate, additional_notes
      )
      VALUES (
        {{params.patientId}}::int,
        {{params.testDatetime}}::timestamptz,
        CASE WHEN {{params.protocolHour}} IS NULL THEN NULL ELSE {{params.protocolHour}}::int END,
        CASE WHEN {{params.wbc}} IS NULL THEN NULL ELSE {{params.wbc}}::numeric END,
        CASE WHEN {{params.rbc}} IS NULL THEN NULL ELSE {{params.rbc}}::numeric END,
        CASE WHEN {{params.hemoglobin}} IS NULL THEN NULL ELSE {{params.hemoglobin}}::numeric END,
        CASE WHEN {{params.hematocrit}} IS NULL THEN NULL ELSE {{params.hematocrit}}::numeric END,
        CASE WHEN {{params.platelets}} IS NULL THEN NULL ELSE {{params.platelets}}::numeric END,
        CASE WHEN {{params.glucose}} IS NULL THEN NULL ELSE {{params.glucose}}::numeric END,
        CASE WHEN {{params.creatinine}} IS NULL THEN NULL ELSE {{params.creatinine}}::numeric END,
        CASE WHEN {{params.bun}} IS NULL THEN NULL ELSE {{params.bun}}::numeric END,
        CASE WHEN {{params.alt}} IS NULL THEN NULL ELSE {{params.alt}}::numeric END,
        CASE WHEN {{params.ast}} IS NULL THEN NULL ELSE {{params.ast}}::numeric END,
        CASE WHEN {{params.alkalinePhosphatase}} IS NULL THEN NULL ELSE {{params.alkalinePhosphatase}}::numeric END,
        CASE WHEN {{params.totalProtein}} IS NULL THEN NULL ELSE {{params.totalProtein}}::numeric END,
        CASE WHEN {{params.albumin}} IS NULL THEN NULL ELSE {{params.albumin}}::numeric END,
        CASE WHEN {{params.serumAmyloidA}} IS NULL THEN NULL ELSE {{params.serumAmyloidA}}::numeric END,
        CASE WHEN {{params.fibrinogen}} IS NULL THEN NULL ELSE {{params.fibrinogen}}::numeric END,
        CASE WHEN {{params.lactate}} IS NULL THEN NULL ELSE {{params.lactate}}::numeric END,
        {{params.additionalNotes}}
      )
      RETURNING *;
    `,
  });
}

export default addLabResult;
