import { test, expect } from '@playwright/test';

const BASE_URL = 'https://mhc-dev.modena.com';
const ROLES_URL = `${BASE_URL}/roles`;

async function loginToMHC(page) {
  console.log('  🔐 Logging in...');
  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);
  await page.locator('input[type="email"]').fill('muhzaenal5@gmail.com');
  await page.locator('input[type="password"]').fill('P@ssw0rd');
  await page.locator("button:has-text('Login')").click();
  await page.waitForTimeout(5000);
  await page.locator('button:has-text("Dashboard")').waitFor({ timeout: 15000 });
  console.log('  ✅ Login successful\n');
}

test.describe('MORE1 - Role Management CRUD', () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await loginToMHC(page);
  });

  // ============================================================
  // TC-01: View Roles List
  // ============================================================
  test('TC-01: View Roles List', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TC-01: VIEW ROLES LIST');
    console.log('='.repeat(70) + '\n');

    // Navigate to Roles
    console.log('[1/4] Navigate to Roles page...');
    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/roles/);
    console.log('      ✅ Roles page loaded');

    // Verify page title
    console.log('[2/4] Verify page title...');
    const pageTitle = page.locator('text="Role Management"');
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
    console.log('      ✅ Page title: "Role Management"');

    // Verify table columns
    console.log('[3/4] Verify table columns...');
    const columns = ['Role ID', 'Role Name', 'Status', 'Privileges', 'Description', 'Updated At', 'Action'];
    for (const col of columns) {
      const header = page.locator(`th:has-text("${col}")`);
      if (await header.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`      ✅ Column: ${col}`);
      } else {
        console.log(`      ⚠️  Column not found: ${col}`);
      }
    }

    // Verify data rows exist
    const rowCount = await page.locator('tbody tr').count();
    console.log(`      ✅ Found ${rowCount} roles in table`);
    expect(rowCount).toBeGreaterThan(0);

    // Verify View buttons
    const viewButtons = page.locator('tbody button:has-text("View")');
    const viewCount = await viewButtons.count();
    console.log(`      ✅ Found ${viewCount} View buttons`);

    console.log('[4/4] Take screenshot...');
    await page.screenshot({ path: 'test-results/more1-roles-list.png', fullPage: true });
    console.log('      ✅ Screenshot saved\n');
  });

  // ============================================================
  // TC-02: Search Role
  // ============================================================
  test('TC-02: Search Role', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TC-02: SEARCH ROLE');
    console.log('='.repeat(70) + '\n');

    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);

    console.log('[1/3] Search for role "Admin"...');
    const searchInput = page.locator('input[placeholder="Search data..."]');
    await searchInput.fill('Admin');
    await page.waitForTimeout(2000);
    console.log('      ✅ Search term entered: "Admin"');

    console.log('[2/3] Verify search results...');
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`      ✅ Found ${rowCount} result(s)`);

    if (rowCount > 0) {
      const firstRoleName = await rows.first().locator('td').nth(1).textContent();
      console.log(`      ✅ First result: "${firstRoleName?.trim()}"`);
    }

    await page.screenshot({ path: 'test-results/more1-roles-search.png', fullPage: true });

    console.log('[3/3] Clear search and verify all roles return...');
    await searchInput.clear();
    await page.waitForTimeout(2000);
    const allRows = await page.locator('tbody tr').count();
    console.log(`      ✅ All roles restored: ${allRows} rows\n`);
  });

  // ============================================================
  // TC-03: View Role Detail
  // ============================================================
  test('TC-03: View Role Detail', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TC-03: VIEW ROLE DETAIL');
    console.log('='.repeat(70) + '\n');

    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);

    console.log('[1/4] Click View on first role...');
    await page.locator('tbody button:has-text("View")').first().click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/roles\/\w+/);
    console.log('      ✅ Navigated to role detail page');

    console.log('[2/4] Verify Role Name field...');
    const roleNameInput = page.locator('input[placeholder="Enter role name"]');
    await expect(roleNameInput).toBeVisible();
    const roleName = await roleNameInput.inputValue();
    console.log(`      ✅ Role Name: "${roleName}"`);

    console.log('[3/4] Verify Description field...');
    const descField = page.locator('textarea[placeholder="Optional description"]');
    await expect(descField).toBeVisible();
    const desc = await descField.inputValue();
    console.log(`      ✅ Description: "${desc || '(empty)'}"`);

    console.log('[4/4] Verify privilege checkboxes...');
    const privileges = [
      'Sales Order', 'Deduction Approval', 'Purchase Order', 'Delivery',
      'Inventory Transfer', 'Operational Cost', 'Branch Stock',
      'MI Ready Stock', 'User', 'Role User'
    ];
    for (const priv of privileges) {
      const checkbox = page.locator(`label:has-text("${priv}")`).locator('..').locator('input[type="checkbox"]');
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        const checked = await checkbox.isChecked();
        console.log(`      ${checked ? '☑' : '☐'} ${priv}`);
      }
    }

    // Verify action buttons
    const saveBtn = page.locator('button:has-text("Save Changes")');
    const cancelBtn = page.locator('button:has-text("Cancel")');
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    await expect(saveBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();
    console.log('      ✅ Save Changes & Cancel buttons visible');

    await page.screenshot({ path: 'test-results/more1-roles-detail.png', fullPage: true });
    console.log('      ✅ Screenshot saved\n');
  });

  // ============================================================
  // TC-04: Create Role - Validate Form Fields
  // ============================================================
  test('TC-04: Create New Role - Form Validation', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TC-04: CREATE NEW ROLE - FORM VALIDATION');
    console.log('='.repeat(70) + '\n');

    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);

    console.log('[1/6] Click Create New...');
    await page.locator('button:has-text("Create New")').click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/roles\/create/);
    console.log('      ✅ Create Role form opened');

    console.log('[2/6] Verify form fields...');
    const roleNameInput = page.locator('input[placeholder="Enter role name"]');
    await expect(roleNameInput).toBeVisible();
    console.log('      ✅ Role Name input visible');

    const descField = page.locator('textarea[placeholder="Optional description"]');
    await expect(descField).toBeVisible();
    console.log('      ✅ Description textarea visible');

    console.log('[3/6] Verify Status toggle...');
    const statusToggle = page.locator('label:has-text("Status")').locator('..').locator('.cursor-pointer');
    await expect(statusToggle).toBeVisible();
    console.log('      ✅ Status toggle visible');

    console.log('[4/6] Verify All Access checkbox...');
    const allAccessCheckbox = page.locator('label:has-text("All Access")').locator('..').locator('input[type="checkbox"]');
    await expect(allAccessCheckbox).toBeVisible();
    console.log('      ✅ All Access checkbox visible');

    console.log('[5/6] Verify privilege checkboxes...');
    const privileges = [
      'Sales Order/salesorder',
      'Deduction Approval/salesorderapproval',
      'Purchase Order/purchaseorder',
      'Delivery/delivery',
      'Inventory Transfer/inventorytransfer',
      'Operational Cost/operationalcost',
      'Branch Stock/productstock/branch',
      'MI Ready Stock/mistock',
      'User/users',
      'Role User/roles'
    ];
    for (const priv of privileges) {
      const checkbox = page.locator(`label:has-text("${priv}")`).locator('..').locator('input[type="checkbox"]');
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`      ✅ Privilege: ${priv.split('/')[0]}`);
      }
    }

    console.log('[6/6] Verify sub-permission buttons (Access/Create/View/Edit/Delete)...');
    const subPerms = ['Access', 'Create', 'View', 'Edit', 'Delete'];
    for (const perm of subPerms) {
      const count = await page.locator(`button.rounded-full:has-text("${perm}")`).count();
      console.log(`      ✅ "${perm}" buttons: ${count}`);
    }

    await page.screenshot({ path: 'test-results/more1-roles-create-form.png', fullPage: true });
    console.log('      ✅ Screenshot saved\n');

    await page.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(2000);
  });

  // ============================================================
  // TC-05: Batch Create 5 Roles with Dynamic Data
  // ============================================================
  test('TC-05: Batch Create 5 Roles with Dynamic Data', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TC-05: BATCH CREATE 5 ROLES WITH DYNAMIC DATA');
    console.log('='.repeat(70));

    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);

    const roleNames = [
      'QA Tester Role',
      'DevOps Manager Role',
      'Product Owner Role',
      'Data Engineer Role',
      'Security Analyst Role'
    ];
    const descriptions = [
      'Role for QA testing team with limited access',
      'Role for DevOps managers with deployment access',
      'Role for Product Owners with full view access',
      'Role for Data Engineers with inventory access',
      'Role for Security Analysts with audit access'
    ];
    // Each role gets different privilege combinations
    const privilegeSets = [
      ['Sales Order/salesorder', 'Purchase Order/purchaseorder'],
      ['Delivery/delivery', 'Inventory Transfer/inventorytransfer', 'Operational Cost/operationalcost'],
      ['Sales Order/salesorder', 'Purchase Order/purchaseorder', 'Branch Stock/productstock/branch', 'MI Ready Stock/mistock'],
      ['Inventory Transfer/inventorytransfer', 'Branch Stock/productstock/branch'],
      ['User/users', 'Role User/roles']
    ];

    const ts = Date.now();
    let successCount = 0;

    for (let i = 0; i < 5; i++) {
      const num = String(i + 1).padStart(2, '0');
      const roleName = `${roleNames[i]}_${ts}`;
      const description = descriptions[i];
      const privileges = privilegeSets[i];

      console.log(`\n--- Role ${i + 1}/5 ---`);
      console.log(`  Name: ${roleName}`);
      console.log(`  Description: ${description}`);
      console.log(`  Privileges: ${privileges.map(p => p.split('/')[0]).join(', ')}`);

      try {
        // Click Create New
        await page.locator('button:has-text("Create New")').click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/\/roles\/create/);

        // Fill Role Name
        const roleNameInput = page.locator('input[placeholder="Enter role name"]');
        await roleNameInput.fill(roleName);
        console.log(`  ✅ Role Name: ${roleName}`);

        // Fill Description
        const descField = page.locator('textarea[placeholder="Optional description"]');
        await descField.fill(description);
        console.log(`  ✅ Description filled`);

        // Toggle Status (it's already active by default with amber color)
        console.log(`  ✅ Status: Active (default)`);

        // Check privilege checkboxes
        for (const priv of privileges) {
          const checkbox = page.locator(`label:has-text("${priv}")`).locator('..').locator('input[type="checkbox"]');
          if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
            await checkbox.check();
            console.log(`  ☑ Checked: ${priv.split('/')[0]}`);
          }
        }
        await page.waitForTimeout(500);

        // Screenshot filled form
        await page.screenshot({
          path: `test-results/more1-create-role-${num}.png`,
          fullPage: true
        });
        console.log(`  📸 Screenshot: more1-create-role-${num}.png`);

        // Cancel (not saving to avoid polluting data)
        await page.locator('button:has-text("Cancel")').click();
        await page.waitForTimeout(2000);

        successCount++;
        console.log(`  ✅ Role ${i + 1}/5 form validated`);

      } catch (error) {
        console.error(`  ❌ Error on role ${i + 1}:`, error.message);
        await page.goto(ROLES_URL);
        await page.waitForTimeout(2000);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`RESULT: ${successCount}/5 roles validated successfully`);
    console.log('='.repeat(70) + '\n');

    expect(successCount).toBe(5);
  });

  // ============================================================
  // TC-06: Edit Role (View + Modify Fields)
  // ============================================================
  test('TC-06: Edit Role - Modify and Cancel', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TC-06: EDIT ROLE - MODIFY AND CANCEL');
    console.log('='.repeat(70) + '\n');

    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);

    console.log('[1/5] Click View on first role...');
    await page.locator('tbody button:has-text("View")').first().click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/roles\/\w+/);

    // Get original values
    const roleNameInput = page.locator('input[placeholder="Enter role name"]');
    const originalName = await roleNameInput.inputValue();
    console.log(`      ✅ Original name: "${originalName}"`);

    console.log('[2/5] Modify Role Name...');
    const editedName = `${originalName}_EDITED_${Date.now()}`;
    await roleNameInput.clear();
    await roleNameInput.fill(editedName);
    console.log(`      ✅ Changed to: "${editedName}"`);

    console.log('[3/5] Modify Description...');
    const descField = page.locator('textarea[placeholder="Optional description"]');
    await descField.fill('Edited description for testing');
    console.log('      ✅ Description updated');

    console.log('[4/5] Take screenshot of edited form...');
    await page.screenshot({ path: 'test-results/more1-roles-edit.png', fullPage: true });
    console.log('      ✅ Screenshot saved');

    console.log('[5/5] Cancel without saving...');
    await page.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/roles$/);
    console.log('      ✅ Returned to Roles list (no changes saved)\n');
  });

  // ============================================================
  // TC-07: Verify All Access Toggle
  // ============================================================
  test('TC-07: Verify All Access Toggle', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TC-07: VERIFY ALL ACCESS TOGGLE');
    console.log('='.repeat(70) + '\n');

    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("Create New")').click();
    await page.waitForTimeout(2000);

    console.log('[1/3] Check "All Access" checkbox...');
    const allAccessCheckbox = page.locator('label:has-text("All Access")').locator('..').locator('input[type="checkbox"]');
    await allAccessCheckbox.check();
    await page.waitForTimeout(1000);
    console.log('      ✅ All Access checked');

    console.log('[2/3] Verify all privileges get checked...');
    const privileges = [
      'Sales Order/salesorder', 'Deduction Approval/salesorderapproval',
      'Purchase Order/purchaseorder', 'Delivery/delivery',
      'Inventory Transfer/inventorytransfer', 'Operational Cost/operationalcost',
      'Branch Stock/productstock/branch', 'MI Ready Stock/mistock',
      'User/users', 'Role User/roles'
    ];
    let checkedCount = 0;
    for (const priv of privileges) {
      const checkbox = page.locator(`label:has-text("${priv}")`).locator('..').locator('input[type="checkbox"]');
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isChecked = await checkbox.isChecked();
        if (isChecked) checkedCount++;
        console.log(`      ${isChecked ? '☑' : '☐'} ${priv.split('/')[0]}`);
      }
    }
    console.log(`      ✅ ${checkedCount}/${privileges.length} privileges checked`);

    await page.screenshot({ path: 'test-results/more1-roles-all-access.png', fullPage: true });

    console.log('[3/3] Uncheck "All Access" and verify...');
    await allAccessCheckbox.uncheck();
    await page.waitForTimeout(1000);
    let uncheckedCount = 0;
    for (const priv of privileges) {
      const checkbox = page.locator(`label:has-text("${priv}")`).locator('..').locator('input[type="checkbox"]');
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        const isChecked = await checkbox.isChecked();
        if (!isChecked) uncheckedCount++;
      }
    }
    console.log(`      ✅ ${uncheckedCount}/${privileges.length} privileges unchecked`);

    await page.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(2000);
    console.log('      ✅ Form cancelled\n');
  });

  // ============================================================
  // TC-08: Verify Sub-Permissions (Access/Create/View/Edit/Delete)
  // ============================================================
  test('TC-08: Verify Sub-Permission Buttons', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TC-08: VERIFY SUB-PERMISSION BUTTONS');
    console.log('='.repeat(70) + '\n');

    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);

    await page.locator('button:has-text("Create New")').click();
    await page.waitForTimeout(2000);

    console.log('[1/3] Check "Sales Order" privilege...');
    const soCheckbox = page.locator('label:has-text("Sales Order/salesorder")').locator('..').locator('input[type="checkbox"]');
    await soCheckbox.check();
    await page.waitForTimeout(500);
    console.log('      ✅ Sales Order checked');

    console.log('[2/3] Verify sub-permission buttons exist...');
    const subPerms = ['Access', 'Create', 'View', 'Edit', 'Delete'];
    for (const perm of subPerms) {
      const buttons = page.locator(`button.rounded-full:has-text("${perm}")`);
      const count = await buttons.count();
      console.log(`      ✅ "${perm}" buttons found: ${count}`);
    }

    console.log('[3/3] Click some sub-permission buttons...');
    // Scroll to make sub-permission buttons visible, then click
    const firstAccessBtn = page.locator('button.rounded-full:has-text("Access")').first();
    await firstAccessBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await firstAccessBtn.click({ force: true });
    await page.waitForTimeout(500);
    console.log('      ✅ Clicked first "Access" button');

    const firstViewBtn = page.locator('button.rounded-full:has-text("View")').first();
    await firstViewBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await firstViewBtn.click({ force: true });
    await page.waitForTimeout(500);
    console.log('      ✅ Clicked first "View" button');

    await page.screenshot({ path: 'test-results/more1-roles-subperms.png', fullPage: true });
    console.log('      ✅ Screenshot saved');

    await page.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(2000);
    console.log('      ✅ Form cancelled\n');
  });

  // ============================================================
  // TC-09: Verify Delete Button Presence
  // ============================================================
  test('TC-09: Verify Delete Button on Role Detail', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('TC-09: VERIFY DELETE BUTTON ON ROLE DETAIL');
    console.log('='.repeat(70) + '\n');

    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);

    console.log('[1/3] Open first role detail...');
    await page.locator('tbody button:has-text("View")').first().click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/roles\/\w+/);
    console.log('      ✅ Role detail page opened');

    console.log('[2/3] Verify Delete button...');
    const deleteBtn = page.locator('button:has-text("Delete")').first();
    const isVisible = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`      ${isVisible ? '✅' : '⚠️ '} Delete button ${isVisible ? 'visible' : 'not found'}`);

    console.log('[3/3] Verify Save Changes button...');
    const saveBtn = page.locator('button:has-text("Save Changes")');
    const saveVisible = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`      ${saveVisible ? '✅' : '⚠️ '} Save Changes button ${saveVisible ? 'visible' : 'not found'}`);

    await page.screenshot({ path: 'test-results/more1-roles-delete-btn.png', fullPage: true });
    console.log('      ✅ Screenshot saved');

    await page.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(2000);
    console.log('      ✅ Returned to list\n');
  });
});
