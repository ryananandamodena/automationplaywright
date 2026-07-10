# GCCS Mobile - Automated Testing Suite

## Overview

Automated end-to-end testing untuk **GCCS Mobile Application** menggunakan Playwright dengan emulator BlueStacks.

## Platform & Environment

- **Platform**: Android Emulator (BlueStacks)
- **Browser**: Chrome Android
- **Testing Framework**: Playwright
- **Test Type**: Functional Testing, E2E Testing
- **Execution Mode**: Automated

## Test Credentials

```javascript
Username: TEC_IDR002
Password: password.1
```

## Prerequisites

### 1. Install Dependencies

```bash
cd playwright-server/test-playwright/gccs/mobile
npm install @playwright/test
npx playwright install chromium
npx playwright install-deps
```

### 2. BlueStacks Setup (Optional)

Jika menggunakan BlueStacks emulator:

1. Install BlueStacks 5
2. Enable Android Debug Bridge (ADB)
3. Connect via ADB:
   ```bash
   adb connect localhost:5555
   ```

### 3. Environment Configuration

Update `baseURL` di file test sesuai environment:

```javascript
const MOBILE_CONFIG = {
  baseURL: 'https://gccs-mobile-test.modena.com', // Your actual URL
  timeout: 30000,
  navigationTimeout: 30000
};
```

## Running Tests

### Run All Tests

```bash
npx playwright test mobile_gccs.spec.js
```

### Run Specific Test

```bash
# Login test only
npx playwright test mobile_gccs.spec.js -g "Login Application"

# Confirmation process
npx playwright test mobile_gccs.spec.js -g "Confirmation Process"

# Negative tests
npx playwright test mobile_gccs.spec.js -g "NEG"
```

### Run with UI Mode

```bash
npx playwright test mobile_gccs.spec.js --ui
```

### Run with Debug Mode

```bash
npx playwright test mobile_gccs.spec.js --debug
```

### Generate HTML Report

```bash
npx playwright test mobile_gccs.spec.js --reporter=html
npx playwright show-report
```

## Test Scenarios

### ✅ Scenario 1 - Login Application
**TC-MOB-001**

- Launch aplikasi GCCS Mobile
- Input username: `TEC_IDR002`
- Input password: `password.1`
- Klik tombol Login
- **Expected**: Login berhasil, redirect ke Dashboard

### ✅ Scenario 2 - Open Dashboard
**TC-MOB-002**

- Verifikasi Dashboard tampil
- Verifikasi data order muncul
- **Expected**: Dashboard loaded, no infinite loading, no errors

### ✅ Scenario 3 - Select RON Waiting Confirmation
**TC-MOB-003**

- Cari RON dengan status "Waiting Confirmation"
- Pilih record pertama
- Klik record
- **Expected**: Detail RON terbuka dengan data lengkap

### ✅ Scenario 4 - Confirmation Process
**TC-MOB-004**

- Klik tombol "Confirmation"
- Tunggu proses selesai
- **Expected**: Status berubah, success message muncul

### ✅ Scenario 5 - Start Visit
**TC-MOB-005**

- Klik tombol "Start Visit"
- Grant GPS permission
- **Expected**: Visit dimulai, status "In Progress", GPS recorded

## Negative Testing

### ❌ TC-MOB-NEG-001: Invalid Login
- Username: `TEC_IDR002`
- Password: `wrongpassword`
- **Expected**: Login gagal, error message tampil

### ❌ TC-MOB-NEG-002: Double Click Confirmation
- **Expected**: Tidak membuat data duplikat

### ❌ TC-MOB-NEG-003: Double Click Start Visit
- **Expected**: Sistem menolak request kedua

## Validation Checklist

### ✓ Login Validation
- [x] Username field tersedia
- [x] Password field tersedia
- [x] Login button aktif
- [x] Login success
- [x] Session created

### ✓ Dashboard Validation
- [x] Dashboard loaded
- [x] Data loaded
- [x] No broken UI
- [x] No crash

### ✓ Waiting Confirmation Validation
- [x] Record ditemukan
- [x] Status sesuai
- [x] Detail dapat dibuka

