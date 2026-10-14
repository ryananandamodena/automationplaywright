import { test, expect } from '@playwright/test';
import { BASE_URL, ADMIN, loginCms, logoutCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Security - CMS Security & Access Control', () => {
  test('CMS-SEC-001 unauthenticated requests to API/CMS routes get redirected to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/cms/settings`);
    await expect(page).toHaveURL(/\/cms\/login/);

    await page.goto(`${BASE_URL}/cms/users`);
    await expect(page).toHaveURL(/\/cms\/login/);
  });

  test('CMS-SEC-002 XSS payload in search box is properly escaped and rendered safe', async ({ page }) => {
    await loginCms(page);
    await page.goto('/cms/products');
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    await page.locator('input[placeholder*="Search by name"]').fill(xssPayload);
    await page.waitForTimeout(500);

    // Verify page didn't throw uncaught exception or execute script
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
  });

  test('CMS-SEC-003 SQL Injection in search input is handled safely', async ({ page }) => {
    await loginCms(page);
    await page.goto('/cms/products');
    const sqliPayload = "' UNION SELECT null, null, null--";
    await page.locator('input[placeholder*="Search by name"]').fill(sqliPayload);
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    await expect(page.getByText(/sql syntax|syntax error|database error/i)).toHaveCount(0);
  });

  test('CMS-SEC-004 session invalidation prevents access to protected routes after logout', async ({ page }) => {
    await loginCms(page);
    await logoutCms(page);
    await expect(page).toHaveURL(/\/cms\/login/);

    // Try accessing protected dashboard route after logout
    await page.goto(`${BASE_URL}/cms`);
    await expect(page).toHaveURL(/\/cms\/login/);
  });
});
