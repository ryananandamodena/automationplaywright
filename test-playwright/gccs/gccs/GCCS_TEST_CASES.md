# GCCS - Global Customer Care System
# Dokumentasi Test Case Komprehensif

**Aplikasi**: GCCS (Global Customer Care System) by MODENA  
**URL**: https://gccs-test.modena.com/  
**Login Test**: sysadmin / P@ssw0rd.1  
**Tanggal Dibuat**: 2025  

---

## BAGIAN 1: DAFTAR SEMUA MENU & SUB MENU

| No | Menu Utama | Sub Menu | URL Path |
|----|------------|----------|----------|
| 1 | Dashboard | - | /dashboard |
| 2 | Call Center | Call Entry | /call-center/call-entry |
| 3 | Call Center | Customer Info | /call-center/customer-info |
| 4 | Call Center | Membership Subscription | /call-center/membership-subscription |
| 5 | Call Center | KKS | /call-center/kks |
| 6 | Call Center | VOC List | /call-center/voc-list |
| 7 | Call Center | CIAO | /call-center/ciao |
| 8 | Call Center | Customer Product Registration | /call-center/customer-product-registration |
| 9 | Call Center | Request Visit | /call-center/request-visit |
| 10 | Repair Center | Work Order Monitoring | /repair-center/wo-monitoring |
| 11 | Repair Center | Input Work Order Result | /repair-center/wo-input-result |
| 12 | Repair Center | Work Order History | /repair-center/wo-history |
| 13 | Repair Center | Work Order Re-Transfer | /repair-center/wo-retransfer |
| 14 | Repair Center | Work Order Pending | /repair-center/wo-pending |
| 15 | Repair Center | Work Order Validation | /repair-center/wo-validation |
| 16 | Repair Center | Work Order Revision | /repair-center/wo-revision |
| 17 | Repair Center | Work Order Confirmation | /repair-center/wo-confirmation |
| 18 | Repair Center | Technician Deposit | /repair-center/technician-deposit |
| 19 | Repair Center | Work Order Dispatch | /repair-center/wo-dispatch |
| 20 | Repair Center | Claim Warranty | /repair-center/claim-warranty |
| 21 | Repair Center | List Req Add On Cost | /repair-center/list-req-addon-cost |
| 22 | Repair Center | Technician Incentive Data | /repair-center/technician-incentive-data |
| 23 | Repair Center | Technician Incentive | /repair-center/technician-incentive-edit |
| 24 | Repair Center | Pre Work Order History | /repair-center/pre-wo-history |
| 25 | Inventory | Transfer | /inventory/transfer |
| 26 | Inventory | My Inventory | /inventory/myinventory |
| 27 | Inventory | Posting List | /inventory/posting |
| 28 | Inventory | Inventory Status | /inventory/inventory-status |
| 29 | Inventory | Purchase | /inventory/purchase |
| 30 | Inventory | ETA | /inventory/eta |
| 31 | Inventory | Pending Part Monitoring | /inventory/pending-part-monitoring |
| 32 | Direct Sales | Part Sales | /direct-sales/part-sales |
| 33 | Direct Sales | Membership | /direct-sales/membership |
| 34 | Direct Sales | Validation | /direct-sales/validation |
| 35 | Direct Sales | Revision | /direct-sales/revision |
| 36 | Customer Survey | Survey Management | /customer-survey/survey-management |
| 37 | Customer Survey | Setup Target | /customer-survey/setup-target |
| 38 | Customer Survey | Survey Running | /customer-survey/survey-running |
| 39 | Customer Survey | Survey Progress | /customer-survey/survey-progress |
| 40 | Setup | General | /setup/general |
| 41 | Setup | User & Roles Access | /setup/user-roles |
| 42 | Setup | Organization | /setup/organization |
| 43 | Setup | VOC | /setup/voc |
| 44 | Setup | Master Knowledge | /setup/master-knowledge |
| 45 | Setup | Warehouse | /setup/warehouse |
| 46 | Report | Pending Part | /report/pending-part |
| 47 | Report | Service Omzet Achievement | /report/omzet-service-operation |
| 48 | Report | Spare Part Already Fulfill | /report/sparepart-already-fulfill-so |
| 49 | Report | AP | /report/asc-ap |
| 50 | Report | Highest Pending Part | /report/highest-pending-part |

---

## BAGIAN 2: TEST SCENARIO (HIGH LEVEL)

