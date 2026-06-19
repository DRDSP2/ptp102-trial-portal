import { expect, Page, request, test } from '@playwright/test';
import path from 'node:path';

type StepResult = {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  details: string;
};

const requiredEnv = [
  'E2E_BASE_URL',
  'E2E_ADMIN_EMAIL',
  'E2E_ADMIN_PASSWORD',
  'E2E_VET_PASSWORD',
  'E2E_REGISTER_PATH',
  'E2E_ADMIN_LOGIN_PATH',
  'E2E_VET_LOGIN_PATH',
  'E2E_ADMIN_APPROVAL_PATH',
  'E2E_ADMIN_TRACKING_PATH',
  'E2E_BACKEND_STATE_URL',
  'E2E_BACKEND_STATE_TOKEN',
] as const;

const SUPPORT_EMAIL = 'drsp@pm.me';
const PAGE_ERROR_TEXT = /error|exception|failed|unauthorized|forbidden/i;

const selectors = {
  registerFullName: envOrDefault('E2E_SEL_REGISTER_FULL_NAME', '[data-testid="vet-registration-full-name"]'),
  registerEmail: envOrDefault('E2E_SEL_REGISTER_EMAIL', '[data-testid="vet-registration-email"], input[type="email"]'),
  registerPhone: envOrDefault('E2E_SEL_REGISTER_PHONE', '[data-testid="vet-registration-phone"]'),
  registerPassword: envOrDefault('E2E_SEL_REGISTER_PASSWORD', '[data-testid="vet-registration-password"], input[type="password"]'),
  registerConfirmPassword: envOrDefault('E2E_SEL_REGISTER_CONFIRM_PASSWORD', '[data-testid="vet-registration-confirm-password"]'),
  registerLicenseNumber: envOrDefault('E2E_SEL_REGISTER_LICENSE_NUMBER', '[data-testid="vet-registration-license-number"]'),
  registerHospitalAffiliation: envOrDefault('E2E_SEL_REGISTER_HOSPITAL_AFFILIATION', '[data-testid="vet-registration-hospital-affiliation"]'),
  registerInvestigationalAcknowledged: envOrDefault('E2E_SEL_REGISTER_INVESTIGATIONAL_ACKNOWLEDGED', '[data-testid="vet-registration-investigational-acknowledged"]'),
  registerRiskAccepted: envOrDefault('E2E_SEL_REGISTER_RISK_ACCEPTED', '[data-testid="vet-registration-risk-accepted"]'),
  registerLiabilityAcknowledged: envOrDefault('E2E_SEL_REGISTER_LIABILITY_ACKNOWLEDGED', '[data-testid="vet-registration-liability-acknowledged"]'),
  registerNoConflictOfInterest: envOrDefault('E2E_SEL_REGISTER_NO_CONFLICT_OF_INTEREST', '[data-testid="vet-registration-no-conflict-of-interest"]'),
  registerSignatureText: envOrDefault('E2E_SEL_REGISTER_SIGNATURE_TEXT', '[data-testid="vet-registration-signature-text"]'),
  registerSubmit: envOrDefault('E2E_SEL_REGISTER_SUBMIT', '[data-testid="vet-registration-submit"], button:has-text("Register"), button:has-text("Accept")'),
  successMessage: envOrDefault('E2E_SEL_SUCCESS_MESSAGE', '[data-testid="vet-pending-approval"], :text("Approved"), :text("success"), :text("submitted")'),
  adminEmail: envOrDefault('E2E_SEL_ADMIN_EMAIL', 'input[type="email"]'),
  adminPassword: envOrDefault('E2E_SEL_ADMIN_PASSWORD', 'input[type="password"]'),
  adminSubmit: envOrDefault('E2E_SEL_ADMIN_SUBMIT', 'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")'),
  vetEmail: envOrDefault('E2E_SEL_VET_EMAIL', 'input[type="email"]'),
  vetPassword: envOrDefault('E2E_SEL_VET_PASSWORD', 'input[type="password"]'),
  vetSubmit: envOrDefault('E2E_SEL_VET_SUBMIT', 'button[type="submit"], button:has-text("Login"), button:has-text("Sign in")'),
  approveVet: envOrDefault('E2E_SEL_APPROVE_VET', '[data-testid="approve-vet"]'),
  approvalReasonInput: envOrDefault('E2E_SEL_APPROVAL_REASON_INPUT', '[data-testid="vet-approval-reason-input"]'),
  approvalReasonConfirm: envOrDefault('E2E_SEL_APPROVAL_REASON_CONFIRM', '[data-testid="vet-approval-reason-confirm"]'),
  imageInput: envOrDefault('E2E_SEL_IMAGE_INPUT', 'input[type="file"][accept*=image], input[type="file"]'),
  documentInput: envOrDefault('E2E_SEL_DOCUMENT_INPUT', '[data-testid="document-upload"], input[type="file"]'),
  contactAdmin: envOrDefault('E2E_SEL_CONTACT_ADMIN', 'a:has-text("Contact Admin"), button:has-text("Contact Admin"), a:has-text("Contact Support"), button:has-text("Contact Support")'),
  trackingProduct: envOrDefault('E2E_SEL_TRACKING_PRODUCT', '[data-testid="tracking-product"], [data-testid="supply-product"]'),
  newOwner: envOrDefault('E2E_SEL_NEW_OWNER', '[data-testid="new-owner"], select[name="owner"], input[name="owner"]'),
  newCategory: envOrDefault('E2E_SEL_NEW_CATEGORY', '[data-testid="new-category"], select[name="category"], input[name="category"]'),
  moveProduct: envOrDefault('E2E_SEL_MOVE_PRODUCT', '[data-testid="move-product"], button:has-text("Move"), button:has-text("Transfer")'),
};

