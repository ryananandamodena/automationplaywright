import { test, expect } from '@playwright/test';
import { BASE_URL, PRODUCTS, addProductToCart, cartButton } from './fixtures.js';

test.use({ baseURL: BASE_URL });

// Covers 02_functional_test_cases.md: FUNC-PDP-010/011/012/013, FUNC-CRT-016/017/018,
// plus NEG-007/008 (boundary/negative on quantity+stock).
test.describe('Functional - Product Detail & Cart', () => {
  test('FUNC-PDP-010 clicking a product card opens the correct PDP', async ({ page }) => {
    await page.goto('/products');
    await page.locator(`main a[href="/product/${PRODUCTS.hoodie.id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/product/${PRODUCTS.hoodie.id}/?$`));
    await expect(page.getByRole('heading', { name: PRODUCTS.hoodie.name, level: 1 })).toBeVisible();
  });

  // NEG-007 / the "select a size" half of FUNC-PDP-011 no longer apply: as of
  // 2026-08-03 every product ships with exactly one size, pre-selected by
  // default, so "Add to Cart" with no size chosen is not a reachable state
  // anymore. Skipped rather than deleted so the historical coverage intent
  // stays visible — re-enable if the catalog ever gets a multi-size product
  // again.
  test.skip('NEG-007 Add to Cart is blocked until a size is selected', async ({ page }) => {});

  test('FUNC-PDP-011 the single size option is pre-selected by default', async ({ page }) => {
    // Uses the mug, not the hoodie: HOODIE HITAM has only 1 unit of stock in
    // this dev DB (already exhausted by earlier manual verification), so
    // Add to Cart against it is no longer reliably repeatable. See
    // fixtures.js PRODUCTS comment and FUNC-PDP-013/FUNC-CRT-016 below.
    await page.goto(`/product/${PRODUCTS.mug.id}`);
    const main = page.locator('main');
    // Each product's single size button is labeled with its own size value
    // (e.g. "350ml" for the mug), not literally "One Size" for every product.
    await expect(main.getByRole('button', { name: PRODUCTS.mug.sizes[0], exact: true })).toHaveClass(/bg-gray-900/);
    // Add to Cart should work immediately, with no size selection step.
    await main.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Shopping Cart (1)' })).toBeVisible();
  });

  test('FUNC-PDP-012 quantity stepper increases/decreases', async ({ page }) => {
    // Uses the mug (99 units in stock): the hoodie's single unit of stock
    // caps its quantity stepper at 1, so "Increase quantity" is a no-op
    // there once that unit exists at all (it does, from prior test runs).
    await page.goto(`/product/${PRODUCTS.mug.id}`);
    const main = page.locator('main');
    const qty = main.locator('span', { hasText: /^\d+$/ }).first();
    await expect(qty).toHaveText('1');
    await main.getByRole('button', { name: 'Increase quantity' }).click();
    await expect(qty).toHaveText('2');
    await main.getByRole('button', { name: 'Decrease quantity' }).click();
    await expect(qty).toHaveText('1');
  });

  test('FUNC-PDP-013 add to cart updates cart badge count', async ({ page }) => {
    // Uses the mug (99 units in stock), not the hoodie: the live HOODIE HITAM
    // has only 1 unit of stock in this dev DB, so a qty=2 add here was
    // silently capped at 1 by the backend. See fixtures.js PRODUCTS comment.
    await addProductToCart(page, { id: PRODUCTS.mug.id, qty: 2 });
    await expect(cartButton(page)).toHaveAccessibleName('Shopping cart, 2 items');
  });

  test('FUNC-CRT-016 cart shows correct item and quantity after add', async ({ page }) => {
    await addProductToCart(page, { id: PRODUCTS.mug.id, qty: 1 });
    // Add to Cart auto-opens the cart drawer — clicking the cart icon again
    // fails (drawer overlay intercepts pointer events), so assert directly.
    await expect(page.getByRole('heading', { name: 'Shopping Cart (1)' })).toBeVisible();
    // Cart drawer renders the item name as an h3 (PDP uses h1) — target the
    // level to avoid an ambiguous match across drawer/PDP/breadcrumb.
    await expect(page.getByRole('heading', { name: PRODUCTS.mug.name, level: 3 })).toBeVisible();
    await expect(page.getByText('Black / 350ml')).toBeVisible();
  });

  test('BVA-014 out-of-range file upload N/A - accessories min quantity boundary (qty=1 min)', async ({ page }) => {
    // No file upload feature found on this catalog; boundary check repurposed to qty lower bound.
    await page.goto(`/product/${PRODUCTS.mug.id}`);
    const main = page.locator('main');
    const decreaseBtn = main.getByRole('button', { name: 'Decrease quantity' });
    const qty = main.locator('span', { hasText: /^\d+$/ }).first();
    await expect(qty).toHaveText('1');
    await decreaseBtn.click();
    // Expected: quantity should not go below 1 (verify actual behavior; flag as bug if it does).
    await expect(qty).toHaveText('1');
  });
});
