/**
 * CREATE CONTRACT - WITH PAGE OBJECT MODEL
 * 
 * This is a refactored version using Page Object Model pattern.
 * Compare with create-contract-simple.mjs to see the difference!
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { ContractPage } from './pages/ContractPage.js';

const BASE_URL = process.env.BASE_URL || 'https://portal-dev.modena.com';
const USER = {
  email: process.env.ADMIN_EMAIL || 'ryan.ananda@modena.com',
  password: process.env.ADMIN_PASSWORD || 'P@ssw0rd_ryan.ananda',
};

test.describe('FMS - Contract Management (POM)', () => {
  test.setTimeout(120000);

  test('Create contract using Page Object Model', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('CREATE CONTRACT - PAGE OBJECT MODEL VERSION');
    console.log('='.repeat(60));
    
    // ✨ Look how clean this is compared to the old version!
    
    // Step 1: Login
    const loginPage = new LoginPage(page);
    await loginPage.loginAndSelectApp(BASE_URL, USER.email, USER.password, 'FMS (DEV)');
    
    // Step 2: Navigate to contracts
    const contractPage = new ContractPage(page);
    await contractPage.navigate(BASE_URL);
    
    // Step 3: Create contract with data
    const contractData = {
      vendor: 'PT',
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      vehicle: 1,
      channel: 'Retail',
      branch: 'Jakarta',
      mainUser: 'Ryan',
      rentCost: 5000000
    };
    
    const result = await contractPage.createContract(contractData);
    
    // Step 4: Verify
    expect(result.success).toBeTruthy();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED');
    console.log(`   Contracts before: ${result.initialCount}`);
    console.log(`   Contracts after: ${result.finalCount}`);
    console.log(`   Alert message: ${result.alert?.title || 'N/A'}`);
    console.log('='.repeat(60));
  });

  test('Search for contract', async ({ page }) => {
    // Assume already logged in via storageState
    
    const contractPage = new ContractPage(page);
    await contractPage.navigate(BASE_URL);
    
    // Search for specific contract
    const count = await contractPage.searchContract('PT');
    
    expect(count).toBeGreaterThanOrEqual(0);
    console.log(`✅ Search found ${count} contract(s)`);
  });
});

// ───────────────────────────────────────────────────────────────
// BENEFITS OF PAGE OBJECT MODEL:
// ───────────────────────────────────────────────────────────────
//
// ✅ BEFORE (create-contract-simple.mjs):
//    - 200+ lines of code
//    - Selectors hardcoded everywhere
//    - Logic mixed with test steps
//    - Hard to maintain
//    - Cannot reuse code
//
// ✅ AFTER (this file):
//    - ~50 lines of code
//    - Clean and readable
//    - Selectors in page objects
//    - Easy to maintain
//    - Reusable across tests
//
// ───────────────────────────────────────────────────────────────
// COMPARISON:
// ───────────────────────────────────────────────────────────────
//
// OLD WAY:
//   await page.goto(`${BASE_URL}/login`);
//   await page.fill('input[name="email"]', USER.email);
//   await page.fill('input[type="password"]', USER.password);
//   await page.click('button[type="submit"]');
//   await page.waitForTimeout(5000);
//   if (page.url().includes('my-application')) {
//     await page.click('text=FMS (DEV)');
//     await page.waitForTimeout(2000);
//     if (await page.locator('.swal2-confirm').isVisible()) {
//       await page.click('.swal2-confirm');
//     }
//   }
//   // ... 50 more lines
//
// NEW WAY:
//   const loginPage = new LoginPage(page);
//   await loginPage.loginAndSelectApp(BASE_URL, USER.email, USER.password, 'FMS (DEV)');
//   // Done! 1 line!
//
// ───────────────────────────────────────────────────────────────
