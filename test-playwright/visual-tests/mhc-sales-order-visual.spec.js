/**
 * Applitools Visual AI Test - MHC Sales Order Page
 * 
 * This test demonstrates Applitools Eyes capabilities:
 * - Visual regression testing
 * - Cross-browser testing (Chrome, Firefox, Edge, Mobile)
 * - AI-powered screenshot comparison
 * - Layout validation
 * - Responsive design testing
 */

import { test } from '@playwright/test';
import { Eyes, Target, VisualGridRunner, BrowserType } from '@applitools/eyes-playwright';
import applitoolsConfig from '../applitools.config.js';

test.describe('Visual AI Testing - MHC Sales Order 🎨', () => {
  let eyes;
  let runner;

  test.beforeAll(async () => {
    // Initialize the Visual Grid Runner for parallel execution
    runner = new VisualGridRunner({ testConcurrency: applitoolsConfig.testConcurrency });
  });

  test.beforeEach(async ({ page }) => {
    // Initialize Eyes SDK
    eyes = new Eyes(runner);
    
    // Apply configuration
    eyes.setConfiguration({
      appName: applitoolsConfig.appName,
      testName: 'MHC Sales Order - Visual Regression',
      batchName: applitoolsConfig.batchName,
      apiKey: applitoolsConfig.apiKey,
      
      // Configure browsers for cross-browser testing
      browsersInfo: applitoolsConfig.browser,
      
      // Match settings
      matchLevel: applitoolsConfig.matchLevel,
      ignoreDisplacements: applitoolsConfig.ignoreDisplacements,
      
      // Layout breakpoints for responsive testing
      layoutBreakpoints: true,
    });
  });

  test.afterEach(async () => {
    // Close Eyes and check results
    await eyes.closeAsync();
  });

  test.afterAll(async () => {
    // Get all test results
    const results = await runner.getAllTestResults(false);
    console.log('\n📊 Visual Test Results Summary:');
    console.log(results.toString());
  });

  test('Visual check - Sales Order list page', async ({ page }) => {
    // Open Eyes
    await eyes.open(page, applitoolsConfig.appName, 'SO List Page');

    // Navigate to page
    await page.goto('https://mhc-dev.modena.com/sales-order', { 
      waitUntil: 'networkidle' 
    });

    // Take full page screenshot
    await eyes.check('Sales Order List - Full Page', 
      Target.window()
        .fully()
        .withName('SO List Full Page')
    );

    // Take viewport screenshot (above the fold)
    await eyes.check('Sales Order List - Above the Fold', 
      Target.window()
        .withName('SO List Viewport')
    );

    // Check specific regions
    await eyes.check('SO List - Table', 
      Target.region('table')
        .withName('Data Table')
    );

    await eyes.check('SO List - Header', 
      Target.region('header, nav')
        .withName('Navigation Header')
    );
  });

  test('Visual check - Sales Order creation wizard', async ({ page }) => {
    await eyes.open(page, applitoolsConfig.appName, 'SO Creation Wizard');

    // Login first
    await page.goto('https://mhc-dev.modena.com');
    await page.locator('input[type="email"]').fill('muhzaenal5@gmail.com');
    await page.locator('input[type="password"]').fill('P@ssw0rd');
    await page.locator('button:has-text("Login")').click();
    await page.waitForTimeout(4000);

    // Navigate to SO
    await page.locator('text="Sales Order"').first().click();
    await page.waitForTimeout(2000);

    // Click Create New
    await page.locator('button:has-text("Create New")').click();
    await page.waitForTimeout(2000);

    // Visual check - Customer selection step
    await eyes.check('SO Wizard - Step 1: Customer Selection', 
      Target.window().fully()
        .withName('Customer Selection Step')
        .layout() // Use layout match level (ignore colors/fonts, focus on structure)
    );

    // Select customer
    const searchInput = page.locator("input[placeholder='Search data...']");
    await searchInput.fill('Dedi');
    await page.waitForTimeout(1000);
    
    await eyes.check('SO Wizard - Customer Search Results', 
      Target.region('table')
        .withName('Customer Search Table')
    );

    const firstCustomerRow = page.locator('table tbody tr').first();
    await firstCustomerRow.click();
    await page.waitForTimeout(1000);

    // Go to Products
    await page.locator('button:has-text("Next Step")').click();
    await page.waitForTimeout(2000);

    // Visual check - Products step
    await eyes.check('SO Wizard - Step 2: Product Selection', 
      Target.window().fully()
        .withName('Product Selection Step')
        .ignoreDisplacements(true) // Ignore if elements shifted slightly
    );

    // Check product card layout
    await eyes.check('SO Wizard - Product Cards Layout', 
      Target.region('.product-card, [class*="product"], [class*="item"]')
        .withName('Product Cards')
        .layout() // Layout-only check
    );
  });

  test('Visual check - Responsive design (mobile vs desktop)', async ({ page }) => {
    await eyes.open(page, applitoolsConfig.appName, 'Responsive Design Test');

    await page.goto('https://mhc-dev.modena.com/sales-order');

    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    
    await eyes.check('Desktop View - 1920x1080', 
      Target.window().fully()
        .withName('Desktop Layout')
    );

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    await eyes.check('Tablet View - 768x1024', 
      Target.window().fully()
        .withName('Tablet Layout')
    );

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await eyes.check('Mobile View - 375x667', 
      Target.window().fully()
        .withName('Mobile Layout')
    );
  });

  test('Visual check - Dark mode vs Light mode (if supported)', async ({ page }) => {
    await eyes.open(page, applitoolsConfig.appName, 'Theme Comparison');

    await page.goto('https://mhc-dev.modena.com/sales-order');

    // Light mode (default)
    await eyes.check('Light Mode', 
      Target.window().fully()
        .withName('Light Theme')
    );

    // Try to toggle dark mode (if button exists)
    const darkModeToggle = page.locator('[aria-label*="dark"], [aria-label*="theme"], button:has-text("Dark")');
    
    if (await darkModeToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
      
      await eyes.check('Dark Mode', 
        Target.window().fully()
          .withName('Dark Theme')
      );
    }
  });

  test('Visual check - Interactive elements (buttons, forms)', async ({ page }) => {
    await eyes.open(page, applitoolsConfig.appName, 'Interactive Elements');

    await page.goto('https://mhc-dev.modena.com/sales-order');
    await page.locator('button:has-text("Create New")').click();
    await page.waitForTimeout(2000);

    // Check button states
    await eyes.check('Buttons - Default State', 
      Target.region('button')
        .withName('All Buttons')
    );

    // Hover state
    const nextButton = page.locator('button:has-text("Next Step")').first();
    await nextButton.hover();
    
    await eyes.check('Button - Hover State', 
      Target.region('button:has-text("Next Step")')
        .withName('Next Button Hover')
    );

    // Focus state
    await nextButton.focus();
    
    await eyes.check('Button - Focus State', 
      Target.region('button:has-text("Next Step")')
        .withName('Next Button Focus')
    );

    // Form validation states
    const searchInput = page.locator("input[placeholder='Search data...']");
    await searchInput.click();
    
    await eyes.check('Input - Focus State', 
      Target.region("input[placeholder='Search data...']")
        .withName('Search Input Focus')
    );

    await searchInput.fill('Test');
    
    await eyes.check('Input - Filled State', 
      Target.region("input[placeholder='Search data...']")
        .withName('Search Input Filled')
    );
  });

  /**
   * ADVANCED FEATURES:
   * 
   * Ignore Regions - Skip specific areas that change frequently:
   * await eyes.check('Page without Timestamp', 
   *   Target.window()
   *     .ignoreRegions('.timestamp', '#dynamic-content')
   * );
   * 
   * Layout Regions - Check structure, ignore content:
   * await eyes.check('Page Layout Only', 
   *   Target.window()
   *     .layoutRegions('.content')
   * );
   * 
   * Strict Regions - Extra strict comparison:
   * await eyes.check('Critical Section', 
   *   Target.window()
   *     .strictRegions('.payment-info')
   * );
   * 
   * Floating Regions - Allow some movement:
   * await eyes.check('Page with Floating Ad', 
   *   Target.window()
   *     .floatingRegion('.ad-banner', 10, 10, 10, 10) // top, right, bottom, left offset
   * );
   */
});
