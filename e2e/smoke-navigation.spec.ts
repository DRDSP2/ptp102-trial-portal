import { expect, test } from '@playwright/test';

const publicRoutes = [
  { hash: '#/', text: 'PTP-102 Trial Portal' },
  { hash: '#/vet/login', text: 'Veterinarian Login' },
  { hash: '#/vet/register', text: 'Back to Login' },
  { hash: '#/vet/forgot', text: 'Request password reset' },
  { hash: '#/admin/login', text: 'Admin Access' },
] as const;

const guardedRoutes = ['#/vet/pending', '#/dashboard', '#/admin/audit-log', '#/patient/smoke-test-patient'] as const;

test.describe('navigation smoke test', () => {
  test('loads public routes without browser errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    page.on('requestfailed', (request) => failedRequests.push(`${request.method()} ${request.url()}`));
    page.on('response', (response) => {
      if (response.status() >= 400) {
        failedRequests.push(`${response.status()} ${response.url()}`);
      }
    });

    for (const route of publicRoutes) {
      await page.goto(`/${route.hash}`);
      await expect(page.getByText(route.text).first()).toBeVisible();
    }

    expect(consoleErrors, 'browser console errors').toEqual([]);
    expect(failedRequests, 'failed network requests').toEqual([]);
  });

  test('primary unauthenticated navigation has no dead ends', async ({ page }) => {
    await page.goto('/#/');

    await page.getByRole('button', { name: 'Veterinarian Access' }).click();
    await expect(page).toHaveURL(/#\/vet\/login$/);
    await expect(page.getByText('Veterinarian Login')).toBeVisible();

    await page.getByRole('button', { name: 'New Registration' }).click();
    await expect(page).toHaveURL(/#\/vet\/register$/);
    await expect(page.getByRole('button', { name: 'Back to Login' })).toBeVisible();

    await page.getByRole('button', { name: 'Back to Login' }).click();
    await expect(page).toHaveURL(/#\/vet\/login$/);

    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/#\/vet\/forgot$/);
    await expect(page.getByText('Request password reset')).toBeVisible();

    await page.getByRole('button', { name: 'Back to Login' }).click();
    await expect(page).toHaveURL(/#\/vet\/login$/);

    await page.getByRole('button', { name: 'Back to Access Selection' }).click();
    await expect(page).toHaveURL(/#\/$/);

    await page.getByRole('button', { name: 'Admin Access' }).click();
    await expect(page).toHaveURL(/#\/admin\/login$/);
    await expect(page.getByText('Admin Access')).toBeVisible();

    await page.getByRole('button', { name: 'Back to Access Selection' }).click();
    await expect(page).toHaveURL(/#\/$/);
  });

  test('guarded and unknown routes redirect safely', async ({ page }) => {
    for (const hash of guardedRoutes) {
      await page.goto(`/${hash}`);
      await expect(page).toHaveURL(/#\/$/);
      await expect(page.getByText('PTP-102 Trial Portal')).toBeVisible();
    }

    await page.goto('/#/not-a-real-route');
    await expect(page).toHaveURL(/#\/$/);
    await expect(page.getByText('PTP-102 Trial Portal')).toBeVisible();
  });
});
