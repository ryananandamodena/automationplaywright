# Merchandise QA Test Suite

**Application under test (AUT):** https://merchandise-dev.modena.com/products/
**UI Reference (mockup):** https://modena-merch-official.vercel.app
**Prepared:** 2026-07-30

> Note: The markdown test-case files (01-10) were authored from standard
> e-commerce module analysis before live access was available. A follow-up live
> exploration pass (see [automation/](automation/)) confirmed the real site is an
> Astro app with: product listing (`/products`, 7 seed products, category/price/
> size/color filters), PDP (`/product/{id}`), login (`/login`, demo account
> `customer@modena.com` / `customer123`), header cart/wishlist/orders icons, and
> `/orders`, `/favorites` pages. Checkout/payment/coupon/wishlist-page/order-detail
> screens were NOT reached during exploration — treat those specific test cases
> (checkout, payment, coupon, order management) as unverified until walked
> through manually, and the UI mockup comparison (01) is still unverified since
> the Vercel mockup wasn't crawled.

## Automation

[automation/](automation/) contains runnable Playwright specs (`npx playwright test merchandise/automation`)
built from real, verified selectors — not guesses. Start there if you want
working `.spec.js` files instead of the markdown test-case tables. See
[automation/README.md](automation/README.md) for scope, known gaps, and a
selector gotcha worth knowing about (`text="M"` collides with the header logo).

## Files

| File | Contents |
|---|---|
| [01_ui_test_cases.md](01_ui_test_cases.md) | UI/visual/mockup-comparison test cases |
| [02_functional_test_cases.md](02_functional_test_cases.md) | CRUD & feature-level functional test cases (positive) |
| [03_e2e_test_cases.md](03_e2e_test_cases.md) | End-to-end business flow scenarios |
| [04_api_test_cases.md](04_api_test_cases.md) | API validation (assumed REST endpoints) |
| [05_security_test_cases.md](05_security_test_cases.md) | Security & authZ/authN test cases |
| [06_negative_boundary_test_cases.md](06_negative_boundary_test_cases.md) | Negative testing + boundary value analysis |
| [07_accessibility_responsive_compatibility.md](07_accessibility_responsive_compatibility.md) | A11y, responsive, cross-browser |
| [08_performance_test_cases.md](08_performance_test_cases.md) | Performance/Core Web Vitals |
| [09_regression_smoke_sanity.md](09_regression_smoke_sanity.md) | Regression, smoke, sanity suites |
| [10_bug_report_template_rtm_summary.md](10_bug_report_template_rtm_summary.md) | Bug report template, RTM, and final summary/recommendations |
| [11_cms_admin_test_cases.md](11_cms_admin_test_cases.md) | Enterprise-style test case analysis for the `/cms` admin panel (Dashboard, Products, Orders, Stock, Users, Roles, Categories, Settings), in Indonesian — includes a flagged Critical access-control observation (role menu restrictions vs. actual page access) |
| [12_cms_sitemap_flow_coverage.md](12_cms_sitemap_flow_coverage.md) | CMS sitemap, business flow diagrams (Mermaid), coverage estimate per module, and Playwright automation recommendations — companion to file 11 |
| [cms/automation/](cms/automation/) | Runnable Playwright specs for the CMS admin panel (`npx playwright test merchandise/cms/automation`) — read-only smoke suite, verified passing live |
| [QA_MASTER_PROMPT_TEMPLATE.md](QA_MASTER_PROMPT_TEMPLATE.md) | Reusable enterprise-grade QA analysis prompt template (Indonesian), plus notes on this app's SSO-only login and limited-stock products |
| `generate_testcase_excel.cjs` | Generates the 113 CMS test cases from file 11 as an Excel workbook — writes to `~/Downloads/CMS_Test_Cases.xlsx` (filterable, one row per TC ID, plus a Summary sheet with counts per module/status). Run `node merchandise/generate_testcase_excel.cjs` after editing file 11 to refresh it — never hand-edit the `.xlsx` directly, it'll be overwritten. |
| `generate_storefront_testcase_excel.cjs` | Same idea for the storefront design docs (01-09) — each file uses its own column schema (unlike file 11's uniform one), so this parses every markdown table generically. Writes `~/Downloads/Merchandise_Storefront_Test_Cases.xlsx`: one sheet per source file (245 test cases total) + a normalized "All Test Cases" sheet + a Summary sheet. |
| `generate_automation_report_excel.cjs` | The actual **execution** report (as opposed to the design docs above) — real pass/fail/skip counts from every `npx playwright test` run performed this session across both `automation/` and `cms/automation/`, plus two chart images (stacked bar per spec file, pass/fail/skip donut). Writes `~/Downloads/Merchandise_Automation_Report.xlsx`. Neither `xlsx` nor `exceljs` can author native Excel charts, so the charts are pre-rendered PNGs (Playwright screenshot of a small self-contained SVG/HTML page) embedded via `exceljs`'s image support — see the workbook's own "Method" sheet for how to regenerate them after a new run. |

## Modules Covered

Product Listing, Product Detail, Category Navigation, Search, Filter/Sort,
Wishlist, Shopping Cart, Checkout, Payment, Order/Order History, User Profile,
Authentication (Login/Register/Logout/Password Reset), Coupon/Voucher, Shipping,
Header/Footer/Navigation, Notifications/Toasts, Error & Empty States.
