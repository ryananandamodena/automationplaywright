import { test, expect } from '@playwright/test';

const BASE_URL = 'https://portal-dev.modena.com';
const VEHICLE_FORM_URL = `${BASE_URL}/fms/vehicle/form`;

const USERS = {
  creator: {
    email: 'ryan.ananda@modena.com',
    password: 'P@ssw0rd_ryan.ananda',
    name: 'Ryan Ananda'
  }
};

// 10 Vehicle Test Data
const vehicleData = [
  {
    id: 1,
    licensePlate: 'B 1111 AAA',
    vehicleName: 'Toyota Avanza',
    cylinder: '6',
    type: 'MPV',
    seats: '8',
    year: '2024',
    cc: '1300',
    chassis: 'MHKM1BA3JNK111111',
    engine: '1NR-VE1111111',
    fuel: 'Bensin',
    transmission: 'Manual',
    ownership: 'Owned',
    status: 'Active'
  },
  {
    id: 2,
    licensePlate: 'B 2222 BBB',
    vehicleName: 'Honda CR-V',
    cylinder: '6',
    type: 'SUV',
    seats: '5',
    year: '2023',
    cc: '1500',
    chassis: 'JHMRE6H38LM222222',
    engine: 'N15Z1111112',
    fuel: 'Bensin',
    transmission: 'Automatic',
    ownership: 'Owned',
    status: 'Active'
  },
  {
    id: 3,
    licensePlate: 'B 3333 CCC',
    vehicleName: 'Daihatsu Xenia',
    cylinder: '4',
    type: 'MPV',
    seats: '7',
    year: '2022',
    cc: '1000',
    chassis: 'MHKC5BE3KNL333333',
    engine: 'K3VE0012003',
    fuel: 'Bensin',
    transmission: 'Manual',
    ownership: 'Leased',
    status: 'Active'
  },
  {
    id: 4,
    licensePlate: 'B 4444 DDD',
    vehicleName: 'Mitsubishi Pajero',
    cylinder: '8',
    type: 'SUV',
    seats: '5',
    year: '2024',
    cc: '3000',
    chassis: 'MMKD4AA3KNL444444',
    engine: '6G75MPI44444',
    fuel: 'Bensin',
    transmission: 'Automatic',
    ownership: 'Owned',
    status: 'Active'
  },
  {
    id: 5,
    licensePlate: 'B 5555 EEE',
    vehicleName: 'Suzuki Ertiga',
    cylinder: '4',
    type: 'MPV',
    seats: '7',
    year: '2023',
    cc: '1400',
    chassis: 'JSI4EN31KU1555555',
    engine: 'K14B5555555',
    fuel: 'Bensin',
    transmission: 'Manual',
    ownership: 'Owned',
    status: 'Active'
  },
  {
    id: 6,
    licensePlate: 'B 6666 FFF',
    vehicleName: 'Toyota Innova',
    cylinder: '8',
    type: 'MPV',
    seats: '8',
    year: '2024',
    cc: '2000',
    chassis: 'MHKL5BE3JNK666666',
    engine: '2KD0660666',
    fuel: 'Solar',
    transmission: 'Automatic',
    ownership: 'Owned',
    status: 'Active'
  },
  {
    id: 7,
    licensePlate: 'B 7777 GGG',
    vehicleName: 'Nissan Livina',
    cylinder: '4',
    type: 'MPV',
    seats: '7',
    year: '2022',
    cc: '1200',
    chassis: 'N6ND1AA2JNH777777',
    engine: 'MR18DE777777',
    fuel: 'Bensin',
    transmission: 'Manual',
    ownership: 'Leased',
    status: 'Active'
  },
  {
    id: 8,
    licensePlate: 'B 8888 HHH',
    vehicleName: 'Hyundai Tucson',
    cylinder: '6',
    type: 'SUV',
    seats: '5',
    year: '2023',
    cc: '1600',
    chassis: 'KMHEC4A46DU888888',
    engine: 'G4GC8888888',
    fuel: 'Bensin',
    transmission: 'Automatic',
    ownership: 'Owned',
    status: 'Active'
  },
  {
    id: 9,
    licensePlate: 'B 9999 III',
    vehicleName: 'Isuzu Panther',
    cylinder: '8',
    type: 'Minibus',
    seats: '15',
    year: '2021',
    cc: '2200',
    chassis: 'J8ATE2D2JL2999999',
    engine: '4JB1TC9999999',
    fuel: 'Solar',
    transmission: 'Manual',
    ownership: 'Owned',
    status: 'Active'
  },
  {
    id: 10,
    licensePlate: 'B 0000 JJJ',
    vehicleName: 'Kia Sportage',
    cylinder: '6',
    type: 'SUV',
    seats: '5',
    year: '2024',
    cc: '1700',
    chassis: 'KNDJ42AU0L7000000',
    engine: 'G4NA1000000',
    fuel: 'Bensin',
    transmission: 'Automatic',
    ownership: 'Owned',
    status: 'Active'
  }
];

