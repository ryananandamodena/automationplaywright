import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

test.describe('MHC - Dashboard', () => {
  test.setTimeout(60000);

  test('Dashboard loads dan menampilkan widget utama', async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);
    await login(page);

    await page.goto('https://mhc-dev.modena.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const { bugs } = await checkPageLoaded(page, 'mhc-dev.modena.com');

    // Cek sidebar/nav menu tampil
    const sidebar = page.locator('aside, nav');
    await expect(sidebar.first()).toBeVisible({ timeout: 8000 });
    console.log('✓ Sidebar/nav visible');

    // Cek menu utama ada di sidebar
    const menuItems = ['Sales Order', 'Purchase Order', 'Delivery'];
    for (const menu of menuItems) {
      const item = page.locator(`text="${menu}"`).first();
      const visible = await item.isVisible({ timeout: 3000 }).catch(() => false);
      if (!visible) bugs.push(`Menu "${menu}" tidak ditemukan di sidebar`);
      else console.log(`✓ Menu "${menu}" visible`);
    }

    // Cek welcome message
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasWelcome = bodyText.toLowerCase().includes('welcome') || bodyText.toLowerCase().includes('dashboard');
    if (!hasWelcome) bugs.push('Welcome/Dashboard message tidak ditemukan');
    else console.log('✓ Welcome/Dashboard text found');

    // Cek console errors
    if (consoleErrors.length > 0) {
      console.log(`  ⚠ Console errors (${consoleErrors.length}): ${consoleErrors[0]}`);
    }

    if (bugs.length > 0) {
      console.error('BUGS DITEMUKAN:', bugs.join('; '));
    }
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
