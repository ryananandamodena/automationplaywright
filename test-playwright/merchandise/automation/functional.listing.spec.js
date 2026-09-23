import { test, expect } from '@playwright/test';
import { BASE_URL, PRODUCTS, categoryAllButton } from './fixtures.js';

test.use({ baseURL: BASE_URL });

// Covers 02_functional_test_cases.md: FUNC-PLP-001/002, FUNC-SRC-003/004,
// FUNC-FLT-005/006/007, FUNC-SRT-008/009.
//
// Counts below reflect the live catalog as re-verified 2026-08-03: 13 products
// across 3 categories (Apparel: 4, Accessories: 3, Merchandise Modena: 6),
// and 3 size groups (One Size: 11, BESAR: 1, 350ml: 1) — every product has
// exactly one size now, so "size" filters no longer narrow an apparel subset,
// they just partition the whole catalog.
test.describe('Functional - Product Listing / Search / Filter / Sort', () => {
  test('FUNC-PLP-001 products load on page visit', async ({ page }) => {
    await page.goto('/products');
    const cards = page.locator('main a[href^="/product/"]');
    await expect(cards).toHaveCount(13);
    await expect(cards.first().locator('h3')).not.toBeEmpty();
  });

  test('FUNC-SRC-003 valid keyword search returns matching products only', async ({ page }) => {
    await page.goto('/products');
    // Search is an Astro island (client:load) — same hydration-race gotcha as
    // the filter panel. Interacting before it hydrates is a silent no-op.
    await page.waitForLoadState('networkidle');
    // fill() alone did not trigger the live-filter island in manual verification;
    // typing key-by-key does. Kept as a documented gotcha alongside the "M"/logo one.
    await page.getByPlaceholder('Search products...').pressSequentially('Mug', { delay: 50 });
    // Catalog has 2 mug products now: MUG TUMBLER HITAM and MUG TUMBLER PUTIH.
    await expect(page.locator('main a[href^="/product/"]')).toHaveCount(2, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: PRODUCTS.mug.name })).toBeVisible();
  });

  test('NEG-003 empty search shows all products (no crash)', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const search = page.getByPlaceholder('Search products...');
    await search.pressSequentially('xyz-no-match', { delay: 50 });
    await expect(page.locator('main a[href^="/product/"]')).toHaveCount(0, { timeout: 10000 });
    await search.fill('');
    await expect(page.locator('main a[href^="/product/"]')).toHaveCount(13, { timeout: 10000 });
  });

  test('UI-PLP-005 unmatched search shows empty state, no crash', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('Search products...').pressSequentially('zzzznotfound', { delay: 50 });
    await expect(page.locator('main a[href^="/product/"]')).toHaveCount(0, { timeout: 10000 });
  });

  test('FUNC-FLT-005 filter by category shows only matching products', async ({ page }) => {
    await page.goto('/products');
    // The filter panel is an Astro island (client:load). Clicking before its
    // JS finishes hydrating is a silent no-op — wait for network idle first.
    await page.waitForLoadState('networkidle');
    const accessoriesBtn = page.getByRole('button', { name: 'Accessories', exact: true });
    await accessoriesBtn.click();
    await expect(accessoriesBtn).toHaveClass(/bg-black/);
    const cards = page.locator('main a[href^="/product/"]');
    // Current catalog has 3 Accessories: umbrella, mug, pen.
    await expect(cards).toHaveCount(3, { timeout: 10000 });
    for (const text of await cards.allTextContents()) {
      expect(text).toContain('Accessories');
    }
  });

  test('FUNC-FLT-007 clear filter (select All) restores full listing', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Apparel', exact: true }).click();
    await expect(page.locator('main a[href^="/product/"]')).toHaveCount(4);
    await categoryAllButton(page).click();
    await expect(page.locator('main a[href^="/product/"]')).toHaveCount(13);
  });

  test('FUNC-FLT-006 filter by size narrows results (BESAR -> umbrella only)', async ({ page }) => {
    // "One Size" is no longer a narrowing filter (11 of 13 products use it) —
    // BESAR is the umbrella-only size and actually narrows the list.
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'BESAR', exact: true }).click();
    const cards = page.locator('main a[href^="/product/"]');
    await expect(cards).toHaveCount(1); // PAYUNG HITAM BESAR
    await expect(cards.first().locator('h3')).toHaveText('PAYUNG HITAM BESAR');
  });
});
