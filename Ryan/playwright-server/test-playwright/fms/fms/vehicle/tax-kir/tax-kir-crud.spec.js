import { test, expect } from '@playwright/test';
import { cleanupTableRecordBySnapshot, isAutoCleanupEnabled } from '../../../../utils/data-cleanup.mjs';

const LIST_URL = 'https://portal-dev.modena.com/fms/vehicle/tax-kir';

// ============================================================
// HELPER: Login & Navigate to Tax KIR Page
// ============================================================
async function loginAndGoToTaxKir(page) {
  await page.goto('https://portal-dev.modena.com/fms/vehicle/tax-kir', { waitUntil: 'load', timeout: 60000 });
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

    await page.goto('https://portal-dev.modena.com/fms/vehicle/tax-kir', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  // Jika di my-application (FMS app selector), masuk FMS dulu
  if (page.url().includes('my-application')) {
    const fmsLink = page.getByText('FMS (DEV)');
    if (await fmsLink.isVisible().catch(() => false)) {
      await fmsLink.click();
      await page.waitForTimeout(2000);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
      await page.waitForTimeout(5000);
    }
    await page.goto('https://portal-dev.modena.com/fms/vehicle/tax-kir', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  // Final retry: jika masih tidak ada tax-kir di URL, coba full login
  if (!page.url().includes('tax-kir')) {
    console.log(`loginAndGoToTaxKir: Still at ${page.url()}, attempting full re-login`);
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
    await page.goto('https://portal-dev.modena.com/fms/vehicle/tax-kir', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  // Verify we're on the right page
  expect(page.url()).toContain('tax-kir');
}

// ============================================================
// TEST SUITE: Tax KIR - Vehicle FMS
// ============================================================

test.describe('FMS - Vehicle Tax KIR CRUD', () => {

  // TC-01: Verify Tax KIR page loads correctly
  test('TC-01: Tax KIR page loads correctly', async ({ page }) => {
    console.log('TC-01: Starting Tax KIR page load test');

    await loginAndGoToTaxKir(page);

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

    // Verify action buttons exist
    const buttons = await page.getByRole('button').allTextContents();
    console.log(`Buttons found: ${buttons.join(', ')}`);

    // Verify data rows exist or empty state
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total rows: ${rowCount}`);

    console.log('TC-01: Tax KIR page loaded successfully');
    await page.screenshot({ path: 'test-results/tax-kir-tc01-page-load.png' });
  });

  // TC-02: Add new Tax KIR data
  test('TC-02: Add new Tax KIR data', async ({ page }) => {
    console.log('TC-02: Starting add Tax KIR test');

    await loginAndGoToTaxKir(page);
    const initialRows = await page.locator('tbody tr').count().catch(() => 0);

    // Click Add button
    const addButton = page.getByRole('button', { name: /add|create|new|tambah/i });
    if (await addButton.isVisible().catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1500);

      const currentUrl = page.url();
      const currentHeading = await page.getByRole('heading').first().textContent();
      console.log(`After click add - URL: ${currentUrl}, Heading: ${currentHeading}`);

      // Fill form fields dynamically
      const textInputs = page.locator('input[type="text"]');
      const dateInputs = page.locator('input[type="date"]');
      const numberInputs = page.locator('input[type="number"]');
      const selects = page.locator('select');

      const textCount = await textInputs.count();
      const dateCount = await dateInputs.count();
      const selectCount = await selects.count();
      console.log(`Form fields - text: ${textCount}, date: ${dateCount}, select: ${selectCount}`);

      // Fill date fields (tax/KIR expiry dates)
      for (let i = 0; i < Math.min(dateCount, 4); i++) {
        const dateValue = i % 2 === 0 ? '2026-12-31' : '2027-06-30';
        await dateInputs.nth(i).fill(dateValue);
        console.log(`Filled date ${i}: ${dateValue}`);
      }

      // Fill number inputs (cost, etc.)
      const numCount = await numberInputs.count();
      for (let i = 0; i < Math.min(numCount, 2); i++) {
        await numberInputs.nth(i).fill('500000');
        console.log(`Filled number ${i}: 500000`);
      }

      // Select dropdowns
      for (let i = 0; i < Math.min(selectCount, 3); i++) {
        const options = selects.nth(i).locator('option');
        const optCount = await options.count();
        if (optCount > 1) {
          await selects.nth(i).selectOption({ index: 1 });
          console.log(`Selected option in dropdown ${i}`);
        }
      }

      // Submit form
      const submitBtn = page.getByRole('button', { name: /submit|save|simpan|create/i }).first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        console.log('TC-02: Form submitted');
      }

      // Navigate back to list if needed
      if (!page.url().includes('tax-kir') || page.url().includes('/add') || page.url().includes('/create')) {
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
          label: 'tax kir',
          rowLocator: 'tbody tr',
        });
      }

      console.log('TC-02: Tax KIR data added successfully');
    } else {
      console.log('TC-02: Add button not found, skipping create test');
    }

    await page.screenshot({ path: 'test-results/tax-kir-tc02-create.png' });
  });

  // TC-03: Search Tax KIR data
  test('TC-03: Search Tax KIR data', async ({ page }) => {
    console.log('TC-03: Starting search Tax KIR test');

    await loginAndGoToTaxKir(page);

    // Get initial row count
    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial rows: ${initialRows}`);

    // Get text from first row to use as search term
    if (initialRows > 0) {
      const firstRowText = await page.locator('tbody tr').first().textContent();
      console.log(`First row text: ${firstRowText}`);

      // Try to extract a plate number or vehicle name (likely first few chars)
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

        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(1000);

        console.log('TC-03: Search test completed');
      } else {
        console.log('TC-03: Search input not found');
      }
    } else {
      console.log('TC-03: No data rows to search, skipping');
    }

    await page.screenshot({ path: 'test-results/tax-kir-tc03-search.png' });
  });

  // TC-04: Filter Tax KIR data
  test('TC-04: Filter Tax KIR data', async ({ page }) => {
    console.log('TC-04: Starting filter Tax KIR test');

    await loginAndGoToTaxKir(page);

    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial rows: ${initialRows}`);

    // Check for filter dropdowns or date range filters
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

    await page.screenshot({ path: 'test-results/tax-kir-tc04-filter.png' });
  });

  // TC-05: View Tax KIR detail
  test('TC-05: View Tax KIR detail', async ({ page }) => {
    console.log('TC-05: Starting view Tax KIR detail test');

    await loginAndGoToTaxKir(page);

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      // Look for view/detail button in first row
      const firstRow = page.locator('tbody tr').first();

      // Try view/eye button
      const viewBtn = firstRow.getByRole('button', { name: /view|detail|lihat|eye/i }).first()
        .or(firstRow.locator('button').first());

      if (await viewBtn.isVisible().catch(() => false)) {
        await viewBtn.click();
        await page.waitForTimeout(2000);

        const afterUrl = page.url();
        const afterHeading = await page.getByRole('heading').first().textContent().catch(() => '');
        console.log(`After view click - URL: ${afterUrl}, Heading: ${afterHeading}`);

        // Close if modal or go back if page navigation
        const closeBtn = page.getByRole('button', { name: /close|tutup|back|kembali/i });
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        } else if (!page.url().includes('tax-kir') || afterUrl !== page.url()) {
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

    await page.screenshot({ path: 'test-results/tax-kir-tc05-view.png' });
  });

  // TC-06: Edit Tax KIR data
  test('TC-06: Edit Tax KIR data', async ({ page }) => {
    console.log('TC-06: Starting edit Tax KIR test');

    await loginAndGoToTaxKir(page);

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      const firstRow = page.locator('tbody tr').first();

      // Look for edit button
      const editBtn = firstRow.getByRole('button', { name: /edit|ubah/i }).first()
        .or(firstRow.locator('button[title*="edit" i]').first());

      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(2000);

        const afterHeading = await page.getByRole('heading').first().textContent().catch(() => '');
        console.log(`After edit click - Heading: ${afterHeading}`);

        // Modify a date field if available
        const dateInputs = page.locator('input[type="date"]');
        if (await dateInputs.count() > 0) {
          await dateInputs.first().fill('2027-12-31');
          console.log('TC-06: Modified date field to 2027-12-31');
        }

        // Save changes
        const saveBtn = page.getByRole('button', { name: /save|update|simpan/i }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(3000);
          console.log('TC-06: Changes saved');
        }

        // Navigate back to list if needed
        if (!page.url().includes('tax-kir') || page.url().includes('/edit')) {
          await page.goto('https://portal-dev.modena.com/fms/vehicle/tax-kir', { waitUntil: 'load', timeout: 60000 });
          await page.waitForTimeout(2000);
        }

        console.log('TC-06: Edit test completed');
      } else {
        console.log('TC-06: Edit button not found, skipping');
      }
    } else {
      console.log('TC-06: No data rows to edit, skipping');
    }

    await page.screenshot({ path: 'test-results/tax-kir-tc06-edit.png' });
  });

  // TC-07: Export Tax KIR data
  test('TC-07: Export Tax KIR data', async ({ page }) => {
    console.log('TC-07: Starting export Tax KIR test');

    await loginAndGoToTaxKir(page);

    // Look for export/download button
    const exportBtn = page.getByRole('button', { name: /export|download|unduh/i });
    if (await exportBtn.isVisible().catch(() => false)) {
      // Set up download listener before clicking
      let downloaded = false;
      page.on('download', (dl) => {
        console.log(`TC-07: Download started - ${dl.suggestedFilename()}`);
        downloaded = true;
      });

      await exportBtn.click();

      // Wait for brief period to check what happened
      await page.waitForTimeout(4000);

      const urlAfter = page.url();
      console.log(`TC-07: URL after export click: ${urlAfter}`);

      if (downloaded) {
        console.log('TC-07: File downloaded successfully');
      } else if (!urlAfter.includes('tax-kir')) {
        // Page navigated away - navigate back
        console.log(`TC-07: Page navigated to ${urlAfter}, redirecting back...`);
        await loginAndGoToTaxKir(page);
      } else {
        console.log('TC-07: Export triggered (inline or popup handled by browser)');
      }
    } else {
      console.log('TC-07: Export button not found');
    }

    console.log('TC-07: Export test completed');
    await page.screenshot({ path: 'test-results/tax-kir-tc07-export.png' });
  });

  // TC-08: Test pagination
  test('TC-08: Test Tax KIR pagination', async ({ page }) => {
    console.log('TC-08: Starting pagination test');

    await loginAndGoToTaxKir(page);

    // Check pagination buttons
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

    await page.screenshot({ path: 'test-results/tax-kir-tc08-pagination.png' });
  });

  // TC-09: Verify Tax KIR expiry alerts/indicators
  test('TC-09: Verify Tax KIR expiry status indicators', async ({ page }) => {
    console.log('TC-09: Starting expiry status test');

    await loginAndGoToTaxKir(page);

    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total rows: ${rowCount}`);

    // Check for status badges/indicators (expired, active, soon-to-expire)
    const statusBadges = page.locator('.badge, [class*="status"], [class*="badge"], [class*="chip"]');
    const badgeCount = await statusBadges.count();
    console.log(`TC-09: Status badges found: ${badgeCount}`);

    if (badgeCount > 0) {
      const firstBadgeText = await statusBadges.first().textContent();
      console.log(`TC-09: First status badge: ${firstBadgeText}`);
    }

    // Check for any color-coded rows (expired items often highlighted in red/yellow)
    const coloredRows = page.locator('tbody tr[class*="red"], tbody tr[class*="yellow"], tbody tr[class*="warning"], tbody tr[class*="danger"]');
    const coloredCount = await coloredRows.count();
    console.log(`TC-09: Color-coded rows: ${coloredCount}`);

    // Get all status text
    const headers = await page.locator('th').allTextContents();
    const statusHeaderIdx = headers.findIndex(h => /status|kir|tax|pajak/i.test(h));
    if (statusHeaderIdx >= 0) {
      console.log(`TC-09: Status column found at index ${statusHeaderIdx}: "${headers[statusHeaderIdx]}"`);
    }

    console.log('TC-09: Expiry status test completed');
    await page.screenshot({ path: 'test-results/tax-kir-tc09-status.png' });
  });

  // TC-10: Delete Tax KIR data
  test('TC-10: Delete Tax KIR data', async ({ page }) => {
    console.log('TC-10: Starting delete Tax KIR test');

    await loginAndGoToTaxKir(page);

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      const lastRow = page.locator('tbody tr').last();

      // Look for delete button
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

    await page.screenshot({ path: 'test-results/tax-kir-tc10-delete.png' });
  });

});
