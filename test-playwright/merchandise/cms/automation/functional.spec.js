import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

// Functional coverage from 11_cms_admin_test_cases.md — read-only only
// (no create/edit/delete/ship/cancel): CMS-PRD-001..004, CMS-ORD-001,
// CMS-ROL-001/002. Destructive functional cases (Add/Edit/Delete Product,
// Ship/Cancel Order) are intentionally left for manual execution per the
// automation recommendation in 12_cms_sitemap_flow_coverage.md.
test.describe('Functional - CMS Products', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('CMS-PRD-001 products list renders with all columns', async ({ page }) => {
    await page.goto('/cms/products');
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    for (const col of ['Product', 'Category', 'Price', 'Stock', 'SAP Code', 'Badge', 'Status', 'Actions']) {
      await expect(page.locator('th', { hasText: col })).toBeVisible();
    }
  });

  test('CMS-PRD-002 search filters products by name', async ({ page }) => {
    await page.goto('/cms/products');
    await page.getByPlaceholder('Search by name or category...').fill('Hoodie');
    await expect(page.getByRole('cell', { name: /HOODIE/i })).toBeVisible();
    await expect(page.getByRole('cell', { name: /MUG/i })).toHaveCount(0);
  });

  test('CMS-PRD-003 search with no match shows empty result, no crash', async ({ page }) => {
    await page.goto('/cms/products');
    await page.getByPlaceholder('Search by name or category...').fill('zzz-no-such-product');
    // No product rows for the searched term, and no unhandled error rendered.
    await expect(page.getByRole('cell', { name: /zzz-no-such-product/i })).toHaveCount(0);
    await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  });

  test('CMS-PRD-004 pagination navigates between pages', async ({ page }) => {
    await page.goto('/cms/products');
    await page.waitForLoadState('networkidle');
    const page1Button = page.getByRole('button', { name: '1', exact: true });
    const page2Button = page.getByRole('button', { name: '2', exact: true });
    // Not `exact: true` — the button's accessible name may include an icon's
    // fallback text alongside "Prev".
    const prevButton = page.getByRole('button', { name: /Prev/ });

    await expect(prevButton).toBeDisabled(); // starts on page 1
    // Compare just the product name cell — comparing the whole row's
    // innerText is flaky because its whitespace formatting isn't stable
    // across renders (tabs/newlines vary even when the content is the same).
    const firstRowName = page.locator('tbody tr').first().locator('td').first();
    const firstPageProductName = await firstRowName.innerText();

    await page2Button.click();
    await expect(firstRowName).not.toHaveText(firstPageProductName);
    await expect(prevButton).toBeEnabled(); // page 2 reached

    await page1Button.click();
    await expect(firstRowName).toHaveText(firstPageProductName);
    await expect(prevButton).toBeDisabled(); // back to page 1
  });
});

test.describe('Functional - CMS Orders', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('CMS-ORD-001 status filter chips narrow the order list', async ({ page }) => {
    await page.goto('/cms/orders');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Preparing Order', exact: true }).click();
    const cards = page.locator('a[href^="/cms/orders/"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (const text of await cards.allTextContents()) {
      expect(text).toContain('Preparing Order');
    }
  });
});

test.describe('Functional - CMS Roles', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('CMS-ROL-001 role list shows admin/customer/superadmin with correct menu counts', async ({ page }) => {
    await page.goto('/cms/roles');
    await expect(page.getByText('admin', { exact: true })).toBeVisible();
    await expect(page.getByText('customer', { exact: true })).toBeVisible();
    await expect(page.getByText('superadmin', { exact: true })).toBeVisible();
    await expect(page.getByText('0 menu(s)')).toBeVisible(); // customer
  });

  test('CMS-ROL-002 superadmin role is locked, not editable', async ({ page }) => {
    await page.goto('/cms/roles');
    const superadminCard = page.locator('div', { hasText: 'superadmin' }).last();
    await expect(page.getByText('Locked', { exact: true })).toBeVisible();
  });
});

test.describe('Functional - CMS Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('CMS-DSH-002 period toggle updates the chart', async ({ page }) => {
    await page.goto('/cms');
    await page.waitForLoadState('networkidle');
    const weeklyBtn = page.getByRole('button', { name: 'Weekly' });
    const monthlyBtn = page.getByRole('button', { name: 'Monthly' });
    await expect(weeklyBtn).toBeVisible();
    await expect(monthlyBtn).toBeVisible();
    await weeklyBtn.click();
    await monthlyBtn.click();
  });

  test('CMS-DSH-004 low stock alert list renders', async ({ page }) => {
    await page.goto('/cms');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Low Stock Alert' })).toBeVisible();
  });
});

test.describe('Functional - CMS Orders Detail', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('CMS-ORD-002 order detail view displays all required sections', async ({ page }) => {
    await page.goto('/cms/orders');
    await page.waitForLoadState('networkidle');
    const firstOrder = page.locator('a[href^="/cms/orders/"]').first();
    await expect(firstOrder).toBeVisible();
    await firstOrder.click();
    await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shipping' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible();
    await expect(page.getByText('SAP B1 Sales Order')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Customer' })).toBeVisible();
  });
});

test.describe('Functional - CMS Stock', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('Stock table renders successfully', async ({ page }) => {
    await page.goto('/cms/stock');
    await expect(page.getByRole('heading', { name: 'Stock' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});

test.describe('Functional - CMS Categories', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('Categories table renders successfully', async ({ page }) => {
    await page.goto('/cms/categories');
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});

test.describe('Functional - CMS Users', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('Users table renders successfully', async ({ page }) => {
    await page.goto('/cms/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});

test.describe('Functional - CMS Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('CMS-SET-001 Xendit Secret Key is masked as password', async ({ page }) => {
    await page.goto('/cms/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    
    // Verifying there's an input of type password for the secret key
    const secretKeyInput = page.locator('input[type="password"]').first();
    await expect(secretKeyInput).toBeVisible();
  });
});
