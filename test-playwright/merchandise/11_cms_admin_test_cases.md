# CMS Admin — Test Case Analysis Menyeluruh

**Aplikasi:** MODENA CMS (`https://merchandise-dev.modena.com/cms`)
**Environment:** Development
**Browser:** Google Chrome (latest)
**Akun uji:** `admin@modena.com` (role tampil sebagai "Admin MODENA")
**Tanggal eksplorasi:** 2026-08-03
**Dihasilkan dari:** [QA_MASTER_PROMPT_TEMPLATE.md](QA_MASTER_PROMPT_TEMPLATE.md)

> Dokumen ini disusun dari eksplorasi nyata terhadap DOM live CMS (bukan asumsi) —
> setiap modul di bawah sudah dibuka dan dipetakan strukturnya sebelum test case
> ditulis. Beberapa area (mis. isi form "Add Role", detail RBAC per menu) belum
> dieksplorasi sampai ke aksi tulis/submit demi menjaga data dev tetap bersih;
> area tersebut ditandai *(belum diverifikasi hidup)*.

---

## Module Map (hasil eksplorasi live)

| Modul | URL | Fitur utama yang ditemukan |
|---|---|---|
| Dashboard | `/cms` | KPI cards (Total Sales, Orders Processed, Orders Waiting Approval, Total Products), quick actions (Add Product/Manage Stock/Review Orders), Order Status funnel, Top Products, Sales Trend chart (Recharts, filter Daily/Weekly/Monthly), Low Stock Alert (Critical <10 / Low 10–30 / Good >30), Recent Orders list |
| Products | `/cms/products` | Tabel (Product, Category, Price, Stock, SAP Code, Badge, Status, Actions), search "by name or category", pagination, **"Sync from SAP"** button, Add/Edit/Delete per baris |
| Add/Edit Product | `/cms/products/new`, `/cms/products/{id}/edit` | Form: Name, Category, Price, Badge, Stock, Description, Main Image URL + Upload, "Images per Color", Color Groups (Add Color Group/Add Color), **Sizes checkbox: S/M/L/XL/XXL/One Size + custom size input** |
| Orders | `/cms/orders` | Status filter chips (All/Pending Approval/Preparing Order/Shipped/Ready for Pickup/Delivered/Picked Up/Payment Rejected/Cancelled), list of order cards |
| Order Detail | `/cms/orders/{id}` | Items, Shipping, Payment, **SAP B1 Sales Order** panel, Customer info, Actions: **Logs, Retry SAP, Ship Order, Cancel Order** |
| Stock | `/cms/stock` | Tabel (Product, Category, Price, Stock per Size, Total Stock, Status, Action) |
| Categories | `/cms/categories` | Master data kategori produk *(list/CRUD belum dieksplorasi detail)* |
| Users | `/cms/users` | Manajemen user CMS *(list belum dieksplorasi detail — akses halaman berhasil tanpa redirect)* |
| Roles | `/cms/roles` | 3 role ditemukan: **admin** (5 menu: Dashboard/Products/Orders/Stock/Categories), **customer** (0 menu — no CMS access), **superadmin** (7 menu: Dashboard/Products/Orders/Stock/Settings/Users/Roles, ditandai "Locked" — tidak bisa diedit). Tombol "Add Role" tersedia. |
| Settings | `/cms/settings` | **Xendit Payment Gateway** (enable toggle, Secret Key, Callback Verification Token, Webhook URL + Copy), **Email Notifications** (BCC recipients), **SAP B1 Sales Order** config |

### ⚠️ Observation ditemukan saat mapping (dicatat, bukan dieksploitasi lebih jauh)

