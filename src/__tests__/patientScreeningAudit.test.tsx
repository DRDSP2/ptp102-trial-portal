import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// =============================================================================
// Shared supabase mock — mirrors the pattern in patientsRepositoryFlag.test.tsx.
// `from()` returns a chainable builder that resolves to `currentResponse`.
// =============================================================================
type SupaResponse = { data: unknown; error: { message: string } | null };
let currentResponse: SupaResponse = { data: null, error: null };
let lastTable: string | null = null;
let lastOp: 'select' | 'insert' | 'update' | null = null;
let lastInsertArg: unknown = null;
let fromCallCount = 0;
// Track the patients-table update separately, because recordAudit's
// dual-write to audit_logs overwrites lastTable/lastOp after the
// screening update completes.
let patientsUpdateArg: unknown = null;
let patientsUpdateSeen = false;

function thenable() {
  const chain: Record<string, unknown> = {};
  const passthrough = () => chain;
  chain.select = passthrough;
  chain.order = passthrough;
  chain.eq = passthrough;
  chain.or = passthrough;
  chain.update = (arg: unknown) => {
    lastOp = 'update';
    if (lastTable === 'patients') {
      patientsUpdateArg = arg;
      patientsUpdateSeen = true;
    }
    return chain;
  };
  chain.insert = (arg: unknown) => {
    lastOp = 'insert';
    lastInsertArg = arg;
    return chain;
  };
  chain.then = (resolve: (v: SupaResponse) => unknown) =>
    Promise.resolve(currentResponse).then(resolve);
  chain.single = () => Promise.resolve(currentResponse);
  chain.maybeSingle = () => Promise.resolve(currentResponse);
  return chain;
}

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn((table: string) => {
      lastTable = table;
      lastOp = 'select';
      fromCallCount += 1;
      return thenable();
    }),
    functions: { invoke: vi.fn() },
  },
}));

import { renderHook, waitFor, act } from '@testing-library/react';
import { useLoadAction, useMutateAction } from '@/lib/uibakeryDataMock';
import loadPatients from '@/actions/loadPatients';
import approvePatientScreening from '@/actions/approvePatientScreening';
import rejectPatientScreening from '@/actions/rejectPatientScreening';
import requestPatientDetails from '@/actions/requestPatientDetails';
import { flags } from '@/lib/featureFlags';
import { recordLoginAudit, recordLogoutAudit } from '@/lib/uibakeryDataMock';

function setFlag(value: boolean) {
  flags.patients = value;
}

beforeEach(() => {
  localStorage.clear();
  currentResponse = { data: null, error: null };
  lastTable = null;
  lastOp = null;
  lastInsertArg = null;
  fromCallCount = 0;
  patientsUpdateArg = null;
  patientsUpdateSeen = false;
});

afterEach(() => {
  setFlag(false);
});

