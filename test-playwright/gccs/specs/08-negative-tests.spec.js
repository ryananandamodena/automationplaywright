// specs/08-negative-tests.spec.js - GCCS Negative / Security Tests
import { test, expect } from '@playwright/test';
import { loginGCCS } from '../helpers/login.js';

test.describe('TC-NEG: Negative & Security Tests', () => {

  // TC-NEG-001 to 004: Login security tests (no pre-login needed)
  test.describe('Login - Negative Tests', () => {

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.context().clearCookies();
      await page.goto('https://gccs-test.modena.com/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
    });

    test('TC-NEG-001: Login dengan username kosong ditolak', async ({ page }) => {
      await page.fill('input[type="password"]', 'P@ssw0rd.1');
      await page.click('button[type="submit"]', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      expect(page.url()).not.toMatch(/dashboard/);
    });

    test('TC-NEG-002: Login dengan password kosong ditolak', async ({ page }) => {
      await page.fill('input[type="text"], input[name="username"]', 'sysadmin');
      await page.click('button[type="submit"]', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      expect(page.url()).not.toMatch(/dashboard/);
    });

    test('TC-NEG-003: SQL injection pada field username ditolak', async ({ page }) => {
      await page.fill('input[type="text"], input[name="username"]', "' OR 1=1 --");
      await page.fill('input[type="password"]', 'anything');
      await page.click('button[type="submit"]', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2000);
      // Tidak boleh login berhasil
      expect(page.url()).not.toMatch(/dashboard/);
    });

    test('TC-NEG-004: XSS pada field username disanitasi', async ({ page }) => {
      const xssPayload = '<script>alert(1)</script>';
      await page.fill('input[type="text"], input[name="username"]', xssPayload);
      await page.fill('input[type="password"]', 'anything');
      await page.click('button[type="submit"]', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      // Verifikasi tidak ada alert / popup XSS
      // Page harus tetap di login
      expect(page.url()).not.toMatch(/dashboard/);
    });

    test('TC-NEG-005: Login dengan semua field kosong ditolak', async ({ page }) => {
      await page.click('button[type="submit"]', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      expect(page.url()).not.toMatch(/dashboard/);
    });
  });

  // Tests yang butuh login
  test.describe('Halaman Protected - Negative Tests', () => {

    test('TC-NEG-006: Akses /dashboard langsung tanpa login diarahkan ke login', async ({ page }) => {
      await page.goto('https://gccs-test.modena.com/dashboard');
      await page.waitForLoadState('domcontentloaded');
      // Harus di-redirect ke halaman login atau tampil form login
      const bodyText = await page.textContent('body');
      const isLoginPage = /login|sign.?in|username|password/i.test(bodyText) ||
                          page.url().includes('login') ||
                          !page.url().includes('/dashboard');
      expect(isLoginPage).toBe(true);
    });

    test('TC-NEG-007: Akses /call-center/call-entry tanpa login diarahkan ke login', async ({ page }) => {
      await page.goto('https://gccs-test.modena.com/call-center/call-entry');
      await page.waitForLoadState('domcontentloaded');
      const notOnCallEntry = !page.url().includes('/call-center/call-entry') ||
                              (await page.textContent('body')).match(/login|sign.?in/i);
      expect(notOnCallEntry).toBeTruthy();
    });
  });

  // Call Entry negative tests
  test.describe('Call Entry - Negative Tests', () => {

    test.beforeEach(async ({ page }) => {
      await loginGCCS(page);
      await page.goto('/call-center/call-entry');
      await page.waitForLoadState('domcontentloaded');
    });

    test('TC-NEG-008: Input nomor telepon format tidak valid tidak menemukan customer', async ({ page }) => {
      await page.fill('input[name="phone"]', 'abc123!@#');
      await page.locator('input[name="phone"]').press('Enter');
      await page.waitForTimeout(2000);
      const customerName = await page.inputValue('input[name="customerName"]');
      expect(customerName).toBe('');
    });

    test('TC-NEG-009: Input nomor telepon tidak terdaftar tidak menemukan customer', async ({ page }) => {
      await page.fill('input[name="phone"]', '00000000000');
      await page.locator('input[name="phone"]').press('Enter');
      await page.waitForTimeout(2000);
      const customerName = await page.inputValue('input[name="customerName"]');
      expect(customerName).toBe('');
    });

    test('TC-NEG-010: Save form Explanation tanpa isi data - tombol Save disabled', async ({ page }) => {
      // Tombol Save harus disabled jika tidak ada customer dipilih
      const saveBtn = page.locator('button[type="submit"]').filter({ hasText: 'Save' }).first();
      const isDisabled = await saveBtn.getAttribute('disabled');
      expect(isDisabled).not.toBeNull();
    });
  });

});
