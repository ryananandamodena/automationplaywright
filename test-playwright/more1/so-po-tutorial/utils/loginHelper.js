/**
 * Login Helper — Reusable login for MoRe application
 *
 * Handles: email + password + company selection + Sign In
 */

import { CREDENTIALS, BASE_URL } from './testData.js';

/**
 * Login to MoRe application with company selection.
 * @param {import('@playwright/test').Page} page
 */
export async function login(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Fill credentials
  await page.locator('input[name="email"]').fill(CREDENTIALS.email);
  await page.locator('input[type="password"]').fill(CREDENTIALS.password);

  // Select company from dropdown
  const companyBtn = page.locator('button:has-text("Select a company")');
  if (await companyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await companyBtn.click();
    await page.waitForTimeout(1000);
    await page.locator(`button:has-text("${CREDENTIALS.company}")`).click();
    await page.waitForTimeout(500);
  }

  // Click Sign In
  await page.locator('button:has-text("Sign In")').click();
  await page.waitForTimeout(3000);

  // Check if error modal/alert appeared
  const errorMsg = page.locator('.text-danger, .alert, [role="alert"], text="Email or password are incorrect!"').first();
  if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
    const txt = await errorMsg.textContent().catch(() => 'Invalid credentials');
    console.warn(`  ⚠️ Login response: ${txt.trim()}`);
  }

  // Wait for dashboard navigation
  await page.waitForSelector('aside, nav, header, [class*="sidebar"]', { timeout: 15000 }).catch(() => {});
  
  const currentUrl = page.url();
  console.log(`  ✓ Current URL after login: ${currentUrl}`);
  console.log('  ✅ Login flow finished');
}

/**
 * Click button inside a modal overlay via JS (overlay intercepts normal clicks).
 * @param {import('@playwright/test').Page} page
 * @param {string} buttonText — Exact text of the button
 */
export async function clickModalButton(page, buttonText) {
  await page.evaluate((text) => {
    const all = document.querySelectorAll('div');
    const modal = Array.from(all).find(d =>
      d.classList.contains('fixed') && d.classList.contains('inset-0') && d.style.display !== 'none'
    );
    const btns = (modal || document).querySelectorAll('button');
    const btn = Array.from(btns).find(b => b.textContent.trim() === text);
    if (btn) btn.click();
  }, buttonText);
  await page.waitForTimeout(1500);
}

/**
 * Click an item (div with border) inside a modal by partial text.
 * Used for selecting warehouse/option in Add to Order modal.
 * @param {import('@playwright/test').Page} page
 * @param {string} partialText
 */
export async function clickModalItemByText(page, partialText) {
  await page.evaluate((text) => {
    const all = document.querySelectorAll('div');
    const modal = Array.from(all).find(d =>
      d.classList.contains('fixed') && d.classList.contains('inset-0') && d.style.display !== 'none'
    );
    if (!modal) return;
    const items = modal.querySelectorAll('div[class*="border"][class*="rounded"]');
    const item = Array.from(items).find(d => d.textContent.includes(text));
    if (item) item.click();
  }, partialText);
  await page.waitForTimeout(500);
}

/**
 * Dismiss SweetAlert modals (confirmation/info dialogs).
 * @param {import('@playwright/test').Page} page
 */
export async function dismissSweetAlert(page) {
  const swal = page.locator('.swal2-container').first();
  if (await swal.isVisible({ timeout: 3000 }).catch(() => false)) {
    const confirmBtn = swal.locator('.swal2-confirm, button:has-text("OK"), button:has-text("Ya")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click({ force: true }).catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(1000);
  }
}

/**
 * Close Add to Order modal if it's stuck open.
 * @param {import('@playwright/test').Page} page
 */
export async function closeModalIfStuck(page) {
  const modal = page.locator('.fixed.inset-0').first();
  if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
    const cancelBtn = modal.locator("button:has-text('Cancel'), button:has-text('Close')").first();
    if (await cancelBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await cancelBtn.click({ force: true }).catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(1000);
  }
}
