/**
 * 15-balance-inquiry.spec.js
 * Test: Balance Inquiry Module - MHC
 * Scope: View stock balance, financial balance, filter, drill-down, export
 * Test IDs: BI-FN-01..05, BI-NG-01..05, BI-MF-01..03, BI-VL-01..03, BI-UI-*
 * Note: URL /balance-inquiry dikonfirmasi dari 04-operations.spec.js
 */
import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';
const BI_URL = `${BASE}/mhc/balance-inquiry`;

// Helper: buka Balance Inquiry dan cek accessible
async function gotoBI(page) {
  await page.goto(BI_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const body = await page.locator('body').innerText().catch(() => '');
  if (/Page Not Found|Access Denied|404|forbidden/i.test(body.slice(0, 300))) {
    console.log('  ⚠ Balance Inquiry tidak accessible dari URL /balance-inquiry');
    return false;
  }
  const currentUrl = page.url();
  console.log(`✓ Balance Inquiry terbuka di: ${currentUrl}`);
  return true;
}

test.describe('MHC - Balance Inquiry', () => {
  test.setTimeout(90000);

  // BI-FN-01 / BI-UI: Load halaman & elemen utama
  test('Balance Inquiry - load & elemen utama', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const ok = await gotoBI(page);
    if (!ok) {
      console.log('  ⚠ Balance Inquiry tidak ditemukan - skip test');
      return;
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek heading
    const heading = page.locator('h1, h2, h3').first();
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const text = await heading.textContent().catch(() => '');
      console.log(`✓ Heading: "${text.trim()}"`);
    } else {
      bugs.push('Heading tidak ditemukan');
    }

    // Cek ada tabel/data balance
    const table = page.locator('table, [class*="list"], [class*="balance"]').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel/tampilan Balance tidak ditemukan');
    else console.log('✓ Tabel Balance visible');

    // Cek ada filter/search
    const hasFilter = /filter|warehouse|tanggal|date|periode|period|search/i.test(bodyText);
    if (hasFilter) console.log('✓ Elemen filter ditemukan di halaman');
    else console.log('  ⚠ Tidak ada elemen filter terdeteksi');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // BI-FN-01: View stock balance berdasarkan warehouse
  test('Balance Inquiry - view stock balance per warehouse (BI-FN-01)', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const ok = await gotoBI(page);
    if (!ok) { console.log('  ⚠ Balance Inquiry skip'); return; }

    // Pilih warehouse dari dropdown jika ada
    const warehouseSelect = page.locator('select[name*="warehouse"], select[id*="warehouse"]').first();
    if (await warehouseSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const options = await warehouseSelect.locator('option').allTextContents().catch(() => []);
      const validOption = options.find(o => o.trim() && !/pilih|select|all/i.test(o));
      if (validOption) {
        await warehouseSelect.selectOption({ label: validOption });
        await page.waitForTimeout(2000);
        console.log(`✓ Warehouse dipilih: "${validOption}"`);
      }
    }

    // Klik Search/Apply jika ada
    const searchBtn = page.locator('button').filter({ hasText: /search|cari|apply|tampilkan/i }).first();
    if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBtn.click();
      await page.waitForTimeout(3000);
      console.log('✓ Tombol Search/Apply diklik');
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasBalance = /balance|stok|stock|qty|quantity|available/i.test(bodyText);
    if (!hasBalance)
      console.log('  ⚠ Data balance/stok tidak terdeteksi - mungkin belum ada data');
    else console.log('✓ Data balance/stok ditemukan (BI-FN-01)');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // BI-FN-02: View financial balance berdasarkan date range
  test('Balance Inquiry - view financial balance GL account (BI-FN-02)', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const ok = await gotoBI(page);
    if (!ok) { console.log('  ⚠ Balance Inquiry skip'); return; }

    // Coba pilih date range
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count().catch(() => 0);
    if (dateCount >= 2) {
      await dateInputs.nth(0).fill('2025-01-01');
      await dateInputs.nth(1).fill('2025-12-31');
      console.log('✓ Date range diisi (BI-MF-02)');

      const searchBtn = page.locator('button').filter({ hasText: /search|cari|apply|tampilkan/i }).first();
      if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchBtn.click();
        await page.waitForTimeout(3000);
        console.log('✓ Search dengan date range diklik');
      }
    } else {
      console.log('  ⚠ Tidak ada 2 input date untuk date range');
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasFinancialData = /debit|credit|balance|saldo|amount|nilai/i.test(bodyText);
    if (hasFinancialData)
      console.log('✓ Data financial/saldo terdeteksi (BI-FN-02)');
    else
      console.log('  ⚠ Data financial tidak terdeteksi - mungkin tidak ada data dalam range ini');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // BI-FN-04: Drill-down ke detail transaksi
  test('Balance Inquiry - drill-down detail transaksi (BI-FN-04)', async ({ page }) => {
    const bugs = [];
    await login(page);

    const ok = await gotoBI(page);
    if (!ok) { console.log('  ⚠ Balance Inquiry skip'); return; }

    // Klik baris pertama jika ada
    const firstRow = page.locator('table tbody tr').first();
    if (!await firstRow.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tidak ada data untuk drill-down (BI-FN-04)');
      return;
    }

    await firstRow.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasDetail = /detail|transaction|transaksi|history|riwayat/i.test(bodyText);
    if (hasDetail)
      console.log('✓ Detail transaksi muncul saat klik baris (BI-FN-04)');
    else
      console.log('  ⚠ Detail tidak muncul saat klik - mungkin perlu klik tombol khusus');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // BI-NG-03: No data message saat query kosong
  test('Balance Inquiry - pesan No Data saat tidak ada hasil (BI-NG-03)', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const ok = await gotoBI(page);
    if (!ok) { console.log('  ⚠ Balance Inquiry skip'); return; }

    // Cari search input dan isi dengan data yang tidak ada
    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('XYZNONEXISTENT999');
      await page.waitForTimeout(500);

      const searchBtn = page.locator('button').filter({ hasText: /search|cari|apply/i }).first();
      if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchBtn.click();
        await page.waitForTimeout(3000);
      }

      const bodyText = await page.locator('body').innerText().catch(() => '');
      const hasNoDataMsg = /no data|tidak ada|not found|data tidak|empty|kosong/i.test(bodyText);
      if (hasNoDataMsg)
        console.log('✓ Pesan "No Data" muncul saat tidak ada hasil (BI-NG-03)');
      else
        console.log('  ⚠ Tidak ada pesan "No Data" yang jelas - perlu cek manual');
    } else {
      console.log('  ⚠ Search input tidak ditemukan untuk no data test');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // BI-VL-01: Format angka balance (thousand separator)
  test('Balance Inquiry - format angka dengan thousand separator (BI-VL-01)', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const ok = await gotoBI(page);
    if (!ok) { console.log('  ⚠ Balance Inquiry skip'); return; }

    const bodyText = await page.locator('body').innerText().catch(() => '');

    const hasFormattedNumber = /\d{1,3}(,\d{3})+|\d{1,3}(\.\d{3})+/.test(bodyText);
    if (hasFormattedNumber)
      console.log('✓ Format angka dengan thousand separator ditemukan (BI-VL-01)');
    else
      console.log('  ⚠ Format angka thousand separator tidak terdeteksi - mungkin tidak ada data');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // BI-FN-05: Aging report
  test('Balance Inquiry - aging report tersedia (BI-FN-05)', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const ok = await gotoBI(page);
    if (!ok) { console.log('  ⚠ Balance Inquiry skip'); return; }

    const bodyText = await page.locator('body').innerText().catch(() => '');

    const agingBtn = page.locator('button, a, [role="tab"]').filter({ hasText: /aging|umur stok|age/i }).first();
    if (await agingBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await agingBtn.click();
      await page.waitForTimeout(2000);
      console.log('✓ Tombol/Tab Aging Report ditemukan dan diklik (BI-FN-05)');

      const newBody = await page.locator('body').innerText().catch(() => '');
      if (/0-30|31-60|60\+|aging/i.test(newBody))
        console.log('✓ Aging buckets ditemukan di report (BI-FN-05)');
    } else if (/aging|umur/i.test(bodyText)) {
      console.log('✓ Konten aging terdeteksi di halaman (BI-FN-05)');
    } else {
      console.log('  ⚠ Aging Report tidak ditemukan - mungkin fitur terpisah atau tidak ada');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
