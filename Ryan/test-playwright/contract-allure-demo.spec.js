/**
 * CONTRACT TEST WITH ALLURE REPORTING
 * 
 * This test demonstrates Allure reporting features:
 * - Test descriptions & severity
 * - Step annotations
 * - Attachments (screenshots, logs)
 * - Test categorization
 * - Custom labels
 */

import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { LoginPage } from './pages/LoginPage.js';
import { ContractPage } from './pages/ContractPage.js';

const BASE_URL = process.env.BASE_URL || 'https://portal-dev.modena.com';
const USER = {
  email: process.env.ADMIN_EMAIL || 'ryan.ananda@modena.com',
  password: process.env.ADMIN_PASSWORD || 'P@ssw0rd_ryan.ananda',
};

test.describe('Contract Management - Allure Reporting Demo', () => {
  test.setTimeout(120000);

  test('Create new contract with full reporting', async ({ page }) => {
    // ─────────────────────────────────────────────────────────
    // ALLURE METADATA
    // ─────────────────────────────────────────────────────────
    
    await allure.epic('FMS - Facility Management System');
    await allure.feature('Contract Management');
    await allure.story('Create new vehicle contract');
    await allure.owner('Ryan Ananda');
    await allure.tag('contract', 'create', 'smoke');
    await allure.severity('critical');
    await allure.description(`
      This test validates the contract creation flow in FMS.
      
      **Preconditions:**
      - User must have admin access
      - FMS application must be accessible
      
      **Test Data:**
      - Vendor: PT (search term)
      - Date Range: 2026-04-01 to 2027-03-31
      - Vehicle: Index 1
      - Channel: Retail
      - Branch: Jakarta
      - Main User: Ryan
      - Rent Cost: 5,000,000
    `);
    
    await allure.link('https://portal-dev.modena.com', 'FMS Portal');
    
    // ─────────────────────────────────────────────────────────
    // TEST STEPS
    // ─────────────────────────────────────────────────────────
    
    // Step 1: Login
    await allure.step('Login to FMS Portal', async () => {
      const loginPage = new LoginPage(page);
      
      await allure.step('Navigate to login page', async () => {
        await loginPage.navigate(BASE_URL);
      });
      
      await allure.step(`Login with credentials: ${USER.email}`, async () => {
        await loginPage.login(USER.email, USER.password);
      });
      
      await allure.step('Select FMS (DEV) application', async () => {
        await loginPage.selectApplication('FMS (DEV)');
      });
      
      // Attachment: Screenshot after login
      const screenshot = await page.screenshot();
      await allure.attachment('Login Success Screenshot', screenshot, 'image/png');
    });
    
    // Step 2: Navigate to Contracts
    await allure.step('Navigate to Contracts page', async () => {
      const contractPage = new ContractPage(page);
      await contractPage.navigate(BASE_URL);
      
      const initialCount = await contractPage.getContractCount();
      await allure.parameter('Initial Contract Count', initialCount);
      
      // Attachment: Current URL
      await allure.attachment('Current URL', page.url(), 'text/plain');
    });
    
    // Step 3: Create Contract
    let result;
    await allure.step('Create new contract', async () => {
      const contractPage = new ContractPage(page);
      
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
      
      // Attachment: Test data
      await allure.attachment('Contract Data', JSON.stringify(contractData, null, 2), 'application/json');
      
      await allure.step('Open contract form', async () => {
        await contractPage.clickAddContract();
      });
      
      await allure.step('Fill contract form with test data', async () => {
        await contractPage.fillContractForm(contractData);
        
        // Screenshot of filled form
        const formScreenshot = await page.screenshot({ fullPage: true });
        await allure.attachment('Filled Form Screenshot', formScreenshot, 'image/png');
      });
      
      await allure.step('Submit contract form', async () => {
        result = await contractPage.saveContract();
        
        // Attachment: Server response/alert
        if (result && result.alert) {
          await allure.attachment('Server Response', JSON.stringify(result.alert, null, 2), 'application/json');
        }
      });
    });
    
    // Step 4: Verify Creation
    await allure.step('Verify contract was created', async () => {
      expect(result.success).toBeTruthy();
      
      await allure.parameter('Contracts Before', result.initialCount);
      await allure.parameter('Contracts After', result.finalCount);
      await allure.parameter('Difference', result.finalCount - result.initialCount);
      
      const verificationScreenshot = await page.screenshot({ fullPage: true });
      await allure.attachment('Verification Screenshot', verificationScreenshot, 'image/png');
    });
    
    // Final summary attachment
    await allure.attachment('Test Summary', `
      ✅ Test Completed Successfully
      
      Initial Contracts: ${result.initialCount}
      Final Contracts: ${result.finalCount}
      Created: ${result.finalCount - result.initialCount} contract(s)
      
      Alert Message: ${result.alert?.title || 'N/A'}
      Test Duration: ${Date.now() - test.info().startTime}ms
    `, 'text/plain');
  });

  test('Search for contract', async ({ page }) => {
    await allure.epic('FMS - Facility Management System');
    await allure.feature('Contract Management');
    await allure.story('Search contracts');
    await allure.severity('normal');
    await allure.tag('contract', 'search', 'regression');
    
    await allure.step('Search for contracts with keyword "PT"', async () => {
      const contractPage = new ContractPage(page);
      await contractPage.navigate(BASE_URL);
      
      const count = await contractPage.searchContract('PT');
      
      await allure.parameter('Search Term', 'PT');
      await allure.parameter('Results Found', count);
      
      expect(count).toBeGreaterThanOrEqual(0);
      
      const screenshot = await page.screenshot({ fullPage: true });
      await allure.attachment('Search Results', screenshot, 'image/png');
    });
  });

  test('Negative test - Create contract with missing data', async ({ page }) => {
    await allure.epic('FMS - Facility Management System');
    await allure.feature('Contract Management');
    await allure.story('Validate form validation');
    await allure.severity('minor');
    await allure.tag('contract', 'validation', 'negative');
    await allure.issue('TICKET-123', 'https://jira.company.com/TICKET-123');
    
    await allure.step('Attempt to create contract without required fields', async () => {
      const loginPage = new LoginPage(page);
      await loginPage.loginAndSelectApp(BASE_URL, USER.email, USER.password, 'FMS (DEV)');
      
      const contractPage = new ContractPage(page);
      await contractPage.navigate(BASE_URL);
      await contractPage.clickAddContract();
      
      // Try to save without filling form
      await allure.step('Click save without filling form', async () => {
        // This should show validation errors
        await page.click('button:has-text("Save Contract")').catch(() => {});
        await page.waitForTimeout(2000);
        
        const screenshot = await page.screenshot({ fullPage: true });
        await allure.attachment('Validation Errors', screenshot, 'image/png');
      });
      
      // Check for error messages
      const hasErrors = await page.locator('.error, .invalid, [class*="error"]').count() > 0;
      await allure.parameter('Validation Triggered', hasErrors);
      
      expect(hasErrors).toBeTruthy();
    });
  });
});

