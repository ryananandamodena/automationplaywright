import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: './',
  
  // ⚡ PARALLEL EXECUTION - Run tests faster!
  // CI: 4 workers, Local: 2 workers for better resource usage
  workers: process.env.CI ? 4 : 2,
  
  // Retries for flaky tests
  retries: process.env.CI ? 2 : 1,
  
  // Timeouts
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'], // Console output
    ['json', { outputFile: 'test-results/results.json' }],
    ['allure-playwright', { 
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: true,
      categories: [
        {
          name: 'Failed Tests',
          matchedStatuses: ['failed']
        },
        {
          name: 'Flaky Tests', 
          matchedStatuses: ['failed'],
          messageRegex: '.*timeout.*'
        }
      ],
      environmentInfo: {
        'Test Environment': process.env.BASE_URL || 'https://portal-dev.modena.com',
        'Node Version': process.version,
        'OS': process.platform
      }
    }]
  ],
  
  // Global settings for all tests
  use: {
    // Base URL for navigations
    baseURL: process.env.BASE_URL || 'https://portal-dev.modena.com',
    
    // Screenshots on failure
    screenshot: 'only-on-failure',
    
    // Video recording
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
    // Trace recording for debugging
    trace: process.env.CI ? 'retain-on-failure' : 'off',
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 15000,
  },
  
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: process.env.CI ? true : false,
        storageState: path.join(__dirname, 'storageState.json'),
      },
    },
  ],
});
