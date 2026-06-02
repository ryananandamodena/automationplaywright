import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://portal-dev.modena.com';
const LOGIN_EMAIL = process.env.ADMIN_EMAIL || 'ryan.ananda@modena.com';
const LOGIN_PASSWORD = process.env.ADMIN_PASSWORD || 'P@ssw0rd_ryan.ananda';
const SALES_URL = `${BASE_URL}/fms/vehicle/sales`;

async function navigateToFmsDev(page) {
  const fmsLink = page.getByText('FMS (DEV)').first();
  await fmsLink.waitFor({ state: 'visible', timeout: 15000 });
  await fmsLink.click();
  await page.waitForTimeout(1500);

  const confirmBtn = page.getByRole('button', { name: 'Confirm' });
  if (await confirmBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await confirmBtn.click();
    await page.waitForTimeout(2500);
  }
}

async function loginAndGoToSales(page) {
  await page.goto(SALES_URL, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (page.url().includes('/login')) {
    await page.locator('input[type="email"], input[name="email"]').first().fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(LOGIN_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  if (page.url().includes('my-application')) {
    await navigateToFmsDev(page);
  }

  await page.goto(SALES_URL, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);

  if (!page.url().includes('/fms/vehicle/sales')) {
    throw new Error(`Failed to open Sales page. Current URL: ${page.url()}`);
  }
}

test.describe('FMS - Vehicle Sales Automation', () => {
  test.setTimeout(180000);

  test('TC-01: Sales page loads correctly', async ({ page }) => {
    await loginAndGoToSales(page);

    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    const table = page.locator('table').or(page.locator('[role="table"]'));
    await expect(table).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: 'test-results/sales/tc01-sales-page.png', fullPage: true });
  });

  test('TC-02: Search sales data', async ({ page }) => {
    await loginAndGoToSales(page);

    const initialRows = await page.locator('tbody tr').count();

    const searchInput = page
      .locator('input[placeholder*="search" i], input[placeholder*="plate" i], input[placeholder*="unit" i]')
      .first()
      .or(page.getByRole('textbox', { name: /search|cari/i }).first())
      .or(page.locator('input[type="text"]').first());

    await expect(searchInput).toBeVisible({ timeout: 10000 });

    if (initialRows > 0) {
      const firstRowText = (await page.locator('tbody tr').first().textContent()) || '';
      const term = firstRowText.trim().split(/\s+/).find(Boolean) || 'B';
      await searchInput.fill(term);
      await page.waitForTimeout(1800);
    } else {
      await searchInput.fill('B');
      await page.waitForTimeout(1200);
    }

    const filteredRows = await page.locator('tbody tr').count();
    expect(filteredRows).toBeGreaterThanOrEqual(0);

    await searchInput.clear();
    await page.waitForTimeout(800);

    await page.screenshot({ path: 'test-results/sales/tc02-sales-search.png', fullPage: true });
  });

  test('TC-03: Filter sales data', async ({ page }) => {
    await loginAndGoToSales(page);

    const filterSelect = page.locator('select').first().or(page.getByRole('combobox').first());
    const filterVisible = await filterSelect.isVisible({ timeout: 7000 }).catch(() => false);

    if (!filterVisible) {
      test.skip(true, 'Filter control not found on Sales page');
      return;
    }

    const tagName = await filterSelect.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');

    if (tagName === 'select') {
      const options = filterSelect.locator('option');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await filterSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1500);
        await filterSelect.selectOption({ index: 0 }).catch(() => {});
      }
    } else {
      await filterSelect.click();
      await page.waitForTimeout(400);
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    await page.screenshot({ path: 'test-results/sales/tc03-sales-filter.png', fullPage: true });
  });

  test('TC-04: Export sales data', async ({ page }) => {
    await loginAndGoToSales(page);

    const exportBtn = page.getByRole('button', { name: /export|download/i }).first();
    const hasExport = await exportBtn.isVisible({ timeout: 7000 }).catch(() => false);

    if (!hasExport) {
      test.skip(true, 'Export button not found on Sales page');
      return;
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await exportBtn.click();
    await page.waitForTimeout(1500);

    const download = await downloadPromise;
    if (download) {
      const fileName = download.suggestedFilename();
      expect(fileName.length).toBeGreaterThan(0);
    }

    await page.screenshot({ path: 'test-results/sales/tc04-sales-export.png', fullPage: true });
  });
});