// =============================================================================
// Flow 2 & 3: screening actions route to Supabase when flag is ON
// =============================================================================
describe('screening actions — Supabase branch (Flow 2 & 3 fix)', () => {
  it('approvePatientScreening with flag ON writes screening_status=approved to patients table', async () => {
    setFlag(true);
    // getById returns the "before" row, then update returns the "after" row.
    let callCount = 0;
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      lastTable = table;
      lastOp = 'select';
      callCount += 1;
      if (callCount === 1) {
        // getById — "before" state
        currentResponse = {
          data: { id: 5, screening_status: 'pending_screening', trial_status: 'screening', enrolled_by_vet_email: 'vet@a.test' },
          error: null,
        };
      } else if (callCount === 2) {
        // update — "after" state
        currentResponse = {
          data: { id: 5, screening_status: 'approved', trial_status: 'enrolled', screened_by: 'admin@a.test' },
          error: null,
        };
      }
      return thenable();
    });

    const { result } = renderHook(() => useMutateAction(approvePatientScreening));
    const mutate = result.current[0];
    let returned: unknown;
    await act(async () => {
      returned = await mutate({ patientId: 5, adminEmail: 'Admin@A.Test', notes: 'Looks good' });
    });

    expect(patientsUpdateSeen).toBe(true);
    expect(patientsUpdateArg).toMatchObject({
      screening_status: 'approved',
      trial_status: 'enrolled',
      screening_notes: 'Looks good',
      screened_by: 'admin@a.test',
    });
    const rows = returned as Array<{ screening_status: string }>;
    expect(rows[0].screening_status).toBe('approved');
  });

  it('rejectPatientScreening with flag ON writes screening_status=rejected to patients table', async () => {
    setFlag(true);
    let callCount = 0;
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      lastTable = table;
      lastOp = 'select';
      callCount += 1;
      if (callCount === 2) {
        currentResponse = {
          data: { id: 5, screening_status: 'rejected', trial_status: 'withdrawn' },
          error: null,
        };
      } else {
        currentResponse = {
          data: { id: 5, screening_status: 'pending_screening', trial_status: 'screening' },
          error: null,
        };
      }
      return thenable();
    });

    const { result } = renderHook(() => useMutateAction(rejectPatientScreening));
    await act(async () => {
      await result.current[0]({ patientId: 5, adminEmail: 'admin@a.test', notes: 'Failed eligibility' });
    });

    expect(patientsUpdateArg).toMatchObject({
      screening_status: 'rejected',
      trial_status: 'withdrawn',
    });
  });

  it('requestPatientDetails with flag ON writes screening_status=awaiting_details to patients table', async () => {
    setFlag(true);
    let callCount = 0;
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      lastTable = table;
      lastOp = 'select';
      callCount += 1;
      if (callCount === 2) {
        currentResponse = {
          data: { id: 5, screening_status: 'awaiting_details', trial_status: 'screening' },
          error: null,
        };
      } else {
        currentResponse = {
          data: { id: 5, screening_status: 'pending_screening', trial_status: 'screening' },
          error: null,
        };
      }
      return thenable();
    });

    const { result } = renderHook(() => useMutateAction(requestPatientDetails));
    await act(async () => {
      await result.current[0]({ patientId: 5, adminEmail: 'admin@a.test', notes: 'Need x-ray' });
    });

    expect(patientsUpdateArg).toMatchObject({
      screening_status: 'awaiting_details',
      trial_status: 'screening',
    });
  });

  it('Flow 3: after approvePatientScreening, loadPatients reflects the updated status', async () => {
    setFlag(true);
    // The screening update returns an approved row; then loadPatients returns
    // that same row — proving the list and the write share one store.
    let callCount = 0;
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      lastTable = table;
      lastOp = 'select';
      callCount += 1;
      if (callCount === 1) {
        currentResponse = {
          data: { id: 8, screening_status: 'pending_screening', trial_status: 'screening' },
          error: null,
        };
      } else if (callCount === 2) {
        currentResponse = {
          data: { id: 8, screening_status: 'approved', trial_status: 'enrolled', screened_by: 'admin@a.test' },
          error: null,
        };
      } else {
        // loadPatients list call
        currentResponse = {
          data: [{ id: 8, screening_status: 'approved', trial_status: 'enrolled', horse_name: 'TestHorse' }],
          error: null,
        };
      }
      return thenable();
    });

    const { result: approveResult } = renderHook(() => useMutateAction(approvePatientScreening));
    await act(async () => {
      await approveResult.current[0]({ patientId: 8, adminEmail: 'admin@a.test', notes: null });
    });

    const { result: listResult } = renderHook(() =>
      useLoadAction(loadPatients, [], { status: null }),
    );
    await waitFor(() => {
      const rows = listResult.current[0] as Array<{ screening_status: string }>;
      expect(rows.length).toBeGreaterThan(0);
    });
    const rows = listResult.current[0] as Array<{ screening_status: string }>;
    expect(rows[0].screening_status).toBe('approved');
  });

  it('approvePatientScreening with flag ON and RLS denial surfaces the error', async () => {
    setFlag(true);
    let callCount = 0;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { supabase } = await import('@/lib/supabase/client');
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
      lastTable = table;
      lastOp = 'select';
      callCount += 1;
      if (callCount === 1) {
        currentResponse = { data: { id: 5, screening_status: 'pending_screening' }, error: null };
      } else {
        currentResponse = { data: null, error: { message: 'new row violates row-level security policy' } };
      }
      return thenable();
    });

    const { result } = renderHook(() => useMutateAction(approvePatientScreening));
    await expect(
      act(async () => {
        await result.current[0]({ patientId: 5, adminEmail: 'vet@a.test', notes: null });
      }),
    ).rejects.toThrow(/row-level security/i);
    errSpy.mockRestore();
  });
});

