import { test, expect } from '@playwright/test';

const REGISTRATION_URL = 'https://msp-dev.modena.com/client-registration';

// Unique suffix per test run to avoid "sudah terdaftar" error
const RUN_TS = Date.now().toString().slice(-6);

// ============================================================
// DATASET – 10 Data Service Partner (Lengkap sesuai form actual)
// Fields ditemukan via MCP Playwright inspection:
//   Step1: company_name, no_ktp, nama_ktp, npwp_number, nib_number, skdu_number,
//          kbli_number, svc_network, alamat_ktp, provinsi, kota, zipcode, address
//          toggles: tipe_partner, service_channel, tipe_pajak, city_type, street_type, svc_nearby
//   Step3: contact_person, email, mobilephone, phonenumber, website, competency,
//          ref_code, dealer_terdekat, bank_account, bank_account_number
//          selects: layanan(rs4), brand(rs5), produk(rs6), bank(rs7)
//   Step4: jumlah_lead, jumlah_teknisi, jumlah_administrasi, jumlah_driver,
//          jumlah_pc_komputer, financial_monthly, jumlah_motor, jumlah_mobil,
//          klaim_cooling, klaim_cooking, klaim_cleaning, klaim_sha,
//          area_barat, area_timur, area_utara, area_selatan, luas_carry_in, luas_workshop
//          selects: peralatan(rs8)
//   Step5: foto bengkel + keterangan (textarea)
//   Step6: pengalaman toggle, notes
// ============================================================
const registrationData = [
  {
    id: 1,
    // ── Step 1: Identitas ──────────────────────────────────
    tipe_partner: 'Individual',
    service_channel: 'ASC',
    tipe_pajak: 'Non PKP',
    city_type: 'Small City',
    street_type: 'Secondary Street',
    svc_nearby: 'Tidak Ada',
    company_name: '',
    no_ktp: '3171234567890101',
    nama_ktp: 'Andi Saputra',
    npwp_number: '123456789012345',
    nib_number: '1234567890101',
    skdu_number: 'SKDU-001',
    kbli_number: '47599',
    svc_network: '10',
    alamat_ktp: 'Jl. Sudirman No. 10, Jakarta Pusat',
    provinsi: 'DKI JAKARTA',
    kota: 'KOTA JAKARTA PUSAT',
    zipcode: '10220',
    address: 'Jl. Sudirman No. 10',
    // ── Step 3: Kontak & Layanan ───────────────────────────
    contact_person: 'Andi Saputra',
    email: `ryan.ananda+${RUN_TS}01@modena.com`,
    mobilephone: `0813${RUN_TS}01`,
    phonenumber: `02112345601`,
    website: 'https://andiservice.com',
    layanan: 'In Home Service',
    brand: 'Midea',
    produk: 'RAC',
    competency: 'AC Service',
    ref_code: '',
    dealer_terdekat: 'no_sub_dealer',
    bank_name: 'BCA',
    bank_account: 'Andi Saputra',
    bank_account_number: '1234567801',
    // ── Step 4: Operasional ────────────────────────────────
    jumlah_teknisi: '5',
    jumlah_lead: '2',
    jumlah_administrasi: '1',
    jumlah_driver: '1',
    jumlah_pc_komputer: '2',
    financial_monthly: '10000000',
    jumlah_motor: '3',
    jumlah_mobil: '1',
    klaim_cooling: '10',
    klaim_cooking: '0',
    klaim_cleaning: '0',
    klaim_sha: '0',
    area_barat: 'Jakarta Barat',
    area_timur: 'Jakarta Timur',
    area_utara: 'Jakarta Utara',
    area_selatan: 'Jakarta Selatan',
    luas_carry_in: '50',
    luas_workshop: '100',
    // ── Step 5: Pengalaman ─────────────────────────────────
    pengalaman: 'Ada & Masih Aktif',
    // ── Step 6: Catatan ────────────────────────────────────
    notes: 'Service partner wilayah Jakarta Pusat',
  },
  {
    id: 2,
    tipe_partner: 'Individual',
    service_channel: 'Service Local',
    tipe_pajak: 'Non PKP',
    city_type: 'Medium City',
    street_type: 'Secondary Street',
    svc_nearby: 'Tidak Ada',
    company_name: '',
    no_ktp: '3273456789010102',
    nama_ktp: 'Budi Santoso',
    npwp_number: '234567890123456',
    nib_number: '1234567890102',
    skdu_number: 'SKDU-002',
    kbli_number: '47599',
    svc_network: '15',
    alamat_ktp: 'Jl. Melati No. 22, Bandung',
    provinsi: 'JAWA BARAT',
    kota: 'KOTA BANDUNG',
    zipcode: '40123',
    address: 'Jl. Melati No. 22',
    contact_person: 'Budi Santoso',
    email: `ryan.ananda+${RUN_TS}02@modena.com`,
    mobilephone: `0813${RUN_TS}02`,
    phonenumber: `02212345602`,
    website: '',
    layanan: 'Carry-in',
    brand: 'Samsung',
    produk: 'Cooling',
    competency: 'Elektronik Pendingin',
    ref_code: '',
    dealer_terdekat: 'dealer_available',
    bank_name: 'BCA',
    bank_account: 'Budi Santoso',
    bank_account_number: '2345678902',
    jumlah_teknisi: '3',
    jumlah_lead: '1',
    jumlah_administrasi: '1',
    jumlah_driver: '0',
    jumlah_pc_komputer: '1',
    financial_monthly: '8000000',
    jumlah_motor: '2',
    jumlah_mobil: '0',
    klaim_cooling: '8',
    klaim_cooking: '0',
    klaim_cleaning: '0',
    klaim_sha: '0',
    area_barat: 'Bandung Barat',
    area_timur: 'Bandung Timur',
    area_utara: 'Bandung Utara',
    area_selatan: 'Bandung Selatan',
    luas_carry_in: '40',
    luas_workshop: '80',
    pengalaman: 'Ada, Tidak Aktif',
    notes: 'Service partner wilayah Bandung',
  },
  {
    id: 3,
    tipe_partner: 'Individual',
    service_channel: 'ASC',
    tipe_pajak: 'Non PKP',
    city_type: 'Big City',
    street_type: 'Primary Street',
    svc_nearby: 'Ada',
    company_name: '',
    no_ktp: '3578901234560103',
    nama_ktp: 'Citra Lestari',
    npwp_number: '345678901234567',
    nib_number: '1234567890103',
    skdu_number: 'SKDU-003',
    kbli_number: '47599',
    svc_network: '5',
    alamat_ktp: 'Jl. Kenanga No. 5, Surabaya',
    provinsi: 'JAWA TIMUR',
    kota: 'KOTA SURABAYA',
    zipcode: '60231',
    address: 'Jl. Kenanga No. 5',
    contact_person: 'Citra Lestari',
    email: `ryan.ananda+${RUN_TS}03@modena.com`,
    mobilephone: `0813${RUN_TS}03`,
    phonenumber: `03112345603`,
    website: '',
    layanan: 'In Home Service',
    brand: 'Panasonic',
    produk: 'Cooking',
    competency: 'Gas Appliance',
    ref_code: '',
    dealer_terdekat: 'sub_dealer_available',
    bank_name: 'BCA',
    bank_account: 'Citra Lestari',
    bank_account_number: '3456789003',
    jumlah_teknisi: '4',
    jumlah_lead: '1',
    jumlah_administrasi: '1',
    jumlah_driver: '1',
    jumlah_pc_komputer: '2',
    financial_monthly: '12000000',
    jumlah_motor: '3',
    jumlah_mobil: '1',
    klaim_cooling: '0',
    klaim_cooking: '12',
    klaim_cleaning: '0',
    klaim_sha: '0',
    area_barat: 'Surabaya Barat',
    area_timur: 'Surabaya Timur',
    area_utara: 'Surabaya Utara',
    area_selatan: 'Surabaya Selatan',
    luas_carry_in: '60',
    luas_workshop: '120',
    pengalaman: 'Ada & Masih Aktif',
    notes: 'Service partner wilayah Surabaya',
  },
  {
    id: 4,
    tipe_partner: 'Individual',
    service_channel: 'Service Local',
    tipe_pajak: 'Non PKP',
    city_type: 'Medium City',
    street_type: 'Secondary Street',
    svc_nearby: 'Tidak Ada',
    company_name: '',
    no_ktp: '3374567890120104',
    nama_ktp: 'Dedi Kurniawan',
    npwp_number: '456789012345678',
    nib_number: '1234567890104',
    skdu_number: 'SKDU-004',
    kbli_number: '47599',
    svc_network: '20',
    alamat_ktp: 'Jl. Mawar No. 15, Semarang',
    provinsi: 'JAWA TENGAH',
    kota: 'KOTA SEMARANG',
    zipcode: '50145',
    address: 'Jl. Mawar No. 15',
    contact_person: 'Dedi Kurniawan',
    email: `ryan.ananda+${RUN_TS}04@modena.com`,
    mobilephone: `0813${RUN_TS}04`,
    phonenumber: `02412345604`,
    website: '',
    layanan: 'Carry-in',
    brand: 'LG',
    produk: 'Small Appliance',
    competency: 'Home Appliance',
    ref_code: '',
    dealer_terdekat: 'no_sub_dealer',
    bank_name: 'BCA',
    bank_account: 'Dedi Kurniawan',
    bank_account_number: '4567890104',
    jumlah_teknisi: '6',
    jumlah_lead: '2',
    jumlah_administrasi: '1',
    jumlah_driver: '1',
    jumlah_pc_komputer: '2',
    financial_monthly: '9000000',
    jumlah_motor: '4',
    jumlah_mobil: '1',
    klaim_cooling: '0',
    klaim_cooking: '0',
    klaim_cleaning: '6',
    klaim_sha: '0',
    area_barat: 'Semarang Barat',
    area_timur: 'Semarang Timur',
    area_utara: 'Semarang Utara',
    area_selatan: 'Semarang Selatan',
    luas_carry_in: '45',
    luas_workshop: '90',
    pengalaman: 'Ada & Masih Aktif',
    notes: 'Service partner wilayah Semarang',
  },
  {
    id: 5,
    tipe_partner: 'Individual',
    service_channel: 'ASC',
    tipe_pajak: 'Non PKP',
    city_type: 'Small City',
    street_type: 'Secondary Street',
    svc_nearby: 'Tidak Ada',
    company_name: '',
    no_ktp: '3471901234560105',
    nama_ktp: 'Eka Putri',
    npwp_number: '567890123456789',
    nib_number: '1234567890105',
    skdu_number: 'SKDU-005',
    kbli_number: '47599',
    svc_network: '12',
    alamat_ktp: 'Jl. Anggrek No. 8, Yogyakarta',
    provinsi: 'DAERAH ISTIMEWA YOGYAKARTA',
    kota: 'KOTA YOGYAKARTA',
    zipcode: '55281',
    address: 'Jl. Anggrek No. 8',
    contact_person: 'Eka Putri',
    email: `ryan.ananda+${RUN_TS}05@modena.com`,
    mobilephone: `0813${RUN_TS}05`,
    phonenumber: `02712345605`,
    website: '',
    layanan: 'In Home Service',
    brand: 'Sharp',
    produk: 'Cleaning',
    competency: 'Cleaning Appliance',
    ref_code: '',
    dealer_terdekat: 'dealer_available',
    bank_name: 'BCA',
    bank_account: 'Eka Putri',
    bank_account_number: '5678901205',
    jumlah_teknisi: '3',
    jumlah_lead: '1',
    jumlah_administrasi: '1',
    jumlah_driver: '0',
    jumlah_pc_komputer: '1',
    financial_monthly: '6000000',
    jumlah_motor: '2',
    jumlah_mobil: '0',
    klaim_cooling: '0',
    klaim_cooking: '0',
    klaim_cleaning: '3',
    klaim_sha: '0',
    area_barat: 'Bantul',
    area_timur: 'Gunungkidul',
    area_utara: 'Sleman',
    area_selatan: 'Yogyakarta Kota',
    luas_carry_in: '30',
    luas_workshop: '60',
    pengalaman: 'Ada, Tidak Aktif',
    notes: 'Service partner wilayah Yogyakarta',
  },
  {
    id: 6,
    tipe_partner: 'Individual',
    service_channel: 'ASC',
    tipe_pajak: 'Non PKP',
    city_type: 'Big City',
    street_type: 'Primary Street',
    svc_nearby: 'Tidak Ada',
    company_name: '',
    no_ktp: '1271234567890106',
    nama_ktp: 'Fajar Nugroho',
    npwp_number: '678901234567890',
    nib_number: '1234567890106',
    skdu_number: 'SKDU-006',
    kbli_number: '47599',
    svc_network: '18',
    alamat_ktp: 'Jl. Dahlia No. 12, Medan',
    provinsi: 'SUMATERA UTARA',
    kota: 'KOTA MEDAN',
    zipcode: '20112',
    address: 'Jl. Dahlia No. 12',
    contact_person: 'Fajar Nugroho',
    email: `ryan.ananda+${RUN_TS}06@modena.com`,
    mobilephone: `0813${RUN_TS}06`,
    phonenumber: `06112345606`,
    website: '',
    layanan: 'In Home Service',
    brand: 'Midea',
    produk: 'Cooling',
    competency: 'AC & Cooling',
    ref_code: '',
    dealer_terdekat: 'no_sub_dealer',
    bank_name: 'BCA',
    bank_account: 'Fajar Nugroho',
    bank_account_number: '6789012306',
    jumlah_teknisi: '4',
    jumlah_lead: '2',
    jumlah_administrasi: '1',
    jumlah_driver: '1',
    jumlah_pc_komputer: '2',
    financial_monthly: '11000000',
    jumlah_motor: '3',
    jumlah_mobil: '1',
    klaim_cooling: '11',
    klaim_cooking: '0',
    klaim_cleaning: '0',
    klaim_sha: '0',
    area_barat: 'Medan Barat',
    area_timur: 'Medan Timur',
    area_utara: 'Medan Utara',
    area_selatan: 'Medan Selatan',
    luas_carry_in: '55',
    luas_workshop: '110',
    pengalaman: 'Ada & Masih Aktif',
    notes: 'Service partner wilayah Medan',
  },
  {
    id: 7,
    tipe_partner: 'Individual',
    service_channel: 'Service Local',
    tipe_pajak: 'Non PKP',
    city_type: 'Medium City',
    street_type: 'Secondary Street',
    svc_nearby: 'Ada',
    company_name: '',
    no_ktp: '5171234567890107',
    nama_ktp: 'Gina Maharani',
    npwp_number: '789012345678901',
    nib_number: '1234567890107',
    skdu_number: 'SKDU-007',
    kbli_number: '47599',
    svc_network: '8',
    alamat_ktp: 'Jl. Flamboyan No. 9, Denpasar',
    provinsi: 'BALI',
    kota: 'KOTA DENPASAR',
    zipcode: '80234',
    address: 'Jl. Flamboyan No. 9',
    contact_person: 'Gina Maharani',
    email: `ryan.ananda+${RUN_TS}07@modena.com`,
    mobilephone: `0813${RUN_TS}07`,
    phonenumber: `036112345607`,
    website: '',
    layanan: 'Carry-in',
    brand: 'Samsung',
    produk: 'RAC',
    competency: 'AC Carry-in',
    ref_code: '',
    dealer_terdekat: 'dealer_available',
    bank_name: 'BCA',
    bank_account: 'Gina Maharani',
    bank_account_number: '7890123407',
    jumlah_teknisi: '3',
    jumlah_lead: '1',
    jumlah_administrasi: '1',
    jumlah_driver: '0',
    jumlah_pc_komputer: '1',
    financial_monthly: '7000000',
    jumlah_motor: '2',
    jumlah_mobil: '0',
    klaim_cooling: '7',
    klaim_cooking: '0',
    klaim_cleaning: '0',
    klaim_sha: '0',
    area_barat: 'Jembrana',
    area_timur: 'Karangasem',
    area_utara: 'Buleleng',
    area_selatan: 'Badung',
    luas_carry_in: '35',
    luas_workshop: '70',
    pengalaman: 'Ada & Masih Aktif',
    notes: 'Service partner wilayah Bali',
  },
  {
    id: 8,
    tipe_partner: 'Individual',
    service_channel: 'ASC',
    tipe_pajak: 'Non PKP',
    city_type: 'Big City',
    street_type: 'Primary Street',
    svc_nearby: 'Tidak Ada',
    company_name: '',
    no_ktp: '7371234567890108',
    nama_ktp: 'Hendra Wijaya',
    npwp_number: '890123456789012',
    nib_number: '1234567890108',
    skdu_number: 'SKDU-008',
    kbli_number: '47599',
    svc_network: '25',
    alamat_ktp: 'Jl. Teratai No. 3, Makassar',
    provinsi: 'SULAWESI SELATAN',
    kota: 'KOTA MAKASSAR',
    zipcode: '90111',
    address: 'Jl. Teratai No. 3',
    contact_person: 'Hendra Wijaya',
    email: `ryan.ananda+${RUN_TS}08@modena.com`,
    mobilephone: `0813${RUN_TS}08`,
    phonenumber: `04112345608`,
    website: '',
    layanan: 'In Home Service',
    brand: 'LG',
    produk: 'Cooking',
    competency: 'Cooking Appliance',
    ref_code: '',
    dealer_terdekat: 'sub_dealer_available',
    bank_name: 'BCA',
    bank_account: 'Hendra Wijaya',
    bank_account_number: '8901234508',
    jumlah_teknisi: '5',
    jumlah_lead: '2',
    jumlah_administrasi: '1',
    jumlah_driver: '1',
    jumlah_pc_komputer: '2',
    financial_monthly: '13000000',
    jumlah_motor: '3',
    jumlah_mobil: '1',
    klaim_cooling: '0',
    klaim_cooking: '13',
    klaim_cleaning: '0',
    klaim_sha: '0',
    area_barat: 'Makassar Barat',
    area_timur: 'Makassar Timur',
    area_utara: 'Makassar Utara',
    area_selatan: 'Makassar Selatan',
    luas_carry_in: '65',
    luas_workshop: '130',
    pengalaman: 'Ada & Masih Aktif',
    notes: 'Service partner wilayah Makassar',
  },
  {
    id: 9,
    tipe_partner: 'Individual',
    service_channel: 'Service Local',
    tipe_pajak: 'Non PKP',
    city_type: 'Small City',
    street_type: 'Secondary Street',
    svc_nearby: 'Tidak Ada',
    company_name: '',
    no_ktp: '1671234567890109',
    nama_ktp: 'Intan Permata',
    npwp_number: '901234567890123',
    nib_number: '1234567890109',
    skdu_number: 'SKDU-009',
    kbli_number: '47599',
    svc_network: '14',
    alamat_ktp: 'Jl. Cempaka No. 16, Palembang',
    provinsi: 'SUMATERA SELATAN',
    kota: 'KOTA PALEMBANG',
    zipcode: '30125',
    address: 'Jl. Cempaka No. 16',
    contact_person: 'Intan Permata',
    email: `ryan.ananda+${RUN_TS}09@modena.com`,
    mobilephone: `0813${RUN_TS}09`,
    phonenumber: `071112345609`,
    website: '',
    layanan: 'Carry-in',
    brand: 'Panasonic',
    produk: 'IOT',
    competency: 'IoT Devices',
    ref_code: '',
    dealer_terdekat: 'no_sub_dealer',
    bank_name: 'BCA',
    bank_account: 'Intan Permata',
    bank_account_number: '9012345609',
    jumlah_teknisi: '2',
    jumlah_lead: '1',
    jumlah_administrasi: '1',
    jumlah_driver: '0',
    jumlah_pc_komputer: '1',
    financial_monthly: '5000000',
    jumlah_motor: '1',
    jumlah_mobil: '0',
    klaim_cooling: '0',
    klaim_cooking: '0',
    klaim_cleaning: '0',
    klaim_sha: '2',
    area_barat: 'Palembang Barat',
    area_timur: 'Ogan Ilir',
    area_utara: 'Palembang Utara',
    area_selatan: 'Palembang Selatan',
    luas_carry_in: '25',
    luas_workshop: '50',
    pengalaman: 'Tidak Ada',
    notes: 'Service partner wilayah Palembang',
  },
  {
    id: 10,
    tipe_partner: 'Individual',
    service_channel: 'ASC',
    tipe_pajak: 'Non PKP',
    city_type: 'Medium City',
    street_type: 'Secondary Street',
    svc_nearby: 'Ada',
    company_name: '',
    no_ktp: '6471234567890110',
    nama_ktp: 'Joko Prasetyo',
    npwp_number: '012345678901234',
    nib_number: '1234567890110',
    skdu_number: 'SKDU-010',
    kbli_number: '47599',
    svc_network: '16',
    alamat_ktp: 'Jl. Bougenville No. 20, Balikpapan',
    provinsi: 'KALIMANTAN TIMUR',
    kota: 'KOTA BALIKPAPAN',
    zipcode: '76114',
    address: 'Jl. Bougenville No. 20',
    contact_person: 'Joko Prasetyo',
    email: `ryan.ananda+${RUN_TS}10@modena.com`,
    mobilephone: `0813${RUN_TS}10`,
    phonenumber: `054112345610`,
    website: '',
    layanan: 'In Home Service',
    brand: 'Midea',
    produk: 'Small Appliance',
    competency: 'Small Appliance Service',
    ref_code: '',
    dealer_terdekat: 'dealer_available',
    bank_name: 'BCA',
    bank_account: 'Joko Prasetyo',
    bank_account_number: '0123456710',
    jumlah_teknisi: '4',
    jumlah_lead: '2',
    jumlah_administrasi: '1',
    jumlah_driver: '1',
    jumlah_pc_komputer: '2',
    financial_monthly: '9500000',
    jumlah_motor: '3',
    jumlah_mobil: '1',
    klaim_cooling: '5',
    klaim_cooking: '0',
    klaim_cleaning: '5',
    klaim_sha: '0',
    area_barat: 'Balikpapan Barat',
    area_timur: 'Balikpapan Timur',
    area_utara: 'Balikpapan Utara',
    area_selatan: 'Balikpapan Selatan',
    luas_carry_in: '45',
    luas_workshop: '90',
    pengalaman: 'Ada & Masih Aktif',
    notes: 'Service partner wilayah Balikpapan',
  },
];

