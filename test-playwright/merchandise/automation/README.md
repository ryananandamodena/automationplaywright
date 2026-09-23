# Merchandise Automation (Playwright)

Real, runnable specs grounded in the live DOM at https://merchandise-dev.modena.com
(verified 2026-07-30). Uses this repo's existing `@playwright/test` setup
(`../../playwright.config.js`) — each spec overrides `baseURL` via
`test.use({ baseURL: BASE_URL })` since the project default points at
`portal-dev.modena.com`.

## ⚠️ These tests create real orders on the dev server

`functional.checkout.spec.js`, `functional.orders.spec.js`, and
`e2e.spec.js`'s `E2E-003` walk the real checkout flow and click "Place
Order" — this creates an actual `Waiting Payment` order against the shared
dev database (visible to anyone on `/orders`) and redirects to a real
Xendit **staging** checkout page (no real money moves, but it is still a
live third-party call). None of these tests complete payment.

Running the full suite repeatedly in a short window creates several
`Waiting Payment` orders per run and was observed to make the dev site's
`/login` become extremely slow (one run took the login step from ~2s to
30+ minutes before timing out — see "Known flakiness" below). Treat
`functional.checkout.spec.js`/`functional.orders.spec.js`/`E2E-003` as
expensive, not part of a tight feedback loop — don't run them on every
save, and expect to periodically clean up `Waiting Payment` test orders
from `/orders` (or ask whoever owns the dev environment to reset seed data).

## Run

```bash
cd Ryan/test-playwright
npx playwright test merchandise/automation
npx playwright test merchandise/automation/smoke.spec.js --headed
# Cheap, no side effects:
npx playwright test merchandise/automation/smoke.spec.js merchandise/automation/functional.listing.spec.js merchandise/automation/functional.pdp_cart.spec.js merchandise/automation/functional.auth.spec.js
```

## Files

| File | Test IDs covered |
|---|---|
| `fixtures.js` | Shared constants + `login()` / `addProductToCart()` / `fillDeliveryCheckout()` / `confirmOrderModal()` helpers |
| `smoke.spec.js` | SMK-001..008 |
| `functional.listing.spec.js` | FUNC-PLP-001/002, FUNC-SRC-003, FUNC-FLT-005/006/007, NEG-003, UI-PLP-005 |
| `functional.pdp_cart.spec.js` | FUNC-PDP-010/011/012/013, FUNC-CRT-016, NEG-007, BVA-014 |
| `functional.auth.spec.js` | FUNC-AUTH-032/033, NEG-001/002 |
| `functional.checkout.spec.js` | FUNC-CKO-022/023/024/025, FUNC-PAY-026, NEG-011 — **creates real orders, see warning above** |
| `functional.orders.spec.js` | FUNC-ORD-027, FUNC-ORD-029 — **creates real orders, see warning above** |
| `e2e.spec.js` | E2E-001 (cheap), E2E-003 (full checkout — **creates a real order**) |

## Status

28 of 34 tests are stable across repeated runs (smoke, listing, PDP/cart,
auth, and the checkout-form-only assertions in `functional.checkout.spec.js`).
The order-creating tests (`functional.orders.spec.js`, `E2E-003`, and one
`functional.checkout.spec.js` case) are correct but environment-sensitive —
see "Known flakiness" below. Every fix in this file came from actually
running the tests against the live site, not from guessing.

## What was actually verified live vs. assumed

**Verified against the real site (full purchase journey, 2026-07-30):**
- `/products`: 7 seed products, category/price/size/color filters, live-filtering search (`aria-label="Search products"`).
- `/product/{id}`: color swatch, size buttons, qty stepper, `Add to Cart` (blocks with "Please select a size" if none chosen).
- `/login`: demo account `customer@modena.com` / `customer123`, redirects to `/products`, shows "invalid email or password" on wrong credentials.
- Add to Cart auto-opens a drawer with "Proceed to Checkout" (→ `/checkout`), qty controls, remove-item buttons.
- `/checkout`: **Shipping Method** (Pickup/Free vs. Delivery/Rp 15.000, the latter revealing a Courier picker — JNE/JNT/SiCepat/AnterAja — and a full address form: name/email prefilled, phone/address/city/postal required), **Payment Method** (Xendit selected by default, or Bank Transfer Manual), an order summary, and a "Place Order" submit.
- Submitting opens a **"Konfirmasi Pesanan" confirmation modal** ("Batal" / "Ya, Lanjutkan") before the order is actually created.
- Confirming creates the order server-side and **redirects to a real Xendit-hosted checkout page** (`checkout-staging.xendit.co`).
- `/orders`: every order as a card (order number like `MDN-20260730-0003`, date, status badge, item thumbnails, shipping method), status filter chips (All/Waiting Payment/Pending Approval/Preparing Order/Shipped/Ready for Pickup/Delivered/Picked Up/Cancelled). `Waiting Payment` orders show "Pay Now" + "Cancel Order"; manual-transfer ones show "Upload Payment Proof" + "Cancel Order" instead.
- "Cancel Order" triggers a native `window.confirm()`.

**NOT verified — treat as best-effort placeholders:**
- Actually completing payment on the Xendit-hosted page (out of scope — third-party staging gateway, needs test card/VA details).
- Coupon input (none seen anywhere in the flow so far — may not exist on this build).
- Order detail page / reorder flow / "Upload Payment Proof" file upload.
- The account-dropdown logout control's exact markup (`functional.auth.spec.js`'s logout test is a best guess).
- The Vercel mockup (`modena-merch-official.vercel.app`) — no visual-diff automation exists yet.

