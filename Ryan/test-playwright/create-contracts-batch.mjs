/**
 * CREATE CONTRACTS - BATCH VERSION
 * 
 * Create multiple vehicle contracts with different data
 * Uses working selectors and proper react-select handling
 */

import { chromium } from 'playwright';
import { cleanupContractBySnapshot, isAutoCleanupEnabled } from './utils/data-cleanup.mjs';

const BASE_URL = 'https://portal-dev.modena.com';
const USER = {
  email: 'ryan.ananda@modena.com',
  password: 'P@ssw0rd_ryan.ananda',
};

// Contract data templates
const contracts = [
  {
    vendor: 'PT',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    vehicleIndex: 1,
    channel: 'Retail',
    branch: 'Jakarta',
    mainUser: 'Ryan',
    rentCost: '5000000',
  },
  {
    vendor: 'PT',
    startDate: '2026-05-01',
    endDate: '2027-04-30',
    vehicleIndex: 2,
    channel: 'Retail',
    branch: 'Bandung',
    mainUser: 'Ryan',
    rentCost: '4500000',
  },
  {
    vendor: 'PT',
    startDate: '2026-06-01',
    endDate: '2027-05-31',
    vehicleIndex: 1,
    channel: 'Retail',
    branch: 'Surabaya',
    mainUser: 'Ryan',
    rentCost: '4800000',
  },
];

async function fillReactSelect(page, containerIndex, searchText) {
  await page.locator('div.css-b62m3t-container').nth(containerIndex).click();
  await page.waitForTimeout(1000);
  await page.keyboard.type(searchText);
  await page.waitForTimeout(2000);
  
  const opts = await page.locator('div[id*="react-select"][id*="option"]').count();
  if (opts > 0) {
    await page.locator('div[id*="react-select"][id*="option"]').first().click();
    return true;
  }
  return false;
}

async function createSingleContract(page, contractData, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`CONTRACT ${index + 1}/${contracts.length}`);
  console.log(`${'='.repeat(60)}`);
  
  try {
    // Open form
    await page.click('button:has-text("Add Contract")');
    await page.waitForTimeout(3000);
    console.log('✓ Form opened');
    
    // Fill Vendor
    console.log('Filling Vendor...');
    if (await fillReactSelect(page, 0, contractData.vendor)) {
      console.log('  ✓ Vendor selected');
    } else {
      console.log('  ⚠️ No vendor options');
    }
    await page.waitForTimeout(500);
    
    // Fill Dates
    console.log('Filling Dates...');
    await page.locator('input[type="date"]').first().fill(contractData.startDate);
    await page.locator('input[type="date"]').nth(1).fill(contractData.endDate);
    console.log(`  ✓ ${contractData.startDate} to ${contractData.endDate}`);
    
    // Select Vehicle
    console.log('Selecting Vehicle...');
    await page.locator('select').first().selectOption({ index: contractData.vehicleIndex });
    console.log(`  ✓ Vehicle index ${contractData.vehicleIndex}`);
    await page.waitForTimeout(500);
    
    // Fill Channel
    console.log('Filling Channel...');
    if (await fillReactSelect(page, 1, contractData.channel)) {
      console.log(`  ✓ ${contractData.channel}`);
    }
    await page.waitForTimeout(500);
    
    // Fill Branch
    console.log('Filling Branch...');
    if (await fillReactSelect(page, 2, contractData.branch)) {
      console.log(`  ✓ ${contractData.branch}`);
    }
    await page.waitForTimeout(500);
    
    // Fill Main User
    console.log('Filling Main User...');
    if (await fillReactSelect(page, 3, contractData.mainUser)) {
      console.log(`  ✓ ${contractData.mainUser}`);
    }
    await page.waitForTimeout(500);
    
    // Fill Rent Cost
    console.log('Filling Rent Cost...');
    const rentInput = page.locator('input[placeholder="0"]');
    await rentInput.click();
    await rentInput.fill(contractData.rentCost);
    console.log(`  ✓ Rp ${contractData.rentCost}`);
    
    // Screenshot before submit
    await page.screenshot({ path: `contract-batch-${index + 1}-filled.png`, fullPage: true });
    
    // Submit
    console.log('\nSubmitting...');
    await page.click('button:has-text("Save Contract")');
    await page.waitForTimeout(3000);
    
    // Check for alerts
    const swalTitle = await page.locator('.swal2-title').textContent().catch(() => null);
    if (swalTitle) {
      console.log(`📢 ${swalTitle}`);
      await page.click('.swal2-confirm');
      await page.waitForTimeout(2000);
    }
    
    // Navigate back to list
    await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    
    const rowSnapshot = await page.locator('tbody tr').first().textContent().catch(() => null);
    console.log('✅ Contract created');
    return { success: true, rowSnapshot };
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    await page.screenshot({ path: `contract-batch-${index + 1}-error.png`, fullPage: true });
    return { success: false, rowSnapshot: null };
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('CREATE CONTRACTS - BATCH VERSION');
  console.log(`Total contracts to create: ${contracts.length}`);
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });
  
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  const createdSnapshots = [];
  
  try {
    // Login
    console.log('\n📍 LOGIN');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="email"]', USER.email);
    await page.fill('input[type="password"]', USER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    
    // Navigate to FMS
    if (page.url().includes('my-application')) {
      await page.click('text=FMS (DEV)');
      await page.waitForTimeout(2000);
      
      if (await page.locator('.swal2-confirm').isVisible().catch(() => false)) {
        await page.click('.swal2-confirm');
        await page.waitForTimeout(3000);
      }
    }
    console.log('✓ Logged in as', USER.email);
    
    // Go to contract page
    console.log('\n📍 NAVIGATE TO CONTRACT PAGE');
    await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial contract count: ${initialCount}`);
    
    // Create contracts
    let successCount = 0;
    for (let i = 0; i < contracts.length; i++) {
      const createResult = await createSingleContract(page, contracts[i], i);
      if (createResult.success) {
        successCount++;
      }
      if (createResult.rowSnapshot) {
        createdSnapshots.push(createResult.rowSnapshot);
      }
      
      // Small delay between contracts
      if (i < contracts.length - 1) {
        await page.waitForTimeout(2000);
      }
    }
    
    // Final verification
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION');
    console.log('='.repeat(60));
    
    await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    
    const finalCount = await page.locator('tbody tr').count();
    console.log(`Initial count: ${initialCount}`);
    console.log(`Final count: ${finalCount}`);
    console.log(`New contracts: ${finalCount - initialCount}`);
    console.log(`Success rate: ${successCount}/${contracts.length}`);
    
    await page.screenshot({ path: 'contract-batch-final.png', fullPage: true });
    
    if (finalCount > initialCount) {
      console.log('\n✅ BATCH CREATION SUCCESSFUL!');
    } else {
      console.log('\n⚠️ No new contracts created');
    }
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    await page.screenshot({ path: 'contract-batch-fatal-error.png', fullPage: true });
  } finally {
    if (isAutoCleanupEnabled() && createdSnapshots.length > 0) {
      console.log(`\n🧹 AUTO CLEANUP (best effort): ${createdSnapshots.length} contract(s)`);

      for (const rowSnapshot of createdSnapshots.reverse()) {
        await cleanupContractBySnapshot(page, {
          baseUrl: BASE_URL,
          rowSnapshot,
        });
      }
    }

    console.log('\n⏳ Closing in 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('BATCH PROCESS COMPLETED');
  console.log('='.repeat(60));
}

main().catch(console.error);
