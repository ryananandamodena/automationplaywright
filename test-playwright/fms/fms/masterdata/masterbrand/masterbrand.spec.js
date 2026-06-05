import { test, expect } from '@playwright/test';

const brands = [
  'Mitsubishi',
  'Daihatsu',
  'Toyota',
  'Honda',
  'Suzuki',
  'Nissan',
  'Mazda',
  'Wuling',
  'Hyundai',
  'Kia',
  'Isuzu',
  'BMW',
  'Mercedes-Benz',
  'Lexus',
  'Audi',
  'Volkswagen',
  'Chevrolet',
  'Ford',
  'Peugeot',
  'DFSK',
  'Chery',
  'Subaru',
  'Volvo',
  'Jaguar',
  'Land Rover',
  'Porsche',
  'MINI',
  'Jeep',
  'Hino',
  'UD Trucks',
  'Scania',
  'MG',
  'Renault',
  'Citroen',
  'Geely',
  'BYD',
  'Great Wall',
  'Haval'
];

test('Add multiple brands dynamically', async ({ page }) => {
  test.setTimeout(1800000); // 30 minutes timeout for bulk data entry
  // Attempt to go to the dashboard or login page
  await page.goto('https://portal-dev.modena.com/login');
  
  // Check if we are still on the login page (i.e. session not saved or expired)
  try {
      // Wait a moment to see if it redirects or stays on login
      await page.waitForURL('**/login', { timeout: 3000 });
      
      // If we are on login page, perform login
      if (page.url().includes('login')) {
          console.log('Logging in...');
          await page.getByRole('textbox', { name: 'Enter your email' }).fill('ryan.ananda@modena.com');
          await page.getByRole('textbox', { name: 'Enter your password' }).fill('P@ssw0rd_ryan.ananda');
          await page.getByRole('button', { name: 'Sign In', exact: true }).click();
          
          await page.waitForURL('**/my-application', { timeout: 15000 });
          // Save state for future runs
          await page.context().storageState({ path: 'storageState.json' });
      }
  } catch (e) {
      console.log('Already logged in or redirected, proceeding...');
  }
  
  // Ensure we are in the app before proceeding
  try {
    await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).waitFor({ state: 'visible', timeout: 10000 });
  } catch {
     console.log('Context might be different, trying to navigate blindly');
  }
  
  await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  
  await page.getByRole('button', { name: 'Master Data' }).click();
  await page.getByRole('link', { name: 'Master Brand' }).click();
  
  // Create a unique set of brands to avoid duplicates in this run
  const uniqueBrands = [...new Set(brands)];
  
  for (let i = 0; i < uniqueBrands.length; i++) {
    const brandName = uniqueBrands[i];
    
    // Generate code dynamically: First 3 letters upper case + optional suffix for uniqueness
    // Example: MIT001, DAI002, CAM003
    const codePrefix = brandName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const codeSuffix = (i + 1).toString().padStart(3, '0');
    const brandCode = `${codePrefix}${codeSuffix}`;
    
    console.log(`Adding brand: ${brandName} with code: ${brandCode}`);
    
    await page.getByRole('button', { name: 'Add Brand' }).click();
    await page.waitForTimeout(1000); 
    
    const textboxes = page.getByRole('textbox');
    
    // Fill Brand Code (Assuming first input)
    await textboxes.nth(0).fill(brandCode);
    
    // Fill Brand Name (Assuming second input)
    await textboxes.nth(1).fill(brandName);
    
    // Fill Description (optional)
    await page.getByRole('textbox', { name: 'Brand description (optional)' }).fill(brandName);
    
    await page.getByRole('button', { name: 'Save Brand' }).click();
    
    // Check for success or error
    try {
        await page.getByRole('button', { name: 'Save Brand' }).waitFor({ state: 'hidden', timeout: 3000 });
    } catch {
        // If save button still visible, likely validation error or duplicate
        console.log(`Could not save ${brandName} (${brandCode}), possibly duplicate`);
        await page.keyboard.press('Escape'); // Close modal
    }
    await page.waitForTimeout(500);
  }
});