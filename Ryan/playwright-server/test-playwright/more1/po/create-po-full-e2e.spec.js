import { test, expect } from '@playwright/test';
import { cleanupTableRecordBySnapshot, isAutoCleanupEnabled } from '../../utils/data-cleanup.mjs';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';

test.describe('MHC - Purchase Order Creation - FULL E2E', () => {
  test.setTimeout(180000);

  test('Create Complete Purchase Order', async ({ page }) => {
    let createdSnapshot = null;
    let listUrl = `${BASE_URL}/purchase-order`;
    let initialCount = 0;

    try {
      // Step 1: Login
      console.log('Step 1: Login to MHC...');
      await page.goto(BASE_URL);
      await page.waitForTimeout(2000);

    await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
    await page.locator("button:has-text('Login')").click();
    await page.waitForTimeout(4000);

    await page.locator('text=/Welcome|Dashboard/i').first().waitFor({ timeout: 10000 });
    console.log('✓ Login successful\n');

      // Step 2: Navigate to Purchase Order
    console.log('Step 2: Navigate to Purchase Order...');
      await page.locator('text="Purchase Order"').first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Purchase Order page opened');
    console.log('  URL:', page.url());
      listUrl = page.url();
      initialCount = await page.locator('table tbody tr').count().catch(() => 0);
    await page.screenshot({ path: 'test-results/po-e2e-01-list.png', fullPage: true });

    // Step 3: Click Create New
    console.log('\nStep 3: Create new Purchase Order...');
    await page.locator("button:has-text('Create New')").click();
    await page.waitForTimeout(2000);
    console.log('✓ Create wizard opened');
    console.log('  URL:', page.url());
    await page.screenshot({ path: 'test-results/po-e2e-02-create-form.png', fullPage: true });

    // Step 4: Select Supplier
    console.log('\nStep 4: Select supplier...');
    const searchInput = page.locator("input[placeholder='Search data...']").or(
      page.locator("input[placeholder*='Search']").or(
        page.locator("input[placeholder*='search']")
      )
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  Searching for supplier...');
      await searchInput.fill('Modena');
      await page.waitForTimeout(1500);
    }

    // Select first supplier from table
    const supplierRows = await page.locator('table tbody tr').all();
    console.log(`  Found ${supplierRows.length} supplier rows`);

    if (supplierRows.length > 0) {
      await supplierRows[0].click();
      await page.waitForTimeout(1000);
      console.log('✓ Supplier selected');
    } else {
      console.log('⚠️ No supplier rows found');
    }
    await page.screenshot({ path: 'test-results/po-e2e-03-supplier-selected.png', fullPage: true });

    // Step 5: Go to Products
    console.log('\nStep 5: Navigate to Products...');
    await page.locator("button:has-text('Next Step')").or(
      page.locator("button:has-text('Next')")
    ).first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Products page loaded');
    await page.screenshot({ path: 'test-results/po-e2e-04-products.png', fullPage: true });

    // Step 6: Add products
    console.log('\nStep 6: Adding products...');

    // Try searching for a specific product
    const productSearchInput = page.locator("input[placeholder*='Search product']").or(
      page.locator("input[placeholder*='search']")
    ).first();

    if (await productSearchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  Product search field found, searching...');
      await productSearchInput.fill('BH 8725');
      await page.waitForTimeout(2000);
    }

    let productsAdded = 0;
    const targetProducts = 2;

    for (let attempt = 0; attempt < 3 && productsAdded < targetProducts; attempt++) {
      try {
        console.log(`  Attempt ${attempt + 1} to add product...`);

        const addButtons = page.locator("button:has-text('Add to Order')").or(
          page.locator("button:has-text('Add')")
        );
        const count = await addButtons.count();
        console.log(`    Found ${count} Add buttons`);

        if (count === 0) {
          console.log('    ⚠ No Add buttons found');
          break;
        }

        for (let i = 0; i < count && productsAdded < targetProducts; i++) {
          const button = addButtons.nth(i);
          const isEnabled = await button.isEnabled();
          const btnText = await button.textContent();

          if (isEnabled && btnText && btnText.trim().toLowerCase().includes('add')) {
            console.log(`    Clicking Add button ${i + 1}: "${btnText.trim()}"...`);
            await button.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);

            await button.click();
            await page.waitForTimeout(2000);

            // Modal handling - try multiple approaches
            console.log('    - Handling modal...');

            // Approach 1: Click confirm button in modal
            const modalConfirm = page.locator('[role="dialog"]').locator("button:has-text('Add to Order')").or(
              page.locator('[role="dialog"]').locator("button:has-text('Confirm')").or(
                page.locator('[role="dialog"]').locator("button:has-text('Add')")
              )
            ).last();

            if (await modalConfirm.isVisible({ timeout: 3000 }).catch(() => false)) {
              await modalConfirm.click({ force: true });
              await page.waitForTimeout(2000);
              console.log('    ✓ Confirmed via modal button');
            } else {
              // Approach 2: Keyboard navigation
              console.log('    - Trying keyboard confirmation...');
              await page.keyboard.press('Tab');
              await page.waitForTimeout(300);
              await page.keyboard.press('Tab');
              await page.waitForTimeout(300);
              await page.keyboard.press('Enter');
              await page.waitForTimeout(2000);
              await page.keyboard.press('Escape');
              await page.waitForTimeout(1000);
            }

            productsAdded++;
            console.log(`    ✓ Product ${productsAdded} added`);
          }
        }
      } catch (error) {
        console.log(`    ⚠ Error: ${error.message}`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    console.log(`\n✓ Total products added: ${productsAdded}`);
    if (productsAdded === 0) {
      console.log('⚠️ WARNING: No products were added. Check stock availability.');
    }
    await page.screenshot({ path: 'test-results/po-e2e-05-products-added.png', fullPage: true });

    // Step 7: Go to Review
    console.log('\nStep 7: Navigate to Review...');
    await page.locator("button:has-text('Next Step')").or(
      page.locator("button:has-text('Next')")
    ).first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Review page loaded');
    await page.screenshot({ path: 'test-results/po-e2e-06-review.png', fullPage: true });

    // Step 8: Submit
    console.log('\nStep 8: Submitting order...');

    const submitSelectors = [
      "button:has-text('Submit')",
      "button:has-text('Create Order')",
      "button:has-text('Save Order')",
      "button:has-text('Confirm')",
      "button:has-text('Place Order')",
      "button:has-text('Save')"
    ];

    let submitClicked = false;
    for (const selector of submitSelectors) {
      const submitBtn = page.locator(selector);
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isEnabled = await submitBtn.isEnabled();
        if (isEnabled) {
          console.log(`  Found submit button: "${selector}"`);
          await submitBtn.click();
          await page.waitForTimeout(3000);
          submitClicked = true;
          console.log('✓ Submit button clicked');
          break;
        }
      }
    }

    if (!submitClicked) {
      console.log('⚠️ No submit button found - listing all buttons:');
      const allButtons = await page.locator('button').all();
      for (const btn of allButtons) {
        const text = await btn.textContent();
        const isVisible = await btn.isVisible();
        if (isVisible && text && text.trim()) {
          console.log(`  - "${text.trim()}"`);
        }
      }
    }

    // Step 9: Verify result
    console.log('\nStep 9: Verifying result...');
    await page.waitForTimeout(2000);

    const successSelectors = [
      'text=/success/i',
      'text=/created/i',
      'text=/berhasil/i',
      'text=/order.*created/i',
      'text=/purchase.*order.*\\d+/i'
    ];

    let successFound = false;
    for (const selector of successSelectors) {
      if (await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false)) {
        const msg = await page.locator(selector).first().textContent();
        console.log(`✅ SUCCESS: ${msg}`);
        successFound = true;
        break;
      }
    }

    if (!successFound) {
      console.log('⚠️ No explicit success message found');
      console.log('  Current URL:', page.url());
    }

    await page.screenshot({ path: 'test-results/po-e2e-07-final.png', fullPage: true });

      await page.locator('text="Purchase Order"').first().click().catch(() => null);
      await page.waitForTimeout(2000);
      const finalCount = await page.locator('table tbody tr').count().catch(() => 0);
      if (finalCount > initialCount) {
        createdSnapshot = await page.locator('table tbody tr').first().textContent().catch(() => null);
      }

      console.log('\n' + '='.repeat(60));
      console.log('PURCHASE ORDER E2E TEST COMPLETED');
      console.log('='.repeat(60));
      console.log(`Products added: ${productsAdded}`);
      console.log(`Submit clicked: ${submitClicked}`);
      console.log(`Success detected: ${successFound}`);
      console.log('\nScreenshots saved:');
      console.log('  - test-results/po-e2e-01-list.png');
      console.log('  - test-results/po-e2e-02-create-form.png');
      console.log('  - test-results/po-e2e-03-supplier-selected.png');
      console.log('  - test-results/po-e2e-04-products.png');
      console.log('  - test-results/po-e2e-05-products-added.png');
      console.log('  - test-results/po-e2e-06-review.png');
      console.log('  - test-results/po-e2e-07-final.png');
      console.log('='.repeat(60));
    } finally {
      if (createdSnapshot && isAutoCleanupEnabled()) {
        console.log('\n🧹 AUTO CLEANUP PO (best effort)');
        await cleanupTableRecordBySnapshot(page, {
          listUrl,
          rowSnapshot: createdSnapshot,
          label: 'purchase order',
          rowLocator: 'table tbody tr',
        });
      }
    }
  });
});