const state = {
  stepResults: [] as StepResult[],
  vetEmail: `e2e.vet.${Date.now()}@example.test`,
};

test.describe('vet onboarding and admin management E2E', () => {
  test.beforeAll(() => {
    const missing = requiredEnv.filter((name) => !process.env[name]);
    test.skip(
      missing.length > 0,
      `Missing dedicated-test-environment configuration: ${missing.join(', ')}. Set these before running against a disposable non-production system.`,
    );
  });

  test.afterAll(async () => {
    console.table(state.stepResults);
  });

  test('register, approve, upload, contact admin, move product, and verify boundaries', async ({ page, baseURL }) => {
    await runStep('Vet registration submits approval request', async () => {
      await page.goto(requiredPath('E2E_REGISTER_PATH'));
      await fillVetRegistrationForm(page);
      await page.locator(selectors.registerSubmit).first().click();
      await expect(page.locator(selectors.successMessage).first()).toBeVisible();
      await expectBackendState('vet_pending');
    });

    await runStep('Pending vet cannot access admin routes', async () => {
      await page.goto(requiredPath('E2E_ADMIN_TRACKING_PATH'));
      await expect(page).not.toHaveURL(/admin\/tracking|admin\/supply|admin\/audit/i);
      await expect(page.locator('body')).toContainText(/login|admin|unauthorized|access|pending/i);
    });

    await runStep('Admin approves disposable vet', async () => {
      await adminLogin(page);
      await page.goto(requiredPath('E2E_ADMIN_APPROVAL_PATH'));
      const vetRow = page.locator(`[data-testid="vet-row-${state.vetEmail}"]`);
      await expect(vetRow).toBeVisible();
      await vetRow.locator(selectors.approveVet).click();
      await page.locator(selectors.approvalReasonInput).fill('E2E approval after verified disposable registration request.');
      await page.locator(selectors.approvalReasonConfirm).click();
      await expectBackendState('vet_approved');
      await assertPortalHasNoUnexpectedErrors(page);
    });

    await runStep('Approved vet uploads fake image and document', async () => {
      await vetLogin(page);
      await assertPortalHasNoUnexpectedErrors(page);
      await uploadFixture(page, selectors.imageInput, 'fake-horse.png');
      await uploadFixture(page, selectors.documentInput, 'fake-consent.txt');
      await expect(page.locator(selectors.successMessage).first()).toBeVisible();
      await expectBackendState('uploads_present');
    });

    await runStep('Contact Admin flow resolves to configured support channel', async () => {
      const contact = page.locator(selectors.contactAdmin).first();
      await expect(contact).toBeVisible();
      const href = await contact.getAttribute('href');
      if (href) {
        expect(decodeURIComponent(href)).toContain(SUPPORT_EMAIL);
      } else {
        await contact.click();
        await expect(page.locator('body')).toContainText(new RegExp(`${SUPPORT_EMAIL}|admin|support|message`, 'i'));
      }
    });

    await runStep('Admin moves tracked product owner or category', async () => {
      await adminLogin(page);
      await page.goto(requiredPath('E2E_ADMIN_TRACKING_PATH'));
      await page.locator(selectors.trackingProduct).first().click();
      await fillOrSelect(page, selectors.newOwner, envOrDefault('E2E_TARGET_OWNER', 'E2E Target Owner'));
      await fillOrSelect(page, selectors.newCategory, envOrDefault('E2E_TARGET_CATEGORY', 'E2E Target Category'));
      await page.locator(selectors.moveProduct).first().click();
      await expect(page.locator(selectors.successMessage).first()).toBeVisible();
      await expectBackendState('product_moved');
    });

    await runStep('Relevant page links return healthy responses', async () => {
      await assertHealthyLinks(page, baseURL!, [
        requiredPath('E2E_REGISTER_PATH'),
        requiredPath('E2E_VET_LOGIN_PATH'),
        requiredPath('E2E_ADMIN_APPROVAL_PATH'),
        requiredPath('E2E_ADMIN_TRACKING_PATH'),
      ]);
    });
  });
});

async function adminLogin(page: Page) {
  await page.goto(requiredPath('E2E_ADMIN_LOGIN_PATH'));
  await page.locator(selectors.adminEmail).first().fill(process.env.E2E_ADMIN_EMAIL!);
  await page.locator(selectors.adminPassword).first().fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.locator(selectors.adminSubmit).first().click();
  await expect(page.locator('body')).toContainText(/dashboard|admin|overview|veterinarian|supply/i);
}

