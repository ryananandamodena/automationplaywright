/**
 * CREATE CONTRACT - SIMPLE VERSION
 * 
 * Just select first available option from all dropdowns
 */

import { chromium } from 'playwright';
import { cleanupContractBySnapshot, isAutoCleanupEnabled } from './utils/data-cleanup.mjs';

// Load environment variables
const BASE_URL = process.env.BASE_URL || 'https://portal-dev.modena.com';
const USER = {
  email: process.env.ADMIN_EMAIL || 'ryan.ananda@modena.com',
  password: process.env.ADMIN_PASSWORD || 'P@ssw0rd_ryan.ananda',
};
const HEADLESS = process.env.HEADLESS === 'true';

async function createContract() {
  console.log('\n' + '='.repeat(60));
  console.log('CREATE CONTRACT - SIMPLE VERSION');
  console.log('='.repeat(60));
  console.log(`Environment: ${HEADLESS ? 'HEADLESS' : 'HEADED'}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User: ${USER.email}`);
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: HEADLESS ? ['--no-sandbox', '--disable-setuid-sandbox'] : ['--start-maximized']
  });
  
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  let createdContractSnapshot = null;
  
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
    console.log('✓ Logged in');
    
    // Go to contract page
    console.log('\n📍 NAVIGATE TO CONTRACT');
    await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial contracts: ${initialCount}`);
    
    // Open form
    console.log('\n📍 OPEN FORM');
    // Multiple selector strategies for resilience
    const addButton = page.locator('button:has-text("Add Contract")').or(
      page.locator('button:has-text("Add")'),
      page.locator('button[class*="add"]'),
      page.locator('button >> text=/add/i')
    );
    await addButton.waitFor({ state: 'visible', timeout: 10000 });
    await addButton.click();
    await page.waitForTimeout(3000);
    console.log('✓ Form opened');
    
    // Fill form - select first option from everything
    console.log('\n📍 FILL FORM');
    
    // Vendor - click container, wait for options, click first
    console.log('Vendor...');
    await page.locator('div.css-b62m3t-container').first().click();
    await page.waitForTimeout(1000);
    await page.keyboard.type('PT');
    await page.waitForTimeout(2000);
    
    const vendorOpts = await page.locator('div[id*="react-select"][id*="option"]').count();
    console.log(`  ${vendorOpts} options found`);
    if (vendorOpts > 0) {
      await page.locator('div[id*="react-select"][id*="option"]').first().click();
      console.log('  ✓ Selected');
    }
    await page.waitForTimeout(500);
    
    // Dates
    console.log('Dates...');
    await page.locator('input[type="date"]').first().fill('2026-04-01');
    await page.locator('input[type="date"]').nth(1).fill('2027-03-31');
    console.log('  ✓ Filled');
    
    // Vehicle
    console.log('Vehicle...');
    await page.locator('select').first().selectOption({ index: 1 });
    console.log('  ✓ Selected');
    await page.waitForTimeout(500);
    
    // Channel
    console.log('Channel...');
    await page.locator('div.css-b62m3t-container').nth(1).click();
    await page.waitForTimeout(1000);
    await page.keyboard.type('Retail');
    await page.waitForTimeout(2000);
    
    const channelOpts = await page.locator('div[id*="react-select"][id*="option"]').count();
    console.log(`  ${channelOpts} options found`);
    if (channelOpts > 0) {
      await page.locator('div[id*="react-select"][id*="option"]').first().click();
      console.log('  ✓ Selected');
    }
    await page.waitForTimeout(500);
    
    // Branch
    console.log('Branch...');
    await page.locator('div.css-b62m3t-container').nth(2).click();
    await page.waitForTimeout(1000);
    await page.keyboard.type('Jakarta');
    await page.waitForTimeout(2000);
    
    const branchOpts = await page.locator('div[id*="react-select"][id*="option"]').count();
    console.log(`  ${branchOpts} options found`);
    if (branchOpts > 0) {
      await page.locator('div[id*="react-select"][id*="option"]').first().click();
      console.log('  ✓ Selected');
    }
    await page.waitForTimeout(500);
    
    // Main User
    console.log('Main User...');
    await page.locator('div.css-b62m3t-container').nth(3).click();
    await page.waitForTimeout(1000);
    await page.keyboard.type('Ryan');
    await page.waitForTimeout(2000);
    
    const userOpts = await page.locator('div[id*="react-select"][id*="option"]').count();
    console.log(`  ${userOpts} options found`);
    if (userOpts > 0) {
      await page.locator('div[id*="react-select"][id*="option"]').first().click();
      console.log('  ✓ Selected');
    }
    await page.waitForTimeout(500);
    
    // Rent Cost
    console.log('Rent Cost...');
    const rentInput = page.locator('input[placeholder="0"]');
    await rentInput.click();
    await rentInput.fill('5000000');
    console.log('  ✓ Filled');
    
    await page.screenshot({ path: 'contract-simple-filled.png', fullPage: true });
    console.log('\n📸 Screenshot saved');
    
    // Submit
    console.log('\n📍 SUBMIT');
    const saveButton = page.locator('button:has-text("Save Contract")').or(
      page.locator('button:has-text("Save")'),
      page.locator('button[type="submit"]'),
      page.locator('button >> text=/save/i')
    );
    await saveButton.waitFor({ state: 'visible', timeout: 5000 });
    await saveButton.click();
    console.log('Clicked Save Contract button');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'contract-simple-after-submit.png', fullPage: true });
    
    // Check for alerts or messages
    const swalTitle = await page.locator('.swal2-title').textContent().catch(() => null);
    if (swalTitle) {
      console.log(`📢 Alert Title: ${swalTitle}`);
      const swalText = await page.locator('.swal2-html-container').textContent().catch(() => '');
      if (swalText) console.log(`   Message: ${swalText}`);
      
      await page.click('.swal2-confirm');
      await page.waitForTimeout(2000);
    } else {
      console.log('No SweetAlert found');
    }
    
    // Check for toast/notification
    const toast = await page.locator('[class*="toast"], [class*="notification"], [class*="alert"]').first().textContent().catch(() => null);
    if (toast) {
      console.log(`📢 Notification: ${toast}`);
    }
    
    // Check for validation errors
    const errors = await page.locator('text=/required|wajib|error|gagal/i').allTextContents().catch(() => []);
    if (errors.length > 0) {
      console.log(`⚠️ Validation errors found:`);
      errors.forEach(err => console.log(`   - ${err}`));
    }
    
    // Verify
    console.log('\n📍 VERIFY');
    await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load' });
    await page.waitForTimeout(3000);
    
    const finalCount = await page.locator('tbody tr').count();
    console.log(`Final contracts: ${finalCount}`);
    
    if (finalCount > initialCount) {
      console.log(`✅ SUCCESS! (${initialCount} → ${finalCount})`);
      createdContractSnapshot = await page.locator('tbody tr').first().textContent().catch(() => null);
    } else {
      console.log(`⚠️ No new contract`);
    }
    
    await page.screenshot({ path: 'contract-simple-final.png', fullPage: true });
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'contract-simple-error.png', fullPage: true });
  } finally {
    if (createdContractSnapshot && isAutoCleanupEnabled()) {
      console.log('\n🧹 AUTO CLEANUP (best effort)');
      await cleanupContractBySnapshot(page, {
        baseUrl: BASE_URL,
        rowSnapshot: createdContractSnapshot,
      });
    }

    console.log('\n⏳ Waiting 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('DONE');
  console.log('='.repeat(60));
}

createContract().catch(console.error);
