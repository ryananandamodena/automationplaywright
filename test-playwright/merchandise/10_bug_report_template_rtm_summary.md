# Bug Report Template, Requirement Traceability Matrix & Summary

## Bug Report Template

```
Bug ID: BUG-XXX
Title: <concise summary of the defect>
Environment: Dev / Staging / Production
URL: https://merchandise-dev.modena.com/products/...
Browser: Chrome / Firefox / Safari / Edge
Version: <browser/app version>
Severity: Blocker / Critical / Major / Minor / Trivial
Priority: P1 / P2 / P3

Preconditions:
- <state needed to reproduce>

Steps to Reproduce:
1.
2.
3.

Expected Result:
<what should happen>

Actual Result:
<what actually happened>

Screenshot: [placeholder]
Video: [placeholder]

Developer Notes:
<space for dev triage>

QA Notes:
<additional observations, related test ID>

Root Cause:
<filled after investigation>

Recommendation:
<suggested fix or mitigation>
```

## Requirement Traceability Matrix (RTM)

| Req ID | Module | Feature | Test Case IDs | Priority | Status | Automation Status |
|---|---|---|---|---|---|---|
| REQ-01 | Product Listing | Browse/search/filter/sort products | FUNC-PLP-001–009, FUNC-SRC-003–004, FUNC-FLT-005–007, FUNC-SRT-008–009, UI-PLP-001–008 | High | Not Started | Automation Ready |
| REQ-02 | Product Detail | View product, select variant, add to cart/wishlist | FUNC-PDP-010–015, UI-PDP-001–008 | High | Not Started | Automation Ready |
| REQ-03 | Cart | Manage cart items, apply coupon | FUNC-CRT-016–019, UI-CRT-001–003, NEG-007–010, BVA-001–004 | Critical | Not Started | Automation Ready |
| REQ-04 | Wishlist | Save/manage favourite products | FUNC-WSH-020–021, NEG-025 | Medium | Not Started | Automation Ready |
| REQ-05 | Checkout | Address, shipping, payment selection, order placement | FUNC-CKO-022–025, UI-CKO-004–005, NEG-011–017 | Critical | Not Started | Automation Ready |
| REQ-06 | Payment | Complete payment via gateway | FUNC-PAY-026, API-PAY-022–023, SEC-022 | Critical | Not Started | Automation Ready |
| REQ-07 | Order Management | View/cancel/reorder past orders | FUNC-ORD-027–030 | High | Not Started | Automation Ready |
| REQ-08 | Authentication | Register/login/logout/password reset | FUNC-AUTH-031–035, UI-AUTH-006–007, SEC-001–006, API-AUTH-024–031 | Critical | Not Started | Automation Ready |
| REQ-09 | Profile | Update profile, change password, manage addresses | FUNC-PRF-036–038, UI-PRF-008 | Medium | Not Started | Automation Ready |
| REQ-10 | Security | AuthZ, injection, CSRF/CORS, rate limiting | SEC-001–025, API-ORD-020, API-CC-034 | Critical | Not Started | Manual + Automated |
| REQ-11 | Accessibility | WCAG-compliant navigation and content | A11Y-001–010 | Medium | Not Started | Manual (axe-assisted) |
| REQ-12 | Responsive/Compatibility | Cross-device, cross-browser support | RSP-001–013, BRW-001–008 | High | Not Started | Automation Ready |
| REQ-13 | Performance | Fast load, good Core Web Vitals | PERF-001–015 | High | Not Started | Automation Ready (Lighthouse CI) |
| REQ-14 | UI Consistency | Visual parity with mockup | All UI-* test cases | Medium | Not Started | Visual Regression |
| REQ-15 | E2E Business Flows | Full guest/registered purchase journeys | E2E-001–010 | Critical | Not Started | Automation Ready |

---

## Summary

1. **Total UI Test Cases:** 32
2. **Total Functional Test Cases:** 38
3. **Total API Test Cases:** 36
4. **Total Security Test Cases:** 25
5. **Total Performance Test Cases:** 15
6. **Total Accessibility Test Cases:** 10
7. **Total Regression Test Cases:** ~140 (aggregated from all above, tag-mapped in [09_regression_smoke_sanity.md](09_regression_smoke_sanity.md))
8. **Total Smoke Test Cases:** 8
9. **Total E2E Test Cases:** 10
10. **Estimated Automation Coverage:** ~75% (functional/API/E2E/regression are Playwright/API-automatable; UI visual diffing needs a visual-regression tool; accessibility and a few exploratory/security cases remain manual)

11. **High-Risk Areas**
    - Checkout/payment idempotency (duplicate order/payment on double-click, refresh, or network retry)
    - Stock race conditions on concurrent last-unit checkout
    - Authorization boundaries on order/profile endpoints (IDOR risk)
    - Coupon/pricing logic manipulated client-side vs. server-side recalculation
    - Session/cookie security configuration

12. **Recommendations**
    - Run one live exploration pass (Playwright) against both the dev site and the Vercel mockup to convert this document from "assumed modules" to verified, screenshot-backed test cases.
    - Prioritize automating the Smoke suite in CI first, then Functional/API, before investing in visual regression tooling (e.g. Applitools/Percy) for full UI parity checks — this repo already has Applitools setup scripts.
    - Add contract tests for the payment webhook signature validation given it's a common real-world vulnerability.

13. **Missing Features** — to be confirmed once live exploration is done (e.g. confirm if guest checkout, dark mode, or loyalty points exist on this site).

14. **UI Differences from Mockup** — pending live visual comparison; use the UI test file's VR-tagged cases with a visual regression tool for objective diffing rather than manual eyeballing.

15. **Business Logic Improvements** — enforce server-side price/stock recalculation at checkout regardless of client state; add idempotency keys to order-creation requests.

16. **Suggested UX Improvements** — ensure clear stock/low-stock messaging pre-checkout; make session-expiry-during-checkout recoverable without losing cart contents.

17. **Suggested Performance Optimisations** — verify image formats/lazy-loading on product grids; ensure code-splitting keeps initial JS bundle lean for listing/PDP.

18. **Suggested Security Improvements** — implement rate limiting/lockout on login, verify CORS/CSP/security headers, and add IDOR checks on all user-scoped endpoints (orders, addresses, wishlist).
