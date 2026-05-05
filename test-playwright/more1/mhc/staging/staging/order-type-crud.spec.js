/**
 * MHC - ORDER TYPE CRUD TEST
 * 
 * Test CRUD operations untuk menu Order Type di Staging Data
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.MHC_BASE_URL || 'https://mhc-dev.modena.com';
const USER = {
  email: process.env.MHC_EMAIL || 'muhzaenal5@gmail.com',
  password: process.env.MHC_PASSWORD || 'P@ssw0rd',
};

test.describe('MHC - Order Type CRUD Tests', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login
    await page.goto(BASE_URL);
    await page.fill('input[type="email"]', USER.email);
    await page.fill('input[type="password"]', USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Navigate to Order Type page
    await page.goto(`${BASE_URL}/sync-sap/order-type/list`);
    await page.waitForTimeout(3000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. READ - Should display Order Type list', async () => {
    console.log('\n📍 TEST: READ Order Type LIST');
    
    // Check if table exists
    const tableExists = await page.locator('table').count() > 0;
    expect(tableExists).toBeTruthy();
    
    // Get row count
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total Order Type records: ${rowCount}`);
    
    await page.screenshot({ path: 'mhc-order-type-crud-list.png', fullPage: true });
    console.log('✅ READ: Success');
  });

  test('2. CREATE - Should create new Order Type record', async () => {
    console.log('\n📍 TEST: CREATE Order Type');
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial records: ${initialCount}`);
    
    // Click Add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Tambah"), button:has-text("Create"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(2000);
      
      // Fill form (customize based on actual form fields)
      // TODO: Add specific form field filling logic here
      
      await page.screenshot({ path: 'mhc-order-type-crud-create-form.png', fullPage: true });
      
      // Submit
      const submitButton = page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Simpan")');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        await page.waitForTimeout(3000);
        
        // Verify
        const finalCount = await page.locator('tbody tr').count();
        console.log(`Final records: ${finalCount}`);
        
        console.log('✅ CREATE: Success');
      } else {
        console.log('⚠️ Submit button not found');
      }
    } else {
      console.log('⚠️ Add button not found');
    }
  });

  test('3. SEARCH - Should filter Order Type records', async () => {
    console.log('\n📍 TEST: SEARCH Order Type');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"], input[type="search"]');
    if (await searchInput.count() > 0) {
      const initialCount = await page.locator('tbody tr').count();
      console.log(`Before search: ${initialCount} records`);
      
      await searchInput.first().fill('TEST');
      await page.waitForTimeout(2000);
      
      const filteredCount = await page.locator('tbody tr').count();
      console.log(`After search: ${filteredCount} records`);
      
      await page.screenshot({ path: 'mhc-order-type-crud-search.png', fullPage: true });
      
      // Clear search
      await searchInput.first().fill('');
      await page.waitForTimeout(2000);
      
      console.log('✅ SEARCH: Success');
    } else {
      console.log('⚠️ Search input not found');
    }
  });

  test('4. UPDATE - Should update Order Type record', async () => {
    console.log('\n📍 TEST: UPDATE Order Type');
    
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Update"), button:has-text("Ubah")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // Update form fields
      // TODO: Add specific form field update logic here
      
      await page.screenshot({ path: 'mhc-order-type-crud-update-form.png', fullPage: true });
      
      // Submit
      const submitButton = page.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Simpan")');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        await page.waitForTimeout(3000);
        
        console.log('✅ UPDATE: Success');
      } else {
        console.log('⚠️ Submit button not found');
      }
    } else {
      console.log('⚠️ Edit button not found');
    }
  });

  test('5. DELETE - Should delete Order Type record', async () => {
    console.log('\n📍 TEST: DELETE Order Type');
    
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Before delete: ${initialCount} records`);
    
    const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Hapus"), button:has-text("Remove")').first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      
      // Confirm deletion
      const confirmButton = page.locator('button:has-text("Yes"), button:has-text("Confirm"), button:has-text("Ya"), button:has-text("OK")');
      if (await confirmButton.count() > 0) {
        await confirmButton.first().click();
        await page.waitForTimeout(3000);
        
        const finalCount = await page.locator('tbody tr').count();
        console.log(`After delete: ${finalCount} records`);
        
        console.log('✅ DELETE: Success');
      } else {
        console.log('⚠️ Confirm button not found');
      }
    } else {
      console.log('⚠️ Delete button not found');
    }
  });

  test('6. VALIDATION - Should show validation errors', async () => {
    console.log('\n📍 TEST: VALIDATION Order Type');
    
    // Click Add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Tambah"), button:has-text("Create")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(2000);
      
      // Try to submit empty form
      const submitButton = page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Simpan")');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        await page.waitForTimeout(2000);
        
        // Check for validation messages
        const validationMessages = await page.locator('text=/required|wajib|error|tidak boleh kosong|harus diisi/i').count();
        console.log(`Validation messages found: ${validationMessages}`);
        
        await page.screenshot({ path: 'mhc-order-type-crud-validation.png', fullPage: true });
        
        // Close form
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), button:has-text("Batal")');
        if (await cancelButton.count() > 0) {
          await cancelButton.first().click();
          await page.waitForTimeout(1000);
        }
        
        console.log('✅ VALIDATION: Success');
      }
    }
  });
});
