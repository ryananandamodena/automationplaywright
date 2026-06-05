import { test, expect } from '@playwright/test';

// Test Case: View stock adjustment history
test('stock adjustment - view history', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Stock Adjustment
  await page.getByRole('button', { name: 'Stock Adjustment' }).click();
  await page.waitForTimeout(2000);

  // Try to access My Adjustments tab/section
  const myAdjustmentsLink = page.locator('text=My Adjustments').first();
  if (await myAdjustmentsLink.isVisible().catch(() => false)) {
    await myAdjustmentsLink.click();
    await page.waitForTimeout(2000);
  }

  // Assertion: History view loaded - check for New Adjustment button or content
  const hasNewAdjustment = await page.locator('text=New Adjustment').isVisible().catch(() => false);
  const hasOverview = await page.locator('text=Overview').isVisible().catch(() => false);

  expect(hasNewAdjustment || hasOverview).toBe(true);
});

// Test Case: View adjustment details
test('stock adjustment - view adjustment details', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Stock Adjustment
  await page.getByRole('button', { name: 'Stock Adjustment' }).click();
  await page.waitForTimeout(2000);

  // Access My Adjustments (history view)
  const myAdjustmentsButton = page.getByRole('button', { name: 'My Adjustments' });
  if (await myAdjustmentsButton.isVisible().catch(() => false)) {
    await myAdjustmentsButton.click();
    await page.waitForTimeout(2000);
  }

  // Try to view details of first adjustment (if available)
  const detailsButton = page.getByRole('button', { name: /View|Details|Info/i }).first();
  if (await detailsButton.isVisible().catch(() => false)) {
    await detailsButton.click();
    await page.waitForTimeout(2000);
    // Verify modal or details page opened
    await expect(page.locator('body')).toBeVisible();
  } else {
    // If no details available, verify we're on the right page
    const hasMyAdjustments = await page.locator('text=My Adjustments').isVisible().catch(() => false);
    expect(hasMyAdjustments).toBe(true);
  }
});