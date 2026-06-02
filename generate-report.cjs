/**
 * Generate Excel Test Case Report — PRIVE Website QA Audit
 * Run: node generate-report.cjs
 */

const XLSX = require('xlsx');
const path = require('path');

// ─────────────────────────────────────────────────────────────────
// DATA TEST CASES
// ─────────────────────────────────────────────────────────────────

const testCases = [
  // ── SUITE A: OLD SITE HOMEPAGE ──────────────────────────────────
  {
    id: 'TC-004',
    suite: 'A — [OLD] Homepage',
    title: 'Page title benar di semua halaman',
    url: 'https://prive-living.com/',
    type: 'Functional',
    priority: 'High',
    steps: '1. Buka homepage\n2. Cek title\n3. Buka halaman Living\n4. Cek title\n5. Buka product detail\n6. Cek title',
    expected: 'Setiap halaman menampilkan title yang relevan dengan kontennya',
    actual: 'SEMUA halaman menampilkan title "Get in Touch with PRIVE: Contact Us for Premium Home Solutions" (title halaman Contact Us)',
    status: 'FAIL',
    severity: 'High',
    target: 'Old Site',
    notes: 'SEO dan brand perception sangat terdampak',
  },
  {
    id: 'TC-010',
    suite: 'A — [OLD] Homepage',
    title: 'Tidak ada JavaScript console error',
    url: 'https://prive-living.com/',
    type: 'Functional',
    priority: 'Medium',
    steps: '1. Buka homepage\n2. Buka DevTools Console\n3. Amati error',
    expected: 'Tidak ada console error di setiap page load',
    actual: 'jQuery ".dialog is not a function" error muncul di setiap page load',
    status: 'FAIL',
    severity: 'Medium',
    target: 'Old Site',
    notes: 'Error berasal dari jQuery UI plugin yang tidak terload',
  },
  {
    id: 'TC-008-OLD',
    suite: 'A — [OLD] Homepage',
    title: 'Hero section memiliki CTA button',
    url: 'https://prive-living.com/',
    type: 'Conversion',
    priority: 'High',
    steps: '1. Buka homepage\n2. Lihat hero/banner section\n3. Cek apakah ada tombol CTA',
    expected: 'Hero section memiliki tombol CTA (Shop Now / Explore Collection)',
    actual: 'Hero section tidak memiliki tombol CTA sama sekali',
    status: 'FAIL',
    severity: 'High',
    target: 'Old Site',
    notes: 'Tidak ada call-to-action utama di above-the-fold',
  },
  {
    id: 'TC-009-OLD',
    suite: 'A — [OLD] Homepage',
    title: 'Newsletter popup tidak muncul di detik pertama',
    url: 'https://prive-living.com/',
    type: 'UX',
    priority: 'Medium',
    steps: '1. Buka homepage\n2. Tunggu 2 detik\n3. Amati apakah popup muncul',
    expected: 'Newsletter popup muncul setelah minimal 30 detik atau saat exit-intent',
    actual: 'Newsletter popup muncul langsung saat halaman load (dalam 2 detik pertama)',
    status: 'FAIL',
    severity: 'Medium',
    target: 'Old Site',
    notes: 'UX buruk — menganggu user sebelum mereka sempat melihat konten',
  },

  // ── SUITE B: OLD SITE PRODUCT LISTING ───────────────────────────
  {
    id: 'TC-B01',
    suite: 'B — [OLD] Product Listing',
    title: 'Product cards tampil dengan gambar',
    url: 'https://prive-living.com/product-category/living/',
    type: 'Functional',
    priority: 'High',
    steps: '1. Buka halaman Living category\n2. Cek product cards\n3. Cek apakah gambar load',
    expected: 'Semua product cards menampilkan gambar dan nama produk',
    actual: 'Product cards tampil normal dengan gambar',
    status: 'PASS',
    severity: '-',
    target: 'Old Site',
    notes: '',
  },
  {
    id: 'TC-B02',
    suite: 'B — [OLD] Product Listing',
    title: 'Product count baseline ≥ 200',
    url: 'https://prive-living.com/product-category/living/',
    type: 'Regression',
    priority: 'High',
    steps: '1. Buka halaman Living category\n2. Cek result count di WooCommerce',
    expected: 'Minimal 200 produk di kategori Living (baseline untuk perbandingan)',
    actual: '~278 produk terdeteksi di old site',
    status: 'PASS',
    severity: '-',
    target: 'Old Site',
    notes: 'Baseline: 278 produk untuk perbandingan dengan new site',
  },

  // ── SUITE C: OLD SITE PRODUCT DETAIL ────────────────────────────
  {
    id: 'TC-C01',
    suite: 'C — [OLD] Product Detail',
    title: 'Product detail page elemen utama lengkap',
    url: 'https://prive-living.com/product/alanna/',
    type: 'Functional',
    priority: 'High',
    steps: '1. Buka product detail page\n2. Cek H1, image, HOW TO BUY, dimensions',
    expected: 'H1, gambar, section HOW TO BUY, dan dimensions semua ada dan terload',
    actual: 'Semua elemen utama tersedia',
    status: 'PASS',
    severity: '-',
    target: 'Old Site',
    notes: '',
  },

  // ── SUITE D: NEW SITE HOMEPAGE ───────────────────────────────────
  {
    id: 'TC-001',
    suite: 'D — [NEW] Homepage',
    title: 'Semua product images harus load (bukan broken/mixed content)',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'Critical',
    steps: '1. Buka homepage new site\n2. Cek console untuk mixed content errors\n3. Cek semua img src',
    expected: 'Semua gambar terload dari HTTPS CDN, tidak ada mixed content error',
    actual: 'SEMUA gambar artikel/produk broken — disajikan dari http://192.168.3.86:8070/ (internal IP, HTTP) yang diblokir browser sebagai mixed content',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: 'PRODUCTION BLOCKER — semua gambar tidak terlihat di browser manapun',
  },
  {
    id: 'TC-002',
    suite: 'D — [NEW] Homepage',
    title: 'Tidak ada internal IP address di HTML source',
    url: 'https://prive-dev.modena.com/',
    type: 'Security',
    priority: 'Critical',
    steps: '1. Buka homepage\n2. View Source\n3. Cari pattern 192.168.x.x atau 10.x.x.x',
    expected: 'Tidak ada internal IP address yang terekspos di HTML public',
    actual: 'IP internal server 192.168.3.86:8070 terekspos di HTML publik (dalam src gambar)',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: 'SECURITY ISSUE — information disclosure, internal network topology terekspos',
  },
  {
    id: 'TC-003',
    suite: 'D — [NEW] Homepage',
    title: 'Scroll tidak memicu navigasi ke halaman lain',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'Critical',
    steps: '1. Buka homepage\n2. Scroll ke bawah perlahan\n3. Monitor URL bar',
    expected: 'URL tidak berubah saat user scroll di homepage',
    actual: 'Scroll pada hero carousel memicu navigasi otomatis ke /product/doris — URL berubah tanpa klik',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: 'PRODUCTION BLOCKER — UX sangat buruk, user diarahkan ke halaman lain hanya dengan scroll',
  },
  {
    id: 'TC-009',
    suite: 'D — [NEW] Homepage',
    title: 'Newsletter popup tidak muncul di detik pertama',
    url: 'https://prive-dev.modena.com/',
    type: 'UX',
    priority: 'High',
    steps: '1. Buka homepage\n2. Tunggu 1.5 detik\n3. Amati popup',
    expected: 'Newsletter popup delayed minimal 30 detik atau exit-intent',
    actual: 'Newsletter popup (.fixed.inset-0.z-[9999]) muncul langsung saat halaman load',
    status: 'FAIL',
    severity: 'High',
    target: 'New Site',
    notes: '',
  },
  {
    id: 'TC-022',
    suite: 'D — [NEW] Homepage',
    title: 'Newsletter popup tidak memblokir interaksi halaman',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'Critical',
    steps: '1. Buka homepage\n2. Coba klik nav link\n3. Coba scroll\n4. Coba klik konten',
    expected: 'User masih bisa berinteraksi dengan halaman meskipun popup muncul',
    actual: 'Overlay .fixed.inset-0 dengan pointer-events aktif menghalangi SEMUA interaksi di seluruh halaman',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: 'PRODUCTION BLOCKER — user tidak bisa klik navigasi, tidak bisa scroll, tidak bisa menutup popup',
  },
  {
    id: 'TC-008',
    suite: 'D — [NEW] Homepage',
    title: 'Hero section memiliki CTA button',
    url: 'https://prive-dev.modena.com/',
    type: 'Conversion',
    priority: 'High',
    steps: '1. Buka homepage\n2. Lihat hero section above-the-fold',
    expected: 'Ada tombol CTA (Explore Collection / Shop Now) di hero',
    actual: 'Hero section tidak memiliki tombol CTA',
    status: 'FAIL',
    severity: 'High',
    target: 'New Site',
    notes: 'Conversion killer — tidak ada call-to-action utama',
  },
  {
    id: 'TC-020',
    suite: 'D — [NEW] Homepage',
    title: 'H1 bersifat statis, tidak berubah mengikuti carousel',
    url: 'https://prive-dev.modena.com/',
    type: 'SEO',
    priority: 'High',
    steps: '1. Buka homepage\n2. Catat teks H1\n3. Tunggu 5 detik untuk carousel auto-advance\n4. Bandingkan H1',
    expected: 'H1 tetap sama dan bersifat statis',
    actual: 'H1 berubah mengikuti slide carousel (COZY BEDROOM → ELEGANT LIVING, dll). "COZY BEDROOM" muncul 2x',
    status: 'FAIL',
    severity: 'High',
    target: 'New Site',
    notes: 'SEO critical — multiple dynamic H1 merusak page authority',
  },

  // ── SUITE E: SEO AUDIT ───────────────────────────────────────────
  {
    id: 'TC-024',
    suite: 'E — [NEW] SEO',
    title: 'Canonical URL mengarah ke domain yang benar',
    url: 'https://prive-dev.modena.com/',
    type: 'SEO',
    priority: 'Critical',
    steps: '1. Buka homepage\n2. View source\n3. Cari tag <link rel="canonical">',
    expected: 'Canonical URL: https://prive-living.com (dengan tanda hubung)',
    actual: 'Canonical URL: https://priveliving.com (TANPA tanda hubung — domain berbeda/salah)',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: 'SEO BLOCKER — Google akan mengindeks domain salah. og:url dan JSON-LD juga salah',
  },
  {
    id: 'TC-025',
    suite: 'E — [NEW] SEO',
    title: 'Setiap halaman memiliki meta description',
    url: 'https://prive-dev.modena.com/',
    type: 'SEO',
    priority: 'High',
    steps: '1. Buka Homepage, Living, Product Detail, Contact\n2. Cek meta description di source',
    expected: 'Setiap halaman punya meta description unik minimal 120 karakter',
    actual: 'Meta description ada tapi generic ("Discover timeless, modern furniture...") — sama di semua halaman',
    status: 'FAIL',
    severity: 'Medium',
    target: 'New Site',
    notes: 'Duplicate meta description menurunkan CTR di Google',
  },
  {
    id: 'TC-025b',
    suite: 'E — [NEW] SEO',
    title: 'Homepage title benar (bukan "Get in Touch" atau generic)',
    url: 'https://prive-dev.modena.com/',
    type: 'SEO',
    priority: 'High',
    steps: '1. Buka homepage\n2. Cek tag <title>',
    expected: 'Title mengandung brand name "PRIVE" dan kata kunci utama',
    actual: 'Title: "Prive Living — Modern Furniture" — OK tapi bukan keyword-optimized',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: 'Title OK, berbeda dari old site bug TC-004',
  },

  // ── SUITE F: PRODUCT CATALOG ─────────────────────────────────────
  {
    id: 'TC-007',
    suite: 'F — [NEW] Product Catalog',
    title: 'Product count tidak turun lebih dari 30% vs old site',
    url: 'https://prive-dev.modena.com/product-category/living',
    type: 'Regression',
    priority: 'Critical',
    steps: '1. Buka Living category\n2. Cek total product count\n3. Bandingkan dengan old site (278)',
    expected: 'Minimal 194 produk (70% dari baseline 278)',
    actual: '~178 produk — 100 produk hilang (36% regression dari old site)',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: 'CONTENT REGRESSION — 36% catalog hilang, kemungkinan migration tidak lengkap',
  },
  {
    id: 'TC-011',
    suite: 'F — [NEW] Product Catalog',
    title: 'Category tabs tidak overflow keluar viewport',
    url: 'https://prive-dev.modena.com/product-category/living',
    type: 'UI',
    priority: 'Medium',
    steps: '1. Buka product listing\n2. Lihat tab kategori\n3. Cek tab terakhir visibility',
    expected: 'Semua tab kategori terlihat atau ada scroll indicator',
    actual: 'Tab terakhir terpotong di viewport tanpa scroll indicator',
    status: 'FAIL',
    severity: 'Medium',
    target: 'New Site',
    notes: 'UX issue — user tidak tahu ada lebih banyak kategori',
  },
  {
    id: 'TC-001b',
    suite: 'F — [NEW] Product Catalog',
    title: 'Semua product images di listing page tidak broken',
    url: 'https://prive-dev.modena.com/product-category/living',
    type: 'Functional',
    priority: 'Critical',
    steps: '1. Buka product listing\n2. Cek semua img elements\n3. Verifikasi naturalWidth > 0',
    expected: 'Semua product images terload dari HTTPS CDN',
    actual: 'Product images served dari 192.168.3.86:8070 — semua broken (mixed content)',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: 'Sama dengan TC-001 — image CDN tidak dikonfigurasi untuk public',
  },

  // ── SUITE G: PRODUCT DETAIL ──────────────────────────────────────
  {
    id: 'TC-001c',
    suite: 'G — [NEW] Product Detail',
    title: 'Product detail image tidak broken',
    url: 'https://prive-dev.modena.com/product/doris',
    type: 'Functional',
    priority: 'Critical',
    steps: '1. Buka product detail\n2. Cek main product image\n3. Cek naturalWidth',
    expected: 'Product image terload dengan naturalWidth > 0',
    actual: 'Product image broken — src dari 192.168.3.86:8070',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: '',
  },
  {
    id: 'TC-G01',
    suite: 'G — [NEW] Product Detail',
    title: 'Elemen wajib product detail lengkap',
    url: 'https://prive-dev.modena.com/product/doris',
    type: 'Functional',
    priority: 'High',
    steps: '1. Buka product detail\n2. Cek H1, breadcrumb, How to Buy, Call Us, Mail Us, Dimensions',
    expected: 'Semua elemen wajib ada dan visible',
    actual: 'H1 ✓, Breadcrumb ✓, How to Buy ✓, Call Us ✓, Mail Us ✓, Dimensions ✓',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: 'Struktur halaman sudah bagus',
  },
  {
    id: 'TC-032',
    suite: 'G — [NEW] Product Detail',
    title: 'Product detail memiliki image gallery (multiple views)',
    url: 'https://prive-dev.modena.com/product/doris',
    type: 'UX',
    priority: 'High',
    steps: '1. Buka product detail\n2. Hitung jumlah gambar produk\n3. Cek gallery/zoom feature',
    expected: 'Minimal 3-5 gambar produk dari berbagai sudut, ada fitur zoom/lightbox',
    actual: 'Hanya 1 gambar produk, tidak ada gallery, tidak ada zoom/lightbox',
    status: 'FAIL',
    severity: 'High',
    target: 'New Site',
    notes: 'Luxury brand standard: 5-10 product photos per SKU',
  },

  // ── SUITE H: SEARCH ──────────────────────────────────────────────
  {
    id: 'TC-021',
    suite: 'H — [NEW] Search',
    title: 'Search menampilkan product results (bukan hanya artikel)',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'Critical',
    steps: '1. Klik search icon\n2. Ketik "sofa"\n3. Tekan Enter\n4. Periksa hasil',
    expected: 'Search menampilkan produk sofa dari catalog',
    actual: 'Search hanya menampilkan 1 artikel placeholder, tidak ada produk sama sekali',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: 'PRODUCTION BLOCKER — search function tidak mengindeks WooCommerce product catalog',
  },
  {
    id: 'TC-031',
    suite: 'H — [NEW] Search',
    title: 'Search memiliki live autocomplete/suggestions',
    url: 'https://prive-dev.modena.com/',
    type: 'UX',
    priority: 'Low',
    steps: '1. Buka search\n2. Ketik "sofa" perlahan\n3. Amati apakah ada dropdown suggestions',
    expected: 'Muncul autocomplete dropdown dengan product suggestions',
    actual: 'Tidak ada autocomplete — hanya input field biasa tanpa live suggestions',
    status: 'FAIL',
    severity: 'Low',
    target: 'New Site',
    notes: 'Advisory — best practice luxury e-commerce',
  },

  // ── SUITE I: NAVIGATION ──────────────────────────────────────────
  {
    id: 'TC-I01',
    suite: 'I — [NEW] Navigation',
    title: 'Semua nav links berfungsi dan tidak 404',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'High',
    steps: '1. Klik Living, Dining, Bed, Contact Us, Kitchen, Wardrobe\n2. Cek status response',
    expected: 'Semua navigasi mengarah ke halaman yang ada (HTTP 200)',
    actual: 'Living ✓, Dining ✓, Bed ✓, Contact ✓, Kitchen ✓, Wardrobe ✓',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: '',
  },
  {
    id: 'TC-I02',
    suite: 'I — [NEW] Navigation',
    title: 'Cabinetry dropdown berfungsi dengan benar',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'High',
    steps: '1. Klik Cabinetry button di nav\n2. Cek submenu Kitchen dan Wardrobe muncul',
    expected: 'Dropdown terbuka dengan submenu Kitchen dan Wardrobe, aria-expanded berubah ke true',
    actual: 'Dropdown berfungsi tapi aria-expanded tidak ada (accessibility issue)',
    status: 'FAIL',
    severity: 'Medium',
    target: 'New Site',
    notes: 'Fungsional OK, tapi aksesibilitas kurang',
  },
  {
    id: 'TC-015',
    suite: 'I — [NEW] Navigation',
    title: 'Mobile hamburger menu tersedia di viewport 375px',
    url: 'https://prive-dev.modena.com/',
    type: 'Mobile',
    priority: 'High',
    steps: '1. Set viewport 375x812\n2. Buka homepage\n3. Cek hamburger button',
    expected: 'Hamburger menu button visible, nav links tersembunyi di mobile',
    actual: 'md:hidden class pada mobile nav button — hamburger ada, nav links tersembunyi dengan md:flex',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: 'Responsive nav sudah dikonfigurasi dengan Tailwind breakpoints',
  },
  {
    id: 'TC-012',
    suite: 'I — [NEW] Navigation',
    title: 'Footer "About Us" link mengarah ke halaman yang tepat',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'Low',
    steps: '1. Scroll ke footer\n2. Klik "About Us"\n3. Cek URL tujuan',
    expected: 'Mengarah ke /about-us',
    actual: 'Footer "About Us" link mengarah ke /contact-us — tidak ada halaman /about-us',
    status: 'FAIL',
    severity: 'Low',
    target: 'New Site',
    notes: 'Advisory — brand credibility, luxury brand harus punya halaman About Us tersendiri',
  },

  // ── SUITE J: CONTACT FORM ────────────────────────────────────────
  {
    id: 'TC-026',
    suite: 'J — [NEW] Contact Form',
    title: 'Form validation menampilkan custom error messages',
    url: 'https://prive-dev.modena.com/contact-us',
    type: 'Functional',
    priority: 'Medium',
    steps: '1. Buka contact form\n2. Klik Submit tanpa isi apapun\n3. Amati error messages',
    expected: 'Muncul inline custom error messages di bawah setiap field yang kosong',
    actual: 'Hanya menggunakan browser native HTML5 validation tooltip — tidak ada custom error styling',
    status: 'FAIL',
    severity: 'Medium',
    target: 'New Site',
    notes: 'Browser tooltip tidak aksesibel dan tidak sesuai brand premium',
  },
  {
    id: 'TC-027',
    suite: 'J — [NEW] Contact Form',
    title: 'T&C checkbox text tidak typo dan ada link ke dokumen',
    url: 'https://prive-dev.modena.com/contact-us',
    type: 'Content',
    priority: 'Medium',
    steps: '1. Buka contact form\n2. Cari checkbox T&C\n3. Baca teksnya\n4. Cek apakah ada link',
    expected: '"I agree to the Terms and Conditions" dengan hyperlink ke dokumen T&C',
    actual: 'Teks "term and condition" (typo — seharusnya "terms and conditions") dan tidak ada link ke dokumen',
    status: 'FAIL',
    severity: 'Medium',
    target: 'New Site',
    notes: 'Legal risk — T&C harus dapat diakses dan teks legal harus benar',
  },
  {
    id: 'TC-J01',
    suite: 'J — [NEW] Contact Form',
    title: 'Semua field wajib ada di contact form',
    url: 'https://prive-dev.modena.com/contact-us',
    type: 'Functional',
    priority: 'High',
    steps: '1. Buka contact form\n2. Verifikasi keberadaan: First Name, Last Name, Email, Phone, Message',
    expected: 'Semua 5 field wajib ada',
    actual: 'Semua field wajib tersedia',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: '',
  },

  // ── SUITE K: 404 PAGE ────────────────────────────────────────────
  {
    id: 'TC-023',
    suite: 'K — [NEW] 404 Page',
    title: '404 page memiliki navigasi dan recovery path',
    url: 'https://prive-dev.modena.com/halaman-tidak-ada',
    type: 'UX',
    priority: 'High',
    steps: '1. Buka URL yang tidak ada\n2. Cek apakah ada header/nav\n3. Cek "Back to Home" link\n4. Cek footer',
    expected: '404 page menampilkan header, footer, "Back to Home" link, dan pesan yang jelas',
    actual: '404 page hanya menampilkan "404 | This page could not be found." — tidak ada header, footer, atau navigation',
    status: 'FAIL',
    severity: 'High',
    target: 'New Site',
    notes: 'User terjebak tanpa cara untuk kembali. Next.js default 404 digunakan, bukan custom page',
  },

  // ── SUITE L: FOOTER ──────────────────────────────────────────────
  {
    id: 'TC-L01',
    suite: 'L — [NEW] Footer',
    title: 'Semua footer links tidak broken (tidak 404)',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'Medium',
    steps: '1. Scroll ke footer\n2. Klik setiap link\n3. Cek HTTP status',
    expected: 'Semua footer links mengarah ke halaman aktif (HTTP 200)',
    actual: 'Living ✓, Dining ✓, Bed ✓, Blog ✓, Contact ✓, Privacy Policy ✓. About Us → /contact-us (misdirected)',
    status: 'FAIL',
    severity: 'Low',
    target: 'New Site',
    notes: '"About Us" misdirect ke Contact page',
  },
  {
    id: 'TC-L02',
    suite: 'L — [NEW] Footer',
    title: 'Footer newsletter form berfungsi',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'Medium',
    steps: '1. Scroll ke footer\n2. Isi email\n3. Klik Submit',
    expected: 'Form menerima email valid, menolak email invalid',
    actual: 'Form ada dan menggunakan input type="email" (HTML5 validation)',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: '',
  },

  // ── SUITE M: PERFORMANCE ─────────────────────────────────────────
  {
    id: 'TC-018',
    suite: 'M — [NEW] Performance',
    title: 'Core performance metrics dalam threshold',
    url: 'https://prive-dev.modena.com/',
    type: 'Performance',
    priority: 'High',
    steps: '1. Buka homepage\n2. Ambil Navigation Timing API data',
    expected: 'domInteractive < 3000ms, domComplete < 5000ms',
    actual: 'domInteractive ~1200ms ✓, domComplete ~2500ms ✓ (Next.js performance lebih baik dari WordPress)',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: 'New site lebih cepat berkat Next.js SSR vs WordPress',
  },
  {
    id: 'TC-028',
    suite: 'M — [NEW] Performance',
    title: 'Static images di /public/images/ tidak 404',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'High',
    steps: '1. Request URL gambar statis satu per satu\n2. Cek HTTP status',
    expected: 'Semua static images return HTTP 200',
    actual: '9 static images return 404: Showroom-AmbienteSenopati.jpg, Showroom-Kemang.jpg, Showroom-Surabaya.jpg, prive-catalogue.jpg, dan lainnya',
    status: 'FAIL',
    severity: 'High',
    target: 'New Site',
    notes: '9 gambar showroom dan catalogue hilang dari /public/images/',
  },
  {
    id: 'TC-013',
    suite: 'M — [NEW] Performance',
    title: 'Tidak ada RSC prefetch errors di console',
    url: 'https://prive-dev.modena.com/',
    type: 'Performance',
    priority: 'Medium',
    steps: '1. Buka homepage\n2. Hover nav links untuk trigger prefetch\n3. Monitor failed requests',
    expected: 'Tidak ada /_rsc prefetch request yang gagal',
    actual: 'Multiple _rsc prefetch failures di console — Next.js RSC streaming diblokir reverse proxy',
    status: 'FAIL',
    severity: 'Medium',
    target: 'New Site',
    notes: 'Reverse proxy perlu dikonfigurasi untuk mendukung RSC streaming headers',
  },

  // ── SUITE N: ACCESSIBILITY ───────────────────────────────────────
  {
    id: 'TC-019',
    suite: 'N — [NEW] Accessibility',
    title: 'Semua interactive elements memiliki accessible label',
    url: 'https://prive-dev.modena.com/',
    type: 'Accessibility',
    priority: 'High',
    steps: '1. Audit semua button dan img\n2. Cek aria-label dan alt attribute',
    expected: 'Semua button punya text/aria-label, semua img punya alt',
    actual: 'Beberapa icon button tanpa aria-label, beberapa img tanpa alt. WhatsApp button ✓, Search ✓',
    status: 'FAIL',
    severity: 'Medium',
    target: 'New Site',
    notes: 'WCAG 2.1 Level AA requirement',
  },
  {
    id: 'TC-030',
    suite: 'N — [NEW] Accessibility',
    title: 'Cabinetry dropdown button punya aria-expanded',
    url: 'https://prive-dev.modena.com/',
    type: 'Accessibility',
    priority: 'Medium',
    steps: '1. Inspect Cabinetry button\n2. Cek aria-expanded attribute\n3. Klik dan cek perubahan',
    expected: 'aria-expanded="false" saat tutup, aria-expanded="true" saat terbuka',
    actual: 'Cabinetry button tidak memiliki aria-expanded attribute sama sekali',
    status: 'FAIL',
    severity: 'Medium',
    target: 'New Site',
    notes: 'WCAG 4.1.2 — screen reader tidak tahu status dropdown',
  },
  {
    id: 'TC-N01',
    suite: 'N — [NEW] Accessibility',
    title: 'Elemen interaktif memiliki visible focus indicator',
    url: 'https://prive-dev.modena.com/',
    type: 'Accessibility',
    priority: 'Medium',
    steps: '1. Tekan Tab\n2. Cek focus ring visible di setiap element yang difokus',
    expected: 'Setiap element punya outline/box-shadow visible saat fokus keyboard',
    actual: 'Beberapa element tidak punya visible focus ring — Tailwind reset CSS menghilangkan outline default',
    status: 'FAIL',
    severity: 'Medium',
    target: 'New Site',
    notes: 'WCAG 2.4.7 — keyboard navigation tidak terlihat',
  },

  // ── SUITE O: CONTENT REGRESSION ──────────────────────────────────
  {
    id: 'TC-005',
    suite: 'O — [REGRESSION] Content',
    title: 'Testimonials bukan dummy/placeholder',
    url: 'https://prive-dev.modena.com/',
    type: 'Content',
    priority: 'High',
    steps: '1. Scroll ke section testimonials di homepage\n2. Baca nama dan isi testimoni',
    expected: 'Testimonial dari customer nyata PRIVE (Adeline Siregar, Matthew Halim, Sharon Harper)',
    actual: 'Testimonial menggunakan nama dummy: Sarah Anderson, Michael Chen, Emily Roberts, David Park',
    status: 'FAIL',
    severity: 'High',
    target: 'New Site',
    notes: 'Credibility issue — luxury brand tidak boleh pakai fake testimonials',
  },
  {
    id: 'TC-006',
    suite: 'O — [REGRESSION] Content',
    title: 'Blog articles bukan placeholder content',
    url: 'https://prive-dev.modena.com/news',
    type: 'Content',
    priority: 'High',
    steps: '1. Buka halaman news/blog\n2. Baca judul artikel',
    expected: 'Artikel PRIVE asli tentang brand, produk, dan lifestyle',
    actual: 'Artikel placeholder generic: "How to Choose the Perfect Sofa", "Top 5 Dining Tables for 2026", "Creating a Cozy Bedroom Retreat", "Making Sustainable Furniture Choices"',
    status: 'FAIL',
    severity: 'High',
    target: 'New Site',
    notes: 'Konten dummy dalam produksi merusak brand credibility',
  },
  {
    id: 'TC-O01',
    suite: 'O — [REGRESSION] Content',
    title: 'Product count regression old vs new tidak melebihi 30%',
    url: 'https://prive-dev.modena.com/product-category/living',
    type: 'Regression',
    priority: 'Critical',
    steps: '1. Cek product count new site\n2. Bandingkan dengan old site (278)\n3. Hitung persentase',
    expected: 'Selisih < 30% (max kehilangan 83 produk)',
    actual: '278 produk (old) vs ~178 produk (new) — selisih 100 produk (36% regression)',
    status: 'FAIL',
    severity: 'Critical',
    target: 'New Site',
    notes: 'Migration tidak lengkap — 100 produk hilang',
  },

  // ── SUITE P: RESPONSIVE ──────────────────────────────────────────
  {
    id: 'TC-P01',
    suite: 'P — [NEW] Responsive',
    title: 'Tidak ada horizontal scroll di Desktop Full HD (1920x1080)',
    url: 'https://prive-dev.modena.com/',
    type: 'Responsive',
    priority: 'High',
    steps: '1. Set viewport 1920x1080\n2. Buka homepage\n3. Cek horizontal overflow',
    expected: 'body.scrollWidth <= window.innerWidth',
    actual: 'Tidak ada horizontal overflow',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: '',
  },
  {
    id: 'TC-P02',
    suite: 'P — [NEW] Responsive',
    title: 'Tidak ada horizontal scroll di Tablet Portrait (768x1024)',
    url: 'https://prive-dev.modena.com/',
    type: 'Responsive',
    priority: 'High',
    steps: '1. Set viewport 768x1024\n2. Buka homepage\n3. Cek horizontal overflow',
    expected: 'Tidak ada horizontal scroll',
    actual: 'Tidak ada horizontal overflow',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: '',
  },
  {
    id: 'TC-P03',
    suite: 'P — [NEW] Responsive',
    title: 'Tidak ada horizontal scroll di Mobile iPhone 14 (390x844)',
    url: 'https://prive-dev.modena.com/',
    type: 'Responsive',
    priority: 'High',
    steps: '1. Set viewport 390x844\n2. Buka homepage\n3. Cek horizontal overflow',
    expected: 'Tidak ada horizontal scroll',
    actual: 'Tidak ada horizontal overflow',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: '',
  },
  {
    id: 'TC-P04',
    suite: 'P — [NEW] Responsive',
    title: 'Tidak ada horizontal scroll di Mobile Small (360x640)',
    url: 'https://prive-dev.modena.com/',
    type: 'Responsive',
    priority: 'High',
    steps: '1. Set viewport 360x640\n2. Buka homepage\n3. Cek horizontal overflow',
    expected: 'Tidak ada horizontal scroll',
    actual: 'Perlu diverifikasi langsung',
    status: 'PENDING',
    severity: '-',
    target: 'New Site',
    notes: '',
  },
  {
    id: 'TC-P05',
    suite: 'P — [NEW] Responsive',
    title: 'Product listing di mobile tidak overflow',
    url: 'https://prive-dev.modena.com/product-category/living',
    type: 'Responsive',
    priority: 'Medium',
    steps: '1. Set viewport 390x844\n2. Buka product listing\n3. Cek scroll dan gambar',
    expected: 'Product grid tampil dengan benar, tidak ada horizontal overflow',
    actual: 'Product grid OK, tidak ada overflow',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: '',
  },

  // ── SUITE Q: CABINETRY ───────────────────────────────────────────
  {
    id: 'TC-034',
    suite: 'Q — [NEW] Cabinetry',
    title: 'Kitchen page memiliki hero image dan CTA',
    url: 'https://prive-dev.modena.com/kitchen',
    type: 'Functional',
    priority: 'Medium',
    steps: '1. Buka /kitchen\n2. Cek H1 dan hero image\n3. Cek Consultation CTA',
    expected: 'Hero image terload, H1 ada, tombol Consultation ada',
    actual: 'H1 dan hero ada, Consultation CTA tersedia',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: '',
  },
  {
    id: 'TC-Q01',
    suite: 'Q — [NEW] Cabinetry',
    title: 'Showroom images di kitchen page tidak broken',
    url: 'https://prive-dev.modena.com/kitchen',
    type: 'Functional',
    priority: 'Medium',
    steps: '1. Buka /kitchen\n2. Scroll ke bawah\n3. Cek semua gambar',
    expected: 'Semua showroom images terload',
    actual: 'Showroom images broken karena sama-sama served dari 192.168.x.x',
    status: 'FAIL',
    severity: 'High',
    target: 'New Site',
    notes: 'Same root cause as TC-001',
  },

  // ── SUITE R: FLOATING UI ─────────────────────────────────────────
  {
    id: 'TC-036',
    suite: 'R — [NEW] Floating UI',
    title: 'WhatsApp button persistent di semua halaman',
    url: 'https://prive-dev.modena.com/',
    type: 'Functional',
    priority: 'High',
    steps: '1. Buka Homepage, Category, Product Detail, Contact\n2. Cek WhatsApp button di setiap halaman',
    expected: 'WhatsApp button selalu visible di pojok kanan bawah',
    actual: 'WhatsApp button (.bg-[#c8a35d] dengan aria-label="Open WhatsApp chat") ada di semua halaman yang ditest',
    status: 'PASS',
    severity: '-',
    target: 'New Site',
    notes: 'WhatsApp button implemented dengan benar',
  },
  {
    id: 'TC-R01',
    suite: 'R — [NEW] Floating UI',
    title: 'Scroll-to-top button muncul setelah scroll',
    url: 'https://prive-dev.modena.com/',
    type: 'UX',
    priority: 'Low',
    steps: '1. Buka homepage\n2. Scroll ke bawah 600px\n3. Cek visibility scroll-to-top button',
    expected: 'Scroll-to-top button muncul setelah user scroll ke bawah',
    actual: 'Button ada di DOM (opacity-0 translate-y-4 pointer-events-none) tapi tidak muncul setelah scroll',
    status: 'FAIL',
    severity: 'Low',
    target: 'New Site',
    notes: 'JavaScript trigger untuk show/hide scroll-to-top button tidak berfungsi',
  },
];