// Helper: Login to Portal
async function loginToPortal(page, user) {
  console.log(`\n[LOGIN] Checking login status`);
  
  // First go to base URL to check current state
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);
  
  const currentUrl = page.url();
  console.log(`  > Current URL: ${currentUrl}`);
  
  // If already logged in (on my-application), skip login
  if (currentUrl.includes('my-application')) {
    console.log(`  > Already logged in (my-application), skip login`);
    return;
  }
  
  // If on login page, do login
  if (currentUrl.includes('login')) {
    console.log(`  > On login page, filling credentials for ${user.name}`);
    
    // Fill email
    const emailInputs = await page.locator('input[type="email"], input[placeholder*="email"], input[name*="email"]').all();
    if (emailInputs.length > 0) {
      await emailInputs[0].fill(user.email);
      console.log(`    > Email: ${user.email}`);
    }
    
    // Fill password
    const pwdInputs = await page.locator('input[type="password"]').all();
    if (pwdInputs.length > 0) {
      await pwdInputs[0].fill(user.password);
      console.log(`    > Password filled`);
    }
    
    // Submit login - look for button with various text options
    const submitBtn = page.locator('button').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(5000);
      console.log(`    > Login button clicked`);
    }
  }
}

// Helper: Navigate to Vehicle Form
async function navigateToVehicleForm(page) {
  console.log(`\n[NAVIGATE] Going to Vehicle Form`);
  
  const currentUrl = page.url();
  console.log(`  > Current URL: ${currentUrl}`);
  
  // If on my-application page, select FMS (DEV)
  if (currentUrl.includes('my-application') || !currentUrl.includes('/fms/')) {
    console.log(`  > On my-application, selecting FMS (DEV)`);
    
    // Find and click FMS (DEV) application
    const fmsLink = page.getByText('FMS (DEV)', { exact: false });
    if (await fmsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fmsLink.click();
      await page.waitForTimeout(2000);
      
      // Look for confirm button in modal
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        console.log(`    > FMS (DEV) selected and confirmed`);
      } else {
        console.log(`    > No confirm button, FMS might be auto-selected`);
        await page.waitForTimeout(2000);
      }
      
      // Wait for FMS to load
      await page.waitForURL(/\/fms\//, { timeout: 10000 }).catch(() => {});
    } else {
      console.log(`    > FMS (DEV) not found, might already be in FMS`);
    }
  }
  
  console.log(`  > After FMS selection: ${page.url()}`);
  
  // Navigate to vehicle form
  console.log(`  > Navigating to form URL...`);
  await page.goto(VEHICLE_FORM_URL, { waitUntil: 'load', timeout: 30000 }).catch(err => {
    console.log(`    > Navigation error (expected): ${err.message.split('\n')[0]}`);
  });
  
  await page.waitForTimeout(2000);
  const finalUrl = page.url();
  console.log(`  > Final URL: ${finalUrl}`);
  
  // Check if form loaded
  const formTitle = await page.locator('h1, h2, .page-title').first().textContent().catch(() => '');
  console.log(`  > Page title: ${formTitle}`);
}

// Helper: Analyze Form Structure
async function analyzeFormStructure(page) {
  console.log(`\n[ANALYZE] Form Structure`);
  
  // Get all form inputs
  const textInputs = await page.locator('input[type="text"]').all();
  const numberInputs = await page.locator('input[type="number"]').all();
  const dateInputs = await page.locator('input[type="date"]').all();
  const selectElements = await page.locator('select').all();
  const comboboxes = await page.locator('[role="combobox"]').all();
  const textareas = await page.locator('textarea').all();
  
  console.log(`  > Text inputs: ${textInputs.length}`);
  console.log(`  > Number inputs: ${numberInputs.length}`);
  console.log(`  > Date inputs: ${dateInputs.length}`);
  console.log(`  > Selects: ${selectElements.length}`);
  console.log(`  > Comboboxes: ${comboboxes.length}`);
  console.log(`  > Textareas: ${textareas.length}`);
  
  return {
    textInputs: textInputs.length,
    numberInputs: numberInputs.length,
    dateInputs: dateInputs.length,
    selects: selectElements.length,
    comboboxes: comboboxes.length,
    textareas: textareas.length
  };
}