| # | Observation | Dampak potensial | Prioritas |
|---|---|---|---|
| OBS-01 | Halaman **Roles** menyatakan role **admin** hanya berhak atas 5 menu (Dashboard/Products/Orders/Stock/Categories) — **tidak termasuk Settings/Users/Roles**. Namun akun uji ini ("Admin MODENA") tampil dengan sidebar **8 menu** (termasuk Settings, Users, Roles) dan berhasil membuka `/cms/users`, `/cms/roles`, `/cms/settings` langsung tanpa redirect/403. | Kemungkinan **broken access control** — baik menu sidebar yang salah tampil (UI bug, dampak rendah) atau halaman-halaman sensitif (Settings berisi *payment gateway secret key*) benar-benar bisa diakses oleh role yang seharusnya tidak berwenang (dampak **kritis**, terkait OWASP A01 Broken Access Control). Perlu konfirmasi: akun ini sebenarnya berrole apa (admin atau superadmin), dan apakah proteksi akses ke `/cms/settings`, `/cms/users`, `/cms/roles` benar-benar ditegakkan di sisi backend, bukan hanya disembunyikan di UI. | **Kritis — verifikasi manual segera** |
| OBS-02 | Halaman **Settings** menampilkan field **Secret Key** dan **Callback Verification Token** untuk Xendit dalam bentuk `input` biasa (belum dipastikan apakah value asli ter-mask/kosong atau ter-render polos). | Jika secret key production ter-render ke DOM/response API dalam bentuk plain text, ini adalah **sensitive data exposure**. | **Tinggi — verifikasi manual** |
| OBS-03 | Form Add/Edit Product masih menyediakan ukuran **S/M/L/XL/XXL** meski seluruh produk live saat ini hanya berukuran tunggal (One Size/BESAR/350ml) — lihat [README.md](README.md) &amp; [fixtures.js](automation/fixtures.js). | Bukan bug — fitur multi-size masih didukung backend, hanya belum dipakai di data saat ini. Relevan untuk regresi jika ada produk apparel baru dengan banyak ukuran. | Info |
| OBS-04 | Tidak ditemukan tombol **Approve/Reject** eksplisit di detail order (`/cms/orders/47`) — hanya Ship Order/Cancel Order/Retry SAP/Logs, padahal filter status "Pending Approval" ada di list order dan KPI dashboard "Orders Waiting Approval". | Alur approval mungkin implisit (order pindah status otomatis) atau tombolnya hanya muncul saat status order = Pending Approval (order #47 yang dibuka berstatus "Preparing Order"). Perlu buka 1 order berstatus Pending Approval untuk konfirmasi. | Sedang — verifikasi manual |

---

## 1. Dashboard

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-DSH-001 | Dashboard | KPI Cards | Verifikasi 4 KPI card tampil dengan data benar (Total Sales, Orders Processed, Orders Waiting Approval, Total Products) | Functional | High | Major | Login sebagai admin | - | 1. Login CMS 2. Amati dashboard | Semua 4 KPI card tampil dengan angka dan trend indicator (naik/turun %) yang sesuai data order/produk aktual | - | Not Run |
| CMS-DSH-002 | Dashboard | Period Toggle | Ganti toggle Daily/Weekly/Monthly pada Sales Trend chart | Functional | Medium | Minor | Di halaman Dashboard | - | 1. Klik "Daily" 2. Klik "Monthly" | Chart dan angka "total sales" ter-update sesuai periode yang dipilih | - | Not Run |
| CMS-DSH-003 | Dashboard | Quick Action - Add Product | Klik card "Add New Product" | Functional | High | Minor | - | - | 1. Klik card | Redirect ke `/cms/products/new` | - | Not Run |
| CMS-DSH-004 | Dashboard | Low Stock Alert | Verifikasi produk dengan stok <10 muncul dengan badge "Critical", 10–30 "Low", >30 "Good" | Functional | High | Major | Ada produk dengan stok bervariasi | Produk stok 0, 2, 6, 10, 22, 28 (data live saat eksplorasi) | 1. Amati Low Stock Alert | Threshold badge sesuai: <10 Critical (merah), 10–30 Low (kuning), >30 Good (hijau) | Sesuai — produk stok 0/2/6 = Critical, 10/22/28 = Low (terverifikasi dari DOM) | Pass |
| CMS-DSH-005 | Dashboard | Broken image di Low Stock Alert | Verifikasi thumbnail produk yang `image` URL kosong (mis. OFFICE BAG, KAOS MODENA SEPAK BOLA) | UI | Medium | Major | Produk tanpa image URL | - | 1. Amati Low Stock Alert list | Fallback placeholder tampil, bukan broken image icon | **Bug terkonfirmasi (diotomasi, `cms/automation/ui.spec.js`):** 5 gambar gagal dimuat — `i.imgur.com/WfGG4KD.png`, `A6UNFM0.png` (×2 produk), `K5uR6rm.png`, `Xt1Jtfh.png`. Navigasi langsung ke salah satu URL (WfGG4KD.png) redirect ke halaman generik imgur, bukan gambar — link sudah mati, bukan sekadar lambat. | **Fail** |
| CMS-DSH-006 | Dashboard | Recent Orders → Detail | Klik salah satu order di Recent Orders | Functional | High | Major | Ada order di list | Order MDN-20260803-0002 | 1. Klik order | Redirect ke `/cms/orders/{id}` dengan detail lengkap | - | Not Run |
| CMS-DSH-007 | Dashboard | Empty State | Login dengan akun yang belum ada order/produk sama sekali (env baru) | Negative/UI | Low | Minor | Env kosong (tidak tersedia untuk diuji saat ini) | - | 1. Amati dashboard tanpa data | Semua card menampilkan 0 / empty state yang jelas, bukan error atau NaN | - | Not Run |
| CMS-DSH-008 | Dashboard | Akses tanpa login | Buka `/cms` tanpa session aktif | Security | Critical | Critical | Logout dari CMS | - | 1. Logout 2. Akses `/cms` langsung | Redirect ke `/cms/login`, tidak menampilkan data apa pun | - | Not Run |

---

## 2. Master Data — Products &amp; Categories

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-PRD-001 | Products | List | Verifikasi tabel produk menampilkan seluruh kolom (Product, Category, Price, Stock, SAP Code, Badge, Status, Actions) | Functional | High | Major | Login CMS | - | 1. Buka `/cms/products` | Semua kolom terisi data yang konsisten dengan storefront | - | Not Run |
| CMS-PRD-002 | Products | Search | Cari produk berdasarkan nama | Functional | High | Major | Ada ≥1 produk | "Hoodie" | 1. Ketik di search box | Hanya produk dengan nama/kategori cocok yang tampil | - | Not Run |
| CMS-PRD-003 | Products | Search | Cari dengan keyword tidak ditemukan | Negative | Medium | Minor | - | "zzznotfound" | 1. Ketik keyword random | Empty state ditampilkan, tidak crash | - | Not Run |
| CMS-PRD-004 | Products | Pagination | Navigasi halaman 1 → 2 → Prev | Functional | Medium | Minor | Produk >10 (list saat ini 16 produk, 2 halaman) | - | 1. Klik "2" 2. Klik "Prev" | Data berganti sesuai halaman, tidak duplikat/hilang | - | Not Run |
| CMS-PRD-005 | Products | Sync from SAP | Klik "Sync from SAP" | Functional/API | High | Major | Koneksi SAP dev aktif | - | 1. Klik tombol | Loading indicator muncul, data produk ter-update sesuai SAP, notifikasi sukses/gagal jelas | - | Not Run |
| CMS-PRD-006 | Products | Sync from SAP - gagal | Simulasikan SAP endpoint down/timeout | Negative | High | Major | SAP unreachable (perlu env staging terpisah) | - | 1. Klik Sync saat SAP down | Pesan error jelas, tidak membuat data korup/duplikat | - | Not Run |
| CMS-PRD-007 | Add Product | Create - valid | Tambah produk baru dengan semua field valid | Functional | Critical | Critical | Login CMS | Name: "TEST PRODUCT QA", Category: Apparel, Price: 50000, Stock: 20, Size: M | 1. Isi form 2. Submit | Produk baru muncul di list &amp; storefront, SAP Code kosong (belum sync) | - | Not Run |
| CMS-PRD-008 | Add Product | Required field | Submit form kosong | Validation | High | Major | - | Semua field kosong | 1. Klik "Create Product" tanpa isi apa pun | Validasi required muncul per field, tidak submit | - | Not Run |
| CMS-PRD-009 | Add Product | Price - negative/zero | Isi harga negatif atau 0 | Boundary/Validation | High | Major | - | Price: -1000, Price: 0 | 1. Isi price 2. Submit | Ditolak dengan pesan error, atau minimal dicegah di UI (min="0") | - | Not Run |
| CMS-PRD-010 | Add Product | Stock - negative | Isi stock negatif | Boundary/Validation | High | Major | - | Stock: -5 | 1. Isi stock 2. Submit | Ditolak, tidak boleh stock negatif tersimpan | - | Not Run |
| CMS-PRD-011 | Add Product | Special character/XSS di Name | Isi nama produk dengan payload XSS | Security | Critical | Critical | - | `<script>alert(1)</script>` | 1. Isi Name 2. Submit 3. Buka product di storefront | Payload di-escape/sanitasi, tidak dieksekusi sebagai script di CMS maupun storefront publik | - | Not Run |
| CMS-PRD-012 | Add Product | Unicode/emoji di Name | Isi nama dengan emoji dan karakter unicode | Validation | Medium | Minor | - | "MODENA 😀 Тест 测试" | 1. Isi Name 2. Submit | Tersimpan &amp; tampil benar di list dan storefront, tidak mojibake | - | Not Run |
| CMS-PRD-013 | Add Product | Main Image URL invalid | Isi URL gambar yang tidak valid/bukan gambar | Validation | Medium | Minor | - | "not-a-url", "https://example.com/file.pdf" | 1. Isi Main Image URL 2. Submit | Validasi format URL, atau fallback broken-image handling di storefront | - | Not Run |
| CMS-PRD-014 | Add Product | Upload image - file besar | Upload file gambar >5MB (atau limit yang berlaku) | Boundary | Medium | Minor | - | File 10MB .jpg | 1. Klik Upload 2. Pilih file besar | Ditolak dengan pesan jelas soal limit ukuran | - | Not Run |
| CMS-PRD-015 | Add Product | Upload - ekstensi tidak valid | Upload file .exe/.pdf sebagai gambar | Security/Validation | Critical | Critical | - | file.exe | 1. Upload file non-image | Ditolak, hanya ekstensi gambar (jpg/png/webp) yang diterima | - | Not Run |
| CMS-PRD-016 | Add Product | Multi-size - pilih semua size | Centang S, M, L, XL, XXL sekaligus | Functional | Medium | Minor | - | Semua checkbox size | 1. Centang semua 2. Submit | Produk tersimpan dengan 5 varian ukuran, masing-masing stok terpisah | - | Not Run |
| CMS-PRD-017 | Add Product | Custom size | Isi custom size selain S/M/L/XL/XXL/One Size | Functional | Medium | Minor | - | "3XL" | 1. Isi custom size field 2. Klik "Add" | Ukuran custom tersimpan &amp; tampil sebagai opsi size di PDP storefront | - | Not Run |
| CMS-PRD-018 | Add Product | Color Group - multiple colors | Tambah lebih dari 1 color group dengan gambar berbeda per warna | Functional | Medium | Minor | - | Color: Black, Red | 1. Klik "Add Color Group" 2x 2. Isi warna berbeda | Setiap color group tersimpan dengan gambar masing-masing, tampil sebagai swatch di PDP | - | Not Run |
| CMS-PRD-019 | Edit Product | Update - valid | Ubah harga &amp; stok produk existing | Functional | Critical | Critical | Ada produk existing | Product ID 1 | 1. Buka Edit 2. Ubah price/stock 3. Simpan | Perubahan tersimpan &amp; langsung terefleksi di storefront (`/product/1`) | - | Not Run |
| CMS-PRD-020 | Edit Product | Refresh saat submit | Refresh browser tepat saat klik Simpan | Negative | High | Major | - | - | 1. Klik Simpan 2. Segera refresh (F5) | Tidak terjadi duplicate submit / data korup; state akhir konsisten (tersimpan penuh atau tidak sama sekali) | - | Not Run |
| CMS-PRD-021 | Edit Product | Double/spam click Simpan | Klik tombol Simpan berkali-kali cepat | Negative | High | Major | - | - | 1. Klik Simpan 5x berturut-turut | Hanya 1 request diproses (tombol disabled setelah klik pertama), tidak membuat duplikat | - | Not Run |
| CMS-PRD-022 | Delete Product | Delete - konfirmasi | Hapus produk yang tidak punya order terkait | Functional | High | Major | Produk tanpa histori order | Produk test QA | 1. Klik Delete 2. Konfirmasi | Produk terhapus dari list &amp; storefront | - | Not Run |
| CMS-PRD-023 | Delete Product | Delete - produk dengan order aktif | Hapus produk yang sudah pernah dipesan (mis. HOODIE HITAM, id=1) | Negative | Critical | Critical | Produk punya order histori | Product ID 1 | 1. Klik Delete pada produk dengan order | Sistem mencegah delete (foreign key constraint) atau soft-delete, order lama tetap bisa dilihat dengan data produk historis, TIDAK error 500 | - | Not Run |
| CMS-PRD-024 | Categories | List &amp; CRUD | Tambah, edit, hapus kategori | Functional | High | Major | Login CMS | Kategori baru: "Test Category" | 1. Buka `/cms/categories` 2. Add/Edit/Delete | CRUD berjalan, kategori baru langsung muncul sebagai opsi filter di storefront &amp; dropdown Add Product | - | Not Run |
| CMS-PRD-025 | Categories | Delete kategori terpakai | Hapus kategori yang masih dipakai produk aktif (mis. "Apparel") | Negative | High | Major | Kategori dipakai ≥1 produk | Category "Apparel" | 1. Klik Delete pada kategori terpakai | Ditolak dengan pesan jelas, atau produk terkait di-reassign ke kategori default — bukan silent data loss | - | Not Run |
| CMS-PRD-026 | Add Product | Category dropdown tidak menampilkan kategori yang ada | Buka Add Product, periksa isi dropdown Category | Functional | Critical | Critical | Categories module punya ≥1 kategori aktif | 3 kategori aktif: Accessories, Apparel, Merchandise Modena | 1. Buka `/cms/categories`, catat 3 kategori Active 2. Buka `/cms/products/new` 3. Buka dropdown Category | Ketiga kategori aktif tampil sebagai opsi yang bisa dipilih | **Bug terkonfirmasi (reproducible, bukan race kondisi loading — diverifikasi ulang setelah delay 2 detik):** dropdown hanya berisi "No categories — add one in Categories" dan "Custom…", padahal `/cms/categories` menampilkan 3 kategori Active. Produk baru jadi terpaksa dibuat dengan kategori custom bebas ketik, tidak konsisten dengan master data Categories. | **Fail** |

---

## 3. Transaction — Orders

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-ORD-001 | Orders | List &amp; status filter | Filter order per status (All/Pending Approval/.../Cancelled) | Functional | High | Major | Ada order di tiap status (saat ini hanya "Preparing Order" &amp; "Picked Up" yang terisi) | - | 1. Klik tiap chip status | List ter-filter sesuai status, count di chip konsisten dengan dashboard | - | Not Run |
| CMS-ORD-002 | Order Detail | View | Buka detail 1 order | Functional | High | Major | Ada order | Order #47 | 1. Klik order dari list | Tampil Items, Shipping, Payment, SAP B1 Sales Order, Customer, Actions | Terverifikasi via eksplorasi — semua section tampil | Pass |
| CMS-ORD-003 | Order Detail | Ship Order | Ubah status order dari "Preparing Order" menjadi "Shipped" | Functional | Critical | Critical | Order berstatus Preparing Order | Order #47 | 1. Klik "Ship Order" | Status berubah, customer menerima notifikasi (jika ada), tercatat di Logs | - | Not Run |
| CMS-ORD-004 | Order Detail | Cancel Order | Batalkan order aktif | Functional | Critical | Critical | Order belum selesai | - | 1. Klik "Cancel Order" | Konfirmasi muncul → status jadi Cancelled, stok produk dikembalikan (restock) | - | Not Run |
| CMS-ORD-005 | Order Detail | Cancel Order - order sudah selesai | Coba cancel order berstatus "Picked Up"/"Delivered" | Negative | High | Major | Order sudah selesai | Order status Picked Up | 1. Buka order selesai 2. Cari tombol Cancel | Tombol Cancel tidak tersedia/disabled untuk order yang sudah final | - | Not Run |
| CMS-ORD-006 | Order Detail | Retry SAP | Klik "Retry SAP" pada order yang gagal sync ke SAP B1 | Functional/API | High | Major | Order dengan SAP sync gagal | - | 1. Klik "Retry SAP" | Sistem retry push ke SAP B1, status sync ter-update, pesan sukses/gagal jelas | - | Not Run |
| CMS-ORD-007 | Order Detail | Retry SAP - berulang/spam | Klik Retry SAP berkali-kali cepat | Negative | Medium | Minor | - | - | 1. Klik Retry SAP 5x cepat | Tidak membuat duplicate SAP Sales Order; tombol idealnya disabled selama proses berjalan | - | Not Run |
| CMS-ORD-008 | Order Detail | Logs | Buka "Logs" pada order | Functional | Medium | Minor | - | - | 1. Klik "Logs" | Menampilkan riwayat perubahan status/aksi (audit trail) order tsb dengan timestamp &amp; actor | - | Not Run |
| CMS-ORD-009 | Order Approval | Pending Approval flow | Buka order berstatus "Pending Approval" (jika ada) dan cari mekanisme approve/reject | Functional | Critical | Critical | Order berstatus Pending Approval (0 order saat eksplorasi — perlu buat data uji) | - | 1. Filter status "Pending Approval" 2. Buka detail | Ada aksi Approve/Reject yang jelas (lihat OBS-04 — belum terverifikasi karena tidak ada order Pending Approval saat eksplorasi) | - | Not Run |
| CMS-ORD-010 | Order Approval | Reject order | Reject order yang menunggu approval | Functional | Critical | Critical | Sama seperti di atas | - | 1. Klik Reject 2. Isi alasan (jika ada) | Order pindah ke status "Payment Rejected", customer dapat notifikasi | - | Not Run |
| CMS-ORD-011 | Orders | IDOR - akses order milik user lain via URL | Ubah ID di `/cms/orders/{id}` ke ID order lain secara berurutan | Security | Critical | Critical | Login sebagai admin | `/cms/orders/1` s.d. `/cms/orders/47` | 1. Ganti angka ID di URL manual | Karena ini CMS admin, akses ke semua order memang diharapkan (bukan storefront customer) — pastikan hanya role dengan izin "Orders" yang bisa, bukan role "customer" | - | Not Run |
| CMS-ORD-012 | Orders | URL manipulation - ID tidak ada | Akses `/cms/orders/999999` | Negative | Medium | Minor | - | - | 1. Akses ID tidak ada | Halaman 404/"Order not found", bukan error 500 atau blank page | - | Not Run |

---

## 4. Approval (lintas modul)

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-APR-001 | Approval | Dashboard KPI vs actual | Bandingkan angka "Orders Waiting Approval" di dashboard dengan jumlah order status "Pending Approval" di halaman Orders | Functional/Regression | High | Major | - | - | 1. Catat angka dashboard 2. Filter Orders by Pending Approval 3. Hitung | Angka harus identik | Saat eksplorasi: dashboard = 0, filter chip juga menunjukkan tidak ada data Pending Approval — konsisten | Pass |
| CMS-APR-002 | Approval | Role tanpa izin approval mencoba approve | Login dengan role yang tidak memiliki akses Orders, coba akses order approval langsung via URL | Security | Critical | Critical | Butuh akun role terbatas (belum tersedia untuk diuji) | - | 1. Login role terbatas 2. Akses `/cms/orders/{id}` | Ditolak (403/redirect), bukan tetap bisa approve | - | Not Run |

---

## 5. Report

Tidak ditemukan menu "Report" terpisah di sidebar CMS saat eksplorasi — kemungkinan
fungsi report saat ini melebur ke Dashboard (Sales Trend, Order Status funnel, Top
Products). Dicatat sebagai gap/observation, bukan modul aktif:

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-RPT-001 | Report | Export laporan penjualan | Cari fitur export report (PDF/Excel/CSV) di seluruh CMS | Functional | Medium | Minor | - | - | 1. Telusuri Dashboard &amp; Orders untuk tombol export | Belum ditemukan tombol export di modul manapun saat eksplorasi — perlu konfirmasi apakah ini scope yang belum dibangun atau tersembunyi di role lain | Tidak ditemukan | Gap/Observation |

---

## 6. CMS (navigasi &amp; layout umum)

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-NAV-001 | CMS Layout | Sidebar - active state | Verifikasi menu aktif ter-highlight sesuai halaman saat ini | UI | Medium | Minor | - | - | 1. Navigasi ke tiap menu | Menu aktif punya style berbeda (background putih) | Terverifikasi untuk Dashboard saat eksplorasi | Pass |
| CMS-NAV-002 | CMS Layout | Responsive - mobile | Buka CMS di viewport mobile (<768px) | UI/Compatibility | High | Major | - | Viewport 375×667 | 1. Resize ke mobile | Sidebar tersembunyi, muncul header dengan hamburger menu (`aria-label="Open menu"` terverifikasi ada di DOM) | Elemen ada di DOM, belum diuji fungsinya (klik membuka drawer) | Investigate |
| CMS-NAV-003 | CMS Layout | Logout | Klik tombol Logout di sidebar | Functional | High | Major | Login aktif | - | 1. Klik Logout | Session berakhir, redirect ke `/cms/login`, akses `/cms` selanjutnya redirect balik ke login | - | Not Run |
| CMS-NAV-004 | CMS Layout | Browser back setelah logout | Logout, lalu klik tombol Back browser | Security/Negative | High | Major | - | - | 1. Logout 2. Klik Back | Halaman CMS sebelumnya tidak tampil dari cache — harus redirect ke login (no-cache header pada halaman ber-auth) | - | Not Run |
| CMS-NAV-005 | CMS Layout | Console error | Buka DevTools Console di setiap halaman utama | UI/Regression | Medium | Minor | - | - | 1. Buka tiap modul 2. Amati console | Tidak ada error JS di console | - | Not Run |
| CMS-NAV-006 | CMS Layout | Session expired mid-action | Biarkan session expire (token habis), lalu coba submit form | Negative/Security | High | Major | Token TTL diketahui | - | 1. Tunggu token expired 2. Submit form apa pun | Ditolak dengan redirect ke login &amp; pesan "session expired", bukan error generik atau silent fail | - | Not Run |

---

## 7. User

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-USR-001 | Users | List | Buka `/cms/users`, verifikasi daftar user CMS tampil (nama, email, role) | Functional | High | Major | Login sebagai role berwenang | - | 1. Buka halaman | List user tampil lengkap | Halaman terbuka tanpa redirect — lihat OBS-01 soal apakah ini seharusnya diizinkan untuk role akun ini | Investigate |
| CMS-USR-002 | Users | Create user baru | Tambah user CMS baru dengan role tertentu | Functional | Critical | Critical | - | Email: qa-test@modena.com, Role: admin | 1. Isi form Add User 2. Submit | User baru bisa login CMS sesuai role yang diberikan | - | Not Run |
| CMS-USR-003 | Users | Duplicate email | Tambah user dengan email yang sudah terdaftar | Negative/Validation | High | Major | Email sudah ada | admin@modena.com | 1. Submit dengan email duplikat | Ditolak dengan pesan "email already exists" | - | Not Run |
| CMS-USR-004 | Users | Password policy | Buat user dengan password lemah ("123", "") | Security/Validation | High | Major | - | Password: "123" | 1. Submit password lemah | Ditolak, ada aturan minimum panjang/kompleksitas password | - | Not Run |
| CMS-USR-005 | Users | Deactivate user | Nonaktifkan user CMS lain | Functional | High | Major | Ada ≥2 user | - | 1. Klik Deactivate pada user | User tidak bisa login lagi, sesi aktif user tsb (jika ada) langsung invalid | - | Not Run |
| CMS-USR-006 | Users | Hapus akun sendiri | Coba hapus/nonaktifkan akun yang sedang login | Negative | Medium | Minor | - | Akun sendiri | 1. Cari opsi delete pada akun sendiri | Sistem mencegah user menghapus/menonaktifkan dirinya sendiri, atau minimal ada konfirmasi eksplisit | - | Not Run |

---

## 8. Role

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-ROL-001 | Roles | List | Verifikasi 3 role tampil (admin, customer, superadmin) dengan jumlah menu masing-masing | Functional | High | Major | - | - | 1. Buka `/cms/roles` | admin=5 menu, customer=0 menu, superadmin=7 menu (Locked) | Terverifikasi sesuai — data live cocok | Pass |
| CMS-ROL-002 | Roles | superadmin - Locked | Coba klik/edit role "superadmin" | Security | High | Major | - | - | 1. Cari tombol Edit pada superadmin | Tombol menampilkan "Locked", tidak bisa diedit — role superadmin tidak boleh diubah dari UI | Terverifikasi — role superadmin menampilkan "Locked" bukan "Edit" | Pass |
| CMS-ROL-003 | Roles | Edit role "admin" - toggle menu access | Cabut akses menu "Categories" dari role admin, lalu login sebagai user role admin | Security/Functional | **Kritis** | **Kritis** | Ada user dengan role admin (bukan superadmin) | - | 1. Edit role admin, uncheck Categories 2. Logout 3. Login sebagai user role admin 4. Coba akses `/cms/categories` langsung via URL | Menu Categories hilang dari sidebar **dan** akses langsung via URL ditolak (403/redirect) — bukan hanya disembunyikan di UI | **Terkait OBS-01: perlu verifikasi apakah proteksi ini ditegakkan di level backend, bukan hanya sidebar** | Not Run — prioritas tinggi |
| CMS-ROL-004 | Roles | Add Role | Buat role baru dengan kombinasi menu custom | Functional | High | Major | - | Role: "warehouse", menu: Stock only | 1. Klik "Add Role" 2. Pilih menu 3. Simpan | Role baru tersimpan &amp; bisa di-assign ke user, user dengan role ini hanya melihat menu Stock | - | Not Run |
| CMS-ROL-005 | Roles | Role name - duplicate | Buat role dengan nama yang sudah ada | Negative/Validation | Medium | Minor | - | "admin" | 1. Submit nama role duplikat | Ditolak dengan pesan jelas | - | Not Run |

---

## 9. Setting

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-SET-001 | Settings | Xendit Secret Key - masking | Buka halaman Settings, periksa apakah Secret Key/Callback Token yang sudah tersimpan ditampilkan dalam bentuk masked (••••) atau plain text | Security | **Kritis** | **Kritis** | Login CMS, sudah ada Xendit config tersimpan | - | 1. Buka `/cms/settings` 2. Inspect value field Secret Key via DevTools | Value asli TIDAK boleh dikirim ke frontend dalam bentuk plain text (field kosong/masked, hanya terisi saat user mengetik ulang) — lihat OBS-02 | Belum diverifikasi nilai aktualnya (field ditemukan ada di DOM, isi belum diperiksa) | Not Run — prioritas tinggi |
| CMS-SET-002 | Settings | Webhook URL - Copy button | Klik tombol "Copy" di samping Webhook URL | Functional | Low | Minor | - | - | 1. Klik Copy 2. Paste di tempat lain | URL webhook Xendit ter-copy persis ke clipboard | - | Not Run |
| CMS-SET-003 | Settings | Save Settings - tanpa mengubah apa pun | Klik "Save Settings" tanpa mengubah field apa pun | Functional | Medium | Minor | - | - | 1. Klik Save langsung | Tersimpan tanpa error, tidak mengosongkan secret key yang sudah ada ("Leave blank to keep current key") | - | Not Run |
| CMS-SET-004 | Settings | Disable Xendit saat ada order aktif menunggu pembayaran | Nonaktifkan toggle "Enable Xendit payment" saat ada order status "Waiting Payment" | Negative | High | Major | Ada order Xendit pending | - | 1. Toggle off Xendit 2. Simpan | Order lama tetap bisa diselesaikan (atau ada peringatan dampak), tidak membuat order lama stuck tanpa jalan keluar | - | Not Run |
| CMS-SET-005 | Settings | Email Notifications - BCC format invalid | Isi BCC recipients dengan format email salah | Validation | Medium | Minor | - | "not-an-email, ,;;" | 1. Isi BCC 2. Save Notifications | Validasi format email per entry, atau minimal tidak membuat email gagal terkirim seluruhnya | - | Not Run |
| CMS-SET-006 | Settings | SAP B1 config - koneksi invalid | Isi SAP B1 endpoint/credential yang salah, simpan, lalu coba Sync from SAP di Products | Negative | High | Major | - | Endpoint salah | 1. Ubah SAP config jadi salah 2. Save 3. Ke Products → Sync from SAP | Error jelas ("SAP connection failed"), tidak membuat data produk korup | - | Not Run |
| CMS-SET-007 | Settings | HTTPS enforcement | Akses `/cms/settings` melalui `http://` (bukan `https://`) | Security | High | Major | - | - | 1. Akses via http:// | Otomatis redirect ke https://, terutama karena halaman ini menampilkan secret key | - | Not Run |

---

## 10. Notification

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-NOT-001 | Notification | Email BCC terkirim saat payment sukses | Selesaikan 1 transaksi Xendit sampai sukses, verifikasi BCC recipient menerima email | Functional/E2E | High | Major | BCC recipient terisi, transaksi Xendit staging bisa diselesaikan | - | 1. Set BCC 2. Selesaikan 1 order sampai payment sukses | Email payment-success terkirim ke customer DAN BCC recipient | - | Not Run |
| CMS-NOT-002 | Notification | Order status change - notifikasi ke customer | Ubah status order (Ship Order) dan verifikasi customer menerima notifikasi (email/in-app) | Functional | Medium | Minor | - | - | 1. Ship order 2. Cek sisi customer (storefront/orders/email) | Customer melihat status ter-update, dapat notifikasi jika fitur tersedia | - | Not Run |

---

## 11. Audit Log

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-LOG-001 | Audit Log | Order "Logs" - kelengkapan | Buka tombol "Logs" pada 1 order, verifikasi setiap perubahan status tercatat dengan timestamp &amp; actor (user CMS mana yang melakukan) | Functional | High | Major | Order dengan ≥1 perubahan status histori | Order #47 | 1. Klik Logs | Riwayat lengkap: siapa, kapan, aksi apa (mis. "Ship Order oleh admin@modena.com pada 3/8/2026") | - | Not Run |
| CMS-LOG-002 | Audit Log | Log untuk aksi destruktif | Hapus 1 produk, verifikasi tercatat di audit log (jika ada audit log level sistem, bukan hanya per-order) | Functional/Security | Medium | Minor | - | - | 1. Delete produk 2. Cari audit trail level sistem | Idealnya ada log siapa menghapus apa &amp; kapan — belum ditemukan menu Audit Log terpisah di sidebar, dicatat sebagai gap | Belum ditemukan modul Audit Log global | Gap/Observation |

---

## 12. API

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-API-001 | API | Auth - endpoint tanpa token | Panggil API backend CMS (mis. `GET /backend/api/products`) tanpa Authorization header | Security | Critical | Critical | - | - | 1. Request via curl/Postman tanpa token | 401 Unauthorized, bukan 200 dengan data | - | Not Run |
| CMS-API-002 | API | Webhook Xendit - signature verification | Kirim POST ke `/backend/api/webhooks/xendit` dengan Callback Verification Token yang salah | Security | Critical | Critical | Webhook URL diketahui (terverifikasi ada: `/backend/api/webhooks/xendit`) | Token salah | 1. POST payload palsu dengan token salah | Ditolak (401/403), tidak memproses payload sebagai pembayaran valid — krusial karena ini endpoint publik yang bisa memicu perubahan status order/pembayaran | - | Not Run |
| CMS-API-003 | API | Sync from SAP - response time | Ukur waktu respons endpoint sync SAP saat data besar | Performance | Medium | Minor | - | - | 1. Trigger Sync from SAP 2. Ukur waktu | Response time wajar (<5s) atau ada progress indicator untuk operasi panjang | - | Not Run |
| CMS-API-004 | API | Order status update - status code | Verifikasi response code saat Ship/Cancel order (200/204) dan body error yang informatif saat gagal | Functional/API | High | Major | - | - | 1. Klik Ship Order sambil buka Network tab | Status 200/204 saat sukses, 4xx dengan pesan jelas saat gagal (mis. order sudah di-cancel sebelumnya) | - | Not Run |
| CMS-API-005 | API | Rate limiting | Kirim request login CMS berulang cepat (brute force simulation) | Security | High | Major | - | 10x request /cms/login dalam 10 detik | 1. POST login berulang dengan password salah | Ada rate limiting/lockout setelah N percobaan gagal, tidak unlimited attempt | - | Not Run |

---

## 13. Security

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-SEC-001 | Security | Broken Access Control | Lihat OBS-01 — role admin vs superadmin menu | Security | **Kritis** | **Kritis** | - | - | 1. Verifikasi role akun uji sebenarnya 2. Uji akses `/cms/settings`,`/cms/users`,`/cms/roles` dengan akun role "admin" murni | Akses ditolak jika role tidak berwenang, konsisten dengan definisi di halaman Roles | Ditemukan potensi ketidaksesuaian — lihat OBS-01 | Investigate — prioritas tertinggi |
| CMS-SEC-002 | Security | SQL Injection | Coba SQLi di search box Products (`' OR '1'='1`) | Security | Critical | Critical | - | `' OR '1'='1' --` | 1. Ketik payload di search | Tidak ada data bocor/error SQL raw ditampilkan ke user | - | Not Run |
| CMS-SEC-003 | Security | XSS Stored | Simpan nama produk/kategori dengan payload `<img src=x onerror=alert(1)>` | Security | Critical | Critical | - | Payload XSS | 1. Simpan sebagai nama produk 2. Buka list produk &amp; storefront | Payload ter-escape, tidak dieksekusi di CMS maupun storefront publik | - | Not Run |
| CMS-SEC-004 | Security | CSRF | Kirim request "Ship Order"/"Delete Product" dari origin lain tanpa CSRF token yang valid | Security | High | Major | - | - | 1. Buat form HTML eksternal yang POST ke endpoint CMS | Ditolak — endpoint state-changing harus terproteksi CSRF token/SameSite cookie | - | Not Run |
| CMS-SEC-005 | Security | Session fixation/cookie | Periksa flag cookie session CMS (HttpOnly, Secure, SameSite) | Security | High | Major | - | - | 1. Inspect cookies setelah login via DevTools | Cookie session: HttpOnly=true, Secure=true, SameSite=Lax/Strict | - | Not Run |
| CMS-SEC-006 | Security | Password di localStorage/sessionStorage | Setelah login, periksa localStorage/sessionStorage | Security | Critical | Critical | - | - | 1. Login 2. Inspect Application tab | Password TIDAK boleh tersimpan di localStorage/sessionStorage dalam bentuk apa pun | - | Not Run |
| CMS-SEC-007 | Security | Open Redirect | Coba parameter redirect setelah login (`/cms/login?redirect=https://evil.com`) | Security | Medium | Major | - | - | 1. Akses URL dengan redirect param eksternal | Redirect hanya diperbolehkan ke path internal, ditolak jika domain eksternal | - | Not Run |
| CMS-SEC-008 | Security | IDOR - order milik role customer | Jika ada portal customer terpisah, coba akses order CMS dari sisi customer dan sebaliknya | Security | Critical | Critical | - | - | 1. Bandingkan endpoint API order CMS vs storefront `/orders` | Tidak ada endpoint yang membocorkan seluruh order lintas customer ke non-admin | - | Not Run |
| CMS-SEC-009 | Security | Permission berubah di tengah sesi (kemungkinan terkait perbaikan OBS-01) | Bandingkan menu sidebar &amp; tombol Delete Product sebelum/sesudah re-login pada sesi eksplorasi yang sama | Security/Regression | High | Major | - | - | 1. Login, catat sidebar (8 menu termasuk Settings) &amp; tombol Delete pada Products 2. Logout, login ulang 3. Bandingkan | Perubahan permission harus konsisten &amp; disengaja, bukan tidak terduga di tengah pengujian | **Diamati langsung:** setelah re-login pertengahan sesi, sidebar berubah dari 8 menjadi 7 menu (Settings hilang — konsisten dengan OBS-01 kemungkinan sudah diperbaiki), title app berubah "MODENA CMS" → "MODENA Merch CMS" (indikasi redeploy), dan tombol **Delete pada Products hilang total** untuk akun yang sama. Ini kemungkinan perbaikan yang disengaja (memperketat role "admin"), tapi berakibat 1 produk test (`QA E2E TEST PRODUCT 1785749293325`, `/cms/products/71`) tidak bisa dibersihkan lagi lewat UI — **perlu dihapus manual oleh superadmin**. | Investigate |

---

## 14. Performance

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-PRF-001 | Performance | Products list - data besar | Ukur waktu render tabel Products dengan 1000/5000 produk (perlu seed data khusus) | Performance | Medium | Minor | Seed data besar (belum tersedia di dev) | - | 1. Seed 1000 produk 2. Buka `/cms/products` 3. Ukur load time | Load time <3s, pagination tetap responsif | - | Not Run |
| CMS-PRF-002 | Performance | Dashboard - waktu render chart | Ukur waktu render Sales Trend chart dengan data 1 tahun penuh | Performance | Low | Minor | - | - | 1. Buka Dashboard 2. Ukur waktu chart muncul | <2s untuk render chart | - | Not Run |
| CMS-PRF-003 | Performance | Sync from SAP - waktu proses | Ukur waktu Sync from SAP dengan katalog 16 produk saat ini | Performance | Medium | Minor | - | - | 1. Klik Sync 2. Ukur waktu selesai | Selesai dalam waktu wajar, ada indikator progress jika >3s | - | Not Run |

---

## 15. Accessibility

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-A11Y-001 | Accessibility | Keyboard navigation | Navigasi seluruh sidebar &amp; form Add Product hanya dengan Tab/Enter | Accessibility | Medium | Minor | - | - | 1. Lepas mouse 2. Tab melalui seluruh elemen interaktif | Semua elemen bisa dijangkau &amp; dioperasikan via keyboard, focus order logis | - | Not Run |
| CMS-A11Y-002 | Accessibility | ARIA labels | Verifikasi tombol icon-only (mis. hamburger menu) punya `aria-label` | Accessibility | Medium | Minor | - | - | 1. Inspect tombol hamburger | `aria-label="Open menu"` sudah ada (terverifikasi di DOM) | Pass (untuk elemen ini) | Pass |
| CMS-A11Y-003 | Accessibility | Contrast | Cek rasio kontras teks abu-abu (`text-gray-400`, `text-gray-500`) di atas background putih | Accessibility | Medium | Minor | - | - | 1. Gunakan tool contrast checker | Rasio kontras ≥4.5:1 untuk teks biasa (WCAG AA) | - | Not Run |
| CMS-A11Y-004 | Accessibility | Chart accessibility | Verifikasi Sales Trend chart (SVG Recharts) punya alternatif teks/summary untuk screen reader | Accessibility | Low | Minor | - | - | 1. Gunakan screen reader di halaman Dashboard | Chart punya `role`/`aria-label` yang menjelaskan data, bukan SVG kosong tanpa konteks | - | Not Run |

---

## 16. Regression

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-REG-001 | Regression | Edit Product di CMS → tampil di storefront | Ubah harga/stok produk di CMS, verifikasi berubah di `/products` dan `/product/{id}` | Regression | Critical | Critical | - | Product ID 1 | 1. Edit price di CMS 2. Buka storefront | Harga baru langsung konsisten di kedua sisi (tanpa cache stale) | - | Not Run |
| CMS-REG-002 | Regression | Cancel Order di CMS → stok storefront | Cancel order di CMS, verifikasi stok produk terkait kembali bertambah di storefront | Regression | High | Major | - | - | 1. Cancel order berisi produk X 2. Cek stok produk X | Stok bertambah sesuai qty order yang dibatalkan | - | Not Run |
| CMS-REG-003 | Regression | Role menu change → sidebar user lain | Ubah menu role "admin" di Roles, verifikasi user lain yang sedang login dengan role tsb ter-refresh aksesnya | Regression/Security | High | Major | - | - | 1. Ubah role admin 2. User lain (sudah login) refresh halaman | Sidebar &amp; akses ter-update sesuai perubahan role terbaru (bukan cached dari saat login) | - | Not Run |

---

## 17. Smoke Test

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-SMK-001 | Smoke | Login CMS | Login dengan kredensial valid | Smoke | Critical | Critical | - | admin@modena.com/admin123 | 1. Buka `/cms/login` 2. Login | Redirect ke `/cms`, dashboard tampil | Terverifikasi — login sukses, redirect ke `/cms` | Pass |
| CMS-SMK-002 | Smoke | Dashboard tampil | Dashboard menampilkan KPI &amp; Recent Orders | Smoke | Critical | Critical | Login sukses | - | 1. Amati dashboard | Semua section utama render tanpa error | Terverifikasi via DOM fetch | Pass |
| CMS-SMK-003 | Smoke | Navigasi ke semua menu utama | Klik tiap item sidebar (Products/Orders/Stock/Settings/Users/Roles/Categories) | Smoke | Critical | Critical | - | - | 1. Klik tiap menu | Semua halaman terbuka tanpa error 404/500 | Products, Orders, Stock, Settings, Users, Roles, Categories semua berhasil dibuka (Categories belum di-render-check detail) | Pass |
| CMS-SMK-004 | Smoke | Logout | Klik Logout | Smoke | Critical | Critical | Login aktif | - | 1. Klik Logout | Kembali ke halaman login | - | Not Run |

---

## 18. Sanity Test

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-SAN-001 | Sanity | Setelah deploy - Add Product dasar berfungsi | Tambah 1 produk sederhana | Sanity | Critical | Critical | Setelah rilis baru | - | 1. Add Product minimal | Produk tersimpan &amp; tampil di storefront | - | Not Run |
| CMS-SAN-002 | Sanity | Setelah deploy - Ship Order berfungsi | Ubah status 1 order | Sanity | Critical | Critical | - | - | 1. Ship 1 order | Status berubah tanpa error | - | Not Run |

---

## 19. UAT

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-UAT-001 | UAT | Admin gudang - alur harian | Sebagai staff gudang: cek Low Stock Alert → update stok → verifikasi order baru → ship order | UAT/E2E | High | Major | - | - | 1. Login 2. Ikuti alur di atas end-to-end | Seluruh alur bisa diselesaikan tanpa hambatan/kebingungan UX oleh user non-teknis | - | Not Run |
| CMS-UAT-002 | UAT | Owner/manager - tinjau penjualan mingguan | Buka dashboard, ganti ke "Weekly", tinjau Top Products &amp; Sales Trend untuk pengambilan keputusan | UAT | Medium | Minor | - | - | 1. Login sebagai manager 2. Tinjau dashboard | Data cukup jelas &amp; actionable untuk pengambilan keputusan bisnis | - | Not Run |

---

## 20. End-to-End Flow

| TC ID | Module | Feature | Test Scenario | Test Type | Priority | Severity | Preconditions | Test Data | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CMS-E2E-001 | E2E | Produk baru → beli di storefront → kelola di CMS | Full flow: Admin tambah produk baru di CMS → customer beli di storefront → admin lihat &amp; proses order di CMS | E2E | Critical | Critical | - | Produk QA baru | 1. Add Product (CMS) 2. Login &amp; checkout produk tsb (storefront) 3. Buka order baru (CMS) 4. Ship Order | Seluruh rantai data konsisten dari CMS → storefront → kembali ke CMS, tanpa data hilang di satu titik mana pun | - | Not Run |
| CMS-E2E-002 | E2E | Stok habis di CMS → storefront | Set stok produk ke 0 di CMS, verifikasi storefront menampilkan "out of stock"/tombol Add to Cart disabled | E2E | High | Major | - | Product stock=0 | 1. Set stock=0 (CMS) 2. Buka PDP produk (storefront) | Add to Cart disabled/pesan out of stock, tidak bisa checkout produk tsb | - | Not Run |
| CMS-E2E-003 | E2E | Cancel order → stok kembali → bisa dibeli lagi | Order terakhir menghabiskan stok (mis. HOODIE HITAM stock=1) → cancel order tsb di CMS → coba beli lagi di storefront | E2E | High | Major | Produk stock rendah (relevan: HOODIE HITAM, lihat catatan stok di [automation/fixtures.js](automation/fixtures.js)) | - | 1. Cancel order HOODIE HITAM di CMS 2. Cek stok di CMS 3. Coba Add to Cart di storefront | Stok bertambah kembali di CMS, produk kembali bisa dibeli di storefront | - | Not Run |
| CMS-E2E-004 | E2E | Role baru → user baru → akses terbatas | Buat role custom (mis. hanya akses Stock) → assign ke user baru → login sebagai user tsb → verifikasi hanya bisa akses Stock | E2E/Security | Critical | Critical | - | Role "warehouse", user baru | 1. Add Role 2. Add User dengan role tsb 3. Login sebagai user baru 4. Coba akses semua menu | Hanya menu Stock yang bisa diakses; menu &amp; URL lain (Settings, Users, dst.) ditolak — ini adalah cara paling langsung memverifikasi OBS-01 | - | Not Run — merupakan cara paling definitif memverifikasi OBS-01 |

---

## Ringkasan &amp; Rekomendasi

1. **Prioritas tertinggi: verifikasi OBS-01 (broken access control kandidat).** Jalankan
   **CMS-E2E-004** — cara paling definitif untuk memastikan apakah pembatasan menu di
   halaman Roles benar-benar ditegakkan di backend atau hanya kosmetik di sidebar.
2. **Prioritas tinggi: verifikasi OBS-02 (Xendit secret key exposure)** — cek response
   API `/cms/settings` di Network tab, pastikan secret key tidak pernah dikirim ke
   frontend dalam bentuk plain text.
3. Modul **Report** dan **Audit Log** (level sistem, bukan per-order) tidak ditemukan
   sebagai menu terpisah — konfirmasi apakah ini scope yang belum dibangun.
4. Seluruh test case bertanda **Not Run** perlu dieksekusi manual atau diotomasi
   bertahap; test case ber-status **Pass** sudah terverifikasi langsung dari DOM live
   selama sesi eksplorasi ini (2026-08-03), bukan asumsi.
5. Hindari menjalankan test yang mengubah data produksi-seperti (Delete Product,
   Cancel Order, Ship Order) berulang kali di dev bersama tanpa koordinasi — sama
   seperti temuan stok terbatas di suite storefront (lihat
   [README.md](README.md) &amp; [automation/README.md](automation/README.md)).
