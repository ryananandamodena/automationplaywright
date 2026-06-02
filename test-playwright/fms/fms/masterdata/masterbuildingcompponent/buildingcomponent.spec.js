import { test, expect } from '@playwright/test';

// Configure test to use Chromium only
test.use({ browserName: 'chromium' });

// Building Component test data - 10 records
const buildingComponentData = [
  {
    code: 'BC001',
    name: 'Foundation',
    description: 'Building foundation structure including footings and base plates',
    category: 'Structural',
    unit: 'M3',
    estimatedLifespan: 50,
    maintenanceInterval: 12
  },
  {
    code: 'BC002',
    name: 'Steel Column',
    description: 'Primary steel column structure for building support',
    category: 'Structural',
    unit: 'KG',
    estimatedLifespan: 40,
    maintenanceInterval: 6
  },
  {
    code: 'BC003',
    name: 'Roof Truss',
    description: 'Steel roof truss system for building roof support',
    category: 'Structural',
    unit: 'SET',
    estimatedLifespan: 35,
    maintenanceInterval: 12
  },
  {
    code: 'BC004',
    name: 'Wall Panel',
    description: 'Exterior wall panel system with insulation',
    category: 'Envelope',
    unit: 'M2',
    estimatedLifespan: 25,
    maintenanceInterval: 6
  },
  {
    code: 'BC005',
    name: 'Window Frame',
    description: 'Aluminum window frame with double glazing',
    category: 'Envelope',
    unit: 'UNIT',
    estimatedLifespan: 20,
    maintenanceInterval: 12
  },
  {
    code: 'BC006',
    name: 'Door System',
    description: 'Industrial door system with automatic operation',
    category: 'Envelope',
    unit: 'UNIT',
    estimatedLifespan: 15,
    maintenanceInterval: 6
  },
  {
    code: 'BC007',
    name: 'HVAC System',
    description: 'Heating, ventilation and air conditioning system',
    category: 'MEP',
    unit: 'SET',
    estimatedLifespan: 15,
    maintenanceInterval: 3
  },
  {
    code: 'BC008',
    name: 'Electrical Panel',
    description: 'Main electrical distribution panel',
    category: 'MEP',
    unit: 'UNIT',
    estimatedLifespan: 20,
    maintenanceInterval: 6
  },
  {
    code: 'BC009',
    name: 'Fire Suppression',
    description: 'Fire suppression system with sprinklers',
    category: 'Safety',
    unit: 'SET',
    estimatedLifespan: 25,
    maintenanceInterval: 12
  },
  {
    code: 'BC010',
    name: 'Floor Coating',
    description: 'Epoxy floor coating system for industrial use',
    category: 'Finishing',
    unit: 'M2',
    estimatedLifespan: 10,
    maintenanceInterval: 24
  }
];

// Categories for building components
const categories = [
  'Structural',
  'Envelope',
  'MEP',
  'Safety',
  'Finishing',
  'Civil',
  'Landscape'
];

// Units
const units = [
  'M2',
  'M3',
  'KG',
  'UNIT',
  'SET',
  'M',
  'LM',
  'PC'
];

