import { vi, describe, it, expect } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AdminDocumentManager } from '@/admin/components/AdminDocumentManager';
import { createMockSupabaseAuth } from '@/__tests__/utils/mockSupabaseAuth';

const documents = [
  { id: 'd1', category: 'cmc', title: 'CMC Plan', file_path: 'deal-room/cmc/1_plan.pdf', version: 'v1.0', access_tier_min: 'diligence', uploaded_by: 'admin-1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

function buildMockAuth() {
  const base = createMockSupabaseAuth({ tier: 'exclusive' });
  return {
    ...base,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'deal-room/cmc/999_upload.pdf' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/upload.pdf' } })),
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'cmc_documents') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: documents,
              error: null,
            })),
          })),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          update: vi.fn().mockImplementation(() => ({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        };
      }
      if (table === 'deal_profiles') {
        return base.from(table);
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          })),
        })),
      };
    }),
  };
}

describe('AdminDocumentManager', () => {
  it('renders documents and allows archive action', async () => {
    const mockAuth = buildMockAuth();
    render(
      <MemoryRouter>
        <AuthProvider overrideClient={mockAuth as never}>
          <AdminDocumentManager />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText('CMC Plan')).toBeInTheDocument());

    expect(screen.getByText('diligence')).toBeInTheDocument();

    const archiveButton = screen.getAllByRole('button').find((b) => b.querySelector('.text-red-500'));
    expect(archiveButton).toBeDefined();
    if (!archiveButton) return;

    window.confirm = vi.fn(() => true);
    fireEvent.click(archiveButton);

    await waitFor(() => {
      expect(mockAuth.from).toHaveBeenCalledWith('cmc_documents');
    });
  });
});
