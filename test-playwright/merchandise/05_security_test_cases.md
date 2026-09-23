# Security Test Cases

| Test ID | Category | Scenario | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|
| SEC-001 | Authentication | Password stored/transmitted securely | 1. Inspect login network request/response 2. Check password field | Password sent over HTTPS only, never returned in any response body, hashed (bcrypt/argon2) server-side | P1 | Blocker | M |
| SEC-002 | Authentication | Brute-force protection | 1. Attempt 10+ rapid failed logins for same account | Account locked/rate-limited/CAPTCHA triggered | P1 | Critical | API |
| SEC-003 | Authentication | Password policy enforcement | 1. Register with weak password "123456" | Registration rejected with policy message | P2 | Major | P |
| SEC-004 | Session/Cookie | Cookie security flags | 1. Inspect session cookie attributes | `HttpOnly`, `Secure`, `SameSite=Lax/Strict` all set | P1 | Critical | M |
| SEC-005 | Session/Cookie | Session fixation | 1. Capture session ID before login 2. Login 3. Compare session ID after | Session ID rotates after successful login | P1 | Major | M |
| SEC-006 | Session/Cookie | Logout invalidates token server-side | 1. Logout 2. Reuse old token/cookie on protected endpoint | 401 Unauthorized | P1 | Critical | API |
| SEC-007 | Authorization/IDOR | Access another user's order via ID manipulation | 1. Login as User A 2. Note own order ID pattern 3. Request User B's order ID | 403/404, data not exposed | P1 | Blocker | API |
| SEC-008 | Authorization | Access admin-only endpoint as regular user | 1. Login as regular user 2. Call admin API/route directly | 403 Forbidden | P1 | Critical | API |
| SEC-009 | Broken Access Control | Direct URL access to protected pages | 1. Logout 2. Navigate directly to /profile or /orders URL | Redirected to login, no data flash-rendered | P1 | Critical | P |
| SEC-010 | Injection | SQL Injection in search field | 1. Enter `' OR '1'='1` in search box 2. Submit | Input sanitized/parameterized, no SQL error leaked, no unauthorized data returned | P1 | Blocker | M |
| SEC-011 | Injection | XSS in review/comment field | 1. Submit review with `<script>alert(1)</script>` | Input escaped/sanitized on render, no script execution | P1 | Blocker | M |
| SEC-012 | Injection | XSS in search query reflected in URL | 1. Search with `<img src=x onerror=alert(1)>` | Reflected value is escaped in DOM/URL rendering | P1 | Critical | M |
| SEC-013 | CSRF | State-changing request without CSRF token | 1. Replay add-to-cart/checkout POST from external origin without token | Request rejected (403) or protected by SameSite cookie policy | P1 | Critical | M |
| SEC-014 | CORS | Cross-origin request policy | 1. Send API request with arbitrary `Origin` header | Only whitelisted origins receive `Access-Control-Allow-Origin`; credentials not allowed with wildcard | P1 | Critical | API |
| SEC-015 | Clickjacking | Page can be framed | 1. Embed site in `<iframe>` from external page | `X-Frame-Options: DENY/SAMEORIGIN` or CSP `frame-ancestors` blocks framing | P2 | Major | M |
| SEC-016 | Security Headers | Standard security headers present | 1. Inspect response headers on main pages | `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy` present | P2 | Major | M |
| SEC-017 | Sensitive Data Exposure | API responses don't leak PII/internal data | 1. Inspect product/order/user API responses | No internal IDs/DB fields/other-user PII beyond what's needed | P1 | Critical | M |
| SEC-018 | File Upload | Malicious file upload (if profile picture/review image upload exists) | 1. Upload `.php`/`.exe` disguised as image | Upload rejected, only safe MIME types/extensions accepted, server-side validation (not just extension) | P1 | Critical | M |
| SEC-019 | Open Redirect | Redirect parameter manipulation | 1. Manipulate `?redirect=` or `?next=` param with external URL after login | Redirect restricted to same-origin/whitelisted paths | P2 | Major | M |
| SEC-020 | Directory Traversal | Path traversal in file/image endpoints | 1. Request `../../etc/passwd`-style path via image/download endpoint | 400/404, no file system access outside intended directory | P2 | Major | M |
| SEC-021 | Rate Limiting | API rate limiting on public endpoints | 1. Send high-frequency requests to search/product API | Requests throttled with 429 after threshold | P2 | Major | API |
| SEC-022 | Payment | Payment webhook signature validation | 1. Send forged payment-success webhook without valid signature | Rejected, order not marked as paid | P1 | Blocker | API |
| SEC-023 | Coupon/Business Logic | Coupon reuse / negative price manipulation | 1. Attempt to apply same single-use coupon twice 2. Attempt to manipulate cart price via client-side request tampering | Second use rejected; server recalculates price server-side, ignoring client-supplied price | P1 | Critical | M |
| SEC-024 | Race Condition | Concurrent checkout on limited stock (last unit) | 1. Two sessions simultaneously checkout the last unit of stock | Only one order succeeds; stock never goes negative | P1 | Critical | M |
| SEC-025 | Account Lockout Recovery | Locked account can be recovered | 1. Trigger lockout via failed logins 2. Use password reset flow | Legitimate user can regain access via reset, not permanently locked out | P2 | Major | M |

**Total Security Test Cases in this file: 25**
