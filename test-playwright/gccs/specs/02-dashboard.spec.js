// specs/02-dashboard.spec.js - GCCS Dashboard Tests
import { test, expect } from '@playwright/test';
import { loginGCCS } from '../helpers/login.js';

test.describe('TC-DASH: Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await loginGCCS(page);
  });

  // TC-DASH-001: Tampilkan dashboard setelah login
  test('TC-DASH-001: Dashboard tampil setelah login berhasil', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    // Verifikasi sidebar tampil
    const sidebar = page.locator('nav.sidebar, aside');
    await expect(sidebar).toBeVisible();
    // Verifikasi brand name
    await expect(page.locator('body')).toContainText('Global Customer Care System');
  });

  // TC-DASH-002: Semua menu utama tersedia di sidebar
  test('TC-DASH-002: Semua menu utama tersedia di sidebar', async ({ page }) => {
    const menus = ['Call Center', 'Repair Center', 'Inventory', 'Direct Sales', 'Customer Survey', 'Setup', 'Report'];
    for (const menu of menus) {
      const el = page.locator(`nav.sidebar, aside`).getByText(menu);
      await expect(el.first()).toBeVisible({ timeout: 5000 });
    }
  });

  // TC-DASH-003: Klik Call Center membuka submenu
  test('TC-DASH-003: Klik Call Center membuka submenu', async ({ page }) => {
    const callCenterMenu = page.locator('div.menu').filter({ hasText: 'Call Center' });
    await callCenterMenu.click();
    await page.waitForTimeout(600);
    await expect(page.locator('a[href="/call-center/call-entry"]')).toBeVisible();
  });

  // TC-DASH-004: Header menampilkan info user yang benar
  test('TC-DASH-004: Header menampilkan info user yang login', async ({ page }) => {
    const header = page.locator('.top-navbar');
    await expect(header).toContainText('Administrasi');
    await expect(header).toContainText('System Admin');
  });

});
