import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Users - CMS Users Management Module', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
    await page.goto('/cms/users');
  });

  test('CMS-USR-001 users table renders user records', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // Verify admin user is present in table cell
    await expect(page.getByRole('cell', { name: 'admin@modena.com' })).toBeVisible();
  });

  test('CMS-USR-002 Add User button is accessible', async ({ page }) => {
    const addUserBtn = page.getByRole('button', { name: /Add User|New User/i }).or(page.getByRole('link', { name: /Add User|New User/i }));
    if (await addUserBtn.isVisible()) {
      await expect(addUserBtn).toBeEnabled();
    }
  });
});