### A. Authentication
| TS-ID | Scenario | Prioritas |
|-------|----------|-----------|
| TS-AUTH-01 | Login dengan kredensial valid | High |
| TS-AUTH-02 | Login dengan kredensial tidak valid | High |
| TS-AUTH-03 | Logout dari sistem | High |
| TS-AUTH-04 | Akses halaman tanpa login (redirect ke login) | High |

### B. Dashboard
| TS-ID | Scenario | Prioritas |
|-------|----------|-----------|
| TS-DASH-01 | Verifikasi dashboard tampil setelah login | Medium |
| TS-DASH-02 | Navigasi ke semua menu dari dashboard | Medium |

### C. Call Center - Call Entry
| TS-ID | Scenario | Prioritas |
|-------|----------|-----------|
| TS-CE-01 | Tampilkan halaman Call Entry | High |
| TS-CE-02 | Cari customer berdasarkan nomor telepon | High |
| TS-CE-03 | Tambah produk baru untuk customer | High |
| TS-CE-04 | Buat Explanation (Konsultasi) baru | High |
| TS-CE-05 | Buat Work Order dari Call Entry | High |
| TS-CE-06 | Buat VOC dari Call Entry | Medium |
| TS-CE-07 | Lihat List Product customer | Medium |
| TS-CE-08 | Lihat List Membership customer | Medium |
| TS-CE-09 | Lihat List Explanation history | Medium |
| TS-CE-10 | Lihat List Work Order history | Medium |

### D. Call Center - Customer Info
| TS-ID | Scenario | Prioritas |
|-------|----------|-----------|
| TS-CI-01 | Tampilkan halaman Customer Info | Medium |
| TS-CI-02 | Cari customer berdasarkan nama/nomor | Medium |
| TS-CI-03 | Lihat detail customer | Medium |

### E. Repair Center - Work Order Monitoring
| TS-ID | Scenario | Prioritas |
|-------|----------|-----------|
| TS-WO-01 | Tampilkan halaman Work Order Monitoring | High |
| TS-WO-02 | Filter WO berdasarkan Head Technician | High |
| TS-WO-03 | Filter WO berdasarkan Activity Status | High |
| TS-WO-04 | Filter WO berdasarkan Service Center | High |
| TS-WO-05 | Filter WO berdasarkan tanggal | High |
| TS-WO-06 | Filter WO berdasarkan WO Number | High |
| TS-WO-07 | Lihat detail Work Order | High |
| TS-WO-08 | Export data WO ke Excel | Medium |
| TS-WO-09 | Input Work Order Result | High |
| TS-WO-10 | Re-Transfer Work Order | Medium |
| TS-WO-11 | Dispatch Work Order ke teknisi | High |

### F. Inventory
| TS-ID | Scenario | Prioritas |
|-------|----------|-----------|
| TS-INV-01 | Tampilkan My Inventory | High |
| TS-INV-02 | Tampilkan Inventory Status | High |
| TS-INV-03 | Filter inventory berdasarkan item | Medium |
| TS-INV-04 | Transfer item antar gudang | High |
| TS-INV-05 | Lihat Posting List | Medium |
| TS-INV-06 | Lihat status ETA | Medium |
| TS-INV-07 | Monitor Pending Part | High |

### G. Direct Sales
| TS-ID | Scenario | Prioritas |
|-------|----------|-----------|
| TS-DS-01 | Tampilkan Part Sales | Medium |
| TS-DS-02 | Tampilkan Membership | Medium |
| TS-DS-03 | Validasi transaksi Direct Sales | Medium |
| TS-DS-04 | Revisi transaksi Direct Sales | Low |

### H. Customer Survey
| TS-ID | Scenario | Prioritas |
|-------|----------|-----------|
| TS-CS-01 | Tampilkan Survey Management | Medium |
| TS-CS-02 | Setup Target Survey | Medium |
| TS-CS-03 | Jalankan Survey Running | Medium |
| TS-CS-04 | Lihat Survey Progress | Medium |

### I. Report
| TS-ID | Scenario | Prioritas |
|-------|----------|-----------|
| TS-RPT-01 | Generate laporan Pending Part | High |
| TS-RPT-02 | Generate Service Omzet Achievement | High |
| TS-RPT-03 | Generate laporan Spare Part Already Fulfill | Medium |
| TS-RPT-04 | Generate laporan AP | Medium |
| TS-RPT-05 | Generate laporan Highest Pending Part | Medium |

---

## BAGIAN 3: TEST CASE DETAIL

### TC-AUTH-001: Login Berhasil dengan Kredensial Valid

