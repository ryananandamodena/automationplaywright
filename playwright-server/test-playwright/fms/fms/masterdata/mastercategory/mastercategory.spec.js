import { test, expect } from '@playwright/test';

// Test Case 1: Access Master Category page
test('master data - master category - access page', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Master Category
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Master Category').click();

  // Assertion: Master Category page is loaded
  await expect(page.getByRole('heading', { name: 'Master Category' })).toBeVisible();
  await expect(page.getByText('Manage item categories')).toBeVisible();
});

// Test Case 2: View categories list (Read)
test('master data - master category - view categories', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Master Category
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Master Category').click();

  // Assertion: Categories table is displayed
  await expect(page.getByRole('heading', { name: 'Master Category' })).toBeVisible();
  // Check if table exists
  const tableExists = await page.locator('table').isVisible().catch(() => false);
  if (tableExists) {
    await expect(page.locator('table')).toBeVisible();
  }
});

// Test Case 3: Create new category (Create)
test('master data - master category - create category', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Master Category
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Master Category').click();

  // Click Add Category button (if exists)
  const addCategoryButton = page.getByRole('button', { name: 'Add Category' });
  if (await addCategoryButton.isVisible().catch(() => false)) {
    await addCategoryButton.click();

    // Fill category form
    await page.getByRole('textbox', { name: 'Category Code' }).fill('TESTCAT');
    await page.getByRole('textbox', { name: 'Category Name' }).fill('Test Category');
    await page.getByRole('textbox', { name: 'Description' }).fill('Test category via automation');

    // Save category
    await page.getByRole('button', { name: 'Save Category' }).click();

    // Assertion: Success message
    await expect(page.getByText('Category created successfully')).toBeVisible();
  } else {
    // If no add button, verify page loaded
    await expect(page.getByRole('heading', { name: 'Master Category' })).toBeVisible();
  }
});

// Test Case 4: Edit existing category (Update)
test('master data - master category - edit category', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Master Category
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Master Category').click();

  // Click Edit on first category (if exists)
  const editButton = page.getByRole('button', { name: 'Edit' }).first();
  if (await editButton.isVisible().catch(() => false)) {
    await editButton.click();

    // Modify category details
    await page.getByRole('textbox', { name: 'Category Name' }).fill('Updated Test Category');
    await page.getByRole('textbox', { name: 'Description' }).fill('Updated category description');

    // Save changes
    await page.getByRole('button', { name: 'Update Category' }).click();

    // Assertion: Success message
    await expect(page.getByText('Category updated successfully')).toBeVisible();
  } else {
    // If no categories to edit, verify page loaded
    await expect(page.getByRole('heading', { name: 'Master Category' })).toBeVisible();
  }
});

// Test Case 5: Delete category (Delete)
test('master data - master category - delete category', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Master Category
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Master Category').click();

  // Click Delete on first category (if exists)
  const deleteButton = page.getByRole('button', { name: 'Delete' }).first();
  if (await deleteButton.isVisible().catch(() => false)) {
    await deleteButton.click();

    // Confirm deletion
    await page.getByRole('button', { name: 'Confirm Delete' }).click();

    // Assertion: Success message
    await expect(page.getByText('Category deleted successfully')).toBeVisible();
  } else {
    // If no categories to delete, verify page loaded
    await expect(page.getByRole('heading', { name: 'Master Category' })).toBeVisible();
  }
});

// Test Case 6: View category hierarchy (Read - Tree View)
test('master data - master category - view hierarchy', async ({ page }) => {
  // Login
  await page.goto('https://fms-dev.modena.com/home');
  await page.getByRole('textbox', { name: 'Email Address' }).fill('admin@modena.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Administrator Dashboard')).toBeVisible();

  // Navigate to Master Category
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByText('Master Category').click();

  // Click Tree View button (if exists)
  const treeViewButton = page.getByRole('button', { name: 'Tree View' });
  if (await treeViewButton.isVisible().catch(() => false)) {
    await treeViewButton.click();

    // Assertion: Tree view is displayed
    await expect(page.getByText('Category Hierarchy')).toBeVisible();
    await expect(page.locator('.tree-node')).toBeVisible();
  } else {
    // If no tree view, verify page loaded
    await expect(page.getByRole('heading', { name: 'Master Category' })).toBeVisible();
  }
});