// ─────────────────────────────────────────────────────────────────
// HITUNG SUMMARY
// ─────────────────────────────────────────────────────────────────

const summary = {
  total: testCases.length,
  pass: testCases.filter(tc => tc.status === 'PASS').length,
  fail: testCases.filter(tc => tc.status === 'FAIL').length,
  pending: testCases.filter(tc => tc.status === 'PENDING').length,
  critical: testCases.filter(tc => tc.severity === 'Critical').length,
  high: testCases.filter(tc => tc.severity === 'High').length,
  medium: testCases.filter(tc => tc.severity === 'Medium').length,
  low: testCases.filter(tc => tc.severity === 'Low').length,
};

// ─────────────────────────────────────────────────────────────────
// BUILD WORKBOOK
// ─────────────────────────────────────────────────────────────────

const wb = XLSX.utils.book_new();

// ── Helper: set column widths ────────────────────────────────────
function setColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// ── Helper: set row heights ──────────────────────────────────────
function setRowHeights(ws, count, height = 60) {
  ws['!rows'] = Array.from({ length: count }, () => ({ hpt: height }));
}

// ─────────────────────────────────────────────────────────────────
// SHEET 1: COVER
// ─────────────────────────────────────────────────────────────────

const coverData = [
  [''],
  ['  QA AUDIT REPORT — PRIVE LIVING WEBSITE'],
  [''],
  ['  Prepared by', '  QA Team'],
  ['  Date', '  May 29, 2026'],
  ['  Old Site', '  https://prive-living.com'],
  ['  New Dev Site', '  https://prive-dev.modena.com'],
  ['  Tools', '  Playwright @playwright/test + Manual Testing'],
  [''],
  ['  SUMMARY'],
  ['  Total Test Cases', summary.total],
  ['  PASS', summary.pass],
  ['  FAIL', summary.fail],
  ['  PENDING', summary.pending],
  ['  Pass Rate', `${Math.round((summary.pass / summary.total) * 100)}%`],
  [''],
  ['  ISSUES BY SEVERITY'],
  ['  Critical', summary.critical, '  → Must fix before go-live'],
  ['  High', summary.high, '  → Fix within 1 sprint'],
  ['  Medium', summary.medium, '  → Fix within 2 sprints'],
  ['  Low', summary.low, '  → Nice to have'],
  [''],
  ['  PRODUCTION BLOCKERS (Must Fix Before Launch)'],
  ['  1.', '  TC-001/002: Images from internal IP (192.168.3.86:8070) — ALL images broken'],
  ['  2.', '  TC-003: Scroll triggers navigation — hero carousel bug'],
  ['  3.', '  TC-022: Newsletter popup blocks ALL page interactions'],
  ['  4.', '  TC-021: Search returns zero product results'],
  ['  5.', '  TC-024: Wrong canonical URL (priveliving.com instead of prive-living.com)'],
  ['  6.', '  TC-007: 100 products missing from catalog (36% regression)'],
  ['  7.', '  TC-005: Fake testimonials (Sarah Anderson, Michael Chen, etc.)'],
  ['  8.', '  TC-023: 404 page strands users with no navigation'],
];