// ============================================================
// HELPER: Type teks ke input (trigger React Hook Form onChange)
// ============================================================
async function typeField(page, selector, value) {
  const el = page.locator(selector).first();
  const visible = await el.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) { console.warn(`  ⚠️  Field tidak ditemukan: ${selector}`); return; }
  await el.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Delete');
  await el.pressSequentially(String(value), { delay: 30 });
}

// ============================================================
// HELPER: Klik accordion header lalu pilih opsi toggle
// ============================================================
async function clickToggleOption(page, headerText, optionText) {
  // Expand the accordion by clicking the header button
  const btns = page.locator('button');
  const count = await btns.count();
  for (let i = 0; i < count; i++) {
    const txt = (await btns.nth(i).textContent()).trim();
    if (txt === headerText || txt.startsWith(headerText)) {
      await btns.nth(i).click();
      await page.waitForTimeout(400);
      break;
    }
  }
  // Now click the desired option (last match to avoid hitting header again)
  const all = page.locator('button');
  const n = await all.count();
  for (let i = n - 1; i >= 0; i--) {
    const txt = (await all.nth(i).textContent()).trim();
    if (txt === optionText || txt.startsWith(optionText)) {
      await all.nth(i).click();
      await page.waitForTimeout(300);
      return;
    }
  }
  console.warn(`  ⚠️  Toggle option tidak ditemukan: "${optionText}"`);
}

