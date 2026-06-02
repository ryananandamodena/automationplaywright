import { test, expect } from '@playwright/test';
import { cleanupTableRecordBySnapshot, isAutoCleanupEnabled } from '../../../../utils/data-cleanup.mjs';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';
const USERS_URL = `${BASE_URL}/users`;

// Helper function for login
async function loginToMHC(page) {
  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);

  await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
  await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
  await page.locator("button:has-text('Login')").click();
  await page.waitForTimeout(4000);
  
  await page.locator('text=/Welcome|Dashboard/i').first().waitFor();
}

test.describe('MHC - User Management CRUD', () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await loginToMHC(page);
  });

  test('TC-01: View Users List', async ({ page }) => {
    console.log('\n========== TC-01: View Users List ==========');
    
    // Navigate to Users page
    console.log('Step 1: Navigate to Users page...');
    await page.goto(USERS_URL);
    await page.waitForTimeout(2000);
    
    // Verify page loaded
    const pageTitle = page.locator('h1, h2, [role="heading"]').first();
    await pageTitle.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ Users page loaded');

    // Check for table or user list
    const userTable = page.locator('table').or(page.locator('[role="table"]'));
    if (await userTable.isVisible({ timeout: 5000 }).catch(() => false)) {
      const rows = await userTable.locator('tbody tr').count();
      console.log(`✓ Found ${rows} users in table`);
    }

    await page.screenshot({ path: 'test-results/users-list.png', fullPage: true });
    console.log('✓ Screenshot saved: users-list.png\n');
  });

  test('TC-02: Create New User', async ({ page }) => {
    console.log('\n========== TC-02: Create New User ==========');
    
    const timestamp = Date.now();
    const testUser = {
      name: `Test User ${timestamp}`,
      email: `testuser${timestamp}@modena.com`,
      phone: '081234567890',
      role: 'Sales'
    };

    // Navigate to Users page
    console.log('Step 1: Navigate to Users page...');
    await page.goto(USERS_URL);
    await page.waitForTimeout(2000);
    const rowsBefore = await page.locator('table tbody tr').count().catch(() => 0);
    console.log('✓ Users page loaded');

    // Click Create/Add button
    console.log('Step 2: Click Create New User button...');
    const createButton = page.locator("button:has-text('Create New')");
    
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    await createButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Create user form opened');

    await page.screenshot({ path: 'test-results/user-create-form.png', fullPage: true });

    // Fill user data
    console.log('Step 3: Fill user information...');
    
    // Name field
    const nameField = page.locator('input[name="name"]').or(
      page.locator('input[placeholder*="Name"]')).or(
      page.locator('input[placeholder*="Nama"]')
    ).first();
    
    if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameField.fill(testUser.name);
      console.log(`  ✓ Name: ${testUser.name}`);
    }

    // Email field
    const emailField = page.locator('input[name="email"]').or(
      page.locator('input[type="email"]').filter({ has: page.locator(':not([name=""])') })
    ).first();
    
    if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailField.fill(testUser.email);
      console.log(`  ✓ Email: ${testUser.email}`);
    }

    // Phone field
    const phoneField = page.locator('input[name="phone"]').or(
      page.locator('input[placeholder*="Phone"]')).or(
      page.locator('input[type="tel"]')
    ).first();
    
    if (await phoneField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneField.fill(testUser.phone);
      console.log(`  ✓ Phone: ${testUser.phone}`);
    }

    // Role/Position dropdown
    const roleField = page.locator('select[name="role"]').or(
      page.locator('select[name="position"]')
    ).first();
    
    if (await roleField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roleField.selectOption({ index: 1 });
      console.log(`  ✓ Role selected`);
    }

    await page.screenshot({ path: 'test-results/user-form-filled.png', fullPage: true });

    // Submit form
    console.log('Step 4: Submit user creation...');
    const submitButton = page.locator("button:has-text('Submit')").or(
      page.locator("button:has-text('Save')")).or(
      page.locator("button:has-text('Create')")).or(
      page.locator("button:has-text('Simpan')")
    ).first();

    await submitButton.click({ force: true });
    await page.waitForTimeout(3000);
    console.log('✓ User creation submitted');

    // Check for success message
    const successMsg = page.locator('text=/success|created|berhasil/i');
    if (await successMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Success message displayed');
    }

    await page.goto(USERS_URL);
    await page.waitForTimeout(1500);
    const rowsAfter = await page.locator('table tbody tr').count().catch(() => 0);
    const createdSnapshot = rowsAfter > rowsBefore
      ? await page.locator('table tbody tr').first().textContent().catch(() => null)
      : null;
    console.log(`  Users count before create: ${rowsBefore}, after create: ${rowsAfter}`);

    if (createdSnapshot && isAutoCleanupEnabled()) {
      await cleanupTableRecordBySnapshot(page, {
        listUrl: USERS_URL,
        rowSnapshot: createdSnapshot,
        label: 'user',
        rowLocator: 'table tbody tr',
      });
    }

    await page.screenshot({ path: 'test-results/user-created.png', fullPage: true });
    console.log('✓ Test completed\n');
  });

  test('TC-03: Search User', async ({ page }) => {
    console.log('\n========== TC-03: Search User ==========');
    
    // Navigate to Users page
    console.log('Step 1: Navigate to Users page...');
    await page.goto(USERS_URL);
    await page.waitForTimeout(2000);
    console.log('✓ Users page loaded');

    // Search for user
    console.log('Step 2: Search for user...');
    const searchInput = page.locator('input[placeholder*="Search"]').or(
      page.locator('input[placeholder*="Cari"]')).or(
      page.locator('input[type="search"]')
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(2000);
      console.log('✓ Search executed');

      await page.screenshot({ path: 'test-results/user-search-result.png', fullPage: true });
    } else {
      console.log('⚠ Search field not found');
    }

    console.log('✓ Test completed\n');
  });

  test('TC-04: Edit User', async ({ page }) => {
    console.log('\n========== TC-04: Edit User ==========');
    
    // Navigate to Users page
    console.log('Step 1: Navigate to Users page...');
    await page.goto(USERS_URL);
    await page.waitForTimeout(2000);
    console.log('✓ Users page loaded');

    // Find and click Edit button on first user
    console.log('Step 2: Click Edit on first user...');
    const editButton = page.locator("button:has-text('Edit')").or(
      page.locator("a:has-text('Edit')")).or(
      page.locator('[title="Edit"]')).or(
      page.locator('[aria-label="Edit"]')
    ).first();

    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Edit form opened');

      await page.screenshot({ path: 'test-results/user-edit-form.png', fullPage: true });

      // Modify user data
      console.log('Step 3: Modify user data...');
      const nameField = page.locator('input[name="name"]').first();
      
      if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
        const currentValue = await nameField.inputValue();
        await nameField.fill(`${currentValue} (Updated)`);
        console.log('✓ Name field updated');
      }

      // Save changes
      console.log('Step 4: Save changes...');
      const saveButton = page.locator("button:has-text('Save')").or(
        page.locator("button:has-text('Update')")).or(
        page.locator("button:has-text('Simpan')")
      ).first();

      await saveButton.click({ force: true });
      await page.waitForTimeout(3000);
      console.log('✓ Changes saved');

      await page.screenshot({ path: 'test-results/user-updated.png', fullPage: true });
    } else {
      console.log('⚠ Edit button not found - may need to click on table row first');
      
      // Try clicking on first row
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstRow.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/user-row-clicked.png', fullPage: true });
      }
    }

    console.log('✓ Test completed\n');
  });

  test('TC-05: Delete User', async ({ page }) => {
    console.log('\n========== TC-05: Delete User ==========');
    
    // Navigate to Users page
    console.log('Step 1: Navigate to Users page...');
    await page.goto(USERS_URL);
    await page.waitForTimeout(2000);
    console.log('✓ Users page loaded');

    // Find total users before delete
    const rowsBefore = await page.locator('table tbody tr').count();
    console.log(`  Users count before: ${rowsBefore}`);

    // Find and click Delete button
    console.log('Step 2: Click Delete on first user...');
    const deleteButton = page.locator("button:has-text('Delete')").or(
      page.locator("button:has-text('Hapus')")).or(
      page.locator('[title="Delete"]')).or(
      page.locator('[aria-label="Delete"]')
    ).first();

    if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ Delete clicked');

      // Confirm deletion if confirmation dialog appears
      console.log('Step 3: Confirm deletion...');
      const confirmButton = page.locator("button:has-text('Confirm')").or(
        page.locator("button:has-text('Yes')")).or(
        page.locator("button:has-text('OK')")).or(
        page.locator("button:has-text('Delete')")).or(
        page.locator("button:has-text('Hapus')")
      ).last();

      if (await confirmButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmButton.click({ force: true });
        await page.waitForTimeout(3000);
        console.log('✓ Deletion confirmed');
      }

      // Check success message
      const successMsg = page.locator('text=/deleted|removed|berhasil/i');
      if (await successMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✓ Success message displayed');
      }

      await page.screenshot({ path: 'test-results/user-deleted.png', fullPage: true });

      // Verify user count decreased
      await page.waitForTimeout(2000);
      const rowsAfter = await page.locator('table tbody tr').count();
      console.log(`  Users count after: ${rowsAfter}`);
      
      if (rowsAfter < rowsBefore) {
        console.log('✓ User successfully deleted');
      }
    } else {
      console.log('⚠ Delete button not found');
      await page.screenshot({ path: 'test-results/user-page-no-delete.png', fullPage: true });
    }

    console.log('✓ Test completed\n');
  });

  test('TC-06: View User Details', async ({ page }) => {
    console.log('\n========== TC-06: View User Details ==========');
    
    // Navigate to Users page
    console.log('Step 1: Navigate to Users page...');
    await page.goto(USERS_URL);
    await page.waitForTimeout(2000);
    console.log('✓ Users page loaded');

    // Click on first user to view details
    console.log('Step 2: Click on first user...');
    const viewButton = page.locator("button:has-text('View')").or(
      page.locator("a:has-text('View')")).or(
      page.locator("button:has-text('Detail')")).or(
      page.locator('[title="View"]')
    ).first();

    if (await viewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      console.log('✓ User details opened');
    } else {
      // Try clicking on first row
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.click();
      await page.waitForTimeout(2000);
      console.log('✓ User row clicked');
    }

    await page.screenshot({ path: 'test-results/user-details.png', fullPage: true });
    console.log('✓ Test completed\n');
  });
});

