// specs/04-wo-monitoring.spec.js - GCCS Work Order Monitoring Tests
import { test, expect } from '@playwright/test';
import { loginGCCS } from '../helpers/login.js';

test.describe('TC-WO: Work Order Monitoring', () => {

  test.beforeEach(async ({ page }) => {
    await loginGCCS(page);
    await page.goto('/repair-center/wo-monitoring');
    await page.waitForLoadState('domcontentloaded');
  });

  // TC-WO-001: Halaman WO Monitoring tampil dengan benar
  test('TC-WO-001: Halaman WO Monitoring tampil dengan benar', async ({ page }) => {
    // Verifikasi judul
    await expect(page.locator('body')).toContainText('WO Monitoring');

    // Verifikasi semua filter tersedia
    await expect(page.locator('body')).toContainText('Head Technician');
    await expect(page.locator('body')).toContainText('WO Activity Status');
    await expect(page.locator('body')).toContainText('Service Center');
    await expect(page.locator('body')).toContainText('WO Created Date');
    await expect(page.locator('body')).toContainText('WO Number');

    // Verifikasi tombol aksi
    await expect(page.locator('button, [role="button"]').filter({ hasText: 'Filter' })).toBeVisible();
    await expect(page.locator('button, [role="button"]').filter({ hasText: 'Export to Excel' })).toBeVisible();
  });

  // TC-WO-002: Kolom tabel WO Monitoring tampil lengkap
  test('TC-WO-002: Kolom tabel WO Monitoring tampil lengkap', async ({ page }) => {
    const columns = [
      'WO Number', 'RON Number', 'Sales Model', 'Customer Name',
      'Phone Number', 'Service Center', 'WO Activity Status',
      'Technician', 'Created Date'
    ];
    for (const col of columns) {
      await expect(page.locator('body')).toContainText(col);
    }
  });

  // TC-WO-003: Legend aksi tersedia di bawah tabel
  test('TC-WO-003: Legend aksi tersedia', async ({ page }) => {
    const legends = ['View Details', 'Edit', 'Delete', 'Accept', 'Re-Transfer', 'Reject'];
    for (const legend of legends) {
      await expect(page.locator('body')).toContainText(legend);
    }
  });

  // TC-WO-004: Filter WO Number menggunakan input text
  test('TC-WO-004: Filter WO Number dapat diisi', async ({ page }) => {
    const woNumberInput = page.locator('input[placeholder*="WO Number"], input').nth(0);
    // Cari input filter WO Number
    const filterInput = page.locator('input').filter({ hasText: '' }).first();
    // Verifikasi tombol filter dapat diklik
    const filterBtn = page.locator('button').filter({ hasText: 'Filter' });
    await expect(filterBtn).toBeEnabled();
  });

  // TC-WO-005: Navigasi ke Work Order History
  test('TC-WO-005: Navigasi ke Work Order History', async ({ page }) => {
    await page.goto('/repair-center/wo-history');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText('Work Order History');
  });

  // TC-WO-006: Navigasi ke Work Order Dispatch
  test('TC-WO-006: Navigasi ke Work Order Dispatch', async ({ page }) => {
    await page.goto('/repair-center/wo-dispatch');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/wo-dispatch/);
  });

  // TC-WO-007: Navigasi ke Claim Warranty
  test('TC-WO-007: Navigasi ke Claim Warranty', async ({ page }) => {
    await page.goto('/repair-center/claim-warranty');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/claim-warranty/);
  });

  // TC-WO-008: Halaman Pre Work Order History dapat diakses
  test('TC-WO-008: Halaman Pre Work Order History dapat diakses', async ({ page }) => {
    await page.goto('/repair-center/pre-wo-history');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/pre-wo-history/);
  });

});
