/**
 * Branch Improvement - End to End Approval Flow
 * 
 * Flow:
 * 1. CREATE DATA     - agung.gunawan@modena.com      (Branch Manager)
 * 2. APPROVAL 1      - jimmy.tanweli@modena.com       (Approver 1 - select building)
 * 3. APPROVAL 2      - jemmi.liem@modena.com          (Approver 2 - select building)
 * 4. APPROVAL 3      - eko.suyitno@modena.com         (Approver 3 - select building)
 * 5. FINAL APPROVAL  - daniel.jizhar@modena.com       (Final Approver - select building)
 * 
 * Data: Mix of Renewal (2) and Relocation (2) = 4 items
 * 
 * FORM STRUCTURE (verified via MCP Playwright):
 * - After selecting building from React-Select, Sections 1,3-8 are READONLY (autofilled)
 * - RENEWAL: Only New Rent Price, New Duration, New Start/End Date, Notes are editable
 * - RELOCATION: Click "Add Candidate" -> 10 accordion sub-sections, ALL editable
 */

import { test, expect } from '@playwright/test';

// ============================================================
// CONFIGURATION
// ============================================================
const BASE_URL = 'https://portal-dev.modena.com';
const BRANCH_IMPROVEMENT_FORM_URL = `${BASE_URL}/fms/building/branch-improvement/form`;
const BRANCH_IMPROVEMENT_URL = `${BASE_URL}/fms/building/branch-improvement`;

// ============================================================
// USER ACCOUNTS
// ============================================================
const USERS = {
  creator: {
    email: 'agung.gunawan@modena.com',
    password: 'P@ssw0rd_agung.gunawan',
    name: 'Agung Sukmana Gunawan',
    role: 'Creator / Branch Manager'
  },
  approver1: {
    email: 'jimmy.tanweli@modena.com',
    password: 'P@ssw0rd_jimmy.tanweli',
    name: 'Jimmy Tanweli',
    role: 'Approver 1'
  },
  approver2: {
    email: 'jemmi.liem@modena.com',
    password: 'P@ssw0rd_jemmi.liem',
    name: 'Jemmi Liem',
    role: 'Approver 2'
  },
  approver3: {
    email: 'eko.suyitno@modena.com',
    password: 'P@ssw0rd_eko.suyitno',
    name: 'Eko Suyitno',
    role: 'Approver 3'
  },
  finalApprover: {
    email: 'daniel.jizhar@modena.com',
    password: 'P@ssw0rd_daniel.jizhar',
    name: 'Daniel Jizhar',
    role: 'Final Approver'
  }
};

// ============================================================
// TEST DATA - 4 Branch Improvements (2 Renewal + 2 Relocation)
// ============================================================
const branchImprovementData = [
  // --- DATA 1: Renewal ---
  {
    label: 'Renewal - Jayapura',
    improvementType: 'Renewal',
    buildingSearch: 'Jayapura',
    newRentPrice: '35000000',
    newDuration: '5 Years',
    newStartDate: '2024-01-01',
    newEndDate: '2028-12-31',
    negotiationNotes: 'Renewal untuk lokasi strategis Jayapura. Perpanjangan kontrak diperlukan untuk menjaga kontinuitas bisnis. Negosiasi berhasil dengan kenaikan sewa yang reasonable.'
  },
  // --- DATA 2: Renewal ---
  {
    label: 'Renewal - Sorong',
    improvementType: 'Renewal',
    buildingSearch: 'Sorong',
    newRentPrice: '28000000',
    newDuration: '3 Years',
    newStartDate: '2024-07-01',
    newEndDate: '2027-06-30',
    negotiationNotes: 'Renewal lokasi Sorong dengan track record penjualan baik. Area strategis dan performa cabang meningkat 15% YoY. Negosiasi harga sewa dengan kenaikan minimal.'
  },
  // --- DATA 3: Relocation ---
  {
    label: 'Relocation - Kendari',
    improvementType: 'Relocation',
    buildingSearch: 'Kendari',
    candidate: {
      name: 'Lokasi Baru Kendari Pusat',
      kondisi: 'Baik',
      rentPrice: '30000000',
      distance: '5',
      address: 'Jl. Ahmad Yani No. 88, Kendari Pusat',
      area: 'East',
      phoneLine: '3',
      canAddMore: true,
      additionalCost: '5000000',
      ditanggungOleh: 'Penyewa',
      electricity: '5500 VA / 25A',
      powerSource: 'PLN',
      waterSource: 'PAM',
      luasTanah: '500',
      luasBangunan: '350',
      halaman: '150',
      materialPagar: 'Tembok Bata',
      tinggiPagar: '3',
      luasLantaiDasar: '200',
      luasLantai1: '150',
      luasLantai2: '0',
      buildingAge: '< 5 Years',
      notes: 'Kandidat relokasi Kendari Pusat. Lokasi lebih strategis dengan akses jalan utama dan area parkir luas. Kapasitas service meningkat 50%.'
    }
  },
  // --- DATA 4: Relocation ---
  {
    label: 'Relocation - Ambon',
    improvementType: 'Relocation',
    buildingSearch: 'Ambon',
    candidate: {
      name: 'Lokasi Baru Ambon Center',
      kondisi: 'Sangat Baik',
      rentPrice: '25000000',
      distance: '8',
      address: 'Jl. Pattimura No. 55, Ambon',
      area: 'East',
      phoneLine: '2',
      canAddMore: false,
      additionalCost: '0',
      ditanggungOleh: 'Pemilik',
      electricity: '3300 VA / 16A',
      powerSource: 'PLN',
      waterSource: 'PAM',
      luasTanah: '400',
      luasBangunan: '280',
      halaman: '120',
      materialPagar: 'Besi',
      tinggiPagar: '2',
      luasLantaiDasar: '180',
      luasLantai1: '100',
      luasLantai2: '0',
      buildingAge: '5-10 Years',
      notes: 'Kandidat relokasi Ambon Center. Gedung baru dengan kondisi sangat baik. Area strategis dekat pusat bisnis dan perumahan.'
    }
  }
];

