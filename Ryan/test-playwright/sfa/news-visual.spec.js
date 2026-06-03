/**
 * Applitools Visual AI Test - SFA News Module
 * Tests visual appearance of SFA News pages across browsers
 */

import { test, expect } from '@playwright/test';
import { Eyes, Target, VisualGridRunner } from '@applitools/eyes-playwright';

// Configuration
const BASE_URL = 'https://portal-dev.modena.com';
const NEWS_URL = `${BASE_URL}/sfa/scc-news`;
const USERNAME = 'ade.maradona@modena.com';
const PASSWORD = 'P@ssw0rd_ade.maradona';
const APP_NAME = 'SFA - Sales Force Automation';

test.describe('Visual AI Testing - SFA News Module 📰', () => {
  let eyes;
  let runner;

  test.beforeAll(async () => {
    // Initialize Visual Grid Runner for parallel execution
    runner = new VisualGridRunner({ testConcurrency: 5 });
  });

  test.beforeEach(async ({ page }) => {
    // Initialize Applitools Eyes
    eyes = new Eyes(runner);
    
    // Configure Eyes with cross-browser settings
    eyes.setConfiguration({
      appName: APP_NAME,
      testName: 'SFA News - Visual Check',
      apiKey: process.env.APPLITOOLS_API_KEY,
      
      // Cross-browser testing (Ultra Fast Grid)
      browsersInfo: [
        { width: 1920, height: 1080, name: 'chrome' },
        { width: 1920, height: 1080, name: 'firefox' },
        { width: 1920, height: 1080, name: 'edgechromium' },
        { width: 1366, height: 768, name: 'chrome' },  // Laptop
      ],
      
      // Visual comparison settings
      matchLevel: 'Strict',
      ignoreDisplacements: true,
      saveDiffs: true,
      waitBeforeScreenshots: 1000,
    });

    // Increase timeout for slower SFA pages
    test.setTimeout(180000); // 3 minutes
  });

  test.afterEach(async () => {
    // Close Eyes and finalize test
    await eyes.closeAsync();
  });

  test.afterAll(async () => {
    // Get all test results
    const results = await runner.getAllTestResults(false);
    console.log('\n📊 SFA News Visual Test Results:');
    console.log(results.toString());
  });

  /**
   * Helper: Login to SFA Portal
   */
  async function loginToSFA(page) {
    console.log('🔐 Logging in to SFA Portal...');
    
    await page.goto(`${BASE_URL}/login`, { 
      timeout: 60000, 
      waitUntil: 'domcontentloaded' 
    });
    await page.waitForTimeout(2000);

    // Check if already logged in
    const emailField = page.locator('input[name="email"]').first();
    const isLoginPage = await emailField.isVisible({ timeout: 3000 }).catch(() => false);

    if (isLoginPage) {
      console.log('📝 Filling login credentials...');
      await emailField.fill(USERNAME);
      await page.locator('input[name="password"]').fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
      await page.waitForTimeout(4000);
      console.log('✅ Login successful!');
    } else {
      console.log('✅ Already authenticated');
    }
  }

  /**
   * Helper: Navigate to SCC News
   */
  async function navigateToNews(page) {
    console.log('📍 Navigating to SCC News...');
    
    await page.goto(NEWS_URL, { 
      timeout: 60000, 
      waitUntil: 'domcontentloaded' 
    });
    await page.waitForTimeout(3000);

    // Handle SFA authentication redirect
    if (page.url().includes('/sfa/authentication')) {
      console.log('⏳ Waiting for SFA authentication redirect...');
      await page.waitForURL('**/scc-news**', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    // Re-navigate if needed
    if (!page.url().includes('scc-news')) {
      console.log('🔄 Re-navigating to SCC News...');
      await page.goto(NEWS_URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    // Wait for table to load
    await page.waitForSelector('table.m-table, .card-body', { timeout: 20000 }).catch(() => {});
    
    console.log('✅ News page loaded!');
  }

  test('Visual check - News list page', async ({ page }) => {
    // Open Eyes session
    await eyes.open(page, APP_NAME, 'SFA News List');

    // Login and navigate
    await loginToSFA(page);
    await navigateToNews(page);

    console.log('📸 Taking News list page screenshots...');

    // Full page screenshot
    await eyes.check('News List - Full Page', 
      Target.window()
        .fully()
        .withName('SFA News List Complete View')
    );

    // Viewport screenshot (above the fold)
    await eyes.check('News List - Viewport', 
      Target.window()
        .withName('SFA News List - Above the Fold')
    );

    // Check data table region
    try {
      const tableExists = await page.locator('table.m-table').isVisible({ timeout: 3000 });
      if (tableExists) {
        await eyes.check('News List - Table', 
          Target.region('table.m-table')
            .withName('News Data Table')
        );
      }
    } catch (e) {
      console.log('⚠️ Table not found, skipping table region check');
    }

    console.log('✅ News list visual check completed!');
  });

  test('Visual check - News create form', async ({ page }) => {
    await eyes.open(page, APP_NAME, 'SFA News Create Form');

    // Login and navigate
    await loginToSFA(page);
    await navigateToNews(page);

    console.log('➕ Opening create form...');

    // Click Add button
    const addBtn = page.locator('button.btn-info, button:has-text("Add"), button:has-text("Tambah")').first();
    const hasAddBtn = await addBtn.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (hasAddBtn) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      console.log('📸 Taking create form screenshots...');

      // Full form screenshot
      await eyes.check('News Create Form - Full', 
        Target.window()
          .fully()
          .withName('News Create Form Complete')
      );

      // Form viewport
      await eyes.check('News Create Form - Viewport', 
        Target.window()
          .withName('News Create Form Above Fold')
      );

      console.log('✅ Create form visual check completed!');
    } else {
      console.log('⚠️ Add button not found, skipping create form check');
      
      // Take current state instead
      await eyes.check('News Page - Current State', 
        Target.window()
          .withName('News Page State')
      );
    }
  });

  test('Visual check - News responsive design', async ({ page }) => {
    await eyes.open(page, APP_NAME, 'SFA News Responsive');

    // Login and navigate
    await loginToSFA(page);
    await navigateToNews(page);

    console.log('📱 Testing responsive design...');

    // Desktop view
    console.log('📱 Desktop view (1920x1080)...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1500);
    await eyes.check('News - Desktop View', 
      Target.window().fully().withName('Desktop 1920x1080')
    );

    // Tablet view
    console.log('📱 Tablet view (768x1024)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1500);
    await eyes.check('News - Tablet View', 
      Target.window().fully().withName('Tablet 768x1024')
    );

    // Mobile view
    console.log('📱 Mobile view (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);
    await eyes.check('News - Mobile View', 
      Target.window().fully().withName('Mobile 375x667')
    );

    console.log('✅ Responsive design check completed!');
  });

  test('Visual check - News search and filters', async ({ page }) => {
    await eyes.open(page, APP_NAME, 'SFA News Search');

    // Login and navigate
    await loginToSFA(page);
    await navigateToNews(page);

    console.log('🔍 Testing search and filters...');

    // Check for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Cari"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSearch) {
      // Focus on search
      await searchInput.click();
      await page.waitForTimeout(500);

      await eyes.check('News - Search Focused', 
        Target.window()
          .withName('Search Input Focused')
      );

      // Type search term
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      await eyes.check('News - Search with Query', 
        Target.window()
          .withName('Search Results')
      );
    } else {
      console.log('⚠️ Search input not found');
      
      // Capture default view
      await eyes.check('News - Default View', 
        Target.window()
          .withName('News Default State')
      );
    }

    console.log('✅ Search and filters visual check completed!');
  });
});
