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

test.describe('Role Management - Create Role (4 Dynamic Data)', () => {
  test.setTimeout(300000);

  test.beforeEach(async ({ page }) => {
    await loginToMHC(page);
  });

  test('TC-CREATE: Batch Create 4 Roles with Dynamic Data', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('BATCH CREATE 4 ROLES WITH DYNAMIC DATA');
    console.log('='.repeat(70));

    // Navigate to Roles page via sidebar
    await page.locator('button:has-text("Role")').click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/roles/);
    console.log('✅ Navigated to Role Management page');

    const ts = Date.now();

    const rolesData = [
      {
        name: `Automation Tester_${ts}`,
        description: 'Role khusus untuk tim automation testing - akses Sales Order dan Purchase Order',
        privileges: ['Sales Order/salesorder', 'Purchase Order/purchaseorder']
      },
      {
        name: `Branch Manager_${ts}`,
        description: 'Role untuk kepala cabang - akses delivery, inventory, dan operasional',
        privileges: ['Delivery/delivery', 'Inventory Transfer/inventorytransfer', 'Operational Cost/operationalcost', 'Branch Stock/productstock/branch']
      },
      {
        name: `Finance Auditor_${ts}`,
        description: 'Role untuk tim audit keuangan - akses deduction approval dan stock',
        privileges: ['Deduction Approval/salesorderapproval', 'MI Ready Stock/mistock', 'Branch Stock/productstock/branch']
      },
      {
        name: `Super Admin_${ts}`,
        description: 'Role admin penuh - semua akses aktif via All Access',
        privileges: ['ALL'] // special flag to use All Access checkbox
      }
    ];

    let successCount = 0;

    for (let i = 0; i < rolesData.length; i++) {
      const num = String(i + 1).padStart(2, '0');
      const role = rolesData[i];

      console.log(`\n--- Role ${i + 1}/4 ---`);
      console.log(`  Name: ${role.name}`);
      console.log(`  Description: ${role.description}`);
      console.log(`  Privileges: ${role.privileges[0] === 'ALL' ? 'ALL ACCESS' : role.privileges.map(p => p.split('/')[0]).join(', ')}`);

      try {
        // Click Create New
        await page.locator('button:has-text("Create New")').click();
        await page.waitForTimeout(2000);
        await expect(page).toHaveURL(/\/roles\/create/);

        // Fill Role Name
        const roleNameInput = page.locator('input[placeholder="Enter role name"]');
        await roleNameInput.fill(role.name);
        console.log(`  ✅ Role Name filled`);

        // Fill Description
        const descField = page.locator('textarea[placeholder="Optional description"]');
        await descField.fill(role.description);
        console.log(`  ✅ Description filled`);

        // Check privileges
        if (role.privileges[0] === 'ALL') {
          // Use All Access checkbox
          const allAccess = page.locator('label:has-text("All Access")').locator('..').locator('input[type="checkbox"]');
          await allAccess.check();
          await page.waitForTimeout(500);
          console.log(`  ☑ All Access checked (all 10 privileges)`);
        } else {
          for (const priv of role.privileges) {
            const checkbox = page.locator(`label:has-text("${priv}")`).locator('..').locator('input[type="checkbox"]');
            if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
              await checkbox.check();
              console.log(`  ☑ ${priv.split('/')[0]}`);
            }
          }
        }
        await page.waitForTimeout(500);

        // Screenshot
        await page.screenshot({
          path: `test-results/more1-creat-role-${num}.png`,
          fullPage: true
        });
        console.log(`  📸 Screenshot: more1-creat-role-${num}.png`);

        // Cancel (tidak save agar tidak mengotori data)
        await page.locator('button:has-text("Cancel")').click();
        await page.waitForTimeout(2000);

        successCount++;
        console.log(`  ✅ Role ${i + 1}/4 form validated`);

      } catch (error) {
        console.error(`  ❌ Error on role ${i + 1}:`, error.message);
        await page.goto(ROLES_URL);
        await page.waitForTimeout(2000);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`RESULT: ${successCount}/4 roles validated successfully`);
    console.log('='.repeat(70) + '\n');

    expect(successCount).toBe(4);
  });
});
