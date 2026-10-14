import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Roles - CMS Role-Based Access Control Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
    await page.goto('/cms/roles');
  });

  test('CMS-ROL-001 role cards render core roles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible();
    await expect(page.getByText('admin', { exact: true })).toBeVisible();
    await expect(page.getByText('customer', { exact: true })).toBeVisible();
    await expect(page.getByText('superadmin', { exact: true })).toBeVisible();
  });

  test('CMS-ROL-002 superadmin role is locked and protected', async ({ page }) => {
    await expect(page.getByText('Locked', { exact: true })).toBeVisible();
  });
});
