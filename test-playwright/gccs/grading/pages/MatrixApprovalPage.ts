import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface MatrixApprovalInput {
  nama: string;
  jabatan: string;
  email: string;
  isActive?: boolean;
}

export class MatrixApprovalPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/setup/master-grading/matrix-approval');
    await this.page.waitForLoadState('networkidle');
  }

  async openAddModal() {
    await this.page.getByRole('button', { name: 'Add New' }).click();
    await expect(this.page.locator('#nama')).toBeVisible();
  }

  async fillForm(data: Partial<MatrixApprovalInput>) {
    if (data.nama !== undefined) await this.page.locator('#nama').fill(data.nama);
    if (data.jabatan !== undefined) await this.page.locator('#jabatan').fill(data.jabatan);
    if (data.email !== undefined) await this.page.locator('#email').fill(data.email);
    
    // Assuming the dropdown uses a role combobox or standard select. The browser subagent mentioned it's a dropdown menu defaulting to "Yes"
    if (data.isActive !== undefined) {
      // In PrimeReact, a dropdown often has role="combobox" or similar, or we can click the label.
      // Assuming clicking the dropdown and then clicking the option works.
      await this.page.locator('#isActive').click();
      const optionText = data.isActive ? 'Yes' : 'No';
      await this.page.getByRole('option', { name: optionText, exact: true }).click();
    }
  }

  async submitCreate() {
    await this.page.getByRole('button', { name: 'CREATE' }).click();
    await this.confirmIfPrompted();
  }

  async submitUpdate() {
    await this.page.getByRole('button', { name: /update|save/i }).click();
    await this.confirmIfPrompted();
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async createMatrixApproval(data: MatrixApprovalInput) {
    await this.openAddModal();
    await this.fillForm(data);
    await this.submitCreate();
  }

  async search(term: string) {
    await this.searchTable('Search nama, jabatan, email...', term);
  }
}
