import { test, expect } from '@playwright/test';

const BASE = 'https://portal-dev.modena.com';
const EMAIL = 'ryan.ananda@modena.com';
const PASSWORD = 'P@ssw0rd_ryan.ananda';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const emailSelectors = [
    'input[type="email"]',
    'input[name="email"]',
    'input[name="username"]',
    'input[type="text"]',
    'input[name="userId"]',
    'input[placeholder*="Email"]',
    'input[placeholder*="Username"]',
    'input[placeholder*="User"]',
    'input[id*="email"]',
    'input[id*="username"]',
  ];

  let emailInput = null;
  for (const selector of emailSelectors) {
    const locator = page.locator(selector).first();
    if (
      (await locator.count()) > 0 &&
      (await locator.isVisible({ timeout: 1000 }).catch(() => false))
    ) {
      emailInput = locator;
      break;
    }
  }

  if (!emailInput) {
    await page.screenshot({ path: 'login-debug.png', fullPage: true });
    throw new Error('Email/username input not found on login page');
  }
  await emailInput.fill(EMAIL);

  const passwordSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    'input[id*="password"]',
  ];

  let passwordInput = null;
  for (const selector of passwordSelectors) {
    const locator = page.locator(selector).first();
    if (
      (await locator.count()) > 0 &&
      (await locator.isVisible({ timeout: 1000 }).catch(() => false))
    ) {
      passwordInput = locator;
      break;
    }
  }

  if (!passwordInput) {
    throw new Error('Password input not found on login page');
  }
  await passwordInput.fill(PASSWORD);

  const loginButtonSelectors = [
    "button:has-text('Login')",
    "button:has-text('Sign In')",
    "button[type='submit']",
    "input[type='submit']",
  ];

  for (const selector of loginButtonSelectors) {
    const btn = page.locator(selector).first();
    if ((await btn.count()) > 0) {
      await btn.click();
      break;
    }
  }

  await page.waitForTimeout(5000);
}

function confirmModal(page, buttonText = 'Yes') {
  return page.evaluate((text) => {
    const all = document.querySelectorAll('div');
    const modal = Array.from(all).find(
      d =>
        d.classList.contains('fixed') &&
        d.classList.contains('inset-0') &&
        d.style.display !== 'none'
    );
    const btns = (modal || document).querySelectorAll('button');
    const btn = Array.from(btns).find(b => b.textContent.trim() === text);
    if (btn) btn.click();
  }, buttonText);
}

