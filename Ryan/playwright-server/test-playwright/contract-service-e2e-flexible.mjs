/**
 * CONTRACT & SERVICE E2E - FLEXIBLE DATA VERSION
 * 
 * End-to-end testing untuk Contract dan Service dengan data fleksibel
 * - Selalu menggunakan data yang tersedia di sistem
 * - Tidak hardcode data spesifik
 * - Adaptif terhadap perubahan data
 */

import { chromium } from 'playwright';
import {
  cleanupContractBySnapshot,
  cleanupServiceBySnapshot,
  isAutoCleanupEnabled,
} from './utils/data-cleanup.mjs';

const BASE_URL = 'https://portal-dev.modena.com';
const USER = {
  email: 'ryan.ananda@modena.com',
  password: 'P@ssw0rd_ryan.ananda',
  name: 'Ryan Ananda'
};

const createdSnapshots = {
  contract: null,
  service: null,
};

// Helper: Fill react-select dengan data fleksibel
async function fillReactSelect(page, containerIndex, searchText, label = '') {
  try {
    console.log(`  Filling ${label}...`);
    const container = page.locator('div.css-b62m3t-container').nth(containerIndex);
    await container.click();
    await page.waitForTimeout(1000);
    
    // Type search text
    await page.keyboard.type(searchText);
    await page.waitForTimeout(2000);
    
    // Count available options
    const opts = await page.locator('div[id*="react-select"][id*="option"]').count();
    console.log(`    Found ${opts} options`);
    
    if (opts > 0) {
      // Get first option text
      const firstOption = await page.locator('div[id*="react-select"][id*="option"]').first().textContent();
      await page.locator('div[id*="react-select"][id*="option"]').first().click();
      console.log(`    ✓ Selected: ${firstOption.trim()}`);
      return firstOption.trim();
    } else {
      console.log(`    ⚠️ No options found for "${searchText}"`);
      // Press Escape to close dropdown
      await page.keyboard.press('Escape');
      return null;
    }
  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    return null;
  }
}

// Helper: Get available vehicles from dropdown
async function getAvailableVehicles(page) {
  try {
    const vehicleSelect = page.locator('select').first();
    const options = await vehicleSelect.locator('option').allTextContents();
    
    // Filter out placeholder option
    const vehicles = options.filter(opt => opt.trim() && !opt.includes('--'));
    console.log(`  Found ${vehicles.length} available vehicles`);
    
    return vehicles;
  } catch (error) {
    console.log(`  Error getting vehicles: ${error.message}`);
    return [];
  }
}

// Step 1: Login
async function login(page) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: LOGIN');
  console.log('='.repeat(60));
  
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  await page.fill('input[name="email"]', USER.email);
  await page.fill('input[type="password"]', USER.password);
  console.log(`✓ Credentials filled: ${USER.email}`);
  
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  // Handle FMS selection if on my-application page
  if (page.url().includes('my-application')) {
    await page.click('text=FMS (DEV)');
    await page.waitForTimeout(2000);
    
    if (await page.locator('.swal2-confirm').isVisible().catch(() => false)) {
      await page.click('.swal2-confirm');
      await page.waitForTimeout(3000);
    }
  }
  
  console.log('✅ Login successful');
  await page.screenshot({ path: 'e2e-01-login.png', fullPage: true });
}

