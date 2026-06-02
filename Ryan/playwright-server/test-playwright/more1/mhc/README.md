# MHC E2E Testing - Staging Data CRUD

Automated end-to-end testing untuk semua menu di bawah **Staging Data** pada aplikasi MHC (MoRe).

## 📋 Menu yang Ditest

Test case CRUD telah dibuat untuk 12 menu berikut:

| No | Menu | File Test | URL Path |
|----|------|-----------|----------|
| 1 | PPN | `ppn-crud.spec.js` | `/sync-sap/ppn/list` |
| 2 | PPH | `pph-crud.spec.js` | `/sync-sap/pph/list` |
| 3 | BP | `bp-crud.spec.js` | `/sync-sap/bp/list` |
| 4 | BP Branch | `bp-branch-crud.spec.js` | `/sync-sap/bp-branch/list` |
| 5 | BP Group | `bp-group-crud.spec.js` | `/sync-sap/bp-group/list` |
| 6 | BP Address | `bp-address-crud.spec.js` | `/sync-sap/bp-address/list` |
| 7 | Bank | `bank-crud.spec.js` | `/sync-sap/bank/list` |
| 8 | Legal | `legal-crud.spec.js` | `/sync-sap/legal/list` |
| 9 | Warehouse | `warehouse-crud.spec.js` | `/sync-sap/warehouse/list` |
| 10 | Order Type | `order-type-crud.spec.js` | `/sync-sap/order-type/list` |
| 11 | GL Account | `gl-account-crud.spec.js` | `/sync-sap/gl-account/list` |
| 12 | Series | `series-crud.spec.js` | `/sync-sap/series/list` |

## 🧪 Test Coverage

Setiap menu memiliki 6 test case:

1. **READ** - Menampilkan list data
2. **CREATE** - Membuat data baru
3. **SEARCH** - Filter/pencarian data
4. **UPDATE** - Update data existing
5. **DELETE** - Hapus data
6. **VALIDATION** - Validasi form (required fields)

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit credentials
nano .env
```

**Environment Variables:**
```bash
MHC_BASE_URL=https://mhc-dev.modena.com
MHC_EMAIL=muhzaenal5@gmail.com
MHC_PASSWORD=P@ssw0rd
```

### 2. Install Dependencies

```bash
cd playwright-server
npm install
npx playwright install chromium
```

### 3. Run Tests

#### Run Single Menu Test
```bash
cd test-playwright
npx playwright test mhc/staging/ppn-crud.spec.js
```

#### Run All Staging Data Tests
```bash
npx playwright test mhc/staging/
```

#### Run with UI (Headed Mode)
```bash
npx playwright test mhc/staging/ppn-crud.spec.js --headed
```

#### Run Specific Test
```bash
npx playwright test mhc/staging/ppn-crud.spec.js -g "READ"
```

## 📁 Project Structure

```
mhc/
├── README.md                           # This file
├── explore-staging-menu.mjs            # Menu explorer script
├── generate-all-staging-tests.mjs      # Test generator script
├── templates/
│   └── crud-template.spec.js           # Template for CRUD tests
└── staging/
    ├── ppn-crud.spec.js                # PPN CRUD tests
    ├── pph-crud.spec.js                # PPH CRUD tests
    ├── bp-crud.spec.js                 # BP CRUD tests
    ├── bp-branch-crud.spec.js          # BP Branch CRUD tests
    ├── bp-group-crud.spec.js           # BP Group CRUD tests
    ├── bp-address-crud.spec.js         # BP Address CRUD tests
    ├── bank-crud.spec.js               # Bank CRUD tests
    ├── legal-crud.spec.js              # Legal CRUD tests
    ├── warehouse-crud.spec.js          # Warehouse CRUD tests
    ├── order-type-crud.spec.js         # Order Type CRUD tests
    ├── gl-account-crud.spec.js         # GL Account CRUD tests
    └── series-crud.spec.js             # Series CRUD tests
```

## 🔧 Customization

### Modify Test Data

Edit file test yang sesuai dan update bagian form filling:

```javascript
// Example: ppn-crud.spec.js
test('2. CREATE - Should create new PPN record', async () => {
  // ... existing code ...
  
  // Customize form fields here
  await page.fill('input[name="code"]', 'TEST-PPN-001');
  await page.fill('input[name="rate"]', '11');
  await page.fill('input[name="description"]', 'Test PPN Description');
  
  // ... rest of code ...
});
```

### Add More Test Cases

Tambahkan test case baru di file yang sesuai:

```javascript
test('7. EXPORT - Should export data to Excel', async () => {
  console.log('\n📍 TEST: EXPORT DATA');
  
  const exportButton = page.locator('button:has-text("Export")');
  if (await exportButton.count() > 0) {
    await exportButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ EXPORT: Success');
  }
});
```

## 📊 Test Reports

### View Test Results

```bash
# Run tests with reporter
npx playwright test mhc/staging/ --reporter=html

# Open report
npx playwright show-report
```

### Screenshots

Screenshots otomatis disimpan untuk setiap step:
- `mhc-{menu}-list.png` - List page
- `mhc-{menu}-create-form.png` - Create form
- `mhc-{menu}-search.png` - Search results
- `mhc-{menu}-update-form.png` - Update form
- `mhc-{menu}-validation.png` - Validation errors

## 🐛 Troubleshooting

### Issue: Login Failed
```bash
# Check credentials in .env
cat .env

# Test login manually
npx playwright test mhc/staging/ppn-crud.spec.js --headed --debug
```

### Issue: Element Not Found
```bash
# Run in headed mode to see UI
npx playwright test mhc/staging/ppn-crud.spec.js --headed

# Increase timeout
# Edit test file and increase waitForTimeout values
```

### Issue: Test Timeout
```bash
# Increase global timeout in playwright.config.js
timeout: 60000  // 60 seconds
```

## 🔄 Regenerate Tests

Jika ada perubahan pada menu atau struktur, regenerate semua test:

```bash
cd mhc
node generate-all-staging-tests.mjs
```

## 📝 Best Practices

1. **Always run tests in order** - CREATE → READ → UPDATE → DELETE
2. **Use unique test data** - Avoid conflicts with existing data
3. **Clean up after tests** - Delete test data after completion
4. **Check screenshots** - Review screenshots when tests fail
5. **Update selectors** - If UI changes, update element selectors

## 🎯 CI/CD Integration

### GitHub Actions

```yaml
name: MHC E2E Tests

on:
  push:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd playwright-server
          npm ci
          npx playwright install chromium
      
      - name: Run MHC tests
        env:
          MHC_EMAIL: ${{ secrets.MHC_EMAIL }}
          MHC_PASSWORD: ${{ secrets.MHC_PASSWORD }}
        run: |
          cd playwright-server/test-playwright
          npx playwright test mhc/staging/
      
      - name: Upload screenshots
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: mhc-screenshots
          path: playwright-server/test-playwright/*.png
```

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check dokumentasi di file ini
2. Review screenshots dari failed tests
3. Run tests in headed mode untuk debugging
4. Contact team untuk bantuan

---

**Last Updated**: April 14, 2026
**Version**: 1.0.0
**Status**: Production Ready ✅
