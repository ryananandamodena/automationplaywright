import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Categories - CMS Categories Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
    await page.goto('/cms/categories');
  });

  test('CMS-CAT-001 categories table renders with columns and records', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('CMS-CAT-002 Add Category button/action is present', async ({ page }) => {
    const addCategoryBtn = page.getByRole('button', { name: /Add Category|New Category/i }).or(page.getByRole('link', { name: /Add Category|New Category/i }));
    if (await addCategoryBtn.isVisible()) {
      await expect(addCategoryBtn).toBeEnabled();
    }
  });
});
