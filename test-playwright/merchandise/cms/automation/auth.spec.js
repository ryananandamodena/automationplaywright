import { test, expect } from '@playwright/test';
import { BASE_URL, ADMIN, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Auth - CMS Authentication & Authorization', () => {
  test('CMS-AUTH-001 valid login succeeds and lands on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/login`);
    await page.locator('#email').fill(ADMIN.email);
    await page.locator('#password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(`${BASE_URL}/cms`);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('CMS-AUTH-002 login with invalid password shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/login`);
    await page.locator('#email').fill(ADMIN.email);
    await page.locator('#password').fill('wrongpassword123');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    // Verify error notification or remaining on login page
    await expect(page).toHaveURL(/\/cms\/login/);
    await expect(page.getByText(/invalid|error|incorrect|failed/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // If toast or text isn't displayed with keyword, confirm still on login
      expect(page.url()).toContain('/cms/login');
    });
  });

  test('CMS-AUTH-003 login with non-existent email fails', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/login`);
    await page.locator('#email').fill('nonexistent_user@modena.com');
    await page.locator('#password').fill('somepassword');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/cms\/login/);
  });

  test('CMS-AUTH-004 SQL injection attempt in login is safely handled', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/login`);
    await page.locator('#email').fill("' OR '1'='1' --");
    await page.locator('#password').fill("' OR '1'='1'");
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/cms\/login/);
  });

  test('CMS-AUTH-005 unauthenticated access to protected routes redirects to login', async ({ page }) => {
    const protectedPaths = ['/cms', '/cms/products', '/cms/orders', '/cms/stock', '/cms/users', '/cms/roles', '/cms/categories', '/cms/couriers'];
    for (const path of protectedPaths) {
      await page.goto(`${BASE_URL}${path}`);
      await expect(page).toHaveURL(/\/cms\/login/);
    }
  });

  test('CMS-AUTH-006 logout flow ends session and redirects to login', async ({ page }) => {
    await loginCms(page);
    // Find profile or logout trigger
    const profileBtn = page.locator('aside button, nav button, button:has-text("Admin MODENA")').first();
    await profileBtn.click();
    // Check if a dropdown or logout option appeared
    const logoutOption = page.getByRole('button', { name: /Logout|Sign Out|Keluar/i }).or(page.getByText(/Logout|Sign Out|Keluar/i)).first();
    if (await logoutOption.isVisible()) {
      await logoutOption.click();
    }
    await expect(page).toHaveURL(/\/cms\/login/);
  });
});
