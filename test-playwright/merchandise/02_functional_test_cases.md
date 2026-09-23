# Functional Test Cases (Positive Flows)

## Product Listing / Search / Filter / Sort

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| FUNC-PLP-001 | Product Listing | Load listing | Products load on page visit | None | N/A | 1. Navigate to /products/ | Product cards render with image, name, price | P1 | Critical | P |
| FUNC-PLP-002 | Product Listing | Pagination | Navigate to page 2 | >1 page exists | N/A | 1. Click "Next"/page 2 | Page 2 products load, URL/page state updates | P2 | Major | P |
| FUNC-SRC-003 | Search | Valid keyword search | Search returns matching products | None | Keyword: "kaos" | 1. Enter keyword in search 2. Submit | Relevant results shown, keyword highlighted if applicable | P1 | Critical | P |
| FUNC-SRC-004 | Search | Autocomplete suggestion | Typing shows suggestion dropdown | Search bar focused | Partial keyword: "ka" | 1. Type partial keyword | Suggestions list appears, clicking navigates to result | P2 | Major | P |
| FUNC-FLT-005 | Filter | Apply single filter | Filter by category | Listing loaded | Category: "Apparel" | 1. Select category filter | Only matching products shown, filter chip visible | P1 | Major | P |
| FUNC-FLT-006 | Filter | Apply multiple filters | Filter by category + price range | Listing loaded | Category + Price range | 1. Select category 2. Set price range | Products match both conditions | P2 | Major | P |
| FUNC-FLT-007 | Filter | Clear filters | Reset all filters | Filters applied | N/A | 1. Click "Clear all" | All products shown, filter chips removed | P2 | Major | P |
| FUNC-SRT-008 | Sort | Sort by price ascending | Sort dropdown changes order | Listing loaded | N/A | 1. Select "Price: Low to High" | Products reorder ascending by price | P2 | Major | P |
| FUNC-SRT-009 | Sort | Sort by newest | Sort by newest arrivals | Listing loaded | N/A | 1. Select "Newest" | Products reorder by date added desc | P2 | Minor | P |

## Product Detail

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| FUNC-PDP-010 | Product Detail | View product detail | Click product card opens PDP | Listing loaded | N/A | 1. Click a product card | PDP loads with correct product data | P1 | Critical | P |
| FUNC-PDP-011 | Product Detail | Select variant | Choose size/color | PDP with variants | Size: M, Color: Black | 1. Select size 2. Select color | Price/stock/image update per variant | P1 | Major | P |
| FUNC-PDP-012 | Product Detail | Image gallery navigation | Switch between product images | PDP loaded | N/A | 1. Click thumbnail 2 | Main image updates to thumbnail 2 | P3 | Minor | P |
| FUNC-PDP-013 | Product Detail | Add to cart from PDP | Add product with qty | PDP loaded | Qty: 2 | 1. Set qty=2 2. Click "Add to Cart" | Item added with qty 2, cart badge updates, success toast shown | P1 | Critical | P |
| FUNC-PDP-014 | Product Detail | Add to wishlist | Click wishlist icon | Logged in, PDP loaded | N/A | 1. Click wishlist icon | Product saved to wishlist, icon state changes to "saved" | P2 | Major | P |
| FUNC-PDP-015 | Product Detail | Submit review/rating | Add product review | Logged in, purchased product | Rating: 5, Comment text | 1. Fill review form 2. Submit | Review appears in list (pending or published per business rule) | P2 | Major | P |

## Cart / Wishlist

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| FUNC-CRT-016 | Cart | View cart | Open cart with items | Item in cart | N/A | 1. Open cart | Correct items, qty, price, subtotal shown | P1 | Critical | P |
| FUNC-CRT-017 | Cart | Update quantity | Increase/decrease qty | Item in cart | Qty +1 | 1. Click "+" stepper | Qty and subtotal update correctly | P1 | Major | P |
| FUNC-CRT-018 | Cart | Remove item | Remove item from cart | Item in cart | N/A | 1. Click remove icon | Item removed, totals recalculated | P1 | Major | P |
| FUNC-CRT-019 | Cart | Apply coupon | Apply valid coupon code | Item in cart, valid coupon exists | Coupon: "DISKON10" | 1. Enter coupon 2. Apply | Discount applied, total updates | P1 | Major | P |
| FUNC-WSH-020 | Wishlist | View wishlist | Open wishlist page | Logged in, item wishlisted | N/A | 1. Open wishlist page | Wishlisted items displayed | P2 | Major | P |
| FUNC-WSH-021 | Wishlist | Move to cart | Move wishlist item to cart | Item in wishlist | N/A | 1. Click "Move to cart" | Item added to cart, removed from wishlist (per business rule) | P2 | Major | P |

