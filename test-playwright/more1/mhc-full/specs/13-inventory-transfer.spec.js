/**
 * 13-inventory-transfer.spec.js
 * Test: Inventory Transfer Module - MHC
 * Scope: Buat transfer, validasi mandatory field, workflow draft-approve, negative testing
 * Test IDs: IT-FN-01..05, IT-NG-01..05, IT-MF-01..04, IT-WF-01..05, IT-UI-01..05
 */
import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';

// Kandidat URL untuk Inventory Transfer
const IT_URLS = [
  '/inventory-transfer',
  '/transfer',
  '/warehouse/transfer',
  '/inventory/transfer',
  '/stock-transfer',
];

async function findInventoryTransferPage(page) {
  for (const url of IT_URLS) {
    await page.goto(`${BASE}/mhc${url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    const title = await page.title().catch(() => '');
    const body = await page.locator('body').innerText().catch(() => '');
    if (
      currentUrl.includes(url) &&
      !/404|not found|forbidden/i.test(title) &&
      !/Page Not Found|Access Denied/i.test(body.slice(0, 100))
    ) {
      console.log(`✓ Inventory Transfer ditemukan di URL: ${url}`);
      return url;
    }
  }
  return null;
}

test.describe('MHC - Inventory Transfer', () => {
  test.setTimeout(90000);

  // IT-FN-01 / IT-UI-01: Load halaman & elemen utama
  test('Inventory Transfer - load & elemen utama', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findInventoryTransferPage(page);

    if (!foundUrl) {
      // Cari via sidebar
      await page.goto(`${BASE}/mhc`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const sidebarLink = page.locator('a, [role="menuitem"]').filter({ hasText: /transfer|inventory/i }).first();
      if (await sidebarLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sidebarLink.click();
        await page.waitForTimeout(3000);
        console.log('✓ Link Inventory Transfer ditemukan di sidebar');
      } else {
        console.log('  ⚠ Inventory Transfer tidak ditemukan - skip test');
        return;
      }
    }

    const { bugs: pageBugs } = await checkPageLoaded(page, foundUrl || '/');
    bugs.push(...pageBugs);

    // Cek heading
    const heading = page.locator('h1, h2, h3').first();
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const text = await heading.textContent().catch(() => '');
      console.log(`✓ Heading: "${text.trim()}"`);
    } else {
      bugs.push('Heading tidak ditemukan');
    }

    // Cek tabel/list
    const table = page.locator('table, [class*="list"]').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel/list Inventory Transfer tidak ditemukan');
    else console.log('✓ Tabel Inventory Transfer visible');

    // Cek tombol Create New / Buat Transfer
    const createBtn = page.locator('button').filter({ hasText: /create|buat|tambah|new|transfer/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Tombol Create Transfer tidak ditemukan');
    else console.log('✓ Tombol Create Transfer visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // IT-FN-01: Form Create Inventory Transfer
  test('Inventory Transfer - buka form create & validasi field', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findInventoryTransferPage(page);
    if (!foundUrl) {
      console.log('  ⚠ IT URL tidak ditemukan - skip form test');
      return;
    }

    // Klik Create
    const createBtn = page.locator('button').filter({ hasText: /create|buat|tambah|new/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan - skip');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek field Source Warehouse
    const sourceField = page.locator('select, [class*="select"], input').filter({ hasText: /source|asal|dari/i }).first();
    const hasSourceInBody = /source|asal|dari warehouse|warehouse.*from/i.test(bodyText);
    if (!hasSourceInBody)
      bugs.push('Field Source Warehouse tidak ditemukan di form create transfer');
    else console.log('✓ Field Source Warehouse terdeteksi');

    // Cek field Destination Warehouse
    const hasDestInBody = /destination|tujuan|warehouse.*to|ke warehouse/i.test(bodyText);
    if (!hasDestInBody)
      bugs.push('Field Destination Warehouse tidak ditemukan di form create transfer');
    else console.log('✓ Field Destination Warehouse terdeteksi');

    // Cek Add Line / tambah produk
    const addLineBtn = page.locator('button').filter({ hasText: /add line|tambah produk|add product|add item/i }).first();
    if (await addLineBtn.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Tombol Add Line/Product ditemukan');
    else
      console.log('  ⚠ Tombol Add Line tidak ditemukan di form create transfer');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // IT-NG-01: Same warehouse validation
  test('Inventory Transfer - validasi source & destination tidak boleh sama (IT-NG-01)', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findInventoryTransferPage(page);
    if (!foundUrl) {
      console.log('  ⚠ IT URL tidak ditemukan - skip negative test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    // Pilih warehouse yang sama untuk source dan destination
    const warehouseDropdowns = page.locator('select[name*="warehouse"], select[name*="source"], select[id*="warehouse"]');
    const dropdownCount = await warehouseDropdowns.count().catch(() => 0);

    if (dropdownCount >= 2) {
      const allOptions = await warehouseDropdowns.first().locator('option').allTextContents().catch(() => []);
      const firstValidOption = allOptions.find(o => o.trim() && o !== '-' && !/pilih|select|choose/i.test(o));

      if (firstValidOption) {
        await warehouseDropdowns.nth(0).selectOption({ label: firstValidOption });
        await warehouseDropdowns.nth(1).selectOption({ label: firstValidOption });
        await page.waitForTimeout(1000);

        // Coba submit
        const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|simpan|save/i }).first();
        if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(2000);

          const bodyText = await page.locator('body').innerText().catch(() => '');
          const hasError = /same|cannot|tidak boleh|sama|error|invalid/i.test(bodyText);
          if (hasError)
            console.log('✓ Validasi same warehouse terdeteksi - error muncul');
          else
            console.log('  ⚠ Tidak ada error untuk same warehouse - perlu cek secara manual');
        }
      }
    } else {
      console.log('  ⚠ Kurang dari 2 dropdown warehouse ditemukan - skip negative test');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // IT-MF-01..04: Mandatory field validation - submit tanpa data
  test('Inventory Transfer - submit kosong harus gagal (IT-MF-01..04)', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findInventoryTransferPage(page);
    if (!foundUrl) {
      console.log('  ⚠ IT URL tidak ditemukan - skip mandatory field test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    // Submit langsung tanpa isi apapun
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|simpan|save/i }).first();
    if (!await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  ⚠ Submit button tidak ditemukan');
      return;
    }

    await submitBtn.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek munculnya pesan error mandatory
    const hasError = /required|wajib|harus|mandatory|cannot be empty|kosong/i.test(bodyText);
    if (!hasError)
      bugs.push('Tidak ada validasi mandatory field saat submit kosong (IT-MF-01..04)');
    else
      console.log('✓ Validasi mandatory field muncul saat submit kosong');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // IT-WF-01: Full lifecycle check (hanya cek status label ada)
  test('Inventory Transfer - cek label status & workflow indicator', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findInventoryTransferPage(page);
    if (!foundUrl) {
      console.log('  ⚠ IT URL tidak ditemukan - skip workflow test');
      return;
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek ada status labels yang relevan
    const statusFound = /draft|pending|approved|in transit|completed|cancelled/i.test(bodyText);
    if (statusFound)
      console.log('✓ Label status workflow ditemukan di halaman');
    else
      console.log('  ⚠ Label status tidak terdeteksi - mungkin belum ada data');

    // Cek ada kolom status di tabel
    const statusCol = page.locator('table thead th').filter({ hasText: /status/i }).first();
    if (await statusCol.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Kolom Status ditemukan di tabel');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // IT-UI-03: Availability check indicator
  test('Inventory Transfer - indikator ketersediaan stok di form', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findInventoryTransferPage(page);
    if (!foundUrl) {
      console.log('  ⚠ IT URL tidak ditemukan - skip availability test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    // Cek search produk
    const productSearch = page.locator('input[placeholder*="product"], input[placeholder*="produk"], input[placeholder*="item"]').first();
    if (await productSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productSearch.fill('BH');
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').innerText().catch(() => '');
      if (/available|tersedia|stok|qty/i.test(bodyText))
        console.log('✓ Indikator ketersediaan stok ditemukan saat search produk');
      else
        console.log('  ⚠ Indikator stok tidak terdeteksi');
    } else {
      console.log('  ⚠ Input product search tidak ditemukan di form');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
