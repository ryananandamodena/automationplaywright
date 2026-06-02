import { test, expect } from '@playwright/test';

// Data extracted from user request
const branches = [

  'Bali',
  'Makassar',
  'Surabaya',
  'Banjarmasin',
  'Yogyakarta',
  'Manado',
  'Palembang',
  'Bandung',
  'Semarang',
  'Pekanbaru',
  'HO - Brandcom',
  'HO - TS',
  'HO - CC',
  'Jakarta 1',
  'Head Office',
  'Pool (Ganjil)',
  'Surabaya Branch',
  'Denpasar Branch',
  'Makassar Branch',
  'Banjarmasin Branch',
  'Balikpapan Branch',
  'Kediri Branch',
  'Medan Branch',
  'Semarang Branch',
  'Yogyakarta Branch',
  'Jakarta Branch',
  'Bandung Branch'
];

test('Add multiple branches dynamically', async ({ page }) => {
  test.setTimeout(1800000); // 30 minutes timeout
  
  // Login Logic (Smart Login)
  await page.goto('https://portal-dev.modena.com/login');
  
  try {
      await page.waitForURL('**/login', { timeout: 3000 });
      if (page.url().includes('login')) {
          console.log('Logging in...');
          await page.getByRole('textbox', { name: 'Enter your email' }).fill('ryan.ananda@modena.com');
          await page.getByRole('textbox', { name: 'Enter your password' }).fill('P@ssw0rd_ryan.ananda');
          await page.getByRole('button', { name: 'Sign In', exact: true }).click();
          await page.waitForURL('**/my-application', { timeout: 15000 });
          await page.context().storageState({ path: 'storageState.json' });
      }
  } catch (e) {
      console.log('Already logged in or proceeding...');
  }
  
  // Navigate to FMS
  await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  
  // Navigate to Master Branch
  await page.getByRole('button', { name: 'Master Data', exact: true }).click();
  await page.getByRole('link', { name: 'Master Branch' }).click();
  
  const uniqueBranches = [...new Set(branches)];
  console.log('Total branches to add:', uniqueBranches.length);
  
  for (let i = 0; i < uniqueBranches.length; i++) {
    const branchName = uniqueBranches[i];
    
    // Generate code: First 3 letters uppercase + index
    const codePrefix = branchName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const codeSuffix = (i + 1).toString().padStart(3, '0');
    // Safe syntax without backticks
    const branchCode = codePrefix + codeSuffix;

    console.log('Adding branch: ' + branchName + ' (' + branchCode + ')');
    
    // Using standard selector
    await page.getByRole('button', { name: 'Add Branch' }).click();
    await page.waitForTimeout(1000); 

    const textboxes = page.getByRole('textbox');
    
    // Fill Branch Code (nth 0)
    await textboxes.nth(0).fill(branchCode);
    
    // Fill Branch Name (nth 1)
    await textboxes.nth(1).fill(branchName);
    
    // Fill Description/Other (nth 2 if exists)
    if (await textboxes.count() > 2) {
         await textboxes.nth(2).fill(branchName + ' Description');
    }

    // Updated selector for Save/Create button based on user feedback
    await page.locator('//*[@id="root"]/div[1]/div[3]/main/div/div/form/div[2]/button[2]').click();
    
    try {
        // Wait for modal to close or success message
        await page.locator('//*[@id="root"]/div[1]/div[3]/main/div/div/form/div[2]/button[2]').waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
        console.log('Could not save ' + branchName + ', possibly duplicate');
        await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(500);
  }
});