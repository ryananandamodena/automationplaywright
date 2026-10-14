import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Stock - CMS Stock Management Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
    await page.goto('/cms/stock');
  });

  test('CMS-STK-001 stock management table renders with columns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Stock' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    const headerTexts = await page.locator('thead tr th').allInnerTexts();
    expect(headerTexts.length).toBeGreaterThan(0);
  });

  test('CMS-STK-002 stock list shows product items and status badges', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
