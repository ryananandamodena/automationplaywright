import { test, expect } from '@playwright/test';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';

test('Inspect Purchase Order Page', async ({ page }) => {
  // Login
  await page.goto(BASE_URL);
  await page.waitForTimeout(2000);

  await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
  await page.waitForTimeout(500);
  await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
  await page.waitForTimeout(500);
  await page.locator("button:has-text('Login')").click();
  await page.waitForTimeout(4000);

  // Wait for dashboard
  await page.locator('text=/Welcome|Dashboard/i').first().waitFor({ timeout: 10000 });
  console.log('✓ Login successful');

  // Go to Purchase Order
  console.log('Navigating to Purchase Order...');
  await page.locator('text="Purchase Order"').first().click();
  await page.waitForTimeout(3000);

  console.log('Current URL:', page.url());
  await page.screenshot({ path: 'test-results/po-list-page.png', fullPage: true });

  // Get all inputs
  const inputs = await page.locator('input').all();
  console.log('\n=== ALL INPUTS ON PO PAGE ===');
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

  // Get all table headers if table exists
  const headers = await page.locator('th').all();
  console.log('\n=== TABLE HEADERS ===');
  for (let i = 0; i < headers.length; i++) {
    const text = await headers[i].textContent();
    const isVisible = await headers[i].isVisible();
    if (isVisible && text && text.trim()) {
      console.log(`Header: "${text.trim()}"`);
    }
  }

  // Get table row count
  const rows = await page.locator('table tbody tr').all();
  console.log(`\nTable rows: ${rows.length}`);

  // Click Create New if exists
  const createBtn = page.locator("button:has-text('Create New')").or(
    page.locator("button:has-text('Create')")
  ).first();

  if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('\n--- Inspecting Create PO Form ---');
    await createBtn.click();
    await page.waitForTimeout(3000);

    console.log('Create form URL:', page.url());
    await page.screenshot({ path: 'test-results/po-create-form.png', fullPage: true });

    // Get all inputs in create form
    const formInputs = await page.locator('input').all();
    console.log('\n=== CREATE PO FORM INPUTS ===');
    for (let i = 0; i < formInputs.length; i++) {
      const type = await formInputs[i].getAttribute('type');
      const name = await formInputs[i].getAttribute('name');
      const placeholder = await formInputs[i].getAttribute('placeholder');
      const id = await formInputs[i].getAttribute('id');
      const isVisible = await formInputs[i].isVisible();
      if (isVisible) {
        console.log(`Input ${i}: type="${type}" name="${name}" placeholder="${placeholder}" id="${id}"`);
      }
    }

    // Get all selects
    const selects = await page.locator('select').all();
    console.log('\n=== SELECTS ===');
    for (let i = 0; i < selects.length; i++) {
      const name = await selects[i].getAttribute('name');
      const id = await selects[i].getAttribute('id');
      const isVisible = await selects[i].isVisible();
      if (isVisible) {
        console.log(`Select ${i}: name="${name}" id="${id}"`);
      }
    }

    // Get all visible buttons in create form
    const formButtons = await page.locator('button').all();
    console.log('\n=== CREATE PO FORM BUTTONS ===');
    for (let i = 0; i < formButtons.length; i++) {
      const text = await formButtons[i].textContent();
      const isVisible = await formButtons[i].isVisible();
      if (isVisible && text && text.trim()) {
        console.log(`Button: "${text.trim()}"`);
      }
    }
  } else {
    console.log('\n⚠ Create New button not found on PO page');
  }

  console.log('\nCheck screenshots in test-results/');
});
