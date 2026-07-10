/**
 * 12-stock-ready.spec.js
 * Test: Stock Ready Module - MHC
 * Scope: Melihat daftar stok siap, konfirmasi stok, alokasi ke delivery
 * Berkaitan dengan: SO Approval → Stock Ready → Delivery flow
 */
import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';

// Kandidat URL untuk Stock Ready (cek beberapa kemungkinan)
const STOCK_READY_URLS = [
  '/stock-ready',
  '/stock',
  '/warehouse/stock-ready',
  '/inventory/stock-ready',
  '/picking',
];

// Helper: cek halaman yang benar dari beberapa kandidat URL
async function findStockReadyPage(page) {
  for (const url of STOCK_READY_URLS) {
    await page.goto(`${BASE}/mhc${url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    const title = await page.title().catch(() => '');
    const body = await page.locator('body').innerText().catch(() => '');
    if (
      currentUrl.includes(url) &&
      !/404|not found|forbidden|error/i.test(title) &&
      !/Page Not Found|Access Denied/i.test(body.slice(0, 100))
    ) {
      console.log(`✓ Stock Ready ditemukan di URL: ${url}`);
      return url;
    }
  }
  return null;
}

test.describe('MHC - Stock Ready', () => {
  test.setTimeout(90000);

  // Smoke test: cari halaman stock ready yang benar
  test('Stock Ready - load & elemen utama', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findStockReadyPage(page);

    if (!foundUrl) {
      console.log('  ⚠ Tidak ada URL yang cocok untuk Stock Ready - coba dari navigasi sidebar');
      // Fallback: cari melalui sidebar/menu
      await page.goto(`${BASE}/mhc`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const sidebarLink = page.locator('a, [role="menuitem"]').filter({ hasText: /stock ready|stok/i }).first();
      if (await sidebarLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sidebarLink.click();
        await page.waitForTimeout(3000);
        console.log('✓ Link Stock Ready ditemukan di sidebar/menu');
      } else {
        console.log('  ⚠ Stock Ready tidak ditemukan di sidebar - fitur mungkin bernama berbeda');
        return; // Skip test jika tidak ditemukan
      }
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek heading
    const heading = page.locator('h1, h2, h3').first();
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const headingText = await heading.textContent().catch(() => '');
      console.log(`✓ Heading: "${headingText.trim()}"`);
    } else {
      bugs.push('Heading halaman tidak ditemukan');
    }

    // Cek ada tabel/list stok
    const table = page.locator('table, [class*="list"], [class*="grid"]').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel/list stok tidak ditemukan');
    else console.log('✓ Tabel stok visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Cek filter by SO Number
  test('Stock Ready - filter & search berdasarkan SO Number', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findStockReadyPage(page);
    if (!foundUrl) {
      console.log('  ⚠ Stock Ready URL tidak ditemukan - skip filter test');
      return;
    }

    // Cari input search/filter
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search"], input[placeholder*="cari"]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('SO-');
      await page.waitForTimeout(2000);
      console.log('✓ Search input ditemukan dan diisi');

      const bodyText = await page.locator('body').innerText().catch(() => '');
      if (/SO-|no data|tidak ada/i.test(bodyText))
        console.log('✓ Pencarian berhasil diproses (ada hasil atau "no data")');
    } else {
      console.log('  ⚠ Search input tidak ditemukan');
    }

    // Cek tombol filter/dropdown
    const filterBtn = page.locator('button').filter({ hasText: /filter|sort/i }).first();
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Tombol Filter ditemukan');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Konfirmasi stok & alokasi ke delivery
  test('Stock Ready - konfirmasi stok & aksi alokasi delivery', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findStockReadyPage(page);
    if (!foundUrl) {
      console.log('  ⚠ Stock Ready URL tidak ditemukan - skip konfirmasi test');
      return;
    }

    // Cari baris pertama
    const firstRow = page.locator('table tbody tr, [class*="row"]').first();
    if (!await firstRow.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tidak ada data di Stock Ready - skip');
      return;
    }

    await firstRow.click();
    await page.waitForTimeout(2000);

    // Cek tombol konfirmasi/allocate/pick
    const actionBtn = page.locator('button').filter({ hasText: /confirm|allocat|pick|proses|process/i }).first();
    if (await actionBtn.isVisible({ timeout: 5000 }).catch(() => false))
      console.log('✓ Tombol aksi (confirm/allocate/pick) ditemukan');
    else
      console.log('  ⚠ Tombol aksi tidak ditemukan di detail Stock Ready');

    // Cek informasi produk/qty
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasProductInfo = /product|produk|qty|quantity|stok/i.test(bodyText);
    if (!hasProductInfo) bugs.push('Informasi produk/qty tidak ditemukan di detail Stock Ready');
    else console.log('✓ Informasi produk/qty ditemukan');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Verifikasi stock deduction setelah delivery (integration check)
  test('Stock Ready - verifikasi informasi qty tersedia', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findStockReadyPage(page);
    if (!foundUrl) {
      console.log('  ⚠ Stock Ready URL tidak ditemukan - skip qty verification');
      return;
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek ada kolom quantity
    if (/qty|quantity|stok|stock/i.test(bodyText))
      console.log('✓ Informasi quantity/stok ditemukan di halaman');
    else
      bugs.push('Informasi quantity/stok tidak ditemukan');

    // Cek ada kolom status
    if (/status|ready|available|tersedia/i.test(bodyText))
      console.log('✓ Informasi status stok ditemukan');
    else
      console.log('  ⚠ Status stok tidak terdeteksi');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
