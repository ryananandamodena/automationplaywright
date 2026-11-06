// helpers/login.js - GCCS Login Helper (Self-Healed with Resilient Locators)

/**
 * Login ke GCCS sebagai sysadmin
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 * @param {string} password
 */
export async function loginGCCS(page, username = 'sysadmin', password = 'P@ssw0rd.1') {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Jika sudah login (di dashboard), langsung return
  if (page.url().includes('/dashboard')) return;

  // Isi form login dengan resilient locator
  const usernameInput = page.locator('#userName, input[name="userName"], input[name="username"], input[name="email"], input[type="email"], input[placeholder*="user" i], input[placeholder*="email" i], input[type="text"]').first();
  const passwordInput = page.locator('input[name="password"], input[type="password"], input[placeholder*="pass" i]').first();
  const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();

  if (await usernameInput.isVisible({ timeout: 10000 }).catch(() => false)) {
    await usernameInput.fill(username);
    await passwordInput.fill(password);
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }

  // Tunggu redirect ke dashboard jika belum di dashboard
  if (!page.url().includes('/dashboard')) {
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {});
  }
}

/**
 * Klik menu sidebar dengan JS (bypass overlay jika ada)
 * @param {import('@playwright/test').Page} page
 * @param {string} menuText
 */
export async function clickSidebarMenu(page, menuText) {
  await page.evaluate((text) => {
    const els = Array.from(document.querySelectorAll('a, div.menu, span, li'));
    const el = els.find(e => e.textContent.trim().toLowerCase() === text.toLowerCase());
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
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
}
