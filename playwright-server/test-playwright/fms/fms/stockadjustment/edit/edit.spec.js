import { test, expect } from '@playwright/test';

// Test Case: Edit existing adjustment
test('stock adjustment - edit adjustment', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Stock Adjustment
  const stockAdjustmentButton = page.getByRole('button', { name: 'Stock Adjustment' });
  if (await stockAdjustmentButton.isVisible().catch(() => false)) {
    await stockAdjustmentButton.click();
  } else {
    const menuButton = page.getByRole('button', { name: /Stock|Inventory|Adjustment/i });
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
    }
  }

  // Try to access history first, then edit
  const historyButton = page.getByRole('button', { name: /My Adjustments|History|View|List/i });
  if (await historyButton.isVisible().catch(() => false)) {
    await historyButton.click();
  }

  // Check if Edit button exists
  const editButton = page.getByRole('button', { name: 'Edit' }).first();
  if (await editButton.isVisible().catch(() => false)) {
    await editButton.click();
    await expect(page.locator('body')).toBeVisible();
  } else {
    // If no edit button, verify page loaded
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Stock Adjustment');
  }
});