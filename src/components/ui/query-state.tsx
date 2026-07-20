import type { ReactNode } from 'react';

export type QueryStateProps<T> = {
  data: T[] | null | undefined;
  isLoading: boolean;
  error: Error | null | undefined;
  skeleton: ReactNode;
  empty: ReactNode;
  children: (data: T[]) => ReactNode;
};

/**
 * Renders exactly one state for an asynchronous collection. Keeping this
 * contract shared prevents empty arrays being mistaken for populated data and
 * stops failed requests from degrading into blank cards or fabricated zeros.
 */
export function QueryState<T>({
  data,
  isLoading,
  error,
  skeleton,
  empty,
  children,
}: QueryStateProps<T>) {
  if (isLoading) return <>{skeleton}</>;

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
      >
        <p className="font-semibold">Unable to load this section.</p>
        <p className="mt-1">{error.message || 'Please try again.'}</p>
      </div>
    );
  }

  if (!data || data.length === 0) return <>{empty}</>;

  return <>{children(data)}</>;
}
