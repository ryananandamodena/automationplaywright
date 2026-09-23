import { test, expect } from '@playwright/test';
import { BASE_URL, loginCms } from './fixtures.js';

test.use({ baseURL: BASE_URL });

// UI coverage from 11_cms_admin_test_cases.md: CMS-NAV-001/002/005, CMS-DSH-005.
// All read-only.
test.describe('UI - CMS Layout', () => {
  test.beforeEach(async ({ page }) => {
    await loginCms(page);
  });

  test('CMS-NAV-001 active sidebar menu is visually highlighted', async ({ page }) => {
    // `hover:bg-white/10` (present on every inactive link) contains the
    // substring "bg-white" too — match the whole-word class token instead
    // of a loose substring so inactive links don't false-positive.
    const isActive = (locator) => locator.evaluate((el) => el.classList.contains('bg-white'));

    const dashboardLink = page.locator('nav a[href="/cms"]');
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page');
    expect(await isActive(dashboardLink)).toBe(true);

    await page.goto('/cms/products');
    const productsLink = page.locator('nav a[href="/cms/products"]');
    expect(await isActive(productsLink)).toBe(true);
    expect(await isActive(dashboardLink)).toBe(false);
  });

  test('CMS-NAV-002 mobile viewport shows hamburger menu, hides desktop sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    // Desktop sidebar is `hidden md:block` — shouldn't be visible at this width.
    await expect(page.locator('aside').first()).toBeHidden();
  });

  test('CMS-NAV-005 no uncaught JS errors on main CMS pages', async ({ page }) => {
    // Uncaught exceptions only — "Failed to load resource" console entries
    // are network-level (missing/aborted image requests), not app JS bugs,
    // and are already tracked separately as OBS/CMS-DSH-005 (broken images).
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    for (const path of ['/cms', '/cms/products', '/cms/orders', '/cms/stock', '/cms/roles']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    }
    expect(jsErrors, `Uncaught JS errors found: ${jsErrors.join('\n')}`).toEqual([]);
  });

  test('CMS-DSH-005 Low Stock Alert does not render visibly broken images', async ({ page }) => {
    await page.goto('/cms');
    await page.waitForLoadState('networkidle');
    // The heading's containing card (closest ancestor `div.bg-white`) is the
    // Low Stock Alert widget — its product thumbnails live inside it.
    // XPath's `ancestor::` axis lists root-first, so `[1]` would grab the
    // outermost match — `[last()]` is the nearest one (the actual card).
    // Explicit `./` anchors the xpath relative to the matched h2.
    const card = page.locator('h2', { hasText: 'Low Stock Alert' })
      .locator('xpath=./ancestor::div[contains(@class,"bg-white")][last()]');
    const lowStockImages = card.locator('img');
    const count = await lowStockImages.count();
    expect(count).toBeGreaterThan(0);

    // Collect every broken image before asserting, so one failure doesn't
    // hide the rest — useful when reporting this as a bug.
    const broken = [];
    for (let i = 0; i < count; i++) {
      const src = await lowStockImages.nth(i).getAttribute('src');
      if (!src) continue; // tracked separately — some products ship with no image URL at all
      const naturalWidth = await lowStockImages.nth(i).evaluate((img) => img.naturalWidth);
      if (naturalWidth === 0) broken.push(src);
    }
    expect(broken, `Broken image(s) found in Low Stock Alert:\n${broken.join('\n')}`).toEqual([]);
  });
});
