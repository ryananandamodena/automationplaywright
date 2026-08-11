import { test, expect } from '../fixtures/authFixture';
import { ServiceCenterPage } from '../pages/ServiceCenterPage';

// Service Center used for these tests. Its Warehouse Grading list was confirmed empty
// before this suite runs; each test cleans up the row(s) it creates so the suite is
// re-runnable without accumulating leftover data on a real service center record.
const SERVICE_CENTER_ID = 85;
const KNOWN_ERP_WAREHOUSE = 'Warehouse Furniture Bandung - Kat A'; // resolves to ERP code WB-BAFUA

test.describe('Service Center - Warehouse Grading', () => {
  test('TC-WHG-001 add warehouse grading with valid ERP code and category succeeds', async ({ loggedInPage }) => {
    const sc = new ServiceCenterPage(loggedInPage);
    await sc.goto(SERVICE_CENTER_ID);
    await sc.openAddWarehouseGradingModal();
    await sc.fillWarehouseGradingForm({ erpCodeSearch: KNOWN_ERP_WAREHOUSE, category: 'A' });
    await sc.saveWarehouseGrading();

    const row = sc.warehouseGradingRowByErpCode('WB-BAFUA');
    await expect(row).toBeVisible();
    await expect(row).toContainText('A');
    await expect(row).toContainText('False'); // Grading Location defaults to off

    await sc.deleteWarehouseGradingRow('WB-BAFUA');
    await expect(row).toBeHidden();
  });

  test('TC-WHG-002 regression guard: "Is Grading Location?" blocks Save entirely (BUG-WHG-03)', async ({ loggedInPage }) => {
    // Confirmed via exploration on 10 Aug 2026: turning "Is Grading Location?" on disables
    // and clears the required Category field (see TC-WHG-002b) - but Save still silently
    // requires it. The click does nothing: no toast, no inline error, the modal just stays
    // open. Net effect: a "grading location" warehouse cannot currently be saved at all
    // through this UI. This test documents that broken state so a fix (Save either
    // succeeding, or a visible validation message) shows up as a failing assertion here.
    const sc = new ServiceCenterPage(loggedInPage);
    await sc.goto(SERVICE_CENTER_ID);
    await sc.openAddWarehouseGradingModal();
    await sc.fillWarehouseGradingForm({ erpCodeSearch: KNOWN_ERP_WAREHOUSE, isGradingLocation: true });
    await sc.saveWarehouseGrading();

    await expect(
      loggedInPage.getByRole('heading', { name: 'Add Warehouse Grading' }),
      'BUG-WHG-03 has been fixed - update this test to assert the save succeeds (or shows a validation message)'
    ).toBeVisible();
    await expect(sc.warehouseGradingRowByErpCode('WB-BAFUA')).toBeHidden();

    await sc.closeWarehouseGradingModal();
  });

  test('TC-WHG-002b business rule: "Is Grading Location?" disables and clears Category', async ({ loggedInPage }) => {
    // A grading location isn't classified by category - confirmed via exploration on
    // 10 Aug 2026: selecting Category, then toggling this switch on, disables the
    // Category dropdown and clears its selection back to "Choose Category". Combined with
    // TC-WHG-002, this also means Save can never succeed while the toggle is on (BUG-WHG-03).
    const sc = new ServiceCenterPage(loggedInPage);
    await sc.goto(SERVICE_CENTER_ID);
    await sc.openAddWarehouseGradingModal();
    await sc.selectErpCode(KNOWN_ERP_WAREHOUSE);
    await sc.selectCategory('A');
    await sc.toggleIsGradingLocation();

    await expect(sc.categoryDropdown()).toHaveClass(/p-disabled/);
    await expect(sc.categoryDropdown().locator('.p-dropdown-label')).toHaveText('Choose Category');

    await sc.closeWarehouseGradingModal();
  });

  test('TC-WHG-003 closing the modal without saving does not add a row', async ({ loggedInPage }) => {
    const sc = new ServiceCenterPage(loggedInPage);
    await sc.goto(SERVICE_CENTER_ID);
    await sc.openAddWarehouseGradingModal();
    await sc.fillWarehouseGradingForm({ erpCodeSearch: KNOWN_ERP_WAREHOUSE, category: 'A' });
    await sc.closeWarehouseGradingModal();

    await expect(loggedInPage.getByRole('dialog')).toBeHidden();
    await expect(sc.warehouseGradingRowByErpCode('WB-BAFUA')).toBeHidden();
  });

  test('TC-WHG-004 regression guard: saving with no ERP code/category selected is not blocked (BUG-WHG-01)', async ({ loggedInPage }) => {
    // ERP Code and Category are marked required (red asterisk) in the UI, but there is
    // currently no client-side validation stopping an empty submit - it silently adds a
    // "-" / "-" row. This test documents the current (buggy) behavior as of 10 Aug 2026 so
    // a fix shows up as a failing assertion here, not a silent behavior change.
    const sc = new ServiceCenterPage(loggedInPage);
    await sc.goto(SERVICE_CENTER_ID);

    const table = loggedInPage.locator('table.p-datatable-table').nth(1);
    const rowsBefore = await table.locator('tbody tr').count();

    await sc.openAddWarehouseGradingModal();
    await sc.saveWarehouseGrading();

    const rowsAfter = await table.locator('tbody tr').count();
    expect(rowsAfter, 'BUG-WHG-01 has been fixed - update this test to assert the empty submit is blocked').toBe(rowsBefore + 1);

    // Clean up the empty row so the suite stays re-runnable.
    await table.locator('tbody tr').last().locator('svg[color="red"]').click();
    await loggedInPage.getByRole('button', { name: 'Yes, Delete' }).click();
  });

  test('TC-WHG-005 an already-added warehouse no longer appears in the ERP Code choices', async ({ loggedInPage }) => {
    const sc = new ServiceCenterPage(loggedInPage);
    await sc.goto(SERVICE_CENTER_ID);
    await sc.openAddWarehouseGradingModal();
    await sc.fillWarehouseGradingForm({ erpCodeSearch: KNOWN_ERP_WAREHOUSE, category: 'A' });
    await sc.saveWarehouseGrading();

    await sc.openAddWarehouseGradingModal();
    await loggedInPage.getByRole('dialog').locator('.p-dropdown').first().click();
    await expect(loggedInPage.locator('.p-dropdown-panel').getByText(KNOWN_ERP_WAREHOUSE)).toBeHidden();
    await sc.closeWarehouseGradingModal();

    await sc.deleteWarehouseGradingRow('WB-BAFUA');
  });

  test('TC-WHG-006 delete shows a confirmation and removes the row on confirm', async ({ loggedInPage }) => {
    const sc = new ServiceCenterPage(loggedInPage);
    await sc.goto(SERVICE_CENTER_ID);
    await sc.openAddWarehouseGradingModal();
    await sc.fillWarehouseGradingForm({ erpCodeSearch: KNOWN_ERP_WAREHOUSE, category: 'A' });
    await sc.saveWarehouseGrading();

    const row = sc.warehouseGradingRowByErpCode('WB-BAFUA');
    await row.locator('svg[color="red"]').click();
    await expect(loggedInPage.getByText(/Are you sure you want to delete warehouse grading/i)).toBeVisible();
    await loggedInPage.getByRole('button', { name: 'Yes, Delete' }).click();
    await expect(row).toBeHidden();
  });

  test('TC-WHG-007 cancelling the delete confirmation keeps the row', async ({ loggedInPage }) => {
    const sc = new ServiceCenterPage(loggedInPage);
    await sc.goto(SERVICE_CENTER_ID);
    await sc.openAddWarehouseGradingModal();
    await sc.fillWarehouseGradingForm({ erpCodeSearch: KNOWN_ERP_WAREHOUSE, category: 'A' });
    await sc.saveWarehouseGrading();

    const row = sc.warehouseGradingRowByErpCode('WB-BAFUA');
    await row.locator('svg[color="red"]').click();
    await loggedInPage.getByRole('button', { name: /^(no|cancel)$/i }).click();
    await expect(row).toBeVisible();

    await sc.deleteWarehouseGradingRow('WB-BAFUA');
  });

  test('TC-WHG-008 editing an existing row pre-fills the current ERP code and category', async ({ loggedInPage }) => {
    const sc = new ServiceCenterPage(loggedInPage);
    await sc.goto(SERVICE_CENTER_ID);
    await sc.openAddWarehouseGradingModal();
    await sc.fillWarehouseGradingForm({ erpCodeSearch: KNOWN_ERP_WAREHOUSE, category: 'A' });
    await sc.saveWarehouseGrading();

    await sc.openEditWarehouseGradingModal('WB-BAFUA');
    const modal = loggedInPage.getByRole('dialog');
    await expect(modal.locator('.p-dropdown-label').filter({ hasText: KNOWN_ERP_WAREHOUSE })).toBeVisible();
    await expect(modal.locator('.p-dropdown-label').getByText('A', { exact: true })).toBeVisible();
    await sc.closeWarehouseGradingModal();

    await sc.deleteWarehouseGradingRow('WB-BAFUA');
  });
});
