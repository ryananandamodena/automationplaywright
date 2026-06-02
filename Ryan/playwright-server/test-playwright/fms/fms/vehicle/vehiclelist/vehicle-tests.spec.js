import { test, expect } from '@playwright/test';
import { vehicleTestData } from './vehicle-test-data.js';

// Helper function for login and navigation to add vehicle form
async function loginToFMS(page) {
  await page.goto('https://portal-dev.modena.com/login');
  await page.getByRole('textbox', { name: 'Enter your email' }).fill('ryan.ananda@modena.com');
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('P@ssw0rd._ryan.anand');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  
  // Wait for page to load completely
  await page.waitForLoadState('networkidle');
  
  // Click on the FMS (DEV) menu
  await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Vehicle' }).click();
  await page.getByRole('link', { name: 'Vehicle List' }).click();
  await page.getByRole('button', { name: 'Add Vehicle' }).click();
}

// Data-driven parameterized tests - 15 Positive Test Cases
// Convert to Playwright compatible format (test.each not supported, use forEach instead)
vehicleTestData.forEach((data) => {
  test(`Add ${data.vehicleType} vehicle - ${data.vehicleName} (Test Case #${data.id})`, async ({ page }) => {
    // Login and navigate to add vehicle form
    await loginToFMS(page);

    // Select vehicle type (Leased or Owned)
    await page.getByRole('button', { name: data.vehicleType }).click();

    // Fill vehicle details with dynamic data
    await page.getByRole('textbox', { name: 'B 1234 ABC' }).fill(data.licensePlate);
    await page.getByRole('textbox', { name: 'Toyota Avanza 1.3 CVT...' }).fill(data.vehicleName);
    await page.getByRole('combobox').first().selectOption(data.cylinder); // Cylinder
    await page.getByRole('textbox', { name: 'Toyota Avanza 1.3 CVT...' }).click(); // Enable next fields
    await page.getByRole('combobox').first().selectOption(data.cylinder); // Cylinder again
    await page.getByRole('combobox').nth(1).selectOption(data.type); // Type
    await page.getByRole('combobox').nth(2).selectOption(data.seats); // Seats
    await page.getByRole('textbox', { name: '2022' }).fill(data.year); // Year
    await page.getByRole('textbox', { name: 'CC' }).fill(data.cc); // CC
    await page.getByRole('textbox', { name: 'MHKM1BA3JNK123456' }).fill(data.chassis); // Chassis
    await page.getByRole('textbox', { name: '1NR-VE1234567' }).fill(data.engine); // Engine
    await page.getByRole('combobox').nth(3).selectOption(data.fuel); // Fuel
    await page.getByRole('combobox').nth(4).selectOption(data.transmission); // Transmission
    await page.getByRole('textbox', { name: 'User name' }).fill(data.userName); // User

    // Upload images
    await page.locator('label').filter({ hasText: 'Upload' }).first().setInputFiles('1731_1915707.jpg');
    await page.locator('label').filter({ hasText: 'Upload' }).nth(1).setInputFiles('1731_1916785.jpg');
    await page.locator('.lucide.lucide-image.mb-2').first().setInputFiles('1731_1915707.jpg');

  // Fill additional fields
  await page.getByRole('textbox', { name: 'S-' }).fill(data.stnk); // STNK
  await page.getByRole('combobox').nth(5).selectOption(data.status); // Status
  await page.locator('input[type="date"]').first().fill(data.taxDate); // Tax Date
  await page.locator('input[type="date"]').nth(1).fill(data.insuranceDate); // Insurance Date

  // Upload documents
  await page.locator('.lucide.lucide-file-text').first().setInputFiles('1731_1915707.jpg');
  await page.locator('.lucide.lucide-file-text').nth(1).setInputFiles('1731_1916785.jpg');

  // Fill more dates and amounts
  await page.locator('input[type="date"]').nth(3).fill(data.leaseStartDate); // Start date
  await page.locator('input[type="date"]').nth(4).fill(data.leaseEndDate); // End date
  await page.getByPlaceholder('0').nth(2).fill(data.amount); // Amount
  await page.getByRole('textbox', { name: 'POL-2024-' }).fill(data.policy); // Policy

  // Submit the form
  await page.getByRole('button', { name: 'Submit' }).click();

  // Assert success
  await page.waitForURL('**/vehicle');
  await expect(page).toHaveURL(/vehicle/);
  });
});
