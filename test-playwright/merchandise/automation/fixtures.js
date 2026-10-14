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

export const MS_USER = {
  email: 'ryan.ananda@modena.com',
  password: '011215Aisy@h',
};

export const PRODUCTS = {
  hoodie: { id: '1', name: 'HOODIE HITAM', price: 110000, category: 'Apparel', sizes: ['One Size'] },
  tee: { id: '2', name: 'KAOS MODENA', price: 100000, category: 'Apparel', sizes: ['One Size'] },
  mug: { id: '6', name: 'MUG TUMBLER HITAM', price: 47000, category: 'Accessories', sizes: ['350ml'] },
};

export async function loginMicrosoft(page, { email, password } = MS_USER) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  const msButton = page.getByRole('button', { name: /Sign in with Microsoft/i });
  await msButton.click();

  // Handle Microsoft Login interaction
  await page.waitForURL(/login\.microsoftonline\.com|live\.com|modena/i, { timeout: 15000 });

  // 1. Email input
  const emailInput = page.locator('input[type="email"], input[name="loginfmt"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);

  const nextButton = page.locator('input[type="submit"], #idSIButton9, button:has-text("Next")');
  await nextButton.click();

  // 2. Password input
  const passwordInput = page.locator('input[type="password"], input[name="passwd"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(password);

  const signInButton = page.locator('input[type="submit"], #idSIButton9, button:has-text("Sign in")');
  await signInButton.click();

  // 3. Check for Microsoft Authenticator 2FA / MFA Number Prompt
  try {
    const mfaPrompt = page.locator('text=Open your Authenticator app');
    if (await mfaPrompt.isVisible({ timeout: 5000 })) {
      const numberElement = page.locator('div[id*="displaySign"], div[class*="displaySign"], span[id*="displaySign"], main div:has-text("Open your Authenticator app")').last();
      const promptText = await page.locator('main').innerText();
      console.log(`\n========================================\n[MICROSOFT MFA DETECTED]\nSilakan approve permintaan di Microsoft Authenticator pada HP Anda.\n${promptText.split('\n').filter(l => l.trim()).slice(0, 4).join('\n')}\n========================================\n`);
    }
  } catch (e) {
    // No MFA prompt or already trusted
  }

  // 4. Handle "Stay signed in?" prompt if it appears
  try {
    const staySignedInBtn = page.locator('#idSIButton9, input[value="Yes"], input[value="No"], button:has-text("Yes")');
    if (await staySignedInBtn.isVisible({ timeout: 60000 })) {
      await staySignedInBtn.click();
    }
  } catch (e) {
    // Prompt is optional depending on session state
  }

  // 5. Wait for redirect back to Storefront application
  await page.waitForURL(new RegExp(BASE_URL), { timeout: 60000 });
}

export async function login(page, user = MS_USER) {
  return loginMicrosoft(page, user);
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
