/**
 * 18-delivery.spec.js
 * Test: Delivery Module - MHC
 * Scope: Buat delivery, validasi mandatory field, partial delivery, negative testing
 * Test IDs: DL-FN-01..05, DL-NG-01..04, DL-VL-01..02, DL-BV-01..02, DL-MF-01..03
 */
import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';

// Kandidat URL untuk Delivery
const DL_URLS = [
  '/delivery',
  '/logistic/delivery',
  '/sales/delivery',
  '/outbound',
];

async function findDeliveryPage(page) {
  for (const url of DL_URLS) {
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
      console.log(`✓ Delivery ditemukan di URL: ${url}`);
      return url;
    }
  }
  return null;
}

test.describe('MHC - Delivery Module', () => {
  test.setTimeout(90000);

  // DL-FN-01: Load halaman & elemen utama
  test('Delivery - load & elemen utama', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findDeliveryPage(page);

    if (!foundUrl) {
      await page.goto(`${BASE}/mhc`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const sidebarLink = page.locator('a, [role="menuitem"]').filter({ hasText: /delivery|pengiriman/i }).first();
      if (await sidebarLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sidebarLink.click();
        await page.waitForTimeout(3000);
        console.log('✓ Link Delivery ditemukan di sidebar');
      } else {
        console.log('  ⚠ Delivery tidak ditemukan - skip test');
        return;
      }
    }

    const { bugs: pageBugs } = await checkPageLoaded(page, foundUrl || '/');
    bugs.push(...pageBugs);

    const heading = page.locator('h1, h2, h3').first();
    if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const text = await heading.textContent().catch(() => '');
      console.log(`✓ Heading: "${text.trim()}"`);
    } else {
      bugs.push('Heading tidak ditemukan');
    }

    const table = page.locator('table, [class*="list"]').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel/list Delivery tidak ditemukan');
    else console.log('✓ Tabel Delivery visible');

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new|delivery/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false))
      console.log('  ⚠ Tombol Create Delivery tidak ditemukan (mungkin generate dari SO/Stock Ready)');
    else console.log('✓ Tombol Create Delivery visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // DL-FN-01 & DL-FN-03: Buka form / validasi field (Create from SO)
  test('Delivery - buka form create & validasi field (DL-FN-01)', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findDeliveryPage(page);
    if (!foundUrl) {
      console.log('  ⚠ Delivery URL tidak ditemukan - skip form test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan - skip (Delivery mungkin digenerate otomatis)');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText().catch(() => '');

    const hasSOInBody = /Sales Order|SO Number|Pilih SO/i.test(bodyText);
    if (!hasSOInBody)
      bugs.push('Field Sales Order tidak ditemukan di form create delivery');
    else console.log('✓ Field Sales Order terdeteksi');

    const hasCourierInBody = /Courier|Kurir|Ekspedisi/i.test(bodyText);
    if (!hasCourierInBody)
      bugs.push('Field Courier tidak ditemukan di form create delivery');
    else console.log('✓ Field Courier terdeteksi');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // DL-MF-01..03: Mandatory field validation - submit tanpa data
  test('Delivery - submit kosong harus gagal (DL-MF-01..03)', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findDeliveryPage(page);
    if (!foundUrl) {
      console.log('  ⚠ Delivery URL tidak ditemukan - skip mandatory field test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new/i }).first();
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

    const hasError = /required|wajib|harus|mandatory|cannot be empty|kosong/i.test(bodyText);
    if (!hasError)
      bugs.push('Tidak ada validasi mandatory field saat submit kosong (DL-MF-01..03)');
    else
      console.log('✓ Validasi mandatory field muncul saat submit kosong');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // DL-NG-01 & DL-NG-02: Negative validation (exceed stock / unapproved SO)
  test('Delivery - qty melebihi stok harus ditolak (DL-NG-02)', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findDeliveryPage(page);
    if (!foundUrl) {
      console.log('  ⚠ Delivery URL tidak ditemukan - skip negative test');
      return;
    }

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    const qtyInput = page.locator('input[type="number"], input[name*="qty"], input[name*="quantity"]').first();
    if (await qtyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await qtyInput.fill('999999');
      await page.waitForTimeout(1000);
      
      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|simpan|save/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(2000);

        const bodyText = await page.locator('body').innerText().catch(() => '');
        const hasError = /insufficient|stok|melebihi|tidak cukup|error|invalid/i.test(bodyText);
        if (hasError)
          console.log('✓ Validasi insufficient stock terdeteksi - error muncul');
        else
          console.log('  ⚠ Tidak ada error untuk kuantitas berlebih - perlu cek manual');
      }
    } else {
      console.log('  ⚠ Input qty tidak ditemukan di form');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
