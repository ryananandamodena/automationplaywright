import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://portal-dev.modena.com';
const LOGIN_EMAIL = process.env.ADMIN_EMAIL || 'ryan.ananda@modena.com';
const LOGIN_PASSWORD = process.env.ADMIN_PASSWORD || 'P@ssw0rd_ryan.ananda';
const SALES_FORM_URL = `${BASE_URL}/fms/vehicle/sales/form`;

// Helper function untuk login
async function performLogin(page) {
  console.log('Navigating to login page...');
  
  await page.goto(SALES_FORM_URL, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Cek apakah sudah di halaman login
  if (page.url().includes('/login')) {
    console.log('Login page detected. Logging in...');
    
    // Wait for inputs to be ready
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    // Fill email using evaluate
    await page.evaluate((email) => {
      const inputs = document.querySelectorAll('input');
      if (inputs.length > 0) {
        inputs[0].value = email;
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, LOGIN_EMAIL);
    
    // Fill password using evaluate
    await page.evaluate((password) => {
      const inputs = document.querySelectorAll('input');
      if (inputs.length > 1) {
        inputs[1].value = password;
        inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, LOGIN_PASSWORD);
    
    await page.waitForTimeout(1000);
    
    // Click sign in
    const signInBtn = page.getByRole('button', { name: 'Sign In' }).first();
    await signInBtn.click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  // Wait to see where we land after login
  await page.waitForTimeout(2000);
  
  // Cek apakah di halaman my-application
  const currentUrl = page.url();
  console.log(`After login, current URL: ${currentUrl}`);
  
  if (currentUrl.includes('my-application')) {
    console.log('My-application page detected. Navigating to FMS (DEV)...');
    
    // Find and click FMS (DEV) link
    const fmsLink = page.locator('text=FMS (DEV)').first()
      .or(page.locator('a:has-text("FMS (DEV)")').first())
      .or(page.locator('button:has-text("FMS (DEV)")').first());
    
    await fmsLink.waitFor({ state: 'visible', timeout: 15000 });
    await fmsLink.click();
    console.log('Clicked FMS (DEV) link');
    await page.waitForTimeout(2000);

    // Handle confirmation dialog if appears
    const confirmBtn = page.getByRole('button', { name: 'Confirm' })
      .or(page.locator('button:has-text("Confirm")'));
    
    const confirmVisible = await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (confirmVisible) {
      console.log('Confirmation dialog detected. Clicking Confirm...');
      await confirmBtn.click();
      await page.waitForTimeout(2500);
      console.log('Clicked Confirm button');
    }
    
    // Wait for FMS to load
    await page.waitForTimeout(2000);
  }

  console.log(`Login completed. Final URL: ${page.url()}`);
}

test.describe('Inspect Vehicle Sales Form Structure', () => {
  test.setTimeout(120000);

  test('INSPECT: Form structure and all input elements', async ({ page }) => {
    await performLogin(page);
    
    console.log('\n=== Navigate to Sales Form ===');
    await page.goto(SALES_FORM_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    console.log(`Current URL: ${page.url()}`);
    await page.screenshot({ path: 'test-results/inspect-form-full.png', fullPage: true });
    
    // Get all selects
    console.log('\n=== DROPDOWNS (SELECT) ===');
    const selects = await page.locator('select').all();
    console.log(`Found ${selects.length} dropdown(s)`);
    
    for (let i = 0; i < selects.length; i++) {
      const options = await selects[i].locator('option').all();
      const optionTexts = await Promise.all(options.map(opt => opt.textContent()));
      console.log(`\nDropdown ${i + 1}: ${options.length} options`);
      console.log(`  First 3 options: ${optionTexts.slice(0, 3).join(' | ')}`);
    }
    
    // Get all regular inputs
    console.log('\n=== INPUT FIELDS ===');
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input field(s)`);
    
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type') || 'text';
      const placeholder = await inputs[i].getAttribute('placeholder') || '';
      const name = await inputs[i].getAttribute('name') || '';
      const id = await inputs[i].getAttribute('id') || '';
      console.log(`  Input ${i + 1}: type="${type}", placeholder="${placeholder}", name="${name}", id="${id}"`);
    }
    
    // Get all textareas
    console.log('\n=== TEXTAREAS ===');
    const textareas = await page.locator('textarea').all();
    console.log(`Found ${textareas.length} textarea(s)`);
    
    for (let i = 0; i < textareas.length; i++) {
      const placeholder = await textareas[i].getAttribute('placeholder') || '';
      const name = await textareas[i].getAttribute('name') || '';
      console.log(`  Textarea ${i + 1}: placeholder="${placeholder}", name="${name}"`);
    }
    
    // Get all buttons
    console.log('\n=== BUTTONS ===');
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} button(s)`);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = (await buttons[i].textContent() || '').trim();
      if (text && !text.includes('\n') && text.length < 50) {
        console.log(`  Button ${i + 1}: "${text}"`);
      }
    }
    
    // Get all labels
    console.log('\n=== LABELS ===');
    const labels = await page.locator('label').all();
    console.log(`Found ${labels.length} label(s)`);
    
    for (let i = 0; i < Math.min(labels.length, 10); i++) {
      const text = (await labels[i].textContent() || '').trim();
      if (text && text.length < 100) {
        console.log(`  Label ${i + 1}: "${text}"`);
      }
    }
    
    console.log('\n=== INSPECTION COMPLETE ===');
    console.log('Check test-results/inspect-form-full.png for visual reference');
  });
});
