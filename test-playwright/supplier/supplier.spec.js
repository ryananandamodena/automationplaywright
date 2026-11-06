// supplier/supplier.spec.js - Modena Supplier Portal E2E Automation Tests (Data-Driven with Real Submit)
import { test, expect } from '@playwright/test';
import { loginSupplier, solveCaptcha, applySessionIfAvailable, closeOCRWorker } from './helpers/auth.helper.js';
import testData from './data/supplier-test-data.json' with { type: 'json' };
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://supplier.modena.com';
const USERNAME = 'adm1';
const PASSWORD = '1357';
const DUMMY_FILE_PATH = path.resolve('supplier/dummy-lampiran.pdf');

test.beforeAll(async () => {
  // Pastikan file lampiran dummy tersedia untuk upload
  if (!fs.existsSync(DUMMY_FILE_PATH)) {
    fs.writeFileSync(DUMMY_FILE_PATH, '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
  }
});

test.afterAll(async () => {
  await closeOCRWorker();
});

/**
 * Helper untuk memastikan halaman sudah terautentikasi
 */
async function ensureAuthenticated(page) {
  await applySessionIfAvailable(page.context());
  await page.goto(`${BASE_URL}/invoice`, { waitUntil: 'domcontentloaded' });
  if (page.url().includes('/login')) {
    await loginSupplier(page, USERNAME, PASSWORD);
  }
}

// =========================================================================
// SUITE 1: AUTHENTICATION & LOGIN TESTS (DENGAN 3 VARIASI DATA)
// =========================================================================
test.describe('TC-AUTH: Modul Autentikasi & Keamanan', () => {

  test('TC-AUTH-001: Halaman login menampilkan form lengkap', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#captcha')).toBeVisible();
    await expect(page.locator('#captchaImage')).toBeVisible();
    await expect(page.locator('#btnRefreshCaptcha')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('TC-AUTH-002: Fitur Toggle Password dapat menampilkan dan menyembunyikan kata sandi', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    const passwordInput = page.locator('#password');
    const toggleBtn = page.locator('#togglePassword');

    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide password
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('TC-AUTH-003: Tombol refresh captcha berhasil memperbarui gambar captcha', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

    const captchaImg = page.locator('#captchaImage');
    const initialSrc = await captchaImg.getAttribute('src');

    await page.click('#btnRefreshCaptcha');
    await page.waitForTimeout(1000);

    const newSrc = await captchaImg.getAttribute('src');
    expect(newSrc).not.toBe(initialSrc);
  });

  test('TC-AUTH-004: Validasi form kosong mencegah submit', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.click('button[type="submit"]');
    expect(page.url()).toContain('/login');
  });

  // 3 DATA PENGUJIAN LOGIN (Kredensial Valid, Password Salah, User Tidak Terdaftar)
  for (const authItem of testData.auth) {
    test(`TC-AUTH-${authItem.id}: Pengujian Login - ${authItem.description}`, async ({ page }) => {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

      if (authItem.expectedStatus === 'success') {
        await loginSupplier(page, authItem.username, authItem.password);
        expect(page.url()).not.toContain('/login');
        await expect(page.locator('a.navbar-brand').first()).toBeVisible();
      } else {
        await page.fill('#username', authItem.username);
        await page.fill('#password', authItem.password);

        const captcha = await solveCaptcha(page);
        await page.fill('#captcha', captcha);
        await page.click('button[type="submit"]');

        await page.waitForTimeout(2000);
        expect(page.url()).toContain('/login');
      }
    });
  }
});

// =========================================================================
// SUITE 2: DASHBOARD & NAVIGASI PORTAL
// =========================================================================
test.describe('TC-NAV: Navigasi & Menu Portal', () => {

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
  });

  test('TC-NAV-001: Verifikasi menu navigasi utama portal', async ({ page }) => {
    await page.goto(`${BASE_URL}/pemberitahuan`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('a:has-text("Pemberitahuan")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Daftar Penagihan")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Input Penagihan Baru")').first()).toBeVisible();
    await expect(page.locator('a:has-text("Logbook Faktur")').first()).toBeVisible();
    await expect(page.locator('a[href*="logout"]').first()).toBeVisible();
  });

  test('TC-NAV-002: Tombol CTA "Lanjut ke Daftar Penagihan" mengarahkan ke /invoice', async ({ page }) => {
    await page.goto(`${BASE_URL}/pemberitahuan`, { waitUntil: 'domcontentloaded' });

    const ctaButton = page.locator('a.btn-primary:has-text("Lanjut ke Daftar Penagihan")').first();
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/invoice');
    }
  });
});

