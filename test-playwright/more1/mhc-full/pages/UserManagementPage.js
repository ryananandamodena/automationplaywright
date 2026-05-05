/**
 * UserManagementPage.js - Page Object Model untuk User Management
 */
import { BasePage } from './BasePage.js';

const BASE = 'https://mhc-dev.modena.com';

export class UserManagementPage extends BasePage {
  constructor(page) {
    super(page);
    this.createBtn = page.locator('button:has-text("Create"), button:has-text("Add User"), button:has-text("Tambah")');
    this.searchInput = page.locator('input[placeholder*="Search" i], input[placeholder*="Cari" i]');
    this.tableRows = page.locator('table tbody tr');
    this.tableHeaders = page.locator('table thead th');
    // Form fields
    this.nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i], input[placeholder*="nama" i]');
    this.emailInput = page.locator('input[type="email"], input[name*="email" i]');
    this.passwordInput = page.locator('input[type="password"]');
    this.roleSelect = page.locator('select[name*="role" i], [class*="select"][class*="role" i]');
    this.submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Submit"), button:has-text("Simpan")');
    this.cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Batal")');
  }

  async goto() {
    await this.navigate(`${BASE}/users`);
    await this.waitForLoadingDone();
  }

  async clickCreate() {
    await this.createBtn.first().click({ timeout: 8000 });
    await this.page.waitForTimeout(2000);
  }

  async search(keyword) {
    await this.searchInput.first().clear();
    await this.searchInput.first().fill(keyword);
    await this.page.waitForTimeout(2000);
  }

  async clearSearch() {
    await this.searchInput.first().clear();
    await this.page.waitForTimeout(1500);
  }

  async getRowCount() {
    return await this.tableRows.count();
  }

  async isCreateFormVisible() {
    const body = await this.page.locator('body').innerText().catch(() => '');
    return /name|email|password|role/i.test(body);
  }

  async fillForm(data = {}) {
    if (data.name) {
      const nameEl = this.nameInput.first();
      if (await nameEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameEl.clear();
        await nameEl.fill(data.name);
      }
    }
    if (data.email) {
      const emailEl = this.emailInput.first();
      if (await emailEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailEl.clear();
        await emailEl.fill(data.email);
      }
    }
    if (data.password) {
      const pwdEl = this.passwordInput.first();
      if (await pwdEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pwdEl.clear();
        await pwdEl.fill(data.password);
      }
    }
  }

  async submitForm() {
    await this.submitBtn.first().click({ timeout: 5000 });
    await this.page.waitForTimeout(2000);
  }

  async cancelForm() {
    const btn = this.cancelBtn.first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await this.page.waitForTimeout(1500);
    }
  }

  async getValidationErrors() {
    const errors = this.page.locator('[class*="error"], [class*="invalid"], .text-red-500, [role="alert"]');
    const count = await errors.count();
    const msgs = [];
    for (let i = 0; i < count; i++) {
      const text = (await errors.nth(i).textContent().catch(() => '')).trim();
      if (text) msgs.push(text);
    }
    return msgs;
  }

  async clickEditFirstRow() {
    const editBtn = this.page.locator('table tbody tr').first()
      .locator('button:has-text("Edit"), button[aria-label*="edit" i], a:has-text("Edit")');
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      await this.page.waitForTimeout(2000);
      return true;
    }
    return false;
  }
}
