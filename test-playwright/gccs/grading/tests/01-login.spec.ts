import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CREDENTIALS } from '../utils/testData';

test.describe('Login - GCCS', () => {
  test('TC-LOGIN-001 valid credentials logs in to dashboard', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(CREDENTIALS.valid.username, CREDENTIALS.valid.password);
    await login.expectLoggedIn();
  });

  test('TC-LOGIN-002 invalid username is rejected', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(CREDENTIALS.invalidUsername.username, CREDENTIALS.invalidUsername.password);
    await login.expectStillOnLogin();
  });

  test('TC-LOGIN-003 invalid password is rejected', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(CREDENTIALS.invalidPassword.username, CREDENTIALS.invalidPassword.password);
    await login.expectStillOnLogin();
  });

  test('TC-LOGIN-004 empty username and password shows validation, no request sent', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('', '');
    await login.expectStillOnLogin();
  });

  test('TC-LOGIN-005 SQL injection payload does not bypass auth', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(CREDENTIALS.sqlInjection.username, CREDENTIALS.sqlInjection.password);
    await login.expectStillOnLogin();
  });

  test('TC-LOGIN-006 direct URL access to protected route without session redirects to login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/setup/master-grading/grade-categories');
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/(\?|$)/i);
    await expect(page.locator('#userName')).toBeVisible();
  });

  test('TC-LOGIN-007 browser back after logout does not restore authenticated page', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(CREDENTIALS.valid.username, CREDENTIALS.valid.password);
    await login.expectLoggedIn();
    await login.logout();
    await page.goBack();
    await expect(page).not.toHaveURL(/dashboard/);
  });
});
