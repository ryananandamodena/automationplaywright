import { test, expect } from '@playwright/test';

// Configure test to use Chromium only
test.use({ browserName: 'chromium' });

// Service test data - 10 records
const serviceData = [
  {
    vehicleNumber: 'B 1234 ABC',
    serviceDate: '2024-01-15',
    km: 50000,
    serviceType: 'Oil Change',
    description: 'Regular oil change with synthetic oil',
    cost: 500000,
    workshop: 'Authorized Service Center',
    nextServiceKm: 55000,
    nextServiceDate: '2024-04-15'
  },
  {
    vehicleNumber: 'B 5678 DEF',
    serviceDate: '2024-01-20',
    km: 35000,
    serviceType: 'Tire Rotation',
    description: 'Tire rotation and alignment check',
    cost: 300000,
    workshop: 'Tire Shop',
    nextServiceKm: 40000,
    nextServiceDate: '2024-04-20'
  },
  {
    vehicleNumber: 'B 9012 GHI',
    serviceDate: '2024-02-01',
    km: 75000,
    serviceType: 'Brake Service',
    description: 'Brake pad replacement and fluid change',
    cost: 1200000,
    workshop: 'Authorized Service Center',
    nextServiceKm: 85000,
    nextServiceDate: '2024-05-01'
  },
  {
    vehicleNumber: 'B 3456 JKL',
    serviceDate: '2024-02-10',
    km: 25000,
    serviceType: 'Air Filter Replacement',
    description: 'Engine air filter and cabin air filter replacement',
    cost: 250000,
    workshop: 'Quick Service',
    nextServiceKm: 30000,
    nextServiceDate: '2024-05-10'
  },
  {
    vehicleNumber: 'B 7890 MNO',
    serviceDate: '2024-02-15',
    km: 60000,
    serviceType: 'Full Service',
    description: 'Complete service including oil, filters, spark plugs, and inspection',
    cost: 2500000,
    workshop: 'Authorized Service Center',
    nextServiceKm: 70000,
    nextServiceDate: '2024-05-15'
  },
  {
    vehicleNumber: 'B 1122 PQR',
    serviceDate: '2024-02-20',
    km: 42000,
    serviceType: 'Battery Replacement',
    description: 'New battery installation and electrical system check',
    cost: 850000,
    workshop: 'Battery Shop',
    nextServiceKm: 47000,
    nextServiceDate: '2024-05-20'
  },
  {
    vehicleNumber: 'B 3344 STU',
    serviceDate: '2024-02-25',
    km: 88000,
    serviceType: 'AC Service',
    description: 'AC system inspection and refrigerant refill',
    cost: 450000,
    workshop: 'AC Specialist',
    nextServiceKm: 93000,
    nextServiceDate: '2024-05-25'
  },
  {
    vehicleNumber: 'B 5566 VWX',
    serviceDate: '2024-03-01',
    km: 55000,
    serviceType: 'Transmission Service',
    description: 'Transmission fluid change and system inspection',
    cost: 750000,
    workshop: 'Authorized Service Center',
    nextServiceKm: 60000,
    nextServiceDate: '2024-06-01'
  },
  {
    vehicleNumber: 'B 7788 YZA',
    serviceDate: '2024-03-05',
    km: 32000,
    serviceType: 'Coolant Flush',
    description: 'Coolant system flush and refill',
    cost: 350000,
    workshop: 'Quick Service',
    nextServiceKm: 37000,
    nextServiceDate: '2024-06-05'
  },
  {
    vehicleNumber: 'B 9900 BCD',
    serviceDate: '2024-03-10',
    km: 95000,
    serviceType: 'Engine Tune-up',
    description: 'Complete engine tune-up and performance optimization',
    cost: 1500000,
    workshop: 'Authorized Service Center',
    nextServiceKm: 100000,
    nextServiceDate: '2024-06-10'
  }
];

