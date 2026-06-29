import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Reusable PostgREST builder mock. Each test sets `currentResponse` before
// triggering the dispatcher branch and inspects `lastTable` / `lastOp` /
// `lastInsertArg` after.
type SupaResponse = { data: unknown; error: { message: string } | null };
let currentResponse: SupaResponse = { data: null, error: null };
let lastTable: string | null = null;
let lastOp: 'select' | 'insert' | 'update' | null = null;
let lastInsertArg: unknown = null;
let lastUpdateArg: unknown = null;

function thenable() {
  const chain: Record<string, unknown> = {};
  const passthrough = () => chain;
  chain.select = passthrough;
  chain.order = passthrough;
  chain.eq = passthrough;
  chain.or = passthrough;
  chain.update = (arg: unknown) => {
    lastOp = 'update';
    lastUpdateArg = arg;
    return chain;
  };
  chain.insert = (arg: unknown) => {
    lastOp = 'insert';
    lastInsertArg = arg;
    return chain;
  };
  chain.then = (resolve: (v: SupaResponse) => unknown) => Promise.resolve(currentResponse).then(resolve);
  chain.single = () => Promise.resolve(currentResponse);
  chain.maybeSingle = () => Promise.resolve(currentResponse);
  return chain;
}

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn((table: string) => {
      lastTable = table;
      lastOp = 'select';
      return thenable();
    }),
    functions: { invoke: vi.fn() },
  },
}));

import { renderHook, act } from '@testing-library/react';
import { useMutateAction } from '@/lib/uibakeryDataMock';
import addTreatment from '@/actions/addTreatment';
import addClinicalAssessment from '@/actions/addClinicalAssessment';
import addClinicalNote from '@/actions/addClinicalNote';
import addLabResult from '@/actions/addLabResult';
import { flags } from '@/lib/featureFlags';

function reset() {
  currentResponse = { data: null, error: null };
  lastTable = null;
  lastOp = null;
  lastInsertArg = null;
  lastUpdateArg = null;
}

beforeEach(async () => {
  localStorage.clear();
  reset();
  // Reset `from` to the default factory implementation so each test starts
  // from a clean slate. Without this, a `mockImplementation()` call in one
  // test leaks into the next.
  const { supabase } = await import('@/lib/supabase/client');
  (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    lastTable = table;
    lastOp = 'select';
    return thenable();
  });
});

afterEach(() => {
  flags.treatments = false;
  flags.clinicalAssessments = false;
  flags.clinicalNotes = false;
  flags.labResults = false;
});