// =========================================================================
// SUITE 3: DAFTAR PENAGIHAN (DENGAN 3 VARIASI DATA FILTER)
// =========================================================================
test.describe('TC-INV-LIST: Modul Daftar Penagihan', () => {

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto(`${BASE_URL}/invoice`, { waitUntil: 'domcontentloaded' });
  });

  test('TC-INV-001: Menampilkan halaman Daftar Penagihan dan tabel data', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('a:has-text("Ajukan Penagihan Baru")')).toBeVisible();
  });

  test('TC-INV-002: Verifikasi header tabel penagihan', async ({ page }) => {
    const tableHeaders = page.locator('table thead th');
    const headerTexts = await tableHeaders.allTextContents();
    const fullHeaderText = headerTexts.join(' ').toUpperCase();

    expect(fullHeaderText).toContain('NO. SERAH TERIMA');
    expect(fullHeaderText).toContain('TGL. PENAGIHAN');
    expect(fullHeaderText).toContain('TOTAL NOMINAL');
    expect(fullHeaderText).toContain('STATUS PENAGIHAN');
    expect(fullHeaderText).toContain('AKSI');
  });

  // 3 DATA PENGUJIAN FILTER DAFTAR PENAGIHAN
  for (const filterItem of testData.invoiceFilter) {
    test(`TC-INV-${filterItem.id}: Pencarian Penagihan - ${filterItem.description} ("${filterItem.keyword}")`, async ({ page }) => {
      const searchInput = page.locator('input[type="text"], input[type="search"]').first();
      const searchBtn = page.locator('button:has-text("Cari")').first();

      await searchInput.fill(filterItem.keyword);
      await searchBtn.click();
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('table')).toBeVisible();
      const rowsCount = await page.locator('table tbody tr').count();
      expect(rowsCount).toBeGreaterThanOrEqual(filterItem.expectedMinResults);
    });
  }

  test('TC-INV-004: Tombol "Ajukan Penagihan Baru" mengarah ke /invoice/create', async ({ page }) => {
    await page.click('a:has-text("Ajukan Penagihan Baru")');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/invoice/create');
  });

  test('TC-INV-005: Aksi "Detail" membuka rincian faktur', async ({ page }) => {
    const detailBtn = page.locator('table a:has-text("Detail")').first();
    if (await detailBtn.isVisible()) {
      await detailBtn.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/invoice/view');
    }
  });

  test('TC-INV-006: Aksi "Cetak" membuka lembar cetak tanda terima', async ({ page }) => {
    const cetakBtn = page.locator('table a:has-text("Cetak")').first();
    if (await cetakBtn.isVisible()) {
      const href = await cetakBtn.getAttribute('href');
      expect(href).toContain('/invoice/print');
    }
  });

  test('TC-INV-007: Tombol Update dan Delete tersedia pada penagihan status Draft', async ({ page }) => {
    const updateBtn = page.locator('table a:has-text("Update")').first();
    const deleteBtn = page.locator('table button:has-text("Delete"), table form[action*="delete"]').first();

    if (await updateBtn.isVisible()) {
      await expect(updateBtn).toBeVisible();
      await expect(deleteBtn).toBeVisible();
    }
  });
});

