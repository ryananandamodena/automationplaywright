# MHC Automation Test Suite

Sistem automation testing end-to-end untuk **https://mhc-dev.modena.com** (MoRe MHC - MODENA RETAIL).

---

## Fitur

| Fitur | Status |
|---|---|
| Navigasi & akses semua menu | ✅ |
| CRUD Testing (SO, PO, User) | ✅ |
| Form Validation (required, format, boundary) | ✅ |
| Search, Filter, Sorting | ✅ |
| UI Functional (pagination, modal, dropdown) | ✅ |
| API Failure Detection (4xx/5xx) | ✅ |
| Console Error Capture | ✅ |
| Screenshot otomatis saat failure | ✅ |
| HTML Report + JSON Report | ✅ |
| Email Report otomatis (bug → email) | ✅ |
| Page Object Model (modular) | ✅ |
| GitHub Actions / CI scheduled | ✅ |

---

## Struktur Proyek

```
test-playwright/more1/mhc-full/
├── playwright.config.js          # Konfigurasi Playwright
├── run-and-report.mjs            # Runner utama + kirim email
├── .env.example                  # Template env vars
├── README.md                     # Dokumentasi ini
│
├── pages/                        # Page Object Model (POM)
│   ├── BasePage.js               # Base class semua pages
│   ├── LoginPage.js              # Login page
│   ├── SalesOrderPage.js         # Sales Order list + actions
│   └── UserManagementPage.js     # User CRUD
│
├── fixtures/
│   └── test-data.js              # Data test: valid, invalid, keyword, dll
│
├── helpers/
│   ├── login.js                  # Helper login & page check
│   ├── api-monitor.js            # Monitor API failures & console errors
│   └── email-reporter.mjs        # Kirim email report via SMTP
│
├── specs/                        # Test specs (dijalankan berurutan)
│   ├── 01-dashboard.spec.js      # Dashboard load & menu visibility
│   ├── 02-sales-order.spec.js    # SO list, create wizard, detail
│   ├── 03-purchase-order.spec.js # PO list, create form
│   ├── 04-operations.spec.js     # Delivery, Inventory, Stock Ready, dll
│   ├── 05-admin.spec.js          # Profile, User, Role, Sync SAP
│   ├── 06-staging-data.spec.js   # 12 staging menus (PPN, PPH, BP, dll)
│   ├── 07-form-validation.spec.js# Login validation, user form, SO wizard
│   ├── 08-search-filter.spec.js  # Search valid/no-result/special, sort
│   └── 09-ui-functional.spec.js  # Pagination, modal, dropdown, performance
│
└── .github/
    └── workflows/
        └── playwright.yml        # GitHub Actions (jadwal + manual)
```

---

## Cara Run

### Prasyarat

```bash
# Dari direktori test-playwright/
npm install

# Install Playwright browsers (pertama kali)
npx playwright install chromium
```

### Run Manual (Semua Test + Email)

```bash
cd test-playwright/more1/mhc-full

# Dengan browser visible
node run-and-report.mjs

# Headless (background)
node run-and-report.mjs --headless

# Tanpa kirim email
node run-and-report.mjs --no-email
```

### Run Manual (Playwright langsung)

```bash
cd test-playwright/more1/mhc-full

# Semua test
npx playwright test --config=playwright.config.js --headed

# Spec tertentu
npx playwright test specs/07-form-validation.spec.js --headed --reporter=line

# Test name tertentu
npx playwright test --grep "SO Search" --headed
```

### Lihat HTML Report

```bash
npx playwright show-report playwright-report
```

---

## Konfigurasi Email (SMTP)