// ============================================================
// HELPER: Pilih opsi react-select
// ============================================================
async function selectReactOption(page, inputId, searchStr, optionContainsText) {
  const input = page.locator(`#${inputId}`);
  const visible = await input.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) { console.warn(`  ⚠️  react-select tidak ditemukan: #${inputId}`); return; }
  await input.click();
  if (searchStr) await input.pressSequentially(searchStr, { delay: 50 });
  await page.waitForTimeout(700);
  const option = page.locator('[class*="option"]').filter({ hasText: optionContainsText }).first();
  const optVisible = await option.isVisible({ timeout: 3000 }).catch(() => false);
  if (optVisible) {
    await option.click();
  } else {
    console.warn(`  ⚠️  Option tidak ditemukan: "${optionContainsText}" pada #${inputId}`);
    // Press Escape to close
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(400);
}

// ============================================================
// HELPER: Fake semua file uploads via canvas -> DataTransfer
// ============================================================
async function fakeAllFileUploads(page) {
  await page.evaluate(async () => {
    async function fakeOneFile(input, filename) {
      const canvas = document.createElement('canvas');
      canvas.width = 10; canvas.height = 10;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#336699';
      ctx.fillRect(0, 0, 10, 10);
      return new Promise(resolve => {
        canvas.toBlob(blob => {
          const file = new File([blob], filename, { type: 'image/png' });
          const dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
          resolve(true);
        }, 'image/png');
      });
    }
    const inputs = document.querySelectorAll('input[type="file"]');
    const names = ['foto_ktp.png','foto_npwp.png','buku_rekening.png','nib_siup.png','skdu.png','kbli.png','foto1.png','foto2.png','foto3.png'];
    for (let i = 0; i < inputs.length; i++) {
      await fakeOneFile(inputs[i], names[i] || `dokumen${i}.png`);
    }
  });
  await page.waitForTimeout(500);
}