## Gotchas found and fixed while making these tests actually pass

1. **`text="M"` collides with the header logo.** A naive `page.click('text="M"')`
   on the PDP does not click the size swatch — it matches the header logo's
   inner text node (also trims to `"M"`), which comes first in the DOM.
   Fix: scope size/color/qty locators to `page.locator('main')` and prefer
   `getByRole('button', { name, exact: true })` over raw `text=` locators.

2. **`fill()` doesn't trigger the live-search filter.** Setting the search
   box's value via `.fill('Mug')` left the listing unfiltered (still 7 cards).
   Typing it via `.pressSequentially('Mug', { delay: 50 })` does trigger the
   filter. A test that asserted a keyword already visible in the unfiltered
   list (e.g. searching "Hoodie") would pass either way and hide this bug —
   worth remembering when writing new search assertions: search for something
   that would only appear if filtering actually ran.

3. **Every form on this app is an Astro island (`client:load`) that hydrates
   after first paint** — the product filters, and the checkout form. Clicking
   a control immediately after `page.goto()` (or a link navigation) is a
   silent no-op: Playwright's auto-wait only confirms the element is
   visible/stable, not that its JS event handlers are attached yet. Fix:
   `await page.waitForLoadState('networkidle')` right after landing on
   `/products` or `/checkout`, before touching any control on that island.

4. **"Add to Cart" auto-opens a cart drawer** ("Shopping Cart (N)" heading,
   "Proceed to Checkout" link to `/checkout`, "Continue Shopping", per-item
   "Remove {name}" button, its own qty stepper). A test that then clicks the
   header cart icon again fails — the drawer overlay intercepts the click.
   Assert directly on the already-open drawer instead.

5. **The item name inside the cart drawer is an `<h3>`**, while the PDP's own
   title is an `<h1>` and the breadcrumb repeats it as a `<span>` — a bare
   `getByText(productName)` is ambiguous (3 matches) whenever the drawer is
   open on top of a PDP. Use `getByRole('heading', { name, level: 3 })` to
   target the drawer's copy specifically.

6. **`/login` has no header** (no nav, no "Sign In" link) — it's a standalone
   page. Don't reuse header-based assertions there.

7. **Buttons whose visible copy includes a description paragraph have that
   paragraph baked into their accessible name.** The "Delivery" shipping
   button's full accessible name is `"Delivery Ship to your address — flat
   Rp 15.000"`, not just `"Delivery"` — so `getByRole('button', { name:
   'Delivery', exact: true })` never matches. Use a `/^Delivery/` regex (or
   `exact: false`) instead. The same trap applies to the `"—"` shipping-cost
   placeholder and `"Rp 15.000"` price text, both of which also appear
   inside that same button's description — use `{ exact: true }` on
   `getByText` there to disambiguate from the button copy.

8. **Order cards have no unique class or test id.** `main > div > div`
   doesn't reach them (an `<astro-island>` custom element sits in between,
   which isn't a `div`). The one thing every order card div shares — and
   nothing else on `/orders` does — is the `hover:shadow-lg` class:
   `page.locator('main div[class*="hover:shadow-lg"]')`.

9. **"Cancel Order" fires a native `window.confirm()`.** Playwright
   auto-dismisses dialogs it isn't told to handle, which silently no-ops the
   cancel (during manual MCP exploration the click "succeeded" but the order
   stayed `Waiting Payment` — no error, just nothing happened). Always
   `page.once('dialog', d => d.accept())` immediately before the click.

10. **Status filter chip labels overlap order-card status-badge text**
    ("Preparing Order" is both a filter button and a possible badge on an
    unrelated card). A bare `page.getByText('Preparing Order')` always
    matches the filter chip regardless of what's actually filtered — scope
    assertions to the order-card locator from gotcha #8, not the whole page.

## Known flakiness

- One full-suite run saw `/login` take **30+ minutes** and then time out,
  immediately after several order-creating tests had run back-to-back. This
  looks like dev-server-side load or rate-limiting reacting to repeated
  logins/order creation in a tight loop, not a selector bug — if you hit
  this, wait a few minutes before retrying rather than assuming the test is
  broken.
- The order-list tests assume the most-recently-created `Waiting Payment`
  order is `.first()` in the DOM (newest-first ordering) — if the app's sort
  order ever changes, or if a previous run's order was never cleaned up,
  these may need a more specific match (e.g. by order total or an order
  number captured right after creation) instead of `.first()`.

## Next steps

1. Add API-level specs (`../04_api_test_cases.md`) once the actual REST
   endpoints are confirmed via the Network tab — `/checkout`'s "Place Order"
   clearly hits a real backend (it returns a live Xendit checkout URL), so
   there is a server API here worth testing directly, faster and without
   the order-creation side effects of the UI flow.
2. Ask whoever owns `merchandise-dev` for either a disposable/sandboxed
   test account, or a way to bulk-cancel/clean up `Waiting Payment` test
   orders, before running `functional.checkout.spec.js` /
   `functional.orders.spec.js` / `E2E-003` regularly.
3. Wire a visual-regression tool (this repo already has Applitools scripts,
   see `../../APPLITOOLS_SETUP.md`) to diff against the Vercel mockup for the
   UI test cases in `../01_ui_test_cases.md`.
4. Coupon input, order detail/reorder, and "Upload Payment Proof" still need
   a live look before writing specs for them.
