# MODENA SUPPLIER PORTAL - E2E AUTOMATION TEST SUITE (DATA-DRIVEN)

Dokumentasi Automation Testing untuk web portal **Modena Supplier** (`https://supplier.modena.com`) menggunakan **Playwright**, **Tesseract.js** (Auto OCR Captcha Engine), dan **Data-Driven Testing (3 Data Variasi per Skenario)**.

---

## 1. Informasi Target & Dataset

- **URL Aplikasi**: `https://supplier.modena.com`
- **File Test**: [supplier.spec.js](file:///c:/Users/ryan.ananda/AppData/Roaming/Kilo-Code/MCP/playwright-server/Ryan/test-playwright/supplier/supplier.spec.js)
- **Dataset Terstruktur**: [supplier-test-data.json](file:///c:/Users/ryan.ananda/AppData/Roaming/Kilo-Code/MCP/playwright-server/Ryan/test-playwright/supplier/data/supplier-test-data.json)
- **Helper Auth & OCR**: [auth.helper.js](file:///c:/Users/ryan.ananda/AppData/Roaming/Kilo-Code/MCP/playwright-server/Ryan/test-playwright/supplier/helpers/auth.helper.js)

---

## 2. Rincian 3 Data Variasi per Modul

### A. 3 Data Pembuatan / Input Penagihan Baru (`/invoice/create`)

1. **Data 1: Tagihan Tunggal Standard (`INV-CREATE-01`)**
   - **Tipe**: Single Invoice Row
   - **Nomor Invoice**: `INV-MDN-REG-001`
   - **Nomor PO**: `PO-MDN-2026-001`
   - **Nominal**: `Rp 1.500.000`
   - **Checklist Dokumen**: *Faktur / Kuitansi Asli*, *Copy PO*
   - **Catatan**: *"Penagihan pengadaan sparepart reguler Batch 1"*

2. **Data 2: Tagihan Jamak / Proyek (`INV-CREATE-02`)**
   - **Tipe**: Multi-Row Invoices (2 Baris Faktur Dinamis)
   - **Baris 1**: `INV-MDN-PRJ-002A`, PO: `PO-MDN-PRJ-002`, Nominal: `Rp 3.250.000`
   - **Baris 2**: `INV-MDN-PRJ-002B`, PO: `PO-MDN-PRJ-002`, Nominal: `Rp 4.750.000`
   - **Checklist Dokumen**: *Faktur Asli*, *Faktur Pajak Asli & Copy*, *Copy PO*, *Berita Acara Serah Terima (BAST)*
   - **Catatan**: *"Penagihan proyek instalasi teknis unit Modena tahap 1 dan 2"*

3. **Data 3: Tagihan Jasa Promosi & Billboard (`INV-CREATE-03`)**
   - **Tipe**: Commercial Display & Marketing
   - **Nomor Invoice**: `INV-MDN-ADV-003`
   - **Nomor PO**: `PO-MDN-MKT-003`
   - **Nominal**: `Rp 12.500.000`
   - **Checklist Dokumen**: *Faktur Asli*, *Faktur Pajak Asli & Copy*, *BAST*, *Foto Booth / Billboard*
   - **Catatan**: *"Penagihan sewa billboard & display booth Modena Q4"*

---

### B. 3 Data Pengujian Login & Keamanan (`TC-AUTH`)
1. **Data 1 (`AUTH-DATA-01`)**: Kredensial Valid (`adm1` / `1357`) -> Berhasil Login & Redirect ke Dashboard.
2. **Data 2 (`AUTH-DATA-02`)**: Kredensial Invalid Password Salah (`adm1` / `PasswordSalah_999`) -> Gagal Login & Tetap di `/login`.
3. **Data 3 (`AUTH-DATA-03`)**: Kredensial Invalid Username Tidak Terdaftar (`vendor_tidak_terdaftar` / `1357`) -> Gagal Login & Tetap di `/login`.

---

### C. 3 Data Pencarian Daftar Penagihan (`TC-INV-LIST`)
1. **Data 1 (`INV-FILTER-01`)**: Filter tahun penagihan (`2026`).
2. **Data 2 (`INV-FILTER-02`)**: Filter status penagihan (`Draft`).
3. **Data 3 (`INV-FILTER-03`)**: Filter nomor serah terima spesifik (`2026.000417`).

---

### D. 3 Data Pencarian Logbook Faktur (`TC-LOGBOOK`)
1. **Data 1 (`LOG-FILTER-01`)**: Pencarian dengan prefix nomor invoice (`INV`).
2. **Data 2 (`LOG-FILTER-02`)**: Pencarian dengan nomor tanda terima tahun 2026 (`2026`).
3. **Data 3 (`LOG-FILTER-03`)**: Pencarian dengan nomor serah terima tahun 2025 (`2025`).

---

## 3. Hasil Eksekusi Test (31 Passed - 100%)

```text
Running 31 tests using 1 worker

  ok  1 TC-AUTH-001: Halaman login menampilkan form lengkap (1.6s)
  ok  2 TC-AUTH-002: Fitur Toggle Password dapat menampilkan dan menyembunyikan kata sandi (1.6s)
  ok  3 TC-AUTH-003: Tombol refresh captcha berhasil memperbarui gambar captcha (2.3s)
  ok  4 TC-AUTH-004: Validasi form kosong mencegah submit (2.0s)
  ok  5 TC-AUTH-AUTH-DATA-01: Pengujian Login - Kredensial Valid Utama (Sukses Login) (9.6s)
  ok  6 TC-AUTH-AUTH-DATA-02: Pengujian Login - Kredensial Invalid (Password Salah) (3.9s)
  ok  7 TC-AUTH-AUTH-DATA-03: Pengujian Login - Kredensial Invalid (Username Tidak Terdaftar) (4.0s)
  ok  8 TC-NAV-001: Verifikasi menu navigasi utama portal (1.3s)
  ok  9 TC-NAV-002: Tombol CTA "Lanjut ke Daftar Penagihan" mengarahkan ke /invoice (1.6s)
  ok 10 TC-INV-LIST: Menampilkan halaman Daftar Penagihan dan tabel data (1.4s)
  ok 11 TC-INV-LIST: Verifikasi header tabel penagihan (1.3s)
  ok 12 TC-INV-INV-FILTER-01: Pencarian Penagihan - Filter tahun 2026 (1.8s)
  ok 13 TC-INV-INV-FILTER-02: Pencarian Penagihan - Filter status Draft (2.1s)
  ok 14 TC-INV-INV-FILTER-03: Pencarian Penagihan - Filter nomor spesifik 2026.000417 (1.7s)
  ok 15 TC-INV-LIST: Tombol "Ajukan Penagihan Baru" mengarah ke /invoice/create (1.7s)
  ok 16 TC-INV-LIST: Aksi "Detail" membuka rincian faktur (1.4s)
  ok 17 TC-INV-LIST: Aksi "Cetak" membuka lembar cetak tanda terima (1.6s)
  ok 18 TC-INV-LIST: Tombol Update dan Delete tersedia pada status Draft (1.3s)
  ok 19 TC-CREATE-001: Menampilkan form input penagihan dan informasi kategori (1.4s)
  ok 20 TC-CREATE-002: Fitur Tambah Baris Faktur (Dynamic Row Addition) (1.9s)
  ok 21 TC-CREATE-003: Fitur Hapus Baris Faktur (Dynamic Row Deletion) (2.4s)
  ok 22 TC-CREATE-INV-CREATE-01: Pengisian Data Tagihan - Tagihan Tunggal Standard (1.8s)
  ok 23 TC-CREATE-INV-CREATE-02: Pengisian Data Tagihan - Tagihan Jamak / Proyek (2.4s)
  ok 24 TC-CREATE-INV-CREATE-03: Pengisian Data Tagihan - Tagihan Jasa Promosi & Billboard (2.0s)
  ok 25 TC-CREATE-006: Validasi saat submit jika nomor invoice atau berkas wajib kosong (2.7s)
  ok 26 TC-LOG-001: Menampilkan halaman Logbook Faktur dan tabel tracking (1.8s)
  ok 27 TC-LOG-002: Verifikasi kolom tabel Logbook (1.3s)
  ok 28 TC-LOG-LOG-FILTER-01: Pencarian Logbook - Keyword prefix invoice "INV" (2.1s)
  ok 29 TC-LOG-LOG-FILTER-02: Pencarian Logbook - Nomor tanda terima tahun 2026 (2.7s)
  ok 30 TC-LOG-LOG-FILTER-03: Pencarian Logbook - Nomor serah terima tahun 2025 (1.6s)
  ok 31 TC-LOGOUT-001: Logout berhasil dan mengarahkan kembali ke halaman login (2.2s)

  31 passed (1.3m)
```
