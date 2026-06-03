import { test, expect } from '@playwright/test';

// Test Case 1: Access Approval page
test('general supplies - approval - access page', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Approval
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'Approval' }).click();

  // Assertion: Approval page is loaded
  await expect(page.getByRole('heading', { name: 'Approval' })).toBeVisible();
  await expect(page.getByText('Review and approve pending supplies requests')).toBeVisible();
});

// Test Case 2: Verify no pending approvals message
test('general supplies - approval - no pending approvals', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Approval
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'Approval' }).click();

  // Verify no pending approvals message is displayed
  await expect(page.getByText('No pending approvals')).toBeVisible();
});

// Test Case 3: Verify approval statistics display
test('general supplies - approval - approval statistics', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Approval
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'Approval' }).click();

  // Verify approval statistics are displayed
  await expect(page.getByText('Pending Approval')).toBeVisible();
  await expect(page.getByText('Current Page Items')).toBeVisible();
  await expect(page.getByText('Requesters')).toBeVisible();

  // Verify table headers are present
  await expect(page.getByRole('cell', { name: 'Transaction ID' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Category' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Actions' })).toBeVisible();
});

// Test Case 4: Approve request (Update)
test('general supplies - approval - approve request', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Approval
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'Approval' }).click();

  // Click Approve on first pending request (if exists)
  const approveButton = page.getByRole('button', { name: 'Approve' }).first();
  if (await approveButton.isVisible().catch(() => false)) {
    await approveButton.click();

    // Add approval comment
    await page.getByRole('textbox', { name: 'Comments' }).fill('Approved via automation test');

    // Confirm approval
    await page.getByRole('button', { name: 'Confirm Approval' }).click();

    // Assertion: Success message
    await expect(page.getByText('Request approved successfully')).toBeVisible();
  } else {
    // If no pending requests, verify no pending message
    await expect(page.getByText('No pending approvals')).toBeVisible();
  }
});

// Test Case 5: Reject request (Update)
test('general supplies - approval - reject request', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Approval
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'Approval' }).click();

  // Click Reject on first pending request (if exists)
  const rejectButton = page.getByRole('button', { name: 'Reject' }).first();
  if (await rejectButton.isVisible().catch(() => false)) {
    await rejectButton.click();

    // Add rejection reason
    await page.getByRole('textbox', { name: 'Rejection Reason' }).fill('Rejected via automation test - insufficient stock');

    // Confirm rejection
    await page.getByRole('button', { name: 'Confirm Rejection' }).click();

    // Assertion: Success message
    await expect(page.getByText('Request rejected successfully')).toBeVisible();
  } else {
    // If no pending requests, verify no pending message
    await expect(page.getByText('No pending approvals')).toBeVisible();
  }
});

// Test Case 6: Bulk approve requests (Update - Bulk)
test('general supplies - approval - bulk approve', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Approval
  await page.getByRole('button', { name: 'General Supplies' }).click();
  await page.getByRole('link', { name: 'Approval' }).click();

  // Check multiple requests for bulk approval (if available)
  const checkboxes = page.locator('input[type="checkbox"]').all();
  if ((await checkboxes).length > 1) {
    // Select first two requests
    await page.locator('input[type="checkbox"]').nth(1).check();
    await page.locator('input[type="checkbox"]').nth(2).check();

    // Click Bulk Approve
    await page.getByRole('button', { name: 'Bulk Approve' }).click();

    // Confirm bulk approval
    await page.getByRole('button', { name: 'Confirm Bulk Approval' }).click();

    // Assertion: Success message
    await expect(page.getByText('Requests approved successfully')).toBeVisible();
  } else {
    // If not enough requests for bulk operation, verify page loaded
    await expect(page.getByRole('heading', { name: 'Approval' })).toBeVisible();
  }
});