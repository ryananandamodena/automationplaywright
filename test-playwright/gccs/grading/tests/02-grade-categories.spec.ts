import { test, expect } from '../fixtures/authFixture';
import { GradeCategoriesPage } from '../pages/GradeCategoriesPage';
import { GRADE_CATEGORY_CASES } from '../utils/testData';

test.describe('Grade Categories CRUD', () => {
  test('TC-GC-001 create category with valid data succeeds', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    const data = GRADE_CATEGORY_CASES.valid();
    await gc.createCategory(data);
    await gc.expectToastSuccess();
    await gc.search(data.grade);
    await expect(gc.rowByText(data.grade)).toBeVisible();
  });

  test('TC-GC-002 create with empty required fields shows inline validation', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    await gc.openAddModal();
    await gc.fillForm(GRADE_CATEGORY_CASES.empty);
    await gc.submitCreate();
    await expect(loggedInPage.getByText(/category name is required/i)).toBeVisible();
  });

  test('TC-GC-003 whitespace-only name is treated as empty (trimmed)', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    await gc.openAddModal();
    await gc.fillForm(GRADE_CATEGORY_CASES.whitespaceOnly);
    await gc.submitCreate();
    await expect(loggedInPage.getByText(/category name is required/i)).toBeVisible();
  });

  test('TC-GC-004 duplicate grade name is rejected server-side', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    await gc.openAddModal();
    await gc.fillForm(GRADE_CATEGORY_CASES.duplicate); // grade "A" already exists
    await gc.submitCreate(); // clicks CREATE CATEGORY -> confirms "Yes, Confirm" -> server rejects
    await expect(loggedInPage.getByText(/category name.*already exists/i)).toBeVisible();
  });

  test('TC-GC-005 min score greater than max score is rejected client-side', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    await gc.openAddModal();
    await gc.fillForm(GRADE_CATEGORY_CASES.minGreaterThanMax);
    await loggedInPage.getByRole('button', { name: 'CREATE CATEGORY' }).click();
    // Blocked before the confirm dialog even appears
    await expect(loggedInPage.getByText(/max score must be.*min score/i)).toBeVisible();
  });

  test('TC-GC-006 HTML/script injection in fields is escaped, not executed', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    let alertFired = false;
    loggedInPage.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });
    await gc.goto();
    const data = { ...GRADE_CATEGORY_CASES.scriptInjection, grade: `XSS-${Date.now() % 100000}` };
    await gc.createCategory(data);
    await loggedInPage.waitForTimeout(1000);
    expect(alertFired, 'XSS payload must not execute').toBeFalsy();
  });

  test('TC-GC-007 very long input is rejected or truncated safely', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    await gc.openAddModal();
    await gc.fillForm(GRADE_CATEGORY_CASES.veryLong);
    await gc.submitCreate();
    // Page should not crash / show unhandled error
    await expect(loggedInPage.locator('body')).not.toContainText('Internal Server Error');
  });

  test('TC-GC-008 search filters the table', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    // Seed a known record first so this test doesn't depend on fixed environment seed data.
    const data = GRADE_CATEGORY_CASES.valid();
    await gc.createCategory(data);
    await gc.expectToastSuccess();
    await gc.search(data.grade);
    await expect(gc.rowByText(data.grade)).toBeVisible();
    await expect(loggedInPage.locator('table tbody tr')).toHaveCount(1);
  });

  test('TC-GC-009 search with no match shows empty state', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    await gc.search('ZZZ-NO-MATCH-ZZZ');
    await expect(loggedInPage.getByText(/no data|no results|showed 0/i)).toBeVisible();
  });

  test('TC-GC-010 cancel on create does not persist data', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    const before = await gc.totalRowsText();
    await gc.openAddModal();
    await gc.fillForm(GRADE_CATEGORY_CASES.valid());
    await gc.cancel();
    const after = await gc.totalRowsText();
    expect(after).toBe(before);
  });

  test('TC-GC-011 edit an existing category and persist changes', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    const data = GRADE_CATEGORY_CASES.valid();
    await gc.createCategory(data);
    await gc.expectToastSuccess();
    await gc.search(data.grade);
    await gc.editRow(data.grade);
    const newDescription = `${data.description} - edited`;
    await gc.fillForm({ description: newDescription });
    await gc.submitUpdate();
    await gc.expectToastSuccess();
    await gc.search(data.grade);
    await expect(gc.rowByText(newDescription)).toBeVisible();
  });

  test('TC-GC-012 delete a category shows confirmation and removes row', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    const data = GRADE_CATEGORY_CASES.valid();
    await gc.createCategory(data);
    await gc.expectToastSuccess();
    await gc.search(data.grade);
    await gc.deleteRow(data.grade);
    await gc.confirmDialog();
    await gc.expectToastSuccess();
    await gc.search(data.grade);
    await expect(gc.rowByText(data.grade)).toHaveCount(0);
  });

  test('TC-GC-013 cancel delete keeps the row', async ({ loggedInPage }) => {
    const gc = new GradeCategoriesPage(loggedInPage);
    await gc.goto();
    const data = GRADE_CATEGORY_CASES.valid();
    await gc.createCategory(data);
    await gc.expectToastSuccess();
    await gc.search(data.grade);
    await gc.deleteRow(data.grade);
    await gc.cancelDialog();
    await gc.search(data.grade);
    await expect(gc.rowByText(data.grade)).toBeVisible();
  });
});
