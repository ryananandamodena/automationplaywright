# GCCS Automation Testing

Playwright E2E test suite untuk **GCCS - Global Customer Care System** by MODENA.

## Setup

```bash
cd test-playwright/more1/gccs
npm install @playwright/test
npx playwright install chromium
```

## Menjalankan Test

```bash
# Semua test
npx playwright test --config=playwright.config.gccs.js

# Test spesifik
npx playwright test specs/01-auth.spec.js --config=playwright.config.gccs.js

# Dengan report HTML
npx playwright test --config=playwright.config.gccs.js --reporter=html
```

## Struktur

```
gccs/
├── GCCS_TEST_CASES.md          ← Dokumentasi lengkap test case
├── playwright.config.gccs.js   ← Konfigurasi Playwright
├── README.md                   ← File ini
├── helpers/
│   └── login.js                ← Helper: login, navigasi
└── specs/
    ├── 01-auth.spec.js         ← TC-AUTH: Login/Logout (5 tests)
    ├── 02-dashboard.spec.js    ← TC-DASH: Dashboard (4 tests)
    ├── 03-call-entry.spec.js   ← TC-CE: Call Entry (8 tests)
    ├── 04-wo-monitoring.spec.js← TC-WO: Work Order Monitoring (8 tests)
    ├── 05-inventory.spec.js    ← TC-INV: Inventory (6 tests)
    ├── 06-direct-sales.spec.js ← TC-DS: Direct Sales (4 tests)
    ├── 07-reports.spec.js      ← TC-RPT: Reports (6 tests)
    └── 08-negative-tests.spec.js← TC-NEG: Negative/Security (10 tests)
```

**Total: ~51 test cases**

## Kredensial Test
- URL: https://gccs-test.modena.com/
- Username: `sysadmin`
- Password: `P@ssw0rd.1`