// ============================================================
// HELPER: Klik Selanjutnya dan verifikasi step
// ============================================================
async function clickNext(page, expectedStepNum) {
  await page.locator('button:has-text("Selanjutnya")').click();
  await page.waitForTimeout(1000);
  const stepText = await page.locator('.text-xs').filter({ hasText: '/ 6' }).first().textContent({ timeout: 5000 }).catch(() => '?');
  const current = stepText.trim();
  if (expectedStepNum && !current.includes(String(expectedStepNum))) {
    console.warn(`  ⚠️  Diharapkan step ${expectedStepNum}, aktual: "${current}"`);
  } else {
    console.log(`  ✅ Step saat ini: ${current}`);
  }
}

// ============================================================
// STEP 1: Identitas (semua field)
// ============================================================
async function fillStep1(page, data) {
  console.log('  📝 Step 1: Identitas');

  // Toggle buttons – Tipe Partner
  await clickToggleOption(page, 'Individual', data.tipe_partner);
  // Toggle buttons – Service Channel
  await clickToggleOption(page, 'Pilih Service Channel', data.service_channel);
  // Toggle buttons – Tipe Pajak
  await clickToggleOption(page, 'Pilih Tipe Pajak', data.tipe_pajak);
  // Toggle buttons – City Type
  await clickToggleOption(page, 'Small City', data.city_type);
  // Toggle buttons – Street Type
  await clickToggleOption(page, 'Secondary Street', data.street_type);

  // Text fields
  if (data.company_name) await typeField(page, 'input[name="company_name"]', data.company_name);
  await typeField(page, 'input[name="no_ktp"]', data.no_ktp);
  await typeField(page, 'input[name="nama_ktp"]', data.nama_ktp);
  if (data.npwp_number) await typeField(page, 'input[name="npwp_number"]', data.npwp_number);
  await typeField(page, 'input[name="nib_number"]', data.nib_number);
  if (data.skdu_number) await typeField(page, 'input[name="skdu_number"]', data.skdu_number);
  if (data.kbli_number) await typeField(page, 'input[name="kbli_number"]', data.kbli_number);
  if (data.svc_network) await typeField(page, 'input[name="svc_network"]', data.svc_network);

  // SVC Nearby toggle (Ada/Tidak Ada)
  if (data.svc_nearby === 'Ada') {
    const adaBtn = page.locator('button').filter({ hasText: 'Dalam 50 KM' }).first();
    const adaVisible = await adaBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (adaVisible) await adaBtn.click();
  }

  await typeField(page, 'textarea[name="alamat_ktp"]', data.alamat_ktp);

  // Provinsi (react-select-2)
  await selectReactOption(page, 'react-select-2-input', data.provinsi.slice(0, 3).trim(), data.provinsi);

  // Kota (react-select-3)
  await page.waitForTimeout(500);
  const kotaSearch = data.kota.replace(/^(KOTA|KABUPATEN)\s+/, '').slice(0, 6);
  await selectReactOption(page, 'react-select-3-input', kotaSearch, data.kota);

  await typeField(page, 'input[name="zipcode"]', data.zipcode);
  await typeField(page, 'textarea[name="address"]', data.address);
}

