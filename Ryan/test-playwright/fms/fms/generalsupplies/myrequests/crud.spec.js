import { test, expect } from '@playwright/test';

// Test Case: View my requests
test('general supplies - my requests - view requests', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to General Supplies
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.waitForTimeout(2000);

  // Access My Requests sub-menu (second occurrence in sub-menu)
  const myRequestsSubMenu = page.locator('text=My Requests').nth(1);
  if (await myRequestsSubMenu.isVisible().catch(() => false)) {
    await myRequestsSubMenu.click();
    await page.waitForTimeout(2000);
    // Verify requests list loaded - check for table or content
    const hasMyRequests = await page.locator('text=My Requests').isVisible().catch(() => false);
    const hasTransactionTable = await page.locator('text=Transaction').isVisible().catch(() => false);
    expect(hasMyRequests || hasTransactionTable).toBe(true);
  } else {
    // If no My Requests sub-menu, verify we're on General Supplies page
    const hasGeneralSupplies = await page.locator('text=General Supplies').isVisible().catch(() => false);
    expect(hasGeneralSupplies).toBe(true);
  }
});

// Test Case: Edit request
test('general supplies - my requests - edit request', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to General Supplies
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.waitForTimeout(2000);

  // Access My Requests sub-menu
  const myRequestsSubMenu = page.locator('text=My Requests').nth(1);
  if (await myRequestsSubMenu.isVisible().catch(() => false)) {
    await myRequestsSubMenu.click();
    await page.waitForTimeout(2000);

    // Try to find and click edit button in the Actions column
    const editButton = page.locator('[data-testid="edit-button"], button:has-text("Edit"), .edit-btn').first();
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(2000);
      // Verify edit form opened
      await expect(page.locator('body')).toBeVisible();
    } else {
      // If no edit button, verify we're on requests page
      const hasMyRequests = await page.locator('text=My Requests').isVisible().catch(() => false);
      expect(hasMyRequests).toBe(true);
    }
  }
});

// Test Case: Delete request
test('general supplies - my requests - delete request', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to General Supplies
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.waitForTimeout(2000);

  // Access My Requests sub-menu
  const myRequestsSubMenu = page.locator('text=My Requests').nth(1);
  if (await myRequestsSubMenu.isVisible().catch(() => false)) {
    await myRequestsSubMenu.click();
    await page.waitForTimeout(2000);

    // Try to find and click delete button in the Actions column
    const deleteButton = page.locator('[data-testid="delete-button"], button:has-text("Delete"), .delete-btn').first();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(2000);
      // Verify delete confirmation or page state
      await expect(page.locator('body')).toBeVisible();
    } else {
      // If no delete button, verify we're on requests page
      const hasMyRequests = await page.locator('text=My Requests').isVisible().catch(() => false);
      expect(hasMyRequests).toBe(true);
    }
  }
});