1. Salin `.env.example` menjadi `.env`
2. Isi dengan SMTP credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password    # bukan password biasa!
EMAIL_FROM=MHC Automation <your-gmail@gmail.com>
EMAIL_TO=ryan.ananda@modena.com
```

> **Gmail**: Aktifkan 2FA → Google Account → Security → App Passwords → buat app password

---

## GitHub Actions (CI/CD)

### Setup Secrets di GitHub Repository

Buka **Settings → Secrets and variables → Actions** → tambahkan:

| Secret | Nilai |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | email pengirim |
| `SMTP_PASS` | Gmail App Password |
| `EMAIL_FROM` | email pengirim |

### Jadwal Default

Tests berjalan otomatis **Senin–Jumat jam 08:00 WIB** (cron: `0 1 * * 1-5`).

Untuk ubah jadwal, edit `.github/workflows/playwright.yml`:

```yaml
schedule:
  - cron: '0 1 * * 1-5'   # jam 08:00 WIB setiap hari kerja
```

### Manual Trigger

GitHub → Actions → **MHC Automation Tests** → **Run workflow**

---

## Daftar Test Case

### 01 - Dashboard (1 test)
- Dashboard load, sidebar visible, menu Sales/Purchase/Delivery visible

### 02 - Sales Order (3 tests)
- SO list: heading, tabel, Create New button, search input
- Buka wizard Create SO, customer table visible
- Buka detail SO pertama

### 03 - Purchase Order (2 tests)
- PO list: heading, tabel, Create button
- Buka form Create PO

### 04 - Operations (7 tests)
- Delivery, Inventory Transfer, Operational Cost, Balance Inquiry, Withdrawal, Stock Ready, PO Verification

### 05 - Admin (4 tests)
- Profile load
- User list: heading, tabel, Create button
- Buka form Create User
- Role list: tabel visible

### 06 - Staging Data (12 tests)
- PPN, PPH, BP, BP Branch, BP Group, BP Address, Bank, Legal, Warehouse, Order Type, GL Account, Series

### 07 - Form Validation (7 tests)
- Login: email kosong, password kosong, email invalid, kredensial salah, 3 invalid credentials
- User: submit form kosong (required validation), email format invalid
- SO wizard: lanjut tanpa pilih customer

### 08 - Search & Filter (7 tests)
- SO: search valid, search no-result, search special chars/SQL injection, sort kolom, filter panel
- PO: search valid dan no-result
- User: search valid/no-result, search special chars

### 09 - UI Functional (6 tests)
- Pagination: SO next/prev, User pagination
- Modal: wizard SO buka dan tutup
- Dropdown: Profile select, SO filter dropdown
- Performance: semua menu load < 15 detik
- Blank page detection
- Sidebar navigation

**Total: ~49 test cases**

---

## Email Report

Jika ada bug/failure, email dikirim ke `ryan.ananda@modena.com` berisi:

- Jumlah passed/failed/skipped
- Tabel bug: nama test, halaman, deskripsi error
- Timestamp
- Link ke HTML report (jika CI/CD)

Subject format:
- `❌ [MHC Automation] 3 Bug Ditemukan - 2026-05-04`
- `✅ [MHC Automation] Semua Test Passed - 2026-05-04`

---

## Menambahkan Test Baru

1. Buat file `specs/10-nama-fitur.spec.js`
2. Import helpers: `import { login } from '../helpers/login.js'`
3. Gunakan POM jika ada: `import { SalesOrderPage } from '../pages/SalesOrderPage.js'`
4. Monitor API: `import { setupApiMonitor } from '../helpers/api-monitor.js'`
5. Jalankan: `npx playwright test specs/10-nama-fitur.spec.js --headed`

---

## Troubleshooting

| Problem | Solusi |
|---|---|
| Test gagal karena timeout | Naikkan `test.setTimeout(120000)` |
| Login gagal | Cek credential di `helpers/login.js` atau `fixtures/test-data.js` |
| Email tidak terkirim | Cek `.env` dan App Password Gmail |
| Selector tidak ditemukan | Gunakan Playwright Inspector: `npx playwright codegen https://mhc-dev.modena.com` |
| Browser tidak terbuka | Jalankan `npx playwright install chromium` |
