import { test, expect } from '@playwright/test';
import { BASE_URL, MS_USER, loginMicrosoft } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Functional - Authentication (Microsoft SSO)', () => {
  test('FUNC-AUTH-034 login page offers Microsoft SSO button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Sign in with Microsoft/i })).toBeVisible();
    await expect(page.locator('#email')).toHaveCount(0);
    await expect(page.locator('#password')).toHaveCount(0);
  });

  test('FUNC-AUTH-035 Microsoft SSO login authenticates user session', async ({ page }) => {
    test.setTimeout(90000);
    await loginMicrosoft(page, MS_USER);
    await expect(page).toHaveURL(new RegExp(BASE_URL));
  });
});
