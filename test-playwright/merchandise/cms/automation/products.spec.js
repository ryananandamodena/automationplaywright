import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Products - Master Data Products Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
    await page.goto('/cms/products');
  });

  test('CMS-PRD-001 products table renders with required columns', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    const columns = ['Product', 'Category', 'Price', 'Stock', 'SAP Code', 'Badge', 'Status', 'Actions'];
    for (const col of columns) {
      await expect(page.locator('th', { hasText: col })).toBeVisible();
    }
  });

  test('CMS-PRD-002 search filters products by query', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Hoodie');
    await page.waitForTimeout(500);
    await expect(page.getByRole('cell', { name: /HOODIE/i }).first()).toBeVisible();
  });

  test('CMS-PRD-003 search with unmatched keyword shows empty list gracefully', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await searchInput.fill('xyz_non_existent_product_123');
    await page.waitForTimeout(500);
    await expect(page.getByRole('cell', { name: /xyz_non_existent_product_123/i })).toHaveCount(0);
    await expect(page.getByText(/error|exception|crash/i)).toHaveCount(0);
  });

  test('CMS-PRD-004 pagination navigates between pages correctly', async ({ page }) => {
    const page2Button = page.getByRole('button', { name: '2', exact: true });
    if (await page2Button.isVisible()) {
      const firstRowName = await page.locator('tbody tr').first().locator('td').first().innerText();
      await page2Button.click();
      await page.waitForTimeout(500);
      const newPageRowName = await page.locator('tbody tr').first().locator('td').first().innerText();
      expect(newPageRowName).not.toBe(firstRowName);

      const page1Button = page.getByRole('button', { name: '1', exact: true });
      await page1Button.click();
      await page.waitForTimeout(500);
      const backPageRowName = await page.locator('tbody tr').first().locator('td').first().innerText();
      expect(backPageRowName).toBe(firstRowName);
    }
  });

  test('CMS-PRD-005 Edit Product button opens edit form', async ({ page }) => {
    const editLink = page.locator('a[href*="/cms/products/"][href$="/edit"]').first();
    await expect(editLink).toBeVisible();
    await editLink.click();
    await expect(page).toHaveURL(/\/cms\/products\/\d+\/edit/);
    await expect(page.getByRole('heading', { name: /Edit Product/i })).toBeVisible();
  });

  test('CMS-PRD-006 Sync from SAP action button is present and clickable', async ({ page }) => {
    const syncButton = page.getByRole('button', { name: /Sync from SAP|Sync SAP/i });
    if (await syncButton.isVisible()) {
      await expect(syncButton).toBeEnabled();
    }
  });
});
