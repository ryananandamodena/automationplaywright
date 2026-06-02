import { test, expect } from '@playwright/test';

test('Inspect Sales Order Page', async ({ page }) => {
  // Login first
  await page.goto('https://mhc-dev.modena.com');
  await page.waitForTimeout(2000);

  const emailField = page.locator('input[type="email"]');
  await emailField.fill('muhzaenal5@gmail.com');
  await page.waitForTimeout(500);

  const passwordField = page.locator('input[type="password"]');
  await passwordField.fill('P@ssw0rd');
  await page.waitForTimeout(500);

  const loginButton = page.locator("button:has-text('Login')");
  await loginButton.click();
  await page.waitForTimeout(4000);

  console.log('Logged in, waiting for dashboard...');

  // Wait for dashboard
  await page.locator('text=/Welcome|Dashboard/i').first().waitFor({ timeout: 10000 });

  // Click Sales Order menu
  const salesOrderMenu = page.locator('text="Sales Order"').first();
  await salesOrderMenu.click();
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());

  // Take screenshot
  await page.screenshot({ path: 'test-results/sales-order-page.png', fullPage: true });

  // Get all buttons
  const buttons = await page.locator('button').all();
  console.log('\n=== ALL BUTTONS ON SALES ORDER PAGE ===');
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();
    if (isVisible && text && text.trim()) {
      console.log(`Button ${i}: "${text.trim()}"`);
    }
  }

  // Get all links/anchors
  const links = await page.locator('a').all();
  console.log('\n=== ALL LINKS ON PAGE ===');
  for (let i = 0; i < links.length && i < 20; i++) {
    const text = await links[i].textContent();
    const isVisible = await links[i].isVisible();
    if (isVisible && text && text.trim()) {
      console.log(`Link ${i}: "${text.trim()}"`);
    }
  }

  // Check page content
  const bodyText = await page.locator('body').textContent();
  if (bodyText.includes('Sales Order') || bodyText.includes('Create') || bodyText.includes('New')) {
    console.log('\n✓ Page contains relevant keywords');
  }

  console.log('\nCheck screenshot: test-results/sales-order-page.png');
});