| Field | Value |
|-------|-------|
| **TC ID** | TC-AUTH-001 |
| **Modul** | Authentication |
| **Scenario** | Login dengan username dan password valid |
| **Prioritas** | High |
| **Precondition** | Aplikasi GCCS dapat diakses, user sysadmin terdaftar |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Buka URL https://gccs-test.modena.com/ | Halaman login tampil dengan form username & password |
| 2 | Input username: `sysadmin` | Field username terisi |
| 3 | Input password: `P@ssw0rd.1` | Field password terisi (masked) |
| 4 | Klik tombol Login/Submit | Redirect ke halaman Dashboard |
| 5 | Verifikasi nama user di header | Tampil "Administrasi - System Admin" |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

### TC-AUTH-002: Login Gagal dengan Password Salah

| Field | Value |
|-------|-------|
| **TC ID** | TC-AUTH-002 |
| **Modul** | Authentication |
| **Scenario** | Login dengan password tidak valid |
| **Prioritas** | High |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Buka URL https://gccs-test.modena.com/ | Halaman login tampil |
| 2 | Input username: `sysadmin` | Field terisi |
| 3 | Input password: `wrongpassword` | Field terisi |
| 4 | Klik Login | Pesan error tampil (incorrect credentials) |
| 5 | Verifikasi tetap di halaman login | URL tidak berubah ke /dashboard |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

### TC-AUTH-003: Login Gagal dengan Username Kosong

| Field | Value |
|-------|-------|
| **TC ID** | TC-AUTH-003 |
| **Modul** | Authentication |
| **Scenario** | Login tanpa mengisi username |
| **Prioritas** | High |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Buka URL https://gccs-test.modena.com/ | Halaman login tampil |
| 2 | Biarkan username kosong | - |
| 3 | Input password: `P@ssw0rd.1` | - |
| 4 | Klik Login | Validasi field required tampil |
| 5 | Verifikasi tidak redirect | Tetap di halaman login |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

### TC-CE-001: Tampilkan Halaman Call Entry

| Field | Value |
|-------|-------|
| **TC ID** | TC-CE-001 |
| **Modul** | Call Center > Call Entry |
| **Scenario** | Verifikasi halaman Call Entry dapat diakses dan tampil benar |
| **Prioritas** | High |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Login sebagai sysadmin | Berhasil login |
| 2 | Klik menu "Call Center" di sidebar | Submenu tampil |
| 3 | Klik submenu "Call Entry" | Navigasi ke /call-center/call-entry |
| 4 | Verifikasi judul halaman | Tampil "Call Entry" |
| 5 | Verifikasi section "Customer Info" | Form customer tampil dengan field: Phone Number, Customer Name, Address, Province, City, Email, Company Name, dll. |
| 6 | Verifikasi section "Product Info" | Form product tampil dengan field: Sales Model, Existing Model, Sub Category, Model, Brand, Product Name, Serial Number, dll. |
| 7 | Verifikasi tab "List Product" dan "List Membership" | Kedua tab tampil |
| 8 | Verifikasi tab "List Explanation", "List Work Order", "List Pre Work Order", "List VOC" | Semua tab tampil |
| 9 | Verifikasi tab "Explanation", "Work Order", "VOC" | Semua tab tampil |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

### TC-CE-002: Cari Customer Berdasarkan Nomor Telepon

| Field | Value |
|-------|-------|
| **TC ID** | TC-CE-002 |
| **Modul** | Call Center > Call Entry |
| **Scenario** | Mencari data customer menggunakan nomor telepon |
| **Prioritas** | High |
| **Test Data** | Phone Number: 08123456789 (gunakan nomor yang terdaftar di sistem) |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Buka halaman Call Entry | Halaman tampil |
| 2 | Input nomor telepon valid di field "Phone Number" | Field terisi |
| 3 | Tekan Enter atau klik ikon search | Sistem mencari data customer |
| 4 | Verifikasi data customer terisi otomatis | Customer Name, Address, Province, City, Email, Company Name terisi |
| 5 | Verifikasi List Product tampil | Tabel menampilkan produk milik customer |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

### TC-CE-003: Cari Customer dengan Nomor Tidak Terdaftar

