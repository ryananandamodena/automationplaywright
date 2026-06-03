/**
 * BasePage.js - Page Object Model base class
 * Semua page objects inherit dari class ini
 */

export class BasePage {
  constructor(page) {
    this.page = page;
    this.apiFailures = [];
    this.consoleErrors = [];
    this._networkMonitoring = false;
  }

  /**
   * Monitor network requests untuk menangkap API failures (4xx, 5xx)
   */
  startNetworkMonitor() {
    if (this._networkMonitoring) return;
    this._networkMonitoring = true;

    this.page.on('response', response => {
      const status = response.status();
      const url = response.url();
      // Abaikan favicon, static assets, WebSocket
      if (status >= 400 && !url.includes('favicon') && !url.endsWith('.png')
        && !url.endsWith('.ico') && !url.endsWith('.woff')) {
        this.apiFailures.push({
          url,
          status,
          method: response.request().method(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push({ text: msg.text(), timestamp: new Date().toISOString() });
      }
    });

    this.page.on('pageerror', err => {
      this.consoleErrors.push({ text: `PageError: ${err.message}`, timestamp: new Date().toISOString() });
    });
  }

  /**
   * Navigate ke URL dengan wait
   */
  async navigate(url, waitUntil = 'domcontentloaded') {
    await this.page.goto(url, { waitUntil });
    await this.page.waitForTimeout(2500);
  }

  /**
   * Tunggu konten utama muncul
   */
  async waitForContent(timeout = 10000) {
    await this.page.waitForSelector('main, [class*="content"], [class*="wrapper"]', { timeout }).catch(() => {});
  }

  /**
   * Ambil teks heading pertama (h1/h2)
   */
  async getHeadingText() {
    const el = this.page.locator('h1, h2').first();
    return (await el.textContent({ timeout: 5000 }).catch(() => '')).trim();
  }

  /**
   * Cek apakah tabel ada dan visible
   */
  async isTableVisible(timeout = 10000) {
    return await this.page.locator('table').first().isVisible({ timeout }).catch(() => false);
  }

  /**
   * Hitung jumlah baris tabel
   */
  async getTableRowCount() {
    return await this.page.locator('table tbody tr').count().catch(() => 0);
  }

  /**
   * Ambil teks semua baris pertama kolom pertama
   */
  async getTableFirstColumnValues() {
    const cells = this.page.locator('table tbody tr td:first-child');
    const count = await cells.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      values.push((await cells.nth(i).textContent().catch(() => '')).trim());
    }
    return values;
  }

  /**
   * Screenshot otomatis (disimpan di test-results/screenshots/)
   */
  async takeScreenshot(name) {
    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '-');
    try {
      await this.page.screenshot({
        path: `../../test-results/screenshots/${safeName}-${Date.now()}.png`,
        fullPage: true,
      });
    } catch (_) { /* ignore screenshot errors */ }
  }

  /**
   * Cek apakah ini halaman error (404/500/403)
   */
  async isErrorPage() {
    const title = await this.page.title().catch(() => '');
    return /^(404|500|403|error|not found)/i.test(title);
  }

  /**
   * Get current URL
   */
  getCurrentUrl() {
    return this.page.url();
  }

  /**
   * Filter API failures yang critical (500+ atau 4xx non-auth)
   */
  getCriticalApiFailures() {
    return this.apiFailures.filter(f =>
      f.status >= 500 || (f.status >= 400 && f.status !== 401 && f.status !== 403)
    );
  }

  /**
   * Scroll ke bawah secara perlahan (load lazy content)
   */
  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wait for loading spinner hilang
   */
  async waitForLoadingDone(timeout = 15000) {
    const spinner = this.page.locator('[class*="loading"], [class*="spinner"], [class*="skeleton"]').first();
    const isVisible = await spinner.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      await spinner.waitFor({ state: 'hidden', timeout }).catch(() => {});
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Klik tombol berdasarkan teks
   */
  async clickButton(text) {
    const btn = this.page.locator(`button:has-text("${text}")`).first();
    await btn.click({ timeout: 8000 });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Cek pagination visible
   */
  async isPaginationVisible() {
    return await this.page.locator('[class*="pagination"], [class*="Pagination"], nav[aria-label*="page" i]')
      .first().isVisible({ timeout: 3000 }).catch(() => false);
  }

  /**
   * Fill input by label atau placeholder
   */
  async fillInput(selector, value) {
    const input = this.page.locator(selector).first();
    await input.clear();
    await input.fill(value);
  }
}
