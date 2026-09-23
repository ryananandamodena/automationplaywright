import { test, expect } from '@playwright/test';
import { BASE_URL, PRODUCTS, login, addProductToCart, cartButton, fillDeliveryCheckout, confirmOrderModal } from './fixtures.js';

test.use({ baseURL: BASE_URL });

// Covers 03_e2e_test_cases.md: E2E-001 and E2E-003, verified end-to-end
// through checkout up to the Xendit payment redirect (see functional.checkout.spec.js
// for the checkout-page-specific assertions, and its file header for what is
// and isn't in scope re: actually completing a payment).
test.describe('E2E - Merchandise purchase flow', () => {
  test('E2E-001 guest can browse, open a PDP, and add to cart', async ({ page }) => {
    await page.goto('/products');
    await page.getByPlaceholder('Search products...').pressSequentially('Hoodie', { delay: 50 });
    await page.getByRole('heading', { name: PRODUCTS.hoodie.name }).click();
    await expect(page).toHaveURL(new RegExp(`/product/${PRODUCTS.hoodie.id}/?$`));

    const main = page.locator('main');
    await main.getByRole('button', { name: 'M', exact: true }).click();
    await main.getByRole('button', { name: 'Add to Cart', exact: true }).click();

    await expect(cartButton(page)).toHaveAccessibleName(/Shopping cart, [1-9]\d* items?/);
  });

  test('E2E-003 registered user: login, add to cart, update qty, view cart', async ({ page }) => {
    await login(page);
    await addProductToCart(page, { id: PRODUCTS.oversizeTee.id, size: 'L', qty: 1 });

    // Add a second unit of the same product from the PDP again to simulate qty update.
    await addProductToCart(page, { id: PRODUCTS.oversizeTee.id, size: 'L', qty: 1 });
    await expect(cartButton(page)).toHaveAccessibleName('Shopping cart, 2 items');

    // Add to Cart auto-opens the cart drawer — it's already open here, no
    // extra click needed (a redundant cart-icon click gets intercepted by
    // the drawer overlay and times out).
    // Cart drawer renders the item name as an h3 (PDP uses h1) — target the
    // level to avoid an ambiguous match across drawer/PDP/breadcrumb.
    await expect(page.getByRole('heading', { name: PRODUCTS.oversizeTee.name, level: 3 })).toBeVisible();

    // Verified live: "Proceed to Checkout" -> /checkout -> fill delivery
    // details -> "Place Order" -> confirm the "Konfirmasi Pesanan" modal ->
    // redirected to a real Xendit-hosted checkout page. We stop there — this
    // suite doesn't complete payment against the third-party staging gateway.
    await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout\/?$/);

    await fillDeliveryCheckout(page);
    await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    await expect(page.getByText('Konfirmasi Pesanan')).toBeVisible();
    await confirmOrderModal(page);
    await page.waitForURL(/checkout-staging\.xendit\.co/, { timeout: 15000 });
    await expect(page).toHaveURL(/checkout-staging\.xendit\.co/);

    // Confirm the order landed in order history as Waiting Payment
    // (FUNC-ORD-027) — go back via a fresh navigation since we're now on a
    // third-party origin.
    await page.goto(`${BASE_URL}/orders`);
    // Order cards have no unique class/test id; "hover:shadow-lg" is the one
    // class shared by every card div and nothing else on this page.
    const firstOrder = page.locator('main div[class*="hover:shadow-lg"]').filter({ hasText: 'Waiting Payment' }).first();
    await expect(firstOrder.getByText(PRODUCTS.oversizeTee.name)).toBeVisible();
  });
});