async function assertPortalHasNoUnexpectedErrors(page: Page) {
  await expect(page.locator('[role="alert"], [data-testid*="error"], .error')).not.toContainText(PAGE_ERROR_TEXT);
}

async function vetLogin(page: Page) {
  await page.goto(requiredPath('E2E_VET_LOGIN_PATH'));
  await page.locator(selectors.vetEmail).first().fill(state.vetEmail);
  await page.locator(selectors.vetPassword).first().fill(process.env.E2E_VET_PASSWORD!);
  await page.locator(selectors.vetSubmit).first().click();
  await expect(page.locator('body')).toContainText(/dashboard|patient|research|supply|protocol/i);
}

async function uploadFixture(page: Page, selector: string, fileName: string) {
  const filePath = path.resolve('e2e/fixtures', fileName);
  const input = page.locator(selector).first();
  await input.setInputFiles(filePath);
}

async function fillVetRegistrationForm(page: Page) {
  const vetName = 'Dr E2E Registration Vet';
  const vetPassword = process.env.E2E_VET_PASSWORD!;

  await page.locator(selectors.registerFullName).first().fill(vetName);
  await page.locator(selectors.registerEmail).first().fill(state.vetEmail);
  await page.locator(selectors.registerPhone).first().fill('+15551234567');
  await page.locator(selectors.registerPassword).first().fill(vetPassword);
  await page.locator(selectors.registerConfirmPassword).first().fill(vetPassword);
  await page.locator(selectors.registerLicenseNumber).first().fill(`E2E-${Date.now()}`);
  await page.locator(selectors.registerHospitalAffiliation).first().fill('E2E Test Equine Clinic');
  await page.locator(selectors.registerSignatureText).first().fill(vetName);
  await checkIfUnchecked(page, selectors.registerInvestigationalAcknowledged);
  await checkIfUnchecked(page, selectors.registerRiskAccepted);
  await checkIfUnchecked(page, selectors.registerLiabilityAcknowledged);
  await checkIfUnchecked(page, selectors.registerNoConflictOfInterest);
}

async function checkIfUnchecked(page: Page, selector: string) {
  const checkbox = page.locator(selector).first();
  await expect(checkbox).toBeVisible();
  if ((await checkbox.getAttribute('data-state')) !== 'checked') {
    await checkbox.click();
  }
}

async function fillIfVisible(page: Page, selector: string, value: string) {
  const locator = page.locator(selector).first();
  if (await locator.isVisible()) {
    await locator.fill(value);
  }
}

async function fillOrSelect(page: Page, selector: string, value: string) {
  const locator = page.locator(selector).first();
  await expect(locator).toBeVisible();
  const tagName = await locator.evaluate((element) => element.tagName.toLowerCase());
  if (tagName === 'select') {
    await locator.selectOption({ label: value }).catch(async () => locator.selectOption(value));
  } else {
    await locator.fill(value);
  }
}

async function assertHealthyLinks(page: Page, baseURL: string, paths: string[]) {
  const apiContext = await request.newContext({ baseURL });
  const checked = new Set<string>();

  for (const pagePath of paths) {
    await page.goto(pagePath);
    const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
      anchors
        .map((anchor) => anchor.getAttribute('href'))
        .filter((href): href is string => Boolean(href))
        .filter((href) => !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')),
    );

    for (const href of hrefs) {
      const url = new URL(href, baseURL);
      const key = url.toString();
      if (checked.has(key)) continue;
      checked.add(key);
      const response = await apiContext.get(url.pathname + url.search);
      expect(response.status(), `${key} should be healthy`).toBeLessThan(400);
    }
  }

  await apiContext.dispose();
}

async function expectBackendState(expectedState: string) {
  const backendUrl = process.env.E2E_BACKEND_STATE_URL;
  if (!backendUrl) return;

  const apiContext = await request.newContext({
    extraHTTPHeaders: process.env.E2E_BACKEND_STATE_TOKEN
      ? { Authorization: `Bearer ${process.env.E2E_BACKEND_STATE_TOKEN}` }
      : undefined,
  });
  await expect
    .poll(
      async () => {
        const response = await apiContext.get(backendUrl, {
          params: {
            expectedState,
            vetEmail: state.vetEmail,
          },
        });
        const body = await response.json().catch(() => null);
        return {
          ok: response.ok() && (!body || typeof body !== 'object' || !('ok' in body) || body.ok === true),
          status: response.status(),
          body,
        };
      },
      { message: `${expectedState} backend state endpoint should pass`, timeout: 30_000 },
    )
    .toMatchObject({ ok: true });
  await apiContext.dispose();
}

async function runStep(name: string, action: () => Promise<void>) {
  try {
    await action();
    state.stepResults.push({ name, status: 'passed', details: 'OK' });
  } catch (error) {
    state.stepResults.push({
      name,
      status: 'failed',
      details: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function envOrDefault(name: string, fallback: string) {
  return process.env[name] || fallback;
}

function requiredPath(name: (typeof requiredEnv)[number]) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
