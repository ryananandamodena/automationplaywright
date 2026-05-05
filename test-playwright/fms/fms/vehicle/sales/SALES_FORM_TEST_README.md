# Vehicle Sales Form - Test Documentation

## 📋 Overview
Test automation untuk form penjualan kendaraan di FMS menggunakan Playwright dan MCP (Model Context Protocol).

**Form URL:** https://portal-dev.modena.com/fms/vehicle/sales/form

## 🎯 Test Coverage

### TC-01: Sales form loads correctly
- Memverifikasi semua elemen form muncul dengan benar
- Mengecek dropdown vehicle, sales method, dan input fields
- Memastikan tombol Submit dan Save Draft tersedia

### TC-02: Verify vehicle dropdown options
- Memeriksa dropdown vehicle memiliki opsi yang valid
- Memverifikasi data master vehicle dapat dimuat

### TC-03: Verify sales method options
- Memverifikasi 3 metode penjualan tersedia:
  - Lelang Terbuka (Open Auction)
  - Penjualan Langsung (Direct Sale)
  - Scrap / Besi Tua

### TC-04: Create sales record - Lelang Terbuka
- Membuat record penjualan dengan metode lelang terbuka
- Mengisi semua field required
- Submit untuk approval

### TC-05: Create sales record - Penjualan Langsung
- Membuat record penjualan langsung
- Mengisi data lengkap termasuk buyer name
- Submit untuk approval

### TC-06: Save as draft - Scrap
- Menyimpan data penjualan scrap sebagai draft
- Tidak langsung submit ke approval
- Dapat dilanjutkan kemudian

### TC-07: Form validation - Empty required fields
- Memverifikasi validasi form bekerja
- Mencegah submission dengan field kosong
- Menampilkan pesan error yang sesuai

### TC-08: Cancel button returns to list
- Memverifikasi tombol Cancel berfungsi
- Redirect kembali ke halaman list
- Tidak menyimpan perubahan

### TC-09: Create multiple sales records (batch)
- Membuat beberapa record sekaligus
- Menguji semua metode penjualan
- Menampilkan summary sukses/gagal

## 📝 Form Fields

### Required Fields (*)
1. **Select Vehicle Unit** - Dropdown pilihan kendaraan dari master data
2. **Sales Method** - Metode penjualan (3 opsi)
3. **Sale Date** - Tanggal penjualan
4. **Sale Price** - Harga jual (dalam Rupiah)

### Optional Fields
5. **Buyer Name** - Nama pembeli
6. **Notes** - Catatan tambahan
7. **STNK File** - Upload dokumen STNK
8. **BPKB File** - Upload dokumen BPKB

## 🚀 Cara Menjalankan Test

### Run All Tests
```bash
cd test-playwright
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js
```

### Run Specific Test Case
```bash
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js -g "TC-01"
```

### Run dengan UI Mode
```bash
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js --ui
```

### Run Headed Mode (Browser visible)
```bash
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js --headed
```

### Generate HTML Report
```bash
npx playwright test fms/fms/vehicle/sales/sales-form-mcp.spec.js --reporter=html
```

## 📊 Test Data

Test menggunakan 3 dataset berbeda untuk coverage yang comprehensive:

### Dataset 1: Lelang Terbuka - Complete Data
```javascript
{
  vehicleValue: 'D 2003 MOD',
  vehicleLabel: 'D 2003 MOD - Toyota Camry 2.5V AT',
  salesMethod: 'Lelang Terbuka (Open Auction)',
  saleDate: '2026-04-15',
  salePrice: '350000000',
  buyerName: 'PT Lelang Indonesia',
  notes: 'Penjualan melalui lelang terbuka resmi',
  action: 'submit'
}
```

### Dataset 2: Penjualan Langsung - Complete Data
```javascript
{
  vehicleValue: 'B 2002 MOD',
  vehicleLabel: 'B 2002 MOD - Toyota Alphard 2.5X AT',
  salesMethod: 'Penjualan Langsung (Direct Sale)',
  saleDate: '2026-04-20',
  salePrice: '500000000',
  buyerName: 'Budi Santoso',
  notes: 'Penjualan langsung ke karyawan tetap',
  action: 'submit'
}
```

### Dataset 3: Scrap - Minimum Data
```javascript
{
  vehicleValue: 'B 1231 CDS',
  vehicleLabel: 'B 1231 CDS - asdasds',
  salesMethod: 'Scrap / Besi Tua',
  saleDate: '2026-04-10',
  salePrice: '5000000',
  buyerName: '',
  notes: 'Kendaraan sudah tidak layak jalan',
  action: 'draft'
}
```

## 🔑 Environment Variables

Buat file `.env` di folder `test-playwright`:

```env
BASE_URL=https://portal-dev.modena.com
ADMIN_EMAIL=ryan.ananda@modena.com
ADMIN_PASSWORD=P@ssw0rd_ryan.ananda
```

## 📸 Screenshots

Setiap test case menghasilkan screenshot di folder:
```
test-results/sales-form/
├── tc01-form-loaded.png
├── tc02-vehicle-options.png
├── tc03-sales-method-options.png
├── tc04-before-submit.png
├── tc04-after-submit.png
├── tc05-before-submit.png
├── tc05-after-submit.png
├── tc06-before-draft.png
├── tc06-after-draft.png
├── tc07-validation.png
├── tc08-cancel.png
└── tc09-batch-results.png
```

## 🧩 MCP Integration

Test ini menggunakan pendekatan hybrid:
- **Standard Playwright** untuk test structure, assertions, dan lifecycle
- **MCP Ready** untuk future automation dengan MCP tools

### Keuntungan Pendekatan Ini:
1. ✅ Dapat dijalankan dengan `npx playwright test` standar
2. ✅ Mudah di-debug dengan Playwright tools
3. ✅ Compatible dengan CI/CD pipeline
4. ✅ Siap untuk integrasi MCP di masa depan

## 🔍 Troubleshooting

### Test Timeout
Jika test timeout, tingkatkan timeout di test.describe:
```javascript
test.describe('FMS - Vehicle Sales Form', () => {
  test.setTimeout(240000); // 4 minutes
  ...
});
```

### Selector Not Found
Jika elemen tidak ditemukan, cek dengan Playwright Inspector:
```bash
npx playwright test --debug
```

### Login Failed
Pastikan credentials benar di environment variables atau di file spec.

### Form Validation Changes
Jika validasi form berubah, update test case TC-07 sesuai behavior terbaru.

## 📈 Success Criteria

Test dianggap berhasil jika:
- ✅ Form dapat dimuat dengan semua elemen
- ✅ Dropdown memiliki opsi yang valid
- ✅ Data dapat disimpan sebagai draft
- ✅ Data dapat disubmit untuk approval
- ✅ Validasi mencegah submission data invalid
- ✅ Cancel button berfungsi dengan benar
- ✅ Batch creation berhasil minimal 80%

## 🎓 Best Practices

1. **Always use waitForTimeout** setelah action penting
2. **Take screenshots** before dan after critical actions
3. **Log setiap step** untuk debugging
4. **Use explicit waits** untuk elemen dinamis
5. **Handle popups/dialogs** dengan proper error handling

## 🚧 Future Enhancements

- [ ] Add file upload tests untuk STNK/BPKB
- [ ] Add tests untuk edit existing sales record
- [ ] Add tests untuk delete/cancel sales record
- [ ] Add visual regression testing
- [ ] Add API validation tests
- [ ] Integrate dengan actual MCP tools untuk automation

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check Playwright documentation: https://playwright.dev
2. Review test logs dan screenshots
3. Contact: ryan.ananda@modena.com
