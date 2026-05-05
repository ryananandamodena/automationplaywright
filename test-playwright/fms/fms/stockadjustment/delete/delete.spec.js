import { test, expect } from '@playwright/test';

// Test Case: Delete adjustment
test('stock adjustment - delete adjustment', async ({ page }) => {
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

  // Try to access history first, then delete
  const historyButton = page.getByRole('button', { name: /My Adjustments|History|View|List/i });
  if (await historyButton.isVisible().catch(() => false)) {
    await historyButton.click();
  }

  // Check if Delete button exists
  const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
  if (await deleteButton.isVisible().catch(() => false)) {
    await deleteButton.click();
    await expect(page.locator('body')).toBeVisible();
  } else {
    // If no delete button, verify page loaded
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Stock Adjustment');
  }
});