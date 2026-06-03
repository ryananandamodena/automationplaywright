import { test, expect } from '@playwright/test';
import { masterVehicleTestData, brandOptions } from './mastervehicle-test-data.js';

test('Create Master Vehicle Model - Batch', async ({ page }) => {
  // Navigate to portal login
  await page.goto('https://portal-dev.modena.com/login');
  await page.waitForLoadState('networkidle');
  
  // Check if login form is visible (not logged in yet)
  try {
    const emailVisible = await page.getByRole('textbox', { name: 'Enter your email' }).isVisible({ timeout: 5000 });
    if (emailVisible) {
      // Login process
      await page.getByRole('textbox', { name: 'Enter your email' }).fill('ryan.ananda@modena.com');
      await page.getByRole('textbox', { name: 'Enter your password' }).fill('P@ssw0rd_ryan.ananda');
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.waitForLoadState('networkidle');
    }
  } catch (e) {
    // Already logged in via storageState
    console.log('Already logged in or login form not visible');
  }
  
  // Wait for dashboard to load
  await page.waitForTimeout(2000);
  
  // Click on FMS (DEV) application
  try {
    // Try to find and click FMS (DEV) in the applications list
    const fmsDevCard = page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).first();
    await fmsDevCard.click({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Handle confirmation dialog
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForLoadState('networkidle');
    }
  } catch (e) {
    console.log('FMS (DEV) card not found or already in FMS');
  }
  
  // Wait for FMS to load
  await page.waitForTimeout(2000);
  
  // Navigate to Master Data > Master Vehicle Model
  await page.getByRole('button', { name: 'Master Data', exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole('link', { name: 'Master Vehicle Model' }).click();
  await page.waitForLoadState('networkidle');

  // Loop through each vehicle data
  for (const vehicle of masterVehicleTestData) {
    // Click Add Vehicle Model button
    await page.getByRole('button', { name: 'Add Vehicle Model' }).click();
    await page.waitForTimeout(500);

    // Select brand - react-select style
    // Click on the combobox to open dropdown
    await page.getByRole('combobox').click();
    await page.waitForTimeout(300);
    
    // Type to search and select the brand
    await page.getByRole('combobox').fill(vehicle.brand);
    await page.waitForTimeout(300);
    
    // Press Enter to select
    await page.getByRole('combobox').press('Enter');
    await page.waitForTimeout(300);

    // Fill vehicle name
    await page.getByRole('textbox', { name: 'Civic' }).fill(vehicle.name);

    // Fill vehicle type
    await page.getByRole('textbox', { name: 'Sedan' }).fill(vehicle.type);

    // Fill color
    await page.getByRole('textbox', { name: 'Merah' }).fill(vehicle.color);

    // Fill additional info with branch
    await page.getByRole('textbox', { name: 'Additional information about' }).fill(vehicle.additionalInfo);

    // Click Create Vehicle Model button
    await page.getByRole('button', { name: 'Create Vehicle Model' }).click();

    // Wait a bit for the creation to complete
    await page.waitForTimeout(500);
  }
});
