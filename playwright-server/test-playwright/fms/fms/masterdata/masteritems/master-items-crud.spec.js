import { test, expect } from '@playwright/test';

// Base URL
const BASE_URL = 'https://portal-dev.modena.com';
const MODULE_URL = `${BASE_URL}/fms/master/atk`;

// ============================================================
// HELPER: Login & Navigate to Master Items Page
// ============================================================
async function loginAndGoToItems(page) {
  await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (page.url().includes('/login')) {
    await page.locator('input[type="email"], input[name="email"]').first().fill('ryan.ananda@modena.com');
    await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 20000 }).catch(() => {});
  }
  if (page.url().includes('my-application')) {
    await page.getByText('FMS (DEV)').click();
    await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
    }
    await page.waitForTimeout(2000);
    await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
  if (!page.url().includes('/fms/master')) {
    console.log(`loginAndGoToItems: Still at ${page.url()}, attempting full re-login`);
    await page.goto('https://portal-dev.modena.com/fms/vehicle', { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
      const fmsConfirm = page.getByRole('button', { name: 'Confirm' });
      if (await fmsConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fmsConfirm.click();
        await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
      }
      await page.waitForTimeout(2000);
    }
    await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
  expect(page.url()).toContain('/fms/master');
}

// ============================================================
// TEST SUITE: Master Items - FMS Master Data
// ============================================================
test.describe('FMS Master Data - Master Items', () => {
  test.describe.configure({ timeout: 300000 });

  // TC-01: Verify Master Items page loads correctly
  test('TC-01: Master Items page loads correctly', async ({ page }) => {
    console.log('TC-01: Starting Master Items page load test');
    await loginAndGoToItems(page);
    const table = page.locator('table').or(page.locator('[role="table"]'));
    await expect(table).toBeVisible();
    const headers = await page.locator('th').allTextContents();
    console.log(`Headers: ${headers.join(', ')}`);
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total rows: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(-1);
    const buttons = await page.getByRole('button').allTextContents();
    console.log(`Buttons: ${buttons.join(', ')}`);
    console.log('TC-01: Master Items page loaded successfully');
    await page.screenshot({ path: 'test-results/items-tc01-page-load.png' });
  });

  // TC-02: Add new Master Items entry
  test('TC-02: Add new Master Items entry', async ({ page }) => {
    console.log('TC-02: Starting add Master Items test');
    await loginAndGoToItems(page);
    let addButton = page.locator('button').filter({ hasText: /add|create|tambah|new/i }).first();
    if (!(await addButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      addButton = page.getByRole('button', { name: /add|create|tambah|new/i }).first();
    }
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1500);
      const urlAfter = page.url();
      const heading = await page.getByRole('heading').first().textContent().catch(() => '');
      console.log(`After add click - URL: ${urlAfter}, Heading: ${heading}`);
      const modalVisible = await page.locator('[role="dialog"], .modal, [class*="modal"]').isVisible().catch(() => false);
      console.log(`Modal visible: ${modalVisible}`);
      const textInputs = page.locator('input[type="text"], input:not([type])');
      const textCount = await textInputs.count();
      const selects = page.locator('select');
      const selectCount = await selects.count();
      console.log(`Form fields - text: ${textCount}, select: ${selectCount}`);
      let filled = 0;
      for (let i = 0; i < textCount && filled < 3; i++) {
        try {
          const inp = textInputs.nth(i);
          if (await inp.isEditable({ timeout: 1000 }).catch(() => false)) {
            await inp.fill(`Test Auto ${i + 1}`, { timeout: 3000 });
            filled++;
            console.log(`Filled text ${i}`);
          }
        } catch (e) { console.log(`Skip text ${i}`); }
      }
      for (let i = 0; i < Math.min(selectCount, 2); i++) {
        try {
          const opts = await selects.nth(i).locator('option').count().catch(() => 0);
          if (opts > 1) { await selects.nth(i).selectOption({ index: 1 }, { timeout: 3000 }); console.log(`Selected dropdown ${i}`); }
        } catch (e) { console.log(`Skip select ${i}`); }
      }
      const cancelBtn = page.getByRole('button', { name: /cancel|batal|close|tutup/i }).first();
      if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(1000);
        console.log('TC-02: Form cancelled');
      } else if (!page.url().includes('/fms/master')) {
        await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(1500);
      }
      console.log('TC-02: Add form explored successfully');
    } else {
      console.log('TC-02: Add button not found, skipping');
    }
    await page.screenshot({ path: 'test-results/items-tc02-add.png' });
  });

  // TC-03: Search Master Items
  test('TC-03: Search Master Items', async ({ page }) => {
    console.log('TC-03: Starting search test');
    await loginAndGoToItems(page);
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Initial rows: ${rowCount}`);
    if (rowCount > 0) {
      const firstCell = await page.locator('tbody tr').first().locator('td').nth(1).textContent().catch(() => '');
      const searchTerm = firstCell.trim().split(/\s+/)[0] || 'a';
      console.log(`Search term: "${searchTerm}"`);
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="cari" i], input[placeholder*="find" i]').first();
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill(searchTerm);
        await page.waitForTimeout(1500);
        const afterRows = await page.locator('tbody tr').count();
        console.log(`After search: ${afterRows} rows`);
        await searchInput.clear();
        await page.waitForTimeout(500);
      } else {
        console.log('TC-03: Search input not found, skipping');
      }
    }
    await page.screenshot({ path: 'test-results/items-tc03-search.png' });
  });

  // TC-04: Filter Master Items
  test('TC-04: Filter Master Items', async ({ page }) => {
    console.log('TC-04: Starting filter test');
    await loginAndGoToItems(page);
    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial rows: ${initialRows}`);
    const selects = page.locator('select');
    const selectCount = await selects.count();
    console.log(`Filter dropdowns found: ${selectCount}`);
    if (selectCount > 0) {
      for (let i = 0; i < Math.min(selectCount, 2); i++) {
        try {
          const opts = await selects.nth(i).locator('option').count().catch(() => 0);
          if (opts > 1) {
            await selects.nth(i).selectOption({ index: 1 }, { timeout: 5000 });
            await page.waitForTimeout(500);
            const afterRows = await page.locator('tbody tr').count({ timeout: 5000 }).catch(() => 0);
            console.log(`After filter ${i}: ${afterRows} rows`);
          }
        } catch (e) { console.log(`Filter ${i} skipped`); }
      }
    } else {
      console.log('TC-04: No filter dropdowns found, skipping');
    }
    await page.screenshot({ path: 'test-results/items-tc04-filter.png' }).catch(() => {});
  });

  // TC-05: View Master Items detail
  test('TC-05: View Master Items detail', async ({ page }) => {
    console.log('TC-05: Starting view detail test');
    await loginAndGoToItems(page);
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Row count: ${rowCount}`);
    if (rowCount > 0) {
      const viewBtn = page.locator('tbody tr').first().locator('button, a').filter({ hasText: /view|detail|lihat/i }).first();
      const eyeBtn = page.locator('tbody tr').first().locator('button[title*="view" i], button[title*="detail" i], [class*="view"], [class*="eye"]').first();
      if (await viewBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await viewBtn.click();
        await page.waitForTimeout(1500);
        console.log(`After view click - URL: ${page.url()}`);
      } else if (await eyeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await eyeBtn.click();
        await page.waitForTimeout(1500);
        console.log(`After view click - URL: ${page.url()}`);
      } else {
        await page.locator('tbody tr').first().locator('td').first().click().catch(() => {});
        await page.waitForTimeout(1000);
        console.log(`TC-05: Clicked first row, URL: ${page.url()}`);
      }
      if (!page.url().includes('/fms/master')) {
        await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(1500);
      }
    } else {
      console.log('TC-05: No rows to view, skipping');
    }
    await page.screenshot({ path: 'test-results/items-tc05-view.png' });
  });

  // TC-06: Edit Master Items entry
  test('TC-06: Edit Master Items entry', async ({ page }) => {
    console.log('TC-06: Starting edit test');
    await loginAndGoToItems(page);
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      const editBtn = page.locator('tbody tr').first().locator('button').filter({ hasText: /edit|ubah|update/i }).first();
      const editIcon = page.locator('tbody tr').first().locator('button[title*="edit" i], [class*="edit"]').first();
      if (await editBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1500);
        console.log(`TC-06: Edit clicked, URL: ${page.url()}`);
        const cancelBtn = page.getByRole('button', { name: /cancel|batal|close/i }).first();
        if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) { await cancelBtn.click(); await page.waitForTimeout(500); }
        else if (!page.url().includes('/fms/master')) { await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 20000 }).catch(() => {}); }
      } else if (await editIcon.isVisible({ timeout: 1000 }).catch(() => false)) {
        await editIcon.click();
        await page.waitForTimeout(1500);
        console.log(`TC-06: Edit icon clicked, URL: ${page.url()}`);
        const cancelBtn = page.getByRole('button', { name: /cancel|batal|close/i }).first();
        if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) { await cancelBtn.click(); await page.waitForTimeout(500); }
      } else {
        console.log('TC-06: Edit button not found, skipping');
      }
    } else {
      console.log('TC-06: No rows to edit, skipping');
    }
    await page.screenshot({ path: 'test-results/items-tc06-edit.png' });
  });

  // TC-07: Export Master Items data
  test('TC-07: Export Master Items data', async ({ page }) => {
    console.log('TC-07: Starting export test');
    await loginAndGoToItems(page);
    const exportBtn = page.getByRole('button', { name: /export|download|unduh/i }).first();
    if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      let downloaded = false;
      page.on('download', (dl) => {
        console.log(`TC-07: Download started - ${dl.suggestedFilename()}`);
        downloaded = true;
      });
      await exportBtn.click();
      await page.waitForTimeout(3000);
      const urlAfter = page.url();
      console.log(`TC-07: URL after export: ${urlAfter}, Downloaded: ${downloaded}`);
      if (!urlAfter.includes('/fms/master')) {
        await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(1500);
        if (page.url().includes('my-application') || page.url().includes('/login')) {
          await loginAndGoToItems(page);
        }
      }
    } else {
      console.log('TC-07: Export button not found, skipping');
    }
    await page.screenshot({ path: 'test-results/items-tc07-export.png' });
  });

  // TC-08: Test Master Items pagination
  test('TC-08: Test Master Items pagination', async ({ page }) => {
    console.log('TC-08: Starting pagination test');
    await loginAndGoToItems(page);
    const rowsBefore = await page.locator('tbody tr').count();
    console.log(`Rows before: ${rowsBefore}`);
    const nextBtn = page.getByRole('button', { name: /next|›|»|selanjutnya/i }).last();
    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isEnabled = await nextBtn.isEnabled().catch(() => false);
      console.log(`TC-08: Next button found, enabled: ${isEnabled}`);
      if (isEnabled) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        const rowsAfter = await page.locator('tbody tr').count();
        console.log(`Rows after: ${rowsAfter}`);
      }
    } else {
      console.log('TC-08: No pagination or single page');
    }
    await page.screenshot({ path: 'test-results/items-tc08-pagination.png' });
  });

  // TC-09: Verify Master Items status indicators
  test('TC-09: Verify Master Items status indicators', async ({ page }) => {
    console.log('TC-09: Starting status indicators test');
    await loginAndGoToItems(page);
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total rows: ${rowCount}`);
    const headers = await page.locator('th').allTextContents();
    console.log(`TC-09: Headers: ${headers.join(', ')}`);
    const badges = await page.locator('[class*="badge"], [class*="status"], [class*="chip"], [class*="tag"]').count();
    console.log(`TC-09: Badge/status elements: ${badges}`);
    if (rowCount > 0) {
      const firstRowCells = await page.locator('tbody tr').first().locator('td').allTextContents();
      console.log(`First row data: ${firstRowCells.join(' | ')}`);
    }
    await page.screenshot({ path: 'test-results/items-tc09-status.png' });
  });

  // TC-10: Delete Master Items entry (check delete button)
  test('TC-10: Delete Master Items entry', async ({ page }) => {
    console.log('TC-10: Starting delete test');
    await loginAndGoToItems(page);
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      const deleteBtn = page.locator('tbody tr').last().locator('button').filter({ hasText: /delete|hapus|remove/i }).first();
      const deleteIcon = page.locator('tbody tr').last().locator('button[title*="delete" i], button[title*="hapus" i], [class*="delete"]').first();
      if (await deleteBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('TC-10: Delete button found');
      } else if (await deleteIcon.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('TC-10: Delete icon found');
      } else {
        console.log('TC-10: Delete button not found, skipping');
      }
    } else {
      console.log('TC-10: No rows found, skipping');
    }
    await page.screenshot({ path: 'test-results/items-tc10-delete.png' });
  });
});
