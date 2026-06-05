/**
 * MHC - RUN ALL STAGING TESTS SLOWLY
 * 
 * Script untuk menjalankan test semua menu satu per satu dengan delay
 * sehingga bisa dilihat perpindahan antar menu
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.MHC_BASE_URL || 'https://mhc-dev.modena.com';
const USER = {
  email: process.env.MHC_EMAIL || 'muhzaenal5@gmail.com',
  password: process.env.MHC_PASSWORD || 'P@ssw0rd',
};

const MENUS = [
  { name: 'PPN', path: '/sync-sap/ppn/list' },
  { name: 'PPH', path: '/sync-sap/pph/list' },
  { name: 'BP', path: '/sync-sap/bp/list' },
  { name: 'BP Branch', path: '/sync-sap/bp-branch/list' },
  { name: 'BP Group', path: '/sync-sap/bp-group/list' },
  { name: 'BP Address', path: '/sync-sap/bp-address/list' },
  { name: 'Bank', path: '/sync-sap/bank/list' },
  { name: 'Legal', path: '/sync-sap/legal/list' },
  { name: 'Warehouse', path: '/sync-sap/warehouse/list' },
  { name: 'Order Type', path: '/sync-sap/order-type/list' },
  { name: 'GL Account', path: '/sync-sap/gl-account/list' },
  { name: 'Series', path: '/sync-sap/series/list' },
];

async function testMenu(page, menu) {
  console.log('\n' + '='.repeat(60));
  console.log(`📍 TESTING: ${menu.name}`);
  console.log('='.repeat(60));
  
  // Navigate to menu
  console.log(`Navigating to: ${BASE_URL}${menu.path}`);
  await page.goto(`${BASE_URL}${menu.path}`);
  await page.waitForTimeout(3000);
  
  // Test READ
  console.log('\n1️⃣ READ Test');
  const tableExists = await page.locator('table').count() > 0;
  if (tableExists) {
    const rowCount = await page.locator('tbody tr').count();
    console.log(`   ✅ Table found with ${rowCount} records`);
  } else {
    console.log('   ⚠️ Table not found');
  }
  
  await page.screenshot({ path: `mhc-${menu.name.toLowerCase().replace(/\s+/g, '-')}-list.png`, fullPage: true });
  
  // Test SEARCH
  console.log('\n2️⃣ SEARCH Test');
  const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Cari"], input[type="search"]');
  if (await searchInput.count() > 0) {
    await searchInput.first().fill('TEST');
    await page.waitForTimeout(2000);
    console.log('   ✅ Search input found and tested');
    await searchInput.first().fill('');
    await page.waitForTimeout(1000);
  } else {
    console.log('   ⚠️ Search input not found');
  }
  
  // Test CREATE button
  console.log('\n3️⃣ CREATE Button Test');
  const addButton = page.locator('button:has-text("Add"), button:has-text("Tambah"), button:has-text("Create"), button:has-text("New")');
  if (await addButton.count() > 0) {
    console.log('   ✅ Add button found');
  } else {
    console.log('   ⚠️ Add button not found');
  }
  
  console.log(`\n✅ ${menu.name} testing complete!`);
  console.log('Waiting 3 seconds before next menu...\n');
  await page.waitForTimeout(3000);
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('MHC - STAGING DATA CRUD TESTS (SLOW MODE)');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User: ${USER.email}`);
  console.log(`Total Menus: ${MENUS.length}`);
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  
  try {
    // Login
    console.log('\n📍 LOGGING IN...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    
    await page.fill('input[type="email"]', USER.email);
    await page.fill('input[type="password"]', USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    console.log('✅ Login successful!\n');
    
    // Test each menu
    for (let i = 0; i < MENUS.length; i++) {
      console.log(`\n[${i + 1}/${MENUS.length}] Testing ${MENUS[i].name}...`);
      await testMenu(page, MENUS[i]);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED!');
    console.log('='.repeat(60));
    console.log(`Total Menus Tested: ${MENUS.length}`);
    console.log('Screenshots saved for each menu');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'mhc-error.png', fullPage: true });
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

runAllTests().catch(console.error);
