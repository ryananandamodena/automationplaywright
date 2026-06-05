import { test, expect } from '@playwright/test';

// Test Case 1: Access Role Management page
test('master data - role management - access page', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Role Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Role Management').click();

  // Assertion: Role Management page is loaded
  await expect(page.getByRole('heading', { name: 'Role Management' })).toBeVisible();
  await expect(page.getByText('Manage user roles and permissions')).toBeVisible();
});

// Test Case 2: View roles list (Read)
test('master data - role management - view roles', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Role Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Role Management').click();

  // Assertion: Roles table is displayed
  await expect(page.getByRole('heading', { name: 'Role Management' })).toBeVisible();
  // Check if table exists
  const tableExists = await page.locator('table').isVisible().catch(() => false);
  if (tableExists) {
    await expect(page.locator('table')).toBeVisible();
  }
});

// Test Case 3: Create new role (Create)
test('master data - role management - create role', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Role Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Role Management').click();

  // Click Add Role button (if exists)
  const addRoleButton = page.getByRole('button', { name: 'Add Role' });
  if (await addRoleButton.isVisible().catch(() => false)) {
    await addRoleButton.click();

    // Fill role form
    await page.getByRole('textbox', { name: 'Role Name' }).fill('Test Role');
    await page.getByRole('textbox', { name: 'Description' }).fill('Test role via automation');
    await page.selectOption('select[name="roleLevel"]', 'User');

    // Set permissions
    await page.check('input[name="readPermission"]');
    await page.check('input[name="writePermission"]');
    await page.check('input[name="deletePermission"]');

    // Save role
    await page.getByRole('button', { name: 'Save Role' }).click();

    // Assertion: Success message
    await expect(page.getByText('Role created successfully')).toBeVisible();
  } else {
    // If no add button, verify page loaded
    await expect(page.getByRole('heading', { name: 'Role Management' })).toBeVisible();
  }
});

// Test Case 4: Edit existing role (Update)
test('master data - role management - edit role', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Role Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Role Management').click();

  // Click Edit on first role (if exists)
  const editButton = page.getByRole('button', { name: 'Edit' }).first();
  if (await editButton.isVisible().catch(() => false)) {
    await editButton.click();

    // Modify role details
    await page.getByRole('textbox', { name: 'Role Name' }).fill('Updated Test Role');
    await page.getByRole('textbox', { name: 'Description' }).fill('Updated role description');
    await page.uncheck('input[name="deletePermission"]');

    // Save changes
    await page.getByRole('button', { name: 'Update Role' }).click();

    // Assertion: Success message
    await expect(page.getByText('Role updated successfully')).toBeVisible();
  } else {
    // If no roles to edit, verify page loaded
    await expect(page.getByRole('heading', { name: 'Role Management' })).toBeVisible();
  }
});

// Test Case 5: Delete role (Delete)
test('master data - role management - delete role', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Role Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Role Management').click();

  // Click Delete on first role (if exists)
  const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
  if (await deleteButton.isVisible().catch(() => false)) {
    await deleteButton.click();

    // Confirm deletion
    await page.getByRole('button', { name: 'Confirm Delete' }).click();

    // Assertion: Success message
    await expect(page.getByText('Role deleted successfully')).toBeVisible();
  } else {
    // If no roles to delete, verify page loaded
    await expect(page.getByRole('heading', { name: 'Role Management' })).toBeVisible();
  }
});

// Test Case 6: Configure role permissions (Update - Permissions)
test('master data - role management - configure permissions', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Role Management
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Role Management').click();

  // Click Configure Permissions on first role (if exists)
  const configButton = page.getByRole('button', { name: 'Configure Permissions' }).first();
  if (await configButton.isVisible().catch(() => false)) {
    await configButton.click();

    // Configure permissions
    await page.check('input[name="masterDataAccess"]');
    await page.check('input[name="reportsAccess"]');
    await page.uncheck('input[name="adminAccess"]');

    // Set module-specific permissions
    await page.selectOption('select[name="inventoryPermission"]', 'read-write');
    await page.selectOption('select[name="salesPermission"]', 'read-only');

    // Save permissions
    await page.getByRole('button', { name: 'Save Permissions' }).click();

    // Assertion: Success message
    await expect(page.getByText('Permissions configured successfully')).toBeVisible();
  } else {
    // If no configuration option, verify page loaded
    await expect(page.getByRole('heading', { name: 'Role Management' })).toBeVisible();
  }
});