// ============================================================
// STEP 2: Upload Dokumen
// ============================================================
async function fillStep2(page) {
  console.log('  📎 Step 2: Upload Dokumen');
  await fakeAllFileUploads(page);
}

// ============================================================
// STEP 3: Kontak & Layanan (semua field)
// ============================================================
async function fillStep3(page, data) {
  console.log('  📱 Step 3: Kontak & Layanan');

  await typeField(page, 'input[name="contact_person"]', data.contact_person);
  await typeField(page, 'input[name="email"]', data.email);
  if (data.phonenumber) await typeField(page, 'input[name="phonenumber"]', data.phonenumber);
  await typeField(page, 'input[name="mobilephone"]', data.mobilephone);
  if (data.website) await typeField(page, 'input[name="website"]', data.website);

  // Layanan Service (react-select-4)
  await selectReactOption(page, 'react-select-4-input', null, data.layanan);
  // Brands (react-select-5)
  await selectReactOption(page, 'react-select-5-input', null, data.brand);
  // Perbaikan Produk (react-select-6)
  await selectReactOption(page, 'react-select-6-input', null, data.produk);

  if (data.competency) await typeField(page, 'input[name="competency"]', data.competency);
  if (data.ref_code) await typeField(page, 'input[name="ref_code"]', data.ref_code);

  // Dealer terdekat (radio button)
  if (data.dealer_terdekat) {
    const radio = page.locator(`input[name="dealer_terdekat"][value="${data.dealer_terdekat}"]`);
    const radioVisible = await radio.isVisible({ timeout: 2000 }).catch(() => false);
    if (radioVisible) await radio.click();
  }

  // Bank (react-select-7)
  if (data.bank_name) {
    await selectReactOption(page, 'react-select-7-input', data.bank_name.slice(0, 3), data.bank_name);
  }
  if (data.bank_account) await typeField(page, 'input[name="bank_account"]', data.bank_account);
  if (data.bank_account_number) await typeField(page, 'input[name="bank_account_number"]', data.bank_account_number);
}