## Checkout / Payment / Order

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| FUNC-CKO-022 | Checkout | Fill shipping address | Add new address | Checkout started | Valid address | 1. Fill address form 2. Save | Address saved, shown in checkout summary | P1 | Critical | P |
| FUNC-CKO-023 | Checkout | Select shipping method | Choose courier/shipping option | Address filled | Shipping option | 1. Select shipping method | Shipping cost updates in total | P1 | Major | P |
| FUNC-CKO-024 | Checkout | Select payment method | Choose payment method | Checkout at payment step | Valid payment method (e.g. VA/CC) | 1. Select payment method | Payment method selected, proceed enabled | P1 | Critical | P |
| FUNC-CKO-025 | Checkout | Place order | Complete checkout | Valid cart + address + payment | Full valid data | 1. Review order 2. Click "Place Order" | Order created, confirmation page/order ID shown | P1 | Blocker | P |
| FUNC-PAY-026 | Payment | Successful payment | Complete payment via gateway | Order placed | Valid test card/VA | 1. Complete payment | Payment confirmed, order status updates to "Paid" | P1 | Blocker | P |
| FUNC-ORD-027 | Order | View order history | Open order list | Logged in, has orders | N/A | 1. Open "My Orders" | List of past orders with status shown | P2 | Major | P |
| FUNC-ORD-028 | Order | View order detail/invoice | Open specific order | Order exists | Order ID | 1. Click order 2. View detail | Order items, address, total, invoice download shown | P2 | Major | P |
| FUNC-ORD-029 | Order | Cancel order | Cancel unpaid/pending order | Order in cancellable status | Order ID | 1. Click "Cancel Order" 2. Confirm | Order status changes to "Cancelled" | P2 | Major | P |
| FUNC-ORD-030 | Order | Reorder | Reorder from past order | Completed order exists | Order ID | 1. Click "Reorder" | Items added to cart matching original order | P3 | Minor | P |

## Authentication / Profile

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| FUNC-AUTH-031 | Auth | Register new account | Sign up with valid data | Not logged in | Valid email/password | 1. Fill registration form 2. Submit | Account created, verification email sent or auto-login | P1 | Critical | P |
| FUNC-AUTH-032 | Auth | Login valid credentials | Log in successfully | Registered account exists | Valid email/password | 1. Enter credentials 2. Submit | Logged in, redirected to homepage/account | P1 | Blocker | P |
| FUNC-AUTH-033 | Auth | Logout | Log out of session | Logged in | N/A | 1. Click logout | Session ends, redirected to login/home, protected pages inaccessible | P1 | Major | P |
| FUNC-AUTH-034 | Auth | Password reset request | Request reset link | Registered email | Valid email | 1. Click "Forgot password" 2. Submit email | Reset email sent, confirmation message shown | P1 | Major | P |
| FUNC-AUTH-035 | Auth | Password reset completion | Set new password via link | Valid reset token/link | New password | 1. Open reset link 2. Set new password | Password updated, can login with new password | P1 | Major | P |
| FUNC-PRF-036 | Profile | Update profile info | Edit name/phone | Logged in | New name/phone | 1. Edit profile fields 2. Save | Profile updated, success toast shown | P2 | Minor | P |
| FUNC-PRF-037 | Profile | Change password | Change password while logged in | Logged in | Current + new password | 1. Enter current & new password 2. Submit | Password changed, success message shown | P2 | Major | P |
| FUNC-PRF-038 | Profile | Manage addresses | Add/edit/delete saved address | Logged in | Address data | 1. Add new address 2. Save | Address appears in saved address list (CRUD) | P2 | Minor | P |

**Total Functional Test Cases in this file: 38**