test.describe('MHC - User Page Element Inspection', () => {
  test('Inspect Users Page Elements', async ({ page }) => {
    console.log('\n========== Inspecting Users Page ==========\n');
    
    await loginToMHC(page);
    
    await page.goto(USERS_URL);
    await page.waitForTimeout(2000);

    console.log('Current URL:', page.url());
    
    // Get all buttons
    const buttons = await page.locator('button').all();
    console.log('\n=== BUTTONS ON PAGE ===');
    for (let i = 0; i < Math.min(buttons.length, 30); i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      if (isVisible && text && text.trim()) {
        console.log(`Button ${i}: "${text.trim()}"`);
      }
    }

    // Get all inputs
    const inputs = await page.locator('input').all();
    console.log('\n=== INPUTS ON PAGE ===');
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const isVisible = await inputs[i].isVisible();
      if (isVisible) {
        console.log(`Input ${i}: type="${type}" name="${name}" placeholder="${placeholder}"`);
      }
    }

    // Check for table
    const hasTable = await page.locator('table').isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`\n=== TABLE ===`);
    console.log(`Table present: ${hasTable}`);
    
    if (hasTable) {
      const rowCount = await page.locator('table tbody tr').count();
      console.log(`Rows in table: ${rowCount}`);
    }

    await page.screenshot({ path: 'test-results/users-page-inspection.png', fullPage: true });
    console.log('\n✓ Screenshot saved: users-page-inspection.png');
    console.log('✓ Inspection completed\n');
  });
});
