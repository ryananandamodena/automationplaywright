/**
 * LoginPage.js - Page Object Model untuk halaman Login
 */
import { BasePage } from './BasePage.js';

const BASE_URL = 'https://mhc-dev.modena.com';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button:has-text("Login")');
    this.errorAlert = page.locator('[class*="error"], [class*="alert"], .text-red-500, [role="alert"]');
  }

  async goto() {
    await this.navigate(BASE_URL);
  }

  /** Login dengan kredensial yang diberikan */
  async login(email, password) {
    if (email !== '') await this.emailInput.fill(email);
    if (password !== '') await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForTimeout(3000);
  }

  /** Login dengan kredensial default sistem */
  async loginAsDefault() {
    await this.goto();
    await this.emailInput.fill('muhzaenal5@gmail.com');
    await this.passwordInput.fill('P@ssw0rd');
    await this.loginButton.click();
    await this.page.waitForTimeout(4000);
    await this.page.waitForSelector('aside, nav, header', { timeout: 10000 }).catch(() => {});
  }

  /** Cek apakah masih di halaman login (belum redirect) */
  async isStillOnLoginPage() {
    return await this.emailInput.isVisible({ timeout: 3000 }).catch(() => false);
  }

  /** Ambil pesan error yang muncul */
  async getErrorMessage() {
    return await this.errorAlert.first().textContent({ timeout: 4000 }).catch(() => '');
  }

  /** Cek apakah tombol login aktif (tidak disabled) */
  async isLoginButtonEnabled() {
    return await this.loginButton.isEnabled({ timeout: 3000 }).catch(() => false);
  }

  /** Cek apakah input email visible (halaman login terbuka) */
  async isLoginFormVisible() {
    return await this.emailInput.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /** Coba login lalu logout untuk reset state */
  async logout() {
    const profileBtn = this.page.locator('[class*="avatar"], [class*="profile"], button[aria-haspopup]').first();
    if (await profileBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileBtn.click();
      await this.page.waitForTimeout(1000);
      const logoutBtn = this.page.locator('text="Logout", text="Sign Out", text="Keluar"').first();
      if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutBtn.click();
        await this.page.waitForTimeout(2000);
      }
    }
  }
}
