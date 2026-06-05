import { test, expect } from '@playwright/test';

// Configure test to use Chromium only
test.use({ browserName: 'chromium' });

// Document Type test data - 10 records
const documentTypeData = [
  {
    code: 'DOC001',
    name: 'Invoice',
    description: 'Sales invoice document for billing purposes',
    category: 'Financial',
    requiredApproval: true,
    retentionPeriod: 7
  },
  {
    code: 'DOC002',
    name: 'Purchase Order',
    description: 'Purchase order document for procurement',
    category: 'Procurement',
    requiredApproval: true,
    retentionPeriod: 5
  },
  {
    code: 'DOC003',
    name: 'Delivery Note',
    description: 'Delivery note for goods shipment',
    category: 'Logistics',
    requiredApproval: false,
    retentionPeriod: 3
  },
  {
    code: 'DOC004',
    name: 'Contract',
    description: 'Legal contract document for agreements',
    category: 'Legal',
    requiredApproval: true,
    retentionPeriod: 10
  },
  {
    code: 'DOC005',
    name: 'Quotation',
    description: 'Price quotation document for customers',
    category: 'Sales',
    requiredApproval: false,
    retentionPeriod: 2
  },
  {
    code: 'DOC006',
    name: 'Receipt',
    description: 'Payment receipt document',
    category: 'Financial',
    requiredApproval: false,
    retentionPeriod: 5
  },
  {
    code: 'DOC007',
    name: 'Memo',
    description: 'Internal memorandum document',
    category: 'Internal',
    requiredApproval: false,
    retentionPeriod: 3
  },
  {
    code: 'DOC008',
    name: 'Report',
    description: 'Business report document',
    category: 'Internal',
    requiredApproval: true,
    retentionPeriod: 5
  },
  {
    code: 'DOC009',
    name: 'Certificate',
    description: 'Certification document for compliance',
    category: 'Compliance',
    requiredApproval: true,
    retentionPeriod: 10
  },
  {
    code: 'DOC010',
    name: 'Proposal',
    description: 'Business proposal document for projects',
    category: 'Sales',
    requiredApproval: true,
    retentionPeriod: 3
  }
];

// Categories for document types
const categories = [
  'Financial',
  'Procurement',
  'Logistics',
  'Legal',
  'Sales',
  'Internal',
  'Compliance',
  'HR',
  'Technical',
  'General'
];

test('Create 10 Document Type Records', async ({ page }) => {
  test.setTimeout(300000); // 5 minutes timeout
  
  console.log('=== CREATE 10 DOCUMENT TYPE RECORDS ===');
  
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
  
  // Navigate directly to Document Type page
  await page.goto('https://portal-dev.modena.com/fms/master/document-type');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Get existing document types from table
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
    console.log(`Found ${existingCodes.length} existing document types`);
  } catch (e) {
    console.log('Could not fetch existing document types');
  }
  
  let created = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];
  
  // Create 10 document type records
  for (let i = 0; i < documentTypeData.length; i++) {
    const docType = documentTypeData[i];
    
    // Check if code or name already exists
    if (existingCodes.includes(docType.code.toLowerCase()) || existingNames.includes(docType.name.toLowerCase())) {
      console.log(`⊘ Skipping ${docType.code} - ${docType.name} - already exists`);
      skipped++;
      continue;
    }
    
    console.log(`\nCreating document type ${i + 1}/10: ${docType.code} - ${docType.name}`);
    
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
      // Fill document type form
      const textboxes = await page.getByRole('textbox').all();
      
      // Fill Code
      if (textboxes.length > 0) {
        await textboxes[0].fill(docType.code);
        await page.waitForTimeout(200);
      }
      
      // Fill Name
      if (textboxes.length > 1) {
        await textboxes[1].fill(docType.name);
        await page.waitForTimeout(200);
      }
      
      // Fill Description
      const descField = page.getByRole('textbox', { name: /description/i });
      if (await descField.isVisible()) {
        await descField.fill(docType.description);
        await page.waitForTimeout(200);
      } else if (textboxes.length > 2) {
        await textboxes[2].fill(docType.description);
        await page.waitForTimeout(200);
      }
      
      // Select Category (combobox)
      const categoryCombo = page.getByRole('combobox', { name: /category/i });
      if (await categoryCombo.isVisible()) {
        await categoryCombo.click();
        await page.waitForTimeout(300);
        await categoryCombo.fill(docType.category);
        await page.waitForTimeout(300);
        await categoryCombo.press('Enter');
        await page.waitForTimeout(200);
      }
      
      // Check Required Approval (checkbox)
      if (docType.requiredApproval) {
        const approvalCheckbox = page.getByRole('checkbox', { name: /approval|required/i });
        if (await approvalCheckbox.isVisible()) {
          await approvalCheckbox.check();
          await page.waitForTimeout(200);
        }
      }
      
      // Fill Retention Period
      const retentionField = page.getByRole('textbox', { name: /retention|period/i });
      if (await retentionField.isVisible()) {
        await retentionField.fill(docType.retentionPeriod.toString());
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
          console.log(`✓ Document type created: ${docType.code} - ${docType.name}`);
        } catch {
          // Check for error message
          const errorVisible = await page.locator('text=/error|failed|invalid|duplicate|already exists/i').isVisible({ timeout: 1000 }).catch(() => false);
          if (errorVisible) {
            const errorText = await page.locator('text=/error|failed|invalid|duplicate|already exists/i').first().textContent().catch(() => 'Unknown error');
            errors.push({ code: docType.code, error: errorText });
            console.log(`✗ Failed to create: ${docType.code} - ${errorText}`);
            failed++;
          } else {
            // Might have succeeded
            created++;
            console.log(`? Document type possibly created: ${docType.code}`);
          }
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    } catch (e) {
      failed++;
      errors.push({ code: docType.code, error: e.message });
      console.log(`✗ Error creating document type: ${e.message}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    
    await page.waitForTimeout(500);
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total: ${documentTypeData.length}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Failed: ${failed}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  - ${e.code}: ${e.error}`));
  }
});
