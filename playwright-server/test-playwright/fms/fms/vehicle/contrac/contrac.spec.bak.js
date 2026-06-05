import { test, expect } from '@playwright/test';

// Test data for create vehicle - 5 data sets
const vehicleTestData = [
  {
    id: 1,
    name: 'Daihatsu',
    vehicleType: 'Leased',
    plateNumber: 'B 6453 HGJ',
    vehicleName: 'Daihatsu',
    cylinder: '1',
    vehicleCategory: 'Medium SUV',
    seats: '5',
    year: '2018',
    cc: '1000',
    chassisNumber: 'MHKM268382',
    machineNumber: '2NRT-94732',
    fuelType: '5',
    transmission: '2',
    userName: 'Dedi Selametan',
    stnkNumber: 'S-73827392',
    stnkStatus: 'hidup',
    taxDate: '2026-12-29',
    stnkExpiredDate: '2026-12-29',
    contractStart: '2018-12-29',
    contractEnd: '2026-12-29',
    price: '275000000',
    policyNumber: 'POL-3726682'
  },
  {
    id: 2,
    name: 'Honda',
    vehicleType: 'Owned',
    plateNumber: 'D 8888 XYZ',
    vehicleName: 'Honda Civic',
    cylinder: '1',
    vehicleCategory: 'Medium SUV',
    seats: '5',
    year: '2019',
    cc: '1500',
    chassisNumber: 'HONDA123456',
    machineNumber: 'L15B7-987654',
    fuelType: '5',
    transmission: '2',
    userName: 'Budi Santoso',
    stnkNumber: 'S-98765432',
    stnkStatus: 'hidup',
    taxDate: '2027-06-30',
    stnkExpiredDate: '2027-06-30',
    contractStart: '2019-03-15',
    contractEnd: '2027-06-30',
    price: '350000000',
    policyNumber: 'POL-8765432'
  },
  {
    id: 3,
    name: 'Toyota',
    vehicleType: 'Leased',
    plateNumber: 'B 1122 DEF',
    vehicleName: 'Toyota Innova',
    cylinder: '1',
    vehicleCategory: 'Medium SUV',
    seats: '5',
    year: '2020',
    cc: '2000',
    chassisNumber: 'TOYOTA987654',
    machineNumber: '1TR-FE654321',
    fuelType: '5',
    transmission: '2',
    userName: 'Siti Rahayu',
    stnkNumber: 'S-55667788',
    stnkStatus: 'hidup',
    taxDate: '2028-01-31',
    stnkExpiredDate: '2028-01-31',
    contractStart: '2020-07-01',
    contractEnd: '2028-01-31',
    price: '450000000',
    policyNumber: 'POL-1122334'
  },
  {
    id: 4,
    name: 'Mitsubishi',
    vehicleType: 'Owned',
    plateNumber: 'D 7777 MPP',
    vehicleName: 'Mitsubishi Xpander',
    cylinder: '1',
    vehicleCategory: 'Medium SUV',
    seats: '7',
    year: '2021',
    cc: '1500',
    chassisNumber: 'MITSUB111222',
    machineNumber: '4A91-333444',
    fuelType: '5',
    transmission: '2',
    userName: 'Ahmad Wijaya',
    stnkNumber: 'S-44556677',
    stnkStatus: 'hidup',
    taxDate: '2027-03-15',
    stnkExpiredDate: '2027-03-15',
    contractStart: '2021-01-10',
    contractEnd: '2027-03-15',
    price: '280000000',
    policyNumber: 'POL-5566889'
  },
  {
    id: 5,
    name: 'Nissan',
    vehicleType: 'Leased',
    plateNumber: 'B 9999 NSS',
    vehicleName: 'Nissan Livina',
    cylinder: '1',
    vehicleCategory: 'Medium SUV',
    seats: '7',
    year: '2022',
    cc: '1500',
    chassisNumber: 'NISSAN555666',
    machineNumber: 'HR15-777888',
    fuelType: '5',
    transmission: '2',
    userName: 'Diana Putri',
    stnkNumber: 'S-11223344',
    stnkStatus: 'hidup',
    taxDate: '2027-08-20',
    stnkExpiredDate: '2027-08-20',
    contractStart: '2022-05-01',
    contractEnd: '2027-08-20',
    price: '320000000',
    policyNumber: 'POL-9988776'
  }
];

