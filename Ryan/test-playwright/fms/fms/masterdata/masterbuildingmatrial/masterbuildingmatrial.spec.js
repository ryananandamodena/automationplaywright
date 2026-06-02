import { test, expect } from '@playwright/test';

// Configure test to use Chromium only
test.use({ browserName: 'chromium' });

// Building Material Type test data - 10 records
const buildingMaterialData = [
  {
    code: 'BMT001',
    name: 'Concrete',
    description: 'Ready-mix concrete for structural construction',
    category: 'Structural',
    unit: 'M3',
    standardPrice: 1200000
  },
  {
    code: 'BMT002',
    name: 'Steel Rebar',
    description: 'Reinforcement steel bar for concrete structures',
    category: 'Structural',
    unit: 'KG',
    standardPrice: 15000
  },
  {
    code: 'BMT003',
    name: 'Steel Beam',
    description: 'I-beam and H-beam steel sections for structural support',
    category: 'Structural',
    unit: 'KG',
    standardPrice: 18000
  },
  {
    code: 'BMT004',
    name: 'Brick',
    description: 'Red clay brick for wall construction',
    category: 'Masonry',
    unit: 'PC',
    standardPrice: 1500
  },
  {
    code: 'BMT005',
    name: 'Cement',
    description: 'Portland cement for concrete and mortar mixing',
    category: 'Binding',
    unit: 'BAG',
    standardPrice: 75000
  },
  {
    code: 'BMT006',
    name: 'Sand',
    description: 'Fine sand for mortar and concrete mixing',
    category: 'Aggregate',
    unit: 'M3',
    standardPrice: 350000
  },
  {
    code: 'BMT007',
    name: 'Gravel',
    description: 'Coarse aggregate for concrete mixing',
    category: 'Aggregate',
    unit: 'M3',
    standardPrice: 450000
  },
  {
    code: 'BMT008',
    name: 'Roofing Sheet',
    description: 'Metal roofing sheet for building roof',
    category: 'Roofing',
    unit: 'M2',
    standardPrice: 85000
  },
  {
    code: 'BMT009',
    name: 'Glass Panel',
    description: 'Tempered glass panel for windows and facades',
    category: 'Glazing',
    unit: 'M2',
    standardPrice: 350000
  },
  {
    code: 'BMT010',
    name: 'Insulation',
    description: 'Thermal insulation material for walls and roof',
    category: 'Insulation',
    unit: 'M2',
    standardPrice: 125000
  }
];

// Categories for building materials
const categories = [
  'Structural',
  'Masonry',
  'Binding',
  'Aggregate',
  'Roofing',
  'Glazing',
  'Insulation',
  'Finishing',
  'Electrical',
  'Plumbing'
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
  'PC',
  'BAG',
  'ROLL'
];

test('Create 10 Building Material Type Records', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes timeout
  
  console.log('=== CREATE 10 BUILDING MATERIAL TYPE RECORDS ===');
  
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
  
  // Navigate directly to Building Material Type page
  await page.goto('https://portal-dev.modena.com/fms/master/building-material-type');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Get existing materials from table
  const existingCodes = [];
  const existingNames = [];
  try {
    await page.waitForSelector('table', { timeout: 5000 });
    const rows = await page.locator('table tbody tr').all();
    for (const row of rows) {
      try {
        // Try to get code from first column
        const code = await row.locator('td').first().textContent();
        if (code && code.trim()) {
          existingCodes.push(code.trim().toLowerCase());
        }
        
        // Try to get name from second column
        const name = await row.locator('td').nth(1).textContent();
        if (name && name.trim()) {
          existingNames.push(name.trim().toLowerCase());
        }
      } catch (e) {
        // Skip
      }
    }
    console.log(`Found ${existingCodes.length} existing building material types`);
  } catch (e) {
    console.log('Could not fetch existing materials');
  }
  
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];
  
  // Create 10 building material type records
  for (let i = 0; i < buildingMaterialData.length; i++) {
    const material = buildingMaterialData[i];
    
    // Check if code or name already exists
    if (existingCodes.includes(material.code.toLowerCase()) || existingNames.includes(material.name.toLowerCase())) {
      console.log(`⊘ Skipping ${material.code} - ${material.name} - already exists`);
      skipped++;
      continue;
    }
    
    console.log(`\nCreating building material type ${i + 1}/10: ${material.code} - ${material.name}`);
    
    // Click Add button - try multiple selectors
    try {
      const addButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
      await addButton.click();
      await page.waitForTimeout(1000);
    } catch (e) {
      // Try XPath as fallback
      await page.locator('//*[@id="root"]/div[1]/div[3]/main/div/div/div[1]/button').click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    
    try {
      // Fill material form
      const textboxes = await page.getByRole('textbox').all();
      
      // Fill Code
      if (textboxes.length > 0) {
        await textboxes[0].fill(material.code);
        await page.waitForTimeout(200);
      }
      
      // Fill Name
      if (textboxes.length > 1) {
        await textboxes[1].fill(material.name);
        await page.waitForTimeout(200);
      }
      
      // Fill Description
      const descField = page.getByRole('textbox', { name: /description/i });
      if (await descField.isVisible()) {
        await descField.fill(material.description);
        await page.waitForTimeout(200);
      } else if (textboxes.length > 2) {
        await textboxes[2].fill(material.description);
        await page.waitForTimeout(200);
      }
      
      // Select Category (combobox)
      const categoryCombo = page.getByRole('combobox', { name: /category/i });
      if (await categoryCombo.isVisible()) {
        await categoryCombo.click();
        await page.waitForTimeout(300);
        await categoryCombo.fill(material.category);
        await page.waitForTimeout(300);
        await categoryCombo.press('Enter');
        await page.waitForTimeout(200);
      }
      
      // Select Unit (combobox)
      const unitCombo = page.getByRole('combobox', { name: /unit/i });
      if (await unitCombo.isVisible()) {
        await unitCombo.click();
        await page.waitForTimeout(300);
        await unitCombo.fill(material.unit);
        await page.waitForTimeout(300);
        await unitCombo.press('Enter');
        await page.waitForTimeout(200);
      }
      
      // Fill Standard Price
      const priceField = page.getByRole('textbox', { name: /price|cost/i });
      if (await priceField.isVisible()) {
        await priceField.fill(material.standardPrice.toString());
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
          console.log(`✓ Building material type created: ${material.code} - ${material.name}`);
        } catch {
          // Check for error message
          const errorVisible = await page.locator('text=/error|failed|invalid|duplicate|already exists/i').isVisible({ timeout: 1000 }).catch(() => false);
          if (errorVisible) {
            const errorText = await page.locator('text=/error|failed|invalid|duplicate|already exists/i').first().textContent().catch(() => 'Unknown error');
            errors.push({ code: material.code, error: errorText });
            console.log(`✗ Failed to create: ${material.code} - ${errorText}`);
            failed++;
          } else {
            // Might have succeeded
            created++;
            console.log(`? Building material type possibly created: ${material.code}`);
          }
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    } catch (e) {
      failed++;
      errors.push({ code: material.code, error: e.message });
      console.log(`✗ Error creating building material type: ${e.message}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    
    await page.waitForTimeout(500);
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${buildingMaterialData.length}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Failed: ${failed}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.code}: ${e.error}`));
  }
});
