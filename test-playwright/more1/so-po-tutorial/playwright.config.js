/**
 * Playwright Config — SO & PO Tutorial Tests
 *
 * Dedicated config for video-tutorial test cases.
 * Key settings:
 *   - workers: 1 (serial execution — PO depends on SO)
 *   - video: 'on' (always record)
 *   - screenshot: 'on' (always capture)
 *   - viewport: 1280×720 (tutorial-friendly)
 */

import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './specs',

  /* Serial execution — PO tests depend on SO numbers */
  workers: 1,

  /* Allow retries on flaky network */
  retries: 1,

  /* Generous timeout for E2E flows */
  timeout: 180_000,
  expect: { timeout: 10_000 },

  /* Reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }],
    ['json', { outputFile: path.join(__dirname, 'test-results', 'results.json') }],
  ],

  use: {
    /* Base URL */
    baseURL: process.env.MORE_BASE_URL || 'https://more-dev.modena.com',

    /* Always record video — core requirement for tutorial */
    video: 'on',

    /* Always take screenshots */
    screenshot: 'on',

    /* Trace on failure for debugging */
    trace: 'retain-on-failure',

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,

    /* Tutorial-friendly viewport */
    viewport: { width: 1280, height: 720 },

    /* Action & navigation timeouts */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'tutorial-chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: process.env.PLAYWRIGHT_HEADLESS === 'true' || !!process.env.CI,
      },
    },
  ],
});
