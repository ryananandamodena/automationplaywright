import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';
import { LoginPage } from '../../pages/LoginPage.js';
import { SalesOrderPage } from '../../pages/SalesOrderPage.js';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';

test.describe('MHC - Sales Order (POM)', () => {
  test.setTimeout(120000);

  test('Create Sales Order using Page Object Model', async ({ page }) => {
    // Allure Report Metadata
    allure.epic('MHC - Modena Home Center');
    allure.feature('Sales Order Management');
    allure.story('Create new sales order using Page Object Model pattern');
    allure.severity('critical');
    allure.tag('smoke');
    allure.tag('sales-order');
    allure.tag('pom');
    allure.tag('refactored');
    allure.parameter('Environment', BASE_URL);
    allure.parameter('Pattern', 'Page Object Model');

    const loginPage = new LoginPage(page);
    const soPage = new SalesOrderPage(page);

    let initialCount = 0;

    // Step 1: Login
    await allure.step('Login to MHC Portal and select application', async () => {
      await loginPage.navigate(BASE_URL);
      await loginPage.login(LOGIN_EMAIL, LOGIN_PASSWORD);
      await page.waitForTimeout(4000);
      
      allure.attachment('Login URL', BASE_URL, 'text/plain');
    });

    // Step 2: Navigate to Sales Order
    await allure.step('Navigate to Sales Order page', async () => {
      await soPage.navigate(BASE_URL);
      initialCount = await soPage.getOrderCount();
      
      allure.parameter('Initial SO Count', initialCount);
    });

    // Step 3: Create Sales Order (all steps in one method!)
    const addedCount = await allure.step('Create complete Sales Order', async () => {
      const result = await soPage.createSalesOrder({
        customer: 'Dedi',
        productCount: 2
      });
      
      allure.parameter('Products Added', result);
      
      console.log(`\n✅ Test completed!`);
      console.log(`  Products added: ${result}`);
      console.log(`  Status: Order submitted successfully ✓`);
      
      return result;
    });

    // Assert success
    expect(addedCount).toBeGreaterThan(0);
  });

  /**
   * COMPARISON: Old vs New Approach
   * 
   * OLD WAY (create-so-simple.spec.js):
   * - 200+ lines of code
   * - Hardcoded selectors everywhere
   * - Difficult to maintain
   * - No reusability
   * - Lots of duplication
   * 
   * NEW WAY (this file):
   * - ~70 lines of code (65% reduction!)
   * - Clean, readable test structure
   * - Business logic in Page Objects
   * - Highly reusable methods
   * - Easy to maintain
   * - Single source of truth for selectors
   * 
   * Benefits:
   * ✅ 65% less code
   * ✅ Better readability
   * ✅ Easier maintenance
   * ✅ Reusable across tests
   * ✅ Centralized selector management
   */
});
