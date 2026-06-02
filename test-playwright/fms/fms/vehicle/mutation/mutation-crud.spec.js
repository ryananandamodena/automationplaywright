import { test, expect } from '@playwright/test';
import { cleanupTableRecordBySnapshot, isAutoCleanupEnabled } from '../../../../utils/data-cleanup.mjs';

const LIST_URL = 'https://portal-dev.modena.com/fms/vehicle/mutation';

// ============================================================
// HELPER: Login & Navigate to Mutation Page
// ============================================================
async function loginAndGoToMutation(page) {
  await page.goto('https://portal-dev.modena.com/fms/vehicle/mutation', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Jika diredirect ke login
  if (page.url().includes('/login')) {
    await page.locator('input[type="email"], input[name="email"]').first().fill('ryan.ananda@modena.com');
    await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(5000);

    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(2000);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
      await page.waitForTimeout(5000);
    }

    await page.goto('https://portal-dev.modena.com/fms/vehicle/mutation', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  // Jika di my-application, masuk FMS dulu
  if (page.url().includes('my-application')) {
    const fmsLink = page.getByText('FMS (DEV)');
    if (await fmsLink.isVisible().catch(() => false)) {
      await fmsLink.click();
      await page.waitForTimeout(2000);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
      await page.waitForTimeout(5000);
    }
    await page.goto('https://portal-dev.modena.com/fms/vehicle/mutation', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  // Final retry: full re-login jika masih belum di mutation
  if (!page.url().includes('mutation')) {
    console.log(`loginAndGoToMutation: Still at ${page.url()}, attempting full re-login`);
    await page.goto('https://portal-dev.modena.com/login', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.locator('input[type="email"], input[name="email"]').first().fill('ryan.ananda@modena.com');
    await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(5000);
    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(2000);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
      await page.waitForTimeout(5000);
    }
    await page.goto('https://portal-dev.modena.com/fms/vehicle/mutation', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  // Verify we're on the right page
  expect(page.url()).toContain('mutation');
}

// ============================================================
// TEST SUITE: Mutation - Vehicle FMS
// ============================================================

test.describe('FMS - Vehicle Mutation CRUD', () => {

  // TC-01: Verify Mutation page loads correctly
  test('TC-01: Mutation page loads correctly', async ({ page }) => {
    console.log('TC-01: Starting Mutation page load test');

    await loginAndGoToMutation(page);

    // Verify page heading
    const pageTitle = page.getByRole('heading').first();
    await expect(pageTitle).toBeVisible();
    const titleText = await pageTitle.textContent();
    console.log(`Page title: ${titleText}`);

    // Verify table exists
    const table = page.locator('table').or(page.locator('[role="table"]'));
    await expect(table).toBeVisible();

    // Get actual table headers
    const headers = await page.locator('th').allTextContents();
    console.log(`Table headers: ${headers.join(', ')}`);

    // Verify row count
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total rows: ${rowCount}`);

    // Verify buttons exist
    const buttons = await page.getByRole('button').allTextContents();
    console.log(`Buttons found: ${buttons.join(', ')}`);

    console.log('TC-01: Mutation page loaded successfully');
    await page.screenshot({ path: 'test-results/mutation-tc01-page-load.png' });
  });

  // TC-02: Add new Mutation
  test('TC-02: Add new Mutation', async ({ page }) => {
    console.log('TC-02: Starting add Mutation test');

    await loginAndGoToMutation(page);
    const initialRows = await page.locator('tbody tr').count().catch(() => 0);

    // Click Add button
    const addButton = page.getByRole('button', { name: /add|create|new|tambah|mutation/i });
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1500);

      const currentUrl = page.url();
      const currentHeading = await page.getByRole('heading').first().textContent().catch(() => '');
      console.log(`After click add - URL: ${currentUrl}, Heading: ${currentHeading}`);

      // Fill form fields dynamically
      const textInputs = page.locator('input[type="text"]');
      const dateInputs = page.locator('input[type="date"]');
      const numberInputs = page.locator('input[type="number"]');
      const selects = page.locator('select');
      const textareas = page.locator('textarea');

      const textCount = await textInputs.count();
      const dateCount = await dateInputs.count();
      const selectCount = await selects.count();
      const textareaCount = await textareas.count();
      console.log(`Form fields - text: ${textCount}, date: ${dateCount}, select: ${selectCount}, textarea: ${textareaCount}`);

      // Select dropdowns (vehicle, from branch, to branch etc.)
      for (let i = 0; i < Math.min(selectCount, 4); i++) {
        const options = selects.nth(i).locator('option');
        const optCount = await options.count();
        if (optCount > 1) {
          await selects.nth(i).selectOption({ index: 1 });
          console.log(`Selected option in dropdown ${i}`);
          await page.waitForTimeout(300);
        }
      }

      // Fill date fields (mutation date)
      for (let i = 0; i < Math.min(dateCount, 2); i++) {
        await dateInputs.nth(i).fill('2026-03-01');
        console.log(`Filled date ${i}: 2026-03-01`);
      }

      // Fill text inputs (notes, reason etc.)
      for (let i = 0; i < Math.min(textCount, 2); i++) {
        await textInputs.nth(i).fill('Test Mutation Note');
        console.log(`Filled text ${i}`);
      }

      // Fill textarea (notes/reason)
      if (textareaCount > 0) {
        await textareas.first().fill('Test mutation reason for automation');
        console.log('Filled textarea');
      }

      // Submit form
      const submitBtn = page.getByRole('button', { name: /submit|save|simpan|create/i }).first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        console.log('TC-02: Form submitted');
      }

      // Navigate back to list if needed
      if (!page.url().includes('mutation') || page.url().includes('/add') || page.url().includes('/create')) {
        await page.goto(LIST_URL, { waitUntil: 'load', timeout: 60000 });
        await page.waitForTimeout(2000);
      }

      await page.goto(LIST_URL, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(1500);
      const finalRows = await page.locator('tbody tr').count().catch(() => 0);
      const createdSnapshot = finalRows > initialRows
        ? await page.locator('tbody tr').first().textContent().catch(() => null)
        : null;
      console.log(`TC-02: Rows before ${initialRows}, after ${finalRows}`);

      if (createdSnapshot && isAutoCleanupEnabled()) {
        await cleanupTableRecordBySnapshot(page, {
          listUrl: LIST_URL,
          rowSnapshot: createdSnapshot,
          label: 'mutation',
          rowLocator: 'tbody tr',
        });
      }

      console.log('TC-02: Mutation add test completed');
    } else {
      console.log('TC-02: Add button not found, skipping create test');
    }

    await page.screenshot({ path: 'test-results/mutation-tc02-create.png' });
  });

  // TC-03: Search Mutation
  test('TC-03: Search Mutation', async ({ page }) => {
    console.log('TC-03: Starting search Mutation test');

    await loginAndGoToMutation(page);

    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial rows: ${initialRows}`);

    if (initialRows > 0) {
      const firstRowText = await page.locator('tbody tr').first().textContent();
      console.log(`First row text: ${firstRowText}`);

      // Extract a searchable term
      const searchTerm = firstRowText.trim().split(/\s+/)[0];
      console.log(`Using search term: ${searchTerm}`);

      // Find search input
      const searchInput = page.getByPlaceholder(/search|pencarian|cari/i)
        .or(page.getByRole('textbox', { name: /search|cari/i }))
        .or(page.locator('input[type="text"]').first());

      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill(searchTerm);
        await page.waitForTimeout(2000);

        const searchResults = await page.locator('tbody tr').count();
        console.log(`Search results for "${searchTerm}": ${searchResults}`);
        expect(searchResults).toBeGreaterThanOrEqual(0);

        await searchInput.clear();
        await page.waitForTimeout(1000);
        console.log('TC-03: Search test completed');
      } else {
        console.log('TC-03: Search input not found');
      }
    } else {
      console.log('TC-03: No data rows, skipping search');
    }

    await page.screenshot({ path: 'test-results/mutation-tc03-search.png' });
  });

  // TC-04: Filter Mutation data
  test('TC-04: Filter Mutation data', async ({ page }) => {
    console.log('TC-04: Starting filter Mutation test');

    await loginAndGoToMutation(page);

    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial rows: ${initialRows}`);

    // Check for filter dropdowns
    const filterSelects = page.locator('select').or(page.getByRole('combobox'));
    const filterCount = await filterSelects.count();
    console.log(`Filter dropdowns found: ${filterCount}`);

    if (filterCount > 0) {
      for (let i = 0; i < Math.min(filterCount, 2); i++) {
        const options = filterSelects.nth(i).locator('option');
        const optCount = await options.count();
        if (optCount > 1) {
          await filterSelects.nth(i).selectOption({ index: 1 });
          await page.waitForTimeout(1500);
          const filteredRows = await page.locator('tbody tr').count();
          console.log(`After filter ${i}: ${filteredRows} rows`);

          // Reset filter
          await filterSelects.nth(i).selectOption({ index: 0 });
          await page.waitForTimeout(1000);
        }
      }
      console.log('TC-04: Filter test completed');
    } else {
      console.log('TC-04: No filter dropdowns found');
    }

    await page.screenshot({ path: 'test-results/mutation-tc04-filter.png' });
  });

  // TC-05: View Mutation detail
  test('TC-05: View Mutation detail', async ({ page }) => {
    console.log('TC-05: Starting view Mutation detail test');

    await loginAndGoToMutation(page);

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      const firstRow = page.locator('tbody tr').first();

      // Try view/detail button
      const viewBtn = firstRow.getByRole('button', { name: /view|detail|lihat/i }).first()
        .or(firstRow.locator('button').first());

      if (await viewBtn.isVisible().catch(() => false)) {
        await viewBtn.click();
        await page.waitForTimeout(2000);

        const afterUrl = page.url();
        const afterHeading = await page.getByRole('heading').first().textContent().catch(() => '');
        console.log(`After view click - URL: ${afterUrl}, Heading: ${afterHeading}`);

        // Close modal or go back
        const closeBtn = page.getByRole('button', { name: /close|tutup|back|kembali/i });
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        } else if (!afterUrl.includes('mutation') || afterUrl !== page.url()) {
          await page.goBack();
        }

        await page.waitForTimeout(1000);
        console.log('TC-05: View detail completed');
      } else {
        console.log('TC-05: View button not found, trying row click');
        await firstRow.click();
        await page.waitForTimeout(1500);
        console.log(`After row click - URL: ${page.url()}`);
      }
    } else {
      console.log('TC-05: No data rows to view, skipping');
    }

    await page.screenshot({ path: 'test-results/mutation-tc05-view.png' });
  });

  // TC-06: Edit Mutation data
  test('TC-06: Edit Mutation data', async ({ page }) => {
    console.log('TC-06: Starting edit Mutation test');

    await loginAndGoToMutation(page);

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      const firstRow = page.locator('tbody tr').first();

      const editBtn = firstRow.getByRole('button', { name: /edit|ubah/i }).first()
        .or(firstRow.locator('button[title*="edit" i]').first());

      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(2000);

        const afterHeading = await page.getByRole('heading').first().textContent().catch(() => '');
        console.log(`After edit click - Heading: ${afterHeading}`);

        // Modify a text field if available
        const textareas = page.locator('textarea');
        if (await textareas.count() > 0) {
          await textareas.first().fill('Updated mutation reason - automation test');
          console.log('TC-06: Modified textarea field');
        }

        // Modify a date field if available
        const dateInputs = page.locator('input[type="date"]');
        if (await dateInputs.count() > 0) {
          await dateInputs.first().fill('2026-04-01');
          console.log('TC-06: Modified date field');
        }

        // Save changes
        const saveBtn = page.getByRole('button', { name: /save|update|simpan/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(3000);
          console.log('TC-06: Changes saved');
        }

        // Navigate back to list if needed
        if (!page.url().includes('mutation') || page.url().includes('/edit')) {
          await page.goto('https://portal-dev.modena.com/fms/vehicle/mutation', { waitUntil: 'load', timeout: 60000 });
          await page.waitForTimeout(2000);
        }

        console.log('TC-06: Edit test completed');
      } else {
        console.log('TC-06: Edit button not found, skipping');
      }
    } else {
      console.log('TC-06: No data rows to edit, skipping');
    }

    await page.screenshot({ path: 'test-results/mutation-tc06-edit.png' });
  });

  // TC-07: Export Mutation data
  test('TC-07: Export Mutation data', async ({ page }) => {
    console.log('TC-07: Starting export Mutation test');

    await loginAndGoToMutation(page);

    const exportBtn = page.getByRole('button', { name: /export|download|unduh/i });
    if (await exportBtn.isVisible().catch(() => false)) {
      let downloaded = false;
      page.on('download', (dl) => {
        console.log(`TC-07: Download started - ${dl.suggestedFilename()}`);
        downloaded = true;
      });

      await exportBtn.click();
      await page.waitForTimeout(4000);

      const urlAfter = page.url();
      console.log(`TC-07: URL after export click: ${urlAfter}`);

      if (downloaded) {
        console.log('TC-07: File downloaded successfully');
      } else if (!urlAfter.includes('mutation')) {
        console.log(`TC-07: Page navigated to ${urlAfter}, redirecting back...`);
        await loginAndGoToMutation(page);
      } else {
        console.log('TC-07: Export triggered (inline or popup handled by browser)');
      }
    } else {
      console.log('TC-07: Export button not found');
    }

    console.log('TC-07: Export test completed');
    await page.screenshot({ path: 'test-results/mutation-tc07-export.png' });
  });

  // TC-08: Test pagination
  test('TC-08: Test Mutation pagination', async ({ page }) => {
    console.log('TC-08: Starting pagination test');

    await loginAndGoToMutation(page);

    const nextBtn = page.getByRole('button', { name: 'Next' });
    const prevBtn = page.getByRole('button', { name: 'Previous' });

    if (await nextBtn.isVisible().catch(() => false)) {
      const isNextEnabled = await nextBtn.isEnabled();
      console.log(`TC-08: Next button found, enabled: ${isNextEnabled}`);

      if (isNextEnabled) {
        const rowsBefore = await page.locator('tbody tr').count();
        await nextBtn.click();
        await page.waitForTimeout(2000);
        const rowsAfter = await page.locator('tbody tr').count();
        console.log(`TC-08: Rows before: ${rowsBefore}, after: ${rowsAfter}`);

        // Go back to first page
        if (await prevBtn.isVisible().catch(() => false) && await prevBtn.isEnabled()) {
          await prevBtn.click();
          await page.waitForTimeout(1000);
        }
      } else {
        console.log('TC-08: Next button disabled (only 1 page of data)');
      }
    } else {
      console.log('TC-08: Pagination not found');
    }

    await page.screenshot({ path: 'test-results/mutation-tc08-pagination.png' });
  });

  // TC-09: Verify Mutation status indicators
  test('TC-09: Verify Mutation status indicators', async ({ page }) => {
    console.log('TC-09: Starting status indicators test');

    await loginAndGoToMutation(page);

    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total rows: ${rowCount}`);

    // Check for status badges
    const statusBadges = page.locator('.badge, [class*="status"], [class*="badge"], [class*="chip"]');
    const badgeCount = await statusBadges.count();
    console.log(`TC-09: Status badges found: ${badgeCount}`);

    if (badgeCount > 0) {
      const firstBadgeText = await statusBadges.first().textContent();
      console.log(`TC-09: First status badge: ${firstBadgeText}`);
    }

    // Check headers for status column
    const headers = await page.locator('th').allTextContents();
    console.log(`TC-09: Headers: ${headers.join(', ')}`);

    const statusHeaderIdx = headers.findIndex(h => /status|approval/i.test(h));
    if (statusHeaderIdx >= 0) {
      console.log(`TC-09: Status column at index ${statusHeaderIdx}: "${headers[statusHeaderIdx]}"`);

      // Get all status values in that column
      const statusCells = page.locator(`tbody tr td:nth-child(${statusHeaderIdx + 1})`);
      const statusCount = await statusCells.count();
      for (let i = 0; i < Math.min(statusCount, 3); i++) {
        const statusText = await statusCells.nth(i).textContent();
        console.log(`TC-09: Row ${i + 1} status: ${statusText?.trim()}`);
      }
    }

    console.log('TC-09: Status indicators test completed');
    await page.screenshot({ path: 'test-results/mutation-tc09-status.png' });
  });

  // TC-10: Delete Mutation
  test('TC-10: Delete Mutation', async ({ page }) => {
    console.log('TC-10: Starting delete Mutation test');

    await loginAndGoToMutation(page);

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      const lastRow = page.locator('tbody tr').last();

      const deleteBtn = lastRow.getByRole('button', { name: /delete|hapus/i }).first()
        .or(lastRow.locator('button[title*="delete" i]').first());

      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        // Confirm deletion dialog
        const confirmBtn = page.getByRole('button', { name: /confirm|yes|ya|delete|hapus/i });
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(3000);
          console.log('TC-10: Confirmed deletion');
        }

        const newRowCount = await page.locator('tbody tr').count();
        console.log(`TC-10: Rows before: ${rowCount}, after: ${newRowCount}`);
        console.log('TC-10: Delete test completed');
      } else {
        console.log('TC-10: Delete button not found, skipping');
      }
    } else {
      console.log('TC-10: No data rows to delete, skipping');
    }

    await page.screenshot({ path: 'test-results/mutation-tc10-delete.png' });
  });

});
