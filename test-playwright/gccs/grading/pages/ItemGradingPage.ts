import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ItemGradingPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/setup/master-grading/item-grading');
    await this.page.waitForLoadState('networkidle');
  }

  async openAddPage() {
    await this.page.getByRole('button', { name: 'Add New' }).click();
    await expect(this.page.getByText('Add New Item Grading QnA')).toBeVisible();
  }

  async selectProductItem(searchTerm: string) {
    const select = this.page.locator('[id^="react-select"][id$="-input"]').first();
    await select.click();
    await select.fill(searchTerm);
    // Scope to the options listbox: an unscoped getByText also matches the
    // hidden "#aria-context" live-region status text and gets stuck on it.
    const listbox = this.page.locator('[id$="-listbox"]');
    await listbox.getByText(searchTerm, { exact: false }).first().click();
  }

  async fillRemarks(text: string) {
    await this.page.getByPlaceholder('Add notes or description for this grading...').fill(text);
  }

  async addQuestionSlot() {
    await this.page.getByText('Add Question Slot').click();
  }

  /** Bulk-fills every question slot from the questions marked default in Questions Setup. */
  async loadDefaultQuestions() {
    await this.page.getByRole('button', { name: 'Load Default Questions' }).click();
  }

  async selectQuestionForSlot(slotIndex: number, questionText: string) {
    const dropdowns = this.page.locator('.p-dropdown');
    await dropdowns.nth(slotIndex).click();
    await this.page.getByRole('option', { name: questionText }).click();
  }

  /**
   * Selects whichever question is first in the dropdown for a slot, without needing to
   * know its text up front. More reliable than loadDefaultQuestions() for tests that just
   * need *some* question selected: which questions are marked "default" is live,
   * shared Questions Setup data, and was observed to be empty at times - when that
   * happens, "Load Default Questions" can clear the slot instead of filling it.
   */
  async selectFirstAvailableQuestionForSlot(slotIndex: number) {
    const dropdowns = this.page.locator('.p-dropdown');
    await dropdowns.nth(slotIndex).click();
    await this.page.locator('.p-dropdown-item').first().click();
  }

  async removeSlot(slotIndex: number) {
    await this.page.locator('[title="Remove"]').nth(slotIndex).click();
  }

  async toggleStatus() {
    await this.page.locator('.p-inputswitch').first().click();
  }

  async save() {
    await this.page.getByRole('button', { name: 'Save Grading' }).click();
    await this.confirmIfPrompted();
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async totalPointsText() {
    return this.page.getByText(/Total:.*Pts/).innerText();
  }

  async search(term: string) {
    await this.searchTable('Search product or remarks...', term);
  }
}
