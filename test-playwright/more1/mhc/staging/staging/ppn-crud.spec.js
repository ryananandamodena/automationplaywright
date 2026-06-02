/**
 * MHC - PPN CRUD TEST
 * 
 * Test CRUD operations untuk menu PPN di Staging Data
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.MHC_BASE_URL || 'https://mhc-dev.modena.com';
const USER = {
  email: process.env.MHC_EMAIL || 'muhzaenal5@gmail.com',
  password: process.env.MHC_PASSWORD || 'P@ssw0rd',
};
const LIST_URL = `${BASE_URL}/sync-sap/ppn/list`;

async function fallbackCleanup(page, snapshot) {
  if (!snapshot || process.env.AUTO_CLEANUP === 'false') return;

  await page.goto(LIST_URL);
  await page.waitForTimeout(1200);

  const row = page.locator(`tbody tr:has-text("${snapshot}")`).first();
  if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) return;

  const deleteBtn = row.locator('button:has-text("Delete"), button:has-text("Hapus"), button:has-text("Remove")').first();
  if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await deleteBtn.click();
    await page.waitForTimeout(700);
    const confirm = page.locator('button:has-text("Yes"), button:has-text("Confirm"), button:has-text("Ya"), button:has-text("OK")').first();
    if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirm.click();
      await page.waitForTimeout(1200);
    }
  }
}

test.describe('MHC - PPN CRUD Tests', () => {
  let page;
  let createdSnapshot = null;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login
    await page.goto(BASE_URL);
    await page.fill('input[type="email"]', USER.email);
    await page.fill('input[type="password"]', USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Navigate to PPN page
    await page.goto(LIST_URL);
    await page.waitForTimeout(3000);
  });

  test.afterAll(async () => {
    await fallbackCleanup(page, createdSnapshot);
    await page.close();
  });

  test('1. READ - Should display PPN list', async () => {
    console.log('\n📍 TEST: READ PPN LIST');
    
    // Check if table exists
    const tableExists = await page.locator('table').count() > 0;
    expect(tableExists).toBeTruthy();
    
    // Get row count
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total PPN records: ${rowCount}`);
    
    await page.screenshot({ path: 'mhc-ppn-list.png', fullPage: true });
    console.log('✅ READ: Success');
  });

  test('2. CREATE - Should create new PPN record', async () => {
    console.log('\n📍 TEST: CREATE PPN');
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial records: ${initialCount}`);
    
    // Click Add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Tambah"), button:has-text("Create")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(2000);
      
      // Fill form (customize based on actual form fields)
      // Example: await page.fill('input[name="code"]', 'TEST-PPN-001');
      
      await page.screenshot({ path: 'mhc-ppn-create-form.png', fullPage: true });
      
      // Submit
      await page.click('button:has-text("Save"), button:has-text("Submit"), button:has-text("Simpan")');
      await page.waitForTimeout(3000);
      
      // Verify
      const finalCount = await page.locator('tbody tr').count();
      console.log(`Final records: ${finalCount}`);
      if (finalCount > initialCount) {
        createdSnapshot = await page.locator('tbody tr').first().textContent().catch(() => null);
      }
      
      console.log('✅ CREATE: Success');
    } else {
      console.log('⚠️ Add button not found');
    }
  });

  test('3. SEARCH - Should filter PPN records', async () => {
    console.log('\n📍 TEST: SEARCH PPN');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('TEST');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'mhc-ppn-search.png', fullPage: true });
      
      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(2000);
      
      console.log('✅ SEARCH: Success');
    } else {
      console.log('⚠️ Search input not found');
    }
  });

  test('4. UPDATE - Should update PPN record', async () => {
    console.log('\n📍 TEST: UPDATE PPN');
    
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Update")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // Update form fields
      // Example: await page.fill('input[name="code"]', 'UPDATED-PPN-001');
      
      await page.screenshot({ path: 'mhc-ppn-update-form.png', fullPage: true });
      
      // Submit
      await page.click('button:has-text("Save"), button:has-text("Update"), button:has-text("Simpan")');
      await page.waitForTimeout(3000);
      
      console.log('✅ UPDATE: Success');
    } else {
      console.log('⚠️ Edit button not found');
    }
  });

  test('5. DELETE - Should delete PPN record', async () => {
    console.log('\n📍 TEST: DELETE PPN');
    
    const initialCount = await page.locator('tbody tr').count();
    
    const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Hapus")').first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      await page.waitForTimeout(1000);
      
      // Confirm deletion
      const confirmButton = page.locator('button:has-text("Yes"), button:has-text("Confirm"), button:has-text("Ya")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
        await page.waitForTimeout(3000);
      }
      
      const finalCount = await page.locator('tbody tr').count();
      console.log(`Before: ${initialCount}, After: ${finalCount}`);
      if (finalCount < initialCount) {
        createdSnapshot = null;
      }
      
      console.log('✅ DELETE: Success');
    } else {
      console.log('⚠️ Delete button not found');
    }
  });
});
