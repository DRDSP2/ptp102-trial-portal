import { expect, Page, test } from '@playwright/test';

/**
 * E2E: Patient signup → admin approval → check-status shows the update.
 *
 * Runs against the Vite dev server with the mock data layer (localStorage).
 * No real Supabase credentials are needed: a fetch interceptor installed via
 * page.addInitScript intercepts Supabase auth + REST calls and returns mock
 * responses, so signInWithPassword succeeds and the AuthContext hydrate
 * query to `veterinarians` returns a valid profile. All data operations
 * (loadPatients, createPatient, approvePatientScreening) go through the
 * existing uibakeryDataMock localStorage layer.
 *
 * The playwright.config.ts webServer starts `npm run dev` on 127.0.0.1:5173
 * automatically.
 */

const ADMIN_EMAIL = 'drdsp@pm.me';
const ADMIN_PASSWORD = 'PTP102';

test.describe('Patient signup, approval, and check-status', () => {
  test('admin enrolls patient, approves it, and verifies the status update', async ({ page }) => {
    // ── Install the Supabase mock interceptor ───────────────────────────
    // Runs before any page script on every navigation. Intercepts auth
    // token, logout, veterinarians REST, and audit_logs REST calls so the
    // app never hits the real Supabase backend.
    await page.addInitScript(() => {
      const realFetch = window.fetch.bind(window);
      window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;

        // signInWithPassword → POST /auth/v1/token?grant_type=password
        if (url.includes('/auth/v1/token') && init?.method !== 'DELETE') {
          let email = '';
          try {
            email = JSON.parse((init?.body as string) ?? '{}').email ?? '';
          } catch { /* ignore parse errors */ }
          const role = email.toLowerCase() === 'drdsp@pm.me' ? 'admin' : 'vet';
          return new Response(JSON.stringify({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: 'mock-user-id',
              email,
              app_metadata: { role },
              user_metadata: { role },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            },
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // signOut → POST /auth/v1/logout or DELETE /auth/v1/token
        if (url.includes('/auth/v1/logout') ||
            (url.includes('/auth/v1/token') && init?.method === 'DELETE')) {
          return new Response('{}', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // AuthContext hydrate: supabase.from('veterinarians').select(...)
        if (url.includes('/rest/v1/veterinarians')) {
          return new Response(JSON.stringify([
            { tc_accepted: true, verification_status: 'approved' },
          ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        // Audit dual-write: supabase.from('audit_logs').insert(...)
        if (url.includes('/rest/v1/audit_logs')) {
          return new Response('[]', {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return realFetch(input as RequestInfo, init);
      }) as typeof window.fetch;
    });

    const horseName = `E2E Horse ${Date.now()}`;

    // ── Step 1: Admin logs in ────────────────────────────────────────────
    await page.goto('#/admin/login');
    await page.locator('input[type="email"]').first().fill(ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(ADMIN_PASSWORD);
    await page.locator('button:has-text("Login as Admin")').click();

    // Wait for the dashboard to load
    await expect(page.locator('body')).toContainText(
      /PTP-102|overview|patient|veterinarian|supply/i,
      { timeout: 15_000 },
    );

    // ── Step 2: Enroll a new patient (Flow 1: signup) ───────────────────
    // Navigate to the Patients tab (admin dashboard defaults to "overview")
    await page.locator('[role="tab"]:has-text("Patients")').click();
    await expect(page.locator('button:has-text("Enroll Patient")')).toBeVisible({ timeout: 5_000 });

    // Open the enrollment dialog
    await page.locator('button:has-text("Enroll Patient")').first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5_000 });

    // Fill the minimum required Basic Information fields.
    // sex, eligibilityVerified, and enrollmentDate have default values
    // that pass validation, so we only fill the text/number inputs.
    // ownerContact must be >= 10 chars per the Zod schema.
    await page.locator('input[name="horseName"]').fill(horseName);
    await page.locator('input[name="age"]').fill('8');
    await page.locator('input[name="breed"]').fill('Arabian');
    await page.locator('input[name="weight"]').fill('450');
    await page.locator('input[name="ownerName"]').fill('E2E Owner');
    await page.locator('input[name="ownerContact"]').fill('555-010-1234');

    // Submit the form — click the submit button inside the dialog
    await page.locator('[role="dialog"] button[type="submit"]').click();

    // Assert the dialog closed (signup succeeded, no error kept it open)
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10_000 });

    // ── Step 3: Approve the patient (Flow 2: approval) ──────────────────
    // The patient list should now contain our horse
    const patientRow = page.locator('tr', { hasText: horseName }).first();
    await expect(patientRow).toBeVisible({ timeout: 10_000 });

    // Click the Admit button in the patient's row
    await patientRow.locator('button[title="Admit"]').click();

    // Confirm in the screening dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5_000 });
    await page.locator('[role="dialog"] button:has-text("Admit")').click();

    // Assert the dialog closed (approval succeeded, no error)
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10_000 });

    // ── Step 4: Verify status update (Flow 3: check-status) ─────────────
    // After approval + refresh, the row should show "Approved" / "enrolled"
    await expect(patientRow).toContainText(/approved|enrolled/i, { timeout: 10_000 });
  });
});
