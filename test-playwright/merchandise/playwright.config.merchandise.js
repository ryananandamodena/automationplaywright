import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  workers: 2,
  retries: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report-merchandise', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://merchandise-dev.modena.com',
    screenshot: 'only-on-failure',
    video: 'off',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],
});
