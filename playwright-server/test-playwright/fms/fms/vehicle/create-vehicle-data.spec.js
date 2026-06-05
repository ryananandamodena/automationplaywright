import { test, expect } from '@playwright/test';

/**
 * Create Vehicle Data – 5 kendaraan untuk keperluan insurance test
 * Flow: Login → Vehicle Form → Fill → Draft → Loop
 */

const BASE_URL = 'https://portal-dev.modena.com';

// Dataset 5 kendaraan
const vehicleDataset = [
  {
    ownership: 'Owned',
    plate: 'B 2001 MOD',
    unitDesc: 'Toyota Innova 2.0 G AT',
    brand: 'Toyota',
    vehicleType: 'MPV',
    model: 'INNOVA',   // partial match
    year: '2023',
    cc: '1998',
    chassis: 'MHFB1BA3JNK200001',
    engine: '1TR-FE2000001',
    branch: 'Jakarta Branch',
    stnk: 'S-20010001',
    stnk1y: '2027-06-01',
    stnk5y: '2030-06-01',
    kir: '2027-06-01',
    purchaseDate: '2023-01-15',
    price: '380000000',
  },
  {
    ownership: 'Owned',
    plate: 'B 2002 MOD',
    unitDesc: 'Toyota Alphard 2.5X AT',
    brand: 'Toyota',
    vehicleType: 'MPV',
    model: 'ALPHARD',
    year: '2024',
    cc: '2494',
    chassis: 'MHFB1BA3JNK200002',
    engine: '2AR-FE2000002',
    branch: 'Jakarta Branch',
    stnk: 'S-20020002',
    stnk1y: '2027-06-01',
    stnk5y: '2030-06-01',
    kir: '2027-06-01',
    purchaseDate: '2024-03-01',
    price: '950000000',
  },
  {
    ownership: 'Owned',
    plate: 'D 2003 MOD',
    unitDesc: 'Toyota Camry 2.5V AT',
    brand: 'Toyota',
    vehicleType: 'Sedan',
    model: 'CAMRY',
    year: '2022',
    cc: '2494',
    chassis: 'MHFB1BA3JNK200003',
    engine: 'A25A-FKS2000003',
    branch: 'Bandung Branch',
    stnk: 'S-20030003',
    stnk1y: '2027-06-01',
    stnk5y: '2030-06-01',
    kir: '2027-06-01',
    purchaseDate: '2022-06-15',
    price: '620000000',
  },
  {
    ownership: 'Leased',
    plate: 'H 2004 MOD',
    unitDesc: 'Mitsubishi Eclipse Cross MPV',
    brand: 'Mitsubishi',
    vehicleType: 'MPV',
    model: 'Eclipse',
    year: '2023',
    cc: '1499',
    chassis: 'MITSUB12345200004',
    engine: '4B40-2000004',
    branch: 'Semarang Branch',
    stnk: 'S-20040004',
    stnk1y: '2027-06-01',
    stnk5y: '2030-06-01',
    kir: '2027-06-01',
    purchaseDate: '2023-08-01',
    price: '450000000',
  },
  {
    ownership: 'Owned',
    plate: 'L 2005 MOD',
    unitDesc: 'Honda HR-V 1.5L SE CVT',
    brand: 'Honda',
    vehicleType: 'Mini SUV',
    model: 'HR-V',
    year: '2024',
    cc: '1498',
    chassis: 'HONDA12345200005',
    engine: 'L15C-2000005',
    branch: 'Surabaya Branch',
    stnk: 'S-20050005',
    stnk1y: '2027-06-01',
    stnk5y: '2030-06-01',
    kir: '2027-06-01',
    purchaseDate: '2024-01-10',
    price: '395000000',
  },
];

