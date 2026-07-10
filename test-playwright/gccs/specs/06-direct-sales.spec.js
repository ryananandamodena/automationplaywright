// specs/06-direct-sales.spec.js - GCCS Direct Sales Tests
import { test, expect } from '@playwright/test';
import { loginGCCS } from '../helpers/login.js';

test.describe('TC-DS: Direct Sales', () => {

  test.beforeEach(async ({ page }) => {
    await loginGCCS(page);
  });

  // TC-DS-001: Halaman Direct Sales Membership dapat diakses
  test('TC-DS-001: Halaman Direct Sales Membership dapat diakses', async ({ page }) => {
    await page.goto('/direct-sales/membership');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/direct-sales\/membership/);
    await expect(page.locator('body')).toContainText('Membership');
  });

  // TC-DS-002: Halaman Direct Sales Validation dapat diakses
  test('TC-DS-002: Halaman Direct Sales Validation dapat diakses', async ({ page }) => {
    await page.goto('/direct-sales/validation');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/direct-sales\/validation/);
  });

  // TC-DS-003: Halaman Direct Sales Revision dapat diakses
  test('TC-DS-003: Halaman Direct Sales Revision dapat diakses', async ({ page }) => {
    await page.goto('/direct-sales/revision');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.url()).toMatch(/direct-sales\/revision/);
  });

  // TC-DS-004: Menu Direct Sales menampilkan submenu yang benar
  test('TC-DS-004: Menu Direct Sales menampilkan semua submenu', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Expand Direct Sales menu
    await page.evaluate(() => {
      const menus = Array.from(document.querySelectorAll('div.menu'));
      const dsMenu = menus.find(m => m.textContent.trim().startsWith('Direct Sales'));
      if (dsMenu) dsMenu.click();
    });
    await page.waitForTimeout(600);

    // Verifikasi submenu tampil
    await expect(page.locator('nav, aside')).toContainText('Membership');
    await expect(page.locator('nav, aside')).toContainText('Validation');
    await expect(page.locator('nav, aside')).toContainText('Revision');
  });

});
