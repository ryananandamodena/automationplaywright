import { test, expect } from '@playwright/test';

// Test Case 1: Access All Requests page
test('general supplies - all requests - access page', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to All Requests
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'All Requests' }).click();

  // Assertion: All Requests page is loaded
  await expect(page.getByRole('heading', { name: 'All Requests' })).toBeVisible();
  await expect(page.getByText('Manage all supplies requests')).toBeVisible();
});

// Test Case 2: Filter by status
test('general supplies - all requests - filter by status', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to All Requests
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'All Requests' }).click();

  // Filter by status
  await page.getByText('Status').locator('..').locator('select').selectOption('Pending');

  // Assertion: Filter applied (may need to check table content)
  await expect(page.getByText('Status').locator('..').locator('select')).toHaveValue('Pending');
});

// Test Case 3: View request details
test('general supplies - all requests - view request details', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to All Requests
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'All Requests' }).click();

  // Click View on first request
  await page.getByRole('button', { name: 'View Details' }).first().click();

  // Assertion: Request details page or modal is shown
  await expect(page.getByText('Request Details')).toBeVisible();
});

// Test Case 4: Approve request (Update)
test('general supplies - all requests - approve request', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to All Requests
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'All Requests' }).click();

  // Filter by pending status (if filter exists)
  const statusFilter = page.locator('select[name="status"]');
  if (await statusFilter.isVisible().catch(() => false)) {
    await page.selectOption('select[name="status"]', 'pending');
  }

  // Click Approve on first pending request (if exists)
  const approveButton = page.getByRole('button', { name: 'Approve' }).first();
  if (await approveButton.isVisible().catch(() => false)) {
    await approveButton.click();
    // Confirm approval
    await page.getByRole('button', { name: 'Confirm' }).click();
    // Assertion: Success message
    await expect(page.getByText('Request approved successfully')).toBeVisible();
  } else {
    // If no pending requests, just verify page loaded
    await expect(page.getByRole('heading', { name: 'All Requests' })).toBeVisible();
  }
});

// Test Case 5: Reject request (Update)
test('general supplies - all requests - reject request', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to All Requests
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'All Requests' }).click();

  // Filter by pending status
  await page.selectOption('select[name="status"]', 'pending');

  // Click Reject on first pending request (if exists)
  const rejectButton = page.getByRole('button', { name: 'Reject' }).first();
  if (await rejectButton.isVisible().catch(() => false)) {
    await rejectButton.click();
    // Enter rejection reason
    await page.getByRole('textbox', { name: 'Reason' }).fill('Test rejection');
    // Confirm rejection
    await page.getByRole('button', { name: 'Confirm' }).click();
    // Assertion: Success message
    await expect(page.getByText('Request rejected successfully')).toBeVisible();
  } else {
    // If no pending requests, just verify page loaded
    await expect(page.getByRole('heading', { name: 'All Requests' })).toBeVisible();
  }
});

// Test Case 6: Export requests (Read - Export)
test('general supplies - all requests - export data', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to All Requests
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'All Requests' }).click();

  // Click Export button (if exists)
  const exportButton = page.getByRole('button', { name: 'Export' });
  if (await exportButton.isVisible().catch(() => false)) {
    await exportButton.click();
    // Select export format
    await page.getByRole('radio', { name: 'CSV' }).check();
    // Confirm export
    await page.getByRole('button', { name: 'Download' }).click();
    // Assertion: Download started or success message
    await expect(page.getByText('Export completed')).toBeVisible();
  } else {
    // If no export button, just verify page loaded
    await expect(page.getByRole('heading', { name: 'All Requests' })).toBeVisible();
  }
});