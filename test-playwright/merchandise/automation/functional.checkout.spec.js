import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  PRODUCTS,
  login,
  addProductToCart,
  fillDeliveryCheckout,
  confirmOrderModal,
} from './fixtures.js';

test.use({ baseURL: BASE_URL });

// Covers 02_functional_test_cases.md: FUNC-CKO-022/023/024/025, FUNC-PAY-026.
// Verified live 2026-07-30: Proceed to Checkout -> /checkout renders shipping
// method (Pickup/Delivery), courier + address (Delivery only), payment method
// (Xendit default / Bank Transfer Manual), and an order summary with a
// "Place Order" submit. Submitting opens a "Konfirmasi Pesanan" modal; only
// after confirming there does the app create the order server-side and
// redirect to a real Xendit-hosted checkout page (checkout-staging.xendit.co).
//
// IMPORTANT: these tests stop at the Xendit redirect and do NOT complete an
// actual payment against the third-party staging gateway — that's out of
// scope for this suite (and would require Xendit test-card/VA details).
//
// Every test below requires a logged-in session to reach checkout at all. As
// of 2026-08-03 /login is Microsoft-SSO-only (see fixtures.js login()) and
// there is no test SSO account or auth-bypass route for this dev
// environment, so this whole suite skips at the describe level rather than
// calling login() and throwing. Un-skip once one of those exists.
test.describe.skip('Functional - Checkout (blocked: no test SSO account / auth bypass — see fixtures.js login())', () => {
  test('FUNC-CKO-022/023 delivery checkout form accepts address and shows updated shipping cost', async ({ page }) => {
    await login(page);
    await addProductToCart(page, { id: PRODUCTS.hoodie.id, size: 'M', qty: 1 });
    await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout\/?$/);
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    // Default (Pickup) shipping cost line reads "—" until a method is chosen.
    // Other buttons' description text also contains an em dash, so match exactly.
    await expect(main.getByText('—', { exact: true })).toBeVisible();

    await fillDeliveryCheckout(page);
    await expect(main.getByText('Rp 15.000', { exact: true })).toBeVisible(); // shipping cost
    await expect(main.getByText('Rp 125.000', { exact: true })).toBeVisible(); // 110.000 + 15.000 total
  });

  test('FUNC-CKO-024 Xendit is the default selected payment method', async ({ page }) => {
    await login(page);
    await addProductToCart(page, { id: PRODUCTS.hoodie.id, size: 'M', qty: 1 });
    await page.getByRole('link', { name: 'Proceed to Checkout' }).click();

    const xendit = page.getByRole('button', { name: 'Xendit', exact: false });
    // Verified live: the selected payment button carries border-gray-900 +
    // bg-gray-50 instead of the default border-gray-200.
    await expect(xendit).toHaveClass(/border-gray-900/);
  });

  test('FUNC-CKO-025/FUNC-PAY-026 placing an order shows a confirmation modal, then redirects to the Xendit-hosted payment page', async ({ page }) => {
    await login(page);
    await addProductToCart(page, { id: PRODUCTS.hoodie.id, size: 'M', qty: 1 });
    await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
    await fillDeliveryCheckout(page);

    await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    await expect(page.getByText('Konfirmasi Pesanan')).toBeVisible();
    await expect(page.getByText('24 jam', { exact: true })).toBeVisible();

    await confirmOrderModal(page);
    await page.waitForURL(/checkout-staging\.xendit\.co/, { timeout: 15000 });
    await expect(page).toHaveURL(/checkout-staging\.xendit\.co/);
  });

  test('NEG-011 submitting Delivery checkout without required address fields is blocked', async ({ page }) => {
    await login(page);
    await addProductToCart(page, { id: PRODUCTS.hoodie.id, size: 'M', qty: 1 });
    await page.getByRole('link', { name: 'Proceed to Checkout' }).click();
    await page.waitForLoadState('networkidle');

    const main = page.locator('main');
    await main.getByRole('button', { name: /^Delivery/ }).click();
    // Leave courier/address/city/postal empty and submit directly.
    await page.getByRole('button', { name: 'Place Order', exact: true }).click();

    // HTML5 required-field validation should block submission — the app must
    // not proceed to the confirmation modal.
    await expect(page.getByText('Konfirmasi Pesanan')).toBeHidden();
    await expect(page).toHaveURL(/\/checkout\/?$/);
  });
});
