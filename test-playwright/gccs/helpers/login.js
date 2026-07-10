// helpers/login.js - GCCS Login Helper

/**
 * Login ke GCCS sebagai sysadmin
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @param {string} password
 */
export async function loginGCCS(page, username = 'sysadmin', password = 'P@ssw0rd.1') {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Jika sudah login (di dashboard), langsung return
  if (page.url().includes('/dashboard')) return;

  // Isi form login
  await page.fill('input[name="username"], input[type="text"]', username);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');

  // Tunggu redirect ke dashboard
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Klik menu sidebar dengan JS (bypass overlay jika ada)
 * @param {import('@playwright/test').Page} page
 * @param {string} menuText
 */
export async function clickSidebarMenu(page, menuText) {
  await page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll('a, div.menu, span'));
    const el = els.find(e => e.textContent.trim() === text);
    if (el) el.click();
  }, menuText);
  await page.waitForTimeout(1000);
}

/**
 * Navigasi langsung ke path tertentu
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 */
export async function navigateTo(page, path) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}
