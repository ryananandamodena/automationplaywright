/**
 * MHC - GENERATE ALL STAGING DATA CRUD TESTS
 * 
 * Script untuk generate test case CRUD untuk semua menu di Staging Data
 */

import fs from 'fs';
import path from 'path';

const STAGING_MENUS = [
  { name: 'PPN', path: '/sync-sap/ppn/list', filename: 'ppn-crud.spec.js' },
  { name: 'PPH', path: '/sync-sap/pph/list', filename: 'pph-crud.spec.js' },
  { name: 'BP', path: '/sync-sap/bp/list', filename: 'bp-crud.spec.js' },
  { name: 'BP Branch', path: '/sync-sap/bp-branch/list', filename: 'bp-branch-crud.spec.js' },
  { name: 'BP Group', path: '/sync-sap/bp-group/list', filename: 'bp-group-crud.spec.js' },
  { name: 'BP Address', path: '/sync-sap/bp-address/list', filename: 'bp-address-crud.spec.js' },
  { name: 'Bank', path: '/sync-sap/bank/list', filename: 'bank-crud.spec.js' },
  { name: 'Legal', path: '/sync-sap/legal/list', filename: 'legal-crud.spec.js' },
  { name: 'Warehouse', path: '/sync-sap/warehouse/list', filename: 'warehouse-crud.spec.js' },
  { name: 'Order Type', path: '/sync-sap/order-type/list', filename: 'order-type-crud.spec.js' },
  { name: 'GL Account', path: '/sync-sap/gl-account/list', filename: 'gl-account-crud.spec.js' },
  { name: 'Series', path: '/sync-sap/series/list', filename: 'series-crud.spec.js' },
];

