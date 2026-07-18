import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export type UseTrialMutationOptions<TArgs, TResult> = {
  mutationFn: (args: TArgs) => Promise<TResult>;
  successToast?: string | ((result: TResult) => string);
  errorTitle?: string; // inline Alert title / toast title, never console-only
  onSuccess?: (result: TResult) => void;
};

export type UseTrialMutationResult<TArgs, TResult> = {
  mutate: (args: TArgs) => Promise<TResult | undefined>; // never throws to caller
  isPending: boolean;
  error: string | null; // render in <Alert> — always visible
  reset: () => void;
};

const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

function extractRawMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error ?? '');
}

function isSessionExpiredError(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  if (status === 401) return true;
  const message = extractRawMessage(error).toLowerCase();
  return (
    message.includes('401') ||
    message.includes('jwt') ||
    message.includes('unauthorized') ||
    message.includes('invalid token') ||
    message.includes('session expired') ||
    message.includes('session_expired')
  );
}

function toDisplayMessage(error: unknown): string {
  if (isSessionExpiredError(error)) return SESSION_EXPIRED_MESSAGE;
  const message = extractRawMessage(error).trim();
  return message || 'Something went wrong. Please try again.';
}

/**
 * The mutation contract (UI_REVIEW.md §5.1, simplified): no mutation without
 * visible feedback. `mutate` never throws to the caller — failures surface as a
 * renderable `error` string plus a destructive toast; successes toast and
 * invoke `onSuccess`. 401/JWT-expired failures surface a clear
 * "session expired, please log in again" message.
 */
export function useTrialMutation<TArgs = void, TResult = unknown>(
  options: UseTrialMutationOptions<TArgs, TResult>
): UseTrialMutationResult<TArgs, TResult> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => setError(null), []);

  const mutate = useCallback(
    async (args: TArgs): Promise<TResult | undefined> => {
      setIsPending(true);
      setError(null);
      try {
        const result = await options.mutationFn(args);
        const successMessage =
          typeof options.successToast === 'function'
            ? options.successToast(result)
            : options.successToast;
        if (successMessage) {
          toast.success(successMessage);
        }
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        console.error('Mutation failed:', err);
        const message = toDisplayMessage(err);
        setError(message);
        if (options.errorTitle) {
          toast.error(options.errorTitle, { description: message });
        } else {
          toast.error(message);
        }
        return undefined;
      } finally {
        setIsPending(false);
      }
    },
    [options]
  );

  return { mutate, isPending, error, reset };
}