describe('child tables data layer feature flags', () => {
  it('with flag OFF, addTreatment uses mock (no supabase.from call)', async () => {
    flags.treatments = false;
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as ReturnType<typeof vi.fn>).mockClear();

    const { result } = renderHook(() => useMutateAction(addTreatment));
    const mutate = result.current[0];
    await act(async () => {
      await mutate({
        patientId: 1,
        administrationDatetime: '2026-01-01T00:00:00Z',
        dosageMg: 100,
        route: 'IV',
        veterinarianName: 'Vet',
        protocolHour: 1,
      });
    });
    expect((supabase.from as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it('with flag ON, addTreatment inserts into the treatments table', async () => {
    flags.treatments = true;
    currentResponse = {
      data: {
        id: 99,
        patient_id: 1,
        administration_datetime: '2026-01-01T00:00:00Z',
        dosage_mg: 100,
        route: 'IV',
        veterinarian_name: 'Vet',
        protocol_hour: 3,
      },
      error: null,
    };

    const { result } = renderHook(() => useMutateAction(addTreatment));
    const mutate = result.current[0];
    let returned: unknown;
    await act(async () => {
      returned = await mutate({
        patientId: 1,
        administrationDatetime: '2026-01-01T00:00:00Z',
        dosageMg: 100,
        route: 'IV',
        veterinarianName: 'Vet',
        protocolHour: 3,
      });
    });
    expect(lastTable).toBe('treatments');
    expect(lastOp).toBe('insert');
    expect(lastInsertArg).toMatchObject({
      patient_id: 1,
      dosage_mg: 100,
      route: 'IV',
      veterinarian_name: 'Vet',
      protocol_hour: 3,
    });
    expect(Array.isArray(returned)).toBe(true);
    expect((returned as Array<{ id: number }>)[0].id).toBe(99);
  });

  it('with flag ON, addTreatment hour=0 also updates patients.protocol_start_time when not set', async () => {
    flags.treatments = true;
    // Sequence of `from()` calls during the dispatcher branch:
    //   1. treatments.insert       -> treatment row
    //   2. patients.select  (getById) -> patient row with no start time
    //   3. patients.update          -> setting protocol_start_time
    const responses: SupaResponse[] = [
      { data: { id: 100, patient_id: 7, protocol_hour: 0 }, error: null },
      { data: { id: 7, protocol_start_time: null }, error: null },
      { data: null, error: null },
    ];
    let call = 0;
    const tableSequence: string[] = [];
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      tableSequence.push(table);
      lastTable = table;
      lastOp = 'select';
      currentResponse = responses[call] ?? { data: null, error: null };
      call += 1;
      return thenable();
    });

    const { result } = renderHook(() => useMutateAction(addTreatment));
    const mutate = result.current[0];
    await act(async () => {
      await mutate({
        patientId: 7,
        administrationDatetime: '2026-01-01T00:00:00Z',
        dosageMg: 100,
        route: 'IV',
        veterinarianName: 'Vet',
        protocolHour: 0,
      });
    });

    // The dispatcher should hit treatments (insert) then patients twice
    // (getById select, then protocol_start_time update).
    expect(tableSequence).toEqual(['treatments', 'patients', 'patients']);
    expect(lastUpdateArg).toMatchObject({ protocol_start_time: '2026-01-01T00:00:00Z' });
  });

  it('with flag ON, addTreatment hour=0 skips patient update when start time already set', async () => {
    flags.treatments = true;
    const responses: SupaResponse[] = [
      { data: { id: 101, patient_id: 8, protocol_hour: 0 }, error: null },
      { data: { id: 8, protocol_start_time: '2025-12-31T00:00:00Z' }, error: null },
    ];
    let call = 0;
    const tableSequence: string[] = [];
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      tableSequence.push(table);
      lastTable = table;
      lastOp = 'select';
      currentResponse = responses[call] ?? { data: null, error: null };
      call += 1;
      return thenable();
    });

    const { result } = renderHook(() => useMutateAction(addTreatment));
    await act(async () => {
      await result.current[0]({
        patientId: 8,
        administrationDatetime: '2026-01-01T00:00:00Z',
        dosageMg: 50,
        route: 'IV',
        veterinarianName: 'Vet',
        protocolHour: 0,
      });
    });

    // Only treatments insert + patients select. NO patients update.
    expect(tableSequence).toEqual(['treatments', 'patients']);
  });

  it('with flag ON, addClinicalAssessment inserts into clinical_assessments', async () => {
    flags.clinicalAssessments = true;
    currentResponse = {
      data: { id: 50, patient_id: 1, assessment_datetime: '2026-01-01T00:00:00Z', veterinarian_name: 'Vet' },
      error: null,
    };
    const { result } = renderHook(() => useMutateAction(addClinicalAssessment));
    await act(async () => {
      await result.current[0]({
        patientId: 1,
        assessmentDatetime: '2026-01-01T00:00:00Z',
        veterinarianName: 'Vet',
        obelGrade: 2,
      });
    });
    expect(lastTable).toBe('clinical_assessments');
    expect(lastOp).toBe('insert');
    expect(lastInsertArg).toMatchObject({
      patient_id: 1,
      obel_grade: 2,
      veterinarian_name: 'Vet',
    });
  });

  it('with flag ON, addClinicalNote inserts into clinical_notes', async () => {
    flags.clinicalNotes = true;
    currentResponse = {
      data: { id: 60, patient_id: 1, note_type: 'general', note_content: 'hi', veterinarian_name: 'Vet' },
      error: null,
    };
    const { result } = renderHook(() => useMutateAction(addClinicalNote));
    await act(async () => {
      await result.current[0]({
        patientId: 1,
        veterinarianName: 'Vet',
        noteType: 'general',
        noteContent: 'hi',
      });
    });
    expect(lastTable).toBe('clinical_notes');
    expect(lastOp).toBe('insert');
    expect(lastInsertArg).toMatchObject({
      patient_id: 1,
      note_type: 'general',
      note_content: 'hi',
      veterinarian_name: 'Vet',
    });
  });

  it('with flag ON, addLabResult inserts into lab_results', async () => {
    flags.labResults = true;
    currentResponse = {
      data: { id: 70, patient_id: 1, test_datetime: '2026-01-01T00:00:00Z' },
      error: null,
    };
    const { result } = renderHook(() => useMutateAction(addLabResult));
    await act(async () => {
      await result.current[0]({
        patientId: 1,
        testDatetime: '2026-01-01T00:00:00Z',
        wbc: 7.5,
        creatinine: 1.2,
      });
    });
    expect(lastTable).toBe('lab_results');
    expect(lastOp).toBe('insert');
    expect(lastInsertArg).toMatchObject({
      patient_id: 1,
      wbc: 7.5,
      creatinine: 1.2,
    });
  });

  it('flags are independent: turning on clinicalNotes does NOT divert addTreatment', async () => {
    flags.clinicalNotes = true;
    flags.treatments = false;
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as ReturnType<typeof vi.fn>).mockClear();

    const { result } = renderHook(() => useMutateAction(addTreatment));
    await act(async () => {
      await result.current[0]({
        patientId: 1,
        administrationDatetime: '2026-01-01T00:00:00Z',
        dosageMg: 100,
        route: 'IV',
        veterinarianName: 'Vet',
        protocolHour: 1,
      });
    });
    expect((supabase.from as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});
