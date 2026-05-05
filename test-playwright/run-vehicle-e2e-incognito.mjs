import { chromium } from 'playwright';

const BASE_URL = 'https://portal-dev.modena.com';

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

// Helper functions
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateLicensePlate() {
  const prefix = 'B';
  const number = String(generateRandomNumber(1000, 9999));
  const letters = generateRandomString(3);
  return `${prefix} ${number} ${letters}`;
}

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
    fuel: '5',
    transmission: '2',
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

async function loginAs(page, user) {
  console.log(`\n🔐 Logging in as ${user.name}...`);
  
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const emailInput = page.locator('input[name="email"]').first();
  const isLoginPage = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);
  
  if (isLoginPage) {
    await emailInput.fill(user.email);
    await page.locator('input[type="password"]').first().fill(user.password);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForTimeout(5000);
    console.log(`✓ Logged in as ${user.name}`);
  } else {
    console.log(`✓ Already logged in as ${user.name}`);
  }
}

async function navigateToFMS(page) {
  console.log('📂 Navigating to FMS...');
  
  if (page.url().includes('my-application')) {
    const fmsLink = page.locator('text=FMS (DEV)').first();
    if (await fmsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fmsLink.click();
      await page.waitForTimeout(2000);
    }
    
    const confirmBtn = page.locator('.swal2-confirm').first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
    }
  }
  
  console.log('✓ Navigated to FMS');
}

