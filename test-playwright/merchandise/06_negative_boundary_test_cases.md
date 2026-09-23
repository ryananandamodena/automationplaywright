# Negative Test Cases & Boundary Value Analysis

## Negative Test Cases

| Test ID | Module | Scenario | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|
| NEG-001 | Auth | Login with empty fields | 1. Submit login with blank email/password | Validation error, submit blocked | P1 | Major | P |
| NEG-002 | Auth | Login with invalid email format | 1. Enter "notanemail" 2. Submit | Inline validation error shown | P2 | Minor | P |
| NEG-003 | Search | Empty search submit | 1. Submit search with empty field | No crash; shows all products or prompts for input | P3 | Minor | P |
| NEG-004 | Search | SQL injection string | 1. Search `'; DROP TABLE products; --` | Handled safely, no error leak, no data loss | P1 | Blocker | M |
| NEG-005 | Search | XSS payload | 1. Search `<script>alert(1)</script>` | Rendered as plain text, not executed | P1 | Blocker | M |
| NEG-006 | Search | Emoji/Unicode input | 1. Search "🔥👕한국어" | No crash, graceful "no results" or correct match | P3 | Minor | P |
| NEG-007 | Cart | Add to cart with 0 quantity | 1. Set qty=0 2. Add to cart | Blocked with validation message | P2 | Major | P |
| NEG-008 | Cart | Add to cart exceeding stock | 1. Set qty > available stock | Blocked/capped with message "only X in stock" | P1 | Major | P |
| NEG-009 | Cart | Apply expired coupon | 1. Enter expired coupon code | Rejected with clear "expired" message | P2 | Major | P |
| NEG-010 | Cart | Apply coupon twice (duplicate) | 1. Apply same coupon in two separate sessions where single-use only | Second attempt rejected | P2 | Major | API |
| NEG-011 | Checkout | Submit checkout with missing address | 1. Skip address 2. Try to place order | Blocked, field-level errors shown | P1 | Major | P |
| NEG-012 | Checkout | Refresh page mid-payment | 1. Start payment 2. Refresh browser | No duplicate order created; order status remains consistent | P1 | Critical | M |
| NEG-013 | Checkout | Click "Place Order" multiple times rapidly | 1. Double/triple click submit button | Only one order created (idempotency / button disabled after first click) | P1 | Critical | P |
| NEG-014 | Checkout | Back button after payment success | 1. Complete payment 2. Press browser back | Does not resubmit/duplicate order; shows cached confirmation or redirects forward | P2 | Major | M |
| NEG-015 | Checkout | Network failure during checkout submit | 1. Simulate offline/network drop during place-order request | Clear error message, cart state preserved, no partial order | P1 | Critical | M |
| NEG-016 | Checkout | Server error (500) during payment | 1. Simulate backend 500 on payment endpoint | User sees error, guided to retry, no silent data loss | P1 | Critical | M |
| NEG-017 | Checkout | Session expired mid-checkout | 1. Let session expire 2. Attempt to place order | Redirected to login, cart preserved after re-login | P2 | Major | M |
| NEG-018 | Concurrency | Two devices edit cart simultaneously | 1. Modify cart on device A and B at same time | Final state consistent, no lost updates causing negative totals | P2 | Major | M |
| NEG-019 | Concurrency | Concurrent checkout of last stock unit | 1. Two users checkout same last-unit item simultaneously | Only one succeeds; other notified "out of stock" | P1 | Critical | M |
| NEG-020 | General | JavaScript disabled | 1. Disable JS in browser 2. Load site | Graceful degradation message or basic content shown (no blank white page) | P3 | Minor | M |
| NEG-021 | General | Cookies disabled | 1. Disable cookies 2. Attempt login/checkout | Clear message that cookies are required | P3 | Minor | M |
| NEG-022 | General | Slow network (3G throttle) | 1. Throttle to slow 3G 2. Navigate site | Loading states shown, no premature timeout errors | P2 | Minor | P |
| NEG-023 | General | Large payload / long text input | 1. Enter 10,000-character review comment | Input truncated/rejected with max-length message, no server error | P2 | Minor | P |
| NEG-024 | Profile | Update profile with invalid phone format | 1. Enter letters in phone field | Validation error shown | P3 | Minor | P |
| NEG-025 | Wishlist | Add same product to wishlist twice | 1. Add product 2. Add same product again | No duplicate entry; possibly toggled off | P3 | Minor | P |

## Boundary Value Analysis

| Test ID | Field | Boundary | Test Data | Expected Result | Priority | Automation |
|---|---|---|---|---|---|---|
| BVA-001 | Cart Quantity | Min valid | Qty = 1 | Accepted | P2 | P |
| BVA-002 | Cart Quantity | Below min | Qty = 0 or negative | Rejected with validation error | P1 | P |
| BVA-003 | Cart Quantity | Max stock boundary | Qty = exact available stock | Accepted | P2 | P |
| BVA-004 | Cart Quantity | Above max stock | Qty = stock + 1 | Rejected/capped with message | P1 | P |
| BVA-005 | Coupon Code Length | Min length | 1-character code | Rejected if below min length policy | P3 | P |
| BVA-006 | Coupon Code Length | Max length | Code at max allowed length (e.g. 20 chars) | Accepted if valid; length+1 rejected | P3 | P |
| BVA-007 | Search Keyword Length | Min | 1 character | Handled gracefully (results or prompt) | P3 | P |
| BVA-008 | Search Keyword Length | Max | 255+ character string | Rejected/truncated, no server error | P3 | P |
| BVA-009 | Product Name (admin/CMS) | Max length | Name at field max length +1 | Rejected with validation message | P3 | M |
| BVA-010 | Description Length | Max | Description at max allowed length +1 | Rejected/truncated | P3 | M |
| BVA-011 | Price | Min value | Price = 0 or smallest currency unit | Handled per business rule (0 may be disallowed) | P2 | M |
| BVA-012 | Price | Max value | Extremely large price (e.g. 999,999,999) | Displayed/formatted correctly, no overflow/precision error | P3 | M |
| BVA-013 | Upload Size | Max file size (e.g. review image) | File at max allowed size (e.g. 5MB) vs +1MB | At-limit accepted, over-limit rejected with message | P2 | M |
| BVA-014 | Upload Type | Allowed types | .jpg/.png at boundary vs .exe/.php | Allowed types accepted, disallowed rejected | P1 | M |
| BVA-015 | Password Length | Min/Max | Password at min length (e.g. 8) vs 7 chars vs very long (128+) | Min accepted, below-min rejected, very long handled without truncation error | P1 | P |
| BVA-016 | Pagination | First/last page | page=1 and page=lastPage | Correct results, no error on last page (partial page allowed) | P3 | API |
| BVA-017 | Pagination | Beyond last page | page=lastPage+1 | Empty result set, no 500 error | P2 | API |

**Total Negative Test Cases: 25 | Total Boundary Value Test Cases: 17**
