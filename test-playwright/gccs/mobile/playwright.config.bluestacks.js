// playwright.config.bluestacks.js - Config untuk testing dengan BlueStacks

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: '*.spec.js',
  
  // Timeouts
  timeout: 120000,
  expect: { timeout: 15000 },
  
  // Test execution
  fullyParallel: false,
  workers: 1,
  retries: 2,
  
  // Reporting
  reporter: [
    ['html', { outputFolder: 'mobile-test-report' }],
    ['list'],
    ['json', { outputFile: 'mobile-test-results.json' }]
  ],
  
  use: {
    // OPTION 1: Connect to Chrome in BlueStacks via Remote Debugging
    // Uncomment this if you want to connect to Chrome running in BlueStacks
    // connectOptions: {
    //   wsEndpoint: 'ws://localhost:9222/devtools/browser',
    // },
    
    // OPTION 2: Regular testing (Recommended)
    // Playwright will use its own browser
    baseURL: process.env.MOBILE_BASE_URL || 'https://gccs-mobile-test.modena.com',
    
    // Mobile emulation - matches typical Android device
    ...devices['Pixel 5'],
    
    // Geolocation (Jakarta, Indonesia)
    geolocation: { 
      longitude: 106.8456, 
      latitude: -6.2088 
    },
    permissions: ['geolocation'],
    
    // Locale & Timezone
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    
    // Browser settings
    headless: false, // Show browser
    
    // Media
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    
    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  
  projects: [
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
  ],
});
