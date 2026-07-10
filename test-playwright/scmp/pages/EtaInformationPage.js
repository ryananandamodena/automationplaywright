import { BasePage } from '../pages/BasePage.js';

export class EtaInformationPage extends BasePage {
  constructor(page) {
    super(page);
    this.selectors = {
      heading: 'h1, h2, [class*="title"], text=/eta information/i',
      table: 'table, [class*="table"], [class*="list"]',
      searchInput: 'input[placeholder*="Search"], input[type="search"], input[placeholder*="search data"]',
      filterButton: 'button:has-text("Filter"), [class*="filter"]',
      createButton: 'button:has-text("Create ETA"), button:has-text("Create New"), button:has-text("Add New"), button[aria-label*="Add"], button[class*="add"]',
      cancelButton: 'button:has-text("Cancel"), button:has-text("Batal")',
      saveButton: 'button:has-text("Save"), button:has-text("Submit"), button:has-text("Create")',
      formFields: {
        trackingCode: 'input[name*="tracking"], input[name*="code"], input[placeholder*="Tracking Code"], input[placeholder*="No."], input[placeholder*="Kode"]',
        customerName: 'input[name*="customer"], input[name*="name"], input[placeholder*="Customer"], input[placeholder*="Nama"]',
        etaDate: 'input[type="date"], input[name*="eta"], input[name*="date"], input[placeholder*="ETA"], input[placeholder*="Tanggal"]',
        status: 'input[name*="status"], select[name*="status"], [class*="select"]',
        notes: 'textarea, input[name*="note"], input[name*="description"]',
      },
      confirmModal: '.swal2-popup, [class*="modal"], [role="dialog"], .fixed.inset-0',
      confirmButton: 'button:has-text("Yes"), button:has-text("OK"), button:has-text("Delete"), button:has-text("Hapus"), button:has-text("Confirm"), .swal2-confirm',
      cancelModalButton: 'button:has-text("Cancel"), button:has-text("Tidak"), .swal2-cancel',
      nextButton: 'button:has-text("Next"), button[aria-label="Next"], button[class*="next"], a:has-text("Next")',
      prevButton: 'button:has-text("Previous"), button[aria-label="Previous"], button[class*="prev"], a:has-text("Previous")',
      pageNumbers: '[class*="pagination"], nav[aria-label="Pagination"]',
      exportButton: 'button:has-text("Export"), a:has-text("Export"), button:has-text("Download"), a:has-text("Download")',
      row: 'table tbody tr, [class*="row"], [role="row"]',
      cell: 'td, [role="cell"], [class*="cell"]',
    };
  }

  async navigate() {
    const baseUrl = process.env.BASE_URL || 'https://portal-dev.modena.com';
    await this.goto(`${baseUrl}/scmp/eta-information`);
    await this.page.waitForTimeout(3000);
  }

  async getHeadingText() {
    try {
      const visible = await this.isVisible(this.selectors.heading, 5000);
      if (visible) return await this.getText(this.selectors.heading);
    } catch (e) {}
    return '';
  }

  async isSearchVisible() {
    return await this.isVisible(this.selectors.searchInput, 3000);
  }

  async isFilterVisible() {
    return await this.isVisible(this.selectors.filterButton, 3000);
  }

  async isCreateButtonVisible() {
    return await this.isVisible(this.selectors.createButton, 3000);
  }

  async clickCreateButton() {
    await this.click(this.selectors.createButton);
    await this.page.waitForTimeout(2000);
  }

  async fillFormField(field, value) {
    const selector = this.selectors.formFields[field];
    if (!selector) return false;
    const locator = this.page.locator(selector).first();
    if (await this.isVisible(locator, 3000)) {
      await locator.fill(value == null ? '' : String(value));
      return true;
    }
    return false;
  }

  async clickSave() {
    await this.click(this.selectors.saveButton);
    await this.page.waitForTimeout(2000);
  }

  async clickCancel() {
    const cancelBtn = this.page.locator('button:has-text("Cancel")').or(
      this.page.locator('button:has-text("Batal")')
    ).first();
    if (await this.isVisible(cancelBtn, 3000)) {
      await this.click(cancelBtn);
      await this.page.waitForTimeout(2000);
      return true;
    }
    return false;
  }

  async getTableRowCount() {
    const rowLocator = this.page.locator(this.selectors.row);
    return await rowLocator.count();
  }

  async confirmDeleteModal() {
    await this.page.evaluate(() => {
      const all = document.querySelectorAll('div');
      const modal = Array.from(all).find(d =>
        d.classList.contains('fixed') && d.classList.contains('inset-0') && d.style.display !== 'none'
      );
      const btns = (modal || document).querySelectorAll('button');
      const btn = Array.from(btns).find(b => ['Yes', 'OK', 'Delete', 'Hapus', 'Confirm'].includes(b.textContent.trim()));
      if (btn) btn.click();
    });
    await this.page.waitForTimeout(1500);
  }
}
