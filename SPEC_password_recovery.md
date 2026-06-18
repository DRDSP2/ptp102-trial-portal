# Password Recovery — Implementation Spec

## Overview

Two Supabase Edge Functions for self-service and admin-initiated password recovery, supporting both `admin` and `vet` roles.

## Storage

### Table: `recovery_tokens`

```sql
CREATE TABLE recovery_tokens (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       TEXT NOT NULL,
  token_hash  TEXT NOT NULL,         -- SHA-256 of the raw token
  role        TEXT NOT NULL,         -- 'admin' | 'vet'
  expires_at  TIMESTAMPTZ NOT NULL,  -- NOW() + INTERVAL '15 minutes'
  used_at     TIMESTAMPTZ,           -- NULL until consumed
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recovery_tokens_email ON recovery_tokens (email);
CREATE INDEX idx_recovery_tokens_expires ON recovery_tokens (expires_at);
```

- Token is a `crypto.randomUUID()` (36 chars, URL-safe).
- Only the SHA-256 hash is stored — raw token is the password-equivalent and must be in the recovery link only.
- `used_at` + expiry = two-gate invalidation.

## Edge Function: `recovery-request`

### Route

`POST /auth/recovery/request`

### Request

```json
{ "email": "user@example.com" }
```

### Logic

1. **Always return 200** — do not reveal whether the account exists.
2. Check `admin_users` then `veterinarians` by email:
   - Found → determine role (`admin` | `vet`).
   - Not found → no-op, return 200.
3. Hash the token, store in `recovery_tokens`.
4. Log audit event via `audit_logs`:
   ```json
   { "action": "recovery_requested", "user_email": email, "user_role": role, "timestamp": "..." }
   ```
5. In production: send email with recovery link.
   - Link format: `https://byrock.eth.limo/#access_token=TOKEN&type=recovery`
   - The existing `handleRecoveryRedirect()` in `src/lib/supabase/recovery.ts` picks up the hash before React mounts.

### Rate Limiting

- Per IP: max 3 requests per 15 minutes (in-memory map, resets on function cold start).
- Per account: max 3 requests per 60 minutes (check `recovery_tokens` where `email = ? AND created_at > NOW() - INTERVAL '60 minutes'`).
- If exceeded: still return 200 (silent no-op).

## Edge Function: `recovery-complete`

### Route

`POST /auth/recovery/complete`

### Request

```json
{ "token": "uuid-string", "password": "new-password" }
```

### Logic

1. Hash the supplied token with SHA-256.
2. Look up `recovery_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()`.
   - Not found → return 401 `{ "error": "invalid_or_expired_token" }`.
3. Mark `used_at = NOW()`.
4. Determine role from the stored `role` column.
   - `admin` → call `supabase.auth.admin.updateUserById(user_id, { password })`.
   - `vet` → update `veterinarians SET password_hash = SHA2(new_password)` (or use Supabase Auth if vet is also an auth user).
5. Log audit event:
   ```json
   { "action": "recovery_completed", "user_email": email, "user_role": role, "timestamp": "..." }
   ```
6. Return 200 `{ "success": true }`.

### Session Invalidation

- After successful completion, call `supabase.auth.admin.signOut(user_id)` to invalidate all existing sessions.
- The user must re-authenticate with the new password.

## Admin-Initiated Recovery

### Location

In `VeterinarianManagementPanel.tsx`, add a "Send Recovery Email" button per vet row.

### Implementation

- Button calls `supabase.functions.invoke('recovery-request', { body: { email: vet.email } })`.
- Edge Function handles it identically to a self-service request — same rate limiting, same audit logging.
- UI shows a toast: "Recovery email sent if this account exists."

### Audit

- Audit log includes `actor_email` (the admin's email) in addition to the target email:
  ```json
  { "action": "admin_initiated_recovery", "user_email": vet_email, "actor_email": admin_email, "timestamp": "..." }
  ```

## Email Sending (Deferred)

- Stub: log the recovery link to console + audit trail.
- Production: integrate with a transactional email provider (Resend, SendGrid, etc.) via a Supabase Edge Function or pg_notify → webhook.
- The link is: `https://byrock.eth.limo/#access_token={token}&type=recovery`

## Error Handling

| Scenario | Response |
|---|---|
| Missing email/password | 400 `{ "error": "validation_error", "details": [...] }` |
| Invalid/expired/used token | 401 `{ "error": "invalid_or_expired_token" }` |
| Rate limited | 200 (silent no-op for `request`); 429 for `complete` |
| Internal error | 500 `{ "error": "internal_error" }` |

## Files to Create/Modify

| File | Action |
|---|---|
| `supabase/functions/recovery-request/index.ts` | Create — new Edge Function |
| `supabase/functions/recovery-request/deno.json` | Create — Deno config |
| `supabase/functions/recovery-complete/index.ts` | Create — new Edge Function |
| `supabase/functions/recovery-complete/deno.json` | Create — Deno config |
| `supabase/config.toml` | Modify — add both functions with `verify_jwt = false` |
| `supabase/migrations/1790000000_create_recovery_tokens.sql` | Create — migration |
| `src/components/VeterinarianManagementPanel.tsx` | Modify — add "Send Recovery Email" button |
| `src/lib/supabase/recovery.ts` | Modify — handle custom `#access_token=TOKEN&type=recovery` (already done) |

## Migration

```sql
-- 1790000000_create_recovery_tokens.sql
CREATE TABLE recovery_tokens (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       TEXT NOT NULL,
  token_hash  TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'vet')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recovery_tokens_email    ON recovery_tokens (email);
CREATE INDEX idx_recovery_tokens_expires  ON recovery_tokens (expires_at);

COMMENT ON TABLE recovery_tokens IS 'Single-use password recovery tokens. SHA-256 hashed, 15-minute expiry.';
```
