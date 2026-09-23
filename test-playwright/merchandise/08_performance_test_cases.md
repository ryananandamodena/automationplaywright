# Performance Test Cases

| Test ID | Metric | Scenario | Test Steps | Target / Expected Result | Priority | Automation |
|---|---|---|---|---|---|---|
| PERF-001 | Page Load Time | Product listing initial load | 1. Cold load /products/ 2. Measure full load time | < 3s on broadband, < 5s on 3G throttle | P1 | P (Lighthouse) |
| PERF-002 | LCP (Largest Contentful Paint) | Listing & PDP pages | 1. Run Lighthouse audit | LCP < 2.5s (Good) | P1 | P |
| PERF-003 | CLS (Cumulative Layout Shift) | Listing/PDP with images/ads loading | 1. Run Lighthouse audit while scrolling | CLS < 0.1 | P1 | P |
| PERF-004 | FID/INP | Interaction responsiveness (add to cart click) | 1. Measure input delay on primary CTA | INP < 200ms | P2 | P |
| PERF-005 | TTFB | Server response time | 1. Measure Time to First Byte on key pages | TTFB < 600ms | P2 | P |
| PERF-006 | API Response Time | Product list / cart / checkout endpoints | 1. Measure response time under normal load | 95th percentile < 800ms | P1 | API |
| PERF-007 | Image Optimization | Product images served efficiently | 1. Inspect image formats/sizes served | Modern formats (WebP/AVIF), responsive `srcset`, appropriately compressed | P2 | M |
| PERF-008 | Caching | Static assets cached | 1. Inspect cache headers for JS/CSS/images | Long-lived cache headers + cache-busting hashes present | P3 | M |
| PERF-009 | Bundle Size | JS bundle size on initial load | 1. Inspect network transfer size of JS on first load | Initial JS payload reasonably sized (no unnecessary blocking mega-bundles), code-splitting evident | P3 | M |
| PERF-010 | Lazy Loading | Below-the-fold images | 1. Inspect listing page image loading behavior on scroll | Below-fold images use `loading="lazy"` / IntersectionObserver | P3 | M |
| PERF-011 | Memory Usage | Long browsing session (infinite scroll/many PDP visits) | 1. Browse 20+ products sequentially, monitor memory in DevTools | No significant memory leak/growth over time | P3 | M |
| PERF-012 | CPU Usage | Heavy interaction (filter/sort rapid toggling) | 1. Toggle filters rapidly 2. Monitor CPU via DevTools Performance tab | No excessive main-thread blocking (>50ms long tasks) | P3 | M |
| PERF-013 | Network Usage | Total data transferred for full purchase flow | 1. Measure total network transfer for browse→checkout flow | Reasonable total payload, no redundant duplicate requests | P3 | M |
| PERF-014 | Load Testing | Concurrent users on listing/checkout | 1. Simulate 100-500 concurrent virtual users via k6/JMeter | Response times remain within SLA, error rate < 1% | P1 | Load Tool |
| PERF-015 | Checkout Under Load | Payment/order creation under load | 1. Simulate concurrent checkouts during load test | No duplicate orders, stock consistency maintained, response time acceptable | P1 | Load Tool |

**Total Performance Test Cases: 15**
