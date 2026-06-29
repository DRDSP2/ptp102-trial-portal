import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Build a single, reusable supabase client mock. `from()` returns a chain
// that resolves to the value placed in `currentResponse`. Tests set that
// value before triggering the dispatcher branch.
type SupaResponse = { data: unknown; error: { message: string } | null };
let currentResponse: SupaResponse = { data: null, error: null };
let lastTable: string | null = null;
let lastOp: 'select' | 'insert' | 'update' | null = null;
let lastUpdateArg: unknown = null;
let lastInsertArg: unknown = null;
let lastOrArg: unknown = null;

function thenable() {
  // Mimics the PostgREST builder: every chainable method returns `this`,
  // and awaiting the builder resolves with `currentResponse`. `single()`
  // and `maybeSingle()` end the chain by also returning the response.
  const chain: Record<string, unknown> = {};
  const passthrough = () => chain;
  chain.select = passthrough;
  chain.order = passthrough;
  chain.eq = passthrough;
  chain.or = (arg: unknown) => {
    lastOrArg = arg;
    return chain;
  };
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

import { renderHook, waitFor, act } from '@testing-library/react';
import { useLoadAction, useMutateAction } from '@/lib/uibakeryDataMock';
import loadPatients from '@/actions/loadPatients';
import createPatient from '@/actions/createPatient';
import updatePatient from '@/actions/updatePatient';
import updatePatientFlag from '@/actions/updatePatientFlag';
import { flags } from '@/lib/featureFlags';

function setFlag(value: boolean) {
  flags.patients = value;
}

beforeEach(() => {
  localStorage.clear();
  currentResponse = { data: null, error: null };
  lastTable = null;
  lastOp = null;
  lastUpdateArg = null;
  lastInsertArg = null;
  lastOrArg = null;
});

afterEach(() => {
  setFlag(false);
});

describe('patients data layer feature flag', () => {
  it('with flag OFF, loadPatients reads from the mock (no supabase.from call)', async () => {
    setFlag(false);
    const { supabase } = await import('@/lib/supabase/client');
    const fromSpy = supabase.from as unknown as ReturnType<typeof vi.fn>;
    fromSpy.mockClear();

    const { result } = renderHook(() =>
      useLoadAction(loadPatients, [], { status: null }),
    );

    await waitFor(() => {
      // First tuple slot is `data`; the mock seeds patients on first read.
      expect(Array.isArray(result.current[0])).toBe(true);
    });
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it('with flag ON, loadPatients reads from Supabase patients table', async () => {
    setFlag(true);
    currentResponse = {
      data: [{ id: 1, horse_name: 'FlagOn', enrolled_by_vet_email: 'a@a.test' }],
      error: null,
    };

    const { result } = renderHook(() =>
      useLoadAction(loadPatients, [], { status: null }),
    );

    await waitFor(() => {
      const rows = result.current[0] as Array<{ horse_name: string }>;
      expect(rows.length).toBe(1);
      expect(rows[0].horse_name).toBe('FlagOn');
    });
    expect(lastTable).toBe('patients');
  });

  it('with flag ON, loadPatients filter status produces an OR predicate', async () => {
    setFlag(true);
    currentResponse = { data: [], error: null };

    const { result } = renderHook(() =>
      useLoadAction(loadPatients, [], { status: 'screening' }),
    );
    await waitFor(() => {
      expect(Array.isArray(result.current[0])).toBe(true);
    });
    expect(lastOrArg).toBe('trial_status.eq.screening,screening_status.eq.screening');
  });

  it('with flag ON, createPatient routes the insert to the patients table', async () => {
    setFlag(true);
    currentResponse = {
      data: {
        id: 42,
        horse_name: 'NewHorse',
        owner_name: 'Owner',
        trial_status: 'screening',
        enrolled_by_vet_email: 'vet@a.test',
        is_flagged: false,
      },
      error: null,
    };

    const { result } = renderHook(() => useMutateAction(createPatient));
    const mutate = result.current[0];
    let returned: unknown;
    await act(async () => {
      returned = await mutate({
        horseName: 'NewHorse',
        age: 6,
        breed: 'Quarter',
        weight: 450,
        sex: 'M',
        ownerName: 'Owner',
        ownerContact: 'owner@a.test',
        enrollmentDate: '2026-01-01',
        enrolledByVetEmail: 'vet@a.test',
      });
    });
    expect(lastTable).toBe('patients');
    expect(lastOp).toBe('insert');
    expect(lastInsertArg).toMatchObject({
      horse_name: 'NewHorse',
      enrolled_by_vet_email: 'vet@a.test',
    });
    expect(Array.isArray(returned)).toBe(true);
    expect((returned as Array<{ id: number }>)[0].id).toBe(42);
  });

  it('with flag ON, updatePatient sends only provided columns', async () => {
    setFlag(true);
    // getById() call returns the "before" row, then update() returns the "after".
    let callCount = 0;
    currentResponse = { data: { id: 7, horse_name: 'Before', is_flagged: false }, error: null };
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      lastTable = table;
      lastOp = 'select';
      callCount += 1;
      // On the second call (the update path), prime the response with the
      // patched row so the assertion below sees horse_name: 'After'.
      if (callCount === 2) {
        currentResponse = { data: { id: 7, horse_name: 'After', is_flagged: false }, error: null };
      }
      return thenable();
    });

    const { result } = renderHook(() => useMutateAction(updatePatient));
    const mutate = result.current[0];
    await act(async () => {
      await mutate({ patientId: 7, horseName: 'After' });
    });
    expect(lastTable).toBe('patients');
    expect(lastOp).toBe('update');
    expect(lastUpdateArg).toMatchObject({ horse_name: 'After' });
    // Critical: update payload must NOT include keys the caller didn't set.
    const payload = lastUpdateArg as Record<string, unknown>;
    expect(payload).not.toHaveProperty('age');
    expect(payload).not.toHaveProperty('breed');
    expect(payload).not.toHaveProperty('owner_name');
  });

  it('with flag ON, updatePatientFlag writes is_flagged + flag_reason + flagged_at + flagged_by', async () => {
    setFlag(true);
    currentResponse = {
      data: { id: 9, is_flagged: true, flag_reason: 'protocol deviation', flagged_by: 'admin@a.test' },
      error: null,
    };

    const { result } = renderHook(() => useMutateAction(updatePatientFlag));
    const mutate = result.current[0];
    await act(async () => {
      await mutate({
        patientId: 9,
        isFlagged: true,
        flagReason: 'protocol deviation',
        flaggedBy: 'admin@a.test',
      });
    });
    expect(lastTable).toBe('patients');
    expect(lastOp).toBe('update');
    expect(lastUpdateArg).toMatchObject({
      is_flagged: true,
      flag_reason: 'protocol deviation',
      flagged_by: 'admin@a.test',
    });
    // flagged_at must be a string (timestamp) when flagging, not null.
    expect(typeof (lastUpdateArg as Record<string, unknown>).flagged_at).toBe('string');
  });

  it('with flag ON, supabase error in loadPatients falls back to mock', async () => {
    setFlag(true);
    currentResponse = { data: null, error: { message: 'simulated network failure' } };

    // Silence the expected console.error.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() =>
      useLoadAction(loadPatients, [], { status: null }),
    );
    await waitFor(() => {
      expect(Array.isArray(result.current[0])).toBe(true);
    });
    errSpy.mockRestore();
  });
});
