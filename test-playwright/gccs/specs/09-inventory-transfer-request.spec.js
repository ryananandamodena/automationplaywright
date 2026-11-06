// specs/09-inventory-transfer-request.spec.js - GCCS Inventory Transfer Request Tests (ASC & DSC)
import { test, expect } from '@playwright/test';

// Akun ASC (Authorized Service Center - Admin ASC)
const ASC_PRIMARY_USER = 'AD_JVK_01';
const ASC_FALLBACK_USERS = ['AD_N&N_01', 'AD_CMN_02', 'AD_CMN_01'];
const PASSWORD = 'P@ssw0rd.1';

// Akun DSC (Direct Service Center - Stock Keeper)
const DSC_PRIMARY_USER = 'SK_002';

/**
 * Helper login fleksibel dengan fallback
 */
async function performLogin(page, username, password) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  if (page.url().includes('/dashboard')) return true;

  const userInput = page.locator('#userName, input[name="userName"], input[name="username"]').first();
  const passInput = page.locator('input[name="password"]').first();
  const submitBtn = page.locator('button[type="submit"], button:has-text("Login")').first();

  await userInput.fill(username);
  await passInput.fill(password);
  await submitBtn.click();
  await page.waitForTimeout(2500);

  const bodyText = await page.textContent('body');
  if (bodyText.includes('Invalid') || bodyText.includes('Salah') || !page.url().includes('/dashboard')) {
    return false;
  }
  return true;
}

/**
 * Helper untuk login dengan akun ASC (AD_JVK_01 atau fallback)
 */
async function loginWithASCUser(page) {
  const success = await performLogin(page, ASC_PRIMARY_USER, PASSWORD);
  if (!success) {
    for (const fallback of ASC_FALLBACK_USERS) {
      const fbSuccess = await performLogin(page, fallback, PASSWORD);
      if (fbSuccess) break;
    }
  }
}

/**
 * Helper untuk login dengan akun DSC (SK_002)
 */
async function loginWithDSCUser(page) {
  await performLogin(page, DSC_PRIMARY_USER, PASSWORD);
}

