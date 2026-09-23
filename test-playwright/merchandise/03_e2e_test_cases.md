# End-to-End Business Flow Test Cases

| Test ID | Scenario | Preconditions | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|
| E2E-001 | Visitor browse → PDP → add to cart (guest) | Not logged in | 1. Open listing 2. Filter/search product 3. Open PDP 4. Select variant 5. Add to cart | Item in cart as guest, cart badge updates | P1 | Critical | P |
| E2E-002 | Guest checkout end-to-end | Guest checkout supported, item in cart | 1. Go to cart 2. Proceed to checkout as guest 3. Fill contact/address 4. Select shipping 5. Select payment 6. Place order 7. Complete payment | Order confirmed, confirmation page/email shown | P1 | Blocker | P |
| E2E-003 | Registered user full purchase flow | Registered account | 1. Login 2. Search product 3. Open PDP 4. Add to wishlist 5. Move wishlist item to cart 6. Update qty 7. Apply coupon 8. Checkout 9. Pay 10. View order confirmation 11. Logout | Full flow completes without error, order visible in order history | P1 | Blocker | P |
| E2E-004 | Login → filter → sort → compare products → purchase | Registered account | 1. Login 2. Apply category+price filter 3. Sort by rating 4. Open 2 products in new tabs 5. Add preferred one to cart 6. Checkout | Correct filtered/sorted product purchased successfully | P2 | Major | P |
| E2E-005 | Cancel order after placing | Order placed, unpaid | 1. Place order 2. Go to order history 3. Cancel the pending order | Order status becomes "Cancelled", stock restored (if applicable) | P2 | Major | P |
| E2E-006 | Reorder from history | Completed past order exists | 1. Login 2. Go to order history 3. Click "Reorder" on past order 4. Checkout again | New order created with same items, successful payment | P3 | Minor | P |
| E2E-007 | Password reset then purchase | Registered account, forgot password | 1. Click forgot password 2. Reset via email link 3. Login with new password 4. Complete a purchase | User regains access and completes checkout | P2 | Major | P |
| E2E-008 | Multi-item cart with mixed stock levels | Cart contains in-stock and low-stock items | 1. Add multiple items incl. low-stock item 2. Proceed to checkout 3. Place order | Order succeeds; low-stock item quantity properly deducted or blocked if insufficient | P1 | Critical | P |
| E2E-009 | Session expiry mid-checkout | Session TTL known/short | 1. Start checkout 2. Wait until session expires 3. Attempt to place order | User prompted to re-login, cart/checkout data preserved after re-auth | P2 | Major | M |
| E2E-010 | Abandon and resume cart across devices/sessions | Logged-in account with persisted cart | 1. Add items on device A 2. Logout 3. Login on device B | Cart items persist and are visible across sessions | P2 | Major | M |

**Total E2E Test Cases in this file: 10**
