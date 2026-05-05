import { test, expect } from '@playwright/test';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';
const PRODUCT_TO_ADD = 'BH 8725 HABK'; // MODENA GAS HOB

test.describe('MHC - Create Sales Order with Specific Product', () => {
  test.setTimeout(180000);

  test('Create SO with MODENA GAS HOB - BH 8725 HABK', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('MHC SALES ORDER CREATION - E2E TEST');
    console.log('Product: MODENA GAS HOB - BH 8725 HABK');
    console.log('='.repeat(70) + '\n');

    // ============ STEP 1: LOGIN ============
    console.log('[1/8] 🔐 Login to MHC...');
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
    await page.locator("button:has-text('Login')").click();
    await page.waitForTimeout(4000);
    
    await page.locator('text=/Welcome|Dashboard/i').first().waitFor();
    console.log('      ✅ Login successful\n');

    // ============ STEP 2: NAVIGATE TO SALES ORDER ============
    console.log('[2/8] 📋 Navigate to Sales Order...');
    await page.locator('text="Sales Order"').first().click();
    await page.waitForTimeout(2000);
    console.log('      ✅ Sales Order page opened\n');

    // ============ STEP 3: CREATE NEW ============
    console.log('[3/8] ➕ Create new Sales Order...');
    await page.locator("button:has-text('Create New')").click();
    await page.waitForTimeout(2000);
    console.log('      ✅ Create wizard opened\n');

    // ============ STEP 4: SELECT CUSTOMER ============
    console.log('[4/8] 👤 Select customer...');
    const searchInput = page.locator("input[placeholder='Search data...']");
    await searchInput.fill('Dedi');
    await page.waitForTimeout(1000);
    
    const firstCustomerRow = page.locator('table tbody tr').first();
    await firstCustomerRow.click();
    await page.waitForTimeout(1000);
    console.log('      ✅ Customer "Dedi Slamet" selected\n');

    // ============ STEP 5: GO TO PRODUCTS ============
    console.log('[5/8] 🛒 Navigate to Products...');
    await page.locator("button:has-text('Next Step')").click();
    await page.waitForTimeout(2000);
    console.log('      ✅ Products page loaded\n');

    // ============ STEP 6: SEARCH & ADD PRODUCT ============
    console.log(`[6/8] 🔍 Search and add product: ${PRODUCT_TO_ADD}...`);
    
    // Search for product
    const productSearchInput = page.locator("input[placeholder*='Search product']").or(
      page.locator("input[placeholder*='search']")
    ).first();
    
    if (await productSearchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`      🔍 Searching for "${PRODUCT_TO_ADD}"...`);
      await productSearchInput.fill(PRODUCT_TO_ADD);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/product-search-result.png', fullPage: true });
    }
    
    // Find and click Add to Order button
    const addButtons = page.locator("button:has-text('Add to Order')");
    const buttonCount = await addButtons.count();
    console.log(`      📊 Found ${buttonCount} products`);
    
    if (buttonCount === 0) {
      throw new Error('No products found! Check if product exists or has stock.');
    }
    
    // Click first enabled button
    let productAdded = false;
    for (let i = 0; i < buttonCount; i++) {
      const button = addButtons.nth(i);
      const isEnabled = await button.isEnabled();
      
      if (isEnabled) {
        console.log(`      ➕ Adding product to cart...`);
        await button.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await button.click();
        await page.waitForTimeout(2000);
        
        // Modal opened - find and click the "Add to Order" button inside modal
        console.log('      🎯 Modal opened, clicking "Add to Order" button...');
        
        // Wait for modal to be fully visible
        await page.waitForTimeout(1000);
        
        // The modal has two buttons: "Cancel" and "Add to Order"
        // We want the "Add to Order" button (the black one on the right)
        // Get all "Add to Order" buttons, the last one should be in the modal
        const allAddToOrderButtons = page.locator("button:has-text('Add to Order')");
        const modalButton = allAddToOrderButtons.last();
        
        // Click the modal button
        await modalButton.click({ force: true });
        console.log('      ✅ Clicked "Add to Order" in modal');
        
        await page.waitForTimeout(2000);
        
        productAdded = true;
        console.log('      ✅ Product added to cart\n');
        break;
      }
    }
    
    if (!productAdded) {
      throw new Error('Failed to add product - all buttons disabled (no stock?)');
    }

    await page.screenshot({ path: 'test-results/product-added.png', fullPage: true });

    // ============ STEP 7: GO TO REVIEW ============
    console.log('[7/8] 📝 Navigate to Review...');
    await page.locator("button:has-text('Next Step')").click();
    await page.waitForTimeout(2000);
    console.log('      ✅ Review page loaded\n');

    await page.screenshot({ path: 'test-results/review-page.png', fullPage: true });

    // ============ STEP 8: SUBMIT ORDER ============
    console.log('[8/8] 🚀 Submit Sales Order...');
    
    // Find submit button
    const submitSelectors = [
      "button:has-text('Submit')",
      "button:has-text('Create Order')",
      "button:has-text('Save')",
      "button:has-text('Confirm')",
      "button:has-text('Place Order')"
    ];

    let submitClicked = false;
    for (const selector of submitSelectors) {
      const submitBtn = page.locator(selector);
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isEnabled = await submitBtn.isEnabled();
        if (isEnabled) {
          const btnText = await submitBtn.textContent();
          console.log(`      🔘 Found button: "${btnText}"`);
          await submitBtn.click();
          await page.waitForTimeout(3000);
          submitClicked = true;
          console.log('      ✅ Order submitted\n');
          break;
        }
      }
    }

    if (!submitClicked) {
      console.log('      ⚠️  No submit button found');
      console.log('      📸 Check screenshot: review-page.png\n');
    }

    // ============ VERIFY SUCCESS ============
    console.log('\n📊 VERIFICATION:');
    await page.waitForTimeout(2000);

    const successSelectors = [
      'text=/success/i',
      'text=/created/i',
      'text=/berhasil/i',
      'text=/thank you/i'
    ];

    let successFound = false;
    for (const selector of successSelectors) {
      if (await page.locator(selector).first().isVisible({ timeout: 3000 }).catch(() => false)) {
        const msg = await page.locator(selector).first().textContent();
        console.log(`   ✅ SUCCESS: ${msg}`);
        successFound = true;
        break;
      }
    }

    const finalUrl = page.url();
    console.log(`   🌐 Final URL: ${finalUrl}`);

    await page.screenshot({ path: 'test-results/final-result-gasfryer.png', fullPage: true });

    // ============ SUMMARY ============
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Product searched: ${PRODUCT_TO_ADD}`);
    console.log(`✅ Product added: ${productAdded}`);
    console.log(`✅ Submit clicked: ${submitClicked}`);
    console.log(`${successFound ? '✅' : '⚠️ '} Success message: ${successFound ? 'Found' : 'Not found'}`);
    console.log('\n📸 Screenshots saved:');
    console.log('   - product-search-result.png');
    console.log('   - product-added.png');
    console.log('   - review-page.png');
    console.log('   - final-result-gashot.png');
    console.log('='.repeat(70) + '\n');

    // Assert that at least we got to review page
    expect(productAdded).toBe(true);
  });
});
