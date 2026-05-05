import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: './',
  workers: 1,
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
        ignoreHTTPSErrors: true,
        storageState: path.join(__dirname, 'storageState.json')
      },
    },
  ],
});
