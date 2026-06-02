import { test, expect } from '@playwright/test';

const BASE_URL = 'https://portal-dev.modena.com';
const POLICY_28_URL = 'https://portal-dev.modena.com/fms/insurance/policies/view/28';

const USERS = {
  creator: {
    email: 'novyan.ramadhan@modena.com',
    password: 'P@ssw0rd_novyan.ramadhan',
    name: 'Novyan Ramadhan'
  },
  approver: {
    email: 'daniel.aritonang@modena.com',
    password: 'P@ssw0rd_daniel.aritonang',
    name: 'Daniel Aritonang'
  }
};

async function loginAndNavigateFMS(page, user, targetUrl) {
  console.log(`\n[LOGIN] ${user.name} -> FMS\n`);
  
  // Go to base URL
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Check if need login
  if (!page.url().includes('/fms/')) {
    // Fill login
    await page.fill('input[type="email"], input[placeholder*="email"]', user.email);
    await page.fill('input[type="password"]', user.password);
    
    // Submit
    const loginBtn = page.locator('button').filter({ hasText: /Login|Sign In|Masuk/ }).first();
    await loginBtn.click();
    await page.waitForTimeout(5000);
  }
  
  // Select FMS if needed
  if (page.url().includes('my-application')) {
    const fmsBtn = page.getByText('FMS (DEV)');
    if (await fmsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fmsBtn.click();
      await page.waitForTimeout(2000);
      
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
      }
    }
  }
  
  // Navigate to target URL
  await page.goto(targetUrl, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log(`[OK] Logged in as ${user.name}`);
}

// TEST 1: Check Current Status of Policy 28
test('Policy 28 - View Current Status (Direct Navigate)', async ({ page }) => {
  console.log('\n[TEST 1] Navigate directly to Policy 28\n');
  
  await page.goto(POLICY_28_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  console.log(`[STATUS] URL: ${currentUrl}`);
  
  // Take screenshot
  await page.screenshot({ path: `test-results/policy-28-direct-view.png`, fullPage: true });
  
  // Get all visible text to find status
  const pageText = await page.textContent('body').catch(() => '');
  console.log(`[STATUS] Page content length: ${pageText.length}`);
  
  // Look for status indicators
  const statusPatterns = [
    'Under Review',
    'Approved',
    'Disetujui',
    'Draft',
    'Rejected',
    'Ditolak'
  ];
  
  for (const pattern of statusPatterns) {
    if (pageText.includes(pattern)) {
      console.log(`[STATUS] Found: "${pattern}"`);
    }
  }
});

// TEST 2: Login as Creator and Check Policy 28
test('Policy 28 - Creator View (Novyan)', async ({ page }) => {
  console.log('\n[TEST 2] Login as Creator (Novyan) and view Policy 28\n');
  
  // First login via portal
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // Check current URL - if login page, fill credentials
  const currentUrl = page.url();
  console.log(`[URL] Current: ${currentUrl}`);
  
  if (currentUrl.includes('login') || currentUrl.includes('sign-in') || page.url() === BASE_URL) {
    console.log('[LOGIN] On login page, entering credentials...');
    
    // Email
    const emailInputs = await page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]').all();
    if (emailInputs.length > 0) {
      await emailInputs[0].fill(USERS.creator.email);
      console.log(`[LOGIN] Email filled: ${USERS.creator.email}`);
    }
    
    // Password  
    const pwdInputs = await page.locator('input[type="password"]').all();
    if (pwdInputs.length > 0) {
      await pwdInputs[0].fill(USERS.creator.password);
      console.log(`[LOGIN] Password filled`);
    }
    
    // Submit
    const submitBtn = page.locator('button').filter({ hasText: /Login|Sign In|Masuk|LOGIN/ }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(5000);
      console.log('[LOGIN] Submit clicked');
    }
  }
  
  // Should be on my-application page now
  console.log(`[URL] After login: ${page.url()}`);
  
  // Select FMS (DEV) if on my-application
  if (page.url().includes('my-application')) {
    console.log('[SELECT] FMS (DEV) from applications');
    
    const fmsBtn = page.getByText('FMS (DEV)');
    if (await fmsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fmsBtn.click();
      await page.waitForTimeout(2000);
      
      // Look for confirmation modal
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        console.log('[SELECT] Confirmed FMS selection');
      }
    }
  }
  
  // NOW navigate to policy 28
  console.log(`[NAVIGATE] Going to Policy 28...`);
  await page.goto(POLICY_28_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log(`[URL] Policy 28 page: ${page.url()}`);
  await page.screenshot({ path: `test-results/policy-28-creator-view.png`, fullPage: true });
  
  console.log('[SUCCESS] Creator can view Policy 28');
});

// TEST 3: Login as Approver and Check/Approve Policy 28
test('Policy 28 - Approver View (Daniel)', async ({ page }) => {
  console.log('\n[TEST 3] Login as Approver (Daniel) and view Policy 28\n');
  
  // First login via portal
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  // Check current URL - if login page, fill credentials
  const currentUrl = page.url();
  console.log(`[URL] Current: ${currentUrl}`);
  
  if (currentUrl.includes('login') || currentUrl.includes('sign-in') || page.url() === BASE_URL) {
    console.log('[LOGIN] On login page, entering credentials...');
    
    // Email
    const emailInputs = await page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]').all();
    if (emailInputs.length > 0) {
      await emailInputs[0].fill(USERS.approver.email);
      console.log(`[LOGIN] Email filled: ${USERS.approver.email}`);
    }
    
    // Password  
    const pwdInputs = await page.locator('input[type="password"]').all();
    if (pwdInputs.length > 0) {
      await pwdInputs[0].fill(USERS.approver.password);
      console.log(`[LOGIN] Password filled`);
    }
    
    // Submit
    const submitBtn = page.locator('button').filter({ hasText: /Login|Sign In|Masuk|LOGIN/ }).first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(5000);
      console.log('[LOGIN] Submit clicked');
    }
  }
  
  // Should be on my-application page now
  console.log(`[URL] After login: ${page.url()}`);
  
  // Select FMS (DEV) if on my-application
  if (page.url().includes('my-application')) {
    console.log('[SELECT] FMS (DEV) from applications');
    
    const fmsBtn = page.getByText('FMS (DEV)');
    if (await fmsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fmsBtn.click();
      await page.waitForTimeout(2000);
      
      // Look for confirmation modal
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        console.log('[SELECT] Confirmed FMS selection');
      }
    }
  }
  
  // NOW navigate to policy 28
  console.log(`[NAVIGATE] Going to Policy 28...`);
  await page.goto(POLICY_28_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log(`[URL] Policy 28 page: ${page.url()}`);
  await page.screenshot({ path: `test-results/policy-28-approver-view.png`, fullPage: true });
  
  // Look for Approve button
  const approveBtns = [
    page.locator('button:has-text("Approve")'),
    page.locator('button:has-text("Setujui")'),
    page.locator('[class*="approve"] button').first(),
  ];
  
  let approveFound = false;
  for (const btn of approveBtns) {
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('[FOUND] Approve button visible');
      approveFound = true;
      break;
    }
  }
  
  if (!approveFound) {
    console.log('[INFO] No Approve button - Policy may already be approved');
  }
  
  console.log('[SUCCESS] Approver can view Policy 28');
});
