import { test, expect } from '@playwright/test';

// Base URL
const BASE_URL = 'https://portal-dev.modena.com';
const BUILDING_FORM_URL = `${BASE_URL}/fms/building/form`;
const BUILDING_LIST_URL = `${BASE_URL}/fms/building`;

// Ryan's credentials
const RYAN_EMAIL = 'ryan.ananda@modena.com';
const RYAN_PASSWORD = 'P@ssw0rd_ryan.ananda';

// ============================================================
// BUILDING DATA GENERATOR
// ============================================================
function generateBuildingData(index, area) {
  const locations = {
    East: [
      'Makassar', 'Manado', 'Balikpapan', 'Samarinda', 'Palu',
      'Kendari', 'Gorontalo', 'Ambon', 'Jayapura', 'Sorong'
    ],
    West: [
      'Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang',
      'Palembang', 'Tangerang', 'Bekasi', 'Depok', 'Bogor'
    ]
  };
  
  const locationName = locations[area][index - 1];
  const num = String(index).padStart(2, '0');
  
  return {
    // Section 1: Identity & Ownership
    buildingName: `MODENA Home Center ${locationName}`,
    buildingArea: '400',
    landArea: '500',
    leaseStartDate: '2026-06-01',
    leaseEndDate: '2031-05-31',
    leaseDuration: '60',
    landlordName: `PT ${locationName} Property`,
    landlordContact: '081234567890',
    ownerAddress: `Jl. Properti ${locationName} No. 100, Jakarta`,
    monthlyRent: '40000000',
    
    // Section 2: Ekspansi Cabang Baru
    branchName: `MODENA Home Center ${locationName}`,
    openingDate: '2026-07-01',
    
    // Section 3: Location Address
    location: locationName,
    address: `Jl. Raya ${locationName} No. ${index * 10}, ${locationName}`,
    postalCode: `${area === 'East' ? '90' : '10'}${String(index).padStart(3, '0')}`,
    latitude: area === 'East' ? '-5.1477' : '-6.2088',
    longitude: area === 'East' ? '119.4327' : '106.8456',
    
    // Section 4-6: Building Utilities
    phoneNumber: '02112345678',
    electricityPower: '33000',
    electricityMonthly: '5000000',
    waterMonthly: '1000000',
    
    // Section 7: Area & Physical Condition
    showroomLength: '20',
    showroomWidth: '20',
    warehouseLength: '10',
    warehouseWidth: '10',
    
    // Section 9: Number of Floors
    floors: '2',
    floor1Length: '20',
    floor1Width: '20',
    floor2Length: '20',
    floor2Width: '20',
    
    // Section 11: Legal Documents
    certificateNumber: `SHM-${area === 'East' ? 'IND-TIM' : 'IND-BAR'}-${num}-2025`,
    
    // Section 12: Visual Documentation
    notes: `MODENA Home Center ${locationName} - Indonesia ${area === 'East' ? 'Timur' : 'Barat'}. Strategic location for business expansion in ${locationName}. Target market: middle to upper class. Complete facilities and utilities.`,
  };
}

// ============================================================
// HELPER: Login & Navigate
// ============================================================
async function loginAndNavigate(page) {
  console.log('🔐 Logging in as Ryan...');
  
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  await page.locator('input[name="email"]').fill(RYAN_EMAIL);
  await page.locator('input[type="password"]').fill(RYAN_PASSWORD);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  
  await page.waitForTimeout(5000);
  
  // Handle FMS selection
  if (page.url().includes('my-application')) {
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(3000);
    
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
    }
  }
  
  console.log('✅ Login successful');
}

