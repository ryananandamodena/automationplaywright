import fs from 'node:fs';
import path from 'node:path';
import { _android } from 'playwright';

const BASE_URL = process.env.MOBILE_BASE_URL || 'https://gccs-mobile-test.modena.com';
const USERNAME = process.env.TEST_USERNAME || 'TEC_IDR002';
const PASSWORD = process.env.TEST_PASSWORD || 'password.1';
const SERIAL = process.env.MEMU_SERIAL || '127.0.0.1:21503';

const artifactsDir = path.resolve('playwright-server/test-playwright/gccs/mobile/test-results-memu');
if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timeout waiting for ${label} (${ms}ms)`)), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

function nowTag() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function findFirstVisible(page, selectors) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    try {
      if (await loc.isVisible({ timeout: 2000 })) return loc;
    } catch {
      // Try next selector.
    }
  }
  return null;
}

(async () => {
  console.log(`[MEMU] Discovering Android devices...`);
  const devices = await _android.devices();
  const device = devices.find(d => d.serial() === SERIAL);
  if (!device) {
    throw new Error(`MEmu device not found for serial ${SERIAL}. Check adb devices.`);
  }

  console.log(`[MEMU] Device attached: ${SERIAL}`);
  console.log('[MEMU] Launching browser context on emulator...');
  const context = await withTimeout(
    device.launchBrowser({ proxy: undefined }),
    60000,
    'device.launchBrowser'
  );

  try {
    console.log('[MEMU] Creating new page...');
    const page = await withTimeout(context.newPage(), 30000, 'context.newPage');

    console.log(`[MEMU] Open URL: ${BASE_URL}`);
    await withTimeout(
      page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 }),
      50000,
      'page.goto'
    );
    await page.screenshot({ path: path.join(artifactsDir, `${nowTag()}-01-open.png`) });

    const usernameField = await findFirstVisible(page, [
      'input[name="username"]',
      'input[type="text"]',
      'input[placeholder*="username" i]'
    ]);

    const passwordField = await findFirstVisible(page, [
      'input[name="password"]',
      'input[type="password"]',
      'input[placeholder*="password" i]'
    ]);

    const loginButton = await findFirstVisible(page, [
      'button[type="submit"]',
      'button:has-text("Login")',
      'button:has-text("Masuk")',
      'button:has-text("Sign In")'
    ]);

    if (!usernameField || !passwordField || !loginButton) {
      throw new Error('Login form elements were not found on emulator browser page.');
    }

    await usernameField.fill(USERNAME);
    await passwordField.fill(PASSWORD);
    await page.screenshot({ path: path.join(artifactsDir, `${nowTag()}-02-filled.png`) });

    await loginButton.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactsDir, `${nowTag()}-03-after-login.png`) });

    const currentUrl = page.url();
    console.log(`[MEMU] Current URL: ${currentUrl}`);

    const hasDashboard = /dashboard/i.test(currentUrl) || await page.locator('text=Dashboard, h1:has-text("Dashboard"), h2:has-text("Dashboard")').first().isVisible().catch(() => false);

    if (!hasDashboard) {
      throw new Error('Login flow executed, but dashboard indicator was not found.');
    }

    console.log('[MEMU] Login test passed on emulator browser.');
  } finally {
    await context.close();
    await device.close();
  }
})().catch(err => {
  console.error(`[MEMU] FAILED: ${err.message}`);
  process.exit(1);
});
