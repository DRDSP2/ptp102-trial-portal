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

### Cloudflare Pages project settings

- Repo: same as above
- Production branch: `main`
- Build command: `npm run build`
- Output directory: `dist`

Both projects rebuild automatically on every push to `main`.

---

## Verification checklist

Open the canonical URL and confirm:

| Check | Expected |
|---|---|
| Landing page loads | Auth selection (Vet / Admin) renders without console errors |
| Vet login | Form submits to Supabase Auth; valid session persists across page reloads |
| Vet registration | Form posts to `/api/register`; record appears in Supabase `auth.users` |
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
| Vet registration writes | Supabase (`/api/register` → `auth.users`) |
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