// =========================================================================
// TEST SUITE: ASC (Authorized Service Center)
// =========================================================================
test.describe('TC-TR-ASC: Inventory Transfer Request (ASC - Admin ASC)', () => {

  test.beforeEach(async ({ page }) => {
    await loginWithASCUser(page);
  });

  // TC-TR-001: Halaman Transfer Request dapat diakses dengan akun ASC
  test('TC-TR-001: Halaman Transfer Request dapat diakses dengan akun ASC', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Verifikasi URL halaman
    await expect(page).toHaveURL(/\/inventory\/transfer\/transfer-request/);

    // Verifikasi tombol-tombol utama ASC di header/toolbar
    await expect(page.locator('button:has-text("Create Request")')).toBeVisible();
    await expect(page.locator('button:has-text("Filter")')).toBeVisible();
    await expect(page.locator('button:has-text("Sync")')).toBeVisible();

    // User ASC tidak memiliki tombol Branch Request
    await expect(page.locator('button:has-text("Branch Request")')).not.toBeVisible();
  });

  // TC-TR-002: Verifikasi komponen filter dan kolom tabel Transfer Request ASC
  test('TC-TR-002: Verifikasi komponen filter dan kolom tabel Transfer Request ASC', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Verifikasi ketersediaan filter input
    await expect(page.locator('input[placeholder*="Work Order" i]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Item Code" i]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Request Number" i]')).toBeVisible();
    await expect(page.locator('input[placeholder*="RON Number" i]')).toBeVisible();

    // Verifikasi kolom tabel Transfer Request
    const expectedHeaders = [
      'Action',
      'From Warehouse',
      'To Warehouse',
      'Request Number',
      'Status',
      'RON Number',
      'WO Number',
      'Total Items',
      'Total Price'
    ];

    const bodyText = await page.textContent('body');
    for (const header of expectedHeaders) {
      expect(bodyText).toContain(header);
    }
  });

  // TC-TR-003: Klik tombol Create Request pada ASC menampilkan 2 pilihan (Work Order dan E-Catalog)
  test('TC-TR-003: Klik Create Request pada ASC menampilkan pilihan Work Order dan E-Catalog', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Klik tombol Create Request
    const createBtn = page.locator('button:has-text("Create Request")').first();
    await createBtn.click();
    await page.waitForTimeout(1000);

    // Verifikasi modal pilihan jenis transfer muncul
    const woBtn = page.locator('button:has-text("Work Order")').first();
    const ecatalogBtn = page.locator('button:has-text("E-Catalog")').first();

    await expect(woBtn).toBeVisible();
    await expect(ecatalogBtn).toBeVisible();

    // User ASC tidak memiliki opsi My Inventory pada modal Create Request
    const modal = page.locator('.p-dialog-visible');
    await expect(modal.locator('button:has-text("My Inventory")')).not.toBeVisible();
  });

  // TC-TR-004: Akses form Create Request tipe Work Order
  test('TC-TR-004: Akses form Create Request tipe Work Order', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request/detail?type=wo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/detail\?type=wo/);

    // Verifikasi elemen form pembuatan request
    await expect(page.locator('input[placeholder="Select Technician"]')).toBeVisible();
    await expect(page.locator('input[placeholder="WO Number"]')).toBeVisible();
    await expect(page.locator('.p-dropdown:has-text("Select Warehouse"), select').first()).toBeVisible();
    await expect(page.locator('button:has-text("Add Items")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Request")')).toBeVisible();
  });

  // TC-TR-005: Modal pemilihan teknisi (List Technicians) dapat dibuka dan dipilih
  test('TC-TR-005: Modal List Technicians dapat dibuka dan teknisi dapat dipilih', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request/detail?type=wo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Klik input Select Technician
    const techInput = page.locator('input[placeholder="Select Technician"]');
    await techInput.click();
    await page.waitForTimeout(1500);

    // Verifikasi modal List Technicians muncul
    const modal = page.locator('.p-dialog-visible');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('List Technicians');

    // Verifikasi kolom tabel teknisi
    await expect(modal).toContainText('User Name');
    await expect(modal).toContainText('Full Name');
    await expect(modal).toContainText('Service Center');

    // Pilih teknisi pertama jika ada data
    const selectFirstTechBtn = modal.locator('table tbody tr').first().locator('button, a, svg, i').first();
    if (await selectFirstTechBtn.isVisible().catch(() => false)) {
      await selectFirstTechBtn.click();
      await page.waitForTimeout(1000);

      // Verifikasi field technician terisi
      const selectedVal = await techInput.inputValue();
      expect(selectedVal.length).toBeGreaterThan(0);
    }
  });

  // TC-TR-006: Modal Technician Work Orders terbuka saat WO Number diklik
  test('TC-TR-006: Modal Technician Work Orders terbuka saat field WO Number diklik', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request/detail?type=wo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Pilih teknisi terlebih dahulu
    await page.click('input[placeholder="Select Technician"]');
    await page.waitForTimeout(1000);

    const selectTechBtn = page.locator('.p-dialog-visible table tbody tr').first().locator('button, a, svg, i').first();
    if (await selectTechBtn.isVisible().catch(() => false)) {
      await selectTechBtn.click();
      await page.waitForTimeout(1000);
    }

    // Klik field WO Number
    const woInput = page.locator('input[placeholder="WO Number"]');
    await woInput.click();
    await page.waitForTimeout(1500);

    // Verifikasi modal Technician Work Orders muncul
    const woModal = page.locator('.p-dialog-visible');
    await expect(woModal).toBeVisible();
    await expect(woModal).toContainText('Technician Work Orders');

    // Tutup modal
    const closeBtn = woModal.locator('.p-dialog-header-close, button[aria-label="Close"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  });

  // TC-TR-007: Akses form Create Request tipe E-Catalog
  test('TC-TR-007: Akses form Create Request tipe E-Catalog', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request/detail?type=e-catalog', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/detail\?type=e-catalog/);
    await expect(page.locator('input[placeholder="Select Technician"]')).toBeVisible();
    await expect(page.locator('input[placeholder="WO Number"]')).toBeVisible();
    await expect(page.locator('button:has-text("E-Catalog")')).toBeVisible();
  });

  // TC-TR-008: Validasi submit Create Request (tombol disabled jika form/item belum lengkap)
  test('TC-TR-008: Tombol Create Request berstatus disabled ketika item part belum ditambahkan', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request/detail?type=wo', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Verifikasi tombol submit Create Request berstatus disabled jika item belum ada
    const submitBtn = page.locator('button:has-text("Create Request")');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  // TC-TR-009: Akses halaman Transfer Part Acceptance pada ASC
  test('TC-TR-009: Halaman Transfer Part Acceptance dapat diakses oleh ASC', async ({ page }) => {
    await page.goto('/inventory/transfer/part-acceptance', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/inventory\/transfer\/part-acceptance/);
    await expect(page.locator('body')).toContainText('List Part Acceptance');

    // Verifikasi header tabel
    const expectedHeaders = ['Action', 'Request Number', 'Created Date', 'Total Items', 'Total Price', 'Status'];
    const bodyText = await page.textContent('body');
    for (const h of expectedHeaders) {
      expect(bodyText).toContain(h);
    }
  });

});

