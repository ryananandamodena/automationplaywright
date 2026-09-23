# UI Test Cases (Visual / Mockup Comparison)

Legend — Severity: Blocker/Critical/Major/Minor/Trivial · Priority: P1(High)/P2(Med)/P3(Low) · Automation: Playwright(P)/Visual-Regression(VR)/Manual(M)

## Header & Navigation

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-HDR-001 | Header | Logo | Logo position/size matches mockup | Site loaded | N/A | 1. Open homepage 2. Compare logo position/size vs mockup | Logo aligned left, same height/margin as mockup | P2 | Minor | VR |
| UI-HDR-002 | Header | Nav menu | Top nav items match mockup (labels, order, spacing) | Site loaded | N/A | 1. Open homepage 2. List nav items 3. Compare order/spacing to mockup | Same items, same order, consistent spacing | P2 | Minor | VR |
| UI-HDR-003 | Header | Sticky header | Header stays fixed on scroll if mockup shows sticky behavior | Product listing page loaded | N/A | 1. Scroll down page 2. Observe header | Header remains fixed/sticky, no jump/flicker | P3 | Minor | P |
| UI-HDR-004 | Header | Search bar | Search input style (border-radius, icon, placeholder) matches mockup | Site loaded | N/A | 1. Inspect search bar 2. Compare radius/icon/placeholder text | Matches mockup styling | P2 | Minor | VR |
| UI-HDR-005 | Header | Cart icon badge | Cart icon shows item-count badge matching mockup style | Item in cart | 1 item | 1. Add item to cart 2. Observe header cart icon | Badge count visible, correct color/position | P2 | Major | P |
| UI-NAV-006 | Navigation | Submenu/dropdown | Category dropdown opens with same layout/columns as mockup | Site loaded | N/A | 1. Hover/click category menu 2. Compare dropdown layout | Same column count, spacing, hover highlight | P2 | Minor | M |
| UI-FTR-007 | Footer | Footer links & layout | Footer sections/columns match mockup | Any page loaded | N/A | 1. Scroll to footer 2. Compare column layout, links, social icons | Matches mockup layout and content | P3 | Trivial | VR |

## Product Listing Page

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-PLP-001 | Product Listing | Product card | Card layout (image, title, price, badge) matches mockup | Listing page loaded | N/A | 1. Open /products/ 2. Inspect one product card 3. Compare to mockup card | Same image ratio, spacing, font size/weight, badge position | P1 | Major | VR |
| UI-PLP-002 | Product Listing | Grid spacing | Grid gutters/margins match mockup at desktop width | Listing page loaded, 1440px viewport | N/A | 1. Set viewport 1440px 2. Compare grid gaps to mockup | Consistent gutter size, no overlap | P2 | Minor | VR |
| UI-PLP-003 | Product Listing | Hover state | Product card hover shows same elevation/shadow as mockup | Listing page loaded | N/A | 1. Hover over card 2. Observe shadow/scale/overlay | Matches mockup hover effect | P3 | Minor | M |
| UI-PLP-004 | Product Listing | Loading skeleton | Skeleton loader shown while products fetch, matches mockup shape | Slow network simulated | N/A | 1. Throttle network 2. Reload listing page 3. Observe skeleton | Skeleton placeholders match card shape/count | P2 | Minor | P |
| UI-PLP-005 | Product Listing | Empty state | No-results message/illustration matches mockup design | Search with no matching results | Keyword: "zzzznotfound" | 1. Search unmatched keyword 2. Observe empty state | Empty state text/illustration matches mockup | P2 | Minor | P |
| UI-PLP-006 | Product Listing | Pagination/Load-more | Pagination control style matches mockup (buttons vs infinite scroll) | Listing has >1 page of products | N/A | 1. Scroll to bottom of listing 2. Observe pagination control | Style/position/behavior matches mockup | P2 | Minor | M |
| UI-PLP-007 | Product Listing | Price/discount badge | Discount badge color & strikethrough price style match mockup | Product with discount exists | N/A | 1. Find discounted product 2. Compare badge/strikethrough style | Matches mockup color/typography | P2 | Minor | VR |
| UI-PLP-008 | Product Listing | Filter sidebar | Filter panel layout, checkboxes, collapse/expand icons match mockup | Listing page loaded | N/A | 1. Open filter sidebar 2. Compare layout to mockup | Same structure, spacing, icon style | P2 | Minor | VR |