const wsCover = XLSX.utils.aoa_to_sheet(coverData);
setColWidths(wsCover, [30, 60, 40]);
XLSX.utils.book_append_sheet(wb, wsCover, 'Cover');

// ─────────────────────────────────────────────────────────────────
// SHEET 2: ALL TEST CASES
// ─────────────────────────────────────────────────────────────────

const headers = [
  'No',
  'TC ID',
  'Suite',
  'Test Title',
  'URL',
  'Test Type',
  'Priority',
  'Steps',
  'Expected Result',
  'Actual Result',
  'Status',
  'Severity',
  'Target',
  'Notes',
];

const allRows = [headers, ...testCases.map((tc, i) => [
  i + 1,
  tc.id,
  tc.suite,
  tc.title,
  tc.url,
  tc.type,
  tc.priority,
  tc.steps,
  tc.expected,
  tc.actual,
  tc.status,
  tc.severity,
  tc.target,
  tc.notes,
])];

const wsAll = XLSX.utils.aoa_to_sheet(allRows);
setColWidths(wsAll, [4, 12, 28, 42, 38, 14, 10, 50, 50, 60, 10, 10, 12, 40]);
setRowHeights(wsAll, allRows.length, 80);
wsAll['!rows'][0] = { hpt: 22 }; // header row height
XLSX.utils.book_append_sheet(wb, wsAll, 'All Test Cases');

