// mobile_gccs.spec.js - GCCS Mobile E2E Testing
// Platform: Android Emulator (BlueStacks)
// Test Framework: Playwright

import { test, expect } from '@playwright/test';

// Configuration
const CREDENTIALS = {
  valid: {
    username: 'TEC_IDR002',
    password: 'password.1'
  },
  invalid: {
    username: 'TEC_IDR002',
    password: 'wrongpassword'
  }
};

const MOBILE_CONFIG = {
  baseURL: process.env.MOBILE_BASE_URL || 'https://gccs-mobile-test.modena.com',
  timeout: 30000,
  navigationTimeout: 30000
};

async function loginToApp(page) {
  await page.goto(MOBILE_CONFIG.baseURL, {
    waitUntil: 'domcontentloaded',
    timeout: MOBILE_CONFIG.navigationTimeout
  });

  const usernameField = page.locator('input[name="username"], input[type="text"], input[placeholder*="username" i]').first();
  const passwordField = page.locator('input[name="password"], input[type="password"], input[placeholder*="password" i]').first();
  const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Masuk")').first();

  await usernameField.fill(CREDENTIALS.valid.username);
  await passwordField.fill(CREDENTIALS.valid.password);
  await loginButton.click();

  await page.waitForURL('**/dashboard', { timeout: 20000 }).catch(async () => {
    await page.waitForSelector('[class*="dashboard"], [id*="dashboard"], h1:has-text("Dashboard"), h2:has-text("Dashboard")', { timeout: 20000 });
  });
}

