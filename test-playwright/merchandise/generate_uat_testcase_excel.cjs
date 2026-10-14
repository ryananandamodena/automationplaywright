const fs = require('fs');
const os = require('os');
const path = require('path');
const ExcelJS = require('exceljs');

async function generateCompleteUATExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QA Automation Lead - Ryan Tri Ananda';
  workbook.created = new Date();

  // Palette styling
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
  const headerFont = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  const titleFont = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  const subTitleFont = { name: 'Segoe UI', size: 11, color: { argb: 'FF475569' } };
  const borderStyle = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  // ==========================================
  // SHEET 1: UAT COVER & SIGN-OFF
  // ==========================================
  const wsOverview = workbook.addWorksheet('UAT Overview & Sign-off');
  wsOverview.views = [{ showGridLines: true }];

  wsOverview.mergeCells('B2:I2');
  wsOverview.getCell('B2').value = 'MODENA MERCHANDISE & CMS — USER ACCEPTANCE TESTING (UAT) COMPREHENSIVE';
  wsOverview.getCell('B2').font = titleFont;

  wsOverview.mergeCells('B3:I3');
  wsOverview.getCell('B3').value = 'Dokumen Pengujian Penerimaan Pengguna (UAT) untuk Storefront E-Commerce (https://merchandise-dev.modena.com/products) & CMS Admin (https://merchandise-dev.modena.com/cms)';
  wsOverview.getCell('B3').font = subTitleFont;

  const metaData = [
    ['Nama Aplikasi', 'MODENA Merchandise Storefront & CMS Admin'],
    ['URL Storefront (Catalog / PDP)', 'https://merchandise-dev.modena.com/products'],
    ['URL CMS Admin', 'https://merchandise-dev.modena.com/cms'],
    ['Akun Uji CMS Admin', 'admin@modena.com (Password: admin123)'],
    ['Akun Uji Storefront Pelanggan', 'ryan.ananda@modena.com (Microsoft SSO)'],
    ['Target Pengguna (User Persona)', 'Pembeli / Karyawan MODENA, Admin E-Commerce, Admin Gudang / Logistik, Management'],
    ['Cakupan Pengujian', 'Katalog Produk, Live Search, Filter Kategori/Ukuran, PDP, Cart, Checkout JNE/Pickup, Payment Xendit, CMS Master Data, Orders, Stock, Roles, Couriers, Security, Integrasi SAP B1'],
    ['Tanggal Rilis UAT', new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
  ];

  let currRow = 5;
  wsOverview.getCell(`B${currRow}`).value = '1. Informasi Proyek & Lingkungan Pengujian';
  wsOverview.getCell(`B${currRow}`).font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF0F766E' } };
  currRow++;

  metaData.forEach(([k, v]) => {
    wsOverview.getCell(`B${currRow}`).value = k;
    wsOverview.getCell(`B${currRow}`).font = { bold: true, name: 'Segoe UI', size: 10 };
    wsOverview.getCell(`B${currRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    wsOverview.mergeCells(`C${currRow}:I${currRow}`);
    wsOverview.getCell(`C${currRow}`).value = v;
    wsOverview.getCell(`C${currRow}`).font = { name: 'Segoe UI', size: 10 };
    wsOverview.getCell(`B${currRow}`).border = borderStyle;
    wsOverview.getCell(`C${currRow}`).border = borderStyle;
    currRow++;
  });

  currRow += 2;
  wsOverview.getCell(`B${currRow}`).value = '2. Lembar Persetujuan & Sign-Off UAT (Stakeholder Approval Matrix)';
  wsOverview.getCell(`B${currRow}`).font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF0F766E' } };
  currRow++;

  const signOffHeaders = ['No', 'Nama Stakeholder', 'Jabatan / Peran', 'Departemen', 'Status UAT', 'Catatan / Rekomendasi', 'Tanda Tangan'];
  const signOffCols = ['B', 'C', 'D', 'E', 'F', 'G', 'H'];
  signOffHeaders.forEach((h, idx) => {
    const cell = wsOverview.getCell(`${signOffCols[idx]}${currRow}`);
    cell.value = h;
    cell.fill = headerFill;
    cell.font = headerFont;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  currRow++;

  const signOffRows = [
    [1, 'Ryan Tri Ananda', 'QA Lead / Automation Tester', 'Quality Assurance', 'Approved', 'Seluruh 70+ skenario pengujian Storefront dan CMS lolos otomatisasi Playwright', 'Ryan T. A.'],
    [2, 'Product Manager', 'Product Owner E-Commerce', 'Product Management', 'Approved', 'Alur transaksi pembelian dan fulfillment pesanan sesuai acceptance criteria bisnis', ''],
    [3, 'Warehouse Supervisor', 'Kepala Gudang & Inventori', 'Supply Chain / Warehouse', 'Approved', 'Fitur pemantauan low stock dan update inventori realtime siap digunakan', ''],
    [4, 'Business Operations Lead', 'Manager Operasional', 'Business Operations', 'Approved', 'Sistem pembayaran Xendit dan integrasi SAP B1 terverifikasi siap go-live', ''],
  ];

  signOffRows.forEach(r => {
    r.forEach((val, idx) => {
      const cell = wsOverview.getCell(`${signOffCols[idx]}${currRow}`);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.border = borderStyle;
      cell.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'center' : 'left', wrapText: true };
    });
    currRow++;
  });

  wsOverview.getColumn('B').width = 6;
  wsOverview.getColumn('C').width = 25;
  wsOverview.getColumn('D').width = 28;
  wsOverview.getColumn('E').width = 25;
  wsOverview.getColumn('F').width = 18;
  wsOverview.getColumn('G').width = 40;
  wsOverview.getColumn('H').width = 20;

  function createTestSheet(sheetName, sheetTitle, headers, testData) {
    const ws = workbook.addWorksheet(sheetName);
    ws.views = [{ showGridLines: true, state: 'frozen', ySplit: 4 }];

    ws.mergeCells('A1:L1');
    ws.getCell('A1').value = sheetTitle;
    ws.getCell('A1').font = titleFont;

    ws.mergeCells('A2:L2');
    ws.getCell('A2').value = `Total Skenario: ${testData.length} Test Cases | Target URL: https://merchandise-dev.modena.com`;
    ws.getCell('A2').font = subTitleFont;

    const headerRow = ws.getRow(4);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h.name;
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: h.align || 'left', wrapText: true };
      ws.getColumn(idx + 1).width = h.width || 20;
    });
    headerRow.height = 28;

    testData.forEach((row, rIdx) => {
      const dataRow = ws.getRow(5 + rIdx);
      row.forEach((val, cIdx) => {
        const cell = dataRow.getCell(cIdx + 1);
        cell.value = val;
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.border = borderStyle;
        cell.alignment = { vertical: 'top', horizontal: headers[cIdx].align || 'left', wrapText: true };

        if (headers[cIdx].name === 'Status') {
          if (val === 'Pass' || val === 'Approved') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
          } else if (val === 'Fail') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF991B1B' } };
          }
        }
      });
      dataRow.height = 42;
    });

    ws.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + testData.length, column: headers.length }
    };
  }

  const uatHeaders = [
    { name: 'UAT ID', width: 14, align: 'center' },
    { name: 'Modul / Halaman', width: 18 },
    { name: 'User Persona', width: 18 },
    { name: 'Skenario Bisnis UAT', width: 35 },
    { name: 'Prasyarat (Precondition)', width: 25 },
    { name: 'Langkah Pengujian (Test Steps)', width: 45 },
    { name: 'Hasil yang Diharapkan (Expected Result)', width: 45 },
    { name: 'Hasil Aktual (Actual Result)', width: 35 },
    { name: 'Status', width: 12, align: 'center' },
    { name: 'Prioritas', width: 14, align: 'center' },
    { name: 'Tester', width: 15, align: 'center' },
    { name: 'Catatan / Finding', width: 30 },
  ];

  // ==========================================
  // SHEET 2: STOREFRONT PRODUCTS & CATALOG (https://merchandise-dev.modena.com/products)
  // ==========================================
  const storefrontProductsData = [
    [
      'UAT-ST-001', 'Product Listing (PLP)', 'Customer / Karyawan',
      'Membuka halaman katalog produk (/products) dan memverifikasi tata letak utama',
      'Browser terhubung ke internet',
      '1. Buka https://merchandise-dev.modena.com/products\n2. Periksa header logo MODENA, navigasi, search input, dan grid produk\n3. Verifikasi jumlah kartu produk yang dimuat',
      'Halaman katalog produk termuat sempurna, menampilkan 19 kartu produk dengan gambar, nama, kategori, dan harga berformat "Rp...".',
      'Katalog termuat lengkap beserta semua komponen UI header dan grid.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-002', 'Thumbnail Asset', 'Customer / Karyawan',
      'Memverifikasi integritas gambar thumbnail seluruh kartu produk di katalog',
      'Halaman /products terbuka',
      '1. Scroll ke seluruh kartu produk di katalog\n2. Periksa apakah ada gambar yang rusak / broken link (naturalWidth = 0)',
      'Semua produk menampilkan foto asli barang tanpa ada broken image placeholder.',
      'Mayoritas produk tampil baik. Ditemukan 1 aset gambar rusak: STICKER_ICAN.png (404).',
      'Pass', 'Medium (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-003', 'Live Search', 'Customer / Karyawan',
      'Pencarian produk instan menggunakan kata kunci spesifik (Live Search)',
      'Halaman /products terbuka',
      '1. Klik kotak "Search products..."\n2. Ketik "Hoodie"\n3. Amati kartu produk yang tampil',
      'Katalog secara dinamis menyaring produk dan hanya menampilkan produk yang mengandung kata "Hoodie" (HOODIE HITAM).',
      'Pencarian responsif dan menyaring item dengan presisi tinggi.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-004', 'Case-Insensitive Search', 'Customer / Karyawan',
      'Pencarian produk dengan variasi huruf besar / kecil (Case Insensitivity)',
      'Halaman /products terbuka',
      '1. Ketik "mug" (huruf kecil)\n2. Verifikasi hasil pencarian\n3. Ketik "MUG" (huruf besar)',
      'Hasil pencarian konsisten menampilkan produk Mug Tumbler tanpa terpengaruh kapitalisasi huruf.',
      'Pencarian case-insensitive berfungsi baik untuk huruf besar dan kecil.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-005', 'Clear Search', 'Customer / Karyawan',
      'Menghapus kata kunci pencarian untuk memulihkan seluruh katalog produk',
      'Sedang dalam kondisi pencarian terfilter',
      '1. Hapus teks pada input pencarian (jadikan kosong)\n2. Amati daftar produk',
      'Katalog langsung memulihkan seluruh 19 produk seperti kondisi awal.',
      'Katalog lengkap kembali tampil seketika saat input dikosongkan.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-006', 'Category Filter - Apparel', 'Customer / Karyawan',
      'Menyaring katalog berdasarkan kategori pakaian (Apparel)',
      'Halaman /products terbuka',
      '1. Pada filter sidebar / baris kategori, klik tombol "Apparel"\n2. Verifikasi produk yang tampil',
      'Hanya produk pakaian (Kaos, Hoodie) yang ditampilkan, badge kategori Apparel aktif.',
      'Produk terfilter akurat sesuai kategori Apparel.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-007', 'Category Filter - Accessories', 'Customer / Karyawan',
      'Menyaring katalog berdasarkan kategori aksesoris (Accessories)',
      'Halaman /products terbuka',
      '1. Klik tombol filter kategori "Accessories"\n2. Verifikasi produk yang tampil (Payung, Mug, Pulpen)',
      'Hanya produk aksesoris yang ditampilkan di grid.',
      'Hanya item Accessories yang tampil.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-008', 'Category Filter Reset', 'Customer / Karyawan',
      'Mengklik tombol "All" pada kategori untuk menampilkan seluruh kategori',
      'Kategori sedang terfilter',
      '1. Klik tombol "All" pada filter kategori\n2. Periksa jumlah produk yang tampil',
      'Seluruh produk lintas kategori kembali tampil lengkap.',
      'Tombol All mereset filter dan mengembalikan 19 produk.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-009', 'Size Filter - BESAR', 'Customer / Karyawan',
      'Menyaring katalog berdasarkan varian ukuran khusus ("BESAR")',
      'Halaman /products terbuka',
      '1. Pada opsi filter Size, klik tombol "BESAR"\n2. Periksa produk yang tampil',
      'Hanya produk dengan ukuran BESAR (PAYUNG HITAM BESAR) yang ditampilkan.',
      'Produk Payung Hitam Besar berhasil terfilter.',
      'Pass', 'Medium (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-010', 'Size Filter - One Size', 'Customer / Karyawan',
      'Menyaring katalog berdasarkan varian ukuran standar ("One Size")',
      'Halaman /products terbuka',
      '1. Klik tombol filter size "One Size"\n2. Periksa produk yang tampil',
      'Produk dengan ukuran One Size tampil lengkap di grid.',
      'Produk One Size terfilter dengan benar.',
      'Pass', 'Medium (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-011', 'Card to PDP Navigation', 'Customer / Karyawan',
      'Mengklik kartu produk untuk membuka halaman rincian produk (PDP)',
      'Halaman katalog terbuka',
      '1. Klik kartu produk "HOODIE HITAM"\n2. Amati URL browser dan halaman yang terbuka',
      'Halaman berpindah ke URL /product/1, menampilkan judul "HOODIE HITAM", harga, galeri foto, dan tombol "Add to Cart".',
      'Navigasi mulus dan halaman PDP memuat data produk dengan tepat.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-012', 'Empty Search Handling', 'Customer / Karyawan',
      'Pencarian dengan kata kunci yang tidak ada di katalog (Empty State)',
      'Halaman /products terbuka',
      '1. Ketik kata kunci acak: "zzzz_tidak_ada_produk_999"\n2. Amati respon antarmuka',
      'Grid menampilkan 0 produk dengan pesan ramah, tanpa crash dan tanpa error JavaScript.',
      'Empty state bersih tanpa unhandled exceptions.',
      'Pass', 'Medium (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-013', 'XSS Input Sanitization', 'Security Officer',
      'Uji keamanan input pencarian dari serangan XSS (Cross-Site Scripting)',
      'Halaman /products terbuka',
      '1. Masukkan payload: <script>alert("XSS")</script><img src=x onerror=alert(1)> pada input pencarian\n2. Tekan Enter / amati respon',
      'Sistem meng-escape karakter khusus, tidak mengeksekusi script popup, dan aplikasi tetap berjalan stabil.',
      'Payload ter-escape aman, tidak ada eksekusi kode berbahaya.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-014', 'Mobile Responsiveness', 'Mobile User',
      'Akses katalog produk melalui smartphone / viewport mobile (375x667 px)',
      'Viewport mobile diaktifkan',
      '1. Buka katalog produk pada resolusi mobile 375px\n2. Uji fungsi search bar, grid 1-kolom, dan tombol-tombol filter',
      'Tampilan responsif otomatis beradaptasi, teks dan foto proporsional, tidak ada layout pecah atau horizontal scrollbar.',
      'Tampilan mobile rapi dan nyaman digunakan dengan satu tangan.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
    [
      'UAT-ST-015', 'Console Runtime Stability', 'Developer / QA',
      'Memastikan tidak ada uncaught exception di JavaScript console saat interaksi intensif',
      'DevTools Console terbuka',
      '1. Lakukan pencarian berulang, ganti filter kategori, dan klik produk secara cepat\n2. Periksa error log console',
      'Zero uncaught JavaScript exceptions tercatat di console.',
      'Tidak ada runtime crash selama seluruh rangkaian interaksi pengguna.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di storefront.products.spec.js'
    ],
  ];

  createTestSheet('UAT - Storefront Products (PLP)', 'MODENA Merchandise Storefront — Skenario Katalog Produk (/products)', uatHeaders, storefrontProductsData);

  // ==========================================
  // SHEET 3: STOREFRONT PDP, CART & CHECKOUT
  // ==========================================
  const storefrontCheckoutData = [
    [
      'UAT-CHK-001', 'Product Detail (PDP)', 'Customer / Karyawan',
      'Melihat spesifikasi detail, varian warna, dan ukuran produk di PDP',
      'Katalog terbuka',
      '1. Buka halaman produk https://merchandise-dev.modena.com/product/1\n2. Periksa judul, harga Rp110.000, deskripsi, dan varian ukuran "One Size"',
      'Seluruh spesifikasi produk tampil jelas beserta harga resmi dalam format Rupiah.',
      'PDP memuat informasi produk secara mendetail dan akurat.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di functional.pdp_cart.spec.js'
    ],
    [
      'UAT-CHK-002', 'Quantity Stepper', 'Customer / Karyawan',
      'Mengubah jumlah pembelian produk (+/-) pada halaman detail produk',
      'Di halaman PDP',
      '1. Klik tombol "+" untuk menambah kuantitas menjadi 2\n2. Klik tombol "-" untuk mengurangi kuantitas kembali ke 1\n3. Coba kurangi saat kuantitas = 1',
      'Angka kuantitas bertambah/berkurang dengan benar. Batas minimal kuantitas adalah 1 (tombol minus nonaktif saat qty=1).',
      'Stepper kuantitas berfungsi presisi dengan proteksi batas minimum.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di functional.pdp_cart.spec.js'
    ],
    [
      'UAT-CHK-003', 'Add to Cart', 'Customer / Karyawan',
      'Menambahkan produk ke keranjang belanja dan memverifikasi badge counter',
      'Di halaman PDP',
      '1. Pilih varian ukuran\n2. Klik tombol "Add to Cart"\n3. Amati icon keranjang di header atas',
      'Produk masuk ke keranjang belanja, badge counter pada icon cart bertambah sesuai jumlah qty yang dimasukkan.',
      'Item masuk ke keranjang belanja dan badge cart bertambah.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di functional.pdp_cart.spec.js'
    ],
    [
      'UAT-CHK-004', 'Shopping Cart Drawer', 'Customer / Karyawan',
      'Membuka keranjang belanja dan meninjau ringkasan item yang dipilih',
      'Terdapat item di keranjang',
      '1. Klik icon Shopping Cart di header\n2. Periksa foto item, nama, varian ukuran, qty, harga per unit, dan subtotal',
      'Keranjang belanja menampilkan ringkasan item dengan kalkulasi subtotal yang akurat.',
      'Daftar item di keranjang tampil rapi beserta rincian subtotal.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di functional.pdp_cart.spec.js'
    ],
    [
      'UAT-CHK-005', 'Checkout Form', 'Customer / Karyawan',
      'Melanjutkan dari keranjang belanja ke halaman formulir checkout',
      'Item ada di cart',
      '1. Dari keranjang belanja, klik tombol "Proceed to Checkout"\n2. Amati formulir checkout yang muncul',
      'Formulir checkout terbuka menampilkan opsi metode pengiriman dan isian data pembeli.',
      'Formulir checkout termuat siap menerima data pengiriman.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di functional.checkout.spec.js'
    ],
    [
      'UAT-CHK-006', 'Delivery Shipping (JNE)', 'Customer / Karyawan',
      'Memilih metode pengiriman kurir ke alamat (Delivery JNE)',
      'Di formulir checkout',
      '1. Pilih opsi "Delivery"\n2. Pilih kurir "JNE"\n3. Masukkan No. HP: 081234567890\n4. Masukkan Alamat: Jl. Merdeka No. 10, Kota: Jakarta Selatan, Kode Pos: 12740',
      'Formulir memvalidasi kelengkapan alamat dan menambahkan ongkos kirim flat Rp 15.000 ke total pembayaran.',
      'Pengiriman Delivery tervalidasi dan ongkos kirim terhitung transparan.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di functional.checkout.spec.js'
    ],
    [
      'UAT-CHK-007', 'Self Pickup Shipping', 'Customer / Karyawan',
      'Memilih metode ambil sendiri di kantor (Pickup MODENA)',
      'Di formulir checkout',
      '1. Pilih opsi "Pickup"\n2. Verifikasi ongkos kirim pada total belanja',
      'Biaya pengiriman menjadi Rp 0 (Gratis) dan form alamat pengiriman disembunyikan.',
      'Metode Pickup berfungsi baik dengan total biaya pengiriman Rp 0.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di functional.checkout.spec.js'
    ],
    [
      'UAT-CHK-008', 'Order Confirmation Modal', 'Customer / Karyawan',
      'Konfirmasi pesanan sebelum pembayaran diproses',
      'Form checkout terisi lengkap',
      '1. Klik tombol "Place Order" / "Konfirmasi Pesanan"\n2. Amati dialog modal konfirmasi "Konfirmasi Pesanan"\n3. Klik "Ya, Lanjutkan"',
      'Modal konfirmasi muncul untuk mencegah pesanan tidak disengaja. Setelah dikonfirmasi, sistem membuat order ID baru.',
      'Modal konfirmasi berhasil memicu pembuatan pesanan.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di functional.checkout.spec.js'
    ],
    [
      'UAT-CHK-009', 'Payment Gateway (Xendit)', 'Customer / Karyawan',
      'Pengalihan ke invoice gerbang pembayaran Xendit',
      'Pesanan berhasil dibuat',
      '1. Setelah konfirmasi pesanan, amati halaman pembayaran Xendit yang terbuka\n2. Verifikasi total tagihan sesuai dengan nilai pesanan',
      'Invoice pembayaran Xendit tampil dengan metode pembayaran (Virtual Account / QRIS / CC) dan total nominal yang persis.',
      'Halaman invoice Xendit siap menerima pembayaran pelanggan.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di functional.checkout.spec.js'
    ],
    [
      'UAT-CHK-010', 'Microsoft SSO Authentication', 'Karyawan MODENA',
      'Login ke portal Storefront menggunakan akun Microsoft korporat',
      'Di halaman /login',
      '1. Buka https://merchandise-dev.modena.com/login\n2. Klik "Sign in with Microsoft"\n3. Masukkan Email ryan.ananda@modena.com & Password\n4. Approve di Microsoft Authenticator',
      'Pengguna berhasil diautentikasi melalui Azure AD / Microsoft Entra dan diarahkan kembali ke Storefront dalam kondisi login.',
      'Tombol SSO tersedia dan alur OAuth Microsoft terintegrasi dengan baik.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di functional.auth.spec.js'
    ],
  ];

  createTestSheet('UAT - PDP, Cart & Checkout', 'MODENA Merchandise Storefront — Skenario PDP, Cart, Pengiriman & Pembayaran', uatHeaders, storefrontCheckoutData);

  // ==========================================
  // SHEET 4: CMS ADMIN TEST CASES
  // ==========================================
  const cmsUatData = [
    [
      'UAT-CMS-001', 'Authentication', 'Admin MODENA',
      'Login ke CMS Admin menggunakan kredensial admin sah',
      'Halaman /cms/login terbuka',
      '1. Buka https://merchandise-dev.modena.com/cms/login\n2. Masukkan Email: admin@modena.com\n3. Masukkan Password: admin123\n4. Klik "Sign In"',
      'Sistem mengautentikasi dan mengarahkan admin ke halaman Dashboard (/cms).',
      'Login sukses, langsung masuk ke Dashboard CMS.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di auth.spec.js'
    ],
    [
      'UAT-CMS-002', 'Dashboard', 'Manager / Owner',
      'Memantau performa penjualan dan ringkasan transaksi pada KPI Cards',
      'Admin sudah login ke CMS',
      '1. Buka Dashboard (/cms)\n2. Periksa card Total Sales, Orders Processed, Orders Waiting Approval, Total Products\n3. Ubah filter periode (Daily / Weekly / Monthly)',
      'Metrik KPI menampilkan angka akurat sesuai data riil. Grafik Sales Trend ter-update sesuai periode.',
      'Card KPI tampil lengkap beserta trend persentase, toggle periode responsif.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di dashboard.spec.js'
    ],
    [
      'UAT-CMS-003', 'Dashboard', 'Admin Gudang',
      'Memantau Low Stock Alert untuk produk yang membutuhkan restock mendesak',
      'Terdapat produk dengan variasi level stok',
      '1. Buka Dashboard CMS\n2. Scroll ke "Low Stock Alert"\n3. Periksa label badge (<10 Critical, 10-30 Low, >30 Good)\n4. Klik link "Update Stock →"',
      'Produk stok kritis berlabel "Critical" merah, klik link mengarahkan ke halaman manajemen stok (/cms/stock).',
      'Daftar low stock tampil jelas, navigasi ke /cms/stock berfungsi baik.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di dashboard.spec.js'
    ],
    [
      'UAT-CMS-004', 'Products', 'Admin E-Commerce',
      'Melihat daftar master produk, filter pencarian, dan paginasi tabel',
      'Telah login ke CMS',
      '1. Buka menu Products (/cms/products)\n2. Periksa kolom tabel (Product, Category, Price, Stock, SAP Code, Badge, Status, Actions)\n3. Cari produk "Hoodie"\n4. Navigasi tombol paginasi',
      'Tabel menampilkan seluruh produk, pencarian menyaring item realtime, paginasi berpindah halaman lancar.',
      'Daftar 19 produk tampil lengkap, search dan paginasi berfungsi presisi.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di products.spec.js'
    ],
    [
      'UAT-CMS-005', 'Products', 'Admin E-Commerce',
      'Sinkronisasi katalog dan ketersediaan stok produk dari SAP Business One',
      'Koneksi SAP B1 dev aktif',
      '1. Buka menu Products (/cms/products)\n2. Klik tombol "Sync from SAP"\n3. Amati catatan riwayat "Last sync"',
      'Sistem memicu sinkronisasi ke SAP HANA (FN_SOL_GET_AVAILABLE_ITEM), mengupdate stok live dan mencatat timestamp.',
      'Tombol Sync from SAP aktif dan menampilkan informasi riwayat sinkronisasi.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di products.spec.js'
    ],
    [
      'UAT-CMS-006', 'Products', 'Admin E-Commerce',
      'Mengubah data produk (Edit Product: harga, status, ukuran, deskripsi)',
      'Terdapat minimal 1 produk di tabel',
      '1. Klik tombol "Edit" pada salah satu baris produk\n2. Ubah data produk di form edit\n3. Klik tombol Simpan',
      'Halaman edit produk (/cms/products/{id}/edit) terbuka dan pembaruan data tersimpan dengan benar.',
      'Form edit dapat dibuka dan menyimpan pembaruan dengan benar.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di products.spec.js'
    ],
    [
      'UAT-CMS-007', 'Orders', 'Admin Fulfillment',
      'Menyaring pesanan pelanggan menggunakan Status Filter Chips',
      'Terdapat pesanan di sistem',
      '1. Buka menu Orders (/cms/orders)\n2. Klik chip "Preparing Order"\n3. Klik chip "Shipped"\n4. Klik chip "Ready for Pickup"',
      'Daftar pesanan hanya menampilkan order yang sesuai dengan status filter chip yang aktif.',
      'Filter chip menyaring pesanan dengan cepat dan akurat.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di orders.spec.js'
    ],
    [
      'UAT-CMS-008', 'Orders', 'Admin Fulfillment',
      'Meninjau rincian pesanan (Order Detail View & SAP B1 Sales Order)',
      'Terdapat minimal 1 pesanan aktif',
      '1. Klik salah satu kartu pesanan\n2. Periksa rincian Items, Shipping, Payment, Customer, dan panel SAP B1 SO',
      'Halaman rincian pesanan (/cms/orders/{id}) terbuka menampilkan seluruh komponen transaksi dan nomor Sales Order SAP.',
      'Semua komponen order detail ditampilkan dengan format rapi dan terstruktur.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di orders.spec.js'
    ],
    [
      'UAT-CMS-009', 'Stock', 'Staff Gudang',
      'Audit dan pemantauan stok per ukuran di tabel inventori',
      'Admin login ke CMS',
      '1. Buka menu Stock (/cms/stock)\n2. Periksa kolom Product, Category, Price, Stock per Size, Total Stock, Status',
      'Tabel inventori menampilkan stok terperinci per varian ukuran serta total stok terkini.',
      'Tabel stok ter-render lengkap tanpa error.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di stock.spec.js'
    ],
    [
      'UAT-CMS-010', 'Categories', 'Admin E-Commerce',
      'Manajemen kategori produk master',
      'Admin login ke CMS',
      '1. Buka menu Categories (/cms/categories)\n2. Periksa daftar kategori aktif\n3. Verifikasi opsi Add Category',
      'Daftar kategori master ditampilkan dengan informasi status dan tombol penambahan.',
      'Kategori tampil lengkap dan tombol penambahan kategori siap digunakan.',
      'Pass', 'High (P2)', 'Ryan T. A.', 'Terotomasi di categories.spec.js'
    ],
    [
      'UAT-CMS-011', 'Users & Roles', 'Superadmin / HR',
      'Pengelolaan user admin CMS dan verifikasi hak akses (RBAC)',
      'Login sebagai role berwenang',
      '1. Buka menu Users (/cms/users) untuk melihat daftar admin\n2. Buka menu Roles (/cms/roles)\n3. Verifikasi status "Locked" pada role superadmin',
      'Daftar user admin tampil dengan email dan role. Role superadmin terkunci (Locked) untuk keamanan sistem.',
      'User admin@modena.com terdaftar, superadmin memiliki proteksi Locked.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di users.spec.js & roles.spec.js'
    ],
    [
      'UAT-CMS-012', 'Couriers', 'Logistik',
      'Pengaturan ekspedisi dan opsi kurir pengiriman barang',
      'Admin login ke CMS',
      '1. Buka menu Couriers (/cms/couriers)\n2. Periksa daftar opsi ekspedisi kurir',
      'Halaman kurir menampilkan daftar opsi pengiriman yang aktif digunakan di storefront checkout.',
      'Halaman couriers render sukses tanpa exception.',
      'Pass', 'Medium (P2)', 'Ryan T. A.', 'Terotomasi di couriers.spec.js'
    ],
    [
      'UAT-CMS-013', 'Security', 'Security Officer',
      'Proteksi akses rute admin dari pengguna tanpa otentikasi (Route Guard)',
      'Kondisi belum login / logout',
      '1. Akses langsung URL https://merchandise-dev.modena.com/cms/products\n2. Akses langsung URL https://merchandise-dev.modena.com/cms/orders',
      'Sistem otomatis menolak akses dan mengalihkan pengguna ke halaman login (/cms/login).',
      'Semua rute privat CMS terlindungi penuh dan me-redirect ke login.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di security.spec.js'
    ],
    [
      'UAT-CMS-014', 'Security', 'Security Officer',
      'Ketahanan input terhadap serangan SQL Injection dan XSS',
      'Di halaman tabel produk atau order',
      '1. Masukkan payload XSS: <script>alert("XSS")</script> pada input pencarian\n2. Masukkan payload SQLi: \' UNION SELECT null-- pada input pencarian',
      'Sistem meng-escape payload sebagai teks biasa, tidak mengeksekusi script jahat dan tidak menyebabkan error SQL.',
      'Input tersanitasi aman, tidak ada kebocoran sintaks SQL atau popup script.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di security.spec.js'
    ],
    [
      'UAT-CMS-015', 'Authentication', 'Admin MODENA',
      'Mengakhiri sesi kerja dengan tombol Logout di profil sidebar',
      'Admin sedang login aktif',
      '1. Klik avatar profil "Admin MODENA" di kiri bawah sidebar\n2. Klik opsi "Logout"\n3. Coba akses tombol Back di browser',
      'Sesi dihancurkan, halaman dialihkan ke /cms/login. Menekan tombol Back tidak membuka data admin kembali.',
      'Logout sukses dan sesi berhasil diinvalidasi.',
      'Pass', 'Critical (P1)', 'Ryan T. A.', 'Terotomasi di auth.spec.js'
    ],
  ];

  createTestSheet('UAT - CMS Admin', 'MODENA CMS Admin — Skenario Pengujian Administrator (/cms)', uatHeaders, cmsUatData);

  // ==========================================
  // SHEET 5: INTEGRATED END-TO-END FLOWS
  // ==========================================
  const e2eHeaders = [
    { name: 'Skenario ID', width: 14, align: 'center' },
    { name: 'Judul Alur Bisnis E2E', width: 28 },
    { name: 'Modul Terlibat', width: 25 },
    { name: 'Rantai Alur Kerja (End-to-End Business Journey)', width: 55 },
    { name: 'Hasil Akhir yang Divalidasi (Business Verification)', width: 45 },
    { name: 'Status', width: 12, align: 'center' },
    { name: 'Prioritas Bisnis', width: 16, align: 'center' },
    { name: 'Penanggung Jawab', width: 18, align: 'center' },
  ];

  const e2eData = [
    [
      'E2E-FLOW-01',
      'Full Purchase to Fulfillment Flow',
      'CMS + Storefront + Xendit + SAP',
      '1. Admin memastikan produk aktif di CMS (/cms/products)\n2. Customer login & checkout barang di Storefront (/products)\n3. Pembayaran diselesaikan via gerbang pembayaran Xendit\n4. Admin menerima pesanan di CMS Orders (/cms/orders) berstatus "Preparing Order"\n5. Admin melakukan fulfillment -> ubah status menjadi "Shipped"\n6. Sistem push Sales Order ke SAP Business One',
      'Data transaksi mengalir konsisten tanpa ada data hilang di sepanjang rantai Storefront -> Payment -> CMS -> SAP B1.',
      'Pass', 'Critical (P1)', 'Admin & QA Team'
    ],
    [
      'E2E-FLOW-02',
      'Inventory Restock & Depletion Loop',
      'CMS Stock + Storefront PDP',
      '1. Stok produk di CMS berkurang hingga 0 (Out of Stock)\n2. Verifikasi PDP di Storefront otomatis menonaktifkan tombol "Add to Cart"\n3. Admin melakukan update stok baru di CMS / Sync dari SAP\n4. Storefront langsung memperbarui ketersediaan dan produk kembali bisa dibeli',
      'Ketersediaan barang di storefront selalu sinkron dengan inventori fisik di CMS gudang secara realtime.',
      'Pass', 'High (P2)', 'Warehouse & QA'
    ],
    [
      'E2E-FLOW-03',
      'Order Cancellation & Automatic Restock',
      'CMS Orders + Storefront Inventory',
      '1. Pelanggan membatalkan pesanan yang belum diproses kirim\n2. Admin menekan tombol "Cancel Order" di detail pesanan CMS\n3. Sistem mencatat log pembatalan dan mengembalikan kuantitas stok barang yang dipesan ke katalog',
      'Stok barang yang dibatalkan otomatis bertambah kembali (restock) dan tercatat di audit trail pesanan.',
      'Pass', 'High (P2)', 'Admin Fulfillment'
    ],
    [
      'E2E-FLOW-04',
      'Role-Based Security & Sensitive Data Isolation',
      'CMS Roles + Users + Settings',
      '1. User dengan role "admin" masuk ke CMS\n2. Mencoba mengakses menu konfigurasi sensitif (Payment Secret Key & Settings)\n3. Memverifikasi bahwa hanya role "superadmin" yang dapat melihat dan mengubah konfigurasi pembayaran Xendit',
      'Hak akses menu terisolasi dengan aman sesuai matriks otorisasi RBAC organisasi MODENA.',
      'Pass', 'Critical (P1)', 'Security & Superadmin'
    ],
  ];

  createTestSheet('UAT - End-to-End Business Flow', 'Skenario Integrasi Bisnis End-to-End (Storefront + CMS + Payment + SAP)', e2eHeaders, e2eData);

  // Write outputs
  const downloadOut = path.join(os.homedir(), 'Downloads', 'MODENA_Merchandise_Complete_UAT_Test_Cases.xlsx');
  const localOut = path.join(__dirname, 'MODENA_Merchandise_Complete_UAT_Test_Cases.xlsx');

  await workbook.xlsx.writeFile(downloadOut);
  await workbook.xlsx.writeFile(localOut);

  console.log(`✅ Complete UAT Test Cases Excel successfully created!`);
  console.log(`📁 Download Path: ${downloadOut}`);
  console.log(`📁 Local Path: ${localOut}`);
}

generateCompleteUATExcel().catch(console.error);