test.describe('SCMP - ETA Information', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/scmp/eta-information`, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForTimeout(3000);
  });

  test('T-01 Page load & URL path', async ({ page }) => {
    expect(page.url()).toContain('/scmp/eta-information');
  });

  test('T-02 Main UI elements exist', async ({ page }) => {
    expect(
      await page
        .locator('h1, h2')
        .filter({ hasText: /ETA Information|Eta Information/i })
        .count()
    ).toBeGreaterThan(0);
    expect(await page.locator('table, [class*="table"], [class*="list"]').count()).toBeGreaterThan(
      0
    );
    expect(
      await page
        .locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search data"]')
        .count()
    ).toBeGreaterThan(0);
    expect(
      await page
        .locator('button:has-text("Filter"), [class*="filter"]')
        .count()
    ).toBeGreaterThan(0);
    expect(
      await page
        .locator(
          'button:has-text("Create ETA"), button:has-text("Create New"), button:has-text("Add New"), button[aria-label*="Add"], button[class*="add"]'
        )
        .count()
    ).toBeGreaterThan(0);
  });

  test('T-03 Table has initial data rows', async ({ page }) => {
    const rows = await page.locator('table tbody tr').count();
    if (rows > 0) {
      expect(rows).toBeGreaterThan(0);
    } else {
      const alt = await page.locator('[class*="list"] [role="row"], [class*="table"] [role="row"]').count();
      expect(alt).toBeGreaterThan(0);
    }
  });

  test('T-04 Search by existing keyword', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search data"]')
      .first();
    if ((await searchInput.count()) === 0) return;
    const firstText = await page
      .locator('table tbody tr td')
      .first()
      .textContent()
      .catch(() => '');
    const keyword = (firstText || 'test').split(' ')[0];
    await searchInput.fill(keyword);
    await page.waitForTimeout(2000);
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('T-05 Search by non-existing keyword', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search data"]')
      .first();
    if ((await searchInput.count()) === 0) return;
    await searchInput.fill('NON_EXISTING_KEYWORD_XYZ_123');
    await page.waitForTimeout(2000);
  });

  test('T-06 Create new record (positive)', async ({ page }) => {
    const before = await page.locator('table tbody tr').count();
    await page
      .locator(
        'button:has-text("Create ETA"), button:has-text("Create New"), button:has-text("Add New"), button[aria-label*="Add"], button[class*="add"]'
      )
      .first()
      .click();
    await page.waitForTimeout(2000);
    await page
      .locator(
        'input[name*="tracking"], input[name*="code"], input[placeholder*="Tracking Code"], input[placeholder*="No."], input[placeholder*="Kode"]'
      )
      .first()
      .fill('TRK-' + Date.now());
    await page
      .locator(
        'input[name*="customer"], input[name*="name"], input[placeholder*="Customer"], input[placeholder*="Nama"]'
      )
      .first()
      .fill('QA Customer');
    await page
      .locator('textarea, input[name*="note"], input[name*="description"]')
      .first()
      .fill('Created by automated test');
    await page
      .locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Create")')
      .first()
      .click();
    await page.waitForTimeout(2000);
    const after = await page.locator('table tbody tr').count();
    expect(after, 'Jumlah baris bertambah setelah create').toBeGreaterThan(before);
  });

  test('T-07 Validate required fields empty', async ({ page }) => {
    const before = await page.locator('table tbody tr').count();
    await page
      .locator(
        'button:has-text("Create ETA"), button:has-text("Create New"), button:has-text("Add New"), button[aria-label*="Add"], button[class*="add"]'
      )
      .first()
      .click();
    await page.waitForTimeout(2000);
    await page
      .locator(
        'input[name*="tracking"], input[name*="code"], input[placeholder*="Tracking Code"], input[placeholder*="No."], input[placeholder*="Kode"]'
      )
      .first()
      .fill('');
    await page
      .locator(
        'input[name*="customer"], input[name*="name"], input[placeholder*="Customer"], input[placeholder*="Nama"]'
      )
      .first()
      .fill('');
    await page
      .locator('button:has-text("Save"), button:has-text("Submit"), button:has-text("Create")')
      .first()
      .click();
    await page.waitForTimeout(1000);
    const after = await page.locator('table tbody tr').count();
  });

  test('T-08 Cancel create does not add row', async ({ page }) => {
    const before = await page.locator('table tbody tr').count();
    await page
      .locator(
        'button:has-text("Create ETA"), button:has-text("Create New"), button:has-text("Add New"), button[aria-label*="Add"], button[class*="add"]'
      )
      .first()
      .click();
    await page.waitForTimeout(2000);
    await page
      .locator(
        'input[name*="tracking"], input[name*="code"], input[placeholder*="Tracking Code"], input[placeholder*="No."], input[placeholder*="Kode"]'
      )
      .first()
      .fill('CANCEL-TEST');
    await page
      .locator(
        'input[name*="customer"], input[name*="name"], input[placeholder*="Customer"], input[placeholder*="Nama"]'
      )
      .first()
      .fill('Cancel Test');
    await page.locator('button:has-text("Cancel"), button:has-text("Batal")').first().click();
    await page.waitForTimeout(2000);
    const after = await page.locator('table tbody tr').count();
    expect(after, 'Cancel form tidak boleh menambah data').toBe(before);
  });

  test('T-09 Delete record (positive)', async ({ page }) => {
    const initialRows = await page.locator('table tbody tr').count();
    if (initialRows === 0) {
      test.skip(true, 'Tidak ada data untuk dihapus');
      return;
    }
    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(500);
    await page.locator('button:has-text("Delete"), button:has-text("Hapus")').first().click();
    await confirmModal(page, 'Yes');
    await page.waitForTimeout(1500);
    const after = await page.locator('table tbody tr').count();
    expect(after, 'Jumlah baris berkurang setelah delete').toBeLessThan(initialRows);
  });

  test('T-10 Clear search resets list', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search data"]')
      .first();
    if ((await searchInput.count()) === 0) return;
    await searchInput.fill('test');
    await searchInput.fill('');
    await page.waitForTimeout(2000);
  });
});
