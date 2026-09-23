import { test, expect } from '@playwright/test';
import { BASE_URL } from './fixtures.js';

test.use({ baseURL: BASE_URL });

// Covers 02_functional_test_cases.md: FUNC-AUTH-032/033, and negative NEG-001/002.
//
// As of 2026-08-03, /login dropped the email/password form entirely and is
// now Microsoft-SSO-only ("Sign in with Microsoft", no #email/#password
// fields in the DOM). FUNC-AUTH-032/033 and NEG-001/002 all depended on that
// form and can't be automated against a real Microsoft OAuth consent screen
// without a dedicated test SSO account — they're skipped below rather than
// left failing against selectors that no longer exist. In their place,
// FUNC-AUTH-034 asserts the actual current login surface so this file still
// catches a regression (e.g. the SSO button disappearing, or a
// pre-mature/broken auth redirect).
test.describe('Functional - Authentication', () => {
  test('FUNC-AUTH-034 login page offers Microsoft SSO, no email/password form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: 'Sign in with Microsoft' })).toBeVisible();
    await expect(page.locator('#email')).toHaveCount(0);
    await expect(page.locator('#password')).toHaveCount(0);
  });

  test.skip('FUNC-AUTH-032 login with valid demo credentials succeeds', async ({ page }) => {});
  test.skip('NEG-001 login with empty fields is blocked by required validation', async ({ page }) => {});
  test.skip('NEG-002 login with wrong password shows an error, not a crash', async ({ page }) => {});
  test.skip('FUNC-AUTH-033 logout ends the session and protected links revert to guest state', async ({ page }) => {});
});
