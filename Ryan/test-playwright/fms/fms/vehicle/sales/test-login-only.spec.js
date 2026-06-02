import { test, expect } from '@playwright/test';

test('Test MHC Login Only', async ({ page }) => {
  await page.goto('https://mhc-dev.modena.com');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('Initial URL:', page.url());

  // Fill email
  const emailField = page.locator('input[type="email"]');
  await emailField.fill('muhzaenal5@gmail.com');
  await page.waitForTimeout(500);

  // Fill password
  const passwordField = page.locator('input[type="password"]');
  await passwordField.fill('P@ssw0rd');
  await page.waitForTimeout(500);

  // Screenshot before clicking login
  await page.screenshot({ path: 'test-results/before-login-click.png', fullPage: true });

  // Click login
  const loginButton = page.locator("button:has-text('Login')");
  await loginButton.click();
  console.log('Login button clicked, waiting...');

  // Wait and see what happens
  await page.waitForTimeout(5000);
  
  console.log('After login URL:', page.url());

  // Check for any error messages
  const errorMessages = await page.locator('.error, .alert, [class*="error"], [class*="alert"]').all();
  console.log('\n=== ERROR MESSAGES ===');
  for (const error of errorMessages) {
    const text = await error.textContent();
    const isVisible = await error.isVisible();
    if (isVisible && text) {
      console.log('Error found:', text);
    }
  }

  // Get all visible text on page
  const bodyText = await page.locator('body').textContent();
  if (bodyText.toLowerCase().includes('invalid') || bodyText.toLowerCase().includes('incorrect')) {
    console.log('\n⚠️ Page contains "invalid" or "incorrect" text');
  }

  // Screenshot after login attempt
  await page.screenshot({ path: 'test-results/after-login-attempt.png', fullPage: true });

  console.log('\nCheck screenshots:');
  console.log('- test-results/before-login-click.png');
  console.log('- test-results/after-login-attempt.png');
});
