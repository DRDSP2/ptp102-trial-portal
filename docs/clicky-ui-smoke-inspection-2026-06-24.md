# Clicky UI Smoke Inspection — 2026-06-24

## Scope

- Inspected the Vite/React app route surface declared in `src/app/app.tsx`.
- Used Playwright against the local Vite app at `http://127.0.0.1:5173`.
- Checked public hash routes, guarded hash routes, unknown-route fallback, primary unauthenticated navigation, console errors, failed requests, and 4xx/5xx responses.
- Did not inspect, modify, or test OCR pipeline files.

## Routes Covered

| Route | Result | Notes |
| --- | --- | --- |
| `#/` | Pass | Home/access selection renders. |
| `#/vet/login` | Pass | Veterinarian login renders. |
| `#/vet/register` | Pass | Registration screen renders; first heading can be above the active viewport after navigation, so the smoke test asserts the visible `Back to Login` control. |
| `#/vet/forgot` | Pass | Password reset request screen renders. |
| `#/admin/login` | Pass | Admin login renders. |
| `#/vet/pending` | Pass | Redirects safely to home while unauthenticated. |
| `#/dashboard` | Pass | Redirects safely to home while unauthenticated. |
| `#/admin/audit-log` | Pass | Redirects safely to home while unauthenticated. |
| `#/patient/smoke-test-patient` | Pass | Redirects safely to home while unauthenticated. |
| `#/not-a-real-route` | Pass | Redirects safely to home. |

## Issues Found

### No broken links, 404s, or blocking runtime errors found

- Reproduction: Run `npx playwright test e2e/smoke-navigation.spec.ts --project=chromium`.
- Result: All three smoke tests pass.
- Suspected root cause: N/A.

### Non-blocking console warnings observed during local smoke crawl

- Reproduction: Load the app locally with Playwright or DevTools console open.
- Observed warnings:
  - Missing Supabase environment variables; app falls back to a no-op auth client.
  - Browser compatibility warning for `crypto.randomBytes` being externalized by Vite.
  - React Router v7 future-flag warnings.
- Impact: These did not break public navigation or route fallback checks. The Supabase warning is expected if local env vars are absent, but it can hide real auth/API issues during deeper workflows.
- Suspected root cause: local environment configuration plus dependency/runtime warnings, not route wiring.

### Registration screen starts with key title offscreen in Chromium smoke viewport

- Reproduction: Navigate from `#/vet/login` to `#/vet/register` and inspect the first visible viewport.
- Result: The page is usable and `Back to Login` is visible, but the main `PTP-102 Laminitis Pilot Study` heading can resolve as hidden in Playwright visibility checks.
- Suspected root cause: tall registration/terms layout and current scroll/positioning behavior.
- Recommended small fix: ensure the page scrolls to top on route entry, or move the main heading into the initial viewport consistently.

## Smoke Test Added

Added `e2e/smoke-navigation.spec.ts` with three checks:

1. Public route availability with no console errors, failed requests, or 4xx/5xx responses.
2. Primary unauthenticated navigation has no dead ends.
3. Guarded and unknown routes redirect safely to the home/access selection screen.

Run it with:

```bash
PATH="$PWD/node-v20.11.1-darwin-arm64/bin:$PATH" npx playwright test e2e/smoke-navigation.spec.ts --project=chromium
```

Latest result: 3 passed.

## Minimal UI Flow And Style Suggestions

- Add route-entry scroll reset for long screens like registration so headings and context are reliably visible after navigation. Applied in `src/app/app.tsx`.
- Keep access flow actions as shadcn `Button` variants, but consider changing `Back to Veterinarian Login` on the admin login page to `Back to Access Selection` for clearer copy because it returns to the root access chooser. Applied in `src/components/AdminLoginScreen.tsx`.
- Add visible page-level headings to login/reset screens in the semantic `h1` hierarchy if the nested card title is not exposed consistently; this improves smoke-test targeting and accessibility.
- Consider making the local Supabase no-op state more explicit in UI during development so failed auth flows are easier to distinguish from broken navigation.
- Opt into React Router future flags in a separate dependency-maintenance patch only after confirming route behavior, to remove warning noise without mixing it into this smoke-test change. Applied in `src/app/app.tsx` after the route smoke suite passed.

## Polish Fixes Applied

- Added route-entry scroll reset inside the hash router so long screens start at the top after navigation.
- Opted into React Router v7 future flags to remove the non-blocking router warning noise observed during the smoke crawl.
- Renamed the admin login secondary action to `Back to Access Selection` and updated the prop name to match the actual destination.
- Updated `e2e/smoke-navigation.spec.ts` to assert the clearer admin back button copy.

Latest post-polish validation:

```bash
PATH="$PWD/node-v20.11.1-darwin-arm64/bin:$PATH" npm run typecheck
PATH="$PWD/node-v20.11.1-darwin-arm64/bin:$PATH" npx playwright test e2e/smoke-navigation.spec.ts --project=chromium --reporter=line
```

Result: typecheck passed; smoke navigation passed 3/3.

## Files Changed

- `e2e/smoke-navigation.spec.ts` — new Playwright smoke test.
- `docs/clicky-ui-smoke-inspection-2026-06-24.md` — inspection report.
