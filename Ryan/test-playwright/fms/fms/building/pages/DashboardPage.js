/**
 * DashboardPage - Page Object Model for FMS Dashboard
 */
class DashboardPage {
  constructor(page) {
    this.page = page;
    
    // Selectors
    this.dashboardTitle = 'h1, h2, [class*="title"], [class*="dashboard"]';
    this.fmsMenu = '[class*="menu"], nav, [class*="sidebar"]';
    this.branchImprovementLink = 'a[href*="branch-improvement"], text=Branch Improvement, text=branch-improvement';
    this.buildingMenu = 'text=Building, a[href*="/building"]';
    this.userNameDisplay = '[class*="user-name"], [class*="profile-name"], [class*="username"]';
    this.welcomeMessage = '[class*="welcome"], text=Welcome';
    this.loadingSpinner = '[class*="spinner"], [class*="loading"]';
  }

  /**
   * Navigate to FMS dashboard
   * @param {string} baseUrl - Base URL for the application
   */
  async navigate(baseUrl = 'https://portal-dev.modena.com') {
    const dashboardUrl = `${baseUrl}/fms`;
    await this.page.goto(dashboardUrl, { waitUntil: 'load', timeout: 30000 });
    await this.waitForLoading();
    console.log(`📄 Navigated to FMS Dashboard`);
  }

  /**
   * Wait for loading spinners to disappear
   */
  async waitForLoading() {
    try {
      const spinner = this.page.locator(this.loadingSpinner).first();
      await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      await this.page.waitForTimeout(1000);
    } catch {
      // Continue even if spinner not found
    }
  }

  /**
   * Navigate to Branch Improvement form page
   * @param {string} baseUrl - Base URL for the application
   */
  async navigateToBranchImprovementForm(baseUrl = 'https://portal-dev.modena.com') {
    const formUrl = `${baseUrl}/fms/building/branch-improvement/form`;
    
    console.log(`📄 Navigating to Branch Improvement Form: ${formUrl}`);
    await this.page.goto(formUrl, { waitUntil: 'load', timeout: 30000 });
    await this.waitForLoading();
    
    // Take screenshot
    await this.page.screenshot({ 
      path: 'test-results/dashboard-to-form.png', 
      fullPage: true 
    });
    
    console.log(`✓ Navigated to: ${this.page.url()}`);
    return this.page.url();
  }

  /**
   * Get the current page title
   * @returns {Promise<string>}
   */
  async getPageTitle() {
    try {
      const title = this.page.locator(this.dashboardTitle).first();
      if (await title.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await title.textContent();
      }
      return '';
    } catch {
      return '';
    }
  }

  /**
   * Check if dashboard is loaded correctly
   * @returns {Promise<boolean>}
   */
  async isDashboardLoaded() {
    try {
      // Check if URL contains /fms/
      const url = this.page.url();
      if (!url.includes('/fms/')) {
        return false;
      }
      
      // Try to find any dashboard element
      const title = this.page.locator(this.dashboardTitle).first();
      return await title.isVisible({ timeout: 5000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  /**
   * Get logged in user name from dashboard
   * @returns {Promise<string|null>}
   */
  async getUserName() {
    try {
      const userNameEl = this.page.locator(this.userNameDisplay).first();
      if (await userNameEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await userNameEl.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get welcome message
   * @returns {Promise<string|null>}
   */
  async getWelcomeMessage() {
    try {
      const welcomeEl = this.page.locator(this.welcomeMessage).first();
      if (await welcomeEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await welcomeEl.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Find and click Branch Improvement menu item
   */
  async clickBranchImprovementMenu() {
    try {
      // First try to find building menu
      const buildingMenu = this.page.locator(this.buildingMenu).first();
      if (await buildingMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
        await buildingMenu.click();
        await this.page.waitForTimeout(1000);
      }
      
      // Then find and click branch improvement link
      const branchImprovementLink = this.page.locator(this.branchImprovementLink).first();
      await branchImprovementLink.waitFor({ state: 'visible', timeout: 5000 });
      await branchImprovementLink.click();
      
      await this.page.waitForTimeout(2000);
      console.log(`✓ Clicked Branch Improvement menu`);
      
    } catch (error) {
      console.error(`❌ Error clicking Branch Improvement menu: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if there's an unauthorized error
   * @returns {Promise<boolean>}
   */
  async isUnauthorized() {
    return this.page.url().includes('/unauthorized');
  }

  /**
   * Check for success message or confirmation
   * @returns {Promise<string|null>}
   */
  async getSuccessMessage() {
    try {
      const successEl = this.page.locator('[class*="success"], [class*="alert-success"], .toast-success').first();
      if (await successEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await successEl.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check for error message
   * @returns {Promise<string|null>}
   */
  async getErrorMessage() {
    try {
      const errorEl = this.page.locator('[class*="error"], [class*="alert-danger"], .error-message, [class*="toast-error"]').first();
      if (await errorEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await errorEl.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }
}

module.exports = { DashboardPage };
