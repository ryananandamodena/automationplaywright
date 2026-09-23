# API Test Cases

> Endpoint paths below are assumed/representative (`/api/products`, `/api/cart`, etc.).
> Replace with actual endpoints once confirmed via browser DevTools Network tab against the dev site.

## Product & Catalog APIs

| Test ID | Endpoint | Method | Scenario | Test Data | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|
| API-PRD-001 | /api/products | GET | List products, default pagination | N/A | 200 OK, JSON array with pagination meta, response time < 1s | P1 | Major | API |
| API-PRD-002 | /api/products?page=2&limit=20 | GET | Pagination params respected | page=2, limit=20 | Correct page/limit reflected in response, no duplicate items across pages | P2 | Major | API |
| API-PRD-003 | /api/products?category=apparel | GET | Filter by category | category=apparel | Only matching category items returned | P2 | Major | API |
| API-PRD-004 | /api/products?sort=price_asc | GET | Sort by price | sort=price_asc | Items ordered ascending by price | P2 | Minor | API |
| API-PRD-005 | /api/products?q=kaos | GET | Search keyword | q=kaos | Relevant matches only, 200 OK | P1 | Major | API |
| API-PRD-006 | /api/products/{id} | GET | Get product detail | Valid product ID | 200 OK, full product schema (variants, stock, images) | P1 | Major | API |
| API-PRD-007 | /api/products/{invalid-id} | GET | Invalid product ID | Non-existent ID | 404 Not Found, structured error body | P1 | Major | API |
| API-PRD-008 | /api/products/{id} | GET | Response schema validation | Valid product ID | Response matches documented JSON schema (types, required fields) | P2 | Major | API |

## Cart / Wishlist APIs

| Test ID | Endpoint | Method | Scenario | Test Data | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|
| API-CRT-009 | /api/cart | GET | Retrieve current cart | Auth token / session | 200 OK, correct items/subtotal | P1 | Critical | API |
| API-CRT-010 | /api/cart/items | POST | Add item to cart | {productId, variantId, qty} | 201 Created, item present in cart response | P1 | Critical | API |
| API-CRT-011 | /api/cart/items/{id} | PATCH | Update item quantity | {qty: 3} | 200 OK, qty updated, subtotal recalculated | P1 | Major | API |
| API-CRT-012 | /api/cart/items/{id} | DELETE | Remove item | Valid cart item ID | 200/204, item no longer in cart | P1 | Major | API |
| API-CRT-013 | /api/cart/coupon | POST | Apply coupon | {code: "DISKON10"} | 200 OK, discount applied in response | P1 | Major | API |
| API-CRT-014 | /api/cart/coupon | POST | Apply invalid coupon | {code: "INVALIDXYZ"} | 400 Bad Request, clear error message, no discount applied | P2 | Major | API |
| API-WSH-015 | /api/wishlist | POST | Add to wishlist | {productId} | 201 Created, requires auth (401 if unauthenticated) | P2 | Major | API |

## Checkout / Order / Payment APIs

| Test ID | Endpoint | Method | Scenario | Test Data | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|
| API-CKO-016 | /api/checkout | POST | Create order from cart | Valid cart + address + shipping + payment | 201 Created, order ID returned | P1 | Blocker | API |
| API-CKO-017 | /api/checkout | POST | Missing required field (address) | Cart valid, address missing | 400 Bad Request, field-level validation message | P1 | Major | API |
| API-ORD-018 | /api/orders | GET | List user's orders (auth) | Valid auth token | 200 OK, only own orders returned (no cross-user leakage) | P1 | Critical | API |
| API-ORD-019 | /api/orders/{id} | GET | Get order detail | Own order ID | 200 OK, full order data | P1 | Major | API |
| API-ORD-020 | /api/orders/{id} | GET | Access another user's order ID (IDOR check) | Other user's order ID + own token | 403/404, must NOT return other user's data | P1 | Critical | API |
| API-ORD-021 | /api/orders/{id}/cancel | POST | Cancel order | Own pending order ID | 200 OK, status changes to Cancelled | P2 | Major | API |
| API-PAY-022 | /api/payments/webhook | POST | Payment gateway webhook callback | Valid signed payload | 200 OK, order status updated to Paid; verifies signature before trusting payload | P1 | Blocker | API |
| API-PAY-023 | /api/payments/webhook | POST | Webhook with invalid/missing signature | Tampered payload | 401/403, order status NOT updated | P1 | Critical | API |

## Auth APIs

| Test ID | Endpoint | Method | Scenario | Test Data | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|
| API-AUTH-024 | /api/auth/register | POST | Register new user | Valid email/password | 201 Created, no password returned in response | P1 | Critical | API |
| API-AUTH-025 | /api/auth/login | POST | Valid login | Correct credentials | 200 OK, auth token/cookie set, no sensitive data leaked | P1 | Blocker | API |
| API-AUTH-026 | /api/auth/login | POST | Invalid password | Wrong password | 401 Unauthorized, generic error (no user-enumeration hint) | P1 | Critical | API |
| API-AUTH-027 | /api/auth/login | POST | Brute-force attempts | 10+ rapid failed logins | Rate limiting / account lockout triggered after threshold | P1 | Critical | API |
| API-AUTH-028 | /api/auth/refresh | POST | Refresh expired token | Valid refresh token | 200 OK, new access token issued | P2 | Major | API |
| API-AUTH-029 | /api/auth/logout | POST | Logout invalidates session | Valid session | 200 OK, subsequent requests with old token return 401 | P1 | Major | API |
| API-AUTH-030 | Any protected endpoint | GET/POST | Access without token | No auth header | 401 Unauthorized | P1 | Critical | API |
| API-AUTH-031 | Any protected endpoint | GET/POST | Access with expired/tampered token | Expired/modified JWT | 401 Unauthorized, no data leaked | P1 | Critical | API |

## Cross-Cutting API Validation (apply to all endpoints)

| Test ID | Check | Expected Result | Priority |
|---|---|---|---|
| API-CC-032 | Response time | 95th percentile < 800ms under normal load | P2 |
| API-CC-033 | Standard headers | `Content-Type: application/json`, `Cache-Control` set appropriately for GETs | P3 |
| API-CC-034 | CORS policy | Only allowed origins permitted; wildcard `*` with credentials must NOT be used | P1 |
| API-CC-035 | Error response consistency | All errors return consistent `{code, message}` structure | P2 |
| API-CC-036 | HTTP method not allowed | Unsupported method (e.g. DELETE on read-only resource) returns 405 | P3 |

**Total API Test Cases in this file: 36**
