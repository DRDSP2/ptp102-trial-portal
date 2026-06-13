import { useCallback } from 'react';
import { useMutateAction } from '@uibakery/data';
import createAuditLogAction from '@/actions/createAuditLog';
import { useAuth } from '@/context/AuthContext';
import { type AuditAction, type AuditEntityType } from '@/lib/auditTypes';

type AuditMeta = {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: number | null;
  patientId?: number | null;
  fieldName?: string | null;
  reasonForChange?: string | null;
};

/**
 * Convenience wrapper that logs a single audit entry after a mutation succeeds.
 * Most auditing in this app is done centrally inside the mock-layer handlers,
 * but this hook is useful for one-off component-level audit calls.
 */
export function useAuditedMutateAction<T extends any[], R>(
  actionFactory: () => any,
  auditMeta: AuditMeta
) {
  const [mutate, isSubmitting] = useMutateAction(actionFactory);
  const [logAudit] = useMutateAction(createAuditLogAction);
  const auth = useAuth();

  const auditedMutate = useCallback(
    async (...args: T): Promise<R> => {
      const result = await mutate(...args);

      try {
        const userEmail =
          auth.email ?? localStorage.getItem('veterinarian_email') ?? localStorage.getItem('admin_email') ?? 'unknown';
        const userRole = (auth.role as 'admin' | 'vet' | 'unknown') ?? 'unknown';

        await logAudit({
          userId: userEmail,
          userEmail,
          userRole,
          action: auditMeta.action,
          entityType: auditMeta.entityType,
          entityId: auditMeta.entityId ?? null,
          patientId: auditMeta.patientId ?? null,
          fieldName: auditMeta.fieldName ?? null,
          oldValue: null,
          newValue: JSON.stringify(args),
          reasonForChange: auditMeta.reasonForChange ?? null,
          ipAddress: null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          sessionId: null,
        });
      } catch (e) {
        console.error('Audit log failed (non-blocking):', e);
      }

      return result;
    },
    [mutate, logAudit, auth.email, auth.role, auditMeta]
  );

  return [auditedMutate, isSubmitting] as const;
}
