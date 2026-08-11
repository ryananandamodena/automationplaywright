import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface WarehouseGradingInput {
  erpCodeSearch: string;
  // Category is intentionally optional: turning "Is Grading Location?" on disables and
  // clears the Category field (a grading location isn't classified by category).
  category?: 'A' | 'B' | 'K';
  isGradingLocation?: boolean;
}

/**
 * Edit Service Center page (Setup > Organization > Service Center > Edit).
 * Scoped here to the "Warehouse Grading" sub-section only.
 */
export class ServiceCenterPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(serviceCenterId: number | string) {
    await this.page.goto(`/setup/organization/service-center/edit/${serviceCenterId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /** The "Warehouse Grading" table - distinct from the "Warehouse" table above it, which shares column names. */
  private warehouseGradingTable() {
    return this.page.locator('table.p-datatable-table').nth(1);
  }

  warehouseGradingRowByErpCode(erpCode: string) {
    return this.warehouseGradingTable().locator('tbody tr', { hasText: erpCode });
  }

  async openAddWarehouseGradingModal() {
    const heading = this.page.getByText('Warehouse Grading', { exact: true });
    const section = heading.locator('xpath=ancestor::div[contains(@class,"flex")][1]');
    await section.getByRole('button', { name: 'Add' }).click();
    await expect(this.page.getByRole('heading', { name: 'Add Warehouse Grading' })).toBeVisible();
  }

  async openEditWarehouseGradingModal(erpCode: string) {
    const row = this.warehouseGradingRowByErpCode(erpCode);
    // The edit (pencil) icon has no accessible name - it's the action cell's 2nd svg,
    // the 1st (red) being delete.
    await row.locator('td').first().locator('svg').nth(1).click();
    await expect(this.page.getByRole('heading', { name: 'Add Warehouse Grading' })).toBeVisible();
  }

  async selectErpCode(searchTerm: string) {
    const modal = this.page.getByRole('dialog');
    await modal.locator('.p-dropdown', { hasText: 'ERP Code' }).or(modal.locator('.p-dropdown').first()).click();
    // The dropdown is scoped to the modal but options render in a portal - scope to the panel.
    const panel = this.page.locator('.p-dropdown-panel');
    await panel.getByText(searchTerm, { exact: false }).first().click();
  }

  async selectCategory(category: 'A' | 'B' | 'K') {
    const modal = this.page.getByRole('dialog');
    const dropdowns = modal.locator('.p-dropdown');
    await dropdowns.nth(1).click();
    const panel = this.page.locator('.p-dropdown-panel');
    await panel.getByText(category, { exact: true }).click();
  }

  async toggleIsGradingLocation() {
    await this.page.getByRole('dialog').locator('.react-toggle').click();
  }

  async fillWarehouseGradingForm(data: WarehouseGradingInput) {
    // Business rule: toggling "Is Grading Location?" on disables (and clears) the
    // Category field - a grading location isn't classified by category. Toggle first
    // so Category's enabled/disabled state is settled before we try to use it.
    if (data.isGradingLocation) await this.toggleIsGradingLocation();
    await this.selectErpCode(data.erpCodeSearch);
    if (data.category) await this.selectCategory(data.category);
  }

  categoryDropdown() {
    return this.page.getByRole('dialog').locator('.p-dropdown').nth(1);
  }

  async saveWarehouseGrading() {
    await this.page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  }

  async closeWarehouseGradingModal() {
    await this.page.locator('.custom-modal-close-icon').click();
  }

  async deleteWarehouseGradingRow(erpCode: string) {
    const row = this.warehouseGradingRowByErpCode(erpCode);
    await row.locator('svg[color="red"]').click();
    await this.page.getByRole('button', { name: 'Yes, Delete' }).click();
  }
}
