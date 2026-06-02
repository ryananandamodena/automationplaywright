import { test, expect } from '@playwright/test';

// Test Case 1: Successful submission with valid data
test('add my request - successful submission', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to ATK Request Form
  await page.goto('https://fms-dev.modena.com/atk/request/form');

  // Fill form with valid data
  await page.getByText('Branch *').locator('..').locator('select').selectOption('KEMANG - Modena Kemang');
  await page.getByText('Category *').locator('..').locator('select').selectOption('Writing Tools');
  await page.getByText('Item *').locator('..').locator('select').waitFor({ state: 'visible' });
  await page.getByText('Item *').locator('..').locator('select').selectOption({ index: 1 });
  await page.getByText('Quantity *').locator('..').locator('input').fill('5');
  await page.getByText('UoM *').locator('..').locator('select').selectOption('PCS');

  // Submit
  await page.getByRole('button', { name: 'Submit Request' }).click();

  // Assertion: expect the list page after successful submit
  await expect(page.getByRole('heading', { name: 'My Requests' })).toBeVisible();
});

// Test Case 2: Submission without selecting Branch
test('add my request - missing branch', async ({ page }) => {
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  await page.goto('https://fms-dev.modena.com/atk/request/form');

  // Skip Branch, fill others
  await page.getByText('Category *').locator('..').locator('select').selectOption('Writing Tools');
  await page.getByText('Item *').locator('..').locator('select').waitFor({ state: 'visible' });
  await page.getByText('Item *').locator('..').locator('select').selectOption({ index: 1 });
  await page.getByText('Quantity *').locator('..').locator('input').fill('5');

  await page.getByRole('button', { name: 'Submit Request' }).click();

  // Assertion: error message for missing branch
  await expect(page.locator('text=Branch is required')).toBeVisible();
});

// Test Case 3: Submission without selecting Category
test('add my request - missing category', async ({ page }) => {
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  await page.goto('https://fms-dev.modena.com/atk/request/form');

  await page.getByText('Branch *').locator('..').locator('select').selectOption('KEMANG - Modena Kemang');
  // Skip Category
  await page.getByText('Quantity *').locator('..').locator('input').fill('5');

  await page.getByRole('button', { name: 'Submit Request' }).click();

  // Assertion: error message for invalid items
  await expect(page.locator('text=All items must have a valid item, UoM selected and quantity greater than 0')).toBeVisible();
});

// Test Case 4: Submission with quantity 0
test('add my request - quantity zero', async ({ page }) => {
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  await page.goto('https://fms-dev.modena.com/atk/request/form');

  await page.getByText('Branch *').locator('..').locator('select').selectOption('KEMANG - Modena Kemang');
  await page.getByText('Category *').locator('..').locator('select').selectOption('Writing Tools');
  await page.getByText('Item *').locator('..').locator('select').waitFor({ state: 'visible' });
  await page.getByText('Item *').locator('..').locator('select').selectOption({ index: 1 });
  await page.getByText('Quantity *').locator('..').locator('input').fill('0');

  await page.getByRole('button', { name: 'Submit Request' }).click();

  // Assertion: form stays on page since quantity 0 is invalid
  await expect(page.getByRole('heading', { name: 'New Request' })).toBeVisible();
});

// Test Case 5: Submission with remarks
test('add my request - with remarks', async ({ page }) => {
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  await page.goto('https://fms-dev.modena.com/atk/request/form');

  await page.getByText('Branch *').locator('..').locator('select').selectOption('KEMANG - Modena Kemang');
  await page.getByText('Category *').locator('..').locator('select').selectOption('Writing Tools');
  await page.getByText('Item *').locator('..').locator('select').waitFor({ state: 'visible' });
  await page.getByText('Item *').locator('..').locator('select').selectOption({ index: 1 });
  await page.getByText('Quantity *').locator('..').locator('input').fill('3');
  await page.getByText('UoM *').locator('..').locator('select').selectOption('PCS');
  await page.getByText('Remarks').locator('..').locator('textarea').fill('Test request with remarks');

  await page.getByRole('button', { name: 'Submit Request' }).click();

  // Assertion: expect the list page after successful submit
  await expect(page.getByRole('heading', { name: 'My Requests' })).toBeVisible();
});

// Test Case 6: Add multiple items
test('add my request - multiple items', async ({ page }) => {
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  await page.goto('https://fms-dev.modena.com/atk/request/form');

  await page.getByText('Branch *').locator('..').locator('select').selectOption('KEMANG - Modena Kemang');

  // First item
  await page.getByText('Category *').locator('..').locator('select').selectOption('Writing Tools');
  await page.getByText('Item *').locator('..').locator('select').waitFor({ state: 'visible' });
  await page.getByText('Item *').locator('..').locator('select').selectOption({ index: 1 });
  await page.getByText('Quantity *').locator('..').locator('input').fill('2');
  await page.locator('select').nth(6).selectOption('PCS'); // UoM for first item

  // Add second item
  await page.getByRole('button', { name: 'Add Item' }).click();

  // Second item
  await page.locator('select').nth(7).selectOption('Paper Products'); // Category for second item
  await page.locator('select').nth(8).waitFor({ state: 'visible' });
  await page.locator('select').nth(8).selectOption({ index: 1 }); // Item for second item
  await page.locator('input[type="number"]').nth(1).fill('1'); // Quantity for second item

  await page.getByRole('button', { name: 'Submit Request' }).click();

  // Assertion: expect the list page after successful submit
  await expect(page.getByRole('heading', { name: 'My Requests' })).toBeVisible();
});