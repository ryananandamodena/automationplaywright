/**
 * FMS Vehicle Create All Brands Test
 * Test script for creating vehicles for all available brands
 *
 * @author Ryan Ananda
 * @description Automated test to create vehicles for all brands in the system
 */

import { test, expect } from '@playwright/test';

// ============================================================
// CONFIGURATION & CONSTANTS
// ============================================================

const BASE_URL = 'https://portal-dev.modena.com';
const VEHICLE_URL = `${BASE_URL}/fms/vehicle`;
const LOGIN_EMAIL = 'ryan.ananda@modena.com';
const LOGIN_PASSWORD = 'P@ssw0rd_ryan.ananda';

const SCREENSHOT_DIR = 'test-results/create-all-brands';

// Brand types for testing
const VEHICLE_BRANDS = [
  { name: 'Toyota', models: ['Innova', 'Fortuner', 'Alphard', 'Vios', 'Camry'] },
  { name: 'Honda', models: ['Civic', 'HR-V', 'Jazz', 'CR-V', 'Accord'] },
  { name: 'Daihatsu', models: ['Xenia', 'Terios', 'Ayla', 'Sigra'] },
  { name: 'Suzuki', models: ['Ertiga', 'Baleno', 'Vitara', 'Jimny'] },
  { name: 'Mitsubishi', models: ['Xpander', 'Pajero', 'Outlander', 'Triton'] },
  { name: 'Nissan', models: ['Livina', 'X-Trail', 'Terrano', 'Leaf'] },
  { name: 'Hyundai', models: ['Stargazer', 'Creta', 'Santa Fe', 'Tucson'] },
  { name: 'Wuling', models: ['Confero', 'Air EV', 'Almaz', 'Formo'] }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate unique license plate
 */
function generateLicensePlate() {
  const prefixes = ['B', 'D', 'F', 'H', 'G', 'E', 'T', 'K', 'R', 'S'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix} ${number} ${letters}`;
}

/**
 * Generate unique string
 */
function generateUniqueId(prefix = 'AUTO') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate future date
 */
function generateFutureDate(years = 1) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
}

/**
 * Take screenshot with timestamp
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${SCREENSHOT_DIR}/${name}-${timestamp}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 Screenshot: ${path}`);
  return path;
}

/**
 * Login and navigate to vehicle page
 */
