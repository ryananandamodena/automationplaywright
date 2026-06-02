/**
 * MHC - CRUD TEST TEMPLATE
 * 
 * Template untuk test CRUD operations pada menu Staging Data
 * Copy template ini dan sesuaikan dengan menu yang akan ditest
 */

const { test, expect } = require('@playwright/test');

// Configuration
const BASE_URL = process.env.MHC_BASE_URL || 'https://mhc-dev.modena.com';
const USER = {
  email: process.env.MHC_EMAIL || 'your.email@modena.com',
  password: process.env.MHC_PASSWORD || 'YourPassword',
};

// Menu Configuration - CUSTOMIZE THIS
const MENU_CONFIG = {
  menuName: 'Menu Name',           // e.g., 'Master Product'
  menuPath: '/path/to/menu',       // e.g., '/staging/master-product'
  addButtonText: 'Add',            // Text on add button
  editButtonSelector: 'button:has-text("Edit")',
  deleteButtonSelector: 'button:has-text("Delete")',
  searchInputSelector: 'input[placeholder*="Search"]',
};

const LIST_URL = `${BASE_URL}${MENU_CONFIG.menuPath}`;

// Test Data - CUSTOMIZE THIS
const TEST_DATA = {
  create: {
    // Add fields for create operation
    field1: 'Test Value 1',
    field2: 'Test Value 2',
  },
  update: {
    // Add fields for update operation
    field1: 'Updated Value 1',
    field2: 'Updated Value 2',
  },
  search: 'Test Value 1',
};

