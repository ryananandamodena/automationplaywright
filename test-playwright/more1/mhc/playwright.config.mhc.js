import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './mhc/staging',
  workers: 1,
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  use: {
    headless: false,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