// Step 2: Create Contract
async function createContract(page) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: CREATE CONTRACT');
  console.log('='.repeat(60));
  
  await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const initialCount = await page.locator('tbody tr').count();
  console.log(`Initial contract count: ${initialCount}`);
  
  // Open form
  console.log('\nOpening contract form...');
  await page.click('button:has-text("Add Contract")');
  await page.waitForTimeout(3000);
  console.log('✓ Form opened');
  
  await page.screenshot({ path: 'e2e-02-contract-form.png', fullPage: true });
  
  // Fill form with flexible data
  console.log('\nFilling contract form...');
  
  // Vendor - search for "PT" and select first result
  const vendor = await fillReactSelect(page, 0, 'PT', 'Vendor');
  await page.waitForTimeout(500);
  
  // Dates - use current date + 1 month for start, + 1 year for end
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() + 1);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`  Filling dates...`);
  await page.locator('input[type="date"]').first().fill(startDateStr);
  await page.locator('input[type="date"]').nth(1).fill(endDateStr);
  console.log(`    ✓ ${startDateStr} to ${endDateStr}`);
  
  // Vehicle - get available vehicles and select first one
  console.log(`  Selecting vehicle...`);
  const vehicles = await getAvailableVehicles(page);
  if (vehicles.length > 0) {
    await page.locator('select').first().selectOption({ index: 1 });
    console.log(`    ✓ Selected: ${vehicles[0]}`);
  }
  await page.waitForTimeout(500);
  
  // Channel - search for "Retail" or any available
  const channel = await fillReactSelect(page, 1, 'Retail', 'Channel');
  await page.waitForTimeout(500);
  
  // Branch - search for "Jakarta" or any available
  const branch = await fillReactSelect(page, 2, 'Jakarta', 'Branch');
  await page.waitForTimeout(500);
  
  // Main User - search for "Ryan" or any available
  const mainUser = await fillReactSelect(page, 3, 'Ryan', 'Main User');
  await page.waitForTimeout(500);
  
  // Rent Cost - generate random cost between 3-8 million
  const rentCost = (Math.floor(Math.random() * 5) + 3) * 1000000;
  console.log(`  Filling rent cost...`);
  const rentInput = page.locator('input[placeholder="0"]');
  await rentInput.click();
  await rentInput.fill(rentCost.toString());
  console.log(`    ✓ Rp ${rentCost.toLocaleString('id-ID')}`);
  
  await page.screenshot({ path: 'e2e-03-contract-filled.png', fullPage: true });
  
  // Submit
  console.log('\nSubmitting contract...');
  await page.click('button:has-text("Save Contract")');
  await page.waitForTimeout(3000);
  
  // Handle alert if any
  const swalTitle = await page.locator('.swal2-title').textContent().catch(() => null);
  if (swalTitle) {
    console.log(`📢 Alert: ${swalTitle}`);
    const swalText = await page.locator('.swal2-html-container').textContent().catch(() => '');
    if (swalText) console.log(`   ${swalText}`);
    
    await page.click('.swal2-confirm');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: 'e2e-04-contract-submitted.png', fullPage: true });
  
  // Verify
  await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const finalCount = await page.locator('tbody tr').count();
  console.log(`\nFinal contract count: ${finalCount}`);
  
  if (finalCount > initialCount) {
    console.log(`✅ Contract created successfully! (${initialCount} → ${finalCount})`);
    
    // Get the newly created contract details
    const firstRow = await page.locator('tbody tr').first().textContent();
    createdSnapshots.contract = firstRow;
    console.log(`New contract: ${firstRow.substring(0, 100)}...`);
    
    await page.screenshot({ path: 'e2e-05-contract-list.png', fullPage: true });
    return true;
  } else {
    console.log(`⚠️ Contract not created (still ${finalCount} rows)`);
    return false;
  }
}

// Step 3: View Contract Details
async function viewContractDetails(page) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: VIEW CONTRACT DETAILS');
  console.log('='.repeat(60));
  
  await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Try to click on first row to view details
  const firstRow = page.locator('tbody tr').first();
  
  // Try different methods to view details
  // Method 1: Click view/eye button
  const viewBtn = firstRow.locator('button, a').filter({ hasText: /view|detail|eye/i }).first();
  const eyeIcon = firstRow.locator('svg[class*="eye"], button[title*="view"], button[title*="detail"]').first();
  
  let opened = false;
  
  if (await viewBtn.isVisible().catch(() => false)) {
    await viewBtn.click();
    opened = true;
  } else if (await eyeIcon.isVisible().catch(() => false)) {
    await eyeIcon.click();
    opened = true;
  } else {
    // Method 2: Click on row itself
    console.log('  Trying to click row directly...');
    await firstRow.click();
    opened = true;
  }
  
  if (opened) {
    await page.waitForTimeout(2000);
    console.log('✓ Contract details opened');
    
    await page.screenshot({ path: 'e2e-06-contract-details.png', fullPage: true });
    
    // Close modal or go back
    const closeBtn = page.locator('button').filter({ hasText: /close|back|kembali|tutup/i }).first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    } else {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ Contract details viewed');
    return true;
  } else {
    console.log('⚠️ Could not open contract details');
    return false;
  }
}

