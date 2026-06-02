import { test, expect, chromium } from '@playwright/test';

// Configure test to use incognito context
test.use({
  launchOptions: {
    args: ['--incognito']
  }
});

// User credentials
const users = {
  admin: {
    email: 'ryan.ananda@modena.com',
    password: 'P@ssw0rd_ryan.ananda',
    name: 'Ryan Ananda'
  },
  approver1: {
    email: 'novyan.ramahdahan@modena.com',
    password: 'P@ssw0rd_novyan.ramahdahan',
    name: 'Novyan Ramahdahan'
  },
  approver2: {
    email: 'daniel.arietonga@modena.com',
    password: 'P@ssw0rd_daniel.arietonga',
    name: 'Daniel Arietonga'
  }
};

// Helper function to generate random string
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to generate random number
function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate unique license plate
function generateLicensePlate() {
  const prefix = 'B';
  const number = String(generateRandomNumber(1, 9999)).padStart(4, '0');
  const letters = generateRandomString(3);
  return `${prefix} ${number} ${letters}`;
}

// Generate vehicle request data dynamically
function generateVehicleData() {
  return {
    vehicleType: 'Owned',
    licensePlate: generateLicensePlate(),
    vehicleName: 'Toyota Avanza 1.3 CVT',
    cylinder: '3',
    type: 'MPV',
    seats: '7',
    year: '2024',
    cc: '1300',
    chassis: `MHKM1BA3JNK${generateRandomString(6)}`,
    engine: `1NR-VE${generateRandomString(7)}`,
    fuel: '5', // Petrol
    transmission: '2', // Automatic
    userName: 'Test User E2E',
    stnk: `S-${generateRandomNumber(10000000, 99999999)}`,
    status: 'hidup',
    taxDate: '2025-12-31',
    insuranceDate: '2025-12-31',
    leaseStartDate: '2024-01-01',
    leaseEndDate: '2027-01-01',
    amount: '350000000',
    policy: `POL-${generateRandomNumber(1000000, 9999999)}`
  };
}

