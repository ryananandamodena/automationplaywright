import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://mhc-dev.modena.com';

// Helper generik untuk menu yang hanya perlu load check
async function smokeTestPage(page, url, urlPart, pageLabel) {
  const bugs = [];
  captureConsoleErrors(page);
  await login(page);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const { bugs: pageBugs } = await checkPageLoaded(page, urlPart);
  bugs.push(...pageBugs);

  const heading = page.locator('h1, h2, h3').first();
  const headingVisible = await heading.isVisible({ timeout: 5000 }).catch(() => false);
  if (!headingVisible) bugs.push(`Heading halaman ${pageLabel} tidak ditemukan`);
  else {
    const headingText = await heading.textContent().catch(() => '');
    console.log(`✓ ${pageLabel} - heading: "${headingText.trim()}"`);
  }

  const mainContent = page.locator('main, [class*="content"]').first();
  if (!await mainContent.isVisible({ timeout: 5000 }).catch(() => false))
    bugs.push(`Konten utama ${pageLabel} tidak ditemukan`);
  else console.log(`✓ ${pageLabel} - main content visible`);

  return bugs;
}

test.describe('MHC - Delivery', () => {
  test.setTimeout(60000);
  test('Delivery - load & elemen utama', async ({ page }) => {
    const bugs = await smokeTestPage(page, `${BASE}/delivery`, '/delivery', 'Delivery');

    // Cek tabel
    const table = page.locator('table').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel Delivery tidak ditemukan');
    else console.log('✓ Tabel Delivery visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

test.describe('MHC - Inventory Transfer', () => {
  test.setTimeout(60000);
  test('Inventory Transfer - load & elemen utama', async ({ page }) => {
    const bugs = await smokeTestPage(page, `${BASE}/inventory-transfer`, '/inventory-transfer', 'Inventory Transfer');

    const table = page.locator('table, [class*="list"]').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel Inventory Transfer tidak ditemukan');
    else console.log('✓ Tabel Inventory Transfer visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

test.describe('MHC - Operational Cost', () => {
  test.setTimeout(60000);
  test('Operational Cost - load & elemen utama', async ({ page }) => {
    const bugs = await smokeTestPage(page, `${BASE}/operational-cost`, '/operational-cost', 'Operational Cost');

    const table = page.locator('table, [class*="list"]').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel Operational Cost tidak ditemukan');
    else console.log('✓ Tabel Operational Cost visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

test.describe('MHC - Balance Inquiry', () => {
  test.setTimeout(60000);
  test('Balance Inquiry - load & elemen utama', async ({ page }) => {
    const bugs = await smokeTestPage(page, `${BASE}/balance-inquiry`, '/balance-inquiry', 'Balance Inquiry');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

test.describe('MHC - Withdrawal', () => {
  test.setTimeout(60000);
  test('Withdrawal - load & elemen utama', async ({ page }) => {
    const bugs = await smokeTestPage(page, `${BASE}/withdrawal`, '/withdrawal', 'Withdrawal');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

test.describe('MHC - Stock Ready', () => {
  test.setTimeout(60000);
  test('Stock Ready - load & elemen utama', async ({ page }) => {
    const bugs = await smokeTestPage(page, `${BASE}/stock-ready`, '/stock-ready', 'Stock Ready');

    // Stock Ready menggunakan card/product layout (bukan table)
    // Cek filter category atau product item muncul
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasContent = bodyText.length > 100 &&
      (bodyText.includes('Ready') || bodyText.includes('Item Group') ||
       bodyText.includes('Rp') || bodyText.includes('WH-') ||
       await page.locator('main > div > div, [class*="list"], [class*="grid"], [class*="card"]').count() > 0);

    if (!hasContent)
      bugs.push('Konten Stock Ready tidak ditemukan (card/grid/filter tidak muncul)');
    else console.log('✓ Stock Ready konten visible (card layout)');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

test.describe('MHC - PO Verification', () => {
  test.setTimeout(60000);
  test('PO Verification - load & elemen utama', async ({ page }) => {
    const bugs = await smokeTestPage(page, `${BASE}/purchase-stock-verification`, '/purchase-stock-verification', 'PO Verification');

    const table = page.locator('table, [class*="list"]').first();
    if (!await table.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel PO Verification tidak ditemukan');
    else console.log('✓ Tabel PO Verification visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
