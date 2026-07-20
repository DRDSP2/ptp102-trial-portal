import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryState } from '@/components/ui/query-state';

describe('QueryState', () => {
  it('shows its layout-matching loading state', () => {
    render(
      <QueryState data={[]} isLoading error={null} skeleton={<p>Loading records</p>} empty={<p>No records</p>}>
        {() => <p>Records</p>}
      </QueryState>,
    );

    expect(screen.getByText('Loading records')).toBeInTheDocument();
  });

  it('surfaces a failed request instead of rendering a blank section', () => {
    render(
      <QueryState data={[]} isLoading={false} error={new Error('Network unavailable')} skeleton={null} empty={null}>
        {() => <p>Records</p>}
      </QueryState>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable');
  });

  it('treats an empty array as empty data', () => {
    render(
      <QueryState data={[]} isLoading={false} error={null} skeleton={null} empty={<p>No records</p>}>
        {() => <p>Records</p>}
      </QueryState>,
    );

    expect(screen.getByText('No records')).toBeInTheDocument();
  });

  it('only calls children for populated data', () => {
    const renderRows = vi.fn((rows: string[]) => <p>{rows.join(', ')}</p>);

    render(
      <QueryState data={['A', 'B']} isLoading={false} error={null} skeleton={null} empty={null}>
        {renderRows}
      </QueryState>,
    );

    expect(renderRows).toHaveBeenCalledOnce();
    expect(screen.getByText('A, B')).toBeInTheDocument();
  });
});
