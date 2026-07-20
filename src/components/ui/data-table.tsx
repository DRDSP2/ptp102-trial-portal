import type { KeyboardEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type DataTableBreakpoint = 'sm' | 'md' | 'lg';

export type Column<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  hideBelow?: DataTableBreakpoint;
  summaryFor?: string;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowActions?: (row: T) => ReactNode;
  onRowOpen?: (row: T) => void;
  caption?: string;
  getRowKey?: (row: T, index: number) => string | number;
};

const hiddenBelow: Record<DataTableBreakpoint, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
};

const summaryBelow: Record<DataTableBreakpoint, string> = {
  sm: 'sm:hidden',
  md: 'md:hidden',
  lg: 'lg:hidden',
};

function defaultRowKey<T>(row: T, index: number): string | number {
  if (row && typeof row === 'object' && 'id' in row) {
    const id = (row as { id?: unknown }).id;
    if (typeof id === 'string' || typeof id === 'number') return id;
  }
  return index;
}

export function DataTable<T>({
  columns,
  rows,
  rowActions,
  onRowOpen,
  caption,
  getRowKey = defaultRowKey,
}: DataTableProps<T>) {
  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowOpen || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onRowOpen(row);
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        {caption && <TableCaption className="sr-only">{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  column.hideBelow && hiddenBelow[column.hideBelow],
                  column.headerClassName,
                )}
              >
                {column.header}
              </TableHead>
            ))}
            {rowActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={getRowKey(row, index)}
              tabIndex={onRowOpen ? 0 : undefined}
              className={cn(onRowOpen && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}
              onClick={onRowOpen ? () => onRowOpen(row) : undefined}
              onKeyDown={onRowOpen ? (event) => handleRowKeyDown(event, row) : undefined}
            >
              {columns.map((column) => {
                const summaries = columns.filter((candidate) => candidate.summaryFor === column.key);
                return (
                  <TableCell
                    key={column.key}
                    className={cn(column.hideBelow && hiddenBelow[column.hideBelow], column.className)}
                  >
                    {column.render(row)}
                    {summaries.map((summary) => (
                      <div
                        key={summary.key}
                        className={cn(
                          'mt-0.5 text-xs text-muted-foreground',
                          summary.hideBelow ? summaryBelow[summary.hideBelow] : 'sm:hidden',
                        )}
                      >
                        <span className="sr-only">{summary.header}: </span>
                        {summary.render(row)}
                      </div>
                    ))}
                  </TableCell>
                );
              })}
              {rowActions && (
                <TableCell className="text-right">
                  <div
                    className="flex items-center justify-end gap-1 [&_button]:min-h-10 [&_button]:min-w-10"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    {rowActions(row)}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
