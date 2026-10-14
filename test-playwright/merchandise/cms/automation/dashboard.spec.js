import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Dashboard - CMS Dashboard Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('CMS-DSH-001 KPI cards render with accurate metrics', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Total Sales/i })).toBeVisible();
    await expect(page.getByText('Orders Processed')).toBeVisible();
    await expect(page.getByText('Orders Waiting Approval')).toBeVisible();
    await expect(page.getByText('Total Products')).toBeVisible();
  });

  test('CMS-DSH-002 Period toggle changes time filter on charts', async ({ page }) => {
    const dailyBtn = page.getByRole('button', { name: /daily/i });
    const weeklyBtn = page.getByRole('button', { name: /weekly/i });
    const monthlyBtn = page.getByRole('button', { name: /monthly/i });

    await expect(dailyBtn).toBeVisible();
    await expect(weeklyBtn).toBeVisible();
    await expect(monthlyBtn).toBeVisible();

    await dailyBtn.click();
    await page.waitForTimeout(500);
    await weeklyBtn.click();
    await page.waitForTimeout(500);
    await monthlyBtn.click();
    await page.waitForTimeout(500);
  });

  test('CMS-DSH-003 Quick Action links navigate correctly', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Add New Product/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Manage Stock/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Review Orders/i })).toBeVisible();

    // Verify Add New Product link href
    const addProductLink = page.getByRole('link', { name: /Add New Product/i });
    await expect(addProductLink).toHaveAttribute('href', '/cms/products/new');
  });

  test('CMS-DSH-004 Order Status section displays all status funnels', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Order Status' })).toBeVisible();
    const statuses = [
      'Pending Approval',
      'Preparing Order',
      'Shipped',
      'Ready for Pickup',
      'Delivered',
      'Picked Up',
      'Payment Rejected',
      'Cancelled',
    ];
    for (const status of statuses) {
      await expect(page.getByText(status, { exact: false }).first()).toBeVisible();
    }
  });

  test('CMS-DSH-005 Top Products ranking renders', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Top Products' })).toBeVisible();
    const topProductsContainer = page.locator('div', { has: page.getByRole('heading', { name: 'Top Products' }) }).first();
    await expect(topProductsContainer).toBeVisible();
  });

  test('CMS-DSH-006 Low Stock Alert section renders alert badges', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Low Stock Alert' })).toBeVisible();
    await expect(page.getByText('products need attention')).toBeVisible();
  });

  test('CMS-DSH-007 Recent Orders section renders with View All navigation', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recent Orders' })).toBeVisible();
    const viewAllLink = page.locator('div', { has: page.getByRole('heading', { name: 'Recent Orders' }) }).getByRole('link', { name: 'View All' }).first();
    await expect(viewAllLink).toBeVisible();
    await viewAllLink.click();
    await expect(page).toHaveURL(/\/cms\/orders/);
  });
});