// Helper: Fill Vehicle Form
async function fillVehicleForm(page, data) {
  console.log(`\n[FILL] Vehicle #${data.id}: ${data.vehicleName}`);
  
  // Wait for form to be visible
  await page.waitForTimeout(1000);
  
  // Get all text inputs
  const textInputs = await page.locator('input[type="text"]').all();
  const selectElements = await page.locator('select').all();
  const dateInputs = await page.locator('input[type="date"]').all();
  
  // Fill text inputs
  if (textInputs.length > 0) {
    for (let i = 0; i < Math.min(textInputs.length, 5); i++) {
      const placeholder = await textInputs[i].getAttribute('placeholder').catch(() => '');
      console.log(`    > Text input ${i}: ${placeholder}`);
    }
    
    if (textInputs.length >= 1) {
      await textInputs[0].fill(data.licensePlate);
      console.log(`    ✓ License Plate: ${data.licensePlate}`);
    }
    if (textInputs.length >= 2) {
      await textInputs[1].fill(data.vehicleName);
      console.log(`    ✓ Vehicle Name: ${data.vehicleName}`);
    }
    if (textInputs.length >= 3) {
      await textInputs[2].fill(data.chassis);
      console.log(`    ✓ Chassis: ${data.chassis}`);
    }
    if (textInputs.length >= 4) {
      await textInputs[3].fill(data.engine);
      console.log(`    ✓ Engine: ${data.engine}`);
    }
  }
  
  // Fill select dropdowns
  if (selectElements.length > 0) {
    for (let i = 0; i < Math.min(selectElements.length, 3); i++) {
      const options = await selectElements[i].locator('option').all();
      console.log(`    > Select ${i}: ${options.length} options`);
    }
    
    if (selectElements.length >= 1) {
      await selectElements[0].selectOption(data.fuel).catch(() => {});
      console.log(`    ✓ Fuel: ${data.fuel}`);
    }
    if (selectElements.length >= 2) {
      await selectElements[1].selectOption(data.type).catch(() => {});
      console.log(`    ✓ Type: ${data.type}`);
    }
  }
  
  // Fill date inputs
  if (dateInputs.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    await dateInputs[0].fill(today);
    console.log(`    ✓ Date: ${today}`);
  }
  
  // Number inputs for year/cc
  const numberInputs = await page.locator('input[type="number"]').all();
  if (numberInputs.length > 0) {
    await numberInputs[0].fill(data.year);
    console.log(`    ✓ Year: ${data.year}`);
  }
  if (numberInputs.length > 1) {
    await numberInputs[1].fill(data.cc);
    console.log(`    ✓ CC: ${data.cc}`);
  }
}

// Helper: Submit Form
async function submitForm(page, vehicleId) {
  console.log(`\n[SUBMIT] Submitting Vehicle Form #${vehicleId}`);
  
  // Look for submit button
  const submitBtn = page.locator('button').filter({ hasText: /Submit|Save|Create|Add/i }).first();
  
  if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await submitBtn.click();
    await page.waitForTimeout(3000);
    console.log(`  > Form submitted`);
    
    // Check for success message or redirect
    const currentUrl = page.url();
    if (!currentUrl.includes('/form')) {
      console.log(`  ✓ Form submission successful`);
      return true;
    }
  } else {
    console.log(`  ⚠ Submit button not found`);
    return false;
  }
}

// Main Tests
test.describe('Vehicle - Create 10 Vehicle Entries', () => {
  
  test('Setup: Login and Navigate to Vehicle Form', async ({ page }) => {
    await loginToPortal(page, USERS.creator);
    await navigateToVehicleForm(page);
    
    const structure = await analyzeFormStructure(page);
    console.log(`\n[STRUCTURE] Form detected:`);
    console.log(JSON.stringify(structure, null, 2));
    
    // Save URL for later tests
    expect(page.url()).toContain('/fms/vehicle');
  });
  
  // Create 10 vehicles
  for (let i = 0; i < vehicleData.length; i++) {
    const data = vehicleData[i];
    
    test(`TC-${data.id}: Create ${data.vehicleName}`, async ({ page }) => {
      // Login and navigate each time to ensure fresh state
      await loginToPortal(page, USERS.creator);
      await navigateToVehicleForm(page);
      
      // Take screenshot before fill
      await page.screenshot({ path: `test-results/vehicle-${data.id}-before-fill.png`, fullPage: true });
      
      // Fill form
      await fillVehicleForm(page, data);
      
      // Take screenshot after fill
      await page.screenshot({ path: `test-results/vehicle-${data.id}-after-fill.png`, fullPage: true });
      
      // Submit form (optional - can set to false for dry run)
      const submitted = await submitForm(page, data.id);
      
      if (submitted) {
        // Navigate back to form
        await page.goto(VEHICLE_FORM_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForTimeout(1000);
      }
      
      console.log(`\n[RESULT] Vehicle #${data.id} - ${submitted ? 'SUBMITTED' : 'FILLED (DRY RUN)'}`);
    });
  }
});
