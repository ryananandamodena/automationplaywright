import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://merchandise-dev.modena.com';
const MS_USER = {
  email: 'ryan.ananda@modena.com',
  password: '011215Aisy@h',
};

async function main() {
  console.log('🚀 Membuka browser untuk Microsoft SSO Login...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/login`);
    console.log('👉 Klik tombol "Sign in with Microsoft"...');
    await page.getByRole('button', { name: /Sign in with Microsoft/i }).click();

    // 1. Email
    console.log(`👉 Mengisi email: ${MS_USER.email}`);
    const emailInput = page.locator('input[type="email"], input[name="loginfmt"]');
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill(MS_USER.email);
    await page.locator('input[type="submit"], #idSIButton9, button:has-text("Next")').click();

    // 2. Password
    console.log('👉 Mengisi password...');
    const passwordInput = page.locator('input[type="password"], input[name="passwd"]');
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 });
    await passwordInput.fill(MS_USER.password);
    await page.locator('input[type="submit"], #idSIButton9, button:has-text("Sign in")').click();

    console.log('📱 Jika muncul prompt Microsoft Authenticator di HP, silakan pilih angka yang sesuai.');

    // 3. Stay signed in
    try {
      const staySignedInBtn = page.locator('#idSIButton9, input[value="Yes"], input[value="No"], button:has-text("Yes")');
      if (await staySignedInBtn.isVisible({ timeout: 60000 })) {
        await staySignedInBtn.click();
      }
    } catch (e) {}

    // 4. Wait for redirect back
    await page.waitForURL(new RegExp(BASE_URL), { timeout: 60000 });
    console.log('✅ Berhasil login ke MODENA Merchandise!');

    // Simpan storage state
    const storagePath = path.join(__dirname, 'storageState.json');
    await context.storageState({ path: storagePath });
    console.log(`💾 Session berhasil disimpan ke: ${storagePath}`);
  } catch (err) {
    console.error('❌ Error saat login:', err.message);
  } finally {
    await browser.close();
  }
}

main();