test('Create 10 Building Component Records', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes timeout
  
  console.log('=== CREATE 10 BUILDING COMPONENT RECORDS ===');
  
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
  
  // Navigate directly to Building Component page
  await page.goto('https://portal-dev.modena.com/fms/master/building-component');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  let created = 0;
  let failed = 0;
  const errors = [];
  
  // Create 10 building component records
  for (let i = 0; i < buildingComponentData.length; i++) {
    const component = buildingComponentData[i];
    
    console.log(`\nCreating building component ${i + 1}/10: ${component.code} - ${component.name}`);
    
    // Click Add button - try multiple selectors
    try {
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
      await addButton.click();
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('Could not find Add button, trying alternative...');
      // Try XPath if needed
      await page.locator('//*[@id="root"]/div[1]/div[3]/main/div/div/div[1]/button').click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    
    try {
      // Fill component form
      const textboxes = await page.getByRole('textbox').all();
      
      // Fill Code
      if (textboxes.length > 0) {
        await textboxes[0].fill(component.code);
        await page.waitForTimeout(200);
      }
      
      // Fill Name
      if (textboxes.length > 1) {
        await textboxes[1].fill(component.name);
        await page.waitForTimeout(200);
      }
      
      // Fill Description
      const descField = page.getByRole('textbox', { name: /description/i });
      if (await descField.isVisible()) {
        await descField.fill(component.description);
        await page.waitForTimeout(200);
      } else if (textboxes.length > 2) {
        await textboxes[2].fill(component.description);
        await page.waitForTimeout(200);
      }
      
      // Select Category (combobox)
      const categoryCombo = page.getByRole('combobox', { name: /category/i });
      if (await categoryCombo.isVisible()) {
        await categoryCombo.click();
        await page.waitForTimeout(300);
        await categoryCombo.fill(component.category);
        await page.waitForTimeout(300);
        await categoryCombo.press('Enter');
        await page.waitForTimeout(200);
      }
      
      // Select Unit (combobox)
      const unitCombo = page.getByRole('combobox', { name: /unit/i });
      if (await unitCombo.isVisible()) {
        await unitCombo.click();
        await page.waitForTimeout(300);
        await unitCombo.fill(component.unit);
        await page.waitForTimeout(300);
        await unitCombo.press('Enter');
        await page.waitForTimeout(200);
      }
      
      // Fill Estimated Lifespan
      const lifespanField = page.getByRole('textbox', { name: /lifespan|life/i });
      if (await lifespanField.isVisible()) {
        await lifespanField.fill(component.estimatedLifespan.toString());
        await page.waitForTimeout(200);
      }
      
      // Fill Maintenance Interval
      const intervalField = page.getByRole('textbox', { name: /interval|maintenance/i });
      if (await intervalField.isVisible()) {
        await intervalField.fill(component.maintenanceInterval.toString());
        await page.waitForTimeout(200);
      }
      
      // Click Save button
      const saveButton = page.getByRole('button', { name: /save|create|submit/i }).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        try {
          // Wait for modal to close (success)
          await saveButton.waitFor({ state: 'hidden', timeout: 5000 });
          created++;
          console.log(`✓ Building component created: ${component.code} - ${component.name}`);
        } catch {
          // Check for error message
          const errorVisible = await page.locator('text=/error|failed|invalid|duplicate|already exists/i').isVisible({ timeout: 1000 }).catch(() => false);
          if (errorVisible) {
            const errorText = await page.locator('text=/error|failed|invalid|duplicate|already exists/i').first().textContent().catch(() => 'Unknown error');
            errors.push({ code: component.code, error: errorText });
            console.log(`✗ Failed to create: ${component.code} - ${errorText}`);
          } else {
            // Might have succeeded
            created++;
            console.log(`? Building component possibly created: ${component.code}`);
          }
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    } catch (e) {
      failed++;
      errors.push({ code: component.code, error: e.message });
      console.log(`✗ Error creating building component: ${e.message}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    
    await page.waitForTimeout(500);
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${buildingComponentData.length}`);
  console.log(`Created: ${created}`);
  console.log(`Failed: ${failed}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.code}: ${e.error}`));
  }
});

test('Create Building Component with Duplicate Code Handling', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes timeout
  
  console.log('=== CREATE BUILDING COMPONENT WITH DUPLICATE HANDLING ===');
  
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
  
  // Navigate directly to Building Component page
  await page.goto('https://portal-dev.modena.com/fms/master/building-component');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Get existing components from table
  const existingCodes = [];
  try {
    await page.waitForSelector('table', { timeout: 5000 });
    const rows = await page.locator('table tbody tr').all();
    for (const row of rows) {
      try {
        const code = await row.locator('td').first().textContent();
        if (code && code.trim()) {
          existingCodes.push(code.trim());
        }
      } catch (e) {
        // Skip
      }
    }
    console.log(`Found ${existingCodes.length} existing building components`);
  } catch (e) {
    console.log('Could not fetch existing components');
  }
  
  let created = 0;
  let skipped = 0;
  
  // Create building components with duplicate check
  for (let i = 0; i < buildingComponentData.length; i++) {
    const component = buildingComponentData[i];
    
    // Check if code already exists
    if (existingCodes.includes(component.code)) {
      console.log(`⊘ Skipping ${component.code} - already exists`);
      skipped++;
      continue;
    }
    
    console.log(`\nCreating building component ${i + 1}/10: ${component.code} - ${component.name}`);
    
    // Click Add button
    try {
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
      await addButton.click();
      await page.waitForTimeout(1000);
    } catch (e) {
      await page.locator('//*[@id="root"]/div[1]/div[3]/main/div/div/div[1]/button').click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    
    try {
      // Fill form
      const textboxes = await page.getByRole('textbox').all();
      
      if (textboxes.length > 0) await textboxes[0].fill(component.code);
      if (textboxes.length > 1) await textboxes[1].fill(component.name);
      
      const descField = page.getByRole('textbox', { name: /description/i });
      if (await descField.isVisible()) {
        await descField.fill(component.description);
      } else if (textboxes.length > 2) {
        await textboxes[2].fill(component.description);
      }
      
      // Save
      const saveButton = page.getByRole('button', { name: /save|create|submit/i }).first();
      await saveButton.click();
      
      try {
        await saveButton.waitFor({ state: 'hidden', timeout: 5000 });
        created++;
        console.log(`✓ Building component created: ${component.code}`);
      } catch {
        console.log(`✗ Failed to create: ${component.code}`);
        await page.keyboard.press('Escape');
      }
    } catch (e) {
      console.log(`✗ Error: ${e.message}`);
      await page.keyboard.press('Escape');
    }
    
    await page.waitForTimeout(500);
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${buildingComponentData.length}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
});
