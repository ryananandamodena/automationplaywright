/**
 * Simple Applitools Visual Test - Sales Order Page
 * This is a simplified version to get started quickly
 */

import { test, expect } from '@playwright/test';
import { Eyes, Target, VisualGridRunner } from '@applitools/eyes-playwright';

test.describe('Visual Testing - Sales Order (Simple)', () => {
  let eyes;
  let runner;

  test.beforeAll(async () => {
    // Initialize Visual Grid Runner
    runner = new VisualGridRunner({ testConcurrency: 5 });
  });

  test.beforeEach(async ({ page }) => {
    // Initialize Eyes
    eyes = new Eyes(runner);
    
    // Configure Eyes
    eyes.setConfiguration({
      appName: 'Modena MHC',
      testName: 'SO List Page - Visual Check',
      apiKey: process.env.APPLITOOLS_API_KEY,
      
      // Cross-browser configuration
      browsersInfo: [
        { width: 1920, height: 1080, name: 'chrome' },
        { width: 1920, height: 1080, name: 'firefox' },
        { width: 1920, height: 1080, name: 'edge' },
      ],
      
      // Match settings
      matchLevel: 'Strict',
      ignoreDisplacements: true,
    });
  });

  test.afterEach(async () => {
    // Close Eyes
    await eyes.closeAsync();
  });

  test.afterAll(async () => {
    // Get all test results
    const results = await runner.getAllTestResults(false);
    console.log('\n📊 Visual Test Results:');
    console.log(results.toString());
  });

  test('Visual check - Sales Order list page', async ({ page }) => {
    // Open Eyes for this test
    await eyes.open(page, 'Modena MHC', 'SO List Page');

    // Navigate to Sales Order page
    await page.goto('https://mhc-dev.modena.com', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Take full page screenshot
    await eyes.check('SO List - Full Page', 
      Target.window()
        .fully()
        .withName('Sales Order List Page')
    );

    console.log('✅ Visual check completed!');
  });
});
