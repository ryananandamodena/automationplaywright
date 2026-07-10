/**
 * test-data.js - Data fixture untuk automation tests
 * Berisi data test: valid, invalid, boundary, dan special characters
 * 
 * UPDATE: URL pattern menggunakan prefix /mhc/
 */

export const BASE_URL = 'https://more-dev.modena.com';
export const MHC_PREFIX = '/mhc';

// ─── Kredensial ───────────────────────────────────────────
export const VALID_CREDENTIALS = {
  email: 'muhzaenal5@gmail.com',
  password: 'P@ssw0rd_muhzaenal5',
};

export const INVALID_CREDENTIALS = [
  { email: 'wrong@test.com', password: 'WrongPass!', desc: 'email tidak terdaftar' },
  { email: 'muhzaenal5@gmail.com', password: 'wrongpassword', desc: 'password salah' },
  { email: '', password: 'P@ssw0rd_muhzaenal5', desc: 'email kosong' },
  { email: 'muhzaenal5@gmail.com', password: '', desc: 'password kosong' },
  { email: 'notanemail', password: 'P@ssw0rd_muhzaenal5', desc: 'format email tidak valid' },
  { email: 'a@b', password: 'P@ssw0rd_muhzaenal5', desc: 'email terlalu pendek' },
];

// ─── Search Keywords ───────────────────────────────────────
export const SEARCH = {
  validSO: 'SO',
  validPO: 'PO',
  validUser: 'admin',
  validCustomer: 'PT',
  validProduct: 'AC',
  validWarehouse: 'MHC',
  noResult: 'XXXXXXXXXNOTFOUND99999ZZZ',
  specialChars: '"; DROP TABLE--',
  sqlInjection: "' OR '1'='1",
  xss: '<script>alert(1)</script>',
  unicode: '日本語',
  spaces: '   ',
  longString: 'a'.repeat(200),
};

// ─── Menu URLs (semua halaman yang perlu ditest) ───────────
export const MENUS = [
  { name: 'Dashboard',                url: MHC_PREFIX + '/',                             urlPart: '/mhc' },
  { name: 'Sales Order',              url: MHC_PREFIX + '/sales-order',                  urlPart: '/mhc/sales-order' },
  { name: 'Sales Order Create',       url: MHC_PREFIX + '/sales-order/create',           urlPart: '/mhc/sales-order/create' },
  { name: 'Purchase Order',           url: MHC_PREFIX + '/purchase-order',               urlPart: '/mhc/purchase-order' },
  { name: 'Delivery',                 url: MHC_PREFIX + '/delivery',                     urlPart: '/mhc/delivery' },
  { name: 'Inventory Transfer',       url: MHC_PREFIX + '/inventory-transfer',           urlPart: '/mhc/inventory-transfer' },
  { name: 'Operational Cost',         url: MHC_PREFIX + '/operational-cost',             urlPart: '/mhc/operational-cost' },
  { name: 'Balance Inquiry',          url: MHC_PREFIX + '/balance-inquiry',              urlPart: '/mhc/balance-inquiry' },
  { name: 'Withdrawal',               url: MHC_PREFIX + '/withdrawal',                   urlPart: '/mhc/withdrawal' },
  { name: 'Sales Order Approval',     url: MHC_PREFIX + '/sales-order-approval',         urlPart: '/mhc/sales-order-approval' },
  { name: 'Stock Ready',              url: MHC_PREFIX + '/stock-ready',                  urlPart: '/mhc/stock-ready' },
  { name: 'PO Verification',          url: MHC_PREFIX + '/purchase-stock-verification',  urlPart: '/mhc/purchase-stock-verification' },
  { name: 'Profile',                  url: MHC_PREFIX + '/profile',                      urlPart: '/mhc/profile' },
  { name: 'User Management',          url: MHC_PREFIX + '/users',                        urlPart: '/mhc/users' },
  { name: 'Role Management',          url: MHC_PREFIX + '/roles',                        urlPart: '/mhc/roles' },
  { name: 'Sync SAP',                 url: MHC_PREFIX + '/sync-sap',                     urlPart: '/mhc/sync-sap' },
  { name: 'General Setting',          url: MHC_PREFIX + '/general-setting',              urlPart: '/mhc/general-setting' },
];