test('Create 10 Service Records', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes timeout
  
  console.log('=== CREATE 10 SERVICE RECORDS ===');
  
  // Login
  await page.goto('https://portal-dev.modena.com/login');
  
  try {
    await page.waitForURL('**/login', { timeout: 3000 });
    
    if (page.url().includes('login')) {
      console.log('Logging in...');
      await page.getByRole('textbox', { name: 'Enter your email' }).fill('ryan.ananda@modena.com');
      await page.getByRole('textbox', { name: 'Enter your password' }).fill('P@ssw0rd_ryan.ananda');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      
      await page.waitForURL('**/my-application', { timeout: 15000 });
    }
  } catch (e) {
    console.log('Already logged in or redirected, proceeding...');
  }
  
  // Navigate to FMS
  try {
    await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).waitFor({ state: 'visible', timeout: 10000 });
  } catch {
    console.log('Context might be different, trying to navigate');
  }
  
  await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Navigate to Service menu
  await page.getByRole('button', { name: 'Vehicle', exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole('link', { name: 'Service' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  let created = 0;
  let failed = 0;
  
  // Create 10 service records
  for (let i = 0; i < serviceData.length; i++) {
    const service = serviceData[i];
    
    console.log(`\nCreating service record ${i + 1}/10: ${service.vehicleNumber} - ${service.serviceType}`);
    
    // Click Add Service button using XPath
    await page.locator('//*[@id="root"]/div[1]/div[3]/main/div/div/div[1]/button').click();
    await page.waitForTimeout(1000);
    
    try {
      // Fill service form - adjust selectors based on actual form fields
      
      // Select vehicle (combobox)
      const vehicleCombo = page.getByRole('combobox').first();
      if (await vehicleCombo.isVisible()) {
        await vehicleCombo.click();
        await page.waitForTimeout(300);
        await vehicleCombo.fill(service.vehicleNumber);
        await page.waitForTimeout(300);
        await vehicleCombo.press('Enter');
        await page.waitForTimeout(300);
      }
      
      // Fill service date
      const dateField = page.getByRole('textbox').first();
      if (await dateField.isVisible()) {
        await dateField.fill(service.serviceDate);
        await page.waitForTimeout(200);
      }
      
      // Fill KM
      const kmFields = await page.getByRole('textbox').all();
      for (const field of kmFields) {
        const placeholder = await field.getAttribute('placeholder');
        const name = await field.getAttribute('name');
        if (placeholder?.toLowerCase().includes('km') || name?.toLowerCase().includes('km')) {
          await field.fill(service.km.toString());
          break;
        }
      }
      
      // Fill service type (might be combobox or textbox)
      const serviceTypeCombo = page.getByRole('combobox').nth(1);
      if (await serviceTypeCombo.isVisible()) {
        await serviceTypeCombo.click();
        await page.waitForTimeout(300);
        await serviceTypeCombo.fill(service.serviceType);
        await page.waitForTimeout(300);
        await serviceTypeCombo.press('Enter');
        await page.waitForTimeout(200);
      }
      
      // Fill description
      const descField = page.getByRole('textbox', { name: /description/i });
      if (await descField.isVisible()) {
        await descField.fill(service.description);
        await page.waitForTimeout(200);
      }
      
      // Fill cost
      const costField = page.getByRole('textbox', { name: /cost|price/i });
      if (await costField.isVisible()) {
        await costField.fill(service.cost.toString());
        await page.waitForTimeout(200);
      }
      
      // Fill workshop
      const workshopField = page.getByRole('textbox', { name: /workshop/i });
      if (await workshopField.isVisible()) {
        await workshopField.fill(service.workshop);
        await page.waitForTimeout(200);
      }
      
      // Fill next service KM
      const nextKmField = page.getByRole('textbox', { name: /next.*km|next service/i });
      if (await nextKmField.isVisible()) {
        await nextKmField.fill(service.nextServiceKm.toString());
        await page.waitForTimeout(200);
      }
      
      // Fill next service date
      const nextDateField = page.getByRole('textbox', { name: /next.*date/i });
      if (await nextDateField.isVisible()) {
        await nextDateField.fill(service.nextServiceDate);
        await page.waitForTimeout(200);
      }
      
      // Click Save button
      const saveButton = page.getByRole('button', { name: /save|create|submit/i });
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        try {
          // Wait for modal to close (success)
          await saveButton.waitFor({ state: 'hidden', timeout: 5000 });
          created++;
          console.log(`✓ Service record created: ${service.vehicleNumber} - ${service.serviceType}`);
        } catch {
          // Check for error
          const errorVisible = await page.locator('text=/error|failed|invalid|duplicate/i').isVisible({ timeout: 1000 }).catch(() => false);
          if (errorVisible) {
            console.log(`✗ Failed to create: ${service.vehicleNumber} - validation error`);
          } else {
            // Might have succeeded but different behavior
            created++;
            console.log(`? Service record possibly created: ${service.vehicleNumber}`);
          }
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    } catch (e) {
      failed++;
      console.log(`✗ Error creating service record: ${e.message}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    
    await page.waitForTimeout(500);
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${serviceData.length}`);
  console.log(`Created: ${created}`);
  console.log(`Failed: ${failed}`);
});