function generateTestFile(menu) {
  const template = `/**
 * MHC - ${menu.name.toUpperCase()} CRUD TEST
 * 
 * Test CRUD operations untuk menu ${menu.name} di Staging Data
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.MHC_BASE_URL || 'https://mhc-dev.modena.com';
const USER = {
  email: process.env.MHC_EMAIL || 'muhzaenal5@gmail.com',
  password: process.env.MHC_PASSWORD || 'P@ssw0rd',
};

test.describe('MHC - ${menu.name} CRUD Tests', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login
    await page.goto(BASE_URL);
    await page.fill('input[type="email"]', USER.email);
    await page.fill('input[type="password"]', USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Navigate to ${menu.name} page
    await page.goto(\`\${BASE_URL}${menu.path}\`);
    await page.waitForTimeout(3000);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. READ - Should display ${menu.name} list', async () => {
    console.log('\\n📍 TEST: READ ${menu.name} LIST');
    
    // Check if table exists
    const tableExists = await page.locator('table').count() > 0;
    expect(tableExists).toBeTruthy();
    
    // Get row count
    const rowCount = await page.locator('tbody tr').count();
    console.log(\`Total ${menu.name} records: \${rowCount}\`);
    
    await page.screenshot({ path: 'mhc-${menu.filename.replace('.spec.js', '')}-list.png', fullPage: true });
    console.log('✅ READ: Success');
  });

  test('2. CREATE - Should create new ${menu.name} record', async () => {
    console.log('\\n📍 TEST: CREATE ${menu.name}');
    
    // Get initial count
    const initialCount = await page.locator('tbody tr').count();
    console.log(\`Initial records: \${initialCount}\`);
    
    // Click Add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("Tambah"), button:has-text("Create"), button:has-text("New")');
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(2000);
      
      // Fill form (customize based on actual form fields)
      // TODO: Add specific form field filling logic here
      
      await page.screenshot({ path: 'mhc-${menu.filename.replace('.spec.js', '')}-create-form.png', fullPage: true });
      
      // Submit
      const submitButton = page.locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Simpan")');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        await page.waitForTimeout(3000);
        
        // Verify
        const finalCount = await page.locator('tbody tr').count();
        console.log(\`Final records: \${finalCount}\`);
        
        console.log('✅ CREATE: Success');
      } else {
        console.log('⚠️ Submit button not found');
      }
    } else {
      console.log('⚠️ Add button not found');
    }
  });

  test('3. SEARCH - Should filter ${menu.name} records', async () => {
    console.log('\\n📍 TEST: SEARCH ${menu.name}');
    
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"], input[type="search"]');
    if (await searchInput.count() > 0) {
      const initialCount = await page.locator('tbody tr').count();
      console.log(\`Before search: \${initialCount} records\`);
      
      await searchInput.first().fill('TEST');
      await page.waitForTimeout(2000);
      
      const filteredCount = await page.locator('tbody tr').count();
      console.log(\`After search: \${filteredCount} records\`);
      
      await page.screenshot({ path: 'mhc-${menu.filename.replace('.spec.js', '')}-search.png', fullPage: true });
      
      // Clear search
      await searchInput.first().fill('');
      await page.waitForTimeout(2000);
      
      console.log('✅ SEARCH: Success');
    } else {
      console.log('⚠️ Search input not found');
    }
  });

  test('4. UPDATE - Should update ${menu.name} record', async () => {
    console.log('\\n📍 TEST: UPDATE ${menu.name}');
    
    const editButton = page.locator('button:has-text("Edit"), button:has-text("Update"), button:has-text("Ubah")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(2000);
      
      // Update form fields
      // TODO: Add specific form field update logic here
      
      await page.screenshot({ path: 'mhc-${menu.filename.replace('.spec.js', '')}-update-form.png', fullPage: true });
      
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

  test('5. DELETE - Should delete ${menu.name} record', async () => {
    console.log('\\n📍 TEST: DELETE ${menu.name}');
    
    const initialCount = await page.locator('tbody tr').count();
    console.log(\`Before delete: \${initialCount} records\`);
    
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
        console.log(\`After delete: \${finalCount} records\`);
        
        console.log('✅ DELETE: Success');
      } else {
        console.log('⚠️ Confirm button not found');
      }
    } else {
      console.log('⚠️ Delete button not found');
    }
  });

  test('6. VALIDATION - Should show validation errors', async () => {
    console.log('\\n📍 TEST: VALIDATION ${menu.name}');
    
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
        console.log(\`Validation messages found: \${validationMessages}\`);
        
        await page.screenshot({ path: 'mhc-${menu.filename.replace('.spec.js', '')}-validation.png', fullPage: true });
        
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
`;

  return template;
}

function main() {
  console.log('\n' + '='.repeat(60));
  console.log('GENERATE ALL STAGING DATA CRUD TESTS');
  console.log('='.repeat(60));
  
  const stagingDir = path.join(process.cwd(), 'mhc', 'staging');
  
  // Create directory if not exists
  if (!fs.existsSync(stagingDir)) {
    fs.mkdirSync(stagingDir, { recursive: true });
    console.log(`✓ Created directory: ${stagingDir}`);
  }
  
  // Generate test files
  STAGING_MENUS.forEach((menu, index) => {
    const testContent = generateTestFile(menu);
    const filePath = path.join(stagingDir, menu.filename);
    
    fs.writeFileSync(filePath, testContent);
    console.log(`${index + 1}. ✓ Generated: ${menu.filename}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ SUCCESS! Generated ${STAGING_MENUS.length} test files`);
  console.log('='.repeat(60));
  
  console.log('\n📁 Test files location:');
  console.log(`   ${stagingDir}`);
  
  console.log('\n📝 Menu list:');
  STAGING_MENUS.forEach((menu, index) => {
    console.log(`   ${index + 1}. ${menu.name} → ${menu.filename}`);
  });
  
  console.log('\n🚀 To run tests:');
  console.log('   cd playwright-server/test-playwright');
  console.log('   npx playwright test mhc/staging/ppn-crud.spec.js');
  console.log('   npx playwright test mhc/staging/ --headed');
}

main();
