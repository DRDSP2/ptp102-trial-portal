import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HoofXrayPortal } from '@/components/HoofXrayPortal';

const loadActionMock = vi.fn();
const mutateActionMock = vi.fn((_actionName?: unknown) => [vi.fn()]);

function setLoadData({ patients = [], xrays = [] }: { patients?: unknown; xrays?: unknown }) {
  loadActionMock.mockImplementation((actionName: any) => {
    const name = typeof actionName === 'function' ? actionName().name : actionName;
    if (name === 'loadPatients') return [patients, false, null, vi.fn()];
    if (name === 'loadHoofXrays') return [xrays, false, null, vi.fn()];
    return [[], false, null, vi.fn()];
  });
}

vi.mock('@uibakery/data', async () => {
  const actual = await vi.importActual<typeof import('@/lib/uibakeryDataMock')>('@/lib/uibakeryDataMock');
  return {
    ...actual,
    useLoadAction: (actionName: unknown, defaultValue?: unknown, params?: unknown) => loadActionMock(actionName, defaultValue, params),
    useMutateAction: (actionName: unknown) => mutateActionMock(actionName),
  };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    role: 'admin',
    email: 'admin@example.com',
    user: { id: 'admin-1' },
  }),
}));

vi.mock('@/hooks/useSecureUpload', () => ({
  useSecureUpload: () => ({ upload: vi.fn(), isUploading: false }),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrl: vi.fn(async () => ({ data: { signedUrl: 'https://example.test/xray.jpg' }, error: null })),
      }),
    },
  },
}));

describe('HoofXrayPortal null-safe data handling', () => {
  beforeEach(() => {
    loadActionMock.mockReset();
    setLoadData({});
    mutateActionMock.mockClear();
  });

  it('renders an empty state when x-ray data is null', () => {
    setLoadData({ xrays: null });

    render(<HoofXrayPortal />);

    expect(screen.getByText('No X-rays found. Select a patient and upload one.')).toBeInTheDocument();
  });

  it('renders fallback values when x-ray rows are missing optional fields', async () => {
    setLoadData({
      patients: [{ id: 1, horse_name: null }, { id: 2 }],
      xrays: [{
          id: 10,
          patient_id: 1,
          hoof_side: null,
          file_path: 'patient-media/admin/patients/1/xray.jpg',
          original_file_name: 'xray.jpg',
          created_at: '2026-06-29T00:00:00.000Z',
        }],
    });

    render(<HoofXrayPortal />);

    expect(await screen.findAllByText('Unknown')).toHaveLength(2);
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('renders valid x-ray rows normally', async () => {
    setLoadData({
      patients: [{ id: 1, horse_name: 'Midnight Thunder' }],
      xrays: [{
          id: 11,
          patient_id: 1,
          hoof_side: 'left',
          file_path: 'patient-media/admin/patients/1/xray.jpg',
          original_file_name: 'xray.jpg',
          taken_date: '2026-06-29',
          analysis_status: 'completed',
          overall_severity: 'mild',
          score: 82,
          created_at: '2026-06-29T00:00:00.000Z',
          horse_name: 'Midnight Thunder',
        }],
    });

    render(<HoofXrayPortal />);

    const row = await screen.findByRole('row', { name: /Midnight Thunder/i });
    expect(within(row).getByText('left')).toBeInTheDocument();
    expect(within(row).getByText('completed')).toBeInTheDocument();
    expect(within(row).getByText('82')).toBeInTheDocument();
  });
});
