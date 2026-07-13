import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function globalSetup(config) {
  const baseURL = process.env.BASE_URL || 'https://portal-dev.modena.com';
  const email = process.env.ADMIN_EMAIL || 'ryan.ananda@modena.com';
  const password = process.env.ADMIN_PASSWORD || 'P@ssw0rd_ryan.ananda';

  const browser = await chromium.launch();
  const page = await browser.newPage({ ignoreHTTPSErrors: true });

  await page.goto(`${baseURL}/login`, { waitUntil: 'load', timeout: 60000 });

  const emailField = page.locator('input[type="email"], input[name="email"]').first();
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(email);
    await page.locator('input[type="password"]').first().fill(password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL('**/my-application', { timeout: 15000 });
  }

  await page.context().storageState({ path: path.join(__dirname, 'storageState.json') });
  await browser.close();
}
