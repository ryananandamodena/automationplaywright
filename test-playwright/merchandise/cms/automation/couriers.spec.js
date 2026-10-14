import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Couriers - CMS Couriers Management Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
    await page.goto('/cms/couriers');
  });

  test('CMS-CUR-001 couriers table renders correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Couriers' })).toBeVisible();
    await expect(page.getByText('error|crash|something went wrong').first()).toHaveCount(0);
  });
});
