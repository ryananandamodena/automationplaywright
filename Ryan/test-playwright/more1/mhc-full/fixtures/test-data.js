/**
 * test-data.js - Data fixture untuk automation tests
 * Berisi data test: valid, invalid, boundary, dan special characters
 */

export const BASE_URL = 'https://mhc-dev.modena.com';

// ─── Kredensial ───────────────────────────────────────────
export const VALID_CREDENTIALS = {
  email: 'muhzaenal5@gmail.com',
  password: 'P@ssw0rd',
};

export const INVALID_CREDENTIALS = [
  { email: 'wrong@test.com', password: 'WrongPass!', desc: 'email tidak terdaftar' },
  { email: 'muhzaenal5@gmail.com', password: 'wrongpassword', desc: 'password salah' },
  { email: '', password: 'P@ssw0rd', desc: 'email kosong' },
  { email: 'muhzaenal5@gmail.com', password: '', desc: 'password kosong' },
  { email: 'notanemail', password: 'P@ssw0rd', desc: 'format email tidak valid' },
  { email: 'a@b', password: 'P@ssw0rd', desc: 'email terlalu pendek' },
];

// ─── Search Keywords ───────────────────────────────────────
export const SEARCH = {
  // Kata kunci yang kemungkinan ada di SO/PO
  validSO: 'SO',
  validPO: 'PO',
  validUser: 'admin',
  // Kata kunci yang tidak akan ditemukan
  noResult: 'XXXXXXXXXNOTFOUND99999ZZZ',
  // Special characters - harus tidak crash
  specialChars: '"; DROP TABLE--',
  sqlInjection: "' OR '1'='1",
  xss: '<script>alert(1)</script>',
  unicode: '日本語',
  spaces: '   ',
  longString: 'a'.repeat(200),
};

// ─── Menu URLs (semua halaman yang perlu ditest) ───────────
export const MENUS = [
  { name: 'Dashboard',           url: '/',                             urlPart: 'mhc-dev.modena.com' },
  { name: 'Sales Order',         url: '/sales-order',                  urlPart: '/sales-order' },
  { name: 'Purchase Order',      url: '/purchase-order',               urlPart: '/purchase-order' },
  { name: 'Delivery',            url: '/delivery',                     urlPart: '/delivery' },
  { name: 'Inventory Transfer',  url: '/inventory-transfer',           urlPart: '/inventory-transfer' },
  { name: 'Operational Cost',    url: '/operational-cost',             urlPart: '/operational-cost' },
  { name: 'Balance Inquiry',     url: '/balance-inquiry',              urlPart: '/balance-inquiry' },
  { name: 'Withdrawal',          url: '/withdrawal',                   urlPart: '/withdrawal' },
  { name: 'Stock Ready',         url: '/stock-ready',                  urlPart: '/stock-ready' },
  { name: 'PO Verification',     url: '/purchase-stock-verification',  urlPart: '/purchase-stock-verification' },
  { name: 'Profile',             url: '/profile',                      urlPart: '/profile' },
  { name: 'User Management',     url: '/users',                        urlPart: '/users' },
  { name: 'Role Management',     url: '/roles',                        urlPart: '/roles' },
  { name: 'Sync SAP',            url: '/sync-sap',                     urlPart: '/sync-sap' },
];

// ─── Staging Data Menus ────────────────────────────────────
export const STAGING_MENUS = [
  'ppn', 'pph', 'bp', 'bp-branch', 'bp-group', 'bp-address',
  'bank', 'legal', 'warehouse', 'order-type', 'gl-account', 'series',
];

// ─── Form Data ────────────────────────────────────────────
export const USER_FORM = {
  valid: {
    name: 'Test Automation User',
    email: `test.auto.${Date.now()}@modena-test.com`,
    password: 'TestP@ss123',
  },
  invalidEmail: {
    name: 'Test User',
    email: 'not-an-email',
    password: 'P@ssw0rd',
  },
  emptyRequired: {
    name: '',
    email: '',
    password: '',
  },
  longName: {
    name: 'A'.repeat(300),
    email: 'test@test.com',
    password: 'P@ssw0rd',
  },
};

// ─── Filter Options ────────────────────────────────────────
export const SO_STATUS_FILTERS = ['Draft', 'Pending', 'Approved', 'Rejected', 'Completed'];
export const PO_STATUS_FILTERS = ['Draft', 'Open', 'Received', 'Cancelled'];

// ─── Expected UI Elements ──────────────────────────────────
export const EXPECTED_MENUS_IN_SIDEBAR = [
  'Sales Order', 'Purchase Order', 'Delivery',
];
