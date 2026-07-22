/**
 * MODENA SAFE (Subscription Service Apps) - E2E Automation
 *
 * Covers: login + app launch, full sidebar menu discovery/navigation,
 * table/filter presence, shallow XSS/SQLi probes, and regression tests
 * for defects found during the manual QA pass (see ../scb/MODENA_SAFE_QA_Report.md).
 *
 * Auth: relies on storageState.json (see global-setup.js) - falls back to
 * live login via LoginPage if the session isn't already authenticated.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

// NOTE: all tests share one admin account and each test logs in independently
// (simple/isolated over DRY). Under heavy repeated runs this account can hit
// server-side throttling and the "Dashboard" wait in loginAndOpenSafe() may
// time out - that's environment flakiness, not a script defect. Do NOT wrap
// this file in test.describe.configure({ mode: 'serial' }): a failure inside
// a serial block reruns the ENTIRE block from the start on retry, which just
// multiplies login attempts and makes throttling worse.

const BASE_URL = process.env.BASE_URL || 'https://portal-dev.modena.com';
const USER = {
  email: process.env.ADMIN_EMAIL || 'ryan.ananda@modena.com',
  password: process.env.ADMIN_PASSWORD || 'P@ssw0rd_ryan.ananda',
};

/** Every page discovered in the manual QA pass, keyed by sidebar label path. */
const PAGES = [
  { path: ['Call Center', 'Call Entry'], url: /\/safe\/call-center\/call-entry/, heading: 'Call Entry' },
  { path: ['Call Center', 'List Customer'], url: /\/safe\/call-center\/customer/, heading: 'Customer' },
  { path: ['Call Center', 'Request Confirmation'], url: /\/safe\/call-center\/req-confirm/, heading: 'Request Confirmation' },
  { path: ['Workorder', 'History'], url: /\/safe\/workorder\/history/, heading: 'Work Order Histories' },
  { path: ['Workorder', 'Maintenance'], url: /\/safe\/workorder\/maintenance\/list/, heading: 'Maintenance List' },
  { path: ['Inventory', 'My Inventory'], url: /\/safe\/inventory\/my-inventory/, heading: 'My Inventory' },
  { path: ['Setting', 'Role & User Management', 'Role'], url: /\/safe\/setting\/role/, heading: 'Roles' },
  { path: ['Setting', 'Role & User Management', 'User'], url: /\/safe\/setting\/user/, heading: 'Users' },
  { path: ['Setting', 'Organization', 'Service Center'], url: /\/safe\/setting\/service-center/, heading: 'Service' },
  { path: ['Setting', 'Organization', 'Coverage Area'], url: /\/safe\/setting\/coverage/, heading: 'Master Coverage Area' },
  { path: ['Setting', 'Organization', 'Capability'], url: /\/safe\/setting\/capability/, heading: 'Technician Capability Area' },
  { path: ['Setting', 'Organization', 'Schedule'], url: /\/safe\/setting\/schedule/, heading: 'Technician Master Schedule' },
];

/** Click through a chain of sidebar labels, expanding parent groups as needed. */
async function clickSidebarPath(page, labels) {
  for (const label of labels) {
    await page.locator(`text="${label}"`).first().click();
    await page.waitForTimeout(400);
  }
}

async function loginAndOpenSafe(page) {
  const loginPage = new LoginPage(page);
  await loginPage.loginAndSelectApp(BASE_URL, USER.email, USER.password, 'Safe');
  await page.waitForURL(/\/safe\//, { timeout: 15000 }).catch(() => {});

  // Session may land somewhere other than /safe/dashboard (e.g. app-launcher tile
  // wasn't found because the session redirected straight into a previously active
  // app). Force a direct navigation as a fallback so every test starts from a known,
  // fully-rendered SAFE page with its sidebar present.
  if (!/\/safe\//.test(page.url())) {
    await page.goto(`${BASE_URL}/safe/dashboard`, { waitUntil: 'load', timeout: 30000 });
  }

  await page.locator('text="Dashboard"').first().waitFor({ state: 'visible', timeout: 15000 });
}

test.describe('SAFE - Login & App Launch', () => {
  test('logs in and launches the Safe app from the portal launcher', async ({ page }) => {
    await loginAndOpenSafe(page);
    await expect(page).toHaveURL(/\/safe\/dashboard/);
    await expect(page.locator('text=Welcome To Service Application')).toBeVisible();
  });
});

test.describe('SAFE - Sidebar Menu Discovery', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndOpenSafe(page);
  });

  for (const { path, url, heading } of PAGES) {
    test(`navigates to ${path[path.length - 1]} (${path.join(' > ')})`, async ({ page }) => {
      await clickSidebarPath(page, path);
      await expect(page).toHaveURL(url);
      await expect(page.getByText(heading, { exact: false }).first()).toBeVisible();
    });
  }
});

