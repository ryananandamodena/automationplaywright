// mobile-helpers.js - Helper functions for GCCS Mobile Testing

/**
 * Login to GCCS Mobile Application
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @param {string} password
 */
export async function loginMobile(page, username = 'TEC_IDR002', password = 'password.1') {
  console.log(`Logging in as: ${username}`);
  
  // Find and fill username
  const usernameField = page.locator(
    'input[name="username"], input[type="text"], input[placeholder*="username" i]'
  ).first();
  await usernameField.waitFor({ state: 'visible', timeout: 10000 });
  await usernameField.click();
  await usernameField.fill(username);
  
  // Find and fill password
  const passwordField = page.locator(
    'input[name="password"], input[type="password"], input[placeholder*="password" i]'
  ).first();
  await passwordField.waitFor({ state: 'visible', timeout: 10000 });
  await passwordField.click();
  await passwordField.fill(password);
  
  // Click login button
  const loginButton = page.locator(
    'button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Masuk")'
  ).first();
  await loginButton.click();
  
  // Wait for navigation
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

/**
 * Logout from GCCS Mobile
 * @param {import('@playwright/test').Page} page
 */
export async function logoutMobile(page) {
  console.log('Logging out...');
  
  // Try to find logout button/link
  const logoutSelectors = [
    'button:has-text("Logout")',
    'button:has-text("Keluar")',
    'a:has-text("Logout")',
    'a:has-text("Keluar")',
    '[data-action="logout"]'
  ];
  
  for (const selector of logoutSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
      await element.click();
      await page.waitForTimeout(1000);
      return;
    }
  }
  
  // Alternative: clear storage
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
}

/**
 * Find and click RON with specific status
 * @param {import('@playwright/test').Page} page
 * @param {string} status - Status to search for (e.g., "Waiting Confirmation")
 */
export async function findAndClickRON(page, status = 'Waiting Confirmation') {
  console.log(`Finding RON with status: ${status}`);
  
  // Wait for list to load
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  
  // Find RON by status
  const statusSelectors = [
    `text="${status}"`,
    `text="${status.toUpperCase()}"`,
    `[data-status*="${status.toLowerCase().replace(/\s/g, '_')}"]`,
    `[class*="${status.toLowerCase().replace(/\s/g, '-')}"]`
  ];
  
  let ronRecord;
  for (const selector of statusSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    if (count > 0) {
      ronRecord = elements.first().locator('xpath=ancestor::tr | xpath=ancestor::div[contains(@class, "card")] | xpath=ancestor::div[contains(@class, "item")]').first();
      break;
    }
  }
  
  // If not found by status, get first record
  if (!ronRecord) {
    console.log('Status-specific RON not found, using first record');
    ronRecord = page.locator('table tbody tr, .list-item, .card, [class*="ron-item"]').first();
  }
  
  await ronRecord.waitFor({ state: 'visible', timeout: 10000 });
  await ronRecord.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
}

/**
 * Click action button (Confirmation, Start Visit, etc.)
 * @param {import('@playwright/test').Page} page
 * @param {string} actionText - Button text to click
 */
export async function clickActionButton(page, actionText) {
  console.log(`Clicking action button: ${actionText}`);
  
  const button = page.locator(
    `button:has-text("${actionText}"), 
     button[data-action*="${actionText.toLowerCase().replace(/\s/g, '-')}"],
     button[class*="${actionText.toLowerCase().replace(/\s/g, '-')}"]`
  ).first();
  
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await button.click();
  
  // Wait for action to process
  await page.waitForTimeout(1000);
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
}

/**
 * Verify success message appears
 * @param {import('@playwright/test').Page} page
 * @param {number} timeout - Timeout in ms
 */
export async function verifySuccessMessage(page, timeout = 10000) {
  console.log('Verifying success message...');
  
  const successSelectors = [
    'text="Success"',
    'text="Berhasil"',
    'text="sukses"',
    '.alert-success',
    '.success-message',
    '[class*="success"]',
    '[role="alert"]:has-text("Success")',
    '[role="alert"]:has-text("Berhasil")'
  ];
  
  for (const selector of successSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✓ Success message found!');
      return true;
    }
  }
  
  throw new Error('Success message not found');
}