| Field | Value |
|-------|-------|
| **TC ID** | TC-CE-003 |
| **Modul** | Call Center > Call Entry |
| **Scenario** | Input nomor telepon yang tidak terdaftar (negative test) |
| **Prioritas** | High |
| **Test Data** | Phone Number: 0000000000 (tidak terdaftar) |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Buka halaman Call Entry | Halaman tampil |
| 2 | Input nomor telepon tidak valid: `0000000000` | Field terisi |
| 3 | Tekan Enter | Sistem mencari data |
| 4 | Verifikasi pesan "Customer not found" atau data kosong | Tidak ada data yang terisi pada form customer |
| 5 | Verifikasi List Product kosong | "No results found" tampil |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

### TC-WO-001: Tampilkan Halaman Work Order Monitoring

| Field | Value |
|-------|-------|
| **TC ID** | TC-WO-001 |
| **Modul** | Repair Center > Work Order Monitoring |
| **Scenario** | Verifikasi halaman WO Monitoring tampil dengan benar |
| **Prioritas** | High |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Login sebagai sysadmin | Berhasil login |
| 2 | Klik menu "Repair Center" | Submenu tampil |
| 3 | Klik "Work Order Monitoring" | Navigasi ke /repair-center/wo-monitoring |
| 4 | Verifikasi judul | "WO Monitoring" tampil |
| 5 | Verifikasi filter: Head Technician | Dropdown "Select Head Technician" tampil |
| 6 | Verifikasi filter: WO Activity Status | Dropdown "Select Activity Status" tampil |
| 7 | Verifikasi filter: Service Center | Dropdown "Select Service Center" tampil |
| 8 | Verifikasi filter tanggal: WO Created Date, WO Request Visit Date, WO Schedule Date | Date picker tampil |
| 9 | Verifikasi tombol Filter dan Export to Excel | Kedua tombol tampil |
| 10 | Verifikasi kolom tabel: WO Number, RON Number, Sales Model, Customer Name, Phone Number, Service Center, WO Activity Status, dll | Semua kolom tampil |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

### TC-WO-002: Filter Work Order Berdasarkan Status

| Field | Value |
|-------|-------|
| **TC ID** | TC-WO-002 |
| **Modul** | Repair Center > Work Order Monitoring |
| **Scenario** | Filter WO menggunakan WO Activity Status |
| **Prioritas** | High |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Buka halaman WO Monitoring | Halaman tampil |
| 2 | Klik dropdown "Select Activity Status" | Daftar status tampil |
| 3 | Pilih salah satu status (misal: "PENDING") | Status terpilih |
| 4 | Klik tombol "Filter" | Data ter-filter |
| 5 | Verifikasi semua data yang tampil memiliki status yang dipilih | Kolom WO Activity Status sesuai filter |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

### TC-INV-001: Tampilkan My Inventory

| Field | Value |
|-------|-------|
| **TC ID** | TC-INV-001 |
| **Modul** | Inventory > My Inventory |
| **Scenario** | Verifikasi halaman My Inventory tampil dengan benar |
| **Prioritas** | High |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Login sebagai sysadmin | Berhasil login |
| 2 | Klik menu "Inventory" | Submenu tampil |
| 3 | Klik "My Inventory" | Navigasi ke /inventory/myinventory |
| 4 | Verifikasi judul "My Inventory" | Tampil |
| 5 | Verifikasi info: Technician ID, Username, Fullname | Tampil |
| 6 | Verifikasi info: Limit Amount, Usage Amount, Balanced Limit Amount | Nilai Rp tampil |
| 7 | Verifikasi tab "ASC Warehouse" dan "MODENA Warehouse" | Kedua tab tampil |
| 8 | Verifikasi kolom tabel: No, Photo, Booked Status, Item Name, Item Code, Item Group Name, Old Item Code, Stock, Booked, Availability, Price | Semua kolom tampil |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

### TC-RPT-001: Generate Laporan Pending Part

| Field | Value |
|-------|-------|
| **TC ID** | TC-RPT-001 |
| **Modul** | Report > Pending Part |
| **Scenario** | Membuka dan memfilter laporan Pending Part |
| **Prioritas** | High |

**Steps:**
| No | Step | Expected Result |
|----|------|-----------------|
| 1 | Login sebagai sysadmin | Berhasil login |
| 2 | Klik menu "Report" | Submenu tampil |
| 3 | Klik "Pending Part" | Navigasi ke /report/pending-part |
| 4 | Verifikasi halaman laporan tampil | Judul dan form filter tampil |
| 5 | Klik tombol filter/search | Data laporan tampil atau "No results found" |

| **Actual Result** | *[Diisi saat eksekusi]* |
| **Status** | *[Pass/Fail]* |

---

## BAGIAN 4: PRIORITAS TEST