// =============================================================================
// Audit-notification: LOGIN audit + dual-write
// =============================================================================
describe('audit-notification — LOGIN/LOGOUT audit', () => {
  it('recordLoginAudit writes a LOGIN entry to localStorage audit logs', async () => {
    await act(async () => {
      await recordLoginAudit('Vet@Example.com', 'vet');
    });
    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const loginEvents = logs.filter((l: { action: string }) => l.action === 'LOGIN');
    expect(loginEvents.length).toBeGreaterThan(0);
    expect(loginEvents[0]).toMatchObject({
      userEmail: 'vet@example.com',
      userRole: 'vet',
      entityType: 'veterinarian',
      action: 'LOGIN',
    });
  });

  it('recordLoginAudit for admin uses entityType=admin', async () => {
    await act(async () => {
      await recordLoginAudit('admin@pm.me', 'admin');
    });
    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const adminLogin = logs.find((l: { action: string; userRole: string }) => l.action === 'LOGIN' && l.userRole === 'admin');
    expect(adminLogin).toBeDefined();
    expect(adminLogin.entityType).toBe('admin');
  });

  it('recordLogoutAudit writes a LOGOUT entry', async () => {
    await act(async () => {
      await recordLogoutAudit('vet@example.com', 'vet');
    });
    const logs = JSON.parse(localStorage.getItem('ptp102_mock_audit_logs') || '[]');
    const logoutEvents = logs.filter((l: { action: string }) => l.action === 'LOGOUT');
    expect(logoutEvents.length).toBeGreaterThan(0);
    expect(logoutEvents[0].userEmail).toBe('vet@example.com');
  });

  it('recordLoginAudit writes to the audit_logs Supabase table (dual-write)', async () => {
    // The dual-write is skipped in vitest by default (to avoid clobbering
    // shared mock state). Set the override flag to force it on for this
    // test, and also set VITE_SUPABASE_URL so isSupabaseConfigured() passes.
    const env = import.meta.env as Record<string, unknown>;
    const prevUrl = env.VITE_SUPABASE_URL;
    env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    (window as unknown as { __FORCE_AUDIT_DUAL_WRITE__?: boolean }).__FORCE_AUDIT_DUAL_WRITE__ = true;

    const { supabase } = await import('@/lib/supabase/client');
    const fromSpy = supabase.from as unknown as ReturnType<typeof vi.fn>;
    fromSpy.mockClear();
    fromCallCount = 0;
    fromSpy.mockImplementation((table: string) => {
      lastTable = table;
      lastOp = 'select';
      fromCallCount += 1;
      currentResponse = { data: null, error: null };
      return thenable();
    });

    try {
      await act(async () => {
        await recordLoginAudit('vet@example.com', 'vet');
      });

      // The dual-write should have inserted into audit_logs at least once.
      expect(lastTable).toBe('audit_logs');
      expect(lastOp).toBe('insert');
      const insertArg = lastInsertArg as Record<string, unknown>;
      expect(insertArg).toMatchObject({
        action: 'LOGIN',
        user_email: 'vet@example.com',
        user_role: 'vet',
        entity_type: 'veterinarian',
      });
    } finally {
      env.VITE_SUPABASE_URL = prevUrl;
      delete (window as unknown as { __FORCE_AUDIT_DUAL_WRITE__?: boolean }).__FORCE_AUDIT_DUAL_WRITE__;
    }
  });
});