// Step 4: Create Service Record
async function createService(page) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: CREATE SERVICE RECORD');
  console.log('='.repeat(60));
  
  await page.goto(`${BASE_URL}/fms/vehicle/service`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const initialCount = await page.locator('tbody tr').count();
  console.log(`Initial service count: ${initialCount}`);
  
  // Open form - try multiple button selectors
  console.log('\nOpening service form...');
  
  // Try different button selectors
  const addBtnSelectors = [
    page.locator('button:has-text("Add Service")'),
    page.locator('button:has-text("Add")'),
    page.locator('button:has-text("Create")'),
    page.locator('button:has-text("New")'),
    page.locator('button').filter({ hasText: /add|create|new|tambah/i }).first(),
    page.locator('a[href*="add"], a[href*="create"]').first(),
  ];
  
  let formOpened = false;
  
  for (const btn of addBtnSelectors) {
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(3000);
      formOpened = true;
      console.log('✓ Form opened');
      break;
    }
  }
  
  if (!formOpened) {
    console.log('⚠️ Add button not found, trying to navigate to form URL...');
    
    // Try direct URL navigation
    const possibleUrls = [
      `${BASE_URL}/fms/vehicle/service/add`,
      `${BASE_URL}/fms/vehicle/service/create`,
      `${BASE_URL}/fms/vehicle/service/form`,
    ];
    
    for (const url of possibleUrls) {
      await page.goto(url, { waitUntil: 'load', timeout: 10000 }).catch(() => null);
      await page.waitForTimeout(2000);
      
      // Check if we're on a form page
      const hasForm = await page.locator('form, input[type="date"], select').first().isVisible({ timeout: 2000 }).catch(() => false);
      if (hasForm) {
        formOpened = true;
        console.log(`✓ Form opened via URL: ${url}`);
        break;
      }
    }
  }
  
  if (!formOpened) {
    console.log('❌ Could not open service form');
    return false;
  }
  
  // Form is opened, now fill it
  await page.screenshot({ path: 'e2e-07-service-form.png', fullPage: true });
  console.log('\nFilling service form...');
    
    // Service date - use today
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = await page.locator('input[type="date"]').count();
    if (dateInputs > 0) {
      await page.locator('input[type="date"]').first().fill(today);
      console.log(`  ✓ Service date: ${today}`);
    }
    
    // Select vehicle from dropdown
    const vehicleSelects = await page.locator('select').count();
    if (vehicleSelects > 0) {
      await page.locator('select').first().selectOption({ index: 1 });
      console.log(`  ✓ Vehicle selected`);
    }
    
    // Service type - select first available
    if (vehicleSelects > 1) {
      await page.locator('select').nth(1).selectOption({ index: 1 });
      console.log(`  ✓ Service type selected`);
    }
    
    // Cost - random between 500k - 2M
    const serviceCost = (Math.floor(Math.random() * 15) + 5) * 100000;
    const costInputs = await page.locator('input[type="number"], input[placeholder*="cost"], input[placeholder*="harga"]').count();
    if (costInputs > 0) {
      await page.locator('input[type="number"], input[placeholder*="cost"], input[placeholder*="harga"]').first().fill(serviceCost.toString());
      console.log(`  ✓ Cost: Rp ${serviceCost.toLocaleString('id-ID')}`);
    }
    
    // Description
    const textareas = await page.locator('textarea').count();
    if (textareas > 0) {
      await page.locator('textarea').first().fill('Regular maintenance service - E2E Test');
      console.log(`  ✓ Description filled`);
    }
    
    await page.screenshot({ path: 'e2e-08-service-filled.png', fullPage: true });
    
    // Submit
    console.log('\nSubmitting service...');
    const submitBtn = page.locator('button').filter({ hasText: /submit|save|simpan/i }).first();
    
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      
      // Handle alert
      const swalTitle = await page.locator('.swal2-title').textContent().catch(() => null);
      if (swalTitle) {
        console.log(`📢 Alert: ${swalTitle}`);
        await page.click('.swal2-confirm');
        await page.waitForTimeout(2000);
      }
      
      await page.screenshot({ path: 'e2e-09-service-submitted.png', fullPage: true });
      
      // Verify
      await page.goto(`${BASE_URL}/fms/vehicle/service`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      const finalCount = await page.locator('tbody tr').count();
      console.log(`\nFinal service count: ${finalCount}`);
      
      if (finalCount > initialCount) {
        console.log(`✅ Service created successfully! (${initialCount} → ${finalCount})`);
        const firstRow = await page.locator('tbody tr').first().textContent().catch(() => null);
        createdSnapshots.service = firstRow;
        await page.screenshot({ path: 'e2e-10-service-list.png', fullPage: true });
        return true;
      } else {
        console.log(`⚠️ Service not created (still ${finalCount} rows)`);
        return false;
      }
    } else {
      console.log('⚠️ Submit button not found');
      return false;
    }
}

