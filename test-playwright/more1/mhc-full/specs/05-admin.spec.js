import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://mhc-dev.modena.com';

test.describe('MHC - Profile', () => {
  test.setTimeout(60000);
  test('Profile - load & form profile visible', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);
    await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const { bugs: pageBugs } = await checkPageLoaded(page, '/profile');
    bugs.push(...pageBugs);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasProfile = /profile|nama|name|email/i.test(bodyText);
    if (!hasProfile) bugs.push('Konten profile tidak ditemukan');
    else console.log('✓ Profile content visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

test.describe('MHC - User Management', () => {
  test.setTimeout(60000);

  test('User List - load & tabel visible', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);
    await page.goto(`${BASE}/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const { bugs: pageBugs } = await checkPageLoaded(page, '/users');
    bugs.push(...pageBugs);

    const heading = page.locator('h1, h2').filter({ hasText: /user/i }).first();
    if (!await heading.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Heading "User" tidak ditemukan');
    else console.log('✓ Heading User visible');

    const table = page.locator('table').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel User tidak ditemukan');
    else console.log('✓ Tabel User visible');

    const createBtn = page.locator("button:has-text('Create'), button:has-text('Add User'), button:has-text('Tambah')").first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Tombol Create/Add User tidak ditemukan');
    else console.log('✓ Tombol Create User visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('User - buka form Create User', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const createBtn = page.locator("button:has-text('Create'), button:has-text('Add'), button:has-text('Tambah')").first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create User tidak ditemukan - mungkin tidak punya akses');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const isForm = /name|email|password|role/i.test(bodyText);
    if (!isForm) bugs.push('Form Create User tidak muncul atau tidak lengkap');
    else console.log('✓ Form Create User terbuka');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

test.describe('MHC - Role Management', () => {
  test.setTimeout(60000);

  test('Role List - load & tabel visible', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);
    await page.goto(`${BASE}/roles`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const { bugs: pageBugs } = await checkPageLoaded(page, '/roles');
    bugs.push(...pageBugs);

    const table = page.locator('table').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel Role tidak ditemukan');
    else console.log('✓ Tabel Role visible');

    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (!/role/i.test(bodyText)) bugs.push('Konten Role tidak ditemukan');
    else console.log('✓ Konten Role visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

test.describe('MHC - Sync SAP', () => {
  test.setTimeout(60000);

  test('Sync SAP - load & tombol sync visible', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);
    await page.goto(`${BASE}/sync-sap`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const { bugs: pageBugs } = await checkPageLoaded(page, '/sync-sap');
    bugs.push(...pageBugs);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (!/sync|sap/i.test(bodyText)) bugs.push('Konten Sync SAP tidak ditemukan');
    else console.log('✓ Konten Sync SAP visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
