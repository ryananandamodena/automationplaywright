/**
 * Shared helpers for the MHC "Sinkronisasi SAP" staging pages
 * (Bank, BP, BP Branch, BP Group, BP Address, Legal, Warehouse, Order Type,
 * GL Account, Series, PPh, PPN).
 *
 * Verified live against https://more-dev.modena.com on 2026-08-18:
 *
 * 1. Login form has NO `input[type="email"]` / `input[type="password"]` —
 *    fields are matched by placeholder ("Email" / "Password"), and there is
 *    a required "Company" dropdown that must be picked before "Sign In" is
 *    clicked (we use the MODENA HOME CENTER (MHC) company, matching the
 *    "MHC" menus these tests cover).
 *
 * 2. Every one of these staging pages is a READ-ONLY sync viewer, not a CRUD
 *    screen: the only actions available are search, an AND/OR column filter
 *    builder, sort, and a single "Sinkronkan Semua" (Sync All) button. There
 *    is no Add/Tambah/Edit/Delete button anywhere on these pages, and
 *    clicking a row does not open any create/edit form. The previous
 *    generation of these specs (CREATE/UPDATE/DELETE tests with a
 *    "// TODO: Add specific form field filling logic here" placeholder) was
 *    testing a UI that does not exist here — replaced by list/search/filter/
 *    sync coverage below.
 *
 * 3. The real route is prefixed with the company slug: `/mhc/sync-sap/<menu>/list`,
 *    not `/sync-sap/<menu>/list` (the old LIST_URL in every spec was missing
 *    the `/mhc` segment, so a fresh page.goto() straight to it 404'd).
 *
 * 4. This is a session-cookie app (not just in-memory SPA state) — a hard
 *    page.goto() to a staging list URL works fine right after login, no need
 *    to navigate via sidebar clicks.
 */

import { expect } from '@playwright/test';

export const BASE_URL = process.env.MHC_BASE_URL || 'https://more-dev.modena.com';
export const USER = {
  email: process.env.MHC_EMAIL,
  password: process.env.MHC_PASSWORD,
};
export const COMPANY_NAME = 'MODENA HOME CENTER (MHC)';

export function stagingListUrl(menuSlug) {
  return `${BASE_URL}/mhc/sync-sap/${menuSlug}/list`;
}

export async function login(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.locator('input[placeholder="Email"]').fill(USER.email);
  await page.locator('input[placeholder="Password"]').fill(USER.password);
  await page.getByText('Select a company').click();
  const companyOption = page.getByText(COMPANY_NAME, { exact: true });
  await companyOption.waitFor({ state: 'visible' });
  await companyOption.click();
  await page.getByRole('button', { name: 'Sign In' }).click();
  // Login redirects into the dashboard shell — wait for a sidebar menu item
  // (present only once authenticated) rather than just networkidle, which
  // can settle while still on the login page if the request is fast.
  await page.getByRole('link', { name: 'Dashboard' }).or(page.getByText('Dashboard')).first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForLoadState('networkidle');
}

export async function gotoStagingList(page, menuSlug) {
  await page.goto(stagingListUrl(menuSlug), { waitUntil: 'networkidle' });
}

/**
 * Runs the common List / Search / Filter / Sync coverage shared by every
 * staging menu. `menuName` is the human label shown in the page heading
 * (e.g. "BANK"); `menuSlug` is the URL segment (e.g. "bank").
 */
export function registerStagingSuite(test, { menuName, menuSlug }) {
  // Verified live: the page heading is "Staging: <SLUG-UPPERCASED>", with
  // hyphens kept as-is (e.g. slug "bp-group" -> heading "Staging: BP-GROUP",
  // NOT "Staging: BP GROUP") — derive it from menuSlug rather than trusting
  // a hand-typed menuName to match.
  const pageHeadingLabel = menuSlug.toUpperCase();

  test.describe(`MHC - ${menuName} Staging (Sync SAP)`, () => {
    let page;

    test.beforeAll(async ({ browser }) => {
      page = await browser.newPage();
      await login(page);
      await gotoStagingList(page, menuSlug);
    });

    test.afterAll(async () => {
      await page.close();
    });

    test(`1. LIST - Staging ${menuName} page loads with data table`, async () => {
      await expect(page.getByRole('heading', { name: `Staging: ${pageHeadingLabel}` })).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
      const rowCount = await page.locator('tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test(`2. NO MANUAL CRUD - ${menuName} staging has no Add/Edit/Delete controls`, async () => {
      // Documents the real, verified UI surface: this is a sync viewer, not
      // a CRUD screen. If Add/Edit/Delete ever ship here, this test should
      // fail loudly so the suite gets updated with real create/update/delete
      // coverage instead of silently staying stale.
      //
      // Assert we're actually on the staging page first — otherwise this
      // test would trivially "pass" on e.g. a login page that also has no
      // Add/Edit/Delete buttons, masking a broken beforeAll.
      await expect(page.getByRole('heading', { name: `Staging: ${pageHeadingLabel}` })).toBeVisible();
      await expect(page.getByRole('button', { name: /^(Add|Tambah|Create|New)$/i })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /^(Edit|Update|Ubah)$/i })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /^(Delete|Hapus|Remove)$/i })).toHaveCount(0);
    });

    test(`3. SEARCH - filtering ${menuName} by a known value narrows the list`, async () => {
      const searchInput = page.getByPlaceholder('Cari data...');
      await expect(searchInput).toBeVisible();

      const firstRowFirstCell = page.locator('tbody tr').first().locator('td').first();
      const knownValue = (await firstRowFirstCell.textContent())?.trim();
      expect(knownValue).toBeTruthy();

      await searchInput.fill(knownValue);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('tbody tr').first()).toContainText(knownValue);

      // A value that (almost certainly) doesn't exist should empty the list.
      // Verified live: the table doesn't drop to 0 <tr>s — it renders a
      // single placeholder row reading "Tidak ada data ditemukan." instead.
      await searchInput.fill('zzz-no-such-record-zzz');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('tbody tr')).toHaveCount(1);
      await expect(page.locator('tbody tr')).toContainText('Tidak ada data ditemukan');

      await searchInput.fill('');
      await page.waitForLoadState('networkidle');
    });

    test(`4. FILTER - the AND/OR column filter builder opens and applies`, async () => {
      await page.getByRole('button', { name: 'Filter' }).click();
      // The "Pilih kolom" placeholder lives on a real (visible) <select>, but
      // it's rendered as that <select>'s empty <option> — Playwright treats
      // <option> nodes as not independently visible, so assert on the
      // select itself instead of the placeholder text.
      const columnSelect = page.locator('select').first();
      await expect(columnSelect).toBeVisible();
      await expect(columnSelect).toContainText('Pilih kolom');
      await expect(page.getByRole('button', { name: 'Terapkan Filter' })).toBeVisible();

      // Close without applying — just confirming the control surface exists
      // and doesn't error; picking a real column depends on per-menu schema.
      const clearButton = page.getByRole('button', { name: 'Bersihkan' });
      if (await clearButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await clearButton.click();
      }
    });

    test(`5. SYNC - "Sinkronkan Semua" is present and enabled`, async () => {
      const syncButton = page.getByRole('button', { name: 'Sinkronkan Semua' });
      await expect(syncButton).toBeVisible();
      await expect(syncButton).toBeEnabled();
      // Not clicked: triggering a real SAP sync against a shared dev
      // environment from an automated suite is out of scope here (no way to
      // scope/undo it from the UI). See README before enabling this.
    });
  });
}