// ============================================================
// STEP 4: Data Operasional (semua field)
// ============================================================
async function fillStep4(page, data) {
  console.log('  🔧 Step 4: Operasional');

  const numberFields = [
    ['jumlah_teknisi', data.jumlah_teknisi],
    ['jumlah_lead', data.jumlah_lead],
    ['jumlah_administrasi', data.jumlah_administrasi],
    ['jumlah_driver', data.jumlah_driver],
    ['jumlah_pc_komputer', data.jumlah_pc_komputer],
    ['financial_monthly', data.financial_monthly],
    ['jumlah_motor', data.jumlah_motor],
    ['jumlah_mobil', data.jumlah_mobil],
    ['klaim_cooling', data.klaim_cooling],
    ['klaim_cooking', data.klaim_cooking],
    ['klaim_cleaning', data.klaim_cleaning],
    ['klaim_sha', data.klaim_sha],
    ['luas_carry_in', data.luas_carry_in],
    ['luas_workshop', data.luas_workshop],
  ];

  for (const [name, value] of numberFields) {
    if (value !== undefined && value !== '') {
      const visible = await page.locator(`input[name="${name}"]`).isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) await typeField(page, `input[name="${name}"]`, String(value));
    }
  }

  // Area coverage
  for (const [name, value] of [
    ['area_barat', data.area_barat],
    ['area_timur', data.area_timur],
    ['area_utara', data.area_utara],
    ['area_selatan', data.area_selatan],
  ]) {
    const visible = await page.locator(`input[name="${name}"]`).isVisible({ timeout: 2000 }).catch(() => false);
    if (visible) await typeField(page, `input[name="${name}"]`, value);
  }
}

