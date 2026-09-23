# Playwright Video Tutorial Automation — MoRe Development Modena (SO & PO)

Test automation suite menggunakan **Playwright** untuk pengujian alur kerja Sales Order (SO) dan Purchase Order (PO) pada portal **MoRe Development Modena** (`https://more-dev.modena.com/`). Suite ini dirancang untuk menghasilkan **rekaman video tutorial** dan **screenshot evidence berurutan** untuk setiap test case.

---

## 📋 Daftar Test Case

| Test Case ID | Nama Test Case | Item / SKU | Stock Source | Output Video |
|---|---|---|---|---|
| **TC-SO-001** | Create Sales Order - INDEN | `BH 2725 GABK` | Warehouse Indent | `videos/TC-SO-001-Create-SO-Inden.webm` |
| **TC-SO-002** | Create Sales Order - READY | `BH 2725 GBBK` | Warehouse Ready | `videos/TC-SO-002-Create-SO-Ready.webm` |
| **TC-PO-001** | Create PO from SO - INDEN | `BH 2725 GABK` | Ref TC-SO-001 | `videos/TC-PO-001-Create-PO-From-SO-Inden.webm` |
| **TC-PO-002** | Create PO from SO - READY | `BH 2725 GBBK` | Ref TC-SO-002 | `videos/TC-PO-002-Create-PO-From-SO-Ready.webm` |

---

## 🛠️ Struktur Direktori

```text
more1/so-po-tutorial/
├── specs/
│   ├── TC-SO-001-create-so-inden.spec.js
│   ├── TC-SO-002-create-so-ready.spec.js
│   ├── TC-PO-001-create-po-from-so-inden.spec.js
│   └── TC-PO-002-create-po-from-so-ready.spec.js
├── utils/
│   ├── testData.js            # Definisi data uji & SKU
│   ├── loginHelper.js         # Otentikasi & pemilihan company
│   ├── screenshotHelper.js    # Pengelolaan evidence per step
│   ├── videoHelper.js         # Penataan & rename video rekaman
│   ├── stepAnnotation.js      # Logger step tutorial ke terminal
│   └── soDataStore.js         # Penyimpan SO ID untuk kebutuhan PO
├── screenshots/               # Folder evidence per Test Case
│   ├── TC-SO-001/
│   ├── TC-SO-002/
│   ├── TC-PO-001/
│   └── TC-PO-002/
├── videos/                    # File video hasil tutorial (.webm)
├── playwright-report/         # HTML report Playwright
├── .env.example               # Contoh konfigurasi kredensial
├── .gitignore                 # Filter file sensitif & output test
├── playwright.config.js       # Konfigurasi Playwright tutorial
└── README.md                  # Dokumentasi panduan
```

---

## ⚙️ Persiapan & Instalasi

### 1. Salin Environment Variables
Salin file `.env.example` ke file `.env` di direktori root atau direktori suite ini:
```bash
cp .env.example .env
```

Pastikan variabel berikut sudah terisi:
```env
MORE_BASE_URL=https://more-dev.modena.com/
MHC_EMAIL=ryan.ananda@modena.com
MHC_PASSWORD=<PASSWORD_ANDA>
PLAYWRIGHT_HEADLESS=false
```
> ⚠️ **Catatan Keamanan:** Jangan pernah melakukan commit file `.env` yang memuat password ke version control (Git).

---

## 🚀 Menjalankan Test Suite

Jalankan perintah berikut dari root folder `test-playwright`:

### 1. Menjalankan Seluruh Test Case (Serial SO ➔ PO)
PO membutuhkan nomor SO yang dihasilkan oleh SO test, sehingga dijalankan secara serial (`workers: 1`):
```bash
npx playwright test --config more1/so-po-tutorial/playwright.config.js
```

### 2. Menjalankan Single Test Case Tertentu
```bash
# Menjalankan TC-SO-001 (SO Inden)
npx playwright test more1/so-po-tutorial/specs/TC-SO-001-create-so-inden.spec.js --config more1/so-po-tutorial/playwright.config.js

# Menjalankan TC-SO-002 (SO Ready)
npx playwright test more1/so-po-tutorial/specs/TC-SO-002-create-so-ready.spec.js --config more1/so-po-tutorial/playwright.config.js

# Menjalankan TC-PO-001 (PO Inden)
npx playwright test more1/so-po-tutorial/specs/TC-PO-001-create-po-from-so-inden.spec.js --config more1/so-po-tutorial/playwright.config.js

# Menjalankan TC-PO-002 (PO Ready)
npx playwright test more1/so-po-tutorial/specs/TC-PO-002-create-po-from-so-ready.spec.js --config more1/so-po-tutorial/playwright.config.js
```

### 3. Mode Headed (Browser Ditampilkan)
Untuk melihat browser bergerak secara visual dan memeriksa jalannya tutorial secara langsung:
```bash
npx playwright test --config more1/so-po-tutorial/playwright.config.js --headed
```

---

## 📊 Hasil Uji & Media Rekaman

Setelah pengujian selesai dijalankan:
1. **Video Tutorial**: Tersedia di direktori `more1/so-po-tutorial/videos/` dalam format `.webm` dengan viewport standar 1280x720.
2. **Screenshot Evidence**: Tersimpan berurutan berdasarkan nomor langkah di `more1/so-po-tutorial/screenshots/<TC-ID>/`.
3. **HTML Report**: Buka laporan interaktif Playwright dengan:
   ```bash
   npx playwright show-report more1/so-po-tutorial/playwright-report
   ```