## Product Detail Page

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-PDP-001 | Product Detail | Image gallery | Gallery thumbnail layout & main image size match mockup | PDP loaded | Valid product | 1. Open a product detail page 2. Compare gallery layout | Matches mockup thumbnail position/size | P1 | Major | VR |
| UI-PDP-002 | Product Detail | Zoom/lightbox | Image zoom-on-hover or click-to-lightbox behaves as per mockup | PDP loaded | N/A | 1. Hover/click main image 2. Observe zoom behavior | Zoom/lightbox behavior matches mockup | P3 | Minor | M |
| UI-PDP-003 | Product Detail | Title/price typography | Font size/weight/color for title & price match mockup | PDP loaded | N/A | 1. Inspect title/price elements 2. Compare typography | Matches mockup font spec | P2 | Minor | VR |
| UI-PDP-004 | Product Detail | Variant selector | Size/color swatches layout & selected-state style match mockup | Product has variants | N/A | 1. Open PDP with variants 2. Select a variant 3. Compare selected style | Matches mockup selected/active state | P2 | Major | P |
| UI-PDP-005 | Product Detail | Add to cart / Wishlist buttons | Button style, icon, position match mockup | PDP loaded | N/A | 1. Compare CTA buttons to mockup | Same color, radius, icon placement | P1 | Major | VR |
| UI-PDP-006 | Product Detail | Stock/availability label | Out-of-stock/low-stock label style matches mockup | Out-of-stock product exists | N/A | 1. Open out-of-stock product 2. Observe label | Label color/text matches mockup | P2 | Minor | P |
| UI-PDP-007 | Product Detail | Description/specs tabs | Tab styling and content layout match mockup | PDP loaded | N/A | 1. Switch between Description/Specs/Reviews tabs 2. Compare | Tab active-state style matches mockup | P3 | Minor | M |
| UI-PDP-008 | Product Detail | Reviews/rating stars | Star rating icon style/color matches mockup | Product has reviews | N/A | 1. Scroll to reviews section 2. Compare star icons | Matches mockup color/spacing | P3 | Trivial | VR |

## Cart, Checkout, Auth, Profile (Visual)

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-CRT-001 | Cart | Cart drawer/page layout | Cart item row layout (image, qty stepper, remove icon) matches mockup | Item in cart | 1 item | 1. Open cart 2. Compare row layout | Matches mockup spacing/icons | P1 | Major | VR |
| UI-CRT-002 | Cart | Quantity stepper | +/- stepper button style matches mockup | Item in cart | N/A | 1. Inspect stepper buttons 2. Compare style | Matches mockup border/icon | P2 | Minor | VR |
| UI-CRT-003 | Cart | Order summary box | Subtotal/shipping/total box layout matches mockup | Item in cart | N/A | 1. Compare summary box | Matches mockup layout/typography | P2 | Minor | VR |
| UI-CKO-004 | Checkout | Step indicator | Multi-step checkout progress bar matches mockup | Checkout started | N/A | 1. Enter checkout 2. Compare step indicator | Matches mockup active/completed states | P2 | Minor | VR |
| UI-CKO-005 | Checkout | Address form | Form field layout/labels match mockup | Checkout address step | N/A | 1. Compare form fields | Matches mockup field order/labels | P2 | Minor | VR |
| UI-AUTH-006 | Auth | Login/Register modal | Modal layout, field spacing, CTA button match mockup | On login page/modal | N/A | 1. Open login 2. Compare layout | Matches mockup | P2 | Minor | VR |
| UI-AUTH-007 | Auth | Validation error style | Inline error message color/icon matches mockup | Login form | Invalid email | 1. Submit invalid email 2. Observe error | Error style/color matches mockup | P2 | Minor | P |
| UI-PRF-008 | Profile | Profile page layout | Sidebar/tab layout matches mockup | Logged in | N/A | 1. Open profile page 2. Compare layout | Matches mockup | P3 | Minor | VR |
| UI-TOAST-009 | Global | Toast/notification | Success/error toast style, position, auto-dismiss timing match mockup | Any action triggering toast | N/A | 1. Trigger toast (e.g. add to cart) 2. Observe style/position/duration | Matches mockup | P2 | Minor | P |

## Responsive / Dark-Light (if applicable)

| Test ID | Module | Feature | Scenario | Preconditions | Test Data | Test Steps | Expected Result | Priority | Severity | Automation |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-RSP-001 | Global | Mobile layout | Header collapses to hamburger menu matching mockup mobile design | Viewport 375px | N/A | 1. Set viewport to 375px 2. Compare header | Matches mockup mobile layout | P1 | Major | VR |
| UI-RSP-002 | Global | Tablet layout | Product grid columns adjust (e.g. 2-col) matching mockup tablet design | Viewport 768px | N/A | 1. Set viewport 768px 2. Compare grid | Matches mockup column count | P2 | Minor | VR |
| UI-RSP-003 | Global | Dark mode | If mockup defines dark theme, colors/contrast match | Dark mode toggle available | N/A | 1. Toggle dark mode 2. Compare colors | Matches mockup dark palette | P3 | Minor | M |

**Total UI Test Cases in this file: 32**