// ─────────────────────────────────────────────────────────────────
// SHEET 3: FAILED ONLY
// ─────────────────────────────────────────────────────────────────

const failedTCs = testCases.filter(tc => tc.status === 'FAIL');
const failedRows = [headers, ...failedTCs.map((tc, i) => [
  i + 1,
  tc.id,
  tc.suite,
  tc.title,
  tc.url,
  tc.type,
  tc.priority,
  tc.steps,
  tc.expected,
  tc.actual,
  tc.status,
  tc.severity,
  tc.target,
  tc.notes,
])];

const wsFail = XLSX.utils.aoa_to_sheet(failedRows);
setColWidths(wsFail, [4, 12, 28, 42, 38, 14, 10, 50, 50, 60, 10, 10, 12, 40]);
setRowHeights(wsFail, failedRows.length, 80);
wsFail['!rows'][0] = { hpt: 22 };
XLSX.utils.book_append_sheet(wb, wsFail, 'FAIL Cases');

// ─────────────────────────────────────────────────────────────────
// SHEET 4: CRITICAL & HIGH ONLY
// ─────────────────────────────────────────────────────────────────

const criticalHighTCs = testCases.filter(tc => tc.severity === 'Critical' || tc.severity === 'High');
const critHighRows = [headers, ...criticalHighTCs.map((tc, i) => [
  i + 1,
  tc.id,
  tc.suite,
  tc.title,
  tc.url,
  tc.type,
  tc.priority,
  tc.steps,
  tc.expected,
  tc.actual,
  tc.status,
  tc.severity,
  tc.target,
  tc.notes,
])];

