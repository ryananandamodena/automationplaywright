/**
 * BranchImprovementPage - Page Object Model for Branch Improvement Form
 * This form is for reporting maintenance issues (AC, lights, lift, plumbing, etc.)
 */
class BranchImprovementPage {
  constructor(page) {
    this.page = page;
    
    // Form Field Selectors
    this.formTitle = 'h1, h2, [class*="title"], [class*="form-title"]';
    this.branchDropdown = 'select[name="branch"], select[id="branch"], select[class*="branch"], [class*="branch"] select';
    this.buildingNameInput = 'input[name="buildingName"], input[id="buildingName"], input[placeholder*="Building"], input[placeholder*="building"]';
    this.floorNumberInput = 'input[name="floor"], input[id="floor"], input[name="floorNumber"], input[placeholder*="Floor"], input[placeholder*="floor"]';
    this.issueTitleInput = 'input[name="issueTitle"], input[id="issueTitle"], input[name="title"], input[placeholder*="Issue"], input[placeholder*="Title"]';
    this.issueDescriptionTextarea = 'textarea[name="description"], textarea[id="description"], textarea[name="issueDescription"], textarea[placeholder*="Description"], textarea[placeholder*="description"]';
    this.priorityDropdown = 'select[name="priority"], select[id="priority"], select[class*="priority"]';
    this.categoryDropdown = 'select[name="category"], select[id="category"], select[class*="category"]';
    this.submitButton = 'button[type="submit"], button:has-text("Submit"), button:has-text("submit")';
    this.saveDraftButton = 'button:has-text("Save Draft"), button:has-text("Draft")';
    
    // Additional form elements
    this.allInputs = 'input[type="text"], input[type="number"], input:not([type])';
    this.allSelects = 'select';
    this.allTextareas = 'textarea';
    this.allButtons = 'button';
    
    // Status/Success/Error messages
    this.successMessage = '[class*="success"], [class*="alert-success"], .toast-success, [class*="message-success"]';
    this.errorMessage = '[class*="error"], [class*="alert-danger"], .error-message, [class*="message-error"], [class*="toast-error"]';
    this.loadingIndicator = '[class*="spinner"], [class*="loading"], [class*="processing"]';
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad() {
    console.log(`⏳ Waiting for page to load...`);
    
    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    
    // Wait a bit for any JS to render
    await this.page.waitForTimeout(2000);
    
    // Check for loading indicator to disappear
    try {
      const loading = this.page.locator(this.loadingIndicator).first();
      await loading.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Continue even if no loading indicator
    }
    
    console.log(`✓ Page loaded`);
  }

  /**
   * Verify form page is loaded correctly
   * @returns {Promise<boolean>}
   */
  async isFormPageLoaded() {
    try {
      // Check URL contains branch-improvement
      const url = this.page.url();
      if (!url.includes('branch-improvement')) {
        console.log(`⚠️ URL does not contain 'branch-improvement': ${url}`);
        return false;
      }
      
      // Try to find form title or any form element
      const title = this.page.locator(this.formTitle).first();
      const hasTitle = await title.isVisible({ timeout: 5000 }).catch(() => false);
      
      // Check for any form elements
      const selectCount = await this.page.locator(this.allSelects).count();
      const inputCount = await this.page.locator(this.allInputs).count();
      const textareaCount = await this.page.locator(this.allTextareas).count();
      
      const hasFormElements = selectCount > 0 || inputCount > 0 || textareaCount > 0;
      
      if (hasTitle || hasFormElements) {
        console.log(`✓ Form page loaded with ${selectCount} selects, ${inputCount} inputs, ${textareaCount} textareas`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Error checking form page: ${error.message}`);
      return false;
    }
  }

  /**
   * Get form title if available
   * @returns {Promise<string>}
   */
  async getFormTitle() {
    try {
      const title = this.page.locator(this.formTitle).first();
      if (await title.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await title.textContent();
      }
      return '';
    } catch {
      return '';
    }
  }

  /**
   * Check if branch dropdown is visible
   * @returns {Promise<boolean>}
   */
  async isBranchDropdownVisible() {
    try {
      const dropdown = this.page.locator(this.branchDropdown).first();
      return await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  /**
   * Check if submit button is visible
   * @returns {Promise<boolean>}
   */
  async isSubmitButtonVisible() {
    try {
      const button = this.page.locator(this.submitButton).first();
      return await button.isVisible({ timeout: 3000 }).catch(() => false);
    } catch {
      return false;
    }
  }

  /**
   * Check if submit button is enabled
   * @returns {Promise<boolean>}
   */
  async isSubmitButtonEnabled() {
    try {
      const button = this.page.locator(this.submitButton).first();
      const isVisible = await button.isVisible({ timeout: 3000 }).catch(() => false);
      if (!isVisible) return false;
      
      const isDisabled = await button.isDisabled().catch(() => false);
      return !isDisabled;
    } catch {
      return false;
    }
  }

  /**
   * Fill branch dropdown
   * @param {string} branchValue - Branch value to select
   */
  async selectBranch(branchValue) {
    try {
      console.log(`📋 Selecting branch: ${branchValue}`);
      const dropdown = this.page.locator(this.branchDropdown).first();
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });
      
      // Try to select by value first, then by label
      try {
        await dropdown.selectOption({ label: branchValue });
      } catch {
        await dropdown.selectOption({ value: branchValue });
      }
      
      console.log(`✓ Branch selected: ${branchValue}`);
      await this.page.waitForTimeout(500);
    } catch (error) {
      console.error(`❌ Error selecting branch: ${error.message}`);
      // Take screenshot for debugging
      await this.page.screenshot({ path: 'test-results/error-branch-select.png', fullPage: true });
      throw error;
    }
  }

  /**
   * Fill building name input
   * @param {string} buildingName - Building name
   */
  async fillBuildingName(buildingName) {
    try {
      console.log(`🏢 Filling building name: ${buildingName}`);
      const input = this.page.locator(this.buildingNameInput).first();
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.clear();
      await input.fill(buildingName);
      
      console.log(`✓ Building name filled: ${buildingName}`);
      await this.page.waitForTimeout(300);
    } catch (error) {
      console.error(`❌ Error filling building name: ${error.message}`);
      await this.page.screenshot({ path: 'test-results/error-building-name.png', fullPage: true });
      throw error;
    }
  }

  /**
   * Fill floor number input
   * @param {string|number} floorNumber - Floor number
   */
  async fillFloorNumber(floorNumber) {
    try {
      console.log(`🏢 Filling floor number: ${floorNumber}`);
      const input = this.page.locator(this.floorNumberInput).first();
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.clear();
      await input.fill(String(floorNumber));
      
      console.log(`✓ Floor number filled: ${floorNumber}`);
      await this.page.waitForTimeout(300);
    } catch (error) {
      console.error(`❌ Error filling floor number: ${error.message}`);
      await this.page.screenshot({ path: 'test-results/error-floor-number.png', fullPage: true });
      throw error;
    }
  }

  /**
   * Fill issue title input
   * @param {string} title - Issue title
   */
  async fillIssueTitle(title) {
    try {
      console.log(`📝 Filling issue title: ${title}`);
      const input = this.page.locator(this.issueTitleInput).first();
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.clear();
      await input.fill(title);
      
      console.log(`✓ Issue title filled: ${title}`);
      await this.page.waitForTimeout(300);
    } catch (error) {
      console.error(`❌ Error filling issue title: ${error.message}`);
      await this.page.screenshot({ path: 'test-results/error-issue-title.png', fullPage: true });
      throw error;
    }
  }

  /**
   * Fill issue description textarea
   * @param {string} description - Issue description
   */
  async fillIssueDescription(description) {
    try {
      console.log(`📝 Filling issue description: ${description}`);
      const textarea = this.page.locator(this.issueDescriptionTextarea).first();
      await textarea.waitFor({ state: 'visible', timeout: 5000 });
      await textarea.clear();
      await textarea.fill(description);
      
      console.log(`✓ Issue description filled: ${description.substring(0, 50)}...`);
      await this.page.waitForTimeout(300);
    } catch (error) {
      console.error(`❌ Error filling issue description: ${error.message}`);
      await this.page.screenshot({ path: 'test-results/error-issue-desc.png', fullPage: true });
      throw error;
    }
  }

  /**
   * Select priority from dropdown
   * @param {string} priority - Priority value (High, Medium, Low, Urgent)
   */
  async selectPriority(priority) {
    try {
      console.log(`⚡ Selecting priority: ${priority}`);
      const dropdown = this.page.locator(this.priorityDropdown).first();
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });
      
      try {
        await dropdown.selectOption({ label: priority });
      } catch {
        await dropdown.selectOption({ value: priority });
      }
      
      console.log(`✓ Priority selected: ${priority}`);
      await this.page.waitForTimeout(500);
    } catch (error) {
      console.error(`❌ Error selecting priority: ${error.message}`);
      await this.page.screenshot({ path: 'test-results/error-priority.png', fullPage: true });
      throw error;
    }
  }

  /**
   * Select category from dropdown
   * @param {string} category - Category value (Maintenance, Electrical, Elevator, Plumbing, General)
   */
  async selectCategory(category) {
    try {
      console.log(`🏷️ Selecting category: ${category}`);
      const dropdown = this.page.locator(this.categoryDropdown).first();
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });
      
      try {
        await dropdown.selectOption({ label: category });
      } catch {
        await dropdown.selectOption({ value: category });
      }
      
      console.log(`✓ Category selected: ${category}`);
      await this.page.waitForTimeout(500);
    } catch (error) {
      console.error(`❌ Error selecting category: ${error.message}`);
      await this.page.screenshot({ path: 'test-results/error-category.png', fullPage: true });
      throw error;
    }
  }

  /**
   * Fill the entire form with test data
   * @param {Object} data - Test data object with branch, building, floor, title, description, priority, category
   */
  async fillForm(data) {
    console.log(`📝 Filling Branch Improvement Form with data:`, data);
    
    // Take screenshot before filling
    await this.page.screenshot({ path: 'test-results/before-fill-form.png', fullPage: true });
    
    // Fill each field
    if (data.branch) {
      await this.selectBranch(data.branch);
      await this.page.screenshot({ path: 'test-results/after-branch-select.png', fullPage: true });
    }
    
    if (data.buildingName) {
      await this.fillBuildingName(data.buildingName);
      await this.page.screenshot({ path: 'test-results/after-building-name.png', fullPage: true });
    }
    
    if (data.floor) {
      await this.fillFloorNumber(data.floor);
      await this.page.screenshot({ path: 'test-results/after-floor-number.png', fullPage: true });
    }
    
    if (data.issueTitle) {
      await this.fillIssueTitle(data.issueTitle);
      await this.page.screenshot({ path: 'test-results/after-issue-title.png', fullPage: true });
    }
    
    if (data.issueDescription) {
      await this.fillIssueDescription(data.issueDescription);
      await this.page.screenshot({ path: 'test-results/after-issue-desc.png', fullPage: true });
    }
    
    if (data.priority) {
      await this.selectPriority(data.priority);
      await this.page.screenshot({ path: 'test-results/after-priority.png', fullPage: true });
    }
    
    if (data.category) {
      await this.selectCategory(data.category);
      await this.page.screenshot({ path: 'test-results/after-category.png', fullPage: true });
    }
    
    console.log(`✅ Form filling completed`);
    await this.page.screenshot({ path: 'test-results/form-filled.png', fullPage: true });
  }

  /**
   * Submit the form
   */
  async submitForm() {
    try {
      console.log(`📤 Submitting form...`);
      
      // Take screenshot before submit
      await this.page.screenshot({ path: 'test-results/before-submit.png', fullPage: true });
      
      const button = this.page.locator(this.submitButton).first();
      await button.waitFor({ state: 'visible', timeout: 5000 });
      
      // Check if button is enabled
      const isDisabled = await button.isDisabled().catch(() => false);
      if (isDisabled) {
        console.log(`⚠️ Submit button is disabled - form may have validation errors`);
        await this.page.screenshot({ path: 'test-results/submit-disabled.png', fullPage: true });
        throw new Error('Submit button is disabled');
      }
      
      await button.click();
      console.log(`✓ Submit button clicked`);
      
      // Wait for submission to process
      await this.page.waitForTimeout(3000);
      
      // Take screenshot after submit
      await this.page.screenshot({ path: 'test-results/after-submit.png', fullPage: true });
      
      console.log(`✓ Form submitted`);
    } catch (error) {
      console.error(`❌ Error submitting form: ${error.message}`);
      await this.page.screenshot({ path: 'test-results/error-submit.png', fullPage: true });
      throw error;
    }
  }

  /**
   * Get success message if present
   * @returns {Promise<string|null>}
   */
  async getSuccessMessage() {
    try {
      const message = this.page.locator(this.successMessage).first();
      if (await message.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await message.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Get error message if present
   * @returns {Promise<string|null>}
   */
  async getErrorMessage() {
    try {
      const message = this.page.locator(this.errorMessage).first();
      if (await message.isVisible({ timeout: 3000 }).catch(() => false)) {
        return await message.textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if form submission was successful
   * @returns {Promise<boolean>}
   */
  async isSubmissionSuccessful() {
    // Check for success message
    const successMsg = await this.getSuccessMessage();
    if (successMsg) {
      console.log(`✓ Success message found: ${successMsg}`);
      return true;
    }
    
    // Check if we're still on the form page (might indicate failure)
    const url = this.page.url();
    if (url.includes('branch-improvement/form') && !url.includes('success')) {
      console.log(`⚠️ Still on form page - submission may have failed`);
      return false;
    }
    
    // Check for error message
    const errorMsg = await this.getErrorMessage();
    if (errorMsg) {
      console.log(`⚠️ Error message found: ${errorMsg}`);
      return false;
    }
    
    // Consider it successful if we get here
    return true;
  }
}

module.exports = { BranchImprovementPage };
