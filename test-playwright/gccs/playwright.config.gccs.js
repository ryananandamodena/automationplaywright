import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './',
  testMatch: ['specs/**/*.spec.js', 'grading/tests/**/*.spec.{js,ts}'],
  timeout: 60000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { outputFolder: 'gccs-report' }], ['list']],
  use: {
    baseURL: process.env.GCCS_BASE_URL || 'https://gccs-test.modena.com',
    headless: false,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'gccs-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
