import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

// E2E coverage from 11_cms_admin_test_cases.md. E2E-CMS-001 is fully
// read-only (login -> dashboard -> browse -> order detail -> logout).
// E2E-CMS-002 creates a product and deletes it in the same test (self-
// cleaning) so it never leaves residue in the shared dev database — unlike
// CMS-PRD-007/CMS-PRD-022 in the source doc, which assume separate,
// manually-run steps.
test.describe('E2E - CMS Admin business flow', () => {
  test('E2E-CMS-001 login -> dashboard -> browse products -> view order -> logout', async ({ page }) => {
    await loginCms(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    await page.getByRole('link', { name: /Total Products/ }).click();
    await expect(page).toHaveURL(/\/cms\/products\/?$/);
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

    await page.goto('/cms/orders');
    const firstOrder = page.locator('a[href^="/cms/orders/"]').first();
    const orderNumber = await firstOrder.locator('h3').innerText();
    await firstOrder.click();
    await expect(page.getByRole('heading', { name: orderNumber })).toBeVisible();
    await expect(page.getByText('SAP B1 Sales Order')).toBeVisible();

    await page.getByRole('button', { name: /Logout/i }).click();
    await expect(page).toHaveURL(/\/cms\/login\/?$/);
  });

  test('E2E-CMS-002 create product -> verify on storefront -> delete product (self-cleaning)', async ({ page, context }) => {
    await loginCms(page);
    await page.goto('/cms/products/new');

    const testName = `QA E2E TEST PRODUCT ${Date.now()}`;
    await page.getByLabel('Name').fill(testName);
    // BUG (see 11_cms_admin_test_cases.md, CMS-PRD-BUG-001): the Category
    // dropdown here shows "No categories — add one in Categories" even
    // though /cms/categories has 3 active categories (Accessories, Apparel,
    // Merchandise Modena) — confirmed reproducible, not a one-off loading
    // race. Working around it with "Custom…", which reveals a required
    // free-text category input, until the real bug is fixed.
    await page.getByLabel('Category').selectOption('__custom__');
    await page.getByPlaceholder('Type a custom category').fill('QA Test Category');
    await page.getByLabel('Price (Rp)').fill('12345');
    await page.getByLabel('Stock').fill('5');
    // A product with no image/description/size gets tagged "Needs
    // completion" in the CMS and is NOT shown on the public storefront even
    // while its CMS status says "Active" — found the hard way in manual
    // verification (a product created without this was invisible on
    // /products despite being Active). Reusing a real MODENA product image
    // here rather than an external placeholder.
    await page.getByLabel('Main Image URL').fill('https://i.imgur.com/VOw0zmJ.png');
    // The checkbox input is visually hidden (`sr-only`) and its styled
    // label intercepts pointer events — force the check past that.
    await page.getByLabel('One Size', { exact: true }).check({ force: true });
    await page.getByRole('button', { name: 'Create Product', exact: true }).click();
    await expect(page).toHaveURL(/\/cms\/products\/?$/);

    // Cleanup runs in `finally` so a failure in the storefront-verification
    // step below still deletes (deactivates) the test product, instead of
    // leaving it behind in the shared dev DB — which is exactly what
    // happened the first time this test was written without it.
    try {
      await page.getByPlaceholder('Search by name or category...').fill(testName);
      const row = page.locator('tr', { hasText: testName });
      await expect(row).toBeVisible();

      const storefrontPage = await context.newPage();
      await storefrontPage.goto('https://merchandise-dev.modena.com/products/');
      await storefrontPage.waitForLoadState('networkidle');
      await storefrontPage.getByPlaceholder('Search products...').pressSequentially(testName, { delay: 50 });
      await expect(storefrontPage.getByRole('heading', { name: testName })).toBeVisible({ timeout: 10000 });
      await storefrontPage.close();
    } finally {
      // "Delete" here is a soft delete (confirmed via a "Delete Product"
      // modal: "will be deactivated and hidden from the storefront") — the
      // row stays in the Products table with Status "Inactive" rather than
      // disappearing. This is the best cleanup available through the UI;
      // there is no hard-delete action.
      await page.getByPlaceholder('Search by name or category...').fill(testName);
      const row = page.locator('tr', { hasText: testName });
      await row.getByRole('button', { name: 'Delete', exact: true }).click();
      await page.getByRole('heading', { name: 'Delete Product' }).waitFor();
      await page.locator('.fixed').getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(row.getByText('Inactive', { exact: true })).toBeVisible();
    }
  });
});