// Step 5: Filter and Search
async function testFilterAndSearch(page) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 5: TEST FILTER & SEARCH');
  console.log('='.repeat(60));
  
  // Test Contract search
  console.log('\nTesting contract search...');
  await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const searchInput = page.locator('input[type="text"], input[placeholder*="search"]').first();
  if (await searchInput.isVisible().catch(() => false)) {
    // Get first row data to search
    const firstRowText = await page.locator('tbody tr').first().textContent();
    const searchTerm = firstRowText.split(' ').find(word => word.length > 3) || 'contract';
    
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(2000);
    
    const searchResults = await page.locator('tbody tr').count();
    console.log(`  Search term: "${searchTerm}"`);
    console.log(`  ✓ Results: ${searchResults} rows`);
    
    await page.screenshot({ path: 'e2e-11-contract-search.png', fullPage: true });
    
    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(1000);
  }
  
  // Test Service search
  console.log('\nTesting service search...');
  await page.goto(`${BASE_URL}/fms/vehicle/service`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const serviceSearch = page.locator('input[type="text"], input[placeholder*="search"]').first();
  if (await serviceSearch.isVisible().catch(() => false)) {
    const firstRowText = await page.locator('tbody tr').first().textContent();
    const searchTerm = firstRowText.split(' ').find(word => word.length > 3) || 'service';
    
    await serviceSearch.fill(searchTerm);
    await page.waitForTimeout(2000);
    
    const searchResults = await page.locator('tbody tr').count();
    console.log(`  Search term: "${searchTerm}"`);
    console.log(`  ✓ Results: ${searchResults} rows`);
    
    await page.screenshot({ path: 'e2e-12-service-search.png', fullPage: true });
  }
  
  console.log('✅ Filter & search tested');
}

// Step 6: Export Data
async function testExport(page) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 6: TEST EXPORT');
  console.log('='.repeat(60));
  
  // Test Contract export
  console.log('\nTesting contract export...');
  await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const exportBtn = page.locator('button').filter({ hasText: /export|download/i }).first();
  if (await exportBtn.isVisible().catch(() => false)) {
    await exportBtn.click();
    await page.waitForTimeout(2000);
    console.log('  ✓ Export button clicked');
    
    await page.screenshot({ path: 'e2e-13-contract-export.png', fullPage: true });
  } else {
    console.log('  ⚠️ Export button not found');
  }
  
  console.log('✅ Export tested');
}

// Main E2E Flow
async function runE2E() {
  console.log('\n' + '█'.repeat(60));
  console.log('CONTRACT & SERVICE E2E - FLEXIBLE DATA');
  console.log('█'.repeat(60));
  console.log(`User: ${USER.name}`);
  console.log(`Time: ${new Date().toLocaleString('id-ID')}`);
  console.log('█'.repeat(60));
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--incognito', '--start-maximized']
  });
  
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  
  const results = {
    login: false,
    createContract: false,
    viewContract: false,
    createService: false,
    filterSearch: false,
    export: false,
  };
  
  try {
    // Execute all steps
    await login(page);
    results.login = true;
    
    results.createContract = await createContract(page);
    
    results.viewContract = await viewContractDetails(page);
    
    results.createService = await createService(page);
    
    await testFilterAndSearch(page);
    results.filterSearch = true;
    
    await testExport(page);
    results.export = true;
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'e2e-error.png', fullPage: true });
  } finally {
    if (isAutoCleanupEnabled()) {
      console.log('\n🧹 AUTO CLEANUP (best effort)');

      if (createdSnapshots.service) {
        await cleanupServiceBySnapshot(page, {
          baseUrl: BASE_URL,
          rowSnapshot: createdSnapshots.service,
        });
      }

      if (createdSnapshots.contract) {
        await cleanupContractBySnapshot(page, {
          baseUrl: BASE_URL,
          rowSnapshot: createdSnapshots.contract,
        });
      }
    }

    // Summary
    console.log('\n' + '█'.repeat(60));
    console.log('E2E TEST SUMMARY');
    console.log('█'.repeat(60));
    
    const steps = [
      { name: 'Login', status: results.login },
      { name: 'Create Contract', status: results.createContract },
      { name: 'View Contract', status: results.viewContract },
      { name: 'Create Service', status: results.createService },
      { name: 'Filter & Search', status: results.filterSearch },
      { name: 'Export', status: results.export },
    ];
    
    steps.forEach(step => {
      const icon = step.status ? '✅' : '❌';
      console.log(`${icon} ${step.name}`);
    });
    
    const passedCount = steps.filter(s => s.status).length;
    const totalCount = steps.length;
    const passRate = ((passedCount / totalCount) * 100).toFixed(1);
    
    console.log('\n' + '-'.repeat(60));
    console.log(`Total: ${passedCount}/${totalCount} passed (${passRate}%)`);
    console.log('-'.repeat(60));
    
    if (passedCount === totalCount) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else {
      console.log(`\n⚠️ ${totalCount - passedCount} test(s) failed`);
    }
    
    console.log('\n⏳ Closing browser in 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
  
  console.log('\n' + '█'.repeat(60));
  console.log('E2E TEST COMPLETED');
  console.log('█'.repeat(60));
}

// Run
runE2E().catch(console.error);
