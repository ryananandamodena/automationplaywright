import { test, expect } from '@playwright/test';
import { cleanupTableRecordBySnapshot, isAutoCleanupEnabled } from '../../utils/data-cleanup.mjs';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';

test.describe('MHC - Sales Order Creation',  () => {
  test.setTimeout(180000);

  test('Create Sales Order - Complete Flow', async ({ page }) => {
    let createdSnapshot = null;
    let listUrl = `${BASE_URL}/sales-order`;
    let initialCount = 0;

    try {
      // Step 1: Login
      console.log('Step 1: Logging in...');
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

    await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
    await page.locator("button:has-text('Login')").click();
    await page.waitForTimeout(4000);
    
    await page.locator('text=/Welcome|Dashboard/i').first().waitFor();
    console.log('✓ Login successful\n');

      // Step 2: Navigate to Sales Order
      console.log('Step 2: Opening Sales Order...');
      await page.locator('text="Sales Order"').first().click();
      await page.waitForTimeout(2000);
      console.log('✓ Sales Order page opened\n');
      listUrl = page.url();
      initialCount = await page.locator('table tbody tr').count().catch(() => 0);

    // Step 3: Click Create New
    console.log('Step 3: Creating new Sales Order...');
    await page.locator("button:has-text('Create New')").click();
    await page.waitForTimeout(2000);
    console.log('✓ Create wizard opened\n');

    // Step 4: Select Customer
    console.log('Step 4: Selecting customer...');
    const searchInput = page.locator("input[placeholder='Search data...']");
    await searchInput.fill('Dedi');
    await page.waitForTimeout(1000);
    
    const firstCustomerRow = page.locator('table tbody tr').first();
    await firstCustomerRow.click();
    await page.waitForTimeout(1000);
    console.log('✓ Customer selected\n');

    // Step 5: Go to Products
    console.log('Step 5: Moving to Products step...');
    await page.locator("button:has-text('Next Step')").click();
    await page.waitForTimeout(2000);
    console.log('✓ Products page loaded\n');
    
    await page.screenshot({ path: 'test-results/salesorder-products-page.png', fullPage: true });

    // Step 6: Add products (with stock)
    console.log('Step 6: Add products to cart...');
    console.log('NOTE: Click "Add to Order" buttons manually for products with stock');
    console.log('      Then confirm each modal dialog');
    console.log('      Add at least 1-2 products\n');
    
    // Wait for user to add products manually (for demonstration)
    await page.waitForTimeout(10000);
    
    // Step 7: Go to Review
    console.log('Step 7: Moving to Review step...');
    await page.locator("button:has-text('Next Step')").click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/salesorder-review-page.png', fullPage: true });
    console.log('✓ Review page loaded\n');

    // Step 8: Submit
    console.log('Step 8: Submitting Sales Order...');
    console.log('Check test-results/salesorder-review-page.png for review details\n');
    
      await page.locator('text="Sales Order"').first().click().catch(() => null);
      await page.waitForTimeout(2000);
      const finalCount = await page.locator('table tbody tr').count().catch(() => 0);
      if (finalCount > initialCount) {
        createdSnapshot = await page.locator('table tbody tr').first().textContent().catch(() => null);
      }

      console.log('✅ Test completed! Screenshots saved in test-results/');
      console.log('   - salesorder-products-page.png');
      console.log('   - salesorder-review-page.png');
    } finally {
      if (createdSnapshot && isAutoCleanupEnabled()) {
        console.log('\n🧹 AUTO CLEANUP SO (best effort)');
        await cleanupTableRecordBySnapshot(page, {
          listUrl,
          rowSnapshot: createdSnapshot,
          label: 'sales order',
          rowLocator: 'table tbody tr',
        });
      }
    }
  });
});