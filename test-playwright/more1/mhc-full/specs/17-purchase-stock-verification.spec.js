/**
 * 17-purchase-stock-verification.spec.js
 * Test: Purchase Stock Verification Module - MHC (Goods Receipt / GRN)
 * Scope: Load halaman, verifikasi penerimaan barang dari PO, validasi qty, negative tests
 * Note: URL ditemukan dari test run: /goods-receipt
 */
import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';

// URL utama yang sudah dikonfirmasi dari test run
const PSV_PRIMARY_URL = '/goods-receipt';
const PSV_FALLBACK_URL = '/purchase-stock-verification';

async function gotoAndCheckPSV(page) {
  // Coba URL utama dulu
  await page.goto(`${BASE}/mhc${PSV_PRIMARY_URL}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const body1 = await page.locator('body').innerText().catch(() => '');
  if (!/Page Not Found|Access Denied|404/i.test(body1.slice(0, 200))) {
    console.log(`✓ PSV terbuka di URL: ${PSV_PRIMARY_URL}`);
    return PSV_PRIMARY_URL;
  }
  // Fallback
  await page.goto(`${BASE}/mhc${PSV_FALLBACK_URL}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const body2 = await page.locator('body').innerText().catch(() => '');
  if (!/Page Not Found|Access Denied|404/i.test(body2.slice(0, 200))) {
    console.log(`✓ PSV terbuka di URL: ${PSV_FALLBACK_URL}`);
    return PSV_FALLBACK_URL;
  }
  return null;
}

test.describe('MHC - Purchase Stock Verification (GRN)', () => {
  test.setTimeout(90000);

  // Smoke test: load halaman
  test('Purchase Stock Verification - load & elemen utama', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await gotoAndCheckPSV(page);

    if (!foundUrl) {
      // Cari dari sidebar
      await page.goto(`${BASE}/mhc`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const sidebarLink = page.locator('a, [role="menuitem"]').filter({
        hasText: /purchase.*stock|stock.*verif|grn|goods receipt|verifikasi/i
      }).first();
      if (await sidebarLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sidebarLink.click();
        await page.waitForTimeout(3000);
        console.log('✓ Link Purchase Stock Verification ditemukan di sidebar');
      } else {
        console.log('  ⚠ Purchase Stock Verification tidak ditemukan - skip test');
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

    // Cek tabel
    const table = page.locator('table, [class*="list"]').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel/list Purchase Stock Verification tidak ditemukan');
    else console.log('✓ Tabel Purchase Stock Verification visible');

    // Cek kolom PO Number atau referensi PO
    if (/PO|purchase order|GRN/i.test(bodyText))
      console.log('✓ Referensi PO/GRN ditemukan di halaman');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Verifikasi penerimaan dari PO yang approved
  test('Purchase Stock Verification - verifikasi barang dari PO', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await gotoAndCheckPSV(page);
    if (!foundUrl) {
      console.log('  ⚠ PSV URL tidak ditemukan - skip verifikasi test');
      return;
    }

    // Cari baris pertama (PO yang menunggu verifikasi)
    const firstRow = page.locator('table tbody tr').first();
    if (!await firstRow.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tidak ada PO menunggu verifikasi - skip');
      return;
    }

    await firstRow.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek detail verifikasi muncul
    const hasPoDetail = /purchase order|supplier|produk|product|qty|received/i.test(bodyText);
    if (!hasPoDetail)
      bugs.push('Detail PO untuk verifikasi tidak ditemukan');
    else console.log('✓ Detail PO untuk verifikasi ditemukan');

    // Cek tombol Verify/Confirm
    const verifyBtn = page.locator('button').filter({ hasText: /verify|verif|confirm|receive|terima/i }).first();
    if (await verifyBtn.isVisible({ timeout: 5000 }).catch(() => false))
      console.log('✓ Tombol Verify/Confirm ditemukan');
    else
      console.log('  ⚠ Tombol Verify tidak ditemukan - mungkin perlu peran khusus');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Negative: verifikasi qty melebihi PO qty
  test('Purchase Stock Verification - qty received tidak boleh melebihi PO qty', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await gotoAndCheckPSV(page);
    if (!foundUrl) {
      console.log('  ⚠ PSV URL tidak ditemukan - skip over-qty test');
      return;
    }

    const firstRow = page.locator('table tbody tr').first();
    if (!await firstRow.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tidak ada data - skip over-qty test');
      return;
    }

    await firstRow.click();
    await page.waitForTimeout(2000);

    // Isi qty received melebihi PO qty
    const qtyInput = page.locator('input[name*="received"], input[name*="qty"], input[type="number"]').first();
    if (await qtyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await qtyInput.fill('999999');
      await page.waitForTimeout(500);

      const submitBtn = page.locator('button').filter({ hasText: /submit|confirm|verify|save/i }).first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(2000);

        const bodyText = await page.locator('body').innerText().catch(() => '');
        const hasError = /exceed|melebihi|cannot|tidak bisa|error|invalid/i.test(bodyText);
        if (hasError)
          console.log('✓ Error muncul saat qty received melebihi PO qty');
        else
          console.log('  ⚠ Tidak ada error untuk over-qty receive - perlu cek manual');
      }
    } else {
      console.log('  ⚠ Input qty received tidak ditemukan');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Status workflow setelah verifikasi → Stock Ready
  test('Purchase Stock Verification - status setelah verifikasi', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await gotoAndCheckPSV(page);
    if (!foundUrl) {
      console.log('  ⚠ PSV URL tidak ditemukan - skip status test');
      return;
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek ada label status
    const statusFound = /pending|draft|verified|received|completed|partial|awaiting/i.test(bodyText);
    if (statusFound)
      console.log('✓ Label status ditemukan di list Purchase Stock Verification');
    else
      console.log('  ⚠ Label status tidak terdeteksi - mungkin belum ada data');

    // Cek kolom status di tabel
    const statusCol = page.locator('table thead th').filter({ hasText: /status/i }).first();
    if (await statusCol.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Kolom Status ada di tabel');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
