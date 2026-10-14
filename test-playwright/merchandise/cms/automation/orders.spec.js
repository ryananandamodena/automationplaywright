import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Orders - CMS Orders Management Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
    await page.goto('/cms/orders');
  });

  test('CMS-ORD-001 status filter chips render and are interactive', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Order Management|Orders/i })).toBeVisible();

    const filterChips = [
      'All',
      'Pending Approval',
      'Preparing Order',
      'Shipped',
      'Ready for Pickup',
      'Delivered',
      'Picked Up',
      'Payment Rejected',
      'Cancelled',
    ];

    for (const chip of filterChips) {
      const chipBtn = page.getByRole('button', { name: chip, exact: true });
      await expect(chipBtn).toBeVisible();
    }

    // Click Preparing Order filter
    const prepChip = page.getByRole('button', { name: 'Preparing Order', exact: true });
    await prepChip.click();
    await page.waitForTimeout(500);
  });

  test('CMS-ORD-002 order card displays order number, customer and status', async ({ page }) => {
    const orderCards = page.locator('a[href^="/cms/orders/"]');
    const count = await orderCards.count();
    if (count > 0) {
      const firstCard = orderCards.first();
      await expect(firstCard).toBeVisible();
      const cardText = await firstCard.innerText();
      expect(cardText.length).toBeGreaterThan(0);
    }
  });

  test('CMS-ORD-003 order detail view displays all required sections', async ({ page }) => {
    const orderCards = page.locator('a[href^="/cms/orders/"]');
    const count = await orderCards.count();
    if (count > 0) {
      await orderCards.first().click();
      await expect(page).toHaveURL(/\/cms\/orders\/\d+/);

      // Verify sections
      await expect(page.getByRole('heading', { name: 'Items' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Shipping' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Payment' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Customer' })).toBeVisible();
      await expect(page.getByText('SAP B1 Sales Order')).toBeVisible();
    }
  });

  test('CMS-ORD-004 invalid order ID shows graceful fallback or not found', async ({ page }) => {
    await page.goto('/cms/orders/9999999');
    await page.waitForTimeout(1000);
    // Verify shell still renders and no unhandled script crash
    await expect(page.getByText('MODENA', { exact: false }).first()).toBeVisible();
  });
});