// ─── Staging Data Menus ────────────────────────────────────
export const STAGING_MENUS = [
  { name: 'PPN',         url: MHC_PREFIX + '/ppn',         urlPart: '/mhc/ppn' },
  { name: 'PPH',         url: MHC_PREFIX + '/pph',         urlPart: '/mhc/pph' },
  { name: 'BP',          url: MHC_PREFIX + '/bp',          urlPart: '/mhc/bp' },
  { name: 'BP Branch',   url: MHC_PREFIX + '/bp-branch',   urlPart: '/mhc/bp-branch' },
  { name: 'BP Group',    url: MHC_PREFIX + '/bp-group',    urlPart: '/mhc/bp-group' },
  { name: 'BP Address',  url: MHC_PREFIX + '/bp-address',  urlPart: '/mhc/bp-address' },
  { name: 'Bank',        url: MHC_PREFIX + '/bank',        urlPart: '/mhc/bank' },
  { name: 'Legal',       url: MHC_PREFIX + '/legal',       urlPart: '/mhc/legal' },
  { name: 'Warehouse',   url: MHC_PREFIX + '/warehouse',   urlPart: '/mhc/warehouse' },
  { name: 'Order Type',  url: MHC_PREFIX + '/order-type',  urlPart: '/mhc/order-type' },
  { name: 'GL Account',  url: MHC_PREFIX + '/gl-account',  urlPart: '/mhc/gl-account' },
  { name: 'Series',      url: MHC_PREFIX + '/series',      urlPart: '/mhc/series' },
];

// ─── Semua menus (main + staging) ──────────────────────────
export const ALL_MENUS = [...MENUS, ...STAGING_MENUS];

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
    password: 'P@ssw0rd_muhzaenal5',
  },
  emptyRequired: {
    name: '',
    email: '',
    password: '',
  },
  longName: {
    name: 'A'.repeat(300),
    email: 'test@test.com',
    password: 'P@ssw0rd_muhzaenal5',
  },
};

// ─── SO Create Wizard Data ────────────────────────────────
export const SO_FORM = {
  customer: 'PT',        // Keyword untuk cari customer
  product: 'AC',         // Keyword untuk cari product
  warehouse: 'MHC',      // Keyword untuk cari warehouse
  quantity: 2,
  price: 5000000,
  notes: `AutoSO-${Date.now().toString().slice(-6)}`,
};

// ─── Filter Options ────────────────────────────────────────
export const SO_STATUS_FILTERS = ['Draft', 'Pending', 'Approved', 'Rejected', 'Completed'];
export const PO_STATUS_FILTERS = ['Draft', 'Open', 'Received', 'Cancelled'];

// ─── Expected UI Elements ──────────────────────────────────
export const EXPECTED_MENUS_IN_SIDEBAR = [
  'Sales Order', 'Purchase Order', 'Delivery',
];

// ─── Sidebar structure from actual exploration ─────────────
export const SIDEBAR_STRUCTURE = {
  mainMenu: [
    'Dashboard', 'Sales Order', 'Purchase Order', 'Delivery',
    'Inventory Transfer', 'Operational Cost', 'Balance Inquiry',
    'Withdrawal', 'Sales Order Approval', 'Stock Ready', 'PO Verification'
  ],
  generalMenu: [
    'Profile', 'User', 'Role', 'Sync SAP', 'General Setting'
  ],
  stagingData: [
    'PPN', 'PPH', 'BP', 'BP Branch', 'BP Group', 'BP Address',
    'Bank', 'Legal', 'Warehouse', 'Order Type', 'GL Account', 'Series'
  ]
};