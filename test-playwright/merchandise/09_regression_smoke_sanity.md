# Regression, Smoke & Sanity Test Suites

## Smoke Test Suite (run on every build)

| Test ID | Scenario | Expected Result | Priority |
|---|---|---|---|
| SMK-001 | Homepage/listing loads | Products render without error | Critical |
| SMK-002 | Search returns results | Valid keyword returns products | Critical |
| SMK-003 | PDP opens | Product detail loads correctly | Critical |
| SMK-004 | Add to cart | Item added, cart badge updates | Critical |
| SMK-005 | Login works | Valid credentials log user in | Critical |
| SMK-006 | Checkout reaches payment step | Cart → address → payment step reachable | Critical |
| SMK-007 | Order placement succeeds | Order created with valid test data | Blocker |
| SMK-008 | Logout works | Session ends correctly | Critical |

## Sanity Test Suite (run after deployment/hotfix)

| Test ID | Scenario | Expected Result | Priority |
|---|---|---|---|
| SAN-001 | Affected feature from latest deploy works | Specific fixed bug/feature behaves as expected | Critical |
| SAN-002 | Core navigation unaffected | Header/footer/menu links work | High |
| SAN-003 | Cart & checkout unaffected by unrelated deploy | Full cart→checkout flow still functions | Critical |
| SAN-004 | No new console errors | No JS errors in browser console on key pages | High |
| SAN-005 | API health check | Key endpoints return 200 with valid schema | Critical |

## Regression Test Suite (mapped from full suite, tag-based)

| Category | Test IDs Included | Priority | Automation Status |
|---|---|---|---|
| Product Listing & Search | FUNC-PLP-001–009, FUNC-SRC-003–004 | Critical/High | Automation Ready |
| Product Detail | FUNC-PDP-010–015 | Critical/High | Automation Ready |
| Cart & Wishlist | FUNC-CRT-016–019, FUNC-WSH-020–021 | Critical | Automation Ready |
| Checkout & Payment | FUNC-CKO-022–025, FUNC-PAY-026 | Blocker/Critical | Automation Ready |
| Order Management | FUNC-ORD-027–030 | High | Automation Ready |
| Authentication & Profile | FUNC-AUTH-031–035, FUNC-PRF-036–038 | Blocker/High | Automation Ready |
| Security (IDOR, XSS, SQLi, CSRF) | SEC-001–025 | Critical/Blocker | Manual + Automated Mix |
| API Contract | API-PRD/CRT/CKO/ORD/PAY/AUTH-001–036 | Critical/High | Automation Ready |
| Negative & Boundary | NEG-001–025, BVA-001–017 | Medium/High | Automation Ready |
| UI Visual Regression | UI-HDR/PLP/PDP/CRT/CKO/AUTH/PRF/RSP-001–032 | Medium | Visual Regression Tool |
| Accessibility | A11Y-001–010 | Medium | Manual (axe-core assisted) |
| Performance | PERF-001–015 | Medium | Automation Ready (Lighthouse CI) |

**Recommendation:** Run Smoke suite on every PR/merge, Sanity suite after every production deploy,
full Regression suite weekly or before major release.
