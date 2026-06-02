# Quick Start - Vehicle Sales Form Test dengan MCP

## 🚀 Jalankan Test Sekarang!

### 1. Install Dependencies (jika belum)
```bash
cd test-playwright
npm install
npx playwright install
```

### 2. Run Test
```bash
# Run semua test
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js

# Run dengan browser visible (recommended untuk pertama kali)
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js --headed

# Run test tertentu
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js -g "TC-01"
```

### 3. View Report
```bash
npx playwright show-report
```

## 📋 Test Cases Quick Reference

| TC | Description | Duration | Priority |
|----|-------------|----------|----------|
| TC-01 | Form loads correctly | ~10s | High |
| TC-02 | Vehicle dropdown options | ~5s | Medium |
| TC-03 | Sales method options | ~5s | Medium |
| TC-04 | Create - Lelang Terbuka | ~20s | High |
| TC-05 | Create - Penjualan Langsung | ~20s | High |
| TC-06 | Save as draft - Scrap | ~15s | High |
| TC-07 | Form validation | ~10s | High |
| TC-08 | Cancel button | ~5s | Low |
| TC-09 | Batch creation | ~60s | Medium |

## ✅ Expected Results

Semua test harus **PASS** dengan kondisi:
- ✅ 9/9 tests passed
- ✅ Total duration: < 3 minutes
- ✅ No flaky tests
- ✅ Screenshots tersimpan di `test-results/sales-form/`

## ⚡ Run Commands Cepat

```bash
# Full test suite
npm run test:sales-form

# Smoke test (critical tests only)
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js -g "TC-01|TC-04|TC-05"

# Debug mode
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js --debug

# Generate video
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js --video=on
```

## 🔧 Troubleshooting

### "Test tidak berjalan"
```bash
# Pastikan di folder yang benar
cd test-playwright
pwd  # Should show: .../playwright-server/test-playwright
```

### "Browser tidak muncul"
```bash
# Install browser
npx playwright install chromium

# Run dengan --headed
npx playwright test --headed
```

### "Login gagal"
Check credentials di file spec atau environment variables.

## 📊 Output Example

```
Running 9 tests using 1 worker

  ✓ TC-01: Sales form loads correctly (8s)
  ✓ TC-02: Verify vehicle dropdown options (5s)
  ✓ TC-03: Verify sales method options (5s)
  ✓ TC-04: Create sales record - Lelang Terbuka (18s)
  ✓ TC-05: Create sales record - Penjualan Langsung (19s)
  ✓ TC-06: Save as draft - Scrap (14s)
  ✓ TC-07: Form validation - Empty required fields (9s)
  ✓ TC-08: Cancel button returns to list (5s)
  ✓ TC-09: Create multiple sales records (batch) (58s)

  9 passed (2m 21s)
```

## 🎯 Next Steps

1. ✅ Run test pertama kali
2. ✅ Review screenshots di `test-results/`
3. ✅ Check HTML report
4. ✅ Integrate ke CI/CD (optional)

Happy Testing! 🎉
