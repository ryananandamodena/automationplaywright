import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface GradeCategoryInput {
  grade: string;
  minScore: string;
  maxScore: string;
  description: string;
}

export class GradeCategoriesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto('/setup/master-grading/grade-categories');
    await this.page.waitForLoadState('networkidle');
  }

  async openAddModal() {
    await this.page.getByRole('button', { name: 'Add New' }).click();
    await expect(this.page.locator('#grade')).toBeVisible();
  }

  async fillForm(data: Partial<GradeCategoryInput>) {
    if (data.grade !== undefined) await this.page.locator('#grade').fill(data.grade);
    if (data.minScore !== undefined) await this.page.locator('input[name="min_score"]').fill(data.minScore);
    if (data.maxScore !== undefined) await this.page.locator('input[name="max_score"]').fill(data.maxScore);
    if (data.description !== undefined) await this.page.locator('#description').fill(data.description);
  }

  async submitCreate() {
    await this.page.getByRole('button', { name: 'CREATE CATEGORY' }).click();
    await this.confirmIfPrompted();
  }

  async submitUpdate() {
    await this.page.getByRole('button', { name: /update|save/i }).click();
    await this.confirmIfPrompted();
  }

  async cancel() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }

  async createCategory(data: GradeCategoryInput) {
    await this.openAddModal();
    await this.fillForm(data);
    await this.submitCreate();
  }

  async fieldErrorFor(label: string) {
    return this.page.getByText(label, { exact: false });
  }

  async search(term: string) {
    await this.searchTable('Search grade or description...', term);
  }
}
