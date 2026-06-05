// specs/07-reports.spec.js - GCCS Reports Tests
import { test, expect } from '@playwright/test';
import { loginGCCS } from '../helpers/login.js';

test.describe('TC-RPT: Reports', () => {

  test.beforeEach(async ({ page }) => {
    await loginGCCS(page);
  });

  // TC-RPT-001: Halaman Pending Part Report dapat diakses
  test('TC-RPT-001: Halaman Pending Part Report dapat diakses', async ({ page }) => {
    await page.goto('/report/pending-part');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/pending-part/);
    await expect(page.locator('body')).toContainText('Pending Part');
  });

  // TC-RPT-002: Halaman Service Omzet Achievement dapat diakses
  test('TC-RPT-002: Halaman Service Omzet Achievement dapat diakses', async ({ page }) => {
    await page.goto('/report/omzet-service-operation');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/omzet-service-operation/);
  });

  // TC-RPT-003: Halaman Spare Part Already Fulfill dapat diakses
  test('TC-RPT-003: Halaman Spare Part Already Fulfill dapat diakses', async ({ page }) => {
    await page.goto('/report/sparepart-already-fulfill-so');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/sparepart-already-fulfill/);
  });

  // TC-RPT-004: Halaman AP Report dapat diakses
  test('TC-RPT-004: Halaman AP Report dapat diakses', async ({ page }) => {
    await page.goto('/report/asc-ap');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/asc-ap/);
  });

  // TC-RPT-005: Halaman Highest Pending Part dapat diakses
  test('TC-RPT-005: Halaman Highest Pending Part dapat diakses', async ({ page }) => {
    await page.goto('/report/highest-pending-part');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/highest-pending-part/);
  });

  // TC-RPT-006: Menu Report menampilkan semua submenu
  test('TC-RPT-006: Menu Report menampilkan semua submenu', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Expand Report menu
    await page.evaluate(() => {
      const menus = Array.from(document.querySelectorAll('div.menu'));
      const reportMenu = menus.find(m => m.textContent.trim() === 'Report');
      if (reportMenu) reportMenu.click();
    });
    await page.waitForTimeout(600);

    const sidebar = page.locator('nav, aside');
    await expect(sidebar).toContainText('Pending Part');
    await expect(sidebar).toContainText('Service Omzet Achievement');
    await expect(sidebar).toContainText('Spare Part Already Fulfill');
    await expect(sidebar).toContainText('AP');
    await expect(sidebar).toContainText('Highest Pending Part');
  });

});
