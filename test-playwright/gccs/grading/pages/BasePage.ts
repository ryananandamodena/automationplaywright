import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async searchTable(placeholder: string, term: string) {
    const search = this.page.getByPlaceholder(placeholder);
    await search.fill(term);
    await this.page.waitForTimeout(1000); // debounce - generous margin under sustained headed runs
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async clearSearch(placeholder: string) {
    await this.page.getByPlaceholder(placeholder).fill('');
    await this.page.waitForTimeout(600);
  }

  rowByText(text: string) {
    return this.page.locator('table tbody tr', { hasText: text });
  }

  async editRow(text: string) {
    await this.rowByText(text).locator('[title="Edit"]').click();
  }

  async deleteRow(text: string) {
    await this.rowByText(text).locator('[title="Delete"]').click();
  }

  async confirmDialog() {
    const confirmBtn = this.page.getByRole('button', { name: /yes|confirm|delete/i }).last();
    await confirmBtn.click();
  }

  /** GCCS shows a "Are you sure...?" / "Yes, Confirm" dialog after most create/update submits. */
  async confirmIfPrompted() {
    const yesConfirm = this.page.getByRole('button', { name: 'Yes, Confirm' });
    if (await yesConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await yesConfirm.click();
    }
  }

  async cancelDialog() {
    await this.page.getByRole('button', { name: /cancel|no|back/i }).last().click();
  }

  async expectToastSuccess() {
    await expect(this.page.locator('.p-toast-message-success, .p-toast-message')).toBeVisible({ timeout: 8000 });
  }

  async totalRowsText() {
    return this.page.locator('.p-paginator-left-content').innerText();
  }

  /**
   * Search-then-assert-visible, retried a couple of times with a fresh search.
   * The table search on this app is occasionally slow to index a just-created row
   * under sustained sequential runs - retrying the search (not just re-polling the
   * DOM) recovers from that without masking a genuinely missing row.
   */
  async expectRowVisibleAfterSearch(placeholder: string, term: string, attempts = 3) {
    for (let i = 1; i <= attempts; i++) {
      await this.searchTable(placeholder, term);
      const visible = await this.rowByText(term).first().isVisible().catch(() => false);
      if (visible) return;
      if (i === attempts) {
        await expect(this.rowByText(term).first()).toBeVisible();
      }
    }
  }
}
