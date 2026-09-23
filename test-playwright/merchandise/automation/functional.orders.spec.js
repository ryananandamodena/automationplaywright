import { test, expect } from '@playwright/test';
import { BASE_URL, PRODUCTS, login, addProductToCart, fillDeliveryCheckout, confirmOrderModal } from './fixtures.js';

test.use({ baseURL: BASE_URL });

// Covers 02_functional_test_cases.md: FUNC-ORD-027 (view history), FUNC-ORD-029 (cancel).
// Verified live: /orders lists every order as a card (order number, date,
// status badge, item thumbnails, shipping method) with status filter chips
// (All/Waiting Payment/Pending Approval/Preparing Order/Shipped/Ready for
// Pickup/Delivered/Picked Up/Cancelled). Orders in "Waiting Payment" show
// "Pay Now" (Xendit) + "Cancel Order"; manual-transfer ones show "Upload
// Payment Proof" + "Cancel Order" instead.
//
// "Cancel Order" triggers a native `window.confirm()` — Playwright
// auto-dismisses dialogs it isn't told to handle, which silently no-ops the
// cancel (this bit us during manual exploration: the click "succeeded" but
// the order stayed "Waiting Payment"). Always wire `page.on('dialog', ...)`
// before clicking Cancel Order.
//
// Order cards have no unique class or test id; the only structural anchor is
// the "hover:shadow-lg" class shared by every card div (the filter chips
// above them live in a different, non-matching container).
function orderCards(page) {
  return page.locator('main div[class*="hover:shadow-lg"]');
}

// Every test below requires a logged-in session (order placement + /orders
// are both behind auth). As of 2026-08-03 /login is Microsoft-SSO-only (see
// fixtures.js login()) and there is no test SSO account or auth-bypass route
// for this dev environment, so this whole suite skips at the describe level
// rather than calling login() and throwing. Un-skip once one of those exists.
test.describe.skip('Functional - Order Management (blocked: no test SSO account / auth bypass — see fixtures.js login())', () => {
  test('FUNC-ORD-027 order history lists a newly placed order as Waiting Payment', async ({ page }) => {
    await login(page);
    await addProductToCart(page, { id: PRODUCTS.hoodie.id, size: 'M', qty: 1 });
    await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
    await fillDeliveryCheckout(page);
    await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    await confirmOrderModal(page);
    await page.waitForURL(/checkout-staging\.xendit\.co/, { timeout: 15000 });

    await page.goto('/orders');
    await page.waitForLoadState('networkidle'); // OrdersList is an Astro island too
    const firstOrder = orderCards(page).filter({ hasText: 'Waiting Payment' }).first();
    await expect(firstOrder.getByText(PRODUCTS.hoodie.name)).toBeVisible();
    await expect(firstOrder.getByText('Waiting Payment')).toBeVisible();
  });

  test('FUNC-ORD-029 cancelling a Waiting Payment order requires confirming a native dialog', async ({ page }) => {
    await login(page);
    await addProductToCart(page, { id: PRODUCTS.hoodie.id, size: 'M', qty: 1 });
    await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
    await fillDeliveryCheckout(page);
    await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    await confirmOrderModal(page);
    await page.waitForURL(/checkout-staging\.xendit\.co/, { timeout: 15000 });

    await page.goto('/orders');
    await page.waitForLoadState('networkidle'); // OrdersList is an Astro island too
    const firstOrder = orderCards(page).filter({ hasText: 'Waiting Payment' }).first();

    page.once('dialog', (dialog) => dialog.accept());
    await firstOrder.getByRole('button', { name: 'Cancel Order' }).click();

    await expect(firstOrder.getByText('Cancelled')).toBeVisible();
  });

  test('FUNC-ORD-027 status filter narrows the order list to only that status', async ({ page }) => {
    await login(page);
    await page.goto('/orders');
    await page.getByRole('button', { name: 'Cancelled', exact: true }).click();

    const cards = orderCards(page);
    await expect(cards.first()).toContainText('Cancelled');
    // No card in the filtered view should belong to a different status.
    await expect(cards.filter({ hasText: 'Waiting Payment' })).toHaveCount(0);
    await expect(cards.filter({ hasText: 'Preparing Order' })).toHaveCount(0);
  });
});