// =========================================================================
// SUITE 4: INPUT PENAGIHAN BARU (DENGAN 3 REAL SUBMISSIONS DATA)
// =========================================================================
test.describe('TC-INV-CREATE: Modul Input Penagihan Baru (/invoice/create)', () => {

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto(`${BASE_URL}/invoice/create`, { waitUntil: 'domcontentloaded' });
  });

  test('TC-CREATE-001: Menampilkan form input penagihan dan informasi kategori', async ({ page }) => {
    await expect(page.locator('#apDesc')).toBeVisible();
    await expect(page.locator('#btn-add-row')).toBeVisible();
    await expect(page.locator('#btn-submit-penagihan')).toBeVisible();
  });

  test('TC-CREATE-002: Fitur Tambah Baris Faktur (Dynamic Row Addition)', async ({ page }) => {
    const initialRowsCount = await page.locator('input[name*="[invNo]"]').count();
    expect(initialRowsCount).toBeGreaterThanOrEqual(1);

    await page.click('#btn-add-row');
    await page.waitForTimeout(500);

    const newRowsCount = await page.locator('input[name*="[invNo]"]').count();
    expect(newRowsCount).toBe(initialRowsCount + 1);
  });

  test('TC-CREATE-003: Fitur Hapus Baris Faktur (Dynamic Row Deletion)', async ({ page }) => {
    await page.click('#btn-add-row');
    await page.waitForTimeout(500);
    const beforeCount = await page.locator('input[name*="[invNo]"]').count();

    const removeBtns = page.locator('.btn-remove-row');
    const removeBtnCount = await removeBtns.count();
    if (removeBtnCount > 0) {
      await removeBtns.last().click();
      await page.waitForTimeout(500);
      const afterCount = await page.locator('input[name*="[invNo]"]').count();
      expect(afterCount).toBe(beforeCount - 1);
    }
  });

  // 3 DATA PENGUJIAN PEMBUATAN & REAL SUBMIT PENAGIHAN BARU
  for (const invData of testData.invoiceCreation) {
    test(`TC-CREATE-${invData.id}: Real Submit Penagihan - ${invData.tipe}`, async ({ page }) => {
      // Buat nomor invoice unik berbasis timestamp agar tidak duplikat
      const uniqueSuffix = Date.now().toString().slice(-5);
      const noteUnique = `${invData.keterangan} [Auto-${uniqueSuffix}]`;

      // 1. Isi Catatan Khusus
      await page.locator('#apDesc').fill(noteUnique);

      // 2. Tambah baris dinamis jika data memiliki lebih dari 1 item faktur
      for (let i = 1; i < invData.items.length; i++) {
        await page.click('#btn-add-row');
        await page.waitForTimeout(300);
      }

      // 3. Isi setiap item faktur dan unggah file lampiran
      for (let i = 0; i < invData.items.length; i++) {
        const item = invData.items[i];
        const uniqueInvNo = `${item.invNo}-${uniqueSuffix}`;
        const invNoInput = page.locator('input[name*="[invNo]"]').nth(i);
        const invDateInput = page.locator('input[name*="[invDate]"]').nth(i);
        const poNoInput = page.locator('input[name*="[poNo]"]').nth(i);
        const amountInput = page.locator('input[name*="[amount]"]').nth(i);
        const fileInput = page.locator('input[type="file"][name*="[file]"]').nth(i);

        await invNoInput.fill(uniqueInvNo);
        await invDateInput.fill(item.invDate);
        await poNoInput.fill(item.poNo);
        await amountInput.fill(item.amount);

        // Upload lampiran dummy
        if (await fileInput.isVisible()) {
          await fileInput.setInputFiles(DUMMY_FILE_PATH);
        }
      }

      // 4. Centang Dokumen Pendukung yang Wajib
      for (const docName of invData.documents) {
        const docLabel = page.locator('label', { hasText: docName });
        const docCheckbox = docLabel.locator('input[type="checkbox"]');
        if (await docCheckbox.isVisible()) {
          await docCheckbox.check();
          await expect(docCheckbox).toBeChecked();
        }
      }

      // 5. Submit Form Penagihan
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
        page.click('#btn-submit-penagihan')
      ]);

      await page.waitForTimeout(1500);

      // 6. Verifikasi berhasil dialihkan ke halaman view atau invoice list
      expect(page.url()).toMatch(/\/invoice(\/view|\/list|$)/);

      // 7. Buka Daftar Penagihan dan pastikan data yang baru tersubmit tampil di tabel!
      await page.goto(`${BASE_URL}/invoice`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('table')).toBeVisible();

      const tableBodyText = await page.locator('table tbody').innerText();
      expect(tableBodyText).toContain(noteUnique);
    });
  }

  test('TC-CREATE-006: Validasi saat submit jika nomor invoice atau berkas wajib kosong', async ({ page }) => {
    const invNoInput = page.locator('input[name*="[invNo]"]').first();
    await invNoInput.fill('');

    await page.click('#btn-submit-penagihan');
    await page.waitForTimeout(1000);

    expect(page.url()).toContain('/invoice/create');
  });
});

