import { describe, it, expect, beforeEach } from 'vitest';
import { buildStatisticalXml, buildFullXml, generateDefineXml, sanitizeXmlTag } from '@/lib/xmlExport';

describe('XML export builders', () => {
  const meta = {
    studyId: 'PTP-102',
    studyTitle: 'PTP-102 Laminitis Pilot Study',
    sponsorName: 'Byrock Technologies Ltd.',
    protocolVersion: '1.0',
    exportedAt: '2025-11-15T08:00:00.000Z',
    exportedBy: 'admin@test.com',
  };

  const patients = [
    {
      id: 1,
      unique_id: 'PTP-102-001',
      horse_name: 'Midnight Thunder',
      age: 9,
      breed: 'Thoroughbred',
      sex: 'Gelding',
      weight: 485,
      owner_name: 'Margaret Holloway',
      enrollment_date: '2025-11-14',
      consent_date: '2025-11-14',
      trial_status: 'enrolled',
      screening_status: 'approved',
      eligibility_verified: true,
      veterinarian_name: 'Dr. Test',
      veterinarian_email: 'vet@test.com',
      laminitis_grade: 1,
      treatment_count: 1,
      assessment_count: 1,
      lab_count: 1,
      note_count: 1,
      treatments: [
        {
          id: 101,
          patient_id: 1,
          administration_datetime: '2025-11-14T08:00:00.000Z',
          dosage_mg: 500,
          route: 'IV infusion',
          protocol_hour: 0,
          total_volume_ml: 500,
          veterinarian_name: 'Dr. Test',
          batch_number: 'BATCH-001',
          immediate_reactions: '',
          notes: 'First dose',
        },
      ],
      assessments: [
        {
          id: 201,
          patient_id: 1,
          assessment_datetime: '2025-11-14T08:00:00.000Z',
          protocol_hour: 0,
          obel_grade: 1,
          pain_score: 2,
          mobility_score: 1,
          digital_pulse_score: 1,
          hoof_temperature: 'Warm',
          heart_rate: 40,
          respiratory_rate: 16,
          temperature: 37.5,
          clinical_notes: 'Baseline',
          veterinarian_name: 'Dr. Test',
        },
      ],
      lab_results: [
        {
          id: 301,
          patient_id: 1,
          test_datetime: '2025-11-14T08:00:00.000Z',
          protocol_hour: 0,
          wbc: 6.5,
          rbc: 7.2,
          glucose: 85,
        },
      ],
      clinical_notes: [
        {
          id: 401,
          patient_id: 1,
          note_type: 'observation',
          note_content: 'Horse calm',
          protocol_hour: 0,
          video_url: '',
          video_file_name: '',
          video_uploaded_at: '',
          created_at: '2025-11-14T08:00:00.000Z',
        },
      ],
    },
  ];

  const auditLogs = [
    {
      id: 1,
      sequenceNumber: 1,
      timestamp: '2025-11-15T08:00:00.000Z',
      userId: 'vet@test.com',
      userEmail: 'vet@test.com',
      userRole: 'vet',
      action: 'CREATE',
      entityType: 'patient',
      entityId: 1,
      patientId: 1,
      studyId: 'PTP-102',
      fieldName: null,
      oldValue: null,
      newValue: '{"horse_name":"Midnight Thunder"}',
      reasonForChange: null,
      ipAddress: null,
      userAgent: null,
      sessionId: null,
      clientHash: 'abc123',
      previousHash: 'genesis',
    },
  ] as any;

  beforeEach(() => {
    localStorage.clear();
  });

  it('builds a valid statistical XML without audit metadata', () => {
    const xml = buildStatisticalXml(meta, patients as any);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<ptp102:clinicalStudy');
    expect(xml).toContain('<study_id>PTP-102</study_id>');
    expect(xml).toContain('<dataset name="subjects"');
    expect(xml).toContain('name="subject_id"');
    expect(xml).toContain('PTP-102-001');
    expect(xml).toContain('name="horse_name"');
    expect(xml).toContain('Midnight Thunder');
    expect(xml).not.toContain('<dataset name="audit_trail"');
  });

  it('includes every individual treatment, assessment, lab, and note record in statistical XML', () => {
    const xml = buildStatisticalXml(meta, patients as any);
    expect(xml).toContain('<dataset name="treatments" records="1">');
    expect(xml).toContain('<dataset name="assessments" records="1">');
    expect(xml).toContain('<dataset name="lab_results" records="1">');
    expect(xml).toContain('<dataset name="clinical_notes" records="1">');
    expect(xml).toContain('name="dosage_mg"');
    expect(xml).toContain('>500</field>');
    expect(xml).toContain('name="obel_grade"');
    expect(xml).toContain('name="wbc"');
    expect(xml).toContain('name="note_content"');
    expect(xml).toContain('Horse calm');
  });

  it('builds a valid full XML with audit trail dataset', () => {
    const xml = buildFullXml(meta, patients as any, auditLogs);
    expect(xml).toContain('<ptp102:clinicalStudy');
    expect(xml).toContain('<dataset name="audit_trail"');
    expect(xml).toContain('name="action"');
    expect(xml).toContain('CREATE');
    expect(xml).toContain('name="client_hash"');
    expect(xml).toContain('abc123');
    expect(xml).toContain('name="previous_hash"');
    expect(xml).toContain('genesis');
  });

  it('includes protocol deviations in both statistical and full XML', () => {
    const deviations = [
      {
        id: 1,
        patient_id: 1,
        deviation_type: 'Eligibility Exception',
        deviation_date: '2025-11-14',
        description: 'Failed inclusion/exclusion criteria',
        explanation: 'Acute flare outside standard window; sponsor approved.',
        impact_assessment: 'Major',
        corrective_action: null,
        preventive_action: null,
        created_at: '2025-11-14T08:00:00.000Z',
      },
    ];
    const statistical = buildStatisticalXml(meta, patients as any, deviations as any);
    const full = buildFullXml(meta, patients as any, auditLogs, deviations as any);
    expect(statistical).toContain('<dataset name="protocol_deviations"');
    expect(full).toContain('<dataset name="protocol_deviations"');
    expect(statistical).toContain('Eligibility Exception');
    expect(statistical).toContain('Major');
  });

  it('escapes XML special characters in values', () => {
    const patientsWithSpecialChars = [
      {
        ...patients[0],
        horse_name: 'Test <horse> & "friend"',
      },
    ];
    const xml = buildStatisticalXml(meta, patientsWithSpecialChars as any);
    expect(xml).toContain('Test &lt;horse&gt; &amp; &quot;friend&quot;');
    expect(xml).not.toContain('Test <horse>');
  });

  describe('XML naming constraints', () => {
    it('sanitizes invalid characters and truncates to 32 chars', () => {
      expect(sanitizeXmlTag('horse body-weight (kg)')).toBe('horse_body_weight_kg');
      expect(sanitizeXmlTag('123starts-with-number')).toBe('_123starts_with_number');
      expect(sanitizeXmlTag('a'.repeat(40)).length).toBe(32);
    });

    it('uses only alphanumeric and underscore characters in field names', () => {
      const xml = buildStatisticalXml(meta, patients as any);
      const nameMatches = xml.match(/name="([^"]+)"/g) || [];
      expect(nameMatches.length).toBeGreaterThan(0);
      for (const match of nameMatches) {
        const name = match.replace(/name="([^"]+)"/, '$1');
        expect(name).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
        expect(name.length).toBeLessThanOrEqual(32);
      }
    });
  });

  describe('define.xml generation', () => {
    it('generates a CDISC-like define.xml with ODM root', () => {
      const define = generateDefineXml('PTP-102');
      expect(define).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(define).toContain('<ODM');
      expect(define).toContain('FileType="Snapshot"');
      expect(define).toContain('<Study OID="PTP-102">');
      expect(define).toContain('<MetaDataVersion');
    });

    it('includes variable names, labels, types, lengths, units and sources', () => {
      const define = generateDefineXml('PTP-102');
      expect(define).toContain('<ItemDef');
      expect(define).toContain('Name="horse_name"');
      expect(define).toContain('Horse name');
      expect(define).toContain('DataType="char"');
      expect(define).toContain('DataType="num"');
      expect(define).toContain('DataType="date"');
      expect(define).toContain('<MeasurementUnitRef');
      expect(define).toContain('CRF Page 1');
      expect(define).toContain('EDC system');
    });

    it('includes codelists with controlled terminology', () => {
      const define = generateDefineXml('PTP-102');
      expect(define).toContain('<CodeList');
      expect(define).toContain('OID="CL.obel_grade"');
      expect(define).toContain('CodedValue="3"');
      expect(define).toContain('Severe');
      expect(define).toContain('OID="CL.trial_status"');
      expect(define).toContain('OID="CL.user_role"');
      expect(define).toContain('OID="CL.audit_action"');
    });

    it('documents all dataset item groups', () => {
      const define = generateDefineXml('PTP-102');
      expect(define).toContain('ItemGroupOID="IG.subjects"');
      expect(define).toContain('ItemGroupOID="IG.treatments"');
      expect(define).toContain('ItemGroupOID="IG.assessments"');
      expect(define).toContain('ItemGroupOID="IG.lab_results"');
      expect(define).toContain('ItemGroupOID="IG.clinical_notes"');
      expect(define).toContain('ItemGroupOID="IG.protocol_deviations"');
      expect(define).toContain('ItemGroupOID="IG.audit_trail"');
    });

    it('uses variable names not exceeding 32 characters', () => {
      const define = generateDefineXml('PTP-102');
      const nameMatches = define.match(/Name="([^"]+)"/g) || [];
      const names = nameMatches.map((m) => m.replace(/Name="([^"]+)"/, '$1'));
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        expect(name.length).toBeLessThanOrEqual(32);
      }
    });

    it('includes export metadata in the annotation', () => {
      const define = generateDefineXml('PTP-102', '2025-11-15T08:00:00.000Z', 'admin@test.com');
      expect(define).toContain('CreationDateTime="2025-11-15T08:00:00.000Z"');
      expect(define).toContain('exported by admin@test.com');
    });
  });
});
