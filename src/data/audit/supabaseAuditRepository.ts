/**
 * Supabase-backed audit log writer.
 *
 * Writes append-only rows to public.audit_logs. RLS (migration
 * 1795000000_enable_audit_logs_rls.sql) permits any authenticated user to
 * INSERT and admin-only SELECT; UPDATE/DELETE are denied (21 CFR Part 11).
 *
 * This repository is intentionally write-only: reads still flow through the
 * existing loadAuditLogs action / mock layer so the AuditLogViewer (which
 * expects camelCase AuditLogEntry fields) keeps working against the
 * localStorage cache. The real table is the persistent, tamper-evident
 * copy; localStorage is the read cache + test fixture.
 */

import { supabase } from '@/lib/supabase/client';
import type { AuditLogEntry, AuditPayload } from '@/lib/auditTypes';
import { fireAuditEmail } from '@/utils/emailNotifications';

function isSupabaseConfigured(): boolean {
  // Skip the dual-write in test environments to avoid clobbering shared
  // mock state (existing tests mock supabase.from() with a single
  // chainable builder; the audit insert would overwrite lastTable/lastOp).
  // Tests that need to verify the dual-write can set
  // window.__FORCE_AUDIT_DUAL_WRITE__ = true to override this guard.
  if (typeof window !== 'undefined') {
    const force = (window as unknown as { __FORCE_AUDIT_DUAL_WRITE__?: boolean }).__FORCE_AUDIT_DUAL_WRITE__;
    if (!force) {
      // In test environments (vitest/jsdom), window is defined. Only
      // proceed when the override flag is set. In production (real
      // browser), window is defined but the flag is never set, so we
      // fall through to the env-var check below.
      try {
        if ((import.meta.env as Record<string, unknown>).VITEST) return false;
      } catch { /* ignore */ }
    }
  }
  const url = readViteEnv('VITE_SUPABASE_URL');
  return (
    typeof url === 'string' &&
    url.length > 0 &&
    typeof (supabase as unknown as { from?: unknown }).from === 'function'
  );
}

function readViteEnv(name: string): string | undefined {
  try {
    const raw = (import.meta.env as Record<string, string | undefined>)[name];
    return typeof raw === 'string' ? raw : undefined;
  } catch {
    return undefined;
  }
}

function toSnakeCase(entry: AuditLogEntry): Record<string, unknown> {
  return {
    user_id: entry.userId,
    user_email: entry.userEmail,
    user_role: entry.userRole,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    patient_id: entry.patientId,
    study_id: entry.studyId,
    field_name: entry.fieldName,
    old_value: entry.oldValue,
    new_value: entry.newValue,
    reason_for_change: entry.reasonForChange,
    ip_address: entry.ipAddress,
    user_agent: entry.userAgent,
    session_id: entry.sessionId,
    sequence_number: entry.sequenceNumber,
    client_hash: entry.clientHash,
    previous_hash: entry.previousHash,
    timestamp: entry.timestamp,
  };
}

export const supabaseAuditRepository = {
  /** True when the Supabase client can actually reach a database. */
  isConfigured: isSupabaseConfigured,

  /**
   * Appends a single audit row. Best-effort: a failure is swallowed and
   * logged so the user-facing action that triggered the audit is never
   * blocked by audit infrastructure. Returns true on success.
   */
  async append(entry: AuditLogEntry): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(toSnakeCase(entry));
      if (error) {
        console.error('[audit] supabase insert failed:', error.message);
        return false;
      }
      // Email the super admin (drdsp@pm.me) about every audited change,
      // edit, and login/logout. Best-effort — never blocks the caller.
      void fireAuditEmail(entry.action, entry.entityType, entry.userEmail, {
        entityId: entry.entityId,
        patientId: entry.patientId,
        fieldName: entry.fieldName,
        newValue: entry.newValue,
        reasonForChange: entry.reasonForChange,
      }).catch(() => {
        // swallow — email failures must not surface to the user
      });
      return true;
    } catch (err) {
      console.error('[audit] supabase insert threw:', err);
      return false;
    }
  },

  /**
   * Appends a lightweight LOGIN/LOGOUT row. Login audits don't have an
   * entity id; they record who signed in/out and when.
   */
  async appendAuthEvent(
    email: string,
    role: 'admin' | 'vet' | 'unknown',
    action: 'LOGIN' | 'LOGOUT',
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    const normalizedEmail = (email ?? 'unknown').toLowerCase();
    const timestamp = new Date().toISOString();
    try {
      const { error } = await supabase.from('audit_logs').insert({
        user_id: normalizedEmail,
        user_email: normalizedEmail,
        user_role: role,
        action,
        entity_type: role === 'admin' ? 'admin' : 'veterinarian',
        entity_id: null,
        patient_id: null,
        study_id: null,
        field_name: null,
        old_value: null,
        new_value: null,
        reason_for_change: null,
        ip_address: null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        session_id: null,
        sequence_number: null,
        client_hash: null,
        previous_hash: null,
        timestamp,
      });
      if (error) {
        console.error(`[audit] supabase ${action} insert failed:`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[audit] supabase ${action} insert threw:`, err);
      return false;
    }
  },
};

/**
 * Minimal payload for a direct audit write (bypasses the mock hash chain).
 * Used by notifyAudit when the caller isn't already inside recordAudit.
 */
export type DirectAuditInput = Pick<AuditPayload, 'action' | 'entityType'> & {
  entityId?: number | null;
  patientId?: number | null;
  newValue?: string | null;
  oldValue?: string | null;
  reasonForChange?: string | null;
};