// ============================================================
// STEP 5: Infrastruktur (foto bengkel)
// ============================================================
async function fillStep5(page, data) {
  console.log('  🏠 Step 5: Infrastruktur');
  await fakeAllFileUploads(page);

  // Isi keterangan foto (textarea placeholder: "Keterangan foto...")
  const captionTextareas = page.locator('textarea[placeholder*="Keterangan foto" i], textarea[placeholder*="Keterangan" i]');
  const count = await captionTextareas.count();
  for (let i = 0; i < count; i++) {
    const ta = captionTextareas.nth(i);
    const visible = await ta.isVisible({ timeout: 1000 }).catch(() => false);
    if (visible) {
      await ta.click();
      await ta.pressSequentially(`Foto bengkel ${i + 1} - ${data.nama_ktp}`, { delay: 20 });
    }
  }

  // Pengalaman kandidat toggle
  if (data.pengalaman) {
    const pengalBtn = page.locator('button').filter({ hasText: data.pengalaman }).first();
    const btnVisible = await pengalBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (btnVisible) {
      await pengalBtn.click();
      await page.waitForTimeout(300);
    }
  }
}

// ============================================================
// STEP 6: Review & Catatan
// ============================================================
async function fillStep6(page, data) {
  console.log('  📋 Step 6: Catatan');
  const notesVisible = await page.locator('textarea[name="notes"]').isVisible({ timeout: 3000 }).catch(() => false);
  if (notesVisible) await typeField(page, 'textarea[name="notes"]', data.notes);

  // Captcha auto-verified di DEV environment
  const captchaOk = await page.getByText('Verifikasi berhasil').isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`  🔐 Captcha: ${captchaOk ? 'OK' : 'Belum verified'}`);
}

