# Performance Testing (k6)

Load/stress tests for the 7 apps covered by the E2E suite: FMS, MHC, GCCS, PRIVE, SFA, SCMP, Service1.

## Prerequisites

Install the k6 binary (not an npm package):

- Windows: `choco install k6` or `winget install k6`
- Mac: `brew install k6`
- Linux/CI: see https://k6.io/docs/get-started/installation/

## Run a single app

```bash
cd test-playwright/performance
k6 run -e APP=fms load-test.js
```

`APP` must be one of: `fms`, `mhc`, `gccs`, `prive`, `sfa`, `scmp`, `service1` (see `apps.config.js`).

Optional overrides:
- `VUS_RAMP` — peak virtual users (default `10`)
- `HOLD_DURATION` — how long to hold peak load (default `2m`)

```bash
k6 run -e APP=mhc -e VUS_RAMP=30 -e HOLD_DURATION=5m load-test.js
```

## Run all apps

```bash
cd test-playwright/performance
./run-all.sh            # default: 10 VUs, 2m hold
./run-all.sh 30 5m       # 30 VUs, 5m hold
```

Summaries are written to `test-playwright/performance/results/<app>-summary.json`.

## What it measures

Each run ramps virtual users 0 → N over 30s, holds N for the configured duration, then ramps back to 0.
For every page in `apps.config.js` it checks:
- HTTP status is 2xx/3xx
- Response loads under 3s
- p95 response time under 2s (threshold — fails the run if breached)
- Error rate under 1% (threshold)

## Scope note

This currently load-tests the public/login page URL per app (unauthenticated). It does not simulate
authenticated user flows (login + transaction) because those apps are SPAs with JS-driven login rather
than simple form POSTs. If deeper authenticated-flow load testing is needed, that requires either:
- reverse-engineering each app's login API and scripting it directly in k6, or
- using k6's browser module to drive real browser sessions (slower, fewer VUs per run).

## Known limitations

- **MHC**: the reverse proxy for `more-dev.modena.com` returns 404 for requests without a browser-like
  `Accept` header (k6's default `http.get` doesn't send one). Fixed in `load-test.js` by sending
  standard browser headers (`Accept`, `Accept-Language`, `User-Agent`) on every request.
- **PRIVE** (`prive-living.com`): protected by Cloudflare bot-challenge (`Cf-Mitigated: challenge`).
  Plain HTTP requests (curl, k6 `http.get`) always get a 403, even with browser-like headers, because
  the challenge requires executing JavaScript. Load testing this app requires either an allowlist
  exception from the Cloudflare/infra team for the test source IP, or driving it with k6's browser
  module (real headless Chromium) instead of plain HTTP requests.

## Adding/editing target URLs

Edit `apps.config.js` — each app has a `urls` array; add more entries to test additional pages per app.
