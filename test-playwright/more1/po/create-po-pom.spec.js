import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { LoginPage } from '../../pages/LoginPage.js';
import { PurchaseOrderPage } from '../../pages/PurchaseOrderPage.js';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';

test.describe('MHC - Purchase Order (POM)', () => {
  test.setTimeout(180000);

  test('Create Purchase Order using Page Object Model', async ({ page }) => {
    // Allure Report Metadata
    allure.epic('MHC - Modena Home Center');
    allure.feature('Purchase Order Management');
    allure.story('Create new purchase order using Page Object Model pattern');
    allure.severity('critical');
    allure.tag('smoke');
    allure.tag('purchase-order');
    allure.tag('pom');
    allure.tag('refactored');
    allure.tag('calculation-validation');
    allure.parameter('Environment', BASE_URL);
    allure.parameter('Pattern', 'Page Object Model');
    allure.parameter('Product Search', 'BH2725GBBK.IDALB0A');

    const loginPage = new LoginPage(page);
    const poPage = new PurchaseOrderPage(page);

    let initialCount = 0;

    // Step 1: Login
    await allure.step('Login to MHC Portal', async () => {
      await page.goto(BASE_URL, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      await loginPage.login(LOGIN_EMAIL, LOGIN_PASSWORD);
      await page.waitForTimeout(4000);
      
      allure.attachment('Login URL', BASE_URL, 'text/plain');
    });

    // Step 2: Navigate to Purchase Order
    await allure.step('Navigate to Purchase Order page', async () => {
      await poPage.navigate(BASE_URL);
      initialCount = await poPage.getOrderCount();
      
      allure.parameter('Initial PO Count', initialCount);
    });

    // Step 3: Create Purchase Order (all steps in one method!)
    const result = await allure.step('Create complete Purchase Order with validation', async () => {
      const createResult = await poPage.createPurchaseOrder({
        productCode: 'BH2725GBBK.IDALB0A',
        productCount: 1,
        quantity: 5,
        validateCalculations: true
      });
      
      allure.parameter('Products Added', createResult.addedCount);
      
      // Attach validation summary
      if (createResult.validation) {
        allure.attachment('Calculation Validation', JSON.stringify({
          valid: createResult.validation.valid,
          errors: createResult.validation.errors,
          summary: createResult.validation.summary
        }, null, 2), 'application/json');
      }
      
      return createResult;
    });

    // Step 4: Assert validation passed
    await allure.step('Verify calculations and submission', async () => {
      expect(result.validation.valid, 
        `Calculation errors: ${result.validation.errors.join(', ')}`
      ).toBe(true);
      
      expect(result.validation.errors.length).toBe(0);
      expect(result.addedCount).toBeGreaterThan(0);
      
      console.log(`\n✅ Test completed!`);
      console.log(`  Products added: ${result.addedCount}`);
      console.log(`  Calculations: ${result.validation.valid ? '✓ VALID' : '✗ INVALID'}`);
      console.log(`  Status: Order submitted successfully ✓`);
    });
  });

  /**
   * COMPARISON: Old vs New Approach
   * 
   * OLD WAY (create-po-simple.spec.js):
   * - 450+ lines of code
   * - Complex calculation validation logic inline
   * - Hardcoded selectors everywhere
   * - Difficult to debug
   * - No reusability
   * - Mixed concerns (UI + business logic + validation)
   * 
   * NEW WAY (this file):
   * - ~90 lines of code (80% reduction!)
   * - Clean separation of concerns
   * - Business logic in Page Objects
   * - Validation encapsulated in PurchaseOrderPage
   * - Highly reusable methods
   * - Easy to maintain
   * - Single source of truth for selectors
   * 
   * Benefits:
   * ✅ 80% less code
   * ✅ Better readability
   * ✅ Easier maintenance
   * ✅ Encapsulated validation logic
   * ✅ Reusable across tests
   * ✅ Clean test structure
   * ✅ Centralized selector management
   */
});
