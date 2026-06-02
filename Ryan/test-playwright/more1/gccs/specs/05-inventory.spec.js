// specs/05-inventory.spec.js - GCCS Inventory Tests
import { test, expect } from '@playwright/test';
import { loginGCCS } from '../helpers/login.js';

test.describe('TC-INV: Inventory', () => {

  test.beforeEach(async ({ page }) => {
    await loginGCCS(page);
  });

  // TC-INV-001: Halaman My Inventory tampil dengan benar
  test('TC-INV-001: Halaman My Inventory tampil dengan benar', async ({ page }) => {
    await page.goto('/inventory/myinventory');
    await page.waitForLoadState('domcontentloaded');

    // Verifikasi judul
    await expect(page.locator('body')).toContainText('My Inventory');

    // Verifikasi info technician
    await expect(page.locator('body')).toContainText('Technician ID');
    await expect(page.locator('body')).toContainText('Limit Amount');
    await expect(page.locator('body')).toContainText('Usage Amount');
    await expect(page.locator('body')).toContainText('Balanced Limit Amount');

    // Verifikasi tab ASC Warehouse dan MODENA Warehouse
    await expect(page.locator('body')).toContainText('ASC Warehouse');
    await expect(page.locator('body')).toContainText('MODENA Warehouse');

    // Verifikasi kolom tabel
    const columns = ['Item Name', 'Item Code', 'Item Group Name', 'Stock', 'Booked', 'Availability', 'Price'];
    for (const col of columns) {
      await expect(page.locator('body')).toContainText(col);
    }
  });

  // TC-INV-002: Halaman Inventory Status dapat diakses
  test('TC-INV-002: Halaman Inventory Status dapat diakses', async ({ page }) => {
    await page.goto('/inventory/inventory-status');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/inventory-status/);
    await expect(page.locator('body')).toContainText('Inventory');
  });

  // TC-INV-003: Halaman Posting List dapat diakses
  test('TC-INV-003: Halaman Posting List dapat diakses', async ({ page }) => {
    await page.goto('/inventory/posting');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/posting/);
  });

  // TC-INV-004: Halaman ETA dapat diakses
  test('TC-INV-004: Halaman ETA dapat diakses', async ({ page }) => {
    await page.goto('/inventory/eta');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/\/eta/);
  });

  // TC-INV-005: Tab MODENA Warehouse dapat diklik di My Inventory
  test('TC-INV-005: Tab MODENA Warehouse dapat diklik', async ({ page }) => {
    await page.goto('/inventory/myinventory');
    await page.waitForLoadState('domcontentloaded');

    const modenaTab = page.locator('body').getByText('MODENA Warehouse');
    await modenaTab.click();
    await page.waitForTimeout(800);
    // Tab masih visible setelah diklik
    await expect(modenaTab).toBeVisible();
  });

  // TC-INV-006: Filter Data pada My Inventory dapat diklik
  test('TC-INV-006: Tombol Filter Data pada My Inventory tersedia', async ({ page }) => {
    await page.goto('/inventory/myinventory');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText('Filter Data');
  });

});
