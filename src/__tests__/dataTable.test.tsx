import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from '@/components/ui/data-table';

type TestRow = { id: number; name: string; breed: string };

const columns: Column<TestRow>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name },
  {
    key: 'breed',
    header: 'Breed',
    render: (row) => row.breed,
    hideBelow: 'sm',
    summaryFor: 'name',
  },
];

const rows: TestRow[] = [{ id: 7, name: 'Hazel', breed: 'Arabian' }];

describe('DataTable', () => {
  it('renders an accessible caption and typed cell content', () => {
    render(<DataTable columns={columns} rows={rows} caption="Trial patients" />);

    expect(screen.getByRole('table', { name: 'Trial patients' })).toBeInTheDocument();
    expect(screen.getByText('Hazel')).toBeInTheDocument();
  });

  it('declares responsive columns and folds them into the mobile summary', () => {
    render(<DataTable columns={columns} rows={rows} />);

    const breedHeader = screen.getByRole('columnheader', { name: 'Breed' });
    expect(breedHeader).toHaveClass('hidden', 'sm:table-cell');
    expect(screen.getAllByText('Arabian')).toHaveLength(2);
  });

  it('provides a labelled actions column with minimum-size action targets', () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowActions={(row) => <button aria-label={`Open ${row.name}`}>Open</button>}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Hazel' }).parentElement).toHaveClass('[&_button]:min-h-10');
  });

  it('opens a keyboard-focusable row with Enter', () => {
    const onOpen = vi.fn();
    render(<DataTable columns={columns} rows={rows} onRowOpen={onOpen} />);

    const row = screen.getByText('Hazel').closest('tr');
    expect(row).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(row!, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledWith(rows[0]);
  });
});