| Kategori | High Priority | Medium Priority | Low Priority |
|----------|---------------|-----------------|--------------|
| Authentication | Login valid, invalid, empty | Logout, session timeout | Remember me |
| Call Center | Call Entry form, Search customer | Customer Info, Membership Subscription, KKS | CIAO |
| Repair Center | WO Monitoring, Input WO Result, WO Dispatch | WO Validation, WO Revision, WO Confirmation, Claim Warranty | Technician Incentive |
| Inventory | My Inventory, Inventory Status | Transfer, Posting List, Purchase, ETA | - |
| Direct Sales | - | Part Sales, Membership, Validation | Revision |
| Report | Pending Part, Service Omzet | Spare Part Fulfill, AP, Highest Pending | - |
| Setup | - | User & Roles Access, Organization | General, VOC, Master Knowledge, Warehouse |
| Survey | - | Survey Management, Setup Target | Survey Running, Progress |

---

## BAGIAN 5: NEGATIVE TEST CASE

| TC ID | Modul | Scenario | Input | Expected Result |
|-------|-------|----------|-------|-----------------|
| TC-NEG-001 | Login | Login dengan username kosong | username: "" | Validasi required field |
| TC-NEG-002 | Login | Login dengan password kosong | password: "" | Validasi required field |
| TC-NEG-003 | Login | SQL injection pada field login | `' OR 1=1 --` | Error/tidak login |
| TC-NEG-004 | Login | XSS pada field login | `<script>alert(1)</script>` | Input disanitasi, tidak execute |
| TC-NEG-005 | Call Entry | Nomor telepon format tidak valid | `abc123` | Validasi format nomor |
| TC-NEG-006 | Call Entry | Nomor telepon terlalu panjang | `08123456789012345678` | Validasi max length |
| TC-NEG-007 | Call Entry | Cari customer nomor tidak terdaftar | `0000000000` | "Customer not found" |
| TC-NEG-008 | WO Monitoring | Filter tanggal end < start | Start: 31/12/2025, End: 01/01/2025 | Validasi range tanggal |
| TC-NEG-009 | Inventory | Akses halaman tanpa role inventory | Login user non-admin | Akses ditolak atau menu tidak tampil |
| TC-NEG-010 | Navigation | Akses URL langsung tanpa login | /call-center/call-entry | Redirect ke halaman login |
| TC-NEG-011 | Call Entry | Submit form tanpa isi field required | Klik Save tanpa data | Validasi required fields tampil |

---

## BAGIAN 6: CONTOH DATA DUMMY

### Data Customer Test
```
Phone Number  : 081234567890
Customer Name : Budi Santoso
Address       : Jl. Sudirman No. 100
Province      : DKI Jakarta
City          : Jakarta Selatan
Email         : budi.santoso@email.com
Company Name  : PT Contoh Indonesia
```

### Data Product Test
```
Sales Model   : [Pilih dari dropdown yang tersedia]
Serial Number : SN202500001
Dealer        : [Pilih dari pencarian dealer]
Purchase Date : 01/01/2024
```

### Data Work Order Filter Test
```
WO Number         : WO-2025-001
Head Technician   : [Pilih dari dropdown]
Activity Status   : PENDING
Service Center    : [Pilih dari dropdown]
Created Date From : 01/01/2025
Created Date To   : 31/12/2025
```

### Data Login Test
```
Valid User     : sysadmin / P@ssw0rd.1
Invalid User   : sysadmin / wrongpassword
Empty User     : "" / P@ssw0rd.1
SQL Injection  : ' OR 1=1 -- / test
```

---

## BAGIAN 7: STRUKTUR FOLDER AUTOMATION TESTING

```
test-playwright/
└── more1/
    └── gccs/
        ├── README.md
        ├── playwright.config.gccs.js
        ├── GCCS_TEST_CASES.md          ← File ini
        ├── helpers/
        │   ├── login.js               ← Helper login GCCS
        │   └── navigation.js          ← Helper navigasi sidebar
        └── specs/
            ├── 01-auth.spec.js        ← Test Login/Logout
            ├── 02-dashboard.spec.js   ← Test Dashboard
            ├── 03-call-entry.spec.js  ← Test Call Entry
            ├── 04-wo-monitoring.spec.js← Test WO Monitoring
            ├── 05-inventory.spec.js   ← Test Inventory
            ├── 06-direct-sales.spec.js← Test Direct Sales
            └── 07-reports.spec.js     ← Test Reports
```