// =========================================================================
// SUITE 5: LOGBOOK FAKTUR (DENGAN 3 VARIASI DATA FILTER)
// =========================================================================
test.describe('TC-LOGBOOK: Modul Logbook Faktur (/logbook)', () => {

  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto(`${BASE_URL}/logbook`, { waitUntil: 'domcontentloaded' });
  });

  test('TC-LOG-001: Menampilkan halaman Logbook Faktur dan tabel tracking', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('button:has-text("Cari")')).toBeVisible();
  });

  test('TC-LOG-002: Verifikasi kolom tabel Logbook', async ({ page }) => {
    const tableHeaders = page.locator('table thead th');
    const headerTexts = await tableHeaders.allTextContents();
    const fullHeaderText = headerTexts.join(' ').toUpperCase();

    expect(fullHeaderText).toContain('NOMOR INVOICE');
    expect(fullHeaderText).toContain('TGL. TERIMA');
    expect(fullHeaderText).toContain('NO. SERAH TERIMA');
    expect(fullHeaderText).toContain('STATUS VERIFIKASI');
    expect(fullHeaderText).toContain('TGL. PEMBAYARAN');
    expect(fullHeaderText).toContain('TOTAL NILAI');
  });

  // 3 DATA PENGUJIAN FILTER LOGBOOK
  for (const logItem of testData.logbookFilter) {
    test(`TC-LOG-${logItem.id}: Pencarian Logbook - ${logItem.description} ("${logItem.keyword}")`, async ({ page }) => {
      const inputs = page.locator('form input[type="text"], form input[type="date"]');
      const count = await inputs.count();
      if (count > 0) {
        await inputs.first().fill(logItem.keyword);
      }

      const searchBtn = page.locator('button:has-text("Cari")').first();
      await searchBtn.click();
      await page.waitForLoadState('domcontentloaded');

      await expect(page.locator('table')).toBeVisible();
      const rowsCount = await page.locator('table tbody tr').count();
      expect(rowsCount).toBeGreaterThanOrEqual(logItem.expectedMinResults);
    });
  }
});

// =========================================================================
// SUITE 6: LOGOUT & TERMINASI SESI
// =========================================================================
test.describe('TC-LOGOUT: Modul Logout & Sesi', () => {

  test('TC-LOGOUT-001: Logout berhasil dan mengarahkan kembali ke halaman login', async ({ page }) => {
    await ensureAuthenticated(page);

    const logoutLink = page.locator('a[href*="logout"]').first();
    await logoutLink.click();
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('/login');
    await expect(page.locator('#username')).toBeVisible();
  });
});
