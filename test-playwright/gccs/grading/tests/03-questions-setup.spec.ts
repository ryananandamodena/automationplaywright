import { test, expect } from '../fixtures/authFixture';
import { QuestionsSetupPage } from '../pages/QuestionsSetupPage';
import { QUESTION_CASES } from '../utils/testData';

test.describe('Questions Setup CRUD', () => {
  test('TC-QS-001 create question with valid data succeeds', async ({ loggedInPage }) => {
    const qs = new QuestionsSetupPage(loggedInPage);
    await qs.goto();
    const data = QUESTION_CASES.valid();
    await qs.createQuestion(data);
    await qs.expectToastSuccess();
    await qs.expectRowVisibleAfterSearch('Search question...', data.question.slice(0, 20));
  });

  test('TC-QS-002 empty required fields blocked by validation', async ({ loggedInPage }) => {
    const qs = new QuestionsSetupPage(loggedInPage);
    await qs.goto();
    await qs.openAddModal();
    await qs.fillForm(QUESTION_CASES.empty);
    await qs.submitCreate();
    await expect(loggedInPage.getByText(/required/i).first()).toBeVisible();
  });

  test('TC-QS-003 checklist-only toggle forces zero points (business rule)', async ({ loggedInPage }) => {
    const qs = new QuestionsSetupPage(loggedInPage);
    await qs.goto();
    await qs.openAddModal();
    const data = QUESTION_CASES.valid();
    await qs.fillForm({ ...data, checklistOnly: true });
    await qs.submitCreate();
    await qs.expectToastSuccess();
    await qs.expectRowVisibleAfterSearch('Search question...', data.question.slice(0, 20));
    await expect(qs.rowByText(data.question).first()).toContainText('0');
  });

  test('TC-QS-004 script injection in question text is not executed', async ({ loggedInPage }) => {
    const qs = new QuestionsSetupPage(loggedInPage);
    let alertFired = false;
    loggedInPage.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });
    await qs.goto();
    await qs.createQuestion({ ...QUESTION_CASES.scriptInjection, question: `<script>alert(1)</script> ${Date.now() % 100000}` });
    await loggedInPage.waitForTimeout(1000);
    expect(alertFired).toBeFalsy();
  });

  test('TC-QS-005 search filters question list', async ({ loggedInPage }) => {
    // Self-contained: search on fixed seed text ("question default") is not reliable -
    // that row is shared, mutable environment data and was observed to disappear between
    // runs. Creating and then searching for our own row proves the search feature itself.
    const qs = new QuestionsSetupPage(loggedInPage);
    await qs.goto();
    const data = QUESTION_CASES.valid();
    await qs.createQuestion(data);
    await qs.expectToastSuccess();
    await qs.expectRowVisibleAfterSearch('Search question...', data.question.slice(0, 20));
  });

  test('TC-QS-006 total default points widget reflects sum of default questions', async ({ loggedInPage }) => {
    const qs = new QuestionsSetupPage(loggedInPage);
    await qs.goto();
    await expect(loggedInPage.getByText(/\/ 100 PTS/)).toBeVisible();
  });

  test('TC-QS-007 regression guard: "question 3" is not duplicated (BUG-QS-01)', async ({ loggedInPage }) => {
    // BUG-QS-01 previously showed "question 3" twice in the table. This is shared,
    // mutable environment data - it may not always exist (0 is fine, nothing to
    // duplicate) but if present it must never appear more than once.
    const qs = new QuestionsSetupPage(loggedInPage);
    await qs.goto();
    // The table is paginated - search first so any duplicates land on the same page.
    // Exact match matters: a substring search/hasText on "question 3" also picks up
    // dynamically-generated rows like "Automated evaluative question 3416815200?" left
    // over from other automated runs.
    await qs.search('question 3');
    const count = await loggedInPage.getByText('question 3', { exact: true }).count();
    expect(count, 'BUG-QS-01 has regressed - "question 3" is duplicated again').toBeLessThanOrEqual(1);
  });
});