// =========================================================================
// TEST SUITE: DSC (Direct Service Center / Stock Keeper)
// =========================================================================
test.describe('TC-TR-DSC: Inventory Transfer Request (DSC - Stock Keeper)', () => {

  test.beforeEach(async ({ page }) => {
    await loginWithDSCUser(page);
  });

  // TC-TR-DSC-001: Halaman Transfer Request dapat diakses dengan akun DSC & memiliki tombol Branch Request
  test('TC-TR-DSC-001: Halaman Transfer Request dapat diakses akun DSC dan menampilkan tombol Branch Request', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/inventory\/transfer\/transfer-request/);

    // Verifikasi tombol-tombol utama DSC termasuk Branch Request
    await expect(page.locator('button:has-text("Create Request")')).toBeVisible();
    await expect(page.locator('button:has-text("Filter")')).toBeVisible();
    await expect(page.locator('button:has-text("Sync")')).toBeVisible();
    await expect(page.locator('button:has-text("Branch Request")')).toBeVisible();
  });

  // TC-TR-DSC-002: Verifikasi kolom tabel dan filter khusus DSC (IT Branch & PMT)
  test('TC-TR-DSC-002: Verifikasi kolom tabel dan filter khusus Branch / PMT pada DSC', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Verifikasi kolom khusus alur branch/PMT di tabel
    const dscSpecificHeaders = [
      'IT Branch To Tech',
      'ITR To PMT/Branch',
      'IT From PMT/Branch'
    ];

    const bodyText = await page.textContent('body');
    for (const header of dscSpecificHeaders) {
      expect(bodyText).toContain(header);
    }

    // Verifikasi filter khusus DSC tersedia
    await expect(page.locator('input[placeholder*="IT Branch To Tech" i]')).toBeVisible();
    await expect(page.locator('input[placeholder*="ITR To PMT/Branch" i]')).toBeVisible();
    await expect(page.locator('input[placeholder*="IT From PMT/Branch" i]')).toBeVisible();
  });

  // TC-TR-DSC-003: Klik Create Request pada DSC menampilkan 3 pilihan termasuk My Inventory
  test('TC-TR-DSC-003: Klik Create Request pada DSC menampilkan pilihan My Inventory, Work Order, dan E-Catalog', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Klik tombol Create Request
    await page.locator('button:has-text("Create Request")').first().click();
    await page.waitForTimeout(1000);

    // Verifikasi 3 tombol opsi muncul di modal
    const myInvBtn = page.locator('button:has-text("My Inventory")').first();
    const woBtn = page.locator('button:has-text("Work Order")').first();
    const ecatalogBtn = page.locator('button:has-text("E-Catalog")').first();

    await expect(myInvBtn).toBeVisible();
    await expect(woBtn).toBeVisible();
    await expect(ecatalogBtn).toBeVisible();
  });

  // TC-TR-DSC-004: Akses form Create Request tipe My Inventory
  test('TC-TR-DSC-004: Akses form Create Request tipe My Inventory pada DSC', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request/detail', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/inventory\/transfer\/transfer-request\/detail/);

    // Verifikasi form request My Inventory
    await expect(page.locator('input[placeholder="Select Technician"]')).toBeVisible();
    await expect(page.locator('.p-dropdown:has-text("Select Warehouse"), select').first()).toBeVisible();
    await expect(page.locator('button:has-text("Add Items")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Request")')).toBeVisible();
  });

  // TC-TR-DSC-005: Navigasi dan verifikasi halaman Branch Request List
  test('TC-TR-DSC-005: Navigasi ke halaman Branch Request List melalui tombol Branch Request', async ({ page }) => {
    await page.goto('/inventory/transfer/transfer-request', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Klik tombol Branch Request
    await page.locator('button:has-text("Branch Request")').first().click();
    await page.waitForTimeout(2000);

    // Verifikasi URL halaman branch request
    await expect(page).toHaveURL(/\/inventory\/transfer\/transfer-request\/branch-request/);

    // Verifikasi elemen halaman Branch Request List
    await expect(page.locator('body')).toContainText('Branch Request List');
    await expect(page.locator('button:has-text("Filter")')).toBeVisible();
  });

  // TC-TR-DSC-006: Akses halaman Transfer Part Acceptance pada DSC
  test('TC-TR-DSC-006: Halaman Transfer Part Acceptance dapat diakses oleh DSC dan menampilkan list data', async ({ page }) => {
    await page.goto('/inventory/transfer/part-acceptance', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await expect(page).toHaveURL(/\/inventory\/transfer\/part-acceptance/);
    await expect(page.locator('body')).toContainText('List Part Acceptance');

    // Verifikasi header tabel
    const expectedHeaders = ['Action', 'Request Number', 'Created Date', 'Total Items', 'Total Price', 'Part Acceptance Status'];
    const bodyText = await page.textContent('body');
    for (const h of expectedHeaders) {
      expect(bodyText).toContain(h);
    }
  });

  // TC-TR-DSC-007: Verifikasi modal Detail Part Acceptance terbuka saat klik icon Action
  test('TC-TR-DSC-007: Modal Detail Part Acceptance terbuka saat Action diklik dan menampilkan tombol Accept', async ({ page }) => {
    await page.goto('/inventory/transfer/part-acceptance', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const firstActionIcon = page.locator('table tbody tr').first().locator('td').first().locator('svg').first();
    if (await firstActionIcon.isVisible().catch(() => false)) {
      await firstActionIcon.click();
      await page.waitForTimeout(1500);

      // Verifikasi modal Detail Part Acceptance muncul
      const modal = page.locator('.p-dialog-visible, [role="dialog"]').first();
      await expect(modal).toBeVisible();
      await expect(modal).toContainText('Detail Part Acceptence');
      await expect(modal.locator('button:has-text("Accept")')).toBeVisible();
      await expect(modal.locator('button:has-text("Cancel")')).toBeVisible();

      // Tutup modal
      await modal.locator('button:has-text("Cancel")').click();
    }
  });

});