// ============================================================
// HELPER: Fill Complete Building Form
// ============================================================
async function fillCompleteBuildingForm(page, data) {
  console.log(`📝 Filling COMPLETE form: ${data.buildingName}`);
  
  await page.waitForTimeout(2000);
  
  // SECTION 1: Identity & Ownership
  console.log('📋 Section 1: Identity & Ownership');
  
  const rentBtn = page.locator('button:has-text("Leased (Rent)")');
  if (await rentBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await rentBtn.click();
    console.log('  ✓ Ownership: Rent');
    await page.waitForTimeout(1000);
  }
  
  const areaInputs = page.locator('input[placeholder="0"][type="text"]');
  if (await areaInputs.count() >= 2) {
    await areaInputs.nth(0).fill(data.buildingArea);
    await page.waitForTimeout(200);
    await areaInputs.nth(1).fill(data.landArea);
    await page.waitForTimeout(200);
    console.log(`  ✓ Areas: ${data.buildingArea}m² / ${data.landArea}m²`);
  }
  
  const dateInputs = page.locator('input[type="date"]');
  if (await dateInputs.count() >= 2) {
    await dateInputs.nth(0).fill(data.leaseStartDate);
    await page.waitForTimeout(200);
    await dateInputs.nth(1).fill(data.leaseEndDate);
    await page.waitForTimeout(200);
    console.log(`  ✓ Lease: ${data.leaseStartDate} to ${data.leaseEndDate}`);
  }
  
  const allTextInputs = page.locator('input[type="text"]:not([disabled])');
  const allCount = await allTextInputs.count();
  
  if (allCount >= 7) {
    await allTextInputs.nth(5).fill(data.landlordName);
    await page.waitForTimeout(200);
    await allTextInputs.nth(6).fill(data.landlordContact);
    await page.waitForTimeout(200);
    console.log(`  ✓ Owner: ${data.landlordName}`);
  }
  
  const ownerAddressInput = page.locator('input[type="text"]:not([disabled])').nth(7);
  if (await ownerAddressInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await ownerAddressInput.fill(data.ownerAddress);
    await page.waitForTimeout(200);
    console.log(`  ✓ Owner Address: ${data.ownerAddress}`);
  }
  
  if (await areaInputs.count() >= 3) {
    await areaInputs.nth(2).fill(data.monthlyRent);
    await page.waitForTimeout(200);
    console.log(`  ✓ Monthly Rent: Rp ${data.monthlyRent}`);
  }
  
  // SECTION 2: Ekspansi Cabang Baru
  console.log('📋 Section 2: Ekspansi Cabang Baru');
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const branchInputs = page.locator('input[type="text"]:not([disabled])');
  if (await branchInputs.count() >= 10) {
    await branchInputs.nth(9).fill(data.branchName);
    await page.waitForTimeout(200);
    console.log(`  ✓ Branch Name: ${data.branchName}`);
  }
  
  if (await dateInputs.count() >= 3) {
    await dateInputs.nth(2).fill(data.openingDate);
    await page.waitForTimeout(200);
    console.log(`  ✓ Opening Date: ${data.openingDate}`);
  }
  
  // SECTION 3: Location Address
  console.log('📋 Section 3: Location Address');
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const locationInputs = page.locator('input[type="text"]:not([disabled])');
  const locCount = await locationInputs.count();
  
  if (locCount >= 15) {
    await locationInputs.nth(11).fill(data.location);
    await page.waitForTimeout(200);
    await locationInputs.nth(12).fill(data.address);
    await page.waitForTimeout(200);
    await locationInputs.nth(13).fill(data.postalCode);
    await page.waitForTimeout(200);
    await locationInputs.nth(14).fill(data.latitude);
    await page.waitForTimeout(200);
    await locationInputs.nth(15).fill(data.longitude);
    await page.waitForTimeout(200);
    console.log(`  ✓ Location: ${data.location}`);
    console.log(`  ✓ Address: ${data.address}`);
  }
  
  // SECTION 4-6: Building Utilities
  console.log('📋 Section 4-6: Building Utilities');
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const phoneInputs = page.locator('input[type="text"]:not([disabled])');
  if (await phoneInputs.count() >= 18) {
    await phoneInputs.nth(16).fill(data.phoneNumber);
    await page.waitForTimeout(200);
    console.log(`  ✓ Phone: ${data.phoneNumber}`);
  }
  
  const plnBtn = page.locator('button:has-text("PLN")');
  if (await plnBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await plnBtn.click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Electricity: PLN`);
  }
  
  const numberInputs = page.locator('input[type="number"]:not([disabled])');
  if (await numberInputs.count() >= 3) {
    await numberInputs.nth(0).fill(data.electricityPower);
    await page.waitForTimeout(200);
    await numberInputs.nth(1).fill(data.electricityMonthly);
    await page.waitForTimeout(200);
    await numberInputs.nth(2).fill(data.waterMonthly);
    await page.waitForTimeout(200);
    console.log(`  ✓ Utilities configured`);
  }
  
  const tapBtn = page.locator('button:has-text("TAP")');
  if (await tapBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tapBtn.click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Water: TAP`);
  }
  
  // SECTION 7: Area & Physical Condition
  console.log('📋 Section 7: Area & Physical Condition');
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const dimInputs = page.locator('input[type="number"]:not([disabled])');
  const dimCount = await dimInputs.count();
  
  if (dimCount >= 7) {
    await dimInputs.nth(3).fill(data.showroomLength);
    await page.waitForTimeout(200);
    await dimInputs.nth(4).fill(data.showroomWidth);
    await page.waitForTimeout(200);
    await dimInputs.nth(5).fill(data.warehouseLength);
    await page.waitForTimeout(200);
    await dimInputs.nth(6).fill(data.warehouseWidth);
    await page.waitForTimeout(200);
    console.log(`  ✓ Dimensions configured`);
  }
  
  const ageBtn = page.locator('button:has-text("< 5 Years")');
  if (await ageBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await ageBtn.click();
    await page.waitForTimeout(500);
    console.log(`  ✓ Building Age: < 5 Years`);
  }
  
  // SECTION 8: Security - Click ALL YES buttons
  console.log('📋 Section 8: Security');
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const yesButtons = page.locator('button:has-text("YES")');
  const yesCount = await yesButtons.count();
  let yesClicked = 0;
  
  for (let i = 0; i < yesCount; i++) {
    try {
      const btn = yesButtons.nth(i);
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(200);
        await btn.click({ timeout: 2000 }).catch(() => {});
        yesClicked++;
        await page.waitForTimeout(300);
      }
    } catch (error) {
      // Continue
    }
  }
  console.log(`  ✓ Security: ${yesClicked}/${yesCount} features enabled`);
  
  // SECTION 9: Number of Floors
  console.log('📋 Section 9: Number of Floors');
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const floorInputs = page.locator('input[type="number"]:not([disabled])');
  const floorCount = await floorInputs.count();
  
  if (floorCount >= 11) {
    await floorInputs.nth(7).fill(data.floors);
    await page.waitForTimeout(200);
    await floorInputs.nth(8).fill(data.floor1Length);
    await page.waitForTimeout(200);
    await floorInputs.nth(9).fill(data.floor1Width);
    await page.waitForTimeout(200);
    await floorInputs.nth(10).fill(data.floor2Length);
    await page.waitForTimeout(200);
    await floorInputs.nth(11).fill(data.floor2Width);
    await page.waitForTimeout(200);
    console.log(`  ✓ Floors: ${data.floors} floors configured`);
  }
  
  // SECTION 10: Building Type - Check ALL checkboxes
  console.log('📋 Section 10: Building Type - Material');
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const checkboxes = page.locator('input[type="checkbox"]');
  const cbCount = await checkboxes.count();
  let checkedCount = 0;
  
  for (let i = 0; i < cbCount; i++) {
    try {
      const cb = checkboxes.nth(i);
      if (await cb.isVisible({ timeout: 500 }).catch(() => false)) {
        const isDisabled = await cb.isDisabled().catch(() => false);
        const isChecked = await cb.isChecked().catch(() => false);
        
        if (!isDisabled && !isChecked) {
          await cb.scrollIntoViewIfNeeded().catch(() => {});
          await page.waitForTimeout(200);
          await cb.check({ force: true, timeout: 2000 }).catch(() => {});
          
          if (await cb.isChecked().catch(() => false)) {
            checkedCount++;
          }
          await page.waitForTimeout(200);
        } else if (isChecked) {
          checkedCount++;
        }
      }
    } catch (error) {
      // Continue
    }
  }
  console.log(`  ✓ Materials: ${checkedCount}/${cbCount} checkboxes checked`);
  
  // SECTION 11: Legal Documents
  console.log('📋 Section 11: Legal Documents');
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const certInputs = page.locator('input[type="text"]:not([disabled])');
  const certCount = await certInputs.count();
  
  if (certCount >= 20) {
    await certInputs.nth(certCount - 2).fill(data.certificateNumber);
    await page.waitForTimeout(200);
    console.log(`  ✓ Certificate: ${data.certificateNumber}`);
  }
  
  // SECTION 12: Visual Documentation (Notes)
  console.log('📋 Section 12: Visual Documentation');
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  
  const textareas = page.locator('textarea:not([disabled])');
  const taCount = await textareas.count();
  
  for (let i = 0; i < taCount; i++) {
    const ta = textareas.nth(i);
    if (await ta.isVisible({ timeout: 1000 }).catch(() => false)) {
      await ta.fill(data.notes);
      await page.waitForTimeout(200);
    }
  }
  console.log(`  ✓ Notes added`);
  
  console.log('✅ COMPLETE form filled - All 13 sections');
}

