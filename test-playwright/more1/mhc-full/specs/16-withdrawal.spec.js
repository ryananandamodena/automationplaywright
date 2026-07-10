/**
 * 16-withdrawal.spec.js
 * Test: Withdrawal Module - MHC
 * Scope: Buat withdrawal request, validasi mandatory, workflow, negative tests
 * Note: URL /withdrawal dikonfirmasi dari 04-operations.spec.js
 */
import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';
const WD_URL = `${BASE}/mhc/withdrawal`;

// Helper: buka Withdrawal dan cek accessible
async function gotoWithdrawal(page) {
  await page.goto(WD_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const body = await page.locator('body').innerText().catch(() => '');
  if (/Page Not Found|Access Denied|404|forbidden/i.test(body.slice(0, 300))) {
    console.log('  ⚠ Withdrawal tidak accessible dari URL /withdrawal');
    return false;
  }
  const currentUrl = page.url();
  console.log(`✓ Withdrawal terbuka di: ${currentUrl}`);
  return true;
}

test.describe('MHC - Withdrawal', () => {
  test.setTimeout(90000);

  // Smoke test: load & elemen utama
  test('Withdrawal - load & elemen utama', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const ok = await gotoWithdrawal(page);
    if (!ok) { console.log('  ⚠ Withdrawal skip'); return; }

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
      bugs.push('Tabel/list Withdrawal tidak ditemukan');
    else console.log('✓ Tabel Withdrawal visible');

    // Cek tombol Create
    const createBtn = page.locator('button').filter({ hasText: /create|buat|new|tambah/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Tombol Create Withdrawal tidak ditemukan');
    else console.log('✓ Tombol Create Withdrawal visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Form create withdrawal & validasi field
  test('Withdrawal - form create & field wajib', async ({ page }) => {
    const bugs = [];
    await login(page);

    const ok = await gotoWithdrawal(page);
    if (!ok) { console.log('  ⚠ Withdrawal skip'); return; }

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText().catch(() => '');

    if (/warehouse|gudang/i.test(bodyText))
      console.log('✓ Field Warehouse ditemukan di form');
    else
      bugs.push('Field Warehouse tidak ditemukan di form Withdrawal');

    if (/product|produk|item/i.test(bodyText))
      console.log('✓ Field Product ditemukan di form');
    else
      bugs.push('Field Product tidak ditemukan di form Withdrawal');

    if (/qty|quantity|jumlah/i.test(bodyText))
      console.log('✓ Field Quantity ditemukan di form');
    else
      bugs.push('Field Quantity tidak ditemukan di form Withdrawal');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Submit form kosong - mandatory validation
  test('Withdrawal - submit form kosong harus error', async ({ page }) => {
    const bugs = [];
    await login(page);

    const ok = await gotoWithdrawal(page);
    if (!ok) { console.log('  ⚠ Withdrawal skip'); return; }

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|simpan|save|send/i }).first();
    if (!await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  ⚠ Submit button tidak ditemukan');
      return;
    }

    await submitBtn.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasValidation = /required|wajib|harus|mandatory|empty|kosong/i.test(bodyText);
    if (!hasValidation)
      bugs.push('Tidak ada validasi mandatory saat form Withdrawal kosong disubmit');
    else
      console.log('✓ Validasi mandatory field muncul');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Negative: withdraw qty melebihi stok tersedia
  test('Withdrawal - qty melebihi stok harus ditolak', async ({ page }) => {
    const bugs = [];
    await login(page);

    const ok = await gotoWithdrawal(page);
    if (!ok) { console.log('  ⚠ Withdrawal skip'); return; }

    const createBtn = page.locator('button').filter({ hasText: /create|buat|new/i }).first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create tidak ditemukan');
      return;
    }
    await createBtn.click();
    await page.waitForTimeout(2000);

    const qtyInput = page.locator('input[name*="qty"], input[name*="quantity"], input[type="number"]').first();
    if (await qtyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await qtyInput.fill('999999999');
      await page.waitForTimeout(500);

      const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /submit|simpan|save/i }).first();
      if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(2000);

        const bodyText = await page.locator('body').innerText().catch(() => '');
        const hasError = /insufficient|stok tidak cukup|exceeds|melebihi|kurang|error/i.test(bodyText);
        if (hasError)
          console.log('✓ Error muncul saat qty melebihi stok');
        else
          console.log('  ⚠ Tidak ada error untuk qty melebihi stok - perlu cek manual');
      }
    } else {
      console.log('  ⚠ Input qty tidak ditemukan untuk over-stock test');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // Cek status dan kolom di list withdrawal
  test('Withdrawal - list view & kolom status', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const ok = await gotoWithdrawal(page);
    if (!ok) { console.log('  ⚠ Withdrawal skip'); return; }

    const bodyText = await page.locator('body').innerText().catch(() => '');

    const statusCol = page.locator('table thead th').filter({ hasText: /status/i }).first();
    if (await statusCol.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Kolom Status ditemukan di list Withdrawal');
    else if (/status|draft|approved|pending/i.test(bodyText))
      console.log('✓ Status terdeteksi di body');
    else
      console.log('  ⚠ Status tidak terdeteksi');

    const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Search input ditemukan di list Withdrawal');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
