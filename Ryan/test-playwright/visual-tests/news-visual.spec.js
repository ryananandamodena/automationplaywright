/**
 * Applitools Visual Test - News Module
 * Tests visual appearance of News pages across browsers
 */

import { test, expect } from '@playwright/test';
import { Eyes, Target, VisualGridRunner } from '@applitools/eyes-playwright';

test.describe('Visual Testing - News Module 📰', () => {
  let eyes;
  let runner;

  test.beforeAll(async () => {
    // Initialize Visual Grid Runner for parallel execution
    runner = new VisualGridRunner({ testConcurrency: 5 });
  });

  test.beforeEach(async ({ page }) => {
    // Initialize Eyes SDK
    eyes = new Eyes(runner);
    
    // Configure Applitools Eyes
    eyes.setConfiguration({
      appName: 'Modena MHC',
      testName: 'News Module - Visual Check',
      apiKey: process.env.APPLITOOLS_API_KEY,
      
      // Cross-browser testing
      browsersInfo: [
        { width: 1920, height: 1080, name: 'chrome' },
        { width: 1920, height: 1080, name: 'firefox' },
        { width: 1920, height: 1080, name: 'edgechromium' },
        { width: 1366, height: 768, name: 'chrome' },  // Laptop
        { width: 375, height: 667, name: 'chrome' },   // Mobile
      ],
      
      // Visual comparison settings
      matchLevel: 'Strict',
      ignoreDisplacements: true,
      saveDiffs: true,
    });
  });

  test.afterEach(async () => {
    // Close Eyes and collect results
    await eyes.closeAsync();
  });

  test.afterAll(async () => {
    // Get all test results summary
    const results = await runner.getAllTestResults(false);
    console.log('\n📊 Visual Test Results Summary:');
    console.log(results.toString());
  });

  test('Visual check - News list page', async ({ page }) => {
    // Open Eyes for this test
    await eyes.open(page, 'Modena MHC', 'News List Page');

    // Navigate to News page
    console.log('🔍 Navigating to News page...');
    await page.goto('https://mhc-dev.modena.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait for page load
    await page.waitForTimeout(2000);

    // Take full page screenshot
    console.log('📸 Taking full page screenshot...');
    await eyes.check('News List - Full Page', 
      Target.window()
        .fully()
        .withName('News List Page - Complete View')
    );

    // Take viewport screenshot (above the fold)
    console.log('📸 Taking viewport screenshot...');
    await eyes.check('News List - Viewport', 
      Target.window()
        .withName('News List Page - Above the Fold')
    );

    console.log('✅ News list page visual check completed!');
  });

  test('Visual check - News list with filters', async ({ page }) => {
    await eyes.open(page, 'Modena MHC', 'News Filters');

    // Navigate
    await page.goto('https://mhc-dev.modena.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);

    // Check if there are filter elements
    const hasFilters = await page.locator('input[type="search"], input[placeholder*="Search"]').count();
    
    if (hasFilters > 0) {
      console.log('📸 Capturing page with search/filter...');
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
      await searchInput.click();
      await page.waitForTimeout(500);
      
      // Screenshot with search focused
      await eyes.check('News - Search Focused', 
        Target.window()
          .withName('News Search Input Focused')
      );
    } else {
      console.log('📸 Capturing default view...');
      await eyes.check('News - Default View', 
        Target.window()
          .withName('News Default State')
      );
    }

    console.log('✅ News filters visual check completed!');
  });

  test('Visual check - News responsive design', async ({ page }) => {
    await eyes.open(page, 'Modena MHC', 'News Responsive');

    // Navigate
    await page.goto('https://mhc-dev.modena.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);

    // Desktop view
    console.log('📱 Testing Desktop view (1920x1080)...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await eyes.check('News - Desktop View', 
      Target.window().fully().withName('News Desktop 1920x1080')
    );

    // Tablet view
    console.log('📱 Testing Tablet view (768x1024)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await eyes.check('News - Tablet View', 
      Target.window().fully().withName('News Tablet 768x1024')
    );

    // Mobile view
    console.log('📱 Testing Mobile view (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await eyes.check('News - Mobile View', 
      Target.window().fully().withName('News Mobile 375x667')
    );

    console.log('✅ News responsive design check completed!');
  });

  test('Visual check - News detail/create page', async ({ page }) => {
    await eyes.open(page, 'Modena MHC', 'News Detail/Create');

    // Navigate
    await page.goto('https://mhc-dev.modena.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    await page.waitForTimeout(2000);

    // Try to find "Create" or "Add" button for News
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), a:has-text("Create"), a:has-text("Add")').first();
    
    const hasCreateButton = await createButton.count() > 0;
    
    if (hasCreateButton) {
      console.log('🔘 Clicking Create/Add button...');
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Screenshot of create/detail page
      await eyes.check('News - Create/Detail Page', 
        Target.window().fully()
          .withName('News Create Form or Detail View')
      );
    } else {
      console.log('📸 Capturing current state (no create button found)...');
      await eyes.check('News - Current State', 
        Target.window().fully()
          .withName('News Page State')
      );
    }

    console.log('✅ News detail/create page visual check completed!');
  });
});