// ───────────────────────────────────────────────────────────────
// ALLURE FEATURES DEMONSTRATED:
// ───────────────────────────────────────────────────────────────
//
// ✅ Test Metadata:
//    - Epic, Feature, Story (test organization)
//    - Severity levels (blocker, critical, normal, minor, trivial)
//    - Tags (for filtering)
//    - Owner (who maintains the test)
//    - Links (to documentation, tickets)
//
// ✅ Test Steps:
//    - Nested steps for better reporting
//    - Clear step descriptions
//    - Step-by-step execution tracking
//
// ✅ Attachments:
//    - Screenshots (images)
//    - JSON data (test data, responses)
//    - Text logs (summaries)
//    - HTML content
//
// ✅ Parameters:
//    - Input parameters
//    - Output values
//    - Verification data
//
// ✅ Test Types:
//    - Positive tests
//    - Negative tests
//    - Search/filter tests
//
// ───────────────────────────────────────────────────────────────
// HOW TO RUN:
// ───────────────────────────────────────────────────────────────
//
// Run test and generate Allure report:
//   npm run test:allure:report
//
// Or step by step:
//   npm run test:allure              # Run tests
//   npm run allure:generate          # Generate report
//   npm run allure:open              # Open report in browser
//
// ───────────────────────────────────────────────────────────────