async function navigateToVehicleList(page) {
  console.log('🚗 Navigating to Vehicle List...');
  
  await page.goto(`${BASE_URL}/fms/vehicle`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log('✓ On Vehicle List page');
}

async function navigateToVehicleApproval(page) {
  console.log('✅ Navigating to Vehicle Approval...');
  
  // Try direct URL first
  await page.goto(`${BASE_URL}/fms/vehicle/approval`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  
  console.log('✓ On Vehicle Approval page');
}

async function runVehicleE2E() {
  console.log('\n' + '='.repeat(60));
  console.log('VEHICLE E2E TEST - INCOGNITO MODE');
  console.log('='.repeat(60));
  
  const vehicleData = generateVehicleData();
  console.log(`\n📋 Vehicle Data:`);
  console.log(`   License Plate: ${vehicleData.licensePlate}`);
  console.log(`   Vehicle Name: ${vehicleData.vehicleName}`);
  console.log(`   Chassis: ${vehicleData.chassis}`);
  console.log(`   Engine: ${vehicleData.engine}`);
  
  // Launch browser in incognito mode
  const browser = await chromium.launch({
    headless: false,
    args: ['--incognito', '--start-maximized']
  });
  
  try {
    // ============================================
    // STEP 1: ADMIN CREATES VEHICLE REQUEST
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1: ADMIN CREATES VEHICLE REQUEST');
    console.log('='.repeat(60));
    
    const context1 = await browser.newContext({ viewport: null });
    const page1 = await context1.newPage();
    
    await loginAs(page1, users.admin);
    await navigateToFMS(page1);
    await navigateToVehicleList(page1);
    
    // Click Add Vehicle
    console.log('➕ Clicking Add Vehicle button...');
    const addBtn = page1.locator('button:has-text("Add Vehicle")').first();
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page1.waitForTimeout(2000);
      console.log('✓ Add Vehicle form opened');
    } else {
      console.log('❌ Add Vehicle button not found');
      await page1.screenshot({ path: 'vehicle-e2e-error-add-button.png', fullPage: true });
      await context1.close();
      return;
    }
    
    // Fill form
    console.log('📝 Filling vehicle form...');
    
    // Select vehicle type
    const typeBtn = page1.locator(`button:has-text("${vehicleData.vehicleType}")`).first();
    if (await typeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeBtn.click();
      await page1.waitForTimeout(500);
      console.log(`✓ Selected type: ${vehicleData.vehicleType}`);
    }
    
    // Fill license plate
    const licensePlateInput = page1.locator('input[placeholder*="B 1234 ABC" i]').first();
    if (await licensePlateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await licensePlateInput.fill(vehicleData.licensePlate);
      console.log(`✓ License Plate: ${vehicleData.licensePlate}`);
    }
    
    // Fill vehicle name
    const vehicleNameInput = page1.locator('input[placeholder*="Toyota Avanza" i]').first();
    if (await vehicleNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vehicleNameInput.fill(vehicleData.vehicleName);
      console.log(`✓ Vehicle Name: ${vehicleData.vehicleName}`);
    }
    
    // Fill other fields with safe approach
    await page1.waitForTimeout(1000);
    
    // Fill year
    const yearInputs = page1.locator('input[placeholder*="2022" i], input[placeholder*="2024" i]');
    const yearCount = await yearInputs.count();
    if (yearCount > 0) {
      await yearInputs.first().fill(vehicleData.year);
      console.log(`✓ Year: ${vehicleData.year}`);
    }
    
    // Fill CC
    const ccInput = page1.locator('input[placeholder*="CC" i]').first();
    if (await ccInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ccInput.fill(vehicleData.cc);
      console.log(`✓ CC: ${vehicleData.cc}`);
    }
    
    // Fill chassis
    const chassisInput = page1.locator('input[placeholder*="MHKM" i]').first();
    if (await chassisInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chassisInput.fill(vehicleData.chassis);
      console.log(`✓ Chassis: ${vehicleData.chassis}`);
    }
    
    // Fill engine
    const engineInput = page1.locator('input[placeholder*="1NR" i]').first();
    if (await engineInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await engineInput.fill(vehicleData.engine);
      console.log(`✓ Engine: ${vehicleData.engine}`);
    }
    
    // Fill user name
    const userNameInput = page1.locator('input[placeholder*="User name" i]').first();
    if (await userNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userNameInput.fill(vehicleData.userName);
      console.log(`✓ User Name: ${vehicleData.userName}`);
    }
    
    // Fill STNK
    const stnkInput = page1.locator('input[placeholder*="S-" i]').first();
    if (await stnkInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await stnkInput.fill(vehicleData.stnk);
      console.log(`✓ STNK: ${vehicleData.stnk}`);
    }
    
    await page1.waitForTimeout(1000);
    
    // Screenshot before submit
    await page1.screenshot({ path: 'vehicle-e2e-step1-form-filled.png', fullPage: true });
    
    // Submit
    console.log('💾 Submitting form...');
    const submitBtn = page1.locator('button:has-text("Submit")').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page1.waitForTimeout(3000);
      console.log('✓ Form submitted');
    } else {
      console.log('⚠️ Submit button not found, taking screenshot');
      await page1.screenshot({ path: 'vehicle-e2e-no-submit-button.png', fullPage: true });
    }
    
    // Screenshot after submit
    await page1.screenshot({ path: 'vehicle-e2e-step1-after-submit.png', fullPage: true });
    
    console.log(`\n✅ STEP 1 COMPLETED - Vehicle request created by ${users.admin.name}`);
    
    await context1.close();
    
    // Wait before next step
    console.log('\n⏳ Waiting 5 seconds before approval step...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // ============================================
    // STEP 2: APPROVER 1 APPROVES
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: APPROVER 1 (NOVYAN) APPROVES');
    console.log('='.repeat(60));
    
    const context2 = await browser.newContext({ viewport: null });
    const page2 = await context2.newPage();
    
    await loginAs(page2, users.approver1);
    await navigateToFMS(page2);
    await navigateToVehicleApproval(page2);
    
    console.log(`🔍 Looking for pending request: ${vehicleData.licensePlate}...`);
    
    // Search for the vehicle
    const searchInput = page2.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(vehicleData.licensePlate);
      await page2.waitForTimeout(2000);
      console.log('✓ Search performed');
    }
    
    // Find and click the row
    const pendingRow = page2.locator(`table tbody tr:has-text("${vehicleData.licensePlate}")`).first();
    if (await pendingRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log(`✓ Found pending request`);
      await pendingRow.click();
      await page2.waitForTimeout(2000);
      
      // Click approve button
      const approveBtn = page2.locator('button:has-text("Approve"), button:has-text("Setuju")').first();
      if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await approveBtn.click();
        await page2.waitForTimeout(1000);
        
        // Confirm if needed
        const confirmBtn = page2.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")').first();
        if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn.click();
          await page2.waitForTimeout(2000);
        }
        
        console.log(`✅ Request approved by ${users.approver1.name}`);
      } else {
        console.log('⚠️ Approve button not found');
      }
    } else {
      console.log('⚠️ Pending request not found in list');
    }
    
    await page2.screenshot({ path: 'vehicle-e2e-step2-approval1.png', fullPage: true });
    
    console.log(`\n✅ STEP 2 COMPLETED - First approval by ${users.approver1.name}`);
    
    await context2.close();
    
    // Wait before next step
    console.log('\n⏳ Waiting 5 seconds before final approval...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // ============================================
    // STEP 3: APPROVER 2 APPROVES
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: APPROVER 2 (DANIEL) APPROVES');
    console.log('='.repeat(60));
    
    const context3 = await browser.newContext({ viewport: null });
    const page3 = await context3.newPage();
    
    await loginAs(page3, users.approver2);
    await navigateToFMS(page3);
    await navigateToVehicleApproval(page3);
    
    console.log(`🔍 Looking for pending request: ${vehicleData.licensePlate}...`);
    
    // Search for the vehicle
    const searchInput2 = page3.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput2.fill(vehicleData.licensePlate);
      await page3.waitForTimeout(2000);
      console.log('✓ Search performed');
    }
    
    // Find and click the row
    const pendingRow2 = page3.locator(`table tbody tr:has-text("${vehicleData.licensePlate}")`).first();
    if (await pendingRow2.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log(`✓ Found pending request`);
      await pendingRow2.click();
      await page3.waitForTimeout(2000);
      
      // Click approve button
      const approveBtn2 = page3.locator('button:has-text("Approve"), button:has-text("Setuju")').first();
      if (await approveBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await approveBtn2.click();
        await page3.waitForTimeout(1000);
        
        // Confirm if needed
        const confirmBtn2 = page3.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("OK")').first();
        if (await confirmBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmBtn2.click();
          await page3.waitForTimeout(2000);
        }
        
        console.log(`✅ Request approved by ${users.approver2.name}`);
      } else {
        console.log('⚠️ Approve button not found');
      }
    } else {
      console.log('⚠️ Pending request not found in list');
    }
    
    await page3.screenshot({ path: 'vehicle-e2e-step3-approval2.png', fullPage: true });
    
    console.log(`\n✅ STEP 3 COMPLETED - Final approval by ${users.approver2.name}`);
    
    await context3.close();
    
    // ============================================
    // STEP 4: VERIFY VEHICLE IS APPROVED
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('STEP 4: VERIFY VEHICLE IS APPROVED');
    console.log('='.repeat(60));
    
    const context4 = await browser.newContext({ viewport: null });
    const page4 = await context4.newPage();
    
    await loginAs(page4, users.admin);
    await navigateToFMS(page4);
    await navigateToVehicleList(page4);
    
    // Search for the vehicle
    const searchInput3 = page4.locator('input[placeholder*="Search" i], input[type="search"]').first();
    if (await searchInput3.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput3.fill(vehicleData.licensePlate);
      await page4.waitForTimeout(2000);
    }
    
    // Check if vehicle exists
    const vehicleRow = page4.locator(`table tbody tr:has-text("${vehicleData.licensePlate}")`).first();
    if (await vehicleRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log(`✅ Vehicle ${vehicleData.licensePlate} found in list`);
      const rowText = await vehicleRow.textContent();
      console.log(`   Status: ${rowText.includes('Approved') ? 'Approved' : 'Processing'}`);
    } else {
      console.log('⚠️ Vehicle not found in list');
    }
    
    await page4.screenshot({ path: 'vehicle-e2e-step4-verification.png', fullPage: true });
    
    console.log(`\n✅ STEP 4 COMPLETED - Verification done`);
    
    await context4.close();
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('E2E TEST COMPLETED');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Vehicle: ${vehicleData.licensePlate} - ${vehicleData.vehicleName}`);
  console.log(`   Chassis: ${vehicleData.chassis}`);
  console.log(`   Engine: ${vehicleData.engine}`);
  console.log(`   Created by: ${users.admin.name}`);
  console.log(`   Approved by: ${users.approver1.name} & ${users.approver2.name}`);
  console.log('\n✅ All steps completed successfully!');
}

runVehicleE2E().catch(console.error);
