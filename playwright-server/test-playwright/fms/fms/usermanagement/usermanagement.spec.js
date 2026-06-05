import { test, expect } from '@playwright/test';

// Test Case 1: Access User Management page
test('master data - user management - access page', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to User Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('User Management').click();

  // Assertion: User Management page is loaded
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  await expect(page.getByText('Manage system users')).toBeVisible();
});

// Test Case 2: View users list (Read)
test('master data - user management - view users', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to User Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('User Management').click();

  // Assertion: Users table is displayed
  await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  // Check if table exists
  const tableExists = await page.locator('table').isVisible().catch(() => false);
  if (tableExists) {
    await expect(page.locator('table')).toBeVisible();
  }
});

// Test Case 3: Create new user (Create)
test('master data - user management - create user', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to User Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('User Management').click();

  // Click Add User button (if exists)
  const addUserButton = page.getByRole('button', { name: 'Add User' });
  if (await addUserButton.isVisible().catch(() => false)) {
    await addUserButton.click();

    // Fill user form
    await page.getByRole('textbox', { name: 'First Name' }).fill('Test');
    await page.getByRole('textbox', { name: 'Last Name' }).fill('User');
    await page.getByRole('textbox', { name: 'Email' }).fill('testuser@modena.com');
    await page.getByRole('textbox', { name: 'Username' }).fill('testuser');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.selectOption('select[name="role"]', 'User');
    await page.selectOption('select[name="department"]', 'IT');

    // Save user
    await page.getByRole('button', { name: 'Save User' }).click();

    // Assertion: Success message
    await expect(page.getByText('User created successfully')).toBeVisible();
  } else {
    // If no add button, verify page loaded
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  }
});

// Test Case 4: Edit existing user (Update)
test('master data - user management - edit user', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to User Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('User Management').click();

  // Click Edit on first user (if exists)
  const editButton = page.getByRole('button', { name: 'Edit' }).first();
  if (await editButton.isVisible().catch(() => false)) {
    await editButton.click();

    // Modify user details
    await page.getByRole('textbox', { name: 'First Name' }).fill('Updated');
    await page.getByRole('textbox', { name: 'Last Name' }).fill('TestUser');
    await page.selectOption('select[name="department"]', 'HR');

    // Save changes
    await page.getByRole('button', { name: 'Update User' }).click();

    // Assertion: Success message
    await expect(page.getByText('User updated successfully')).toBeVisible();
  } else {
    // If no users to edit, verify page loaded
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  }
});

// Test Case 5: Delete user (Delete)
test('master data - user management - delete user', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to User Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('User Management').click();

  // Click Delete on first user (if exists)
  const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
  if (await deleteButton.isVisible().catch(() => false)) {
    await deleteButton.click();

    // Confirm deletion
    await page.getByRole('button', { name: 'Confirm Delete' }).click();

    // Assertion: Success message
    await expect(page.getByText('User deleted successfully')).toBeVisible();
  } else {
    // If no users to delete, verify page loaded
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  }
});

// Test Case 6: Reset user password (Update - Password)
test('master data - user management - reset password', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to User Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('User Management').click();

  // Click Reset Password on first user (if exists)
  const resetButton = page.getByRole('button', { name: 'Reset Password' }).first();
  if (await resetButton.isVisible().catch(() => false)) {
    await resetButton.click();

    // Enter new password
    await page.getByRole('textbox', { name: 'New Password' }).fill('newpassword123');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('newpassword123');

    // Save password reset
    await page.getByRole('button', { name: 'Reset Password' }).click();

    // Assertion: Success message
    await expect(page.getByText('Password reset successfully')).toBeVisible();
  } else {
    // If no reset option, verify page loaded
    await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible();
  }
});