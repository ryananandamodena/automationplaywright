# Accessibility, Responsive & Cross-Browser Test Cases

## Accessibility (WCAG 2.1 AA)

| Test ID | Feature | Scenario | Test Steps | Expected Result | Priority | Automation |
|---|---|---|---|---|---|---|
| A11Y-001 | Keyboard Navigation | Full site navigable via keyboard only | 1. Tab through header, listing, PDP, cart, checkout | All interactive elements reachable in logical order, no keyboard trap | P1 | M |
| A11Y-002 | Focus Indicator | Visible focus outline on all controls | 1. Tab through buttons/links/inputs | Clear visible focus ring, meets contrast requirement | P1 | M |
| A11Y-003 | Tab Order | Logical tab order matches visual layout | 1. Tab through PDP page | Order follows visual/reading order, not DOM-random | P2 | M |
| A11Y-004 | Screen Reader | Product card announced correctly | 1. Use NVDA/VoiceOver on listing page | Name, price, and "add to cart" action announced clearly | P1 | M |
| A11Y-005 | ARIA | Modal/drawer has proper roles | 1. Inspect cart drawer/login modal ARIA attributes | `role="dialog"`, `aria-modal="true"`, labeled correctly | P2 | M |
| A11Y-006 | Alt Text | Product images have descriptive alt text | 1. Inspect `<img>` alt attributes on listing/PDP | Meaningful alt text present, not empty/filename | P2 | P |
| A11Y-007 | Labels | Form inputs have associated labels | 1. Inspect checkout/login form inputs | Each input has `<label>` or `aria-label` | P1 | P |
| A11Y-008 | Contrast Ratio | Text/background contrast meets AA | 1. Check contrast of body text, buttons, price text | Ratio ≥ 4.5:1 for normal text, ≥3:1 for large text | P2 | M |
| A11Y-009 | Semantic HTML | Proper heading hierarchy | 1. Inspect heading structure (h1-h6) on each page | Single h1, logical nested headings, no skipped levels | P3 | M |
| A11Y-010 | Error Announcements | Form validation errors announced to screen readers | 1. Submit invalid form with screen reader active | Error text linked via `aria-describedby`/`aria-live` and announced | P2 | M |

## Responsive Testing

| Test ID | Viewport | Scenario | Expected Result | Priority | Automation |
|---|---|---|---|---|---|
| RSP-001 | 1920px (Desktop XL) | Listing/PDP/cart layout | No excessive whitespace, content max-width respected | P2 | P |
| RSP-002 | 1600px | Listing/PDP/cart layout | Grid adapts correctly, no overflow | P3 | P |
| RSP-003 | 1440px | Listing/PDP/cart layout | Matches mockup desktop breakpoint | P1 | P |
| RSP-004 | 1366px | Listing/PDP/cart layout | No horizontal scroll, elements fit | P2 | P |
| RSP-005 | 1024px (Tablet landscape) | Nav collapses appropriately | Menu/nav adapts, grid reflows to fewer columns | P2 | P |
| RSP-006 | 768px (Tablet portrait) | Full flow (browse→cart→checkout) | Fully usable, no clipped elements | P1 | P |
| RSP-007 | 414px (Mobile large) | Full flow (browse→cart→checkout) | Fully usable, tap targets ≥44px | P1 | P |
| RSP-008 | 390px (iPhone 12/13) | Full flow | Fully usable | P1 | P |
| RSP-009 | 375px (iPhone SE/8) | Full flow | Fully usable | P1 | P |
| RSP-010 | 360px (Android common) | Full flow | Fully usable | P1 | P |
| RSP-011 | 320px (smallest common mobile) | Full flow | No text/button clipping, no horizontal scroll | P2 | P |
| RSP-012 | Landscape orientation (mobile) | Rotate device on PDP | Layout adapts, no broken elements | P3 | M |
| RSP-013 | Portrait orientation (mobile) | Default check | Baseline layout correct | P3 | M |

## Cross-Browser / Compatibility

| Test ID | Browser | Scenario | Expected Result | Priority | Automation |
|---|---|---|---|---|---|
| BRW-001 | Chrome (latest) | Full purchase flow | Works without visual/functional defects | P1 | P |
| BRW-002 | Firefox (latest) | Full purchase flow | Works without visual/functional defects | P1 | P |
| BRW-003 | Safari (latest, macOS/iOS) | Full purchase flow | Works, especially date pickers/payment iframes | P1 | P |
| BRW-004 | Edge (latest) | Full purchase flow | Works without visual/functional defects | P2 | P |
| BRW-005 | Opera | Smoke check of core flow | Core flow works | P3 | M |
| BRW-006 | Brave | Smoke check with default shields on | Core flow works, no blocked critical scripts | P3 | M |
| BRW-007 | Mobile Safari (iOS) | Full purchase flow | Works, especially fixed-position elements | P1 | M |
| BRW-008 | Mobile Chrome (Android) | Full purchase flow | Works | P1 | M |

**Total: A11y 10 · Responsive 13 · Cross-Browser 8**