// ============================================================
// MAIN: Jalankan 1 registrasi lengkap (6 steps)
// ============================================================
async function runRegistration(page, data) {
  console.log(`\n🚀 [Data ${data.id}] ${data.nama_ktp} | ${data.email} | ${data.mobilephone}`);

  await page.goto(REGISTRATION_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  await expect(page).toHaveURL(/client-registration/);
  const hasPageError = await page.getByText(/404|500|not found|server error/i).isVisible({ timeout: 3000 }).catch(() => false);
  expect(hasPageError, 'Halaman error 404/500').toBeFalsy();

  await page.screenshot({ path: `test-results/reg-${String(data.id).padStart(2,'0')}-01-start.png`, fullPage: true });

  // ── Step 1 ──────────────────────────────────────────────────────
  await fillStep1(page, data);
  await page.screenshot({ path: `test-results/reg-${String(data.id).padStart(2,'0')}-02-step1.png`, fullPage: true });
  await clickNext(page, 2);

  // ── Step 2 ──────────────────────────────────────────────────────
  await fillStep2(page);
  await page.screenshot({ path: `test-results/reg-${String(data.id).padStart(2,'0')}-03-step2.png`, fullPage: true });
  await clickNext(page, 3);

  // ── Step 3 ──────────────────────────────────────────────────────
  await fillStep3(page, data);
  // Cek "sudah terdaftar"
  const sudahTerdaftar = await page.locator('.text-red-500, p[class*="text-red"]').filter({ hasText: /sudah terdaftar/i }).first().isVisible({ timeout: 2000 }).catch(() => false);
  if (sudahTerdaftar) {
    const errTxt = await page.locator('.text-red-500, p[class*="text-red"]').filter({ hasText: /sudah terdaftar/i }).first().textContent().catch(() => '');
    throw new Error(`Data ${data.id}: ${errTxt}`);
  }
  await page.screenshot({ path: `test-results/reg-${String(data.id).padStart(2,'0')}-04-step3.png`, fullPage: true });
  await clickNext(page, 4);

  // ── Step 4 ──────────────────────────────────────────────────────
  await fillStep4(page, data);
  await page.screenshot({ path: `test-results/reg-${String(data.id).padStart(2,'0')}-05-step4.png`, fullPage: true });
  await clickNext(page, 5);

  // ── Step 5 ──────────────────────────────────────────────────────
  await fillStep5(page, data);
  await page.screenshot({ path: `test-results/reg-${String(data.id).padStart(2,'0')}-06-step5.png`, fullPage: true });
  await clickNext(page, 6);

  // ── Step 6 ──────────────────────────────────────────────────────
  await fillStep6(page, data);
  await page.screenshot({ path: `test-results/reg-${String(data.id).padStart(2,'0')}-07-step6.png`, fullPage: true });

  // Submit
  console.log(`  📤 Submit...`);
  const submitBtn = page.locator('button[type="submit"], button:has-text("Daftarkan Partner"), button:has-text("Submit"), button:has-text("Kirim")').first();
  await submitBtn.click();
  await page.waitForTimeout(6000);

  const finalUrl = page.url();
  const hasSuccess = await page.getByText(/success|berhasil|terdaftar|thank you|terima kasih/i).first().isVisible({ timeout: 5000 }).catch(() => false);
  const redirectedToSuccess = /success|thank|confirmation|registered/i.test(finalUrl);

  console.log(`  URL akhir   : ${finalUrl}`);
  console.log(`  Notif sukses: ${hasSuccess}`);
  console.log(`  Redirect OK : ${redirectedToSuccess}`);

  await page.screenshot({ path: `test-results/reg-${String(data.id).padStart(2,'0')}-08-result.png`, fullPage: true });
  expect(hasSuccess || redirectedToSuccess, `Registrasi ${data.nama_ktp} gagal — tidak ada notifikasi sukses`).toBeTruthy();
  console.log(`✅ [Data ${data.id}] ${data.nama_ktp} berhasil diregistrasi`);
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe('Registrasi Service Partner – 10 Data Lengkap', () => {

  test.setTimeout(180_000); // 3 menit per test

  for (const data of registrationData) {
    test(`Data ke-${data.id} – ${data.nama_ktp} (${data.layanan})`, async ({ page }) => {
      await runRegistration(page, data);
    });
  }

});


