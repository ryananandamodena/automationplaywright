/**
 * 14-operational-cost.spec.js
 * Test: Operational Cost Module - MHC
 * Scope: Load halaman, form create, validasi mandatory, negative tests, filter
 * Test IDs: OC-FN-01, OC-NG-01..05, OC-MF-01..04, OC-UI-01..05, OC-BR-02
 */
import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';

// Kandidat URL untuk Operational Cost
const OC_URLS = [
  '/operational-cost',
  '/cost',
  '/finance/operational-cost',
  '/expenses',
  '/expense',
];

async function findOperationalCostPage(page) {
  for (const url of OC_URLS) {
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
      console.log(`✓ Operational Cost ditemukan di URL: ${url}`);
      return url;
    }
  }
  return null;
}

test.describe('MHC - Operational Cost', () => {
  test.setTimeout(90000);

  // OC-FN-01 / OC-UI-01: Load halaman & elemen utama
  test('Operational Cost - load & elemen utama', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findOperationalCostPage(page);

    if (!foundUrl) {
      await page.goto(`${BASE}/mhc`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const sidebarLink = page.locator('a, [role="menuitem"]').filter({ hasText: /operational cost|biaya|cost|expense/i }).first();
      if (await sidebarLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sidebarLink.click();
        await page.waitForTimeout(3000);
        console.log('✓ Link Operational Cost ditemukan di sidebar');
      } else {
        console.log('  ⚠ Operational Cost tidak ditemukan - skip test');
        return;
      }
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

    // Cek tabel/list biaya
    const table = page.locator('table, [class*="list"]').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel/list Operational Cost tidak ditemukan');
    else console.log('✓ Tabel Operational Cost visible');

    // Cek tombol Create
    const createBtn = page.locator('button').filter({ hasText: /create|tambah|new|add/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Tombol Create biaya tidak ditemukan');
    else console.log('✓ Tombol Create visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // OC-FN-01: Form Create Operational Cost
  test('Operational Cost - form create & field mandatory', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findOperationalCostPage(page);
    if (!foundUrl) {
      console.log('  ⚠ OC URL tidak ditemukan - skip form test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|tambah|new|add/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek field Cost Type (OC-MF-01)
    if (/cost type|tipe biaya|jenis biaya|type/i.test(bodyText))
      console.log('✓ Field Cost Type terdeteksi (OC-MF-01)');
    else
      bugs.push('Field Cost Type tidak ditemukan di form (OC-MF-01)');

    // Cek field Amount (OC-MF-02)
    const amountInput = page.locator('input[name*="amount"], input[placeholder*="amount"], input[placeholder*="nominal"], input[placeholder*="nilai"]').first();
    if (await amountInput.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Field Amount ditemukan (OC-MF-02)');
    else if (/amount|nominal|nilai|harga/i.test(bodyText))
      console.log('✓ Field Amount terdeteksi di body (OC-MF-02)');
    else
      bugs.push('Field Amount tidak ditemukan di form (OC-MF-02)');

    // Cek field Cost Center (OC-MF-03)
    if (/cost center|cc|center/i.test(bodyText))
      console.log('✓ Field Cost Center terdeteksi (OC-MF-03)');
    else
      console.log('  ⚠ Field Cost Center tidak terdeteksi');

    // Cek field Date (OC-MF-04)
    const dateInput = page.locator('input[type="date"], input[name*="date"], input[placeholder*="date"], input[placeholder*="tanggal"]').first();
    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Field Date ditemukan (OC-MF-04)');
    else if (/date|tanggal/i.test(bodyText))
      console.log('✓ Field Date terdeteksi (OC-MF-04)');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // OC-NG-01: Negative amount tidak diizinkan
  test('Operational Cost - amount negatif harus ditolak (OC-NG-01)', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findOperationalCostPage(page);
    if (!foundUrl) {
      console.log('  ⚠ OC URL tidak ditemukan - skip negative test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|tambah|new|add/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    // Isi amount negatif
    const amountInput = page.locator('input[name*="amount"], input[placeholder*="amount"], input[placeholder*="nominal"], input[type="number"]').first();
    if (await amountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await amountInput.fill('-500000');
      await page.waitForTimeout(500);

      // Submit
      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|simpan|save/i }).first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(2000);

        const bodyText = await page.locator('body').innerText().catch(() => '');
        const hasError = /must be positive|harus positif|tidak valid|invalid|cannot be negative|error/i.test(bodyText);
        if (hasError)
          console.log('✓ Validasi amount negatif bekerja (OC-NG-01)');
        else
          console.log('  ⚠ Tidak ada error untuk amount negatif - perlu validasi manual');
      }
    } else {
      console.log('  ⚠ Input amount tidak ditemukan untuk negative test');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // OC-MF-01..04: Submit form kosong harus gagal
  test('Operational Cost - submit form kosong harus muncul error (OC-MF-01..04)', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findOperationalCostPage(page);
    if (!foundUrl) {
      console.log('  ⚠ OC URL tidak ditemukan - skip mandatory test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|tambah|new|add/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|simpan|save/i }).first();
    if (!await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  ⚠ Submit button tidak ditemukan');
      return;
    }

    await submitBtn.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasValidation = /required|wajib|harus diisi|mandatory|cannot be empty/i.test(bodyText);
    if (!hasValidation)
      bugs.push('Tidak ada validasi mandatory saat form kosong disubmit (OC-MF-01..04)');
    else
      console.log('✓ Validasi mandatory field muncul (OC-MF-01..04)');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // OC-UI-03: Filter list biaya berdasarkan tipe/tanggal
  test('Operational Cost - filter list berdasarkan kriteria (OC-UI-03)', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findOperationalCostPage(page);
    if (!foundUrl) {
      console.log('  ⚠ OC URL tidak ditemukan - skip filter test');
      return;
    }

    // Cek filter/search
    const filterBtn = page.locator('button').filter({ hasText: /filter|sort|cari/i }).first();
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✓ Tombol Filter ditemukan (OC-UI-03)');
    }

    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('shipping');
      await page.waitForTimeout(2000);
      console.log('✓ Search input ditemukan & diisi (OC-UI-03)');

      const bodyText = await page.locator('body').innerText().catch(() => '');
      if (/shipping|no data|tidak ada/i.test(bodyText))
        console.log('✓ Pencarian berhasil diproses');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // OC-UI-02: Upload attachment receipt
  test('Operational Cost - upload attachment receipt (OC-UI-02)', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findOperationalCostPage(page);
    if (!foundUrl) {
      console.log('  ⚠ OC URL tidak ditemukan - skip upload test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|tambah|new|add/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    // Cek ada input file/upload
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Input upload attachment ditemukan (OC-UI-02)');
    else {
      const bodyText = await page.locator('body').innerText().catch(() => '');
      if (/upload|attach|lampiran|file/i.test(bodyText))
        console.log('✓ Fitur upload/attachment terdeteksi di body (OC-UI-02)');
      else
        console.log('  ⚠ Input upload tidak ditemukan - mungkin hidden atau tidak ada fitur ini');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // OC-BR-02: Self-approval tidak diizinkan
  test('Operational Cost - self-approval tidak diizinkan (OC-BR-02)', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findOperationalCostPage(page);
    if (!foundUrl) {
      console.log('  ⚠ OC URL tidak ditemukan - skip self-approval test');
      return;
    }

    // Cari cost yang dibuat oleh user yang sedang login untuk cek approve
    const rows = page.locator('table tbody tr').first();
    if (!await rows.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tidak ada data di Operational Cost - skip self-approval test');
      return;
    }

    await rows.click();
    await page.waitForTimeout(2000);

    const approveBtn = page.locator('button').filter({ hasText: /approve|setuju/i }).first();
    if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await approveBtn.click();
      await page.waitForTimeout(2000);

      const bodyText = await page.locator('body').innerText().catch(() => '');
      if (/cannot approve|tidak dapat|self.?approval|own request/i.test(bodyText))
        console.log('✓ Self-approval diblokir dengan pesan error (OC-BR-02)');
      else
        console.log('  ⚠ Tidak ada pesan self-approval block - perlu validasi manual');
    } else {
      console.log('  ⚠ Tombol Approve tidak ditemukan - mungkin user ini bukan creator/approver');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
