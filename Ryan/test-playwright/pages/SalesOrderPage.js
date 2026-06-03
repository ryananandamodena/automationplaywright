import { BasePage } from './BasePage.js';

/**
 * Page Object for Sales Order functionality in MHC
 * Handles SO creation workflow: Select Customer → Add Products → Review → Submit
 */
export class SalesOrderPage extends BasePage {
  constructor(page) {
    super(page);
  }

  /**
   * Navigate to Sales Order page
   * @param {string} baseUrl - Base URL of the application
   */
  async navigate(baseUrl) {
    // Dismiss any SweetAlert modal first
    await this.handleSweetAlert('ok').catch(() => {});
    await this.page.waitForTimeout(500);
    
    await this.page.locator('text="Sales Order"').first().click();
    await this.page.waitForTimeout(2000);
    console.log('✓ Sales Order page opened');
  }

  /**
   * Click Create New button to start SO creation wizard
   */
  async clickCreateNew() {
    await this.click("button:has-text('Create New')");
    await this.page.waitForTimeout(2000);
    console.log('✓ Create wizard opened');
  }

  /**
   * Search and select customer
   * @param {string} searchTerm - Customer name to search for
   */
  async selectCustomer(searchTerm) {
    const searchInput = this.page.locator("input[placeholder='Search data...']");
    await searchInput.fill(searchTerm);
    await this.page.waitForTimeout(1000);
    
    const firstCustomerRow = this.page.locator('table tbody tr').first();
    await firstCustomerRow.click();
    await this.page.waitForTimeout(1000);
    console.log(`✓ Customer selected: ${searchTerm}`);
  }

  /**
   * Navigate to Products step
   */
  async goToProducts() {
    await this.click("button:has-text('Next Step')");
    await this.page.waitForTimeout(2000);
    console.log('✓ Products page loaded');
  }

  /**
   * Add multiple products to order (finds products with stock)
   * @param {number} targetCount - Number of products to add (default: 2)
   * @returns {number} - Actual number of products added
   */
  async addProducts(targetCount = 2) {
    console.log(`Adding up to ${targetCount} products with stock...`);
    
    const allAddButtons = await this.page.locator("button:has-text('Add to Order')").all();
    console.log(`  - Found ${allAddButtons.length} Add to Order buttons total`);
    
    let addedCount = 0;
    
    for (let i = 0; i < allAddButtons.length && addedCount < targetCount; i++) {
      const isVisible = await allAddButtons[i].isVisible();
      const isEnabled = await allAddButtons[i].isEnabled();
      
      if (isVisible && isEnabled) {
        console.log(`  - Adding product ${addedCount + 1} (button index ${i})...`);
        await allAddButtons[i].scrollIntoViewIfNeeded();
        await allAddButtons[i].click();
        await this.page.waitForTimeout(2000);
        
        // Handle modal
        console.log(`    - Waiting for modal...`);
        const modalDialog = this.page.locator('[role="dialog"]').or(
          this.page.locator('.z-50').filter({ hasText: 'Add to Order' })
        );
        
        const modalConfirmButton = modalDialog.locator("button:has-text('Add to Order')").last();
        
        await modalConfirmButton.waitFor({ state: 'visible', timeout: 5000 });
        await modalConfirmButton.click({ force: true });
        console.log(`    ✓ Product ${addedCount + 1} added`);
        addedCount++;
        await this.page.waitForTimeout(1500);
      }
    }
    
    if (addedCount === 0) {
      throw new Error('No products with stock found!');
    }
    
    console.log(`✓ Added ${addedCount} products total`);
    return addedCount;
  }

  /**
   * Navigate to Review step
   */
  async goToReview() {
    await this.click("button:has-text('Next Step')");
    await this.page.waitForTimeout(2000);
    console.log('✓ Review page loaded');
  }

  /**
   * Submit the sales order
   * @returns {boolean} - True if submit button was found and clicked
   */
  async submitOrder() {
    console.log('Looking for submit button...');
    
    const submitBtn = this.page.locator("button:has-text('Submit')").or(
      this.page.locator("button:has-text('Save')")).or(
      this.page.locator("button:has-text('Create Order')")
    ).first();

    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await this.page.waitForTimeout(3000);
      console.log('✓ Order submitted!');
      return true;
    } else {
      console.log('⚠ Submit button not found');
      return false;
    }
  }

  /**
   * Complete full Sales Order creation flow
   * @param {Object} data - SO creation data
   * @param {string} data.customer - Customer search term
   * @param {number} data.productCount - Number of products to add (default: 2)
   * @returns {number} - Number of products actually added
   */
  async createSalesOrder(data) {
    await this.clickCreateNew();
    await this.screenshot('so-step1-customer.png');
    
    await this.selectCustomer(data.customer);
    
    await this.goToProducts();
    await this.screenshot('so-step2-products.png');
    
    const addedCount = await this.addProducts(data.productCount || 2);
    await this.screenshot('so-after-add-products.png');
    
    await this.goToReview();
    await this.screenshot('so-step3-review.png');
    
    await this.submitOrder();
    await this.screenshot('so-order-result.png');
    
    return addedCount;
  }

  /**
   * Get current SO count from list page
   * @returns {number} - Number of SOs in the table
   */
  async getOrderCount() {
    return await this.page.locator('table tbody tr').count().catch(() => 0);
  }
}
