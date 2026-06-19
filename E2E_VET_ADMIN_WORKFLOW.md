# Vet/Admin End-to-End Workflow Test

This repo now includes an opt-in Playwright suite for the full disposable vet and admin workflow. It is intentionally guarded so it will not run against production or guessed credentials.

## What it covers

- Registers a new fake veterinarian account and verifies the pending approval state.
- Confirms a pending vet cannot open admin-only tracking routes.
- Logs in as an admin and approves the disposable vet.
- Logs in as that vet and uploads fake image/document fixtures.
- Exercises the Contact Admin/Support flow and checks the configured admin destination.
- Logs back in as admin and moves a tracked product to a target owner/category.
- Checks relevant page links for healthy HTTP responses.
- Calls a backend verification endpoint after key steps when configured.
- Captures screenshots, videos, and traces on failures through Playwright.

## Required safe environment

Run only against a dedicated test/staging system with disposable accounts, test data, and stable selectors. Do not point these variables at production.

Required variables:

```bash
export E2E_BASE_URL="http://127.0.0.1:5173"
export E2E_ADMIN_EMAIL="admin@example.test"
export E2E_ADMIN_PASSWORD="replace-with-test-password"
export E2E_VET_PASSWORD="replace-with-test-password"
export E2E_REGISTER_PATH="/#/vet/register"
export E2E_ADMIN_LOGIN_PATH="/#/admin/login"
export E2E_VET_LOGIN_PATH="/#/vet/login"
export E2E_ADMIN_APPROVAL_PATH="/#/dashboard"
export E2E_ADMIN_TRACKING_PATH="/#/dashboard"
export E2E_BACKEND_STATE_URL="http://127.0.0.1:3001/e2e/state"
export E2E_BACKEND_STATE_TOKEN="replace-with-long-random-test-token"
export E2E_BACKEND_STATE_ENABLED="true"
```

Optional selector overrides are available for every important control. Use them to bind the test to stable `data-testid` selectors instead of brittle text matching:

```bash
export E2E_SEL_REGISTER_EMAIL='[data-testid="vet-register-email"]'
export E2E_SEL_REGISTER_PASSWORD='[data-testid="vet-register-password"]'
export E2E_SEL_REGISTER_SUBMIT='[data-testid="vet-register-submit"]'
export E2E_SEL_APPROVE_VET='[data-testid="approve-vet"]'
export E2E_SEL_IMAGE_INPUT='[data-testid="horse-image-upload"]'
export E2E_SEL_DOCUMENT_INPUT='[data-testid="consent-document-upload"]'
export E2E_SEL_CONTACT_ADMIN='[data-testid="contact-admin"]'
export E2E_SEL_TRACKING_PRODUCT='[data-testid="tracking-product"]'
export E2E_SEL_NEW_OWNER='[data-testid="new-owner"]'
export E2E_SEL_NEW_CATEGORY='[data-testid="new-category"]'
export E2E_SEL_MOVE_PRODUCT='[data-testid="move-product"]'
```

## Backend state endpoint contract

`E2E_BACKEND_STATE_URL` is implemented by the local dev API server at `/e2e/state`. It is disabled unless `E2E_BACKEND_STATE_ENABLED=true`, `E2E_BACKEND_STATE_TOKEN` is set, and the server is not running in production. The Playwright test sends these query parameters:

- `expectedState`: one of `vet_pending`, `vet_approved`, `uploads_present`, or `product_moved`.
- `vetEmail`: the generated disposable vet email for this run.

The Playwright test sends `E2E_BACKEND_STATE_TOKEN` as a bearer token. Return HTTP 2xx and either no JSON body or `{ "ok": true }` when the expected state is correct. Return HTTP 4xx/5xx or `{ "ok": false }` when it is not.

## Commands

Install browser binaries once if needed:

```bash
npx playwright install chromium
```

Start the local API server in a separate terminal for local staging runs:

```bash
E2E_BACKEND_STATE_ENABLED=true E2E_BACKEND_STATE_TOKEN="$E2E_BACKEND_STATE_TOKEN" npm run dev:server
```

Run the suite:

```bash
npm run test:e2e
```

Open the failure/pass report:

```bash
npm run test:e2e:report
```

## Regression recommendations

- Add stable `data-testid` attributes to all workflow-critical controls listed above.
- Keep fake upload fixtures small and non-sensitive.
- Seed test-only admin, vet, patient, and product records before each run.
- Reset the staging database or namespace data by generated vet email after each run.
- Keep admin and vet browser states separate if session isolation issues appear.
- Add one backend assertion per UI mutation so the test catches UI-only false positives.