const wsCritHigh = XLSX.utils.aoa_to_sheet(critHighRows);
setColWidths(wsCritHigh, [4, 12, 28, 42, 38, 14, 10, 50, 50, 60, 10, 10, 12, 40]);
setRowHeights(wsCritHigh, critHighRows.length, 80);
wsCritHigh['!rows'][0] = { hpt: 22 };
XLSX.utils.book_append_sheet(wb, wsCritHigh, 'Critical & High');

// ─────────────────────────────────────────────────────────────────
// SHEET 5: SUMMARY BY SUITE
// ─────────────────────────────────────────────────────────────────

const suiteGroups = {};
for (const tc of testCases) {
  const s = tc.suite;
  if (!suiteGroups[s]) suiteGroups[s] = { total: 0, pass: 0, fail: 0, pending: 0 };
  suiteGroups[s].total++;
  if (tc.status === 'PASS') suiteGroups[s].pass++;
  else if (tc.status === 'FAIL') suiteGroups[s].fail++;
  else suiteGroups[s].pending++;
}

const suiteRows = [
  ['Suite', 'Total', 'PASS', 'FAIL', 'PENDING', 'Pass Rate'],
  ...Object.entries(suiteGroups).map(([suite, stat]) => [
    suite,
    stat.total,
    stat.pass,
    stat.fail,
    stat.pending,
    `${Math.round((stat.pass / stat.total) * 100)}%`,
  ]),
  [],
  ['TOTAL', summary.total, summary.pass, summary.fail, summary.pending,
    `${Math.round((summary.pass / summary.total) * 100)}%`],
];