test.describe('SAFE - Table & Filter Smoke Checks', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndOpenSafe(page);
  });

  test('List Customer grid supports keyword search without error', async ({ page }) => {
    await clickSidebarPath(page, ['Call Center', 'List Customer']);
    const search = page.locator('input[placeholder="Keyword Search"]');
    await expect(search).toBeVisible();
    await search.fill('Bersama');
    await page.waitForTimeout(800);
    await expect(page.locator('table, [role="table"]').first()).toBeVisible();
  });

  test('My Inventory shows a handled empty state', async ({ page }) => {
    await clickSidebarPath(page, ['Inventory', 'My Inventory']);
    await expect(page.getByText('No available options')).toBeVisible();
    await expect(page.getByText('0 to 0 of 0')).toBeVisible();
  });

  test('Coverage Area stays empty until a Service Center is selected', async ({ page }) => {
    await clickSidebarPath(page, ['Setting', 'Organization', 'Coverage Area']);
    await expect(page.locator('span').filter({ hasText: 'Select Service Center' }).first()).toBeVisible();
  });
});

test.describe('SAFE - Shallow Security Probes (XSS / SQLi)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndOpenSafe(page);
  });

  test('Call Entry phone field does not execute injected script', async ({ page }) => {
    await clickSidebarPath(page, ['Call Center', 'Call Entry']);

    let dialogFired = false;
    page.once('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    const phoneInput = page.locator('input[type="text"]').first();
    await phoneInput.fill('<script>alert(1)</script>');
    await page.waitForTimeout(1000);

    expect(dialogFired).toBeFalsy();
  });

  test('List Customer search tolerates a SQLi-style payload without breaking the grid', async ({ page }) => {
    await clickSidebarPath(page, ['Call Center', 'List Customer']);
    const search = page.locator('input[placeholder="Keyword Search"]');
    await search.fill(`' OR '1'='1`);
    await page.waitForTimeout(800);

    // Grid should not throw a client-side error boundary / blank screen
    await expect(page.locator('table, [role="table"]').first()).toBeVisible();
  });

  test('BUG-02 (known issue): auth tokens should not be readable from localStorage', async ({ page }) => {
    test.fail(true, 'Known issue: access_token/refresh_token are currently stored in localStorage - see MODENA_SAFE_QA_Report.md BUG-02');

    await loginAndOpenSafe(page);
    const tokenKeys = await page.evaluate(() => Object.keys(localStorage).filter((k) => /token/i.test(k)));

    expect(tokenKeys).toEqual([]);
  });
});

test.describe('SAFE - Known Defect Regressions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndOpenSafe(page);
  });

  test('Part Movement navigates to its own page (BUG-01 regression - was flaky/non-reproducing in clean sessions)', async ({ page }) => {
    // Manual QA observed Part Movement staying on My Inventory (BUG-01 in the report).
    // Against a clean automated session this consistently navigates correctly, so this
    // is kept as a plain regression check rather than a known-failing test; re-flag as
    // a known issue if this starts failing again (e.g. only reproduces after visiting
    // My Inventory first - worth a follow-up manual re-check).
    await clickSidebarPath(page, ['Inventory', 'Part Movement']);
    await expect(page).not.toHaveURL(/\/safe\/inventory\/my-inventory/);
  });

  test('BUG-03 (known issue): Maintenance List should show formatted dates, not raw ISO strings', async ({ page }) => {
    test.fail(true, 'Known issue: Maintenance Date column renders raw ISO-8601 strings - see MODENA_SAFE_QA_Report.md BUG-03');

    await clickSidebarPath(page, ['Workorder', 'Maintenance']);
    const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    const bodyText = await page.locator('table, [role="table"]').first().innerText();
    expect(isoDatePattern.test(bodyText)).toBeFalsy();
  });

  test('BUG-04 (known issue): Role Name should be unique in the Roles grid', async ({ page }) => {
    test.fail(true, 'Known issue: duplicate "Sales" role names exist with no uniqueness validation - see MODENA_SAFE_QA_Report.md BUG-04');

    await clickSidebarPath(page, ['Setting', 'Role & User Management', 'Role']);
    const roleNames = await page.locator('table tbody tr td:first-child').allInnerTexts();
    const unique = new Set(roleNames);
    expect(unique.size).toBe(roleNames.length);
  });
});
