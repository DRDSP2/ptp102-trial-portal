# PTP-102 Trial App — Deployment Guide

## Production URL

- **Canonical:** [https://byrock.eth.limo/](https://byrock.eth.limo/)
- **Underlying ENS name:** `byrock.eth`, bound to a 4EVERLAND IPNS hash that auto-updates on every deploy
- **Gateway:** `eth.limo` (resolves `*.eth` for browsers without native ENS support)
- **Backup deployment:** Cloudflare Pages — same `main` branch, build URL provided by Cloudflare's project dashboard

> **Build-pinned 4EVERLAND URLs** of the form `https://<project>-<hash>.ipfs.4everland.app/`
> change on every redeploy. Do **not** share or hard-code those — use `byrock.eth.limo`.

---

## Hosting model

The site is deployed to two providers from the same `main` branch:

| Provider | Role | URL pattern |
|---|---|---|
| 4EVERLAND (IPFS + ENS) | Primary | `byrock.eth.limo` (stable) / `*.ipfs.4everland.app` (per-build, ephemeral) |
| Cloudflare Pages | Backup / preview previews | `*.pages.dev` (project-default and branch aliases) |

Both pick up pushes to `main` automatically.

### Why a localStorage session adapter?

The `eth.limo` gateway sends `clear-site-data: "cookies"` on every response,
which would wipe a cookie-backed Supabase session on every navigation. The
browser Supabase client (`src/lib/supabase/client.ts`) provides a custom
adapter that persists session data in `window.localStorage` under the
`sb-cookie:` key prefix instead of cookies. Auth survives navigation on
`*.eth.limo`. Other gateways are unaffected.

---

## Build & deploy

### Local build

```bash
npm install     # use npm ci on CI for strict lockfile checks
npm run build
ls dist/        # index.html + assets/* should exist
```

### 4EVERLAND project settings

- Repo: `DRDSP2/ptp102-trial-portal`
- Branch: `main`
- Build command: `npm install && npm run build` (or `npm ci && npm run build`)
- Output directory: `dist`
- ENS binding: `byrock.eth` → 4EVERLAND IPNS hash (auto-pinned on each deploy)
- Environment: set `VITE_COMPUTE_API_URL=/compute` so Hoof X-Ray analysis calls the production FastAPI proxy.

> **IPFS routing note:** The Supabase password-recovery link used by
> `scripts/seedAdmin.ts` points to `https://byrock.eth.limo/` (the root)
> instead of a sub-path like `/admin/login`. This is because IPFS gateways
> (including `eth.limo`) don't reliably serve `ipfs-404.html` fallbacks for
> subdirectory paths. The hash fragment (`#access_token=…&type=recovery`)
> survives on the root URL and is processed by `handleRecoveryRedirect()` in
> `src/lib/supabase/recovery.ts` before React mounts.
>
> An `ipfs-404.html` fallback is deployed as a secondary catch-all — it does a
> JavaScript redirect to `/` preserving the URL hash. Cloudflare Pages has its
> own rewrite via `public/_redirects` (`/* /index.html 200`).

### Cloudflare Pages project settings

- Repo: same as above
- Production branch: `main`
- Build command: `npm run build`
- Output directory: `dist`
- Environment: set `VITE_COMPUTE_API_URL=/compute` so Hoof X-Ray analysis uses the same production proxy path.

Both projects rebuild automatically on every push to `main`.

---

## Verification checklist

Open the canonical URL and confirm:

| Check | Expected |
|---|---|
| Landing page loads | Auth selection (Vet / Admin) renders without console errors |
| Vet login | Form submits to Supabase Auth; valid session persists across page reloads |
| Vet registration | `supabase.auth.signUp()` + Edge Function call; record appears in Supabase `auth.users` and `veterinarians` table |
| Admin login | Form submits; admin session persists across reloads |
| Patient list (admin tab) | Loads from `localStorage` mock (data layer migration is in progress) |
| Clinical Notes OCR upload | PDF/image upload triggers OCR; extracted text appears in the notes field |
| Sign out → sign in cycle | Old session invalidated; new session works on the same gateway |

If login appears to succeed but the session disappears on the next page load,
the localStorage cookie adapter is not active — check that the deployed bundle
is built from `main` at or after the auth-storage commit.

---

## Authentication

### Test fixtures (non-production)

Documented test users used by the seed script (`scripts/seedTestUsers.ts`)
and the Vitest suite. **These are not production credentials** — domain is
non-routable and passwords are well-known test values.

| Role | Email | Password |
|---|---|---|
| Admin | `test-admin@ptp102.local` | `TestAdmin!2026` |
| Vet | `test-vet@ptp102.local` | `TestVet!2026` |

Use these only on environments where the seed script has been applied. Never
use them in production.

### Production credentials

Production admin and operator credentials must be:

- Created via the Supabase dashboard (or a one-shot service-role script run
  ad-hoc, never committed),
- Stored in a password manager / secret store, and
- Rotated on a schedule.

**Do not commit production passwords to this repository, paste them into
documentation, or share them in chat.** Earlier revisions of this file and
of `src/lib/uibakeryDataMock.ts` contained a plain-text admin password
(`PTP102` for `drdsp@pm.me`); that password should be considered
compromised and rotated. See "Outstanding security tasks" below.

### Vet onboarding

Vets must:

1. Register via **New Registration** on the Vet Login page.
2. Accept all Terms & Conditions (digital signature recorded for compliance).
3. Wait for admin approval in the **Veterinarians** tab.
4. Log in with email + password after approval.

Email/password only — no Google OAuth path is wired up.

### Registration flow (IPFS / static deployments)

On the 4EVERLAND IPFS gateway there is no server runtime, so `POST /api/register`
(which was a Vercel serverless function) cannot be called. The registration flow
now uses two client-side calls instead:

1. **`supabase.auth.signUp()`** — creates the Supabase Auth user with metadata.
2. **`supabase.functions.invoke('create-vet-profile')`** — calls a Supabase Edge
   Function that uses the service-role key to set `app_metadata.role = 'vet'` and
   insert the profile row into the `veterinarians` table.

---

## Supabase setup

### Edge Function deployment

The `create-vet-profile` Edge Function lives in
`supabase/functions/create-vet-profile/`. To deploy:

```bash
# Install the Supabase CLI (one-time)
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref mzrmstscqlnfgsrsfjgh

# Deploy the function
supabase functions deploy create-vet-profile

# Verify
supabase functions list
```

The Edge Function requires no manual secrets — `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the Supabase
runtime.

### Allowed origins

Add `byrock.eth.limo` (and any preview domains) to the Supabase project's
**Allowed Origins** list:

1. Open the [Supabase dashboard](https://supabase.com/dashboard/project/mzrmstscqlnfgsrsfjgh).
2. Go to **Authentication → Settings → Allowed Origins**.
3. Add:
   - `https://byrock.eth.limo`
   - `https://*.pages.dev` (Cloudflare Pages previews)
   - `http://localhost:5173` (local dev)
4. Save.

Without this, Supabase Auth will refuse sign-ups from these origins.

### Email confirmation (recommended)

If the Supabase project has **Confirm email** enabled (default), new users
will receive a confirmation link before they can sign in. For this clinical
trial workflow where an admin approves vets manually, you may wish to
**disable** email confirmation:

1. **Authentication → Settings → Email Auth**.
2. Toggle **Confirm email** OFF.
3. Save.

With confirmation off, `signUp()` returns an active session immediately and
the vet can be redirected to the pending-approval page without clicking an
email link. If you keep confirmation ON, the vet must click the confirmation
email first — the pending-approval flow after registration assumes the user
will confirm via email before the admin processes them.

---

## Storage bucket and RLS

The app uploads to a single Supabase Storage bucket `ptp102-trial-portal`
with four top-level folders that mirror the `UploadCategory` values in
`src/lib/upload/config.ts`:

- `trial-documents/` — protocol PDFs, IB documents, regulatory paperwork
- `site-files/` — facility photos and site-qualification documents
- `patient-media/` — gait videos, horse profile images, OCR documents
- `consent-signatures/` — signed consent / e-signature PDFs

### Path scheme

`buildStoragePath(...)` produces:

```
<category>/<userId>/<entityType>/<entityId>/<timestamp>-<safeFileName>
```

`<userId>` is the second path segment so RLS can enforce per-user access.

### Required RLS policies

The browser uploads directly to Supabase Storage (no server-side route),
so the bucket needs RLS policies that allow each authenticated user to
read/write their own paths and let admins read anything. Apply this in
the Supabase SQL editor (one-time setup):

```sql
-- Bucket itself must exist and be marked private. Create via dashboard
-- or with the service-role API. Then attach the policies below.

-- 1. INSERT: any authenticated user can write under their own userId prefix.
create policy "ptp102_user_can_insert_own_path"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'ptp102-trial-portal'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- 2. SELECT: same, plus admin override based on JWT app_metadata.role.
create policy "ptp102_user_can_read_own_path_or_admin"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'ptp102-trial-portal'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    )
  );

-- 3. UPDATE: owner only. (Admins typically don't overwrite uploads.)
create policy "ptp102_user_can_update_own_path"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'ptp102-trial-portal'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'ptp102-trial-portal'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- 4. DELETE: owner only.
create policy "ptp102_user_can_delete_own_path"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'ptp102-trial-portal'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
```

### Verifying the bucket end-to-end

Run the standalone direct-upload probe:

```bash
npx tsx scripts/testDirectUpload.ts
```

This signs in as the seeded test vet, uploads a tiny PDF, mints a signed
URL, HEADs it, then deletes the object. If it exits 0, browser uploads
will work for that user from any host. If it fails on `upload`, check
that the policies above are applied and the bucket name matches.

### Why direct browser upload (no /api/upload)

The repo still contains `api/upload.ts` (a Vercel serverless function)
and `src/lib/upload/uploadHandler.ts` (its handler). These are NOT used
by the browser app on static IPFS / Cloudflare Pages deployments
because those hosts have no server runtime. POSTs to `/api/upload` on
those hosts return HTTP 405 because the gateway can only serve static
files. The browser hooks (`useSecureUpload`, `useSecureDownloadUrl`)
call `supabase.storage` directly. The `/api/*` files are kept in the
repo for future use on a host that does run server functions.

---

## IPFS / ENS considerations

### URL stability

| URL form | Stable? | Use for |
|---|---|---|
| `byrock.eth.limo` | Yes | Sharing, links in docs, canonical tag |
| `byrock.eth` (native ENS) | Yes | Wallet-aware browsers (Brave, MetaMask, etc.) |
| `*-<hash>.ipfs.4everland.app` | **No** — changes per deploy | Internal verification only |

### SPA routing

The app uses React Router in `HashRouter` mode (`/#/path`), so any static-file
host serves `index.html` for the root and the router handles the rest from the
hash. No `_redirects` rewrite rules are required on either provider. The
`_redirects` and `_headers` files in the repo are Cloudflare-specific and have
no effect on 4EVERLAND.

### Security headers

Configured per-provider:
- **Cloudflare Pages:** `_headers` file at repo root.
- **4EVERLAND:** Headers added by the gateway (`eth.limo`) cannot be customized
  from the project. Apply any extra headers via the 4EVERLAND dashboard if
  available.

---

## Data layer (current state)

The app is mid-migration from a UIBakery-managed backend to Supabase.

| Concern | Backend |
|---|---|
| Auth (login, register, sessions) | Supabase Auth |
| Vet registration writes | Supabase Auth (`signUp()` + Edge Function → `auth.users` + `veterinarians`) |
| Secure file uploads (notes, images) | Supabase Storage `private-uploads` bucket, RLS-protected |
| Signed downloads | `/api/download` — 5-minute signed URLs, server-side ACL check |
| OCR (PDF/image text extraction) | Client-side via `pdfjs-dist` + `tesseract.js` (lazy-loaded chunks) |
| **Everything else** (patients, treatments, assessments, audit logs, etc.) | `localStorage` via `src/lib/uibakeryDataMock.ts` |

**Implication:** clearing a user's browser storage erases all clinical data
*outside* of auth and uploaded files. Multi-device sync is not currently
supported for the localStorage-backed entities. See `README.md` and
`PTP102_Platform_Snapshot.md` §4 for the migration roadmap.

---

## Troubleshooting

### Build fails on the deploy provider
1. Confirm `npm run build` succeeds locally on a clean clone.
2. Confirm `package-lock.json` is in sync (`npm ci` should succeed locally).
3. Compare the failing provider's Node version against `engines` in `package.json`.

### Auth works locally but fails on `byrock.eth.limo`
- Open DevTools → Application → Local Storage and look for keys prefixed
  with `sb-cookie:`. If absent, the deployed bundle predates the
  localStorage cookie adapter — redeploy from current `main`.
- Check Network tab for `clear-site-data: cookies` on the document
  response. Its presence is expected on `*.eth.limo`; the adapter is what
  makes auth survive it.

### Build-pinned 4EVERLAND URL changed
That's normal — the `<hash>` portion is content-addressed and changes on
every deploy. Always link to `byrock.eth.limo` instead.

### Data disappeared after refresh
Most non-auth data lives in `localStorage`. Clearing browser storage,
switching browsers, or using incognito mode will wipe it. This is a
known limitation pending the data-layer migration.

---

## Outstanding security tasks

These were identified during deployment audits and should be resolved
before broader public release:

1. **Rotate the legacy admin password.** The literal value `PTP102` was
   committed in plain text in earlier revisions of `DEPLOYMENT.md`,
   `deploy.sh`, `src/lib/uibakeryDataMock.ts`, and several files under
   `src/migrations/`. Treat that string as compromised. Replace with a
   freshly-generated value stored in a secret manager.
2. **Audit `phyto2002@gmail.com` usage.** This real-looking personal
   address is currently the default notification recipient
   (`src/utils/emailNotifications.ts`) and the seeded "demo vet" account
   in `src/lib/uibakeryDataMock.ts`. Either route notifications to a
   role-based mailbox or confirm the personal address is intentional.
3. **Verify `.env.local` history.** Run
   `git log --all -- .env.local`; if the file ever entered git history,
   rotate `SUPABASE_SERVICE_ROLE_KEY` and `VITE_SUPABASE_ANON_KEY` in the
   Supabase dashboard.

---

## Documentation map

- `README.md` — project overview, stack, layout, conventions
- `PTP102_Platform_Snapshot.md` §4 — feature gaps and migration roadmap
- `src/AUTHENTICATION_TROUBLESHOOTING.md` — auth-refactor history
- `src/EMAIL_NOTIFICATIONS_SETUP.md` — EmailJS wiring (incomplete)
