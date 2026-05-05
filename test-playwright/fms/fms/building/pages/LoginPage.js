/**
 * LoginPage - Page Object Model for FMS Portal Login
 */
class LoginPage {
  constructor(page) {
    this.page = page;
    
    // Selectors
    this.emailInput = 'input[type="email"], input[name="email"], input[placeholder*="email"]';
    this.passwordInput = 'input[type="password"], input[name="password"]';
    this.signInButton = 'button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]';
    this.fmsButton = 'text=FMS (DEV), text=FMS';
    this.confirmButton = 'button:has-text("Confirm")';
    this.userProfileButton = '[class*="profile"], [class*="avatar"], button:has-text("RA"), button:has-text("AG"), button:has-text("AK")';
    this.logoutButton = 'button:has-text(/logout|sign out|keluar/i), text=/logout|sign out|keluar/i';
    this.errorMessage = '[class*="error"], [class*="alert-danger"], .error-message';
  }

  /**
   * Navigate to login page
   * @param {string} baseUrl - Base URL for the application
   */
  async navigate(baseUrl = 'https://portal-dev.modena.com') {
    const loginUrl = `${baseUrl}/login`;
    await this.page.goto(loginUrl, { waitUntil: 'load', timeout: 30000 });
    await this.page.waitForTimeout(2000);
    console.log(`📄 Navigated to: ${loginUrl}`);
  }

  /**
   * Perform login with credentials
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async performLogin(email, password) {
    console.log(`🔐 Logging in as: ${email}`);
    
    try {
      // Clear and fill email
      const emailField = this.page.locator(this.emailInput).first();
      await emailField.waitFor({ state: 'visible', timeout: 5000 });
      await emailField.clear();
      await emailField.fill(email);
      console.log(`✓ Email filled: ${email}`);
      
      // Clear and fill password
      const passwordField = this.page.locator(this.passwordInput).first();
      await passwordField.waitFor({ state: 'visible', timeout: 5000 });
      await passwordField.clear();
      await passwordField.fill(password);
      console.log(`✓ Password filled`);
      
      // Click sign in button
      const signInBtn = this.page.locator(this.signInButton).first();
      await signInBtn.waitFor({ state: 'visible', timeout: 5000 });
      await signInBtn.click();
      console.log(`✓ Sign In button clicked`);
      
      // Wait for navigation or my-application page
      await this.page.waitForTimeout(3000);
      
      // Handle my-application page if redirected
      if (this.page.url().includes('my-application')) {
        console.log(`📄 Redirected to my-application page`);
        await this.selectFmsApplication();
      }
      
      // Take screenshot after login
      await this.page.screenshot({ 
        path: 'test-results/after-login.png', 
        fullPage: true 
      });
      
      console.log(`✓ Login successful for: ${email}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Login failed: ${error.message}`);
      await this.page.screenshot({ 
        path: 'test-results/login-error.png', 
        fullPage: true 
      });
      throw error;
    }
  }

  /**
   * Select FMS application from portal
   */
  async selectFmsApplication() {
    try {
      // Look for FMS button
      const fmsBtn = this.page.locator(this.fmsButton).first();
      await fmsBtn.waitFor({ state: 'visible', timeout: 10000 });
      await fmsBtn.click();
      console.log(`✓ Clicked FMS (DEV)`);
      
      await this.page.waitForTimeout(2000);
      
      // Handle confirm button if present
      const confirmBtn = this.page.locator(this.confirmButton).first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        console.log(`✓ Clicked Confirm`);
        await this.page.waitForTimeout(2000);
      }
      
    } catch (error) {
      console.error(`❌ Error selecting FMS: ${error.message}`);
    }
  }

  /**
   * Check if user is logged in by looking for profile element
   * @returns {Promise<boolean>}
   */
  async isLoggedIn() {
    try {
      const profileBtn = this.page.locator(this.userProfileButton).first();
      return await profileBtn.isVisible({ timeout: 3000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  /**
   * Get current logged in user name (if displayed)
   * @returns {Promise<string|null>}
   */
  async getLoggedInUserName() {
    try {
      const profileBtn = this.page.locator(this.userProfileButton).first();
      if (await profileBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await profileBtn.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Perform logout
   */
  async logout() {
    try {
      console.log(`🔓 Attempting logout...`);
      
      // Try to find and click profile button first
      const profileBtn = this.page.locator(this.userProfileButton).first();
      
      if (await profileBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await profileBtn.click();
        await this.page.waitForTimeout(1000);
        
        // Look for logout button
        const logoutBtn = this.page.locator(this.logoutButton).first();
        if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await logoutBtn.click();
          await this.page.waitForTimeout(2000);
          console.log(`✓ Logged out successfully`);
        }
      } else {
        // Navigate to login page directly
        await this.page.goto('https://portal-dev.modena.com/login', { waitUntil: 'load', timeout: 30000 });
        await this.page.waitForTimeout(2000);
        console.log(`✓ Navigated to login page (already logged out)`);
      }
      
      // Take screenshot after logout
      await this.page.screenshot({ 
        path: 'test-results/after-logout.png', 
        fullPage: true 
      });
      
    } catch (error) {
      console.error(`❌ Logout error: ${error.message}`);
      // Force navigate to login
      await this.page.goto('https://portal-dev.modena.com/login', { waitUntil: 'load', timeout: 30000 });
    }
  }

  /**
   * Check for error message on login page
   * @returns {Promise<string|null>}
   */
  async getErrorMessage() {
    try {
      const errorEl = this.page.locator(this.errorMessage).first();
      if (await errorEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await errorEl.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }
}

module.exports = { LoginPage };
