// Browser-based stress test for MHC: N concurrent authenticated sessions
// navigating Login -> Sales Order ONLY. Captures per-session detail for
// a fully detailed report (not just aggregates).
//
// Usage:
//   cd test-playwright/performance
//   node browser-stress-mhc-login-so.mjs --sessions=50
//   node browser-stress-mhc-login-so.mjs --sessions=30 --headed
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
const SO_PATH = '/mhc/sales-order';

async function runSession(browser, id, testStartedAt) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const apiCalls = [];
  page.on('response', (res) => {
    const url = res.url();
    if (!url.includes('more-dev.modena.com')) return;
    if (url.match(/\.(png|jpg|ico|woff|woff2|css|svg)(\?|$)/)) return;
    apiCalls.push({ url, status: res.status(), method: res.request().method() });
  });

  const result = {
    id,
    ok: true,
    errors: [],
    startedAtMs: Date.now() - testStartedAt,
    timings: {},
    httpFailures: [],
  };

  try {
    let t0 = Date.now();
    result.timings.gotoHomeStart = t0 - testStartedAt;
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    result.timings.gotoHomeMs = Date.now() - t0;
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

    t0 = Date.now();
    result.timings.loginClickStart = t0 - testStartedAt;
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForURL(/\/mhc/, { timeout: 45000 }).catch(() => {});
    await page.waitForSelector('aside, nav, header', { timeout: 45000 }).catch(() => {});
    result.timings.loginMs = Date.now() - t0;

    const stillLogin = await page.locator('input[type="password"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (stillLogin) {
      const errAlert = page.locator('[class*="error"], [class*="alert"], .text-red-500, [role="alert"]');
      const errText = await errAlert.first().textContent({ timeout: 1000 }).catch(() => '');
      throw new Error(`login failed (still on login form)${errText ? ': ' + errText.trim() : ''}`);
    }

    t0 = Date.now();
    result.timings.salesOrderStart = t0 - testStartedAt;
    await page.goto(`${BASE_URL}${SO_PATH}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
    result.timings.salesOrderMs = Date.now() - t0;

    const title = await page.title().catch(() => '');
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (/^(404|500|403|error|not found)/i.test(title) || /Access Denied|Internal Server Error|Forbidden/i.test(bodyText.slice(0, 200))) {
      throw new Error(`error page on sales-order: title="${title}"`);
    }

    result.timings.totalMs = Date.now() - (testStartedAt + result.startedAtMs);
  } catch (err) {
    result.ok = false;
    result.errors.push(err.message);
  } finally {
    result.httpFailures = apiCalls.filter((c) => c.status >= 400);
    result.httpCallCount = apiCalls.length;
    await context.close();
  }
  return result;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)];
}

function stats(values) {
  const vals = values.filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!vals.length) return { min: null, max: null, avg: null, median: null, p90: null, p95: null, count: 0 };
  const sum = vals.reduce((a, b) => a + b, 0);
  return {
    count: vals.length,
    min: vals[0],
    max: vals[vals.length - 1],
    avg: Math.round(sum / vals.length),
    median: percentile(vals, 50),
    p90: percentile(vals, 90),
    p95: percentile(vals, 95),
  };
}

async function main() {
  console.log(`Starting MHC browser stress test (Login + Sales Order only): ${SESSIONS} concurrent sessions`);
  console.log(`Target: ${BASE_URL}${SO_PATH}`);

  const browser = await chromium.launch({ headless: !HEADED });
  const startedAt = Date.now();
  const startedAtISO = new Date().toISOString();

  const results = await Promise.all(
    Array.from({ length: SESSIONS }, (_, i) => runSession(browser, i + 1, startedAt))
  );

  await browser.close();
  const totalDuration = Date.now() - startedAt;

  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  const loginStats = stats(results.map((r) => r.timings.loginMs));
  const soStats = stats(results.map((r) => r.timings.salesOrderMs));
  const homeStats = stats(results.map((r) => r.timings.gotoHomeMs));

  // Group failure reasons
  const errorGroups = {};
  for (const r of failed) {
    const key = (r.errors[0] || 'unknown').split('\n')[0].replace(/Session ID.*$/, '').trim();
    const shortKey = key.length > 90 ? key.slice(0, 90) + '...' : key;
    errorGroups[shortKey] = (errorGroups[shortKey] || 0) + 1;
  }

  const report = {
    scenario: 'login-sales-order-only',
    sessions: SESSIONS,
    startedAtISO,
    succeeded: ok.length,
    failed: failed.length,
    successRatePct: Math.round((ok.length / SESSIONS) * 1000) / 10,
    totalDurationMs: totalDuration,
    stageStats: {
      gotoHome: homeStats,
      login: loginStats,
      salesOrder: soStats,
    },
    errorGroups,
    perSession: results.map((r) => ({
      id: r.id,
      ok: r.ok,
      startedAtMs: r.startedAtMs,
      gotoHomeMs: r.timings.gotoHomeMs ?? null,
      loginMs: r.timings.loginMs ?? null,
      salesOrderMs: r.timings.salesOrderMs ?? null,
      httpCallCount: r.httpCallCount,
      httpFailureCount: r.httpFailures.length,
      httpFailures: r.httpFailures,
      errors: r.errors,
    })),
  };

  console.log('\n=== Summary ===');
  console.log(JSON.stringify({
    sessions: report.sessions,
    succeeded: report.succeeded,
    failed: report.failed,
    successRatePct: report.successRatePct,
    totalDurationMs: report.totalDurationMs,
    stageStats: report.stageStats,
    errorGroups: report.errorGroups,
  }, null, 2));

  const resultsDir = path.join(__dirname, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const outFile = path.join(resultsDir, `mhc-login-so-${SESSIONS}sessions-detailed.json`);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`\nSaved to ${outFile}`);

  if (failed.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
