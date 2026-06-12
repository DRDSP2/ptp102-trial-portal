import { describe, it, expect, beforeEach } from 'vitest';
import { buildStatisticalXml, buildFullXml, generateDefineXml } from '@/lib/xmlExport';

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
      treatment_count: 2,
      assessment_count: 3,
      lab_count: 2,
      note_count: 1,
      treatments: [],
      assessments: [],
      lab_results: [],
      clinical_notes: [],
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
    expect(xml).toContain('<studyId>PTP-102</studyId>');
    expect(xml).toContain('<subjectId>PTP-102-001</subjectId>');
    expect(xml).toContain('<horseName>Midnight Thunder</horseName>');
    expect(xml).not.toContain('<auditTrail');
  });

  it('builds a valid full XML with audit trail and field metadata', () => {
    const xml = buildFullXml(meta, patients as any, auditLogs);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<ptp102:clinicalStudy');
    expect(xml).toContain('<auditTrail');
    expect(xml).toContain('<auditEvent>');
    expect(xml).toContain('<clientHash>abc123</clientHash>');
    expect(xml).toContain('<demographics>');
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
