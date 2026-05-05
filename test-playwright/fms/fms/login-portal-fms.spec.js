import { test, expect } from '@playwright/test';

test.describe('Login Portal & Navigate to FMS Dev', () => {

  test('login portal-dev dan klik aplikasi FMS Dev', async ({ browser }) => {
    // Buat context baru tanpa storageState agar login fresh
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    // 1. Navigasi ke portal login
    console.log('📍 Navigasi ke portal-dev.modena.com...');
    await page.goto('https://portal-dev.modena.com/login', { timeout: 60000, waitUntil: 'load' });
    
    // Tunggu halaman benar-benar siap
    console.log('⏳ Menunggu halaman fully loaded...');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(3000);

    // Cek apakah sudah login atau masih di halaman login
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Jika masih di halaman login, lakukan login
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    const isLoginPage = await emailField.isVisible().catch(() => false);

    if (isLoginPage) {
      console.log('🔐 Masih di halaman login, melakukan login...');
      
      // Screenshot halaman login
      await page.screenshot({ path: 'test-results/01-login-page.png', fullPage: true });

      // Isi email
      console.log('📝 Mengisi email...');
      await emailField.fill('ryan.ananda@modena.com');

      // Isi password
      console.log('📝 Mengisi password...');
      const passwordField = page.locator('input[type="password"]').first();
      await passwordField.fill('P@ssw0rd_ryan.ananda');

      // Screenshot setelah isi form
      await page.screenshot({ path: 'test-results/02-filled-form.png', fullPage: true });

      // Klik Sign In
      console.log('🔐 Klik Sign In...');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Tunggu login selesai
      console.log('⏳ Menunggu login selesai...');
      await page.waitForLoadState('networkidle', { timeout: 60000 });
      await page.waitForTimeout(3000);

      console.log('✅ Login berhasil! URL:', page.url());
    } else {
      console.log('✅ Sudah login, langsung di halaman My Applications');
    }

    // Screenshot setelah login
    await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });

    // Verifikasi heading My Applications terlihat
    await expect(page.getByRole('heading', { name: 'My Applications' })).toBeVisible({ timeout: 15000 });
    console.log('✅ Halaman My Applications terlihat');

    // Klik aplikasi FMS (DEV)
    console.log('🔄 Mencari dan klik aplikasi FMS (DEV)...');
    const fmsApp = page.getByText('FMS (DEV)');
    await fmsApp.waitFor({ state: 'visible', timeout: 15000 });
    await fmsApp.click();

    // Screenshot setelah klik FMS
    await page.screenshot({ path: 'test-results/04-after-click-fms.png', fullPage: true });

    // Klik Confirm jika ada dialog konfirmasi
    console.log('⏳ Menunggu dialog konfirmasi...');
    try {
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
      await confirmBtn.click();
      console.log('✅ Klik Confirm berhasil');
    } catch (e) {
      console.log('ℹ️ Tidak ada dialog Confirm, lanjut...');
    }

    // Tunggu navigasi ke FMS
    console.log('⏳ Menunggu navigasi ke FMS...');
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(3000);

    // Verifikasi sudah masuk FMS
    const fmsUrl = page.url();
    console.log('✅ Navigasi berhasil! URL:', fmsUrl);
    
    // Screenshot final
    await page.screenshot({ path: 'test-results/05-fms-dashboard.png', fullPage: true });
    console.log('📸 Screenshot FMS dashboard');

    expect(fmsUrl.toLowerCase()).toContain('fms');

    await context.close();
  });

});
