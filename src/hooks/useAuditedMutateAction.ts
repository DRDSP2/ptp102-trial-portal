import { useCallback } from 'react';
import { useMutateAction } from '@uibakery/data';
import createAuditLogAction from '@/actions/createAuditLog';
import { useAuth } from '@/context/AuthContext';

type AuditParams = {
  action: string;
  entityType: string;
  entityId?: number | null;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  reasonForChange?: string | null;
};

export function useAuditedMutateAction<T extends any[], R>(
  actionFactory: () => any,
  auditMeta: AuditParams
) {
  const [mutate, isSubmitting] = useMutateAction(actionFactory);
  const [logAudit] = useMutateAction(createAuditLogAction);
  const auth = useAuth();

  const auditedMutate = useCallback(
    async (...args: T): Promise<R> => {
      const result = await mutate(...args);

      try {
        const userEmail = auth.email || localStorage.getItem('veterinarian_email') || localStorage.getItem('admin_email') || 'unknown';
        const userRole = auth.role || 'unknown';

        await logAudit({
          userId: userEmail,
          userEmail,
          userRole,
          action: auditMeta.action,
          entityType: auditMeta.entityType,
          entityId: auditMeta.entityId ?? null,
          fieldName: auditMeta.fieldName ?? null,
          oldValue: auditMeta.oldValue ?? null,
          newValue: auditMeta.newValue ?? null,
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
