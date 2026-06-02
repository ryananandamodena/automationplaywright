/**
 * SalesOrderPage.js - Page Object Model untuk Sales Order
 */
import { BasePage } from './BasePage.js';

const BASE = 'https://mhc-dev.modena.com';

export class SalesOrderPage extends BasePage {
  constructor(page) {
    super(page);
    // List page
    this.createBtn = page.locator('button:has-text("Create New"), button:has-text("Create SO")');
    this.searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="Cari" i], input[type="search"]');
    this.table = page.locator('table');
    this.tableBody = page.locator('table tbody');
    this.tableRows = page.locator('table tbody tr');
    this.tableHeaders = page.locator('table thead th');
    this.filterBtn = page.locator('button:has-text("Filter"), button[aria-label*="filter" i]');
    this.exportBtn = page.locator('button:has-text("Export"), button:has-text("Download")');
  }

  async goto() {
    await this.navigate(`${BASE}/sales-order`);
    await this.waitForLoadingDone();
  }

  async clickCreateNew() {
    await this.createBtn.first().click({ timeout: 8000 });
    await this.page.waitForTimeout(2500);
  }

  async search(keyword) {
    const input = this.searchInput.first();
    await input.clear();
    await input.fill(keyword);
    await this.page.waitForTimeout(2500); // tunggu debounce
  }

  async clearSearch() {
    await this.searchInput.first().clear();
    await this.page.waitForTimeout(2000);
  }

  async clickFirstRow() {
    await this.tableRows.first().click({ timeout: 8000 });
    await this.page.waitForTimeout(2000);
  }

  async getRowCount() {
    return await this.tableRows.count();
  }

  async getHeaderTexts() {
    const count = await this.tableHeaders.count();
    const texts = [];
    for (let i = 0; i < count; i++) {
      texts.push((await this.tableHeaders.nth(i).textContent().catch(() => '')).trim());
    }
    return texts;
  }

  async clickHeader(headerText) {
    const header = this.tableHeaders.filter({ hasText: headerText }).first();
    if (await header.isVisible({ timeout: 3000 }).catch(() => false)) {
      await header.click();
      await this.page.waitForTimeout(1500);
      return true;
    }
    return false;
  }

  /** Ambil semua nomor SO dari kolom pertama tabel */
  async getSoNumbers() {
    const cells = this.page.locator('table tbody tr td:first-child');
    const count = await cells.count();
    const numbers = [];
    for (let i = 0; i < Math.min(count, 10); i++) {
      numbers.push((await cells.nth(i).textContent().catch(() => '')).trim());
    }
    return numbers;
  }

  /** Cek apakah hasil pencarian sesuai keyword */
  async searchResultsContain(keyword) {
    const bodyText = await this.page.locator('table tbody').textContent().catch(() => '');
    return bodyText.toLowerCase().includes(keyword.toLowerCase());
  }

  /** Cek empty state (tidak ada data) */
  async isEmptyStateVisible() {
    const bodyText = await this.page.locator('body').innerText().catch(() => '');
    return /no data|tidak ada data|no result|data not found/i.test(bodyText) ||
      await this.page.locator('[class*="empty"], [class*="no-data"]').isVisible({ timeout: 3000 }).catch(() => false);
  }

  /** Klik header kolom untuk sort */
  async sortByColumn(index) {
    const header = this.tableHeaders.nth(index);
    const isSortable = await header.locator('button, svg, [class*="sort"]').count() > 0;
    if (isSortable || await header.isVisible()) {
      await header.click();
      await this.page.waitForTimeout(1500);
    }
  }

  /** Get pagination info */
  async getPaginationText() {
    const pg = this.page.locator('[class*="pagination"], [class*="Pagination"]').first();
    return await pg.textContent({ timeout: 3000 }).catch(() => '');
  }
}