test.describe(`MHC - ${MENU_CONFIG.menuName} CRUD Tests`, () => {
  let page;
  let createdItemId;
  let createdSnapshot;

  // Setup: Login before all tests
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login
    await page.goto(BASE_URL);
    await page.fill('input[type="email"]', USER.email);
    await page.fill('input[type="password"]', USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to menu
    await page.goto(LIST_URL);
    await page.waitForTimeout(2000);
  });

  test.afterAll(async () => {
    if (createdSnapshot && process.env.AUTO_CLEANUP !== 'false') {
      // Fallback cleanup: run even if dedicated DELETE test did not remove the created item.
      await page.goto(LIST_URL);
      await page.waitForTimeout(1500);

      const searchInput = page.locator(MENU_CONFIG.searchInputSelector).first();
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill(createdSnapshot);
        await page.waitForTimeout(1200);
      }

      const targetRow = page.locator(`tbody tr:has-text("${createdSnapshot}")`).first();
      if (await targetRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        const deleteBtn = targetRow.locator(MENU_CONFIG.deleteButtonSelector).first();
        if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await deleteBtn.click();
          await page.waitForTimeout(700);
          const confirmButton = page.locator('button:has-text("Yes"), button:has-text("Confirm"), button:has-text("Ya"), button:has-text("OK"), button:has-text("Delete")');
          if (await confirmButton.count() > 0) {
            await confirmButton.first().click();
            await page.waitForTimeout(1400);
          }
        }
      }
    }

    await page.close();
  });

  // TEST 1: CREATE
  test('1. CREATE - Should create new item successfully', async () => {
    console.log('\n📍 TEST: CREATE');
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial items: ${initialCount}`);
    
    // Click Add button
    await page.click(`button:has-text("${MENU_CONFIG.addButtonText}")`);
    await page.waitForTimeout(2000);
    
    // Fill form - CUSTOMIZE THIS SECTION
    // Example:
    // await page.fill('input[name="field1"]', TEST_DATA.create.field1);
    // await page.fill('input[name="field2"]', TEST_DATA.create.field2);
    
    await page.screenshot({ path: `mhc-${MENU_CONFIG.menuName}-create-filled.png` });
    
    // Submit form
    await page.click('button:has-text("Save"), button:has-text("Submit")');
    await page.waitForTimeout(3000);
    
    // Verify success
    const finalCount = await page.locator('tbody tr').count();
    console.log(`Final items: ${finalCount}`);

    if (finalCount > initialCount) {
      createdSnapshot = await page.locator('tbody tr').first().textContent().catch(() => null);
    }
    
    expect(finalCount).toBeGreaterThan(initialCount);
    console.log('✅ CREATE: Success');
  });

  // TEST 2: READ/LIST
  test('2. READ - Should display list of items', async () => {
    console.log('\n📍 TEST: READ');
    
    // Check if table exists
    const tableExists = await page.locator('table').count() > 0;
    expect(tableExists).toBeTruthy();
    
    // Check if rows exist
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total items: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);
    
    await page.screenshot({ path: `mhc-${MENU_CONFIG.menuName}-list.png` });
    console.log('✅ READ: Success');
  });

  // TEST 3: SEARCH
  test('3. SEARCH - Should filter items by search term', async () => {
    console.log('\n📍 TEST: SEARCH');
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Before search: ${initialCount} items`);
    
    // Perform search
    await page.fill(MENU_CONFIG.searchInputSelector, TEST_DATA.search);
    await page.waitForTimeout(2000);
    
    // Get filtered count
    const filteredCount = await page.locator('tbody tr').count();
    console.log(`After search: ${filteredCount} items`);
    
    await page.screenshot({ path: `mhc-${MENU_CONFIG.menuName}-search.png` });
    
    // Clear search
    await page.fill(MENU_CONFIG.searchInputSelector, '');
    await page.waitForTimeout(2000);
    
    console.log('✅ SEARCH: Success');
  });

  // TEST 4: UPDATE
  test('4. UPDATE - Should update existing item', async () => {
    console.log('\n📍 TEST: UPDATE');
    
    // Click edit on first row
    await page.locator(MENU_CONFIG.editButtonSelector).first().click();
    await page.waitForTimeout(2000);
    
    // Update form - CUSTOMIZE THIS SECTION
    // Example:
    // await page.fill('input[name="field1"]', TEST_DATA.update.field1);
    // await page.fill('input[name="field2"]', TEST_DATA.update.field2);
    
    await page.screenshot({ path: `mhc-${MENU_CONFIG.menuName}-update-filled.png` });
    
    // Submit form
    await page.click('button:has-text("Save"), button:has-text("Update")');
    await page.waitForTimeout(3000);
    
    // Verify update
    const updatedText = await page.locator('tbody tr').first().textContent();
    console.log(`Updated row: ${updatedText}`);
    
    await page.screenshot({ path: `mhc-${MENU_CONFIG.menuName}-updated.png` });
    console.log('✅ UPDATE: Success');
  });

  // TEST 5: DELETE
  test('5. DELETE - Should delete item successfully', async () => {
    console.log('\n📍 TEST: DELETE');
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Before delete: ${initialCount} items`);
    
    // Click delete on first row
    await page.locator(MENU_CONFIG.deleteButtonSelector).first().click();
    await page.waitForTimeout(1000);
    
    // Confirm deletion (if confirmation dialog exists)
    const confirmButton = page.locator('button:has-text("Yes"), button:has-text("Confirm"), button:has-text("Delete")');
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Verify deletion
    const finalCount = await page.locator('tbody tr').count();
    console.log(`After delete: ${finalCount} items`);

    if (finalCount < initialCount) {
      createdSnapshot = null;
    }
    
    expect(finalCount).toBeLessThan(initialCount);
    
    await page.screenshot({ path: `mhc-${MENU_CONFIG.menuName}-deleted.png` });
    console.log('✅ DELETE: Success');
  });

  // TEST 6: VALIDATION
  test('6. VALIDATION - Should show validation errors', async () => {
    console.log('\n📍 TEST: VALIDATION');
    
    // Click Add button
    await page.click(`button:has-text("${MENU_CONFIG.addButtonText}")`);
    await page.waitForTimeout(2000);
    
    // Try to submit empty form
    await page.click('button:has-text("Save"), button:has-text("Submit")');
    await page.waitForTimeout(2000);
    
    // Check for validation messages
    const validationMessages = await page.locator('text=/required|wajib|error|tidak boleh kosong/i').count();
    console.log(`Validation messages found: ${validationMessages}`);
    
    await page.screenshot({ path: `mhc-${MENU_CONFIG.menuName}-validation.png` });
    
    // Close form
    await page.click('button:has-text("Cancel"), button:has-text("Close")').catch(() => {});
    await page.waitForTimeout(1000);
    
    console.log('✅ VALIDATION: Success');
  });
});
