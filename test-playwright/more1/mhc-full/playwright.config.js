import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './specs',
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  reporter: [
    ['line'],
    ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }],
    ['json', { outputFile: path.join(__dirname, 'test-results', 'results.json') }],
  ],
  use: {
    baseURL: 'https://mhc-dev.modena.com',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    headless: process.env.PLAYWRIGHT_HEADLESS === 'true' || !!process.env.CI,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
