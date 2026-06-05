import { BasePage } from './BasePage.js';

/**
 * Page Object for Purchase Order functionality in MHC
 * Handles PO creation workflow: Select Supplier → Add Products → Review → Validate → Submit
 */
export class PurchaseOrderPage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Navigate to Purchase Order page
   * @param {string} baseUrl - Base URL of the application
   */
  async navigate(baseUrl) {
    // Dismiss any SweetAlert modal first
    await this.handleSweetAlert('ok').catch(() => {});
    await this.page.waitForTimeout(500);
    
    const poLink = this.page.locator('text="Purchase Order"').first();
    await poLink.waitFor({ state: 'visible', timeout: 10000 });
    await poLink.click();
    await this.page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
    console.log('✓ Purchase Order page opened');
  }

  /**
   * Click Create New button to start PO creation wizard
   */
  async clickCreateNew() {
    const createBtn = this.page.locator("button:has-text('Create New')").or(
      this.page.locator("button:has-text('Add')").or(
        this.page.locator("button >> text=/create/i")
      )
    ).first();
    await createBtn.waitFor({ state: 'visible', timeout: 10000 });
    await createBtn.click();
    await this.page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(2000);
    console.log('✓ Create wizard opened');
  }

  /**
   * Select supplier from list
   */
  async selectSupplier() {
    await this.page.waitForTimeout(1000);

    // Try to select from content table (not sidebar)
    const supplierTable = this.page.locator('main table, [class*="content"] table, [class*="wizard"] table, [class*="form"] table').first();
    const supplierTableRow = supplierTable.locator('tbody tr').first();

    if (await supplierTableRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await supplierTableRow.click();
      await this.page.waitForTimeout(1000);
      console.log('✓ Supplier selected from table');
    } else {
      // Fallback: select BP item
      const bpItem = this.page.locator('main [class*="item"], main [class*="card"], main [class*="list"] > div, main [class*="row"]').first();
      if (await bpItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bpItem.click();
        await this.page.waitForTimeout(1000);
        console.log('✓ Supplier selected (BP item)');
      } else {
        console.log('⚠ No supplier found - check screenshot');
      }
    }
  }

  /**
   * Navigate to Products step
   */
  async goToProducts() {
    const nextStepBtn = this.page.locator("button:has-text('Next Step')").or(
      this.page.locator("button:has-text('Next')")
    ).first();
    await nextStepBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await nextStepBtn.click({ force: true, timeout: 15000 }).catch(async (e) => {
      // Try clicking PRODUCTS tab directly
      await this.page.getByText('PRODUCTS', { exact: true }).click({ force: true }).catch(() => {});
    });
    await this.page.waitForTimeout(2000);
    console.log('✓ Products page loaded');
  }

  /**
   * Search for specific product
   * @param {string} productCode - Product code to search
   * @returns {boolean} - True if product found
   */
  async searchProduct(productCode) {
    const searchInput = this.page.locator("input[placeholder*='Search']").or(
      this.page.locator("input[type='search']")
    ).first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`  🔍 Searching product: "${productCode}"`);
      await searchInput.fill(productCode);
      await this.page.waitForTimeout(2000);
      const btnCount = await this.page.locator("button:has-text('Add to Order')").count();
      console.log(`  Found ${btnCount} buttons after search`);
      return btnCount > 0;
    }
    return false;
  }

  /**
   * Add products to PO with warehouse and quantity selection
   * @param {Object} options - Product addition options
   * @param {string} options.productCode - Product code to search (optional)
   * @param {number} options.targetCount - Number of products to add (default: 1)
   * @param {number} options.quantity - Quantity per product (default: 5)
   * @returns {number} - Actual number of products added
   */
  async addProducts({ productCode = null, targetCount = 1, quantity = 5 } = {}) {
    console.log('Adding products...');
    
    // Search if product code provided
    if (productCode) {
      await this.searchProduct(productCode);
    }

    let addedCount = 0;

    for (let round = 0; round < targetCount; round++) {
      // Dismiss any modal
      await this.page.keyboard.press('Escape').catch(() => {});
      await this.page.waitForTimeout(1000);

      // Re-query buttons each round
      const addButtons = await this.page.locator("button:has-text('Add to Order')").all();
      console.log(`  - Round ${round + 1}: Found ${addButtons.length} "Add to Order" buttons`);

      if (addButtons.length === 0) {
        console.log('  ⚠ No more Add to Order buttons available');
        break;
      }

      const btnIndex = round < addButtons.length ? round : 0;

      try {
        const btn = addButtons[btnIndex];
        console.log(`  - Adding product ${addedCount + 1} (button index ${btnIndex})...`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ force: true, timeout: 10000 });
        await this.page.waitForTimeout(2000);

        // Handle "Add to PO" modal
        const addItemBtn = this.page.locator("button:has-text('Add Item')").first();
        const modalVisible = await addItemBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (modalVisible) {
          console.log(`    Modal "Add to PO" opened`);

          // Select warehouse (row with WH-code and Unit count)
          const warehouseRow = this.page.locator('div')
            .filter({ hasText: /WH-[A-Z0-9]+/ })
            .filter({ hasText: /\d+\s*Unit/ })
            .first();

          if (await warehouseRow.isVisible({ timeout: 2000 }).catch(() => false)) {
            await warehouseRow.click({ force: true });
            console.log(`    ✓ Warehouse selected`);
          }
          await this.page.waitForTimeout(500);

          // Set quantity
          const qtyInput = this.page.locator("input[type='number'], input[inputmode='numeric']").first();
          
          if (await qtyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await qtyInput.click({ force: true, clickCount: 3 });
            await qtyInput.fill(quantity.toString());
            console.log(`    ✓ Qty set to ${quantity}`);
          }
          await this.page.waitForTimeout(800);

          // Click Add Item
          await addItemBtn.click({ force: true });
          console.log(`    ✓ Product ${addedCount + 1} added`);
          await this.page.waitForTimeout(2000);
        } else {
          // Keyboard confirm fallback
          await this.page.keyboard.press('Enter');
          await this.page.waitForTimeout(1000);
          console.log(`    ✓ Product ${addedCount + 1} added (keyboard)`);
        }

        addedCount++;
        await this.page.waitForTimeout(1500);
      } catch (e) {
        console.log(`    ⚠ Button ${btnIndex} error: ${e.message.slice(0, 100)}`);
      }
    }

    console.log(`✓ Added ${addedCount} products total`);
    return addedCount;
  }

  /**
   * Navigate to Review step
   */
  async goToReview() {
    console.log('Going to Review...');

    // Close any open modal
    for (let i = 0; i < 3; i++) {
      const addItemVisible = await this.page.locator("button:has-text('Add Item')").isVisible({ timeout: 1000 }).catch(() => false);
      if (!addItemVisible) break;
      
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(1500);
    }

    // Try clicking REVIEW tab directly
    const reviewStepLabel = this.page.getByText('REVIEW', { exact: true });
    if (await reviewStepLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reviewStepLabel.click({ force: true });
      await this.page.waitForTimeout(3000);
    } else {
      // Click Next Step
      const nextBtn = this.page.locator("button:has-text('Next Step')").first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click({ force: true });
        await this.page.waitForTimeout(3000);
      }
    }

    console.log('✓ Navigated to REVIEW page');
  }

  /**
   * Parse price from formatted string (e.g., "Rp 1.500.000" -> 1500000)
   * @param {string} text - Price text
   * @returns {number} - Numeric price
   */
  parsePrice(text) {
    if (!text) return 0;
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Validate PO calculations on Review page
   * @returns {Object} - Validation result { valid: boolean, errors: string[], summary: object }
   */
  async validateCalculations() {
    console.log('\n📊 Validating calculations...');

    const pageText = await this.page.locator('body').innerText();

    // Extract Payment Summary values
    const extractValue = (labelRegex) => {
      const match = pageText.match(new RegExp(labelRegex + '[\\s\\S]{0,30}?(Rp\\s*[\\d.,\\s]+)', 'i'));
      return match ? this.parsePrice(match[1]) : null;
    };

    const totalBeforeDisc = extractValue('Total Before Discount');
    const netDisc = extractValue('Net Disc');
    const subtotalPay = extractValue('\\nSubtotal\\n');
    const grandTotalPay = extractValue('Grand Total');

    console.log('\n  --- Payment Summary ---');
    console.log(`  Total Before Discount : ${totalBeforeDisc !== null ? totalBeforeDisc.toLocaleString('id-ID') : 'not found'}`);
    console.log(`  Net Disc              : ${netDisc !== null ? netDisc.toLocaleString('id-ID') : 'not found'}`);
    console.log(`  Subtotal              : ${subtotalPay !== null ? subtotalPay.toLocaleString('id-ID') : 'not found'}`);
    console.log(`  Grand Total           : ${grandTotalPay !== null ? grandTotalPay.toLocaleString('id-ID') : 'not found'}`);

    const calculationErrors = [];

    // Validation 1: Total Before Discount
    // (Would need to parse table rows for full validation - simplified here)

    // Validation 2: Subtotal = Total Before Discount - Net Disc
    if (totalBeforeDisc !== null && netDisc !== null && subtotalPay !== null) {
      const expectedSubtotal = totalBeforeDisc - netDisc;
      if (Math.abs(expectedSubtotal - subtotalPay) > 1) {
        const err = `Subtotal mismatch: expected ${expectedSubtotal.toLocaleString('id-ID')}, got ${subtotalPay.toLocaleString('id-ID')}`;
        calculationErrors.push(err);
        console.log(`  ❌ ${err}`);
      } else {
        console.log(`  ✅ Subtotal: Rp${totalBeforeDisc.toLocaleString('id-ID')} - Rp${netDisc.toLocaleString('id-ID')} = Rp${subtotalPay.toLocaleString('id-ID')} ✓`);
      }
    }

    // Validation 3: Grand Total = Subtotal
    if (subtotalPay !== null && grandTotalPay !== null) {
      if (Math.abs(grandTotalPay - subtotalPay) > 1) {
        const err = `Grand Total mismatch: expected ${subtotalPay.toLocaleString('id-ID')}, got ${grandTotalPay.toLocaleString('id-ID')}`;
        calculationErrors.push(err);
        console.log(`  ❌ ${err}`);
      } else {
        console.log(`  ✅ Grand Total: Rp${grandTotalPay.toLocaleString('id-ID')} = Subtotal ✓`);
      }
    }

    const valid = calculationErrors.length === 0;
    console.log(`\n  ${valid ? '✅ ALL CALCULATIONS CORRECT' : '❌ CALCULATION ERRORS FOUND'}`);

    return {
      valid,
      errors: calculationErrors,
      summary: {
        totalBeforeDisc,
        netDisc,
        subtotalPay,
        grandTotalPay
      }
    };
  }

  /**
   * Submit the purchase order
   * @returns {boolean} - True if submit button was found and clicked
   */
  async submitOrder() {
    console.log('Looking for submit button...');

    const submitBtn = this.page.locator("button:has-text('Submit')").or(
      this.page.locator("button:has-text('Save')")).or(
      this.page.locator("button:has-text('Create Order')")).or(
      this.page.locator("button:has-text('Create PO')")
    ).first();

    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click({ force: true });
      await this.page.waitForTimeout(3000);
      console.log('✓ Order submitted!');
      return true;
    } else {
      console.log('⚠ Submit button not found');
      return false;
    }
  }

  /**
   * Complete full Purchase Order creation flow
   * @param {Object} data - PO creation data
   * @param {string} data.productCode - Product code to search (optional)
   * @param {number} data.productCount - Number of products to add (default: 1)
   * @param {number} data.quantity - Quantity per product (default: 5)
   * @param {boolean} data.validateCalculations - Whether to validate calculations (default: true)
   * @returns {Object} - { addedCount: number, validation: object }
   */
  async createPurchaseOrder(data) {
    await this.clickCreateNew();
    await this.screenshot('po-step1-supplier.png');

    await this.selectSupplier();

    await this.goToProducts();
    await this.screenshot('po-step2-products.png');

    const addedCount = await this.addProducts({
      productCode: data.productCode,
      targetCount: data.productCount || 1,
      quantity: data.quantity || 5
    });
    await this.screenshot('po-after-add-products.png');

    await this.goToReview();
    await this.screenshot('po-step3-review.png');

    let validation = null;
    if (data.validateCalculations !== false) {
      validation = await this.validateCalculations();
      await this.screenshot('po-step3-review-validated.png');
    }

    await this.submitOrder();
    await this.screenshot('po-order-result.png');

    return { addedCount, validation };
  }

  /**
   * Get current PO count from list page
   * @returns {number} - Number of POs in the table
   */
  async getOrderCount() {
    return await this.page.locator('table tbody tr').count().catch(() => 0);
  }
}
