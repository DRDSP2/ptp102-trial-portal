import { describe, expect, it, beforeAll } from 'vitest';
import { buildStoragePath, parseOwnerFromPath } from '@/lib/upload/path';
import { canAccessPath } from '@/lib/upload/access';
import { fetchAnalyze, fetchHealth } from '@/lib/computeApi';

function makeUser(id: string, role: 'admin' | 'vet' | null) {
  return {
    id,
    app_metadata: { role },
    user_metadata: {},
  } as unknown as import('@supabase/supabase-js').User;
}

describe('x-ray measurement reproducibility', () => {
  const testLandmarks = [
    { name: 'coronary_band', x: 50, y: 20 },
    { name: 'toe_tip', x: 50, y: 80 },
    { name: 'heel_ground', x: 20, y: 80 },
    { name: 'toe_ground', x: 60, y: 80 },
    { name: 'extensor_process', x: 50, y: 35 },
    { name: 'p3_tip', x: 50, y: 75 },
    { name: 'p3_heel', x: 25, y: 70 },
    { name: 'p2_pastern_top', x: 50, y: 10 },
    { name: 'p2_pastern_bottom', x: 50, y: 25 },
  ];

  let backendAvailable = false;

  beforeAll(async () => {
    try {
      await fetchHealth();
      backendAvailable = true;
    } catch {
      backendAvailable = false;
    }
  });

  it('returns identical measurements for identical landmarks', async () => {
    if (!backendAvailable) {
      console.warn('Skipping: compute backend not available on localhost:8000');
      return;
    }

    const run1 = await fetchAnalyze(testLandmarks, { x: 0.1, y: 0.1 });
    const run2 = await fetchAnalyze(testLandmarks, { x: 0.1, y: 0.1 });

    expect(run1.measurements).toHaveLength(run2.measurements.length);
    for (let i = 0; i < run1.measurements.length; i++) {
      expect(run1.measurements[i].metric).toBe(run2.measurements[i].metric);
      expect(run1.measurements[i].value).toBeCloseTo(run2.measurements[i].value, 5);
      expect(run1.measurements[i].severity).toBe(run2.measurements[i].severity);
    }

    expect(run1.analysis.overall_severity).toBe(run2.analysis.overall_severity);
    expect(run1.analysis.score).toBeCloseTo(run2.analysis.score, 5);
  }, { timeout: 10000 });

  it('returns consistent analysis with pixel spacing', async () => {
    if (!backendAvailable) {
      console.warn('Skipping: compute backend not available');
      return;
    }

    const result = await fetchAnalyze(testLandmarks, { x: 0.1, y: 0.1 });
    expect(result.analysis).toHaveProperty('overall_severity');
    expect(result.analysis).toHaveProperty('score');
    expect(result.analysis).toHaveProperty('recommendations');
    expect(result.measurements.length).toBeGreaterThan(0);
    expect(result.measurements.every((m: any) => typeof m.value === 'number')).toBe(true);
  }, { timeout: 10000 });
});

describe('x-ray storage RLS enforcement', () => {
  const xrayPath = buildStoragePath({
    category: 'patient-media',
    entityType: 'patients',
    entityId: 42,
    userId: 'vet-1',
    fileName: 'hoof_lateral.jpg',
  });

  it('allows vets to access their own x-ray uploads', () => {
    expect(canAccessPath(makeUser('vet-1', 'vet'), xrayPath)).toBe(true);
  });

  it('denies vets access to another vets x-ray uploads', () => {
    expect(canAccessPath(makeUser('vet-2', 'vet'), xrayPath)).toBe(false);
  });

  it('allows admins to access any x-ray upload', () => {
    expect(canAccessPath(makeUser('admin-1', 'admin'), xrayPath)).toBe(true);
  });

  it('places userId in the correct path segment for RLS', () => {
    const parts = xrayPath.split('/');
    expect(parts[0]).toBe('patient-media');
    expect(parts[1]).toBe('vet-1');
    expect(parts[2]).toBe('patients');
    expect(parts[3]).toBe('42');
  });

  it('extracts owner from x-ray path correctly', () => {
    expect(parseOwnerFromPath(xrayPath)).toBe('vet-1');
  });
});

describe('x-ray upload path convention', () => {
  it('generates xray paths under patient-media category', () => {
    const path = buildStoragePath({
      category: 'patient-media',
      entityType: 'patients',
      entityId: 99,
      userId: 'uuid-123',
      fileName: 'xray.jpg',
    });
    expect(path.startsWith('patient-media/uuid-123/patients/99/')).toBe(true);
    expect(path.endsWith('.jpg')).toBe(true);
  });
});
