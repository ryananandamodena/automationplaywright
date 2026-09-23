// Browser-based stress test for MHC: N concurrent authenticated sessions
// navigating Login -> Sales Order -> Purchase Order.
//
// Usage:
//   cd test-playwright/performance
//   node browser-stress-mhc.mjs                 # 20 concurrent sessions (default)
//   node browser-stress-mhc.mjs --sessions=50    # 50 concurrent sessions
//   node browser-stress-mhc.mjs --sessions=30 --headed
//
// Credentials can be overridden via env vars STRESS_EMAIL / STRESS_PASSWORD.

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);

const SESSIONS = Number(args.sessions || 20);
const HEADED = !!args.headed;
const BASE_URL = 'https://more-dev.modena.com';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

const PAGES = [
  { name: 'sales-order', path: '/mhc/sales-order' },
  { name: 'purchase-order', path: '/mhc/purchase-order' },
];

async function runSession(browser, id) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const result = { id, ok: true, errors: [], timings: {} };

  try {
    let t0 = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    await page.locator('input[name="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);

    const companyBtn = page.locator('button:has-text("Select a company")');
    if (await companyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await companyBtn.click();
      await page.waitForTimeout(800);
      await page.locator('button:has-text("MODENA HOME CENTER (MHC)")').click();
      await page.waitForTimeout(400);
    }

    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL(/\/mhc/, { timeout: 45000 }).catch(() => {});
    await page.waitForSelector('aside, nav, header', { timeout: 45000 }).catch(() => {});
    result.timings.login = Date.now() - t0;

    const stillLogin = await page.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (stillLogin) {
      const errAlert = page.locator('[class*="error"], [class*="alert"], .text-red-500, [role="alert"]');
      const errText = await errAlert.first().textContent({ timeout: 1000 }).catch(() => '');
      throw new Error(`login failed (still on login form)${errText ? ': ' + errText.trim() : ''}`);
    }

    for (const p of PAGES) {
      t0 = Date.now();
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);
      result.timings[p.name] = Date.now() - t0;

      const title = await page.title().catch(() => '');
      const bodyText = await page.locator('body').innerText().catch(() => '');
      if (/^(404|500|403|error|not found)/i.test(title) || /Access Denied|Internal Server Error|Forbidden/i.test(bodyText.slice(0, 200))) {
        throw new Error(`error page on ${p.name}: title="${title}"`);
      }
    }
  } catch (err) {
    result.ok = false;
    result.errors.push(err.message);
  } finally {
    await context.close();
  }
  return result;
}

async function main() {
  console.log(`Starting MHC browser stress test: ${SESSIONS} concurrent sessions`);
  console.log(`Target: ${BASE_URL} | pages: ${PAGES.map((p) => p.name).join(', ')}`);

  const browser = await chromium.launch({ headless: !HEADED });
  const startedAt = Date.now();

  const results = await Promise.all(
    Array.from({ length: SESSIONS }, (_, i) => runSession(browser, i + 1))
  );

  await browser.close();
  const totalDuration = Date.now() - startedAt;

  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  const avg = (key) => {
    const vals = results.map((r) => r.timings[key]).filter((v) => typeof v === 'number');
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const summary = {
    sessions: SESSIONS,
    succeeded: ok.length,
    failed: failed.length,
    totalDurationMs: totalDuration,
    avgLoginMs: avg('login'),
    avgSalesOrderMs: avg('sales-order'),
    avgPurchaseOrderMs: avg('purchase-order'),
    failures: failed.map((r) => ({ id: r.id, errors: r.errors })),
  };

  console.log('\n=== Summary ===');
  console.log(JSON.stringify(summary, null, 2));

  const resultsDir = path.join(__dirname, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const outFile = path.join(resultsDir, `mhc-browser-stress-${SESSIONS}sessions.json`);
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  console.log(`\nSaved to ${outFile}`);

  if (failed.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
