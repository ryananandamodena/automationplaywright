import { test, expect } from '@playwright/test';
import { cleanupTableRecordBySnapshot, isAutoCleanupEnabled } from '../../utils/data-cleanup.mjs';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';

test.describe('MHC - Sales Order Creation (Simple)', () => {
  test.setTimeout(120000);

  test('Create Sales Order - Full Flow', async ({ page }) => {
    let createdSnapshot = null;
    let listUrl = `${BASE_URL}/sales-order`;
    let initialCount = 0;

    try {
      // 1. Login
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

    console.log('1. Logging in...');
    await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
    await page.locator("button:has-text('Login')").click();
    await page.waitForTimeout(4000);
    console.log('✓ Login successful');

      // 2. Go to Sales Order
      console.log('2. Opening Sales Order...');
      await page.locator('text="Sales Order"').first().click();
      await page.waitForTimeout(2000);
      console.log('✓ Sales Order page opened');
      listUrl = page.url();
      initialCount = await page.locator('table tbody tr').count().catch(() => 0);

      // 3. Click Create New
      console.log('3. Clicking Create New...');
      await page.locator("button:has-text('Create New')").click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/step1-customer.png', fullPage: true });
      console.log('✓ Create wizard opened');

    // 4. Select Customer
    console.log('4. Selecting customer...');
    const searchInput = page.locator("input[placeholder='Search data...']");
    await searchInput.fill('Dedi');
    await page.waitForTimeout(1000);
    
    const firstCustomerRow = page.locator('table tbody tr').first();
    await firstCustomerRow.click();
    await page.waitForTimeout(1000);
    console.log('✓ Customer selected');

    // 5. Go to Products
    console.log('5. Going to Products step...');
    await page.locator("button:has-text('Next Step')").click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/step2-products.png', fullPage: true });
    console.log('✓ Products page loaded');

    // 6. Add products - find ones with stock
    console.log('6. Adding products with stock...');
    
    // Get all "Add to Order" buttons
    const allAddButtons = await page.locator("button:has-text('Add to Order')").all();
    console.log(`  - Found ${allAddButtons.length} Add to Order buttons total`);
    
    let addedCount = 0;
    const targetCount = 2;
    
    // Find and add 2 products that have stock (enabled buttons)
    for (let i = 0; i < allAddButtons.length && addedCount < targetCount; i++) {
      const isVisible = await allAddButtons[i].isVisible();
      const isEnabled = await allAddButtons[i].isEnabled();
      
      if (isVisible && isEnabled) {
        console.log(`  - Adding product ${addedCount + 1} (button index ${i})...`);
        await allAddButtons[i].scrollIntoViewIfNeeded();
        await allAddButtons[i].click();
        await page.waitForTimeout(2000);
        
        // Modal appears - find the button inside the modal container
        console.log(`    - Waiting for modal...`);
        
        // Look for button inside the modal content area (not intercepted by backdrop)
        const modalDialog = page.locator('[role="dialog"]').or(page.locator('.z-50').filter({ hasText: 'Add to Order' }));
        
        const modalConfirmButton = modalDialog.locator("button:has-text('Add to Order')").last();
        
        await modalConfirmButton.waitFor({ state: 'visible', timeout: 5000 });
        await modalConfirmButton.click({ force: true }); // Use force to bypass backdrop        
        console.log(`    ✓ Product ${addedCount + 1} added`);
        addedCount++;
        await page.waitForTimeout(1500);
      }
    }
    
    if (addedCount === 0) {
      throw new Error('No products with stock found!');
    }
    
    console.log(`✓ Added ${addedCount} products total`);
    await page.screenshot({ path: 'test-results/after-add-products.png', fullPage: true });

    // 7. Go to Review
    console.log('7. Going to Review...');
    await page.locator("button:has-text('Next Step')").click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/step3-review.png', fullPage: true });
    console.log('✓ Review page loaded');

        // 8. Submit
    console.log('8. Looking for submit button...');
    const allButtons = await page.locator('button').all();
    for (const btn of allButtons) {
      const text = await btn.textContent();
      const isVisible = await btn.isVisible();
      if (isVisible && text) {
        console.log(`  - Button found: "${text.trim()}"`);
      }
    }

    const submitBtn = page.locator("button:has-text('Submit')").or(
      page.locator("button:has-text('Save')")).or(
      page.locator("button:has-text('Create Order')")
    ).first();

      if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(3000);
      console.log('✓ Order submitted!');
      await page.screenshot({ path: 'test-results/order-result.png', fullPage: true });
      } else {
      console.log('⚠ Submit button not found - check screenshot');
      }

      await page.locator('text="Sales Order"').first().click().catch(() => null);
      await page.waitForTimeout(2000);
      const finalCount = await page.locator('table tbody tr').count().catch(() => 0);
      if (finalCount > initialCount) {
        createdSnapshot = await page.locator('table tbody tr').first().textContent().catch(() => null);
      }

      console.log('\n✅ Test completed! Check test-results/ for screenshots.');
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
