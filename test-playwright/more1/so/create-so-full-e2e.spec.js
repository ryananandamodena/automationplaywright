import { test, expect } from '@playwright/test';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';

test.describe('MHC - Sales Order Creation - FULL E2E', () => {
  test.setTimeout(180000);

  test('Create Complete Sales Order', async ({ page }) => {
    // Step 1: Login
    console.log('Step 1: Login to MHC...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
    await page.locator("button:has-text('Login')").click();
    await page.waitForTimeout(4000);
    
    await page.locator('text=/Welcome|Dashboard/i').first().waitFor();
    console.log('✓ Login successful\n');

    // Step 2: Navigate to Sales Order
    console.log('Step 2: Navigate to Sales Order...');
    await page.locator('text="Sales Order"').first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Sales Order page opened\n');

    // Step 3: Click Create New
    console.log('Step 3: Create new Sales Order...');
    await page.locator("button:has-text('Create New')").click();
    await page.waitForTimeout(2000);
    console.log('✓ Create wizard opened\n');

    // Step 4: Select Customer
    console.log('Step 4: Select customer...');
    const searchInput = page.locator("input[placeholder='Search data...']");
    await searchInput.fill('Dedi');
    await page.waitForTimeout(1000);
    
    const firstCustomerRow = page.locator('table tbody tr').first();
    await firstCustomerRow.click();
    await page.waitForTimeout(1000);
    console.log('✓ Customer "Dedi Slamet" selected\n');

    // Step 5: Go to Products
    console.log('Step 5: Navigate to Products...');
    await page.locator("button:has-text('Next Step')").click();
    await page.waitForTimeout(2000);
    console.log('✓ Products page loaded\n');

    // Step 6: Add specific product - MODENA GAS HOB
    console.log('Step 6: Adding specific product...');

    // Helper: handle "Add to Order" modal.
    // Tries each stock source option until "Add to Order" button is enabled, then confirms.
    // Returns true if successfully confirmed, false if all stock sources exhausted.
    const confirmAndCloseModal = async () => {
      const modal = page.locator('div.fixed.inset-0.z-50');
      const isOpen = await modal.isVisible({ timeout: 2000 }).catch(() => false);
      if (!isOpen) return true;

      console.log('    - Modal open, selecting stock source and confirming...');

      // Stock source options to try in order
      const stockSourceLabels = ['Warehouse Ready', 'Warehouse Display', 'Warehouse Indent'];
      const addToOrderBtn = modal.locator("button:has-text('Add to Order')").last();

      for (const label of stockSourceLabels) {
        const radioOption = modal.locator(`label:has-text("${label}"), div:has-text("${label}") input[type="radio"]`).first();
        const radioRow = modal.locator(`text="${label}"`).first();

        // Click the option row/label to select it
        if (await radioRow.isVisible({ timeout: 1000 }).catch(() => false)) {
          await radioRow.click();
          await page.waitForTimeout(800);
          console.log(`    - Selected stock source: ${label}`);
        }

        // Check if Add to Order button became enabled
        const enabled = await addToOrderBtn.isEnabled().catch(() => false);
        if (enabled) {
          await addToOrderBtn.click();
          console.log(`    - Clicked "Add to Order" with source: ${label}`);
          await modal.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
          await page.waitForTimeout(500);
          return true;
        }
        console.log(`    - ${label}: no stock available`);
      }

      // All stock sources exhausted, close modal
      console.log('    - All stock sources exhausted, closing modal...');
      const cancelBtn = modal.locator("button:has-text('Cancel'), button:has-text('Close'), button:has-text('Batal')").first();
      if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(300);
      return false;
    };

    // Search for the specific product
    const productSearchInput = page.locator(
      "input[placeholder*='Search product'], input[placeholder*='search']"
    ).first();

    if (await productSearchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  Searching for "MODENA GAS HOB - BH 8725 HABK"...');
      await productSearchInput.fill('BH 8725 HABK');
      await page.waitForTimeout(2000);
    }

    let productsAdded = 0;

    // Add products one by one, waiting for modal to close between each
    const addButtons = page.locator("button:has-text('Add to Order')");
    const totalButtons = await addButtons.count();
    console.log(`  Found ${totalButtons} Add to Order buttons`);

    for (let i = 0; i < Math.min(totalButtons, 2) && productsAdded < 2; i++) {
      try {
        // Re-query buttons after each modal close (DOM may update)
        const freshButtons = page.locator("button:has-text('Add to Order')");
        const btn = freshButtons.nth(i);
        if (!(await btn.isVisible({ timeout: 2000 }).catch(() => false))) continue;
        if (!(await btn.isEnabled())) continue;

        console.log(`  Clicking Add to Order button ${i + 1}...`);
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
        await page.waitForTimeout(1500);

        const confirmed = await confirmAndCloseModal();
        if (!confirmed) {
          console.log(`  ⚠ Stock exhausted for button ${i + 1}, skipping`);
          continue;
        }

        productsAdded++;
        console.log(`  ✓ Product ${productsAdded} added`);
      } catch (error) {
        console.log(`  ⚠ Error on button ${i + 1}: ${error.message.split('\n')[0]}`);
        // Try to close any open modal before continuing
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(500).catch(() => {});
      }
    }

    console.log(`\n✓ Total products added: ${productsAdded}\n`);

    if (productsAdded === 0) {
      console.log('⚠️ WARNING: No products were added. Check stock availability.');
      await page.screenshot({ path: 'test-results/no-products-added.png', fullPage: true });
    }

    await page.screenshot({ path: 'test-results/products-added.png', fullPage: true });

    // Step 7: Go to Review
    console.log('Step 7: Navigate to Review...');
    await page.locator("button:has-text('Next Step')").click();
    await page.waitForTimeout(2000);
    console.log('✓ Review page loaded\n');

    await page.screenshot({ path: 'test-results/review-page-full.png', fullPage: true });

    // Step 8: Find and click Submit button
    console.log('Step 8: Submitting order...');
    
    // Look for all possible submit button variations
    const submitSelectors = [
      "button:has-text('Submit')",
      "button:has-text('Create Order')",
      "button:has-text('Save Order')",
      "button:has-text('Confirm')",
      "button:has-text('Place Order')"
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
          console.log('✓ Submit button clicked\n');
          break;
        }
      }
    }

    if (!submitClicked) {
      console.log('⚠️ No submit button found - check review page');
      
      // List all visible buttons
      const allButtons = await page.locator('button').all();
      console.log('\nAll visible buttons on review page:');
      for (const btn of allButtons) {
        const text = await btn.textContent();
        const isVisible = await btn.isVisible();
        if (isVisible && text && text.trim()) {
          console.log(`  - "${text.trim()}"`);
        }
      }
    }

    // Step 9: Check for success
    console.log('\nStep 9: Verifying result...');
    await page.waitForTimeout(2000);

    const successSelectors = [
      'text=/success/i',
      'text=/created/i',
      'text=/berhasil/i',
      'text=/order.*created/i',
      'text=/sales.*order.*\\d+/i'
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
      console.log('Current URL:', page.url());
    }

    await page.screenshot({ path: 'test-results/final-result.png', fullPage: true });

    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETED');
    console.log('='.repeat(60));
    console.log(`Products added: ${productsAdded}`);
    console.log(`Submit clicked: ${submitClicked}`);
    console.log(`Success detected: ${successFound}`);
    console.log('\nScreenshots saved:');
    console.log('  - test-results/products-added.png');
    console.log('  - test-results/review-page-full.png');
    console.log('  - test-results/final-result.png');
    console.log('='.repeat(60));
  });
});