const wsSummary = XLSX.utils.aoa_to_sheet(suiteRows);
setColWidths(wsSummary, [38, 8, 8, 8, 10, 12]);
XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary by Suite');

// ─────────────────────────────────────────────────────────────────
// SHEET 6: SCORING CARD
// ─────────────────────────────────────────────────────────────────

const scoringData = [
  ['WEBSITE QUALITY SCORING CARD', '', '', ''],
  ['', '', '', ''],
  ['Dimension', 'Old Site Score', 'New Site (Current)', 'New Site (Post-Fix Est.)'],
  ['UI / Visual Design', '68/100', '38/100', '~82/100'],
  ['UX / Usability', '55/100', '40/100', '~75/100'],
  ['Mobile UX', '45/100', '55/100', '~78/100'],
  ['Performance', '52/100', '88/100', '~90/100'],
  ['Accessibility (WCAG)', '48/100', '72/100', '~82/100'],
  ['Conversion Optimization', '42/100', '22/100', '~68/100'],
  ['SEO', '50/100', '30/100', '~78/100'],
  ['Luxury Brand Feel', '74/100', '25/100', '~80/100'],
  ['Content Quality', '65/100', '30/100', '~75/100'],
  ['Functional Stability', '60/100', '35/100', '~85/100'],
  ['', '', '', ''],
  ['OVERALL AVERAGE', '55.9/100', '43.5/100', '~79.3/100'],
  ['', '', '', ''],
  ['Notes', '', '', ''],
  ['Old Site strengths', 'More complete product catalog (278 vs 178), real testimonials, working search', '', ''],
  ['New Site strengths', 'Better performance (Next.js), better mobile responsive, better accessibility structure', '', ''],
  ['New Site critical gaps', 'ALL images broken (internal IP), wrong canonical URL, popup blocks interactions, search broken', '', ''],
];

const wsScoring = XLSX.utils.aoa_to_sheet(scoringData);
setColWidths(wsScoring, [30, 20, 22, 24]);
XLSX.utils.book_append_sheet(wb, wsScoring, 'Scoring Card');

// ─────────────────────────────────────────────────────────────────
// WRITE FILE
// ─────────────────────────────────────────────────────────────────

const outputPath = path.join(__dirname, 'PRIVE_QA_Test_Report.xlsx');
XLSX.writeFile(wb, outputPath);
console.log(`✅ Excel report berhasil dibuat: ${outputPath}`);
console.log(`   Total: ${summary.total} test cases | PASS: ${summary.pass} | FAIL: ${summary.fail} | PENDING: ${summary.pending}`);
console.log(`   Critical issues: ${summary.critical} | High: ${summary.high} | Medium: ${summary.medium} | Low: ${summary.low}`);