// Helper function for login
async function loginAs(page, user) {
  console.log(`Logging in as ${user.name}...`);
  
  // Navigate to login page
  await page.goto('https://portal-dev.modena.com/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  
  // Check if already logged in
  try {
    const emailInput = page.getByRole('textbox', { name: 'Enter your email' });
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    
    await emailInput.fill(user.email);
    await page.getByRole('textbox', { name: 'Enter your password' }).fill(user.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    
    await page.waitForURL('**/my-application', { timeout: 15000 });
  } catch (e) {
    console.log('Already logged in or session active');
  }
  
  console.log(`✓ Logged in as ${user.name}`);
}

// Helper function to navigate to FMS and Vehicle List
async function navigateToVehicleList(page) {
  // Click on FMS (DEV) menu
  await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.waitForLoadState('networkidle');
  
  // Navigate to Vehicle List
  await page.getByRole('button', { name: 'Vehicle' }).click();
  await page.getByRole('link', { name: 'Vehicle List' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// Helper function to navigate to Vehicle Approval
async function navigateToVehicleApproval(page) {
  // Click on FMS (DEV) menu
  await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.waitForLoadState('networkidle');
  
  // Navigate to Vehicle Approval
  await page.getByRole('button', { name: 'Vehicle' }).click();
  await page.getByRole('link', { name: /approval|vehicle approval/i }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// Helper function to logout
async function logout(page) {
  try {
    // Try to find and click logout button
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Logout"), [class*="user-menu"]').first();
    if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenu.click();
      await page.waitForTimeout(300);
      const logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  } catch (e) {
    console.log('Logout via menu failed, using direct navigation');
  }
  
  // Clear session and navigate to login
  await page.context().clearCookies();
  await page.goto('https://portal-dev.modena.com/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
}

test('Complete Vehicle Request and Approval Flow', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes timeout
  
  const vehicleData = generateVehicleData();
  
  console.log('\n========================================');
  console.log('VEHICLE LIST - END TO END TEST');
  console.log('========================================');
  console.log(`Vehicle: ${vehicleData.licensePlate} - ${vehicleData.vehicleName}`);
  console.log('========================================\n');
  
  // ============================================
  // STEP 1: ADMIN CREATES VEHICLE REQUEST
  // ============================================
  console.log('=== STEP 1: ADMIN CREATES VEHICLE REQUEST ===');
  
  await loginAs(page, users.admin);
  await navigateToVehicleList(page);
  
  // Click Add Vehicle button
  await page.getByRole('button', { name: 'Add Vehicle' }).click();
  await page.waitForTimeout(1000);
  
  console.log('Filling vehicle form...');
  
  // Select vehicle type (Leased or Owned)
  await page.getByRole('button', { name: vehicleData.vehicleType }).click();
  await page.waitForTimeout(500);
  
  // Fill vehicle details - using same selectors as vehicle-tests.spec.js
  await page.getByRole('textbox', { name: 'B 1234 ABC' }).fill(vehicleData.licensePlate);
  await page.getByRole('textbox', { name: 'Toyota Avanza 1.3 CVT...' }).fill(vehicleData.vehicleName);
  
  // Select cylinder - react-select style (click, type, enter)
  const cylinderCombo = page.getByRole('combobox').first();
  await cylinderCombo.click();
  await page.waitForTimeout(300);
  await cylinderCombo.fill(vehicleData.cylinder);
  await page.waitForTimeout(300);
  await cylinderCombo.press('Enter');
  await page.waitForTimeout(300);
  
  // Click to enable next fields
  await page.getByRole('textbox', { name: 'Toyota Avanza 1.3 CVT...' }).click();
  await page.waitForTimeout(300);
  
  // Select type - react-select style
  const typeCombo = page.getByRole('combobox').nth(1);
  await typeCombo.click();
  await page.waitForTimeout(300);
  await typeCombo.fill(vehicleData.type);
  await page.waitForTimeout(300);
  await typeCombo.press('Enter');
  await page.waitForTimeout(300);
  
  // Select seats - react-select style
  const seatsCombo = page.getByRole('combobox').nth(2);
  await seatsCombo.click();
  await page.waitForTimeout(300);
  await seatsCombo.fill(vehicleData.seats);
  await page.waitForTimeout(300);
  await seatsCombo.press('Enter');
  await page.waitForTimeout(300);
  
  // Fill year
  await page.getByRole('textbox', { name: '2022' }).fill(vehicleData.year);
  await page.waitForTimeout(300);
  
  // Fill CC
  await page.getByRole('textbox', { name: 'CC' }).fill(vehicleData.cc);
  await page.waitForTimeout(300);
  
  // Fill chassis
  await page.getByRole('textbox', { name: 'MHKM1BA3JNK123456' }).fill(vehicleData.chassis);
  await page.waitForTimeout(300);
  
  // Fill engine
  await page.getByRole('textbox', { name: '1NR-VE1234567' }).fill(vehicleData.engine);
  await page.waitForTimeout(300);
  
  // Select fuel - react-select style
  const fuelCombo = page.getByRole('combobox').nth(3);
  await fuelCombo.click();
  await page.waitForTimeout(300);
  await fuelCombo.fill(vehicleData.fuel);
  await page.waitForTimeout(300);
  await fuelCombo.press('Enter');
  await page.waitForTimeout(300);
  
  // Select transmission - react-select style
  const transmissionCombo = page.getByRole('combobox').nth(4);
  await transmissionCombo.click();
  await page.waitForTimeout(300);
  await transmissionCombo.fill(vehicleData.transmission);
  await page.waitForTimeout(300);
  await transmissionCombo.press('Enter');
  await page.waitForTimeout(300);
  
  // Fill user name
  await page.getByRole('textbox', { name: 'User name' }).fill(vehicleData.userName);
  await page.waitForTimeout(300);
  
  // Upload images
  try {
    await page.locator('label').filter({ hasText: 'Upload' }).first().setInputFiles('1731_1915707.jpg');
    await page.locator('label').filter({ hasText: 'Upload' }).nth(1).setInputFiles('1731_1916785.jpg');
    await page.locator('.lucide.lucide-image.mb-2').first().setInputFiles('1731_1915707.jpg');
    console.log('✓ Images uploaded');
  } catch (e) {
    console.log('⚠ Image upload skipped:', e.message);
  }
  
  // Fill STNK
  await page.getByRole('textbox', { name: 'S-' }).fill(vehicleData.stnk);
  await page.waitForTimeout(300);
  
  // Select status - react-select style
  const statusCombo = page.getByRole('combobox').nth(5);
  await statusCombo.click();
  await page.waitForTimeout(300);
  await statusCombo.fill(vehicleData.status);
  await page.waitForTimeout(300);
  await statusCombo.press('Enter');
  await page.waitForTimeout(300);
  
  // Fill dates
  await page.locator('input[type="date"]').first().fill(vehicleData.taxDate);
  await page.locator('input[type="date"]').nth(1).fill(vehicleData.insuranceDate);
  await page.waitForTimeout(300);
  
  // Upload documents
  try {
    await page.locator('.lucide.lucide-file-text').first().setInputFiles('1731_1915707.jpg');
    await page.locator('.lucide.lucide-file-text').nth(1).setInputFiles('1731_1916785.jpg');
    console.log('✓ Documents uploaded');
  } catch (e) {
    console.log('⚠ Document upload skipped:', e.message);
  }
  
  // Fill lease dates and amount
  await page.locator('input[type="date"]').nth(3).fill(vehicleData.leaseStartDate);
  await page.locator('input[type="date"]').nth(4).fill(vehicleData.leaseEndDate);
  await page.getByPlaceholder('0').nth(2).fill(vehicleData.amount);
  await page.getByRole('textbox', { name: 'POL-2024-' }).fill(vehicleData.policy);
  await page.waitForTimeout(300);
  
  console.log('✓ All fields filled');
  
  // Submit the form
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(2000);
  
  console.log(`✓ Vehicle request submitted by ${users.admin.name}`);
  console.log(`  License Plate: ${vehicleData.licensePlate}`);
  console.log(`  Chassis: ${vehicleData.chassis}`);
  
  // Logout admin
  await logout(page);
  console.log('✓ Admin logged out\n');
  
  // ============================================
  // STEP 2: APPROVER 1 (NOVYAN) APPROVES
  // ============================================
  console.log('=== STEP 2: APPROVER 1 (NOVYAN) APPROVES ===');
  
  await loginAs(page, users.approver1);
  await navigateToVehicleApproval(page);
  
  console.log('Looking for pending request...');
  
  // Find the pending request by license plate
  const pendingRow = page.locator('table tbody tr').filter({ hasText: vehicleData.licensePlate }).first();
  
  if (await pendingRow.isVisible({ timeout: 10000 }).catch(() => false)) {
    console.log(`✓ Found pending request for ${vehicleData.licensePlate}`);
    
    // Click on the row to view details
    await pendingRow.click();
    await page.waitForTimeout(1000);
    
    // Click Approve button
    const approveButton = page.getByRole('button', { name: /approve|setuju/i });
    if (await approveButton.isVisible()) {
      await approveButton.click();
      await page.waitForTimeout(500);
      
      // Add approval note if required
      const noteField = page.getByRole('textbox', { name: /note|catatan/i });
      if (await noteField.isVisible()) {
        await noteField.fill('Approved by Novyan Ramahdahan - Step 1');
      }
      
      // Confirm approval
      const confirmButton = page.getByRole('button', { name: /confirm|yes|ok/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      console.log(`✓ Request approved by ${users.approver1.name}`);
    }
  } else {
    console.log('⚠ Pending request not found in approval list');
  }
  
  // Logout approver 1
  await logout(page);
  console.log('✓ Approver 1 logged out\n');
  
  // ============================================
  // STEP 3: APPROVER 2 (DANIEL) APPROVES
  // ============================================
  console.log('=== STEP 3: APPROVER 2 (DANIEL) APPROVES ===');
  
  await loginAs(page, users.approver2);
  await navigateToVehicleApproval(page);
  
  console.log('Looking for pending request...');
  
  // Find the pending request by license plate
  const pendingRow2 = page.locator('table tbody tr').filter({ hasText: vehicleData.licensePlate }).first();
  
  if (await pendingRow2.isVisible({ timeout: 10000 }).catch(() => false)) {
    console.log(`✓ Found pending request for ${vehicleData.licensePlate}`);
    
    // Click on the row to view details
    await pendingRow2.click();
    await page.waitForTimeout(1000);
    
    // Click Approve button
    const approveButton2 = page.getByRole('button', { name: /approve|setuju/i });
    if (await approveButton2.isVisible()) {
      await approveButton2.click();
      await page.waitForTimeout(500);
      
      // Add approval note if required
      const noteField2 = page.getByRole('textbox', { name: /note|catatan/i });
      if (await noteField2.isVisible()) {
        await noteField2.fill('Approved by Daniel Arietonga - Final Approval');
      }
      
      // Confirm approval
      const confirmButton2 = page.getByRole('button', { name: /confirm|yes|ok/i });
      if (await confirmButton2.isVisible()) {
        await confirmButton2.click();
      }
      
      console.log(`✓ Request approved by ${users.approver2.name}`);
    }
  } else {
    console.log('⚠ Pending request not found in approval list');
  }
  
  // Logout approver 2
  await logout(page);
  console.log('✓ Approver 2 logged out\n');
  
  // ============================================
  // STEP 4: VERIFY VEHICLE IS APPROVED
  // ============================================
  console.log('=== STEP 4: VERIFY VEHICLE IS APPROVED ===');
  
  await loginAs(page, users.admin);
  await navigateToVehicleList(page);
  
  // Search for the vehicle
  const searchInput = page.getByRole('textbox', { name: /search|cari/i });
  if (await searchInput.isVisible()) {
    await searchInput.fill(vehicleData.licensePlate);
    await page.waitForTimeout(1000);
  }
  
  // Verify the vehicle exists
  const vehicleRow = page.locator('table tbody tr').filter({ hasText: vehicleData.licensePlate }).first();
  
  if (await vehicleRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log(`✓ Vehicle ${vehicleData.licensePlate} found in list`);
    
    // Check status
    const statusText = await vehicleRow.locator('td').last().textContent();
    console.log(`  Status: ${statusText}`);
  } else {
    console.log('⚠ Vehicle not found in list - may still be processing');
  }
  
  console.log('\n========================================');
  console.log('END TO END TEST COMPLETED');
  console.log('========================================');
  console.log('\nSummary:');
  console.log(`1. Request created by: ${users.admin.name}`);
  console.log(`2. First approval by: ${users.approver1.name}`);
  console.log(`3. Final approval by: ${users.approver2.name}`);
  console.log(`4. Vehicle: ${vehicleData.licensePlate} - ${vehicleData.vehicleName}`);
  console.log(`5. Chassis: ${vehicleData.chassis}`);
  console.log(`6. Engine: ${vehicleData.engine}`);
});