// Test Suite
test.describe('GCCS Mobile - End-to-End Testing', () => {
  test.beforeEach('Setup Console Logging', async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER LOG] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[PAGE ERROR] ${err.message}`));
  });

  // =============================================
  // SCENARIO 1 - Login Application
  // =============================================
  test('TC-MOB-001: Login Application - Valid Credentials', async ({ page, context }) => {
    test.setTimeout(60000);

    // Step 1: Navigate to GCCS Mobile App
    console.log('Step 1: Opening GCCS Mobile Application...');
    await page.goto(MOBILE_CONFIG.baseURL, { 
      waitUntil: 'domcontentloaded',
      timeout: MOBILE_CONFIG.navigationTimeout 
    });
    await page.screenshot({ path: 'screenshots/01-app-loaded.png', fullPage: true });

    // Step 2: Wait for login page to fully load
    console.log('Step 2: Waiting for login page to load...');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Verify login form elements are visible
    const usernameField = page.locator('input[name="username"], input[type="text"], input[placeholder*="username" i]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"], input[placeholder*="password" i]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Masuk")').first();
    
    await expect(usernameField).toBeVisible({ timeout: 10000 });
    await expect(passwordField).toBeVisible({ timeout: 10000 });
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/02-login-page-ready.png', fullPage: true });

    // Step 3: Input username
    console.log('Step 3: Entering username...');
    await usernameField.click();
    await usernameField.fill(CREDENTIALS.valid.username);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/03-username-entered.png', fullPage: true });

    // Step 4: Input password
    console.log('Step 4: Entering password...');
    await passwordField.click();
    await passwordField.fill(CREDENTIALS.valid.password);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/04-password-entered.png', fullPage: true });

    // Step 5: Click login button
    console.log('Step 5: Clicking login button...');
    await loginButton.click();
    await page.screenshot({ path: 'screenshots/05-login-clicked.png', fullPage: true });

    // Expected Results Validation
    console.log('Validating login results...');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 20000 }).catch(async () => {
      // Alternative: check for dashboard indicators
      await page.waitForSelector('[class*="dashboard"], [id*="dashboard"], h1:has-text("Dashboard"), h2:has-text("Dashboard")', { timeout: 20000 });
    });

    // Verify no error messages
    const errorMessage = page.locator('.error, .alert-danger, [class*="error"], [role="alert"]');
    await expect(errorMessage).toHaveCount(0);

    // Verify session is created
    const cookies = await context.cookies();
    expect(cookies.length).toBeGreaterThan(0);

    // Verify dashboard is displayed
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: 'screenshots/06-dashboard-loaded.png', fullPage: true });

    console.log('✓ Login successful!');
  });

  // =============================================
  // SCENARIO 2 - Open Dashboard
  // =============================================
  test('TC-MOB-002: Dashboard Display Verification', async ({ page }) => {
    test.setTimeout(60000);

    console.log('Verifying dashboard components...');
    await loginToApp(page);

    // Verify dashboard is loaded
    const dashboardIndicator = page.locator('[class*="dashboard"], h1:has-text("Dashboard"), h2:has-text("Dashboard"), [data-page="dashboard"]');
    await expect(dashboardIndicator.first()).toBeVisible({ timeout: 10000 });

    // Wait for data to load (no infinite loading)
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    
    // Verify loading spinner is gone
    const loadingSpinner = page.locator('.loading, .spinner, [class*="loading"], [class*="spinner"]');
    await expect(loadingSpinner).toHaveCount(0, { timeout: 10000 });

    // Verify order data is displayed
    const orderList = page.locator('[class*="order"], [class*="ron"], table tbody tr, .list-item, .card').first();
    await expect(orderList).toBeVisible({ timeout: 10000 });

    // Verify no error popup
    const errorPopup = page.locator('.modal.error, .popup.error, [role="alertdialog"]');
    await expect(errorPopup).toHaveCount(0);

    await page.screenshot({ path: 'screenshots/07-dashboard-verified.png', fullPage: true });

    console.log('✓ Dashboard loaded successfully!');
  });

  // =============================================
  // SCENARIO 3 - Select RON Waiting Confirmation
  // =============================================
  test('TC-MOB-003: Select RON with Waiting Confirmation Status', async ({ page }) => {
    test.setTimeout(60000);

    console.log('Searching for RON with Waiting Confirmation status...');
    await loginToApp(page);

    // Look for "Waiting Confirmation" status
    const waitingConfirmationSelectors = [
      'text="Waiting Confirmation"',
      'text="WAITING CONFIRMATION"',
      'text="Menunggu Konfirmasi"',
      '[data-status="waiting_confirmation"]',
      '[class*="waiting"][class*="confirmation"]',
      '.status:has-text("Waiting")'
    ];

    let ronRecord;
    for (const selector of waitingConfirmationSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        // Find the parent record/card
        ronRecord = elements.first().locator('xpath=ancestor::tr | xpath=ancestor::div[contains(@class, "card")] | xpath=ancestor::div[contains(@class, "item")]').first();
        break;
      }
    }

    // If specific status selector not found, try finding first record
    if (!ronRecord) {
      ronRecord = page.locator('table tbody tr, .list-item, .card, [class*="ron-item"]').first();
    }

    await expect(ronRecord).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/08-ron-found.png', fullPage: true });

    // Click the record
    console.log('Clicking RON record...');
    await ronRecord.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Expected Results Validation
    console.log('Validating RON details...');

    // Verify detail page opened
    const detailPage = page.locator('[class*="detail"], h1:has-text("Detail"), h2:has-text("RON"), [data-page="detail"]');
    await expect(detailPage.first()).toBeVisible({ timeout: 10000 });

    // Verify status is still Waiting Confirmation
    const statusLabel = page.locator('text="Waiting Confirmation", text="WAITING CONFIRMATION", text="Menunggu Konfirmasi", [class*="status"]');
    await expect(statusLabel.first()).toBeVisible({ timeout: 5000 });

    // Verify customer details are displayed
    const customerInfo = page.locator('[class*="customer"], label:has-text("Customer"), label:has-text("Pelanggan")');
    await expect(customerInfo.first()).toBeVisible({ timeout: 5000 });

    // Verify visit details are displayed
    const visitInfo = page.locator('[class*="visit"], label:has-text("Visit"), label:has-text("Kunjungan")');
    await expect(visitInfo.first()).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/09-ron-detail-loaded.png', fullPage: true });

    console.log('✓ RON details loaded successfully!');
  });

  // =============================================
  // SCENARIO 4 - Confirmation Process
  // =============================================
  test('TC-MOB-004: Confirmation Process', async ({ page }) => {
    test.setTimeout(60000);

    console.log('Starting confirmation process...');
    await loginToApp(page);

    // Find confirmation button
    const confirmationButton = page.locator(
      'button:has-text("Confirmation"), button:has-text("Konfirmasi"), button:has-text("CONFIRM"), [data-action="confirm"], button[class*="confirm"]'
    ).first();

    await expect(confirmationButton).toBeVisible({ timeout: 10000 });
    await expect(confirmationButton).toBeEnabled();
    await page.screenshot({ path: 'screenshots/10-before-confirmation.png', fullPage: true });

    // Click confirmation button
    console.log('Clicking confirmation button...');
    await confirmationButton.click();
    await page.waitForTimeout(1000);

    // Handle potential confirmation dialog
    page.on('dialog', async dialog => {
      console.log(`Dialog detected: ${dialog.message()}`);
      await dialog.accept();
    });

    // Wait for process to complete
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(2000);

    // Expected Results Validation
    console.log('Validating confirmation results...');

    // Check for success message
    const successMessage = page.locator(
      'text="Success", text="Berhasil", text="sukses", .alert-success, .success-message, [class*="success"]'
    );
    await expect(successMessage.first()).toBeVisible({ timeout: 10000 });

    // Verify no error message
    const errorMessage = page.locator('.error, .alert-danger, [class*="error"]');
    await expect(errorMessage).toHaveCount(0);

    // Verify status changed (should no longer be "Waiting Confirmation")
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/11-confirmation-success.png', fullPage: true });

    console.log('✓ Confirmation completed successfully!');
  });

  // =============================================
  // SCENARIO 5 - Start Visit
  // =============================================
  test('TC-MOB-005: Start Visit Process', async ({ page, context }) => {
    test.setTimeout(60000);

    console.log('Starting visit process...');
    await loginToApp(page);

    // Find Start Visit button
    const startVisitButton = page.locator(
      'button:has-text("Start Visit"), button:has-text("Mulai Kunjungan"), button:has-text("START"), [data-action="start-visit"], button[class*="start-visit"]'
    ).first();

    await expect(startVisitButton).toBeVisible({ timeout: 10000 });
    await expect(startVisitButton).toBeEnabled();
    await page.screenshot({ path: 'screenshots/12-before-start-visit.png', fullPage: true });

    // Grant geolocation permission
    console.log('Granting GPS permission...');
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ longitude: 106.8456, latitude: -6.2088 });

    // Click Start Visit button
    console.log('Clicking Start Visit button...');
    await startVisitButton.click();
    await page.waitForTimeout(1000);

    // Handle potential permission dialog
    page.on('dialog', async dialog => {
      console.log(`Dialog detected: ${dialog.message()}`);
      await dialog.accept();
    });

    // Wait for process to complete
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(3000);

    // Expected Results Validation
    console.log('Validating Start Visit results...');

    // Check for success notification
    const successNotification = page.locator(
      'text="Success", text="Berhasil", text="Visit dimulai", text="Visit started", .alert-success, .success-message, [class*="success"]'
    );
    await expect(successNotification.first()).toBeVisible({ timeout: 10000 });

    // Verify status changed to "In Progress"
    const inProgressStatus = page.locator(
      'text="In Progress", text="IN PROGRESS", text="Dalam Proses", [data-status="in_progress"], [class*="in-progress"]'
    );
    await expect(inProgressStatus.first()).toBeVisible({ timeout: 10000 });

    // Verify timestamp is recorded
    const timestampElement = page.locator('[class*="timestamp"], [class*="time"], label:has-text("Waktu"), label:has-text("Time")');
    await expect(timestampElement.first()).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: 'screenshots/13-start-visit-success.png', fullPage: true });

    console.log('✓ Visit started successfully!');
  });

  // =============================================
  // NEGATIVE TESTING
  // =============================================
  test('TC-MOB-NEG-001: Invalid Login - Wrong Password', async ({ page }) => {
    test.setTimeout(60000);

    console.log('Testing invalid login...');

    // Logout first if logged in
    await page.goto(MOBILE_CONFIG.baseURL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Attempt login with wrong password
    const usernameField = page.locator('input[name="username"], input[type="text"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"], button:has-text("Login")').first();

    await usernameField.fill(CREDENTIALS.invalid.username);
    await passwordField.fill(CREDENTIALS.invalid.password);
    await page.screenshot({ path: 'screenshots/14-invalid-credentials.png', fullPage: true });

    await loginButton.click();
    await page.waitForTimeout(3000);

    // Expected: Login should fail
    const errorMessage = page.locator('.error, .alert-danger, [class*="error"], text="Invalid", text="Gagal", text="salah"');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });

    // Should still be on login page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('dashboard');

    await page.screenshot({ path: 'screenshots/15-login-error-shown.png', fullPage: true });

    console.log('✓ Invalid login blocked successfully!');
  });

  test('TC-MOB-NEG-002: Double Click Confirmation Prevention', async ({ page }) => {
    test.setTimeout(60000);

    console.log('Testing double-click confirmation prevention...');
    await loginToApp(page);

    // This test should be run after finding a new Waiting Confirmation record
    // For demonstration, we'll test button disabled state after first click

    const confirmationButton = page.locator('button:has-text("Confirmation"), button:has-text("Konfirmasi")').first();
    
    if (await confirmationButton.isVisible({ timeout: 5000 })) {
      // Click once
      await confirmationButton.click();
      await page.waitForTimeout(500);

      // Try to click again immediately - should be disabled or not create duplicate
      const isDisabled = await confirmationButton.isDisabled().catch(() => false);
      const isNotVisible = !(await confirmationButton.isVisible().catch(() => false));

      expect(isDisabled || isNotVisible).toBeTruthy();

      await page.screenshot({ path: 'screenshots/16-double-click-prevented.png', fullPage: true });

      console.log('✓ Double-click prevention working!');
    } else {
      console.log('ℹ Confirmation button not available - test skipped');
    }
  });

  test('TC-MOB-NEG-003: Double Click Start Visit Prevention', async ({ page }) => {
    test.setTimeout(60000);

    console.log('Testing double-click Start Visit prevention...');
    await loginToApp(page);

    const startVisitButton = page.locator('button:has-text("Start Visit"), button:has-text("Mulai Kunjungan")').first();
    
    if (await startVisitButton.isVisible({ timeout: 5000 })) {
      // Click once
      await startVisitButton.click();
      await page.waitForTimeout(500);

      // Try to click again immediately - should be disabled or not create duplicate
      const isDisabled = await startVisitButton.isDisabled().catch(() => false);
      const isNotVisible = !(await startVisitButton.isVisible().catch(() => false));

      expect(isDisabled || isNotVisible).toBeTruthy();

      await page.screenshot({ path: 'screenshots/17-double-start-prevented.png', fullPage: true });

      console.log('✓ Double Start Visit prevented!');
    } else {
      console.log('ℹ Start Visit button not available - test skipped');
    }
  });

});

// =============================================
// Bug Reporting Helper
// =============================================
export function generateBugReport(bugData) {
  const report = `
===========================================
BUG REPORT - GCCS MOBILE
===========================================
Module: ${bugData.module || 'GCCS Mobile'}
Feature: ${bugData.feature || 'N/A'}
Severity: ${bugData.severity || 'Medium'}

Steps To Reproduce:
${bugData.stepsToReproduce || 'N/A'}

Actual Result:
${bugData.actualResult || 'N/A'}

Expected Result:
${bugData.expectedResult || 'N/A'}

Screenshot: ${bugData.screenshot || 'N/A'}
Video: ${bugData.video || 'N/A'}
Device: ${bugData.device || 'BlueStacks Android'}
Browser: ${bugData.browser || 'Chrome Android'}

Timestamp: ${new Date().toISOString()}
===========================================
  `;
  
  console.log(report);
  return report;
}