async function loginAndNavigateToVehicle(page) {
  console.log('🔐 Logging in and navigating to vehicle page...');

  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Handle login redirect
  if (page.url().includes('/login')) {
    console.log('  → Login page detected, entering credentials...');
    await page.locator('input[type="email"], input[name="email"]').first().fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(LOGIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 30000 }).catch(() => {});

    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(2000);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Handle SSO redirect
  if (page.url().includes('my-application')) {
    console.log('  → SSO redirect detected, selecting FMS...');
    const fmsLink = page.getByText('FMS (DEV)');
    if (await fmsLink.isVisible({ timeout: 4000 }).catch(() => false)) {
      await fmsLink.click();
      await page.waitForTimeout(1500);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Final verification and navigation to vehicle management
  if (!page.url().includes('/fms/vehicle') || page.url().includes('/login')) {
    console.log('  → Recovery needed, re-authenticating...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1000);

    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(1500);
    } else {
      await page.locator('input[type="email"], input[name="email"]').first().fill(LOGIN_EMAIL);
      await page.locator('input[type="password"]').first().fill(LOGIN_PASSWORD);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL(/my-application|\/fms\//, { timeout: 30000 }).catch(() => {});

      await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  // Ensure we're on the vehicle management page
  console.log('  → Ensuring vehicle management page access...');

  // Wait for page to stabilize
  await page.waitForTimeout(3000);

  // Check if we're already on vehicle page
  let onVehiclePage = false;
  const addVehicleButton = page.locator('button').filter({ hasText: 'Add Vehicle' });
  if (await addVehicleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('  ✅ Already on vehicle management page');
    onVehiclePage = true;
  }

  // If not on vehicle page, try to navigate there
  if (!onVehiclePage) {
    console.log('  → Not on vehicle page, attempting navigation...');

    // Try clicking Vehicle menu/sidebar item
    const vehicleMenuSelectors = [
      page.getByText('Vehicle').first(),
      page.getByRole('link', { name: 'Vehicle' }),
      page.locator('a[href*="vehicle"]').first(),
      page.locator('nav a').filter({ hasText: 'Vehicle' }),
      page.locator('[data-menu-item="vehicle"]'),
      page.locator('.sidebar a[href*="vehicle"]')
    ];

    for (const selector of vehicleMenuSelectors) {
      try {
        if (await selector.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('  → Clicking vehicle menu...');
          await selector.click();
          await page.waitForTimeout(3000);

          // Check if vehicle page loaded
          if (await addVehicleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('  ✅ Vehicle page accessed via menu');
            onVehiclePage = true;
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // If still not on vehicle page, try direct navigation
    if (!onVehiclePage) {
      console.log('  → Trying direct navigation to vehicle page...');
      await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(3000);

      if (await addVehicleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('  ✅ Vehicle page accessed via direct navigation');
        onVehiclePage = true;
      }
    }
  }

  // Final verification
  if (onVehiclePage && await addVehicleButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('  ✅ Successfully navigated to vehicle management page');
    return page.url();
  }

  // Debug: Take screenshot and list available elements
  await takeScreenshot(page, 'vehicle-page-debug');
  console.log('  ⚠️ Could not access vehicle management page');

  // List all buttons for debugging
  const allButtons = page.locator('button');
  const buttonCount = await allButtons.count();
  console.log(`  📋 Found ${buttonCount} buttons on current page:`);
  for (let i = 0; i < Math.min(buttonCount, 15); i++) {
    const buttonText = await allButtons.nth(i).textContent().catch(() => 'N/A');
    console.log(`    Button ${i}: "${buttonText}"`);
  }

  // List navigation links
  const navLinks = page.locator('a');
  const linkCount = await navLinks.count();
  console.log(`  📋 Found ${linkCount} links on current page:`);
  for (let i = 0; i < Math.min(linkCount, 10); i++) {
    const linkText = await navLinks.nth(i).textContent().catch(() => 'N/A');
    const linkHref = await navLinks.nth(i).getAttribute('href').catch(() => 'N/A');
    console.log(`    Link ${i}: "${linkText}" -> ${linkHref}`);
  }

  return page.url();
}

/**
 * Open add vehicle form
 */
async function openAddVehicleForm(page) {
  console.log('➕ Opening add vehicle form...');

  try {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Handle any confirmation dialogs first
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  → Found confirmation dialog, clicking Confirm...');
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }

    // Debug: Check what buttons are available on the page
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log(`  Found ${buttonCount} buttons on page`);

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const buttonText = await allButtons.nth(i).textContent().catch(() => '');
      console.log(`    Button ${i}: "${buttonText}"`);
    }

    // Try multiple selectors for the Add Vehicle button
    let addButton;

    // First try: exact text match
    addButton = page.locator('button').filter({ hasText: 'Add Vehicle' });
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Add form opened (exact text match)');
      return true;
    }

    // Second try: partial text match
    addButton = page.locator('button').filter({ hasText: /Add Vehicle/i });
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Add form opened (partial text match)');
      return true;
    }

    // Third try: "Add" + "Vehicle" separately
    addButton = page.locator('button').filter({ hasText: 'Add' });
    const addButtons = await addButton.all();
    for (const btn of addButtons) {
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.click();
        await page.waitForTimeout(2000);
        // Check if form opened
        const formElements = page.locator('input, select, textarea');
        if (await formElements.count() > 5) {
          console.log('  ✅ Add form opened (Add button)');
          return true;
        }
        // If not, go back
        await page.goBack().catch(() => {});
        await page.waitForTimeout(1000);
      }
    }

    // Fourth try: role-based
    addButton = page.getByRole('button', { name: 'Add Vehicle' });
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Add form opened (role selector)');
      return true;
    }

    // Fifth try: broader search for "add" buttons
    addButton = page.getByRole('button', { name: /^add/i });
    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(2000);
      console.log('  ✅ Add form opened (broader role selector)');
      return true;
    }

    // Sixth try: look for buttons with plus icon or add-related classes
    const plusButtons = [
      page.locator('button[class*="add"]'),
      page.locator('button[class*="plus"]'),
      page.locator('button[class*="create"]'),
      page.locator('button:has(.fa-plus)'),
      page.locator('button:has(.material-icons:contains("add"))'),
      page.locator('button[data-action="add"]'),
      page.locator('button[data-action="create"]')
    ];

    for (const selector of plusButtons) {
      try {
        const buttons = await selector.all();
        for (const btn of buttons) {
          if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(2000);
            // Check if form opened
            const formElements = page.locator('input, select, textarea');
            if (await formElements.count() > 5) {
              console.log('  ✅ Add form opened (icon/class selector)');
              return true;
            }
            // If not, try to close modal/form
            const closeBtn = page.locator('button[class*="close"], button[class*="cancel"], .modal .close');
            if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
              await closeBtn.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Seventh try: look for links that might lead to add form
    const addLinks = [
      page.locator('a').filter({ hasText: /add.*vehicle/i }),
      page.locator('a').filter({ hasText: /create.*vehicle/i }),
      page.locator('a').filter({ hasText: /new.*vehicle/i }),
      page.locator('a[href*="add"]'),
      page.locator('a[href*="create"]'),
      page.locator('a[href*="new"]')
    ];

    for (const selector of addLinks) {
      try {
        if (await selector.isVisible({ timeout: 2000 }).catch(() => false)) {
          await selector.click();
          await page.waitForTimeout(2000);
          // Check if form opened
          const formElements = page.locator('input, select, textarea');
          if (await formElements.count() > 5) {
            console.log('  ✅ Add form opened (link selector)');
            return true;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    console.log('  ⚠️ Add button not found with any selector');
    return false;

  } catch (e) {
    console.log(`  ❌ Error opening form: ${e.message}`);
    return false;
  }
}

/**
 * Create test data for vehicle
 */
function createTestData(brand, model, vehicleType = 'Owned') {
  return {
    licensePlate: generateLicensePlate(),
    vehicleName: `${brand} ${model}`,
    chassis: generateUniqueId('CHS'),
    engine: generateUniqueId('ENG'),
    year: String(2020 + Math.floor(Math.random() * 5)),
    cc: String(1500 + Math.floor(Math.random() * 2000)),
    seats: '5',
    cylinder: '4',
    stnk: `S-${Math.floor(Math.random() * 90000000) + 10000000}`,
    userName: 'Automation Test User',
    description: `Test vehicle - ${brand} ${model} - ${generateUniqueId()}`,
    vehicleType: vehicleType,
    transmission: Math.random() > 0.5 ? 'Automatic' : 'Manual',
    fuel: 'Petrol',
    status: 'Active',
    taxDate: generateFutureDate(1),
    insuranceDate: generateFutureDate(1),
    amount: String(200000000 + Math.floor(Math.random() * 500000000))
  };
}

/**
 * Fill vehicle form with test data
 */
async function fillVehicleForm(page, vehicleData) {
  console.log('📝 Filling vehicle form...');

  const filledFields = [];

  try {
    // Fill text inputs
    const textInputs = page.locator('input[type="text"]');
    const textCount = await textInputs.count();

    // Common field mappings
    const fieldMappings = [
      { key: 'licensePlate', selector: /plate|plat/i },
      { key: 'vehicleName', selector: /name|nama/i },
      { key: 'chassis', selector: /chassis|rangka/i },
      { key: 'engine', selector: /engine|mesin/i },
      { key: 'stnk', selector: /stnk/i },
      { key: 'userName', selector: /user|pemakai/i },
      { key: 'description', selector: /description|deskripsi/i }
    ];

    for (let i = 0; i < textCount; i++) {
      const input = textInputs.nth(i);
      const isEditable = await input.isEditable({ timeout: 500 }).catch(() => false);

      if (isEditable) {
        // Try to match field type
        const inputId = await input.getAttribute('id').catch(() => '') || '';
        const inputName = await input.getAttribute('name').catch(() => '') || '';
        const placeholder = await input.getAttribute('placeholder').catch(() => '') || '';
        const label = await page.locator(`label[for="${inputId}"]`).textContent().catch(() => '') || '';

        const fieldInfo = `${inputId} ${inputName} ${placeholder} ${label}`.toLowerCase();

        for (const mapping of fieldMappings) {
          if (mapping.selector.test(fieldInfo) && vehicleData[mapping.key]) {
            await input.fill(vehicleData[mapping.key]);
            filledFields.push(mapping.key);
            console.log(`    ✅ Filled ${mapping.key}: ${vehicleData[mapping.key]}`);
            break;
          }
        }
      }
    }

    // Fill number inputs
    const numberInputs = page.locator('input[type="number"]');
    const numberCount = await numberInputs.count();

    const numberMappings = [
      { key: 'year', selector: /year|tahun/i },
      { key: 'cc', selector: /cc/i },
      { key: 'seats', selector: /seat|kursi/i },
      { key: 'cylinder', selector: /cylinder|silinder/i }
    ];

    for (let i = 0; i < numberCount; i++) {
      const input = numberInputs.nth(i);
      const isEditable = await input.isEditable({ timeout: 500 }).catch(() => false);

      if (isEditable) {
        const inputId = await input.getAttribute('id').catch(() => '') || '';
        const fieldInfo = inputId.toLowerCase();

        for (const mapping of numberMappings) {
          if (mapping.selector.test(fieldInfo) && vehicleData[mapping.key]) {
            await input.fill(vehicleData[mapping.key]);
            filledFields.push(mapping.key);
            console.log(`    ✅ Filled ${mapping.key}: ${vehicleData[mapping.key]}`);
            break;
          }
        }
      }
    }

    // Fill date inputs
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();

    const dateMappings = [
      { key: 'taxDate', selector: /tax|pajak/i },
      { key: 'insuranceDate', selector: /insurance|asuransi/i },
      { key: 'leaseStartDate', selector: /start|mulai/i },
      { key: 'leaseEndDate', selector: /end|selesai/i }
    ];

    for (let i = 0; i < dateCount; i++) {
      const input = dateInputs.nth(i);
      const inputId = await input.getAttribute('id').catch(() => '') || '';
      const fieldInfo = inputId.toLowerCase();

      for (const mapping of dateMappings) {
        if (mapping.selector.test(fieldInfo) && vehicleData[mapping.key]) {
          await input.fill(vehicleData[mapping.key]);
          filledFields.push(mapping.key);
          console.log(`    ✅ Filled ${mapping.key}: ${vehicleData[mapping.key]}`);
          break;
        }
      }
    }

    // Fill selects (dropdowns)
    const selects = page.locator('select');
    const selectCount = await selects.count();

    const selectMappings = [
      { key: 'vehicleType', selector: /type|tipe/i },
      { key: 'transmission', selector: /transmission|transmisi/i },
      { key: 'fuel', selector: /fuel|bahan/i },
      { key: 'status', selector: /status/i }
    ];

    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i);
      const selectId = await select.getAttribute('id').catch(() => '') || '';
      const fieldInfo = selectId.toLowerCase();

      for (const mapping of selectMappings) {
        if (mapping.selector.test(fieldInfo) && vehicleData[mapping.key]) {
          await select.selectOption({ label: vehicleData[mapping.key] }, { timeout: 2000 }).catch(() => {});
          filledFields.push(mapping.key);
          console.log(`    ✅ Selected ${mapping.key}: ${vehicleData[mapping.key]}`);
          break;
        }
      }
    }

    console.log(`  ✅ Total fields filled: ${filledFields.length}`);

  } catch (e) {
    console.log(`  ⚠️ Error filling form: ${e.message}`);
  }

  return filledFields;
}

/**
 * Submit vehicle form
 */
async function submitVehicleForm(page) {
  console.log('💾 Submitting vehicle form...');

  try {
    const saveButton = page.getByRole('button', { name: /save|simpan|submit|submit/i }).first();

    if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(3000);

      // Check for success message
      const successMessage = page.getByText(/success|berhasil|created|ditambahkan/i);
      if (await successMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  ✅ Form submitted successfully');
        return { success: true, message: 'Vehicle created successfully' };
      }

      // Check for error message
      const errorMessage = page.getByText(/error|gagal|failed/i);
      if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('  ❌ Form submission failed');
        return { success: false, message: 'Form submission failed' };
      }

      console.log('  ⚠️ Form submitted, status unknown');
      return { success: true, message: 'Form submitted (status unknown)' };
    }

    console.log('  ⚠️ Save button not found');
    return { success: false, message: 'Save button not found' };

  } catch (e) {
    console.log(`  ❌ Error submitting form: ${e.message}`);
    return { success: false, message: e.message };
  }
}

// ============================================================
// MAIN TEST SUITE
// ============================================================

test.describe('FMS - Create Vehicle for All Brands', () => {

  test.describe.configure({ timeout: 600000 }); // 10 minutes timeout

  test('Create vehicle for all available brands', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST: Create Vehicle for All Brands');
    console.log('========================================');

    const testResults = [];
    let successCount = 0;

    // Login once at the beginning
    await loginAndNavigateToVehicle(page);
    await takeScreenshot(page, 'all-brands-start');

    // Test each brand
    for (let i = 0; i < VEHICLE_BRANDS.length; i++) {
      const brand = VEHICLE_BRANDS[i];
      console.log(`\n🏍️ Testing Brand ${i + 1}/${VEHICLE_BRANDS.length}: ${brand.name}`);

      try {
        // Create test data for this brand
        const vehicleType = i % 2 === 0 ? 'Owned' : 'Leased'; // Alternate between Owned and Leased
        const testData = createTestData(brand.name, brand.models[0], vehicleType);

        console.log(`  📋 Test Data: ${testData.licensePlate} - ${testData.vehicleName}`);

        // Open add vehicle form
        const formOpened = await openAddVehicleForm(page);
        if (!formOpened) {
          console.log(`  ❌ Failed to open form for ${brand.name}`);
          testResults.push({
            brand: brand.name,
            success: false,
            error: 'Failed to open form',
            licensePlate: testData.licensePlate
          });
          continue;
        }

        await takeScreenshot(page, `brand-${brand.name.toLowerCase()}-form-open`);

        // Fill the form
        const filledFields = await fillVehicleForm(page, testData);
        await takeScreenshot(page, `brand-${brand.name.toLowerCase()}-form-filled`);

        // Submit the form
        const submitResult = await submitVehicleForm(page);
        await takeScreenshot(page, `brand-${brand.name.toLowerCase()}-form-submit`);

        const success = submitResult.success && filledFields.length > 0;

        testResults.push({
          brand: brand.name,
          success: success,
          fieldsFilled: filledFields.length,
          licensePlate: testData.licensePlate,
          vehicleName: testData.vehicleName,
          vehicleType: testData.vehicleType,
          submitMessage: submitResult.message
        });

        if (success) {
          successCount++;
          console.log(`  ✅ ${brand.name} vehicle created successfully`);
        } else {
          console.log(`  ❌ ${brand.name} vehicle creation failed`);
        }

        // Wait a bit before next brand
        await page.waitForTimeout(2000);

        // Navigate back to vehicle list for next iteration
        await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(2000);

      } catch (error) {
        console.log(`  ❌ Error testing ${brand.name}: ${error.message}`);
        testResults.push({
          brand: brand.name,
          success: false,
          error: error.message,
          licensePlate: null
        });
      }
    }

    // Summary
    console.log('\n========================================');
    console.log('TEST RESULTS SUMMARY');
    console.log('========================================');

    testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.brand}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.licensePlate) {
        console.log(`    License Plate: ${result.licensePlate}`);
        console.log(`    Vehicle: ${result.vehicleName}`);
        console.log(`    Type: ${result.vehicleType}`);
        console.log(`    Fields Filled: ${result.fieldsFilled}`);
      }
      if (result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });

    console.log(`\n📊 Summary: ${successCount}/${VEHICLE_BRANDS.length} brands successful`);

    // Assertions
    expect(testResults.length).toBe(VEHICLE_BRANDS.length);
    expect(successCount).toBeGreaterThan(0);

    // At least 50% success rate
    const successRate = successCount / VEHICLE_BRANDS.length;
    expect(successRate).toBeGreaterThanOrEqual(0.5);

    await takeScreenshot(page, 'all-brands-completed');

    console.log('\n✅ Test completed successfully');
  });

});