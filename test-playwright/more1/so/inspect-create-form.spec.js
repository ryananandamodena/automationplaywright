import { test, expect } from '@playwright/test';

test('Inspect Create Sales Order Form', async ({ page }) => {
  // Login
  await page.goto('https://mhc-dev.modena.com');
  await page.waitForTimeout(2000);

  await page.locator('input[type="email"]').fill('muhzaenal5@gmail.com');
  await page.waitForTimeout(500);
  await page.locator('input[type="password"]').fill('P@ssw0rd');
  await page.waitForTimeout(500);
  await page.locator("button:has-text('Login')").click();
  await page.waitForTimeout(4000);

  // Wait for dashboard
  await page.locator('text=/Welcome|Dashboard/i').first().waitFor({ timeout: 10000 });

  // Go to Sales Order
  await page.locator('text="Sales Order"').first().click();
  await page.waitForTimeout(3000);

  // Click Create New
  await page.locator("button:has-text('Create New')").click();
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());

  // Screenshot
  await page.screenshot({ path: 'test-results/create-so-form.png', fullPage: true });

  // Get all inputs
  const inputs = await page.locator('input').all();
  console.log('\n=== ALL INPUTS ON CREATE SO FORM ===');
  for (let i = 0; i < inputs.length; i++) {
    const type = await inputs[i].getAttribute('type');
    const name = await inputs[i].getAttribute('name');
    const placeholder = await inputs[i].getAttribute('placeholder');
    const id = await inputs[i].getAttribute('id');
    const isVisible = await inputs[i].isVisible();
    if (isVisible) {
      console.log(`Input ${i}: type="${type}" name="${name}" placeholder="${placeholder}" id="${id}"`);
    }
  }

  // Get all selects
  const selects = await page.locator('select').all();
  console.log('\n=== ALL SELECTS ===');
  for (let i = 0; i < selects.length; i++) {
    const name = await selects[i].getAttribute('name');
    const id = await selects[i].getAttribute('id');
    const isVisible = await selects[i].isVisible();
    if (isVisible) {
      console.log(`Select ${i}: name="${name}" id="${id}"`);
    }
  }

  // Get all buttons
  const buttons = await page.locator('button').all();
  console.log('\n=== ALL BUTTONS ===');
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const isVisible = await buttons[i].isVisible();
    if (isVisible && text && text.trim()) {
      console.log(`Button: "${text.trim()}"`);
    }
  }

  console.log('\nCheck screenshot: test-results/create-so-form.png');
});
