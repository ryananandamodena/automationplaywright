import { test, expect } from '@playwright/test';

test('Login to portal-dev.modena.com and click FMS dev menu', async ({ page }) => {
  // Navigate to the login page
  await page.goto('https://portal-dev.modena.com/login');

  // Fill in the email
  await page.getByRole('textbox', { name: 'Enter your email' }).fill('ryan.ananda@modena.com');

  // Fill in the password
  await page.getByRole('textbox', { name: 'Enter your password' }).fill('P@ssw0rd_ryan.ananda');

  // Click the Sign In button
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();

  // Wait for navigation to dashboard or home page
  await page.waitForURL('**/dashboard**'); // Adjust if the URL pattern is different

  // Click on the FMS (DEV) menu
  await page.locator('div').filter({ hasText: /^FMSFMS \(DEV\)$/ }).nth(1).click();

  // Click Confirm if prompted
  await page.getByRole('button', { name: 'Confirm' }).click();

  // Assert that we are on the FMS page or some element is visible
  await expect(page).toHaveURL(/fms/); // Adjust URL pattern if needed
});