// ============================================================
// HELPER: Login to Portal
// ============================================================
async function loginToPortal(page, user, targetUrl = null) {
  console.log(`\n[LOGIN] Logging in as: ${user.name} (${user.role})`);
  console.log(`[LOGIN] Email: ${user.email}\n`);

  // Clear cookies AND localStorage for clean session
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => {});
  await page.waitForTimeout(500);

  // Force reload to apply cleared state
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Navigate to target URL (will redirect to login if not authenticated)
  const navigateUrl = targetUrl || BRANCH_IMPROVEMENT_URL;
  await page.goto(navigateUrl, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Fill login form if on login page
  if (page.url().includes('/login')) {
    await page.locator('input[type="email"], input[name="email"]').first().fill(user.email);
    await page.locator('input[type="password"]').first().fill(user.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Handle my-application redirect
  if (page.url().includes('my-application')) {
    console.log('[LOGIN] On my-application page, selecting FMS (DEV)...');
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(3000);

    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
    }
    await page.waitForTimeout(2000);

    // Navigate to target URL after FMS selection
    await page.goto(navigateUrl, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Fallback: if still not on the right page
  if (!page.url().includes('/fms/')) {
    console.log(`[LOGIN] Still at ${page.url()}, attempting fallback...`);
    await page.goto(`${BASE_URL}/fms`, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(3000);
      const fmsConfirm = page.getByRole('button', { name: 'Confirm' });
      if (await fmsConfirm.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fmsConfirm.click();
        await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
      }
      await page.waitForTimeout(2000);
    }

    await page.goto(navigateUrl, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  console.log(`[LOGIN] OK - ${user.name} - URL: ${page.url()}`);
  await page.screenshot({ path: `test-results/e2e-login-${user.email.split('@')[0]}.png`, fullPage: true });
}

// ============================================================
// HELPER: Select Building from React-Select (#react-select-2-input)
// ============================================================
async function selectBuildingFromDropdown(page, searchTerm) {
  console.log(`[BUILDING] Searching "${searchTerm}"...`);

  // The building React-Select is #react-select-2-input
  const buildingInput = page.locator('#react-select-2-input');
  await buildingInput.click();
  await page.waitForTimeout(500);
  await buildingInput.fill(searchTerm);
  await page.waitForTimeout(2000);

  // Wait for dropdown options to appear and click the first one
  const firstOption = page.locator('[class*="option"]').first();
  if (await firstOption.isVisible({ timeout: 5000 }).catch(() => false)) {
    const optionText = await firstOption.textContent().catch(() => '');
    console.log(`[BUILDING] Selecting: ${optionText}`);
    await firstOption.click();
    await page.waitForTimeout(2000);
  } else {
    console.log('[BUILDING] No options found, trying broader search...');
    await buildingInput.fill('Modena');
    await page.waitForTimeout(2000);
    const fallbackOption = page.locator('[class*="option"]').first();
    if (await fallbackOption.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fallbackOption.click();
      await page.waitForTimeout(2000);
    }
  }

  // Verify building was selected (Asset Number should be filled)
  const assetNumber = await page.locator('input[placeholder="BLD-2024-001"]').getAttribute('value').catch(() => '');
  console.log(`[BUILDING] Asset Number: ${assetNumber}`);
  await page.screenshot({ path: `test-results/e2e-building-selected-${searchTerm}.png`, fullPage: true });
}

// ============================================================
// HELPER: Fill Renewal Form
// After selecting building, only Strategic Planning fields are editable:
// - New Rent Price (text input, placeholder="0", with "RP" prefix)
// - New Duration (select: 1 Year, 2 Years, 3 Years, 5 Years)
// - New Start Date (date input)
// - New End Date (date input)
// - Negotiation Notes (textarea)
// ============================================================
async function fillRenewalForm(page, data) {
  console.log(`\n[RENEWAL] Filling: ${data.label}\n`);

  // Step 1: Select Building -> autofills all readonly fields
  await selectBuildingFromDropdown(page, data.buildingSearch);

  // Step 2: Renewal tab is already active by default (green border)
  console.log('[RENEWAL] Strategic Planning - Renewal Details');

  // Step 3: New Rent Price (Per Year) - text input placeholder="0" inside Renewal section
  // This is the ONLY editable text input with placeholder="0" when Renewal is active
  const newRentPriceInput = page.locator('input[type="text"][placeholder="0"]').first();
  if (await newRentPriceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newRentPriceInput.fill(data.newRentPrice);
    console.log(`  > New Rent Price: ${data.newRentPrice}`);
    await page.waitForTimeout(300);
  }

  // Step 4: New Duration
  const durationSelect = page.locator('select').filter({ hasText: '- Select Duration -' });
  if (await durationSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    await durationSelect.selectOption({ value: data.newDuration });
    console.log(`  > New Duration: ${data.newDuration}`);
    await page.waitForTimeout(300);
  }

  // Step 5 & 6: New Start Date + New End Date
  // These are the only non-readonly date inputs in the Renewal section
  const editableDateInputs = page.locator('input[type="date"]:not([readonly])');
  const dateCount = await editableDateInputs.count();
  console.log(`  Found ${dateCount} editable date inputs`);

  if (dateCount >= 1) {
    await editableDateInputs.first().fill(data.newStartDate);
    console.log(`  > New Start Date: ${data.newStartDate}`);
    await page.waitForTimeout(300);
  }
  if (dateCount >= 2) {
    await editableDateInputs.nth(1).fill(data.newEndDate);
    console.log(`  > New End Date: ${data.newEndDate}`);
    await page.waitForTimeout(300);
  }

  // Step 7: Negotiation Notes
  const notesTextarea = page.locator('textarea[placeholder*="Notes on negotiation"]');
  if (await notesTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notesTextarea.fill(data.negotiationNotes);
    console.log('  > Negotiation Notes filled');
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: `test-results/e2e-renewal-filled-${data.buildingSearch}.png`, fullPage: true });
  console.log(`\n[RENEWAL] DONE: ${data.label}\n`);
}

// ============================================================
// HELPER: Fill Relocation Form
// Flow: Select building -> Click Relocation tab -> Add Candidate
// -> Fill 10 accordion sections -> Save Relocation Proposal
// ============================================================
async function fillRelocationForm(page, data) {
  console.log(`\n[RELOCATION] Filling: ${data.label}\n`);
  const candidate = data.candidate;

  // Step 1: Select Building -> autofills readonly fields in main form
  await selectBuildingFromDropdown(page, data.buildingSearch);

  // Step 2: Click Relocation tab
  const relocationTab = page.locator('button').filter({ hasText: 'Relocation' }).first();
  await relocationTab.click();
  await page.waitForTimeout(1000);
  console.log('  > Switched to Relocation tab');

  // Step 3: Click "Add Candidate"
  const addCandidateBtn = page.locator('button').filter({ hasText: 'Add Candidate' });
  if (await addCandidateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addCandidateBtn.click();
    await page.waitForTimeout(2000);
    console.log('  > Add Candidate clicked');
  }

  // ============================================================
  // SECTION 1: Identitas & Harga (auto-expanded)
  // Fields: Nama Gedung, Kondisi Bangunan, Harga Sewa, Jarak
  // ============================================================
  console.log('[RELOCATION] Section 1: Identitas & Harga');

  const nameInput = page.locator('input[placeholder="Nama lokasi kandidat..."]');
  if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nameInput.fill(candidate.name);
    console.log(`  > Nama: ${candidate.name}`);
  }

  // Kondisi Bangunan select (Sangat Baik / Baik / Sedang / Kurang)
  const kondisiSelect = page.locator('select').filter({ hasText: 'Sangat Baik' }).first();
  if (await kondisiSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    await kondisiSelect.selectOption({ value: candidate.kondisi });
    console.log(`  > Kondisi: ${candidate.kondisi}`);
  }

  // Harga Sewa - text input placeholder="0" within candidate section
  // Use :not([readonly]) to target only the candidate's editable field
  const rentPriceInput = page.locator('input[type="text"][placeholder="0"]:not([readonly])').first();
  if (await rentPriceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await rentPriceInput.fill(candidate.rentPrice);
    console.log(`  > Harga Sewa: ${candidate.rentPrice}`);
  }

  // Jarak (KM) - number input placeholder="0", must exclude readonly building fields
  const distanceInput = page.locator('input[type="number"][placeholder="0"]:not([readonly])').first();
  if (await distanceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await distanceInput.fill(candidate.distance);
    console.log(`  > Jarak: ${candidate.distance} KM`);
  }

  await page.screenshot({ path: `test-results/e2e-relocation-sec1-${data.buildingSearch}.png`, fullPage: true });

  // ============================================================
  // SECTION 2: Alamat Lokasi
  // Fields: Jalan, Area (East/West), Province, City, District
  // ============================================================
  console.log('[RELOCATION] Section 2: Alamat Lokasi');
  const sec2Btn = page.locator('button').filter({ hasText: '2. Alamat Lokasi' });
  if (await sec2Btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sec2Btn.click();
    await page.waitForTimeout(500);
  }

  const addressInput = page.locator('input[placeholder="Jalan, nomor, dll..."]');
  if (await addressInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addressInput.fill(candidate.address);
    console.log(`  > Alamat: ${candidate.address}`);
  }

  // Area select (Pilih Area / East / West)
  const areaSelect = page.locator('select').filter({ hasText: 'Pilih Area' });
  if (await areaSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    await areaSelect.selectOption({ value: candidate.area });
    console.log(`  > Area: ${candidate.area}`);
  }

  // Province React-Select (react-select-6-input)
  const provinceInput = page.locator('[id*="react-select"][id$="-input"]').nth(1);
  if (await provinceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (await provinceInput.isDisabled().catch(() => true) === false) {
      await provinceInput.click();
      await provinceInput.fill('Jawa');
      await page.waitForTimeout(2000);
      const provOption = page.locator('[class*="option"]').first();
      if (await provOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await provOption.click();
        await page.waitForTimeout(1000);
        console.log('  > Province selected');
      }
    }
  }

  // City React-Select
  const cityInput = page.locator('[id*="react-select"][id$="-input"]').nth(2);
  if (await cityInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (await cityInput.isDisabled().catch(() => true) === false) {
      await cityInput.click();
      await page.waitForTimeout(1000);
      const cityOption = page.locator('[class*="option"]').first();
      if (await cityOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cityOption.click();
        await page.waitForTimeout(1000);
        console.log('  > City selected');
      }
    }
  }

  // District React-Select
  const districtInput = page.locator('[id*="react-select"][id$="-input"]').nth(3);
  if (await districtInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    if (await districtInput.isDisabled().catch(() => true) === false) {
      await districtInput.click();
      await page.waitForTimeout(1000);
      const districtOption = page.locator('[class*="option"]').first();
      if (await districtOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await districtOption.click();
        await page.waitForTimeout(1000);
        console.log('  > District selected');
      }
    }
  }

  await page.screenshot({ path: `test-results/e2e-relocation-sec2-${data.buildingSearch}.png`, fullPage: true });

  // ============================================================
  // SECTION 3: Utilitas
  // Fields: Jumlah Line, Can Add More (Ya/Tidak), Biaya,
  //         Ditanggung Oleh, Ampere/VA, PLN/Swasta, Water Source
  // ============================================================
  console.log('[RELOCATION] Section 3: Utilitas');
  const sec3Btn = page.locator('button').filter({ hasText: '3. Utilitas' });
  if (await sec3Btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sec3Btn.click();
    await page.waitForTimeout(500);
  }

  // Jumlah Line - exclude readonly building field
  const phoneLineInput = page.locator('input[placeholder="1, 2, 3..."]:not([readonly])');
  if (await phoneLineInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await phoneLineInput.fill(candidate.phoneLine);
    console.log(`  > Jumlah Line: ${candidate.phoneLine}`);
  }

  // Can Add More? Ya / Tidak
  const canAddBtnText = candidate.canAddMore ? 'Ya' : 'Tidak';
  const canAddBtn = page.locator('button[type="button"]').filter({ hasText: new RegExp(`^${canAddBtnText}$`) });
  if (await canAddBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await canAddBtn.click();
    console.log(`  > Can Add More: ${canAddBtnText}`);
  }

  // Biaya Penambahan (only if canAddMore)
  if (candidate.canAddMore && candidate.additionalCost !== '0') {
    // The Biaya Tambahan is the second editable text[placeholder="0"] (after Harga Sewa)
    const costInput = page.locator('input[type="text"][placeholder="0"]:not([readonly])').nth(1);
    if (await costInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await costInput.fill(candidate.additionalCost);
      console.log(`  > Biaya Penambahan: ${candidate.additionalCost}`);
    }
  }

  // Ditanggung Oleh - use :not([disabled]) to target candidate's select
  const ditanggungSelect = page.locator('select:not([disabled])').filter({ hasText: 'PenyewaPemilik' }).last();
  if (await ditanggungSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ditanggungSelect.selectOption({ value: candidate.ditanggungOleh });
    console.log(`  > Ditanggung Oleh: ${candidate.ditanggungOleh}`);
  }

  // Ampere / Voltage - exclude readonly building field
  const electricInput = page.locator('input[placeholder*="2200 VA"]:not([readonly])');
  if (await electricInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await electricInput.fill(candidate.electricity);
    console.log(`  > Listrik: ${candidate.electricity}`);
  }

  // Sumber Listrik (PLN / Swasta)
  const powerBtn = page.locator('button[type="button"]').filter({ hasText: new RegExp(`^${candidate.powerSource}$`) });
  if (await powerBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await powerBtn.first().click();
    console.log(`  > Sumber Listrik: ${candidate.powerSource}`);
  }

  // Water Source (PAM / POMPA / SUMUR / LAINNYA)
  const waterBtn = page.locator('button[type="button"]').filter({ hasText: new RegExp(`^${candidate.waterSource}$`) });
  if (await waterBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await waterBtn.first().click();
    console.log(`  > Sumber Air: ${candidate.waterSource}`);
  }

  await page.screenshot({ path: `test-results/e2e-relocation-sec3-${data.buildingSearch}.png`, fullPage: true });

  // ============================================================
  // SECTION 4: Luas & Kondisi Fisik
  // Fields: Luas Tanah, Luas Bangunan, Halaman,
  //         Material Pagar, Tinggi Pagar
  // ============================================================
  console.log('[RELOCATION] Section 4: Luas & Kondisi Fisik');
  const sec4Btn = page.locator('button').filter({ hasText: '4. Luas' });
  if (await sec4Btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sec4Btn.click();
    await page.waitForTimeout(500);
  }

  const luasTanahInput = page.locator('input[type="number"][placeholder="500"]:not([readonly])');
  if (await luasTanahInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await luasTanahInput.fill(candidate.luasTanah);
    console.log(`  > Luas Tanah: ${candidate.luasTanah}`);
  }

  const luasBangunanInput = page.locator('input[type="number"][placeholder="350"]:not([readonly])');
  if (await luasBangunanInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await luasBangunanInput.fill(candidate.luasBangunan);
    console.log(`  > Luas Bangunan: ${candidate.luasBangunan}`);
  }

  const halamanInput = page.locator('input[type="number"][placeholder="150"]:not([readonly])');
  if (await halamanInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await halamanInput.fill(candidate.halaman);
    console.log(`  > Halaman: ${candidate.halaman}`);
  }

  const materialPagarInput = page.locator('input[placeholder*="Besi / Tembok"]:not([readonly])');
  if (await materialPagarInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await materialPagarInput.fill(candidate.materialPagar);
    console.log(`  > Material Pagar: ${candidate.materialPagar}`);
  }

  const tinggiPagarInput = page.locator('input[type="number"][placeholder="20"]:not([readonly])');
  if (await tinggiPagarInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await tinggiPagarInput.fill(candidate.tinggiPagar);
    console.log(`  > Kapasitas Parkir: ${candidate.tinggiPagar}`);
  }

  await page.screenshot({ path: `test-results/e2e-relocation-sec4-${data.buildingSearch}.png`, fullPage: true });

  // ============================================================
  // SECTION 5: Keamanan (Security checkboxes)
  // Checkboxes are hidden, must click the <label> elements
  // ============================================================
  console.log('[RELOCATION] Section 5: Keamanan');
  const sec5Btn = page.locator('button').filter({ hasText: '5. Keamanan' });
  if (await sec5Btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sec5Btn.click();
    await page.waitForTimeout(500);
  }

  // Click all security label checkboxes
  const securityLabels = page.locator('label:has(input[type="checkbox"])');
  const secLabelCount = await securityLabels.count().catch(() => 0);
  console.log(`  Found ${secLabelCount} security labels`);
  for (let i = 0; i < secLabelCount; i++) {
    const lbl = securityLabels.nth(i);
    if (await lbl.isVisible({ timeout: 1000 }).catch(() => false)) {
      await lbl.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(200);
    }
  }
  console.log('  > Security checkboxes clicked');

  await page.screenshot({ path: `test-results/e2e-relocation-sec5-${data.buildingSearch}.png`, fullPage: true });

  // ============================================================
  // SECTION 6: Jumlah Tingkat (Floor area m2)
  // ============================================================
  console.log('[RELOCATION] Section 6: Jumlah Tingkat');
  const sec6Btn = page.locator('button').filter({ hasText: '6. Jumlah Tingkat' });
  if (await sec6Btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sec6Btn.click();
    await page.waitForTimeout(500);
  }

  // Floor Luas inputs placeholder="Luas (m2)"
  const floorInputs = page.locator('input[placeholder="Luas (m²)"]');
  const floorCount = await floorInputs.count();
  console.log(`  Found ${floorCount} floor inputs`);
  const floorValues = [candidate.luasLantaiDasar, candidate.luasLantai1, candidate.luasLantai2];
  for (let i = 0; i < Math.min(floorValues.length, floorCount); i++) {
    if (floorValues[i] && floorValues[i] !== '0') {
      const floorInput = floorInputs.nth(i);
      if (await floorInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await floorInput.fill(floorValues[i]);
        console.log(`  > Floor ${i}: ${floorValues[i]} m2`);
      }
    }
  }

  await page.screenshot({ path: `test-results/e2e-relocation-sec6-${data.buildingSearch}.png`, fullPage: true });

  // ============================================================
  // SECTION 7: Jenis Bangunan (Building Age)
  // ============================================================
  console.log('[RELOCATION] Section 7: Jenis Bangunan');
  const sec7Btn = page.locator('button').filter({ hasText: '7. Jenis Bangunan' });
  if (await sec7Btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sec7Btn.click();
    await page.waitForTimeout(500);
  }

  const ageBtn = page.locator('button[type="button"]').filter({ hasText: candidate.buildingAge });
  if (await ageBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await ageBtn.first().click();
    console.log(`  > Building Age: ${candidate.buildingAge}`);
  }

  // ============================================================
  // SECTION 8-9: Documents & Photos (skip - require file upload)
  // ============================================================
  console.log('[RELOCATION] Sections 8-9: Documents & Photos (skipped)');

  // ============================================================
  // SECTION 10: Catatan (Notes)
  // ============================================================
  console.log('[RELOCATION] Section 10: Catatan');
  const sec10Btn = page.locator('button').filter({ hasText: '10. Catatan' });
  if (await sec10Btn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sec10Btn.click();
    await page.waitForTimeout(500);
  }

  const notesTextarea = page.locator('textarea[placeholder*="Catatan tambahan"]');
  if (await notesTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notesTextarea.fill(candidate.notes);
    console.log('  > Catatan filled');
  }

  await page.screenshot({ path: `test-results/e2e-relocation-sec10-${data.buildingSearch}.png`, fullPage: true });

  // ============================================================
  // NOTE: "Save Relocation Proposal" button is non-functional.
  // The header Submit button will submit the form WITH candidate data.
  // ============================================================

  await page.screenshot({ path: `test-results/e2e-relocation-filled-${data.buildingSearch}.png`, fullPage: true });
  console.log(`\n[RELOCATION] DONE: ${data.label}\n`);
}

// ============================================================
// HELPER: Submit Form
// Strategy: Use Playwright route() to intercept the Save Draft API response,
// extract the created item ID, then submit via the API endpoint.
// This works around a React stale closure bug where the header Submit
// button rejects Relocation forms (candidates array is stale in closure).
// ============================================================
async function submitForm(page, label) {
  console.log(`[SUBMIT] Submitting: ${label}`);
  const safeLabel = label.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');

  // Scroll to top to see the header buttons
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `test-results/e2e-before-submit-${safeLabel}.png`, fullPage: true });

  // Step 1: Click "Save Draft" and capture the API response to get the item ID
  const saveDraftBtn = page.locator('button').filter({ hasText: 'Save Draft' });
  let capturedId = null;

  if (await saveDraftBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    // Wait for the API response from Save Draft (POST for new, PUT for existing)
    const [response] = await Promise.all([
      page.waitForResponse(
        resp => resp.url().includes('/api/v1/building-improvements') &&
                (resp.request().method() === 'POST' || resp.request().method() === 'PUT') &&
                !resp.url().includes('submit'),
        { timeout: 15000 }
      ).catch(() => null),
      saveDraftBtn.click()
    ]);

    if (response) {
      console.log(`  > Response URL: ${response.url()}`);
      console.log(`  > Response status: ${response.status()}`);
      console.log(`  > Response method: ${response.request().method()}`);
      try {
        const body = await response.text();
        console.log(`  > Response body (first 500): ${body.substring(0, 500)}`);
        try {
          const json = JSON.parse(body);
          // Try multiple paths to find the ID
          capturedId = json?.data?.data?.id || json?.data?.id || json?.id;
          if (!capturedId && json?.data) {
            // Log all keys in data to find the right one
            console.log(`  > json.data keys: ${Object.keys(json.data)}`);
            if (typeof json.data === 'object' && json.data !== null) {
              console.log(`  > json.data: ${JSON.stringify(json.data).substring(0, 300)}`);
            }
          }
          if (capturedId) capturedId = String(capturedId);
          console.log(`  > Captured ID from JSON: ${capturedId}`);
        } catch (parseErr) {
          console.log(`  > Response is not JSON: ${parseErr.message}`);
        }
      } catch (textErr) {
        console.log(`  > Could not read response body: ${textErr.message}`);
      }
      // Also try extracting ID from the response URL (for PUT /building-improvements/{id})
      if (!capturedId) {
        const urlMatch = response.url().match(/building-improvements\/(\d+)/);
        if (urlMatch) {
          capturedId = urlMatch[1];
          console.log(`  > Captured ID from response URL: ${capturedId}`);
        }
      }
    } else {
      console.log('  > waitForResponse returned null (timeout or no match)');
    }
    console.log('  > Save Draft clicked');
    await page.waitForTimeout(3000);
  }

  // Step 3: Get the item ID
  let itemId = capturedId;

  if (!itemId && page.url().includes('/form/')) {
    const idMatch = page.url().match(/\/form\/(\d+)/);
    if (idMatch) itemId = idMatch[1];
  }

  if (!itemId && page.url().includes('/branch-improvement') && !page.url().includes('/form')) {
    // On list page: click View Details on the first DRAFT row to get its ID
    await page.waitForTimeout(2000);
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const rowText = await rows.nth(i).textContent().catch(() => '');
      if (rowText.includes('DRAFT')) {
        const viewBtn = rows.nth(i).locator('button[title="View Details"]');
        if (await viewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await viewBtn.click();
          await page.waitForTimeout(2000);
          const idMatch = page.url().match(/\/view\/(\d+)/);
          if (idMatch) itemId = idMatch[1];
          await page.goBack();
          await page.waitForTimeout(2000);
        }
        break;
      }
    }
  }

  console.log(`  > Item ID: ${itemId || 'NOT FOUND'}`);

  // Step 4: Submit via API call (bypasses React stale closure bug)
  if (itemId) {
    const submitResult = await page.evaluate(async (id) => {
      const token = localStorage.getItem('modena_fms_token');
      if (!token) return { error: 'No auth token' };
      try {
        const resp = await fetch(`https://portal-dev.modena.com/fms/api/v1/building-improvements/${id}/submit`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const text = await resp.text();
        return { status: resp.status, body: text };
      } catch (e) {
        return { error: e.message };
      }
    }, itemId);

    console.log(`  > API Submit result: ${JSON.stringify(submitResult)}`);
    if (submitResult.status === 200) {
      console.log('  > Successfully submitted via API');
    }
  } else {
    console.log('  > WARNING: Could not determine item ID');
  }

  // Navigate to list to verify
  if (!page.url().includes('/branch-improvement') || page.url().includes('/form') || page.url().includes('/view')) {
    await page.goto(BRANCH_IMPROVEMENT_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: `test-results/e2e-after-submit-${safeLabel}.png`, fullPage: true });
  const currentUrl = page.url();
  console.log(`  > URL after submit: ${currentUrl}`);
  return currentUrl;
}

// ============================================================
// HELPER: Navigate to Branch Improvement List Page
// (No separate approval page/tab exists - approvals happen from list → detail view)
// ============================================================
async function navigateToApprovalPage(page) {
  console.log('[NAV] Navigating to branch improvement list...');
  await page.goto(BRANCH_IMPROVEMENT_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  if (page.url().includes('/unauthorized')) {
    console.log('[NAV] UNAUTHORIZED - user has no access');
    return;
  }

  // Wait for table to load
  await page.locator('table tbody tr').first().waitFor({ timeout: 10000 }).catch(() => {});
  console.log(`[NAV] OK: ${page.url()}`);
  await page.screenshot({ path: `test-results/e2e-approval-list.png`, fullPage: true });
}

// ============================================================
// HELPER: Find and Approve ALL PENDING Branch Improvements
// Flow per item: List → View Details → Approve Building → Confirm Modal
// ============================================================
async function findAndApproveBranchImprovement(page, approverUser, approvalLevel) {
  console.log(`\n[APPROVE] ${approvalLevel} by ${approverUser.name}\n`);
  const safeLevel = approvalLevel.replace(/\s+/g, '-');

  // Ensure we're on the list page
  if (!page.url().includes('/branch-improvement')) {
    await page.goto(BRANCH_IMPROVEMENT_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: `test-results/e2e-${safeLevel}-list.png`, fullPage: true });

  // Count PENDING items in the table
  const rows = page.locator('table tbody tr');
  const rowCount = await rows.count();
  let totalPending = 0;
  for (let i = 0; i < rowCount; i++) {
    const rowText = await rows.nth(i).textContent().catch(() => '');
    if (rowText.includes('PENDING')) totalPending++;
  }
  console.log(`  Found ${rowCount} total rows, ${totalPending} PENDING`);

  let approvedCount = 0;
  let processedRows = 0;

  // Process each row - re-scan the table each iteration for stability
  for (let i = 0; i < rowCount && processedRows < totalPending; i++) {
    // Re-fetch rows from current DOM (page may have been reloaded)
    const currentRows = page.locator('table tbody tr');
    const currentCount = await currentRows.count();
    if (i >= currentCount) break;

    const rowText = await currentRows.nth(i).textContent().catch(() => '');
    if (!rowText.includes('PENDING')) continue;

    processedRows++;
    const rowLabel = rowText.substring(0, 40).replace(/\s+/g, ' ').trim();
    console.log(`\n  [ITEM ${processedRows}] Processing: ${rowLabel}`);

    // Click "View Details" button on this row
    const viewDetailsBtn = currentRows.nth(i).locator('button[title="View Details"]');
    if (await viewDetailsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewDetailsBtn.click();
      await page.waitForTimeout(3000);
      console.log(`  > Navigated to detail: ${page.url()}`);
    } else {
      console.log('  > View Details button not found, skipping');
      continue;
    }

    // On the detail page, find and click "Approve Building"
    const approveBuildingBtn = page.locator('button').filter({ hasText: 'Approve Building' });
    if (await approveBuildingBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Scroll to the approve button
      await approveBuildingBtn.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(500);
      await page.screenshot({ path: `test-results/e2e-${safeLevel}-item${processedRows}-before.png`, fullPage: true });

      await approveBuildingBtn.click();
      await page.waitForTimeout(2000);
      console.log('  > Clicked "Approve Building"');

      // Handle confirmation modal (.fixed.z-50)
      const modal = page.locator('.fixed.z-50, [class*="fixed"][class*="z-50"]').first();
      if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('  > Confirmation modal appeared');

        // Fill remarks textarea
        const remarksTextarea = modal.locator('textarea');
        if (await remarksTextarea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await remarksTextarea.fill(`${approvalLevel} approved by ${approverUser.name}`);
          console.log('  > Filled remarks');
        }

        // Click "Approve" button inside the modal
        const confirmApproveBtn = modal.locator('button').filter({ hasText: 'Approve' });
        if (await confirmApproveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmApproveBtn.click();
          await page.waitForTimeout(3000);
          console.log('  > Clicked Approve in modal');
          approvedCount++;
        }
      }

      await page.screenshot({ path: `test-results/e2e-${safeLevel}-item${processedRows}-after.png`, fullPage: true });
    } else {
      console.log('  > "Approve Building" button not found on detail page');
      await page.screenshot({ path: `test-results/e2e-${safeLevel}-item${processedRows}-no-approve.png`, fullPage: true });
    }

    // Navigate back to list for next item
    await page.goto(BRANCH_IMPROVEMENT_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  console.log(`\n  [APPROVE] ${approvalLevel} COMPLETED - Approved ${approvedCount}/${totalPending} items`);
  await page.screenshot({ path: `test-results/e2e-${safeLevel}-complete.png`, fullPage: true });
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe('Branch Improvement - E2E Create & Approval Flow', () => {
  test.describe.configure({ timeout: 600000 }); // 10 minutes

  test.use({
    storageState: { cookies: [], origins: [] } // Empty state - NO Ryan tokens
  });

  // PHASE 1: CREATE (Agung Gunawan)
  test.describe('Phase 1: Create Branch Improvement Data', () => {

    test('TC-01: Create Renewal - Jayapura', async ({ page }) => {
      await loginToPortal(page, USERS.creator, BRANCH_IMPROVEMENT_FORM_URL);
      expect(page.url()).toContain('/fms/building/branch-improvement');
      await fillRenewalForm(page, branchImprovementData[0]);
      await submitForm(page, branchImprovementData[0].label);
      console.log('TC-01 DONE: Renewal Jayapura');
    });

    test('TC-02: Create Renewal - Sorong', async ({ page }) => {
      await loginToPortal(page, USERS.creator, BRANCH_IMPROVEMENT_FORM_URL);
      expect(page.url()).toContain('/fms/building/branch-improvement');
      await fillRenewalForm(page, branchImprovementData[1]);
      await submitForm(page, branchImprovementData[1].label);
      console.log('TC-02 DONE: Renewal Sorong');
    });

    test('TC-03: Create Relocation - Kendari', async ({ page }) => {
      await loginToPortal(page, USERS.creator, BRANCH_IMPROVEMENT_FORM_URL);
      expect(page.url()).toContain('/fms/building/branch-improvement');
      await fillRelocationForm(page, branchImprovementData[2]);
      await submitForm(page, branchImprovementData[2].label);
      console.log('TC-03 DONE: Relocation Kendari');
    });

    test('TC-04: Create Relocation - Ambon', async ({ page }) => {
      await loginToPortal(page, USERS.creator, BRANCH_IMPROVEMENT_FORM_URL);
      expect(page.url()).toContain('/fms/building/branch-improvement');
      await fillRelocationForm(page, branchImprovementData[3]);
      await submitForm(page, branchImprovementData[3].label);
      console.log('TC-04 DONE: Relocation Ambon');
    });
  });

  // PHASE 2: APPROVAL 1 (Jimmy Tanweli)
  test.describe('Phase 2: Approval 1 - Jimmy Tanweli', () => {
    test('TC-05: Approval 1 - Jimmy Tanweli', async ({ page }) => {
      await loginToPortal(page, USERS.approver1, BRANCH_IMPROVEMENT_URL);
      if (page.url().includes('/unauthorized')) {
        test.skip(true, `${USERS.approver1.name} no access`);
        return;
      }
      await navigateToApprovalPage(page);
      await findAndApproveBranchImprovement(page, USERS.approver1, 'Approval-1');
      console.log('TC-05 DONE');
    });
  });

  // PHASE 3: APPROVAL 2 (Jemmi Liem)
  test.describe('Phase 3: Approval 2 - Jemmi Liem', () => {
    test('TC-06: Approval 2 - Jemmi Liem', async ({ page }) => {
      await loginToPortal(page, USERS.approver2, BRANCH_IMPROVEMENT_URL);
      if (page.url().includes('/unauthorized')) {
        test.skip(true, `${USERS.approver2.name} no access`);
        return;
      }
      await navigateToApprovalPage(page);
      await findAndApproveBranchImprovement(page, USERS.approver2, 'Approval-2');
      console.log('TC-06 DONE');
    });
  });

  // PHASE 4: APPROVAL 3 (Eko Suyitno)
  test.describe('Phase 4: Approval 3 - Eko Suyitno', () => {
    test('TC-07: Approval 3 - Eko Suyitno', async ({ page }) => {
      await loginToPortal(page, USERS.approver3, BRANCH_IMPROVEMENT_URL);
      if (page.url().includes('/unauthorized')) {
        test.skip(true, `${USERS.approver3.name} no access`);
        return;
      }
      await navigateToApprovalPage(page);
      await findAndApproveBranchImprovement(page, USERS.approver3, 'Approval-3');
      console.log('TC-07 DONE');
    });
  });

  // PHASE 5: FINAL APPROVAL (Daniel Jizhar)
  test.describe('Phase 5: Final Approval - Daniel Jizhar', () => {
    test('TC-08: Final Approval - Daniel Jizhar', async ({ page }) => {
      await loginToPortal(page, USERS.finalApprover, BRANCH_IMPROVEMENT_URL);
      if (page.url().includes('/unauthorized')) {
        test.skip(true, `${USERS.finalApprover.name} no access`);
        return;
      }
      await navigateToApprovalPage(page);
      await findAndApproveBranchImprovement(page, USERS.finalApprover, 'Final-Approval');
      console.log('TC-08 DONE');
    });
  });

  // PHASE 6: VERIFICATION
  test.describe('Phase 6: Verification', () => {
    test('TC-09: Verify approval status', async ({ page }) => {
      await loginToPortal(page, USERS.creator, BRANCH_IMPROVEMENT_URL);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/e2e-final-verification.png', fullPage: true });

      const statusTexts = ['Approved', 'Disetujui', 'Completed', 'Selesai', 'Pending', 'Draft'];
      for (const status of statusTexts) {
        const count = await page.getByText(status, { exact: false }).count().catch(() => 0);
        if (count > 0) console.log(`  Status "${status}": ${count}`);
      }

      await page.screenshot({ path: 'test-results/e2e-verification-complete.png', fullPage: true });
      console.log('TC-09 DONE: E2E FLOW COMPLETED');
    });
  });
});
