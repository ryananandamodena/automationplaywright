// Shared constants/helpers for MODENA Merchandise automation specs.
// Selectors re-verified against live DOM at https://merchandise-dev.modena.com (2026-08-03).
//
// IMPORTANT: never use a bare `text="M"` / `text="L"` locator for size buttons —
// the header logo's inner text also trims to "M", so a global text locator
// resolves to the logo (navigates to /products) instead of the size swatch.
// Always scope size/color/qty locators to `main` (or the AddToCartButton island).
//
// 2026-08-03 re-verification found two environment changes since 2026-07-30:
//   1. The catalog was re-seeded: 7 English-named demo products -> 13 real
//      MODENA products with Indonesian names, and every product now ships
//      with exactly one size (no more S/M/L/XL apparel sizing). See PRODUCTS
//      below for the current live data.
//   2. /login dropped email/password entirely and is now Microsoft-SSO-only
//      ("Sign in with Microsoft", no #email/#password fields exist anymore).
//      Automating that would mean scripting a real Microsoft OAuth consent
//      screen — out of scope here. `login()` below is kept only as a marker
//      of what used to work; every login-dependent test now skips instead of
//      pretending this still functions. See functional.auth.spec.js.

export const BASE_URL = 'https://merchandise-dev.modena.com';

export const DEMO_CUSTOMER = {
  email: 'customer@modena.com',
  password: 'customer123',
};

export const PRODUCTS = {
  hoodie: { id: '1', name: 'HOODIE HITAM', price: 110000, category: 'Apparel', sizes: ['One Size'] },
  tee: { id: '2', name: 'KAOS MODENA', price: 100000, category: 'Apparel', sizes: ['One Size'] },
  mug: { id: '6', name: 'MUG TUMBLER HITAM', price: 47000, category: 'Accessories', sizes: ['350ml'] },
};

// No longer reachable: /login is Microsoft-SSO-only (no #email/#password
// fields), so this throws immediately rather than hanging on a 10s timeout.
// Kept so any leftover caller fails loudly and points here instead of at a
// mysterious selector timeout.
export async function login() {
  throw new Error(
    '/login is Microsoft-SSO-only as of 2026-08-03 (no #email/#password form) — ' +
    'email/password login can no longer be automated this way. See fixtures.js.'
  );
}

export async function addProductToCart(page, { id, size, qty = 1 }) {
  await page.goto(`${BASE_URL}/product/${id}`);
  const main = page.locator('main');
  // Every current product has exactly one size, pre-selected by default —
  // only click a size button if a specific one was requested.
  if (size) {
    await main.getByRole('button', { name: size, exact: true }).click();
  }
  for (let i = 1; i < qty; i++) {
    await main.getByRole('button', { name: 'Increase quantity' }).click();
  }
  await main.getByRole('button', { name: 'Add to Cart', exact: true }).click();
}

export function cartButton(page) {
  // Accessible name is dynamic: "Shopping cart, N items"
  return page.getByRole('button', { name: /Shopping cart, \d+ items?/ });
}

// The "All" button under the Category filter group is the first "All" button
// in DOM order (Category renders before Price/Size/Color), so `.first()`
// inside the <aside> filter panel reliably targets it without needing a
// fragile `hasText` container match.
export function categoryAllButton(page) {
  return page.locator('aside').getByRole('button', { name: 'All', exact: true }).first();
}

// Fills the "Delivery" branch of the checkout form (courier + full address).
// Verified live: choosing "Delivery" reveals a Courier Service picker and a
// Shipping Address section (name/email prefilled from the logged-in user);
// choosing "Pickup" needs none of this. Payment method defaults to "Xendit".
export async function fillDeliveryCheckout(page, {
  courier = 'JNE',
  phone = '081234567890',
  address = 'Jl. Merdeka No. 10',
  city = 'Jakarta Selatan',
  postal = '12740',
} = {}) {
  // CheckoutForm is another Astro island (client:load) — same hydration-race
  // gotcha as the listing filters. Wait for it before interacting.
  await page.waitForLoadState('networkidle');
  const main = page.locator('main');
  // The "Delivery" button's accessible name includes its description
  // paragraph too ("Delivery Ship to your address — flat Rp 15.000"), so
  // `exact: true` against just "Delivery" never matches — use a startsWith
  // regex instead.
  await main.getByRole('button', { name: /^Delivery/ }).click();
  await main.getByRole('button', { name: courier, exact: true }).click();
  await main.locator('#co-phone').fill(phone);
  await main.locator('#co-address').fill(address);
  await main.locator('#co-city').fill(city);
  await main.locator('#co-postal').fill(postal);
}

// Submitting checkout opens a "Konfirmasi Pesanan" (order confirmation) modal
// before actually creating the order — confirm it to proceed.
export async function confirmOrderModal(page) {
  await page.getByRole('button', { name: 'Ya, Lanjutkan', exact: true }).click();
}
