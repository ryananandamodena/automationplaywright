import { test, expect } from '@playwright/test';
import { BASE_URL, ADMIN, CMS_MENUS, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

// CMS-SMK-001..004 from 11_cms_admin_test_cases.md.
// Read-only: only navigates and asserts, never edits/deletes/ships/cancels —
// safe to run repeatedly against the shared dev CMS.
test.describe('Smoke Suite - CMS Admin', () => {
  test('CMS-SMK-001 login with valid admin credentials succeeds', async ({ page }) => {
    await loginCms(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('CMS-SMK-002 dashboard renders KPI cards and recent orders', async ({ page }) => {
    await loginCms(page);
    // "Total Sales" also appears as a lowercase chart caption ("total sales")
    // — Playwright's default text match is case-insensitive substring, so
    // scope to the KPI card link to avoid the strict-mode ambiguity.
    await expect(page.getByRole('link', { name: /Total Sales/ })).toBeVisible();
    await expect(page.getByText('Orders Processed')).toBeVisible();
    await expect(page.getByText('Orders Waiting Approval')).toBeVisible();
    await expect(page.getByText('Total Products')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Orders' })).toBeVisible();
  });

  for (const menu of CMS_MENUS) {
    test(`CMS-SMK-003 sidebar menu "${menu.label}" opens without error`, async ({ page }) => {
      await loginCms(page);
      await page.goto(menu.path);
      // No app-level error boundary / 404 text, and the CMS sidebar itself
      // still renders (proves the page didn't crash the whole shell).
      await expect(page.getByText('MODENA', { exact: false }).first()).toBeVisible();
      await expect(page.getByText(/error|not found|something went wrong/i)).toHaveCount(0);
    });
  }

  test('CMS-SMK-004 logout ends the session', async ({ page }) => {
    await loginCms(page);
    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/cms\/login\/?$/);
  });
});