/**
 * Verify no error message appears
 * @param {import('@playwright/test').Page} page
 */
export async function verifyNoError(page) {
  console.log('Verifying no error messages...');
  
  const errorSelectors = [
    '.error',
    '.alert-danger',
    '.alert-error',
    '[class*="error"]',
    '[role="alert"]:has-text("Error")',
    '[role="alert"]:has-text("Gagal")'
  ];
  
  for (const selector of errorSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      const errorText = await page.locator(selector).first().textContent();
      throw new Error(`Error message found: ${errorText}`);
    }
  }
  
  console.log('✓ No error messages found');
  return true;
}

/**
 * Take screenshot with custom name
 * @param {import('@playwright/test').Page} page
 * @param {string} name - Screenshot filename
 */
export async function takeScreenshot(page, name) {
  const filename = `screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ 
    path: filename, 
    fullPage: true 
  });
  console.log(`Screenshot saved: ${filename}`);
  return filename;
}

/**
 * Wait for element and click with retry
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {number} maxRetries
 */
export async function clickWithRetry(page, selector, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const element = page.locator(selector).first();
      await element.waitFor({ state: 'visible', timeout: 5000 });
      await element.click();
      console.log(`✓ Clicked: ${selector}`);
      return;
    } catch (error) {
      console.log(`Retry ${i + 1}/${maxRetries} for: ${selector}`);
      if (i === maxRetries - 1) throw error;
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Scroll to element (useful for mobile views)
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
export async function scrollToElement(page, selector) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
}

/**
 * Grant GPS permissions and set location
 * @param {import('@playwright/test').BrowserContext} context
 * @param {number} longitude
 * @param {number} latitude
 */
export async function setupGPS(context, longitude = 106.8456, latitude = -6.2088) {
  console.log(`Setting GPS location: ${latitude}, ${longitude}`);
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ longitude, latitude });
}

/**
 * Wait for loading to complete
 * @param {import('@playwright/test').Page} page
 * @param {number} timeout
 */
export async function waitForLoading(page, timeout = 15000) {
  console.log('Waiting for loading to complete...');
  
  const loadingSelectors = [
    '.loading',
    '.spinner',
    '[class*="loading"]',
    '[class*="spinner"]',
    '[role="progressbar"]'
  ];
  
  for (const selector of loadingSelectors) {
    await page.locator(selector).waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {});
  }
  
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  console.log('✓ Loading complete');
}

/**
 * Check if element exists (without throwing error)
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 * @param {number} timeout
 */
export async function elementExists(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current page title
 * @param {import('@playwright/test').Page} page
 */
export async function getCurrentPageTitle(page) {
  return await page.title();
}

/**
 * Capture network requests
 * @param {import('@playwright/test').Page} page
 */
export function captureNetworkRequests(page) {
  const requests = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });
  
  page.on('response', response => {
    console.log(`[${response.status()}] ${response.url()}`);
  });
  
  return requests;
}

/**
 * Generate bug report
 * @param {Object} bugData
 */
export function generateBugReport(bugData) {
  const report = `
===========================================
BUG REPORT - GCCS MOBILE
===========================================
Module: ${bugData.module || 'GCCS Mobile'}
Feature: ${bugData.feature || 'N/A'}
Severity: ${bugData.severity || 'Medium'}
Status: ${bugData.status || 'Open'}

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
Test Case ID: ${bugData.testCaseId || 'N/A'}

Environment:
- OS: Android (Emulator)
- App Version: ${bugData.appVersion || 'N/A'}
- Test Date: ${new Date().toISOString()}

Additional Notes:
${bugData.notes || 'N/A'}
===========================================
  `;
  
  console.log(report);
  
  // Optionally write to file
  const fs = require('fs');
  const filename = `bug-reports/bug-${Date.now()}.txt`;
  try {
    fs.writeFileSync(filename, report);
    console.log(`Bug report saved: ${filename}`);
  } catch (error) {
    console.log('Could not save bug report to file');
  }
  
  return report;
}
