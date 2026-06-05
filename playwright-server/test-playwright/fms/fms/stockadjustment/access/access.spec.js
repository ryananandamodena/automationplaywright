import { test, expect } from '@playwright/test';

// Test Case: Access Stock Adjustment page
test('stock adjustment - access page', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Stock Adjustment
  await page.getByRole('button', { name: 'Stock Adjustment' }).click();

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Assertion: Stock Adjustment page is loaded
  // Check for common elements that should be present
  const hasNewAdjustment = await page.locator('text=New Adjustment').isVisible().catch(() => false);
  const hasOverview = await page.locator('text=Overview').isVisible().catch(() => false);

  expect(hasNewAdjustment || hasOverview).toBe(true);
});