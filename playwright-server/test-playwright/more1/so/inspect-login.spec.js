import { test, expect } from '@playwright/test';

test('Inspect MHC Login Page', async ({ page }) => {
  await page.goto('https://mhc-dev.modena.com');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot of login page
  await page.screenshot({ path: 'test-results/mhc-login-page.png', fullPage: true });

  // Get all buttons
  const buttons = await page.locator('button').all();
  console.log('\n=== ALL BUTTONS ON PAGE ===');
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();
    console.log(`Button ${i}: "${text}" - Visible: ${isVisible}`);
  }

  // Get all inputs
  const inputs = await page.locator('input').all();
  console.log('\n=== ALL INPUTS ON PAGE ===');
  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type');
    const name = await inputs[i].getAttribute('name');
    const placeholder = await inputs[i].getAttribute('placeholder');
    console.log(`Input ${i}: type="${type}" name="${name}" placeholder="${placeholder}"`);
  }

  // Get page HTML
  const html = await page.content();
  console.log('\n=== Page has login form:', html.includes('login'), '===');
});
