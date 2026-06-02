import { test, expect } from '@playwright/test';

test('halaman utama Playwright berjudul benar', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveTitle(/Playwright/);
});
