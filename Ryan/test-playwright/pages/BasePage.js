/**
 * BASE PAGE CLASS
 * 
 * All Page Objects should extend this class.
 * Contains common methods used across all pages.
 */

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a URL
   */
  async goto(url, options = {}) {
    await this.page.goto(url, {
      waitUntil: 'load',
      timeout: 30000,
      ...options
    });
  }

  /**
   * Wait for element with better error handling
   */
  async waitForElement(selector, options = {}) {
    const locator = typeof selector === 'string' 
      ? this.page.locator(selector) 
      : selector;
    
    return await locator.waitFor({
      state: 'visible',
      timeout: 10000,
      ...options
    });
  }

  /**
   * Click with resilience
   */
  async click(selector, options = {}) {
    const locator = typeof selector === 'string' 
      ? this.page.locator(selector) 
      : selector;
    
    await this.waitForElement(locator);
    await locator.click(options);
  }

  /**
   * Fill input field
   */
  async fill(selector, value, options = {}) {
    const locator = typeof selector === 'string' 
      ? this.page.locator(selector) 
      : selector;
    
    await this.waitForElement(locator);
    await locator.fill(value, options);
  }

  /**
   * Get text content
   */
  async getText(selector) {
    const locator = typeof selector === 'string' 
      ? this.page.locator(selector) 
      : selector;
    
    return await locator.textContent();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector, timeout = 5000) {
    const locator = typeof selector === 'string' 
      ? this.page.locator(selector) 
      : selector;
    
    return await locator.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Wait for page load
   */
  async waitForPageLoad(state = 'load', timeout = 30000) {
    await this.page.waitForLoadState(state, { timeout }).catch(() => {
      console.log(`⚠ Page didn't reach ${state} state within ${timeout}ms`);
    });
  }

  /**
   * Take screenshot
   */
  async screenshot(filename, options = {}) {
    await this.page.screenshot({
      path: `test-results/${filename}`,
      fullPage: true,
      ...options
    });
  }

  /**
   * Handle SweetAlert popups
   */
  async handleSweetAlert(action = 'confirm') {
    const alertVisible = await this.isVisible('.swal2-title', 3000);
    
    if (alertVisible) {
      const title = await this.getText('.swal2-title');
      const message = await this.getText('.swal2-html-container').catch(() => '');
      
      console.log(`📢 Alert: ${title}`);
      if (message) console.log(`   Message: ${message}`);
      
      if (action === 'confirm') {
        await this.click('.swal2-confirm');
      } else if (action === 'cancel') {
        await this.click('.swal2-cancel');
      }
      
      await this.page.waitForTimeout(1000);
      return { title, message };
    }
    
    return null;
  }

  /**
   * Select from React Select dropdown
   */
  async selectReactSelect(containerIndex, searchText) {
    // Click the container to open dropdown
    await this.click(`.css-b62m3t-container >> nth=${containerIndex}`);
    await this.page.waitForTimeout(500);
    
    // Type to search
    if (searchText) {
      await this.page.keyboard.type(searchText);
      await this.page.waitForTimeout(1500);
    }
    
    // Click first option
    const optionCount = await this.page.locator('div[id*="react-select"][id*="option"]').count();
    if (optionCount > 0) {
      await this.click('div[id*="react-select"][id*="option"] >> nth=0');
      await this.page.waitForTimeout(500);
      return true;
    }
    
    return false;
  }

  /**
   * Wait for navigation after action
   */
  async waitForNavigation(callback, options = {}) {
    await Promise.all([
      this.page.waitForLoadState('load', { timeout: 30000, ...options }),
      callback()
    ]);
  }
}
