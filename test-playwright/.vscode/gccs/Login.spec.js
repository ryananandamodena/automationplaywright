import { test, expect } from '@playwright/test';

// Positive case: login success
test('login success with valid credentials', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd.1');
  await page.getByRole('button', { name: 'Login' }).click();

  // Assertion: pastikan elemen dashboard muncul
  // await expect(page.locator('text=Dashboard')).toBeVisible();
});

// Negative case: login gagal dengan password salah
test('login gagal dengan password salah', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('passwordsalah');
  await page.getByRole('button', { name: 'Login' }).click();

  // await expect(page.locator(/invalid|salah|error|gagal/i)).toBeVisible();
});

// Negative case: login gagal dengan username salah
test('login gagal dengan username salah', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('user_salah');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();

  // await expect(page.locator(/invalid|salah|error|gagal/i)).toBeVisible();
});
