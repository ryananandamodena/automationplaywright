import { test, expect } from '@playwright/test';
import { Eyes, Target, VisualGridRunner } from '@applitools/eyes-playwright';

/**
 * 🤖 APPLITOOLS VISUAL AI TESTING - Prive Living
 * 
 * Updated to use VisualGridRunner (Ultra Fast Grid) for:
 * - Faster execution (10x speed improvement)
 * - Parallel browser testing
 * - Better reliability
 * 
 * Features:
 * 1. AI-powered screenshot comparison
 * 2. Cross-browser testing (Chrome, Firefox, Edge)
 * 3. Responsive design validation
 * 4. Visual regression detection
 */

// ─────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────

const APP_NAME = 'Prive Living';
const BATCH_NAME = 'Prive Visual Regression';
const PRIVE_URL = 'https://prive-living.com';

// ─────────────────────────────────────────────────────────────────
// TESTS - Prive Living Visual Regression
// ─────────────────────────────────────────────────────────────────

test.describe('Prive Living - Visual AI Testing 🏠', () => {
  let eyes;
  let runner;

  test.beforeAll(async () => {
    // Initialize Visual Grid Runner for Ultra Fast execution
    runner = new VisualGridRunner({ testConcurrency: 5 });
  });

  test.beforeEach(async ({ page }) => {
    // Initialize Applitools Eyes
    eyes = new Eyes(runner);
    
    // Configure Eyes with cross-browser settings
    eyes.setConfiguration({
      appName: APP_NAME,
      testName: 'Prive Visual Regression',
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
      waitBeforeScreenshots: 1000, // Wait for animations
    });

    // Increase Playwright timeout for slow websites
    test.setTimeout(120000); // 2 minutes
  });

  test.afterEach(async () => {
    // Close Eyes and finalize test
    await eyes.closeAsync();
  });

  test.afterAll(async () => {
    // Get all test results
    const results = await runner.getAllTestResults(false);
    console.log('\n📊 Prive Visual Test Results:');
    console.log(results.toString());
  });

  test('Visual check - Homepage', async ({ page }) => {
    // Open Eyes session
    await eyes.open(page, APP_NAME, 'Prive Homepage');

    console.log('🌐 Loading Prive Living homepage...');
    
    // Navigate with extended timeout
    await page.goto(PRIVE_URL, { 
      waitUntil: 'domcontentloaded', // Changed from 'networkidle' (faster)
      timeout: 60000 
    });
    
    // Wait for page to settle
    await page.waitForTimeout(3000);

    // Close any popups
    try {
      const closeButton = page.locator('button[aria-label*="Close"], .qodef-popup-close, .mfp-close').first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      console.log('⚠️ No popup found or already closed');
    }

    console.log('📸 Taking homepage screenshot...');
    
    // Take full page screenshot
    await eyes.check('Homepage - Full Page', 
      Target.window()
        .fully()
        .withName('Prive Homepage Complete')
    );

    console.log('✅ Homepage visual check completed!');
  });

  test('Visual check - Responsive Design', async ({ page }) => {
    await eyes.open(page, APP_NAME, 'Prive Responsive');

    console.log('🌐 Loading homepage for responsive test...');
    await page.goto(PRIVE_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await page.waitForTimeout(2000);

    // Desktop
    console.log('📱 Testing Desktop view...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1500);
    await eyes.check('Desktop 1920x1080', 
      Target.window().fully().withName('Desktop View')
    );

    // Tablet
    console.log('📱 Testing Tablet view...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1500);
    await eyes.check('Tablet 768x1024', 
      Target.window().fully().withName('Tablet View')
    );

    // Mobile
    console.log('📱 Testing Mobile view...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);
    await eyes.check('Mobile 375x667', 
      Target.window().fully().withName('Mobile View')
    );

    console.log('✅ Responsive design check completed!');
  });

  test('Visual check - Hero Section Only', async ({ page }) => {
    await eyes.open(page, APP_NAME, 'Prive Hero Section');

    console.log('🌐 Loading homepage...');
    await page.goto(PRIVE_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    await page.waitForTimeout(2000);

    // Close popup
    try {
      await page.locator('button[aria-label*="Close"]').first().click({ timeout: 2000 });
      await page.waitForTimeout(500);
    } catch (e) { /* ignore */ }

    console.log('📸 Capturing Hero section...');
    
    // Viewport screenshot (hero section above the fold)
    await eyes.check('Hero Section - Viewport', 
      Target.window()
        .withName('Hero Section Above Fold')
    );

    // Try to capture specific hero region if it exists
    try {
      const heroExists = await page.locator('section:first-of-type, .hero, [class*="hero"]').first().isVisible({ timeout: 3000 });
      if (heroExists) {
        await eyes.check('Hero Section - Region', 
          Target.region('section:first-of-type, .hero, [class*="hero"]')
            .withName('Hero Region')
        );
      }
    } catch (e) {
      console.log('⚠️ Hero region selector not found, using viewport only');
    }

    console.log('✅ Hero section check completed!');
  });
});
