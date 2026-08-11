import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface QuestionInput {
  question: string;
  pointYes: string;
  pointNo: string;
  checklistOnly?: boolean;
  isDefault?: boolean;
}

export class QuestionsSetupPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/setup/master-grading/questions-setup');
    await this.page.waitForLoadState('networkidle');
  }

  async openAddModal() {
    await this.page.getByRole('button', { name: 'Add New' }).click();
    await expect(this.page.locator('#question')).toBeVisible();
  }

  async fillForm(data: Partial<QuestionInput>) {
    if (data.question !== undefined) await this.page.locator('#question').fill(data.question);
    if (data.pointYes !== undefined) await this.page.locator('input[name="point_yes"]').fill(data.pointYes);
    if (data.pointNo !== undefined) await this.page.locator('input[name="point_no"]').fill(data.pointNo);
    if (data.checklistOnly) await this.page.locator('#checklist_only').click();
    if (data.isDefault) await this.page.locator('#is_default').click();
  }

  async submitCreate() {
    await this.page.getByRole('button', { name: 'CREATE QUESTION' }).click();
    await this.confirmIfPrompted();
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async createQuestion(data: QuestionInput) {
    await this.openAddModal();
    await this.fillForm(data);
    await this.submitCreate();
  }

  async search(term: string) {
    await this.searchTable('Search question...', term);
  }

  async totalDefaultPointsText() {
    return this.page.getByText(/PTS/).innerText();
  }
}
