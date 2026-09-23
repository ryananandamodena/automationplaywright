import { test, expect } from '../fixtures/authFixture';
import { MatrixApprovalPage } from '../pages/MatrixApprovalPage';

test.describe('Matrix Approval CRUD', () => {
  test('Create Matrix Approval with valid data succeeds', async ({ loggedInPage }) => {
    const matrixPage = new MatrixApprovalPage(loggedInPage);
    await matrixPage.goto();
    
    const uniqueId = Date.now().toString().slice(-4);
    const data = {
      nama: `Test Approver ${uniqueId}`,
      jabatan: 'Service Operation Lead',
      email: `test.approver${uniqueId}@modena.com`,
      isActive: true, // Default
    };

    await matrixPage.createMatrixApproval(data);
    await matrixPage.expectToastSuccess();
    
    // Verify it appears in search
    await matrixPage.search(data.nama);
    await expect(matrixPage.rowByText(data.nama)).toBeVisible();
  });

  test('Create Matrix Approval with empty required fields shows validation', async ({ loggedInPage }) => {
    const matrixPage = new MatrixApprovalPage(loggedInPage);
    await matrixPage.goto();
    await matrixPage.openAddModal();
    
    await matrixPage.fillForm({ nama: '', jabatan: '', email: '' });
    await matrixPage.submitCreate();
    
    // Depending on the exact validation message behavior (e.g. "Name is required")
    // Expect some validation error text to be visible
    await expect(loggedInPage.locator('.p-error').first()).toBeVisible({ timeout: 3000 });
  });

  test('Search with no match shows empty state', async ({ loggedInPage }) => {
    const matrixPage = new MatrixApprovalPage(loggedInPage);
    await matrixPage.goto();
    await matrixPage.search('ZZZ-NO-MATCH-ZZZ');
    await expect(loggedInPage.getByText(/no data|no results|showed 0/i)).toBeVisible();
  });

  test('Cancel on create does not persist data', async ({ loggedInPage }) => {
    const matrixPage = new MatrixApprovalPage(loggedInPage);
    await matrixPage.goto();
    const before = await matrixPage.totalRowsText();
    
    await matrixPage.openAddModal();
    await matrixPage.fillForm({ nama: 'Cancel Test', jabatan: 'Cancel Job', email: 'cancel@example.com' });
    await matrixPage.cancel();
    
    const after = await matrixPage.totalRowsText();
    expect(after).toBe(before);
  });

  test('Edit an existing Matrix Approval', async ({ loggedInPage }) => {
    const matrixPage = new MatrixApprovalPage(loggedInPage);
    await matrixPage.goto();
    
    const uniqueId = Date.now().toString().slice(-4);
    const data = {
      nama: `Approver Edit ${uniqueId}`,
      jabatan: 'Operation',
      email: `edit${uniqueId}@modena.com`
    };

    // Create a record first
    await matrixPage.createMatrixApproval(data);
    await matrixPage.expectToastSuccess();
    
    // Edit the record
    await matrixPage.search(data.nama);
    await matrixPage.editRow(data.nama);
    const newJabatan = 'Senior Operation';
    await matrixPage.fillForm({ jabatan: newJabatan });
    await matrixPage.submitUpdate();
    
    await matrixPage.expectToastSuccess();
    await matrixPage.search(data.nama);
    await expect(matrixPage.rowByText(newJabatan)).toBeVisible();
  });

  test('Delete a Matrix Approval shows confirmation and removes row', async ({ loggedInPage }) => {
    const matrixPage = new MatrixApprovalPage(loggedInPage);
    await matrixPage.goto();
    
    const uniqueId = Date.now().toString().slice(-4);
    const data = {
      nama: `Approver Delete ${uniqueId}`,
      jabatan: 'ToDelete',
      email: `delete${uniqueId}@modena.com`
    };

    // Create a record first
    await matrixPage.createMatrixApproval(data);
    await matrixPage.expectToastSuccess();
    
    // Delete the record
    await matrixPage.search(data.nama);
    await matrixPage.deleteRow(data.nama);
    await matrixPage.confirmDialog();
    await matrixPage.expectToastSuccess();
    
    await matrixPage.search(data.nama);
    await expect(matrixPage.rowByText(data.nama)).toHaveCount(0);
  });

  test('Create with invalid email format shows validation', async ({ loggedInPage }) => {
    const matrixPage = new MatrixApprovalPage(loggedInPage);
    await matrixPage.goto();
    await matrixPage.openAddModal();
    
    // Fill all fields but with invalid email
    await matrixPage.fillForm({ 
      nama: 'Test Invalid Email', 
      jabatan: 'Staff', 
      email: 'not-an-email' 
    });
    
    // Attempt to submit
    await matrixPage.submitCreate();
    
    // HTML5 native validation or PrimeReact validation blocks it
    // Check if error message is visible or if form is still open
    // Assuming a .p-error appears, or the modal simply remains open
    await expect(matrixPage.page.locator('.p-error').first().or(matrixPage.page.locator('input:invalid').first())).toBeVisible({ timeout: 3000 }).catch(async () => {
        // Fallback: If no explicit error, ensure the modal is still open (meaning it was rejected client-side)
        await expect(matrixPage.page.getByRole('button', { name: 'CREATE' })).toBeVisible();
    });
  });

  test('HTML/Script injection is safely escaped and does not execute', async ({ loggedInPage }) => {
    const matrixPage = new MatrixApprovalPage(loggedInPage);
    let alertFired = false;
    loggedInPage.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    await matrixPage.goto();
    await matrixPage.openAddModal();
    await matrixPage.fillForm({
      nama: `<script>alert(1)</script>`,
      jabatan: 'Hacker',
      email: 'hacker@modena.com'
    });
    await matrixPage.submitCreate();

    // Wait 2s to give any injected script time to execute if it were going to
    await loggedInPage.waitForTimeout(2000);

    // Core assertion: XSS must NOT execute regardless of whether the server
    // accepted (escaped) or rejected (blocked) the payload.
    expect(alertFired, 'XSS payload must not execute').toBeFalsy();

    // Dismiss any lingering dialogs/modals (e.g. "Are you sure?" that wasn't handled)
    await loggedInPage.keyboard.press('Escape');
    await loggedInPage.waitForTimeout(500);

    // Wait until no dialog overlay is blocking the page
    await loggedInPage.locator('.p-dialog-mask').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // If toast appeared, a row was created — clean it up
    const toastVisible = await loggedInPage
      .locator('.p-toast-message-success, .p-toast-message')
      .first()
      .isVisible()
      .catch(() => false);

    if (toastVisible) {
      await matrixPage.search('<script>alert(1)</script>');
      const rowExists = await matrixPage.rowByText('<script>alert(1)</script>').isVisible().catch(() => false);
      if (rowExists) {
        await matrixPage.deleteRow('<script>alert(1)</script>');
        await matrixPage.confirmDialog();
      }
    }
  });
});