### ✓ Confirmation Validation
- [x] Tombol aktif
- [x] Success response
- [x] Status berubah

### ✓ Start Visit Validation
- [x] Tombol aktif
- [x] GPS berfungsi
- [x] Visit berhasil dibuat
- [x] Status "In Progress"

## Screenshot & Evidence

Semua test secara otomatis mengambil screenshot di setiap step penting:

```
screenshots/
├── 01-app-loaded.png
├── 02-login-page-ready.png
├── 03-username-entered.png
├── 04-password-entered.png
├── 05-login-clicked.png
├── 06-dashboard-loaded.png
├── 07-dashboard-verified.png
├── 08-ron-found.png
├── 09-ron-detail-loaded.png
├── 10-before-confirmation.png
├── 11-confirmation-success.png
├── 12-before-start-visit.png
├── 13-start-visit-success.png
├── 14-invalid-credentials.png
├── 15-login-error-shown.png
├── 16-double-click-prevented.png
└── 17-double-start-prevented.png
```

## Video Recording

Video otomatis direkam untuk setiap test. Lihat di folder:
```
test-results/
└── [test-name]/
    └── video.webm
```

## Network & Console Logs

Console logs dan network requests otomatis dicatat:

```javascript
// Console logs
page.on('console', msg => console.log(`[BROWSER LOG] ${msg.type()}: ${msg.text()}`));

// Page errors
page.on('pageerror', err => console.error(`[PAGE ERROR] ${err.message}`));
```

## Bug Reporting

Jika menemukan bug, gunakan helper function:

```javascript
import { generateBugReport } from './mobile_gccs.spec.js';

const bugReport = generateBugReport({
  module: 'GCCS Mobile',
  feature: 'Login / Dashboard / Confirmation / Start Visit',
  severity: 'Critical / High / Medium / Low',
  stepsToReproduce: 'Detail langkah...',
  actualResult: 'Hasil aktual...',
  expectedResult: 'Hasil yang diharapkan...',
  screenshot: 'path/to/screenshot.png',
  video: 'path/to/video.webm',
  device: 'BlueStacks Android',
  browser: 'Chrome Android'
});
```

## Troubleshooting

### Issue: Test tidak bisa connect ke BlueStacks

**Solution**:
```bash
# Check ADB devices
adb devices

# Restart ADB server
adb kill-server
adb start-server

# Connect to BlueStacks
adb connect localhost:5555
```

### Issue: GPS/Geolocation tidak bekerja

**Solution**:
```javascript
// Pastikan permission granted di test
await context.grantPermissions(['geolocation']);
await context.setGeolocation({ 
  longitude: 106.8456, 
  latitude: -6.2088 
});
```

### Issue: Selector tidak ditemukan

**Solution**:
- Gunakan Playwright Inspector untuk cari selector yang tepat:
  ```bash
  npx playwright test mobile_gccs.spec.js --debug
  ```
- Update selector di test sesuai actual DOM

### Issue: Timeout error

**Solution**:
```javascript
// Increase timeout
test.setTimeout(120000); // 2 minutes

// Or adjust global timeout
const MOBILE_CONFIG = {
  timeout: 60000,
  navigationTimeout: 60000
};
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: GCCS Mobile E2E Tests

on:
  push:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * *' # Run daily at 2 AM

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: |
          npm install
          npx playwright install chromium
          npx playwright install-deps
      - name: Run tests
        run: npx playwright test mobile_gccs.spec.js
      - name: Upload report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Coverage

| Feature | Test Cases | Status |
|---------|-----------|--------|
| Login | 2 | ✅ |
| Dashboard | 1 | ✅ |
| RON Selection | 1 | ✅ |
| Confirmation | 2 | ✅ |
| Start Visit | 2 | ✅ |
| **Total** | **8** | **100%** |

## Contact & Support

Untuk pertanyaan atau issue:
- Create ticket di JIRA
- Contact QA Team
- Email: qa-team@modena.com

---

**Last Updated**: 2026-06-08  
**Maintained by**: QA Automation Team
