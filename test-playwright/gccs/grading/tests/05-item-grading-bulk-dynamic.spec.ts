import { test, expect } from '../fixtures/authFixture';
import { ItemGradingPage } from '../pages/ItemGradingPage';
import { uniqueSuffix } from '../utils/testData';

// 20 item grading items. Test titles must stay static across the list phase and the
// worker process, so only the index goes in the title - the dynamic tag/remarks are
// generated inside each test body at run time (safe for repeated/parallel execution).
const COUNT = 20;
const PRODUCT = 'MODENA AC SPLIT';

test.describe('Item Grading - bulk create with dynamic tags (20x)', () => {
  for (let index = 1; index <= COUNT; index++) {
    test(`TC-IG-BULK-${String(index).padStart(2, '0')} create item grading`, async ({ loggedInPage }) => {
      const tag = `AUTO-IG-${uniqueSuffix()}-${index}`;
      const remarks = `Automated item grading #${index} - ${uniqueSuffix()}`;

      const ig = new ItemGradingPage(loggedInPage);
      await ig.goto();
      await ig.openAddPage();

      await ig.selectProductItem(PRODUCT);
      await ig.fillRemarks(`${remarks} :: ${tag}`);
      // At least one evaluation question is required before the grading can be saved.
      // Picking the first available question directly is more reliable than "Load Default
      // Questions", whose result depends on live Questions Setup data that can be empty.
      await ig.selectFirstAvailableQuestionForSlot(0);

      await ig.save();
      await ig.expectToastSuccess();

      await ig.goto();
      await ig.search(tag);
      await expect(ig.rowByText(tag)).toBeVisible();
    });
  }
});