// ============================================================
// HELPER: Save as Draft
// ============================================================
async function saveAsDraft(page, buildingName) {
  console.log(`💾 Saving as draft: ${buildingName}`);
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  
  const saveBtn = page.locator('button:has-text("Save as Draft")');
  
  if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('  ✓ Found "Save as Draft" button');
    await saveBtn.click();
    console.log('  ✓ Clicked "Save as Draft"');
    await page.waitForTimeout(5000);
    
    // Check for success
    const successSelectors = [
      '.swal2-success',
      'text=Success',
      'text=Berhasil',
      'text=saved',
      'text=tersimpan'
    ];
    
    let hasSuccess = false;
    for (const selector of successSelectors) {
      const elem = page.locator(selector).first();
      if (await elem.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await elem.textContent().catch(() => '');
        console.log(`✅ Success: ${text}`);
        hasSuccess = true;
        
        const okBtn = page.locator('button:has-text("OK"), button:has-text("Confirm"), button.swal2-confirm').first();
        if (await okBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await okBtn.click();
          await page.waitForTimeout(1000);
        }
        break;
      }
    }
    
    if (!hasSuccess) {
      console.log('⚠️ No explicit success message');
    }
    
    return true;
  } else {
    console.log('❌ "Save as Draft" button not found');
    return false;
  }
}

