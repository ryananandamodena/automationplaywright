import { test, expect } from '@playwright/test';

// Positive case: login success
test('login success with valid credentials', async ({ page }) => {
  await page.goto('https://fms-dev.modena.com/home');
  // Sesuaikan selector berdasarkan form login FMS
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Assertion: pastikan elemen dashboard atau home muncul
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();
});

// Negative case: login gagal dengan password salah
test('login gagal dengan password salah', async ({ page }) => {
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('passwordsalah');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Assertion: pastikan pesan error muncul atau tetap di halaman login
  await expect(page.locator('text=Administrator Dashboard')).not.toBeVisible();
});

// Negative case: login gagal dengan username salah
test('login gagal dengan username salah', async ({ page }) => {
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('user_salah');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Assertion: pastikan pesan error muncul atau tetap di halaman login
  await expect(page.locator('text=Administrator Dashboard')).not.toBeVisible();
});