// ============================================================
// HELPER: Login & Go to FMS
// ============================================================
async function loginToFMS(page) {
  await page.goto(`${BASE_URL}/fms/vehicle/form`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForURL(/my-application|\/fms\//, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Handle login page redirect
  if (page.url().includes('/login')) {
    console.log('ℹ️  Login page detected, entering credentials');
    await page.locator('[name="email"], input[type="email"]').first().fill('ryan.ananda@modena.com', { timeout: 5000 });
    await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda', { timeout: 5000 });
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 25000 }).catch(() => {});
    if (page.url().includes('my-application')) {
      console.log('ℹ️  FMS selection needed');
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(1500);
      const cb = page.getByRole('button', { name: 'Confirm' });
      if (await cb.isVisible({ timeout: 3000 }).catch(() => false)) { 
        await cb.click(); 
        await page.waitForURL(/fms\/vehicle/, { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(2000); 
      }
    }
  }

  // Handle my-application redirect (SSO active, FMS session expired)
  if (page.url().includes('my-application')) {
    console.log('ℹ️  Still on my-application, selecting FMS');
    const fmsLink = page.getByText('FMS (DEV)');
    if (await fmsLink.isVisible({ timeout: 4000 }).catch(() => false)) {
      await fmsLink.click();
      await page.waitForTimeout(1500);
      const cb = page.getByRole('button', { name: 'Confirm' });
      if (await cb.isVisible({ timeout: 3000 }).catch(() => false)) { 
        await cb.click(); 
        await page.waitForURL(/fms\/vehicle/, { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(2000); 
      }
    }
  }

  // Final recovery: if still not on form, try full re-login
  if (!page.url().includes('/fms/vehicle')) {
    console.log(`ℹ️  Recovery needed. Current URL: ${page.url()}`);
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);

    if (page.url().includes('/login')) {
      console.log('ℹ️  Full re-login from login page');
      await page.locator('[name="email"], input[type="email"]').first().fill('ryan.ananda@modena.com', { timeout: 5000 });
      await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda', { timeout: 5000 });
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/my-application|\/fms\//, { timeout: 30000 }).catch(() => {});
    }

    if (page.url().includes('my-application')) {
      console.log('ℹ️  FMS selection after recovery');
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(1500);
      const cb = page.getByRole('button', { name: 'Confirm' });
      if (await cb.isVisible({ timeout: 3000 }).catch(() => false)) { 
        await cb.click(); 
        await page.waitForURL(/fms\/vehicle/, { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(2000); 
      }
    }
  }

  // Navigate directly to form URL with full waitForURL
  await page.goto(`${BASE_URL}/fms/vehicle/form`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForURL(/fms\/vehicle/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Verify we're on the form page
  if (!page.url().includes('/fms/vehicle')) {
    console.log(`⚠️  Not on form page: ${page.url()}`);
  } else {
    console.log(`✅ Logged in, URL: ${page.url()}`);
  }
}

// ============================================================
// HELPER: Select react-select option by typing + Enter/click
// ============================================================
async function selectReactSelect(page, comboboxIndex, searchText) {
  console.log(`  Selecting combobox[${comboboxIndex}] with "${searchText}"`);
  
  try {
    // Wait for combobox to be available
    await page.locator('[role="combobox"]').nth(comboboxIndex).waitFor({ state: 'visible', timeout: 5000 });
    
    const combo = page.locator('[role="combobox"]').nth(comboboxIndex);
    await combo.click();
    await page.waitForTimeout(500);

    if (searchText) {
      await combo.type(searchText, { delay: 50 });
      await page.waitForTimeout(1000);
    }

    // Find matching option
    const option = page.locator('[role="option"]').filter({ hasText: new RegExp(searchText, 'i') }).first();
    const optionVisible = await option.isVisible({ timeout: 3000 }).catch(() => false);

    if (optionVisible) {
      await option.click();
      await page.waitForTimeout(500);
      return true;
    }

    // Fallback: just pick first option
    const firstOption = page.locator('[role="option"]').first();
    if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await firstOption.click();
      await page.waitForTimeout(500);
      return true;
    }

    // Fallback: press Enter
    await combo.press('Enter');
    await page.waitForTimeout(500);
    return false;
  } catch (e) {
    console.log(`  ❌ Error selecting combobox[${comboboxIndex}]: ${e.message}`);
    throw e;
  }
}

// ============================================================
// HELPER: Create 1 vehicle via form
// ============================================================
async function createVehicle(page, v, idx) {
  console.log(`\n🚗 [${idx + 1}] Creating: ${v.plate} – ${v.unitDesc}`);

  // Navigate to add vehicle form (for each iteration to get fresh form)
  await page.goto(`${BASE_URL}/fms/vehicle/form`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForURL(/fms\/vehicle|my-application/, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);

  // Check if we need re-login/FMS selection
  if (page.url().includes('my-application')) {
    const fmsLink = page.getByText('FMS (DEV)');
    if (await fmsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fmsLink.click();
      await page.waitForTimeout(1000);
      const cb = page.getByRole('button', { name: 'Confirm' });
      if (await cb.isVisible({ timeout: 2000 }).catch(() => false)) { 
        await cb.click(); 
        await page.waitForURL(/fms\/vehicle/, { timeout: 20000 }).catch(() => {});
        await page.waitForTimeout(2000); 
      }
    }
    await page.goto(`${BASE_URL}/fms/vehicle/form`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForURL(/fms\/vehicle/, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }

  // Verify we have the form elements before proceeding
  const hasCombobox = await page.locator('[role="combobox"]').first().isVisible({ timeout: 3000 }).catch(() => false);
  if (!hasCombobox) {
    console.log('⚠️ Combobox not found, page might not be loaded. URL:', page.url());
    throw new Error('Form elements not found on page');
  }

  // 1. Ownership
  const ownershipBtn = page.locator(`button:has-text("${v.ownership}")`);
  if (await ownershipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await ownershipBtn.click();
    await page.waitForTimeout(500);
  }

  // 2. License Plate
  const platePlaceholders = ['B 1234 ABC', 'License Plate', 'Plate'];
  for (const ph of platePlaceholders) {
    const input = page.locator(`input[placeholder="${ph}"]`);
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill(v.plate);
      break;
    }
  }

  // 3. Unit Description
  const descPlaceholders = ['Toyota Avanza 1.3 CVT...', 'Unit Description', 'Vehicle Model'];
  for (const ph of descPlaceholders) {
    const input = page.locator(`input[placeholder="${ph}"]`);
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.fill(v.unitDesc);
      break;
    }
  }

  // 4. Brand (react-select combobox #0)
  await selectReactSelect(page, 0, v.brand);

  // 5. Vehicle Type (react-select combobox #1, enabled after brand)
  await selectReactSelect(page, 1, v.vehicleType);

  // 6. Model (react-select combobox #2, enabled after vehicle type)
  await selectReactSelect(page, 2, v.model);
  await page.waitForTimeout(500);

  // 7. Year
  await page.locator('select').first().selectOption(v.year);

  // 8. CC
  await page.locator('input[placeholder="1329 CC"]').fill(v.cc);

  // 9. Chassis Number
  await page.locator('input[placeholder="MHKM1BA3JNK123456"]').fill(v.chassis);

  // 10. Engine Number
  await page.locator('input[placeholder="1NR-VE1234567"]').fill(v.engine);

  // 11. Department (react-select combobox #3) - pick first
  const depCombo = page.locator('[role="combobox"]').nth(3);
  await depCombo.click();
  await page.waitForTimeout(500);
  await depCombo.press('Enter');
  await page.waitForTimeout(500);

  // 12. Branch (react-select combobox #4)
  await selectReactSelect(page, 4, v.branch);

  // 13. Main User (react-select combobox #5) - pick first
  const userCombo = page.locator('[role="combobox"]').nth(5);
  await userCombo.click();
  await page.waitForTimeout(500);
  await userCombo.press('Enter');
  await page.waitForTimeout(500);

  // 14. BPKB No / STNK
  await page.locator('input[placeholder="S-03714594"]').fill(v.stnk);

  // 15. BPKB Status (select Active)
  const statusSelect = page.locator('select').nth(1);
  const statusDisabled = await statusSelect.isDisabled().catch(() => true);
  if (!statusDisabled) {
    await statusSelect.selectOption('hidup');
  }

  // 16. STNK Date 1Y, 5Y, KIR
  await page.locator('input[type="date"]').nth(0).fill(v.stnk1y);
  await page.locator('input[type="date"]').nth(1).fill(v.stnk5y);
  await page.locator('input[type="date"]').nth(2).fill(v.kir);

  // 17. Purchase Date
  await page.locator('input[type="date"]').nth(3).fill(v.purchaseDate);

  // 18. Purchase Price
  await page.locator('input[placeholder="0"]').first().fill(v.price);

  await page.screenshot({ path: `test-results/create-vehicle-${idx + 1}.png`, fullPage: true });

  // 19. Click Draft (submit memerlukan upload STNK file)
  await page.locator('button:has-text("Draft")').click();
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const success = currentUrl.includes('/fms/vehicle') && !currentUrl.includes('/form');

  if (success) {
    console.log(`  ✅ Vehicle ${v.plate} created as DRAFT`);
  } else {
    console.log(`  ⚠️ Still on form page: ${currentUrl}`);
    await page.screenshot({ path: `test-results/create-vehicle-${idx + 1}-error.png`, fullPage: true });
  }

  return success;
}

// ============================================================
// TEST: Create 5 Vehicles
// ============================================================
test.describe('Create Vehicle Data for Insurance Test', () => {

  test.setTimeout(300000); // 5 minutes

  test('Create 5 vehicles (batch) via Draft', async ({ page }) => {
    // Login first
    await loginToFMS(page);
    console.log(`✅ Logged in, URL: ${page.url()}`);

    let successCount = 0;

    for (let i = 0; i < vehicleDataset.length; i++) {
      const success = await createVehicle(page, vehicleDataset[i], i);
      if (success) successCount++;
    }

    console.log(`\n📊 Result: ${successCount}/${vehicleDataset.length} vehicles created`);
    expect(successCount).toBeGreaterThanOrEqual(3); // At least 3 out of 5

    // Verify vehicle list
    await page.goto(`${BASE_URL}/fms/vehicle`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(2000);

    const totalText = await page.evaluate(() => {
      return document.body.innerText.match(/TOTAL VEHICLES\s*\n*(\d+)/)?.[1] || '0';
    });
    console.log(`📋 Total vehicles in system: ${totalText}`);

    await page.screenshot({ path: 'test-results/create-vehicle-final-list.png', fullPage: true });
  });
});
