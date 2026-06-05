/**
 * LOGIN PAGE OBJECT
 * 
 * Handles login functionality for FMS/MHC portals
 */

import { BasePage } from './BasePage.js';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    
    // Selectors
    this.selectors = {
      emailInput: 'input[type="email"], input[name="email"]',
      passwordInput: 'input[type="password"], input[name="password"]',
      loginButton: 'button[type="submit"], button:has-text("Login")',
      errorMessage: '.error, .alert-danger, [class*="error"]'
    };
  }

  /**
   * Navigate to login page
   */
  async navigate(baseUrl) {
    await this.goto(`${baseUrl}/login`);
    await this.waitForPageLoad();
  }

  /**
   * Perform login
   */
  async login(email, password) {
    console.log(`🔑 Logging in as: ${email}`);
    
    // Fill credentials
    await this.fill(this.selectors.emailInput, email);
    await this.fill(this.selectors.passwordInput, password);
    
    // Click login button and wait for navigation
    await this.waitForNavigation(async () => {
      await this.click(this.selectors.loginButton);
    });
    
    await this.page.waitForTimeout(3000);
    
    // Check for error messages
    const hasError = await this.isVisible(this.selectors.errorMessage, 2000);
    if (hasError) {
      const errorText = await this.getText(this.selectors.errorMessage);
      throw new Error(`Login failed: ${errorText}`);
    }
    
    console.log('✓ Login successful');
    return true;
  }

  /**
   * Select application (for multi-app portals like FMS)
   */
  async selectApplication(appName) {
    console.log(`📱 Selecting application: ${appName}`);
    
    const appLink = this.page.locator(`text="${appName}"`);
    const isVisible = await this.isVisible(appLink, 5000);
    
    if (isVisible) {
      await this.click(appLink);
      await this.page.waitForTimeout(2000);
      
      // Handle confirmation dialog if any
      await this.handleSweetAlert('confirm');
      
      console.log(`✓ ${appName} application selected`);
      return true;
    }
    
    console.log(`⚠ ${appName} application not found, assuming already in app`);
    return false;
  }

  /**
   * Full login flow (login + select app if needed)
   */
  async loginAndSelectApp(baseUrl, email, password, appName = null) {
    await this.navigate(baseUrl);
    await this.login(email, password);
    
    if (appName) {
      await this.selectApplication(appName);
    }
    
    return true;
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn() {
    // Check for common logout/profile elements
    const logoutVisible = await this.isVisible('button:has-text("Logout"), a:has-text("Logout")', 2000);
    const profileVisible = await this.isVisible('[class*="profile"], [class*="user-menu"]', 2000);
    
    return logoutVisible || profileVisible;
  }

  /**
   * Logout
   */
  async logout() {
    console.log('🚪 Logging out...');
    
    // Try different logout patterns
    const logoutButton = this.page.locator('button:has-text("Logout")').or(
      this.page.locator('a:has-text("Logout")').or(
        this.page.locator('[class*="logout"]')
      )
    );
    
    const isVisible = await this.isVisible(logoutButton, 5000);
    
    if (isVisible) {
      await this.click(logoutButton);
      await this.page.waitForTimeout(2000);
      console.log('✓ Logged out');
      return true;
    }
    
    console.log('⚠ Logout button not found');
    return false;
  }
}
