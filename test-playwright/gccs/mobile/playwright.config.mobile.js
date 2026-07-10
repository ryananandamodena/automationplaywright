// playwright.config.mobile.js - GCCS Mobile Test Configuration

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: '*.spec.js',
  
  // Timeouts
  timeout: 120000, // 2 minutes per test
  expect: { 
    timeout: 15000 // 15 seconds for assertions
  },
  
  // Test execution
  fullyParallel: false, // Run tests sequentially for mobile
  workers: 1, // Single worker for mobile testing
  retries: 2, // Retry failed tests twice
  
  // Reporting
  reporter: [
    ['html', { 
      outputFolder: 'mobile-test-report',
      open: 'never' 
    }],
    ['list'],
    ['json', { 
      outputFile: 'mobile-test-results.json' 
    }],
    ['junit', { 
      outputFile: 'mobile-junit-results.xml' 
    }]
  ],
  
  // Global settings
  use: {
    // Base URL - UPDATE THIS with your actual GCCS Mobile URL
    baseURL: 'https://gccs-mobile-test.modena.com',
    
    // Browser context options
    headless: false, // Show browser for debugging
    viewport: null, // Will be set by device
    
    // Geolocation (Jakarta, Indonesia)
    geolocation: { 
      longitude: 106.8456, 
      latitude: -6.2088 
    },
    permissions: ['geolocation'],
    
    // Locale & Timezone
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    
    // Media
    screenshot: 'on', // Take screenshots for all steps
    video: 'on', // Record video for all tests
    trace: 'on', // Collect trace for debugging
    
    // Network
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // User Agent (optional - mobile Chrome)
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
  },
  
  // Test projects - Mobile devices
  projects: [
    {
      name: 'mobile-android-pixel5',
      use: { 
        ...devices['Pixel 5'],
        // Override with custom settings if needed
      },
    },
    {
      name: 'mobile-android-galaxy',
      use: { 
        ...devices['Galaxy S9+'],
      },
    },
    {
      name: 'mobile-iphone',
      use: { 
        ...devices['iPhone 12'],
      },
    },
  ],
  
  // Web server (if needed to run local dev server)
  // webServer: {
  //   command: 'npm run start:mobile',
  //   port: 3000,
  //   timeout: 120000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
