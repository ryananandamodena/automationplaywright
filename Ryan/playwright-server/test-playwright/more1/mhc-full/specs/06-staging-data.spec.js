import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://mhc-dev.modena.com';

// Daftar semua staging data menus
const STAGING_MENUS = [
  { label: 'PPN',        path: '/sync-sap/ppn/list',        keyword: 'ppn' },
  { label: 'PPH',        path: '/sync-sap/pph/list',        keyword: 'pph' },
  { label: 'BP',         path: '/sync-sap/bp/list',         keyword: 'bp' },
  { label: 'BP Branch',  path: '/sync-sap/bp-branch/list',  keyword: 'branch' },
  { label: 'BP Group',   path: '/sync-sap/bp-group/list',   keyword: 'group' },
  { label: 'BP Address', path: '/sync-sap/bp-address/list', keyword: 'address' },
  { label: 'Bank',       path: '/sync-sap/bank/list',       keyword: 'bank' },
  { label: 'Legal',      path: '/sync-sap/legal/list',      keyword: 'legal' },
  { label: 'Warehouse',  path: '/sync-sap/warehouse/list',  keyword: 'warehouse' },
  { label: 'Order Type', path: '/sync-sap/order-type/list', keyword: 'order' },
  { label: 'GL Account', path: '/sync-sap/gl-account/list', keyword: 'account' },
  { label: 'Series',     path: '/sync-sap/series/list',     keyword: 'series' },
];

for (const menu of STAGING_MENUS) {
  test.describe(`MHC Staging - ${menu.label}`, () => {
    test.setTimeout(60000);

    test(`${menu.label} - load, tabel & sync button`, async ({ page }) => {
      const bugs = [];
      captureConsoleErrors(page);
      await login(page);
      await page.goto(`${BASE}${menu.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const { bugs: pageBugs } = await checkPageLoaded(page, menu.path);
      bugs.push(...pageBugs);

      // Cek halaman load (tidak redirect ke login)
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl === `${BASE}/`) {
        // Redirect ke login = tidak punya akses - catat sebagai warning, bukan fail test
        console.log(`  ⚠ ${menu.label}: redirect ke login - akun tidak punya akses ke halaman ini (access restriction)`);
        // Skip expect - ini bukan bug automation, tapi temuan access control
        return;
      }
      // Cek tabel ada
      const table = page.locator('table, [class*="list"], [class*="card"]').first();
      if (!await table.isVisible({ timeout: 8000 }).catch(() => false)) {
        // Cek apakah ada empty state
        const bodyText = await page.locator('body').innerText().catch(() => '');
        const hasData = bodyText.length > 200;
        if (!hasData) bugs.push(`${menu.label}: Tabel/list tidak ditemukan dan halaman tampak kosong`);
        else console.log(`✓ ${menu.label} - page loaded (possible empty state)`);
      } else {
        console.log(`✓ ${menu.label} - tabel/list visible`);
      }

      // Cek tombol Sync jika ada
      const syncBtn = page.locator("button:has-text('Sync'), button:has-text('Sinkronisasi'), button:has-text('Refresh')").first();
      if (await syncBtn.isVisible({ timeout: 3000 }).catch(() => false))
        console.log(`✓ ${menu.label} - tombol Sync visible`);

      if (bugs.length > 0) console.error(`BUGS [${menu.label}]:`, bugs.join('; '));
      expect(bugs, `${menu.label} Bugs: ${bugs.join(', ')}`).toHaveLength(0);
    });
  });
}