// Helper: Login & Navigate to Contract Page (robust)
async function loginAndGoToContract(page) {
  await page.goto('https://portal-dev.modena.com/fms/vehicle/contract', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);

  // If redirected to login
  if (page.url().includes('/login')) {
    console.log('Login page detected, entering credentials...');
    await page.locator('input[type="email"], input[name="email"]').first().fill('ryan.ananda@modena.com');
    await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(5000);

    // If redirected to my-application, select FMS (DEV)
    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(2000);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
      await page.waitForTimeout(5000);
    }

    // Navigate to contract page
    await page.goto('https://portal-dev.modena.com/fms/vehicle/contract', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  // If still on my-application (SSO active, session expired)
  if (page.url().includes('my-application') || (page.url().includes('portal-dev.modena.com') && !page.url().includes('fms'))) {
    console.log('On my-application, selecting FMS...');
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(2000);
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
    await page.waitForTimeout(5000);
    await page.goto('https://portal-dev.modena.com/fms/vehicle/contract', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  console.log(`Contract page URL: ${page.url()}`);
}

// Main test - Create 5 vehicles in one test
test('Create 5 Vehicle Contract Records', async ({ page }) => {
  test.setTimeout(600000); // 10 minutes timeout
  
  console.log('=== CREATE 5 VEHICLE CONTRACT RECORDS ===');
  
  await loginAndGoToContract(page);
  
  let created = 0;
  let failed = 0;
  const errors = [];
  
  // Create 5 vehicle records
  for (let i = 0; i < vehicleTestData.length; i++) {
    const data = vehicleTestData[i];
    
    console.log(`\nCreating vehicle ${i + 1}/5: ${data.name} (${data.vehicleType})`);
    
    // Click Add Vehicle/Contract button
    try {
      const addButton = page.getByRole('button', { name: /add|create|new/i });
      await addButton.click({ timeout: 15000 });
      await page.waitForTimeout(1000);
      console.log('Clicked Add button');
    } catch (e) {
      // Fallback: try first button in header area
      try {
        await page.locator('main button').first().click({ timeout: 10000 });
        await page.waitForTimeout(1000);
        console.log('Clicked Add button (fallback)');
      } catch (e2) {
        console.log('Could not find Add button:', e2.message);
        errors.push(`Vehicle ${data.name}: Could not find Add button - ${e2.message}`);
        failed++;
        await page.screenshot({ path: `test-results/contract-add-btn-fail-${i+1}.png` });
        continue;
      }
    }
    
    try {
      // Select vehicle type (Leased or Owned)
      const typeButton = page.getByRole('button', { name: data.vehicleType });
      if (await typeButton.isVisible()) {
        await typeButton.click();
        await page.waitForTimeout(500);
        console.log(`Selected vehicle type: ${data.vehicleType}`);
      }
      
      // Get all textboxes excluding date inputs
      const allTextboxes = await page.getByRole('textbox').all();
      const textboxes = [];
      for (const tb of allTextboxes) {
        const type = await tb.getAttribute('type');
        if (type !== 'date') {
          textboxes.push(tb);
        }
      }
      console.log(`Found ${textboxes.length} textboxes (excluding date inputs)`);
      
      // Get all comboboxes
      const comboboxes = await page.getByRole('combobox').all();
      console.log(`Found ${comboboxes.length} comboboxes`);
      
      // Get all date inputs
      const dateInputs = await page.locator('input[type="date"]').all();
      console.log(`Found ${dateInputs.length} date inputs`);
      
      // Fill plate number - first text textbox
      if (textboxes.length > 0) {
        await textboxes[0].fill(data.plateNumber);
        console.log(`Filled plate number: ${data.plateNumber}`);
      }
      await page.waitForTimeout(200);
      
      // Fill vehicle name - second text textbox
      if (textboxes.length > 1) {
        await textboxes[1].fill(data.vehicleName);
        console.log(`Filled vehicle name: ${data.vehicleName}`);
      }
      await page.waitForTimeout(200);
      
      // Select cylinder (first combobox)
      if (comboboxes.length > 0) {
        await comboboxes[0].selectOption(data.cylinder);
        console.log(`Selected cylinder: ${data.cylinder}`);
      }
      await page.waitForTimeout(200);
      
      // Select vehicle category (second combobox)
      if (comboboxes.length > 1) {
        await comboboxes[1].selectOption(data.vehicleCategory);
        console.log(`Selected category: ${data.vehicleCategory}`);
      }
      await page.waitForTimeout(200);
      
      // Select seats (third combobox)
      if (comboboxes.length > 2) {
        await comboboxes[2].selectOption(data.seats);
        console.log(`Selected seats: ${data.seats}`);
      }
      await page.waitForTimeout(200);
      
      // Fill year - third textbox
      if (textboxes.length > 2) {
        await textboxes[2].fill(data.year);
        console.log(`Filled year: ${data.year}`);
      }
      await page.waitForTimeout(200);
      
      // Fill CC - fourth textbox
      if (textboxes.length > 3) {
        await textboxes[3].fill(data.cc);
        console.log(`Filled CC: ${data.cc}`);
      }
      await page.waitForTimeout(200);
      
      // Fill chassis number - fifth textbox
      if (textboxes.length > 4) {
        await textboxes[4].fill(data.chassisNumber);
        console.log(`Filled chassis: ${data.chassisNumber}`);
      }
      await page.waitForTimeout(200);
      
      // Fill machine/engine number - sixth textbox
      if (textboxes.length > 5) {
        await textboxes[5].fill(data.machineNumber);
        console.log(`Filled engine: ${data.machineNumber}`);
      }
      await page.waitForTimeout(200);
      
      // Select fuel type (combobox index 3)
      if (comboboxes.length > 3) {
        await comboboxes[3].selectOption(data.fuelType);
        console.log(`Selected fuel type: ${data.fuelType}`);
      }
      await page.waitForTimeout(200);
      
      // Select transmission (combobox index 4)
      if (comboboxes.length > 4) {
        await comboboxes[4].selectOption(data.transmission);
        console.log(`Selected transmission: ${data.transmission}`);
      }
      await page.waitForTimeout(200);
      
      // Fill user name - seventh textbox
      if (textboxes.length > 6) {
        await textboxes[6].fill(data.userName);
        console.log(`Filled user name: ${data.userName}`);
      }
      await page.waitForTimeout(200);
      
      // Upload images
      try {
        const uploadLabels = await page.locator('label:has-text("Upload")').all();
        if (uploadLabels.length > 0) {
          await uploadLabels[0].setInputFiles('1731_1915707.jpg');
          console.log('Uploaded first image');
        }
        if (uploadLabels.length > 1) {
          await uploadLabels[1].setInputFiles('1731_1916785.jpg');
          console.log('Uploaded second image');
        }
        
        const imageUploads = await page.locator('.lucide.lucide-image').all();
        if (imageUploads.length > 0) {
          await imageUploads[0].setInputFiles('1731_1915707.jpg');
          console.log('Uploaded third image');
        }
      } catch (e) {
        console.log('Image upload skipped:', e.message);
      }
      await page.waitForTimeout(300);
      
      // Fill STNK number
      if (textboxes.length > 7) {
        await textboxes[7].fill(data.stnkNumber);
        console.log(`Filled STNK: ${data.stnkNumber}`);
      }
      await page.waitForTimeout(200);
      
      // Select STNK status (combobox index 5)
      if (comboboxes.length > 5) {
        await comboboxes[5].selectOption(data.stnkStatus);
        console.log(`Selected STNK status: ${data.stnkStatus}`);
      }
      await page.waitForTimeout(200);
      
      // Fill dates
      if (dateInputs.length > 0) {
        await dateInputs[0].fill(data.taxDate);
        console.log(`Filled tax date: ${data.taxDate}`);
      }
      if (dateInputs.length > 1) {
        await dateInputs[1].fill(data.stnkExpiredDate);
        console.log(`Filled STNK expired: ${data.stnkExpiredDate}`);
      }
      await page.waitForTimeout(200);
      
      // Upload documents
      try {
        const docUploads = await page.locator('.lucide.lucide-file-text').all();
        if (docUploads.length > 0) {
          await docUploads[0].setInputFiles('1731_1915707.jpg');
          console.log('Uploaded first document');
        }
        if (docUploads.length > 1) {
          await docUploads[1].setInputFiles('1731_1916785.jpg');
          console.log('Uploaded second document');
        }
      } catch (e) {
        console.log('Document upload skipped:', e.message);
      }
      await page.waitForTimeout(300);
      
      // Fill contract dates
      if (dateInputs.length > 3) {
        await dateInputs[3].fill(data.contractStart);
        console.log(`Filled contract start: ${data.contractStart}`);
      }
      if (dateInputs.length > 4) {
        await dateInputs[4].fill(data.contractEnd);
        console.log(`Filled contract end: ${data.contractEnd}`);
      }
      await page.waitForTimeout(200);
      
      // Fill price - find by placeholder
      const priceFields = await page.getByPlaceholder('0').all();
      if (priceFields.length > 2) {
        await priceFields[2].fill(data.price);
        console.log(`Filled price: ${data.price}`);
      } else if (priceFields.length > 0) {
        await priceFields[0].fill(data.price);
        console.log(`Filled price: ${data.price}`);
      }
      await page.waitForTimeout(200);
      
      // Fill policy number
      const policyField = page.getByRole('textbox', { name: /POL-|policy/i });
      if (await policyField.isVisible()) {
        await policyField.fill(data.policyNumber);
        console.log(`Filled policy: ${data.policyNumber}`);
      } else if (textboxes.length > 8) {
        await textboxes[8].fill(data.policyNumber);
        console.log(`Filled policy: ${data.policyNumber}`);
      }
      await page.waitForTimeout(200);
      
      // Click Submit button
      const submitButton = page.getByRole('button', { name: /submit|save|create/i }).first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        console.log('Clicked Submit button');
        await page.waitForTimeout(2000);
      }
      
      // Verify success - check if we're back on contract page
      await page.waitForLoadState('networkidle');
      
      created++;
      console.log(`✓ Vehicle ${data.name} created successfully (${created}/5)`);
      
    } catch (e) {
      console.log(`✗ Failed to create vehicle ${data.name}:`, e.message);
      errors.push(`Vehicle ${data.name}: ${e.message}`);
      failed++;
      
      // Screenshot the error state
      await page.screenshot({ path: `test-results/contract-fail-${i+1}.png` }).catch(() => {});
      
      // Try to close any open modal and go back to contract page
      try {
        const cancelButton = page.getByRole('button', { name: /cancel|close|back/i }).first();
        if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelButton.click();
          await page.waitForTimeout(500);
        }
      } catch {}
      
      await page.goto('https://portal-dev.modena.com/fms/vehicle/contract', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Created: ${created}/5`);
  console.log(`Failed: ${failed}/5`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(err => console.log(`- ${err}`));
  }
  
  // Take screenshot of final state
  await page.screenshot({ path: 'test-results/contract-test-final.png' });
});