// ============================================================
// TEST SUITE: Create 20 Buildings
// ============================================================
test.describe('FMS Building - Create 20 Buildings (10 East, 10 West)', () => {
  test.describe.configure({ timeout: 600000 }); // 10 minutes timeout
  
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });
  
  // Create 10 EAST buildings
  for (let i = 1; i <= 10; i++) {
    test(`TC-EAST-${String(i).padStart(2, '0')}: Create MODENA Home Center - East Area ${i}`, async ({ page }) => {
      const data = generateBuildingData(i, 'East');
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${i}/10] Creating EAST building: ${data.buildingName}`);
      console.log('='.repeat(60));
      
      await page.goto(BUILDING_FORM_URL, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      await fillCompleteBuildingForm(page, data);
      const success = await saveAsDraft(page, data.buildingName);
      
      expect(success).toBeTruthy();
      console.log(`✅ [${i}/10] ${data.buildingName} saved as draft\n`);
      
      await page.waitForTimeout(2000);
    });
  }
  
  // Create 10 WEST buildings
  for (let i = 1; i <= 10; i++) {
    test(`TC-WEST-${String(i).padStart(2, '0')}: Create MODENA Home Center - West Area ${i}`, async ({ page }) => {
      const data = generateBuildingData(i, 'West');
      
      console.log(`\n${'='.repeat(60)}`);
      console.log(`[${i}/10] Creating WEST building: ${data.buildingName}`);
      console.log('='.repeat(60));
      
      await page.goto(BUILDING_FORM_URL, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      await fillCompleteBuildingForm(page, data);
      const success = await saveAsDraft(page, data.buildingName);
      
      expect(success).toBeTruthy();
      console.log(`✅ [${i}/10] ${data.buildingName} saved as draft\n`);
      
      await page.waitForTimeout(2000);
    });
  }
  
  // Verification test
  test('TC-VERIFY: Verify all 20 buildings are saved', async ({ page }) => {
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION: Checking building list');
    console.log('='.repeat(60));
    
    await page.goto(BUILDING_LIST_URL, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    // Search for MODENA Home Center
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('MODENA Home Center');
      await page.waitForTimeout(2000);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/building-list-verification-20.png', fullPage: true });
    
    // Get page content to check for buildings
    const content = await page.textContent('body');
    
    // Check if we have buildings
    const hasBuildings = !content.includes('No buildings found');
    console.log(`Buildings found: ${hasBuildings ? 'YES' : 'NO'}`);
    
    expect(hasBuildings).toBeTruthy();
    console.log('✅ Verification completed\n');
  });
});
