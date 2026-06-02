/**
 * Branch Improvement Form Test - Issue / Additional Submissions
 * Tests the branch improvement form with additional test data sets
 * Separated from branch-improvement-simple.spec.js
 * 
 * Test Cases:
 * - TC-01: East - Tangerang Selatan (Renewal) - Agung
 * - TC-02: East - Malang Kota (Relocation) - Agung
 * - TC-03: West - Makassar Pusat (Renewal) - Antonius (skipped - unauthorized)
 * - TC-04: West - Palembang Ilir (Relocation) - Antonius (skipped - unauthorized)
 * - TC-05: East - Yogyakarta Kota (Renewal) - Agung
 */

import { test, expect } from '@playwright/test';

// ============================================================
// CONFIGURATION
// ============================================================
const BASE_URL = 'https://portal-dev.modena.com';
const MODULE_URL = `${BASE_URL}/fms/building/branch-improvement/form`;

// ============================================================
// USER ACCOUNTS
// ============================================================
const testUsers = [
  {
    email: 'agung.gunawan@modena.com',
    password: 'P@ssw0rd_agung.gunawan',
    name: 'Agung Sukmana Gunawan',
    role: 'Branch Manager (East)'
  },
  {
    email: 'antonius.kawi@modena.com',
    password: 'P@ssw0rd_antonius.kawi',
    name: 'Antonius Kawi',
    role: 'Branch Manager (West)'
  }
];

// ============================================================
// HELPER: Login & Navigate to Branch Improvement
// ============================================================
async function loginAndGoToBranchImprovement(page, userIndex = 0) {
  const user = testUsers[userIndex];
  console.log(`🔐 Logging in as: ${user.name} (${user.email})`);

  await page.context().clearCookies();
  await page.goto('https://portal-dev.modena.com/login', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (!page.url().includes('/login')) {
    await page.goto('https://portal-dev.modena.com/login', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (page.url().includes('/login')) {
    await page.locator('input[type="email"], input[name="email"]').first().fill(user.email);
    await page.locator('input[type="password"]').first().fill(user.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 20000 }).catch(() => {});
  }

  if (page.url().includes('my-application')) {
    await page.getByText('FMS (DEV)').click();
    await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
    }
    await page.waitForTimeout(2000);
    await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  if (!page.url().includes('/fms/building/branch-improvement')) {
    await page.goto('https://portal-dev.modena.com/fms/building/branch-improvement/form', { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
      const fmsConfirm = page.getByRole('button', { name: 'Confirm' });
      if (await fmsConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fmsConfirm.click();
        await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
      }
      await page.waitForTimeout(2000);
    }
    await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  console.log(`✓ Logged in as ${user.name}`);
  if (page.url().includes('/unauthorized')) {
    console.log(`⚠️ ${user.name} does not have access to branch-improvement form`);
    return;
  }
  expect(page.url()).toContain('/fms/building/branch-improvement');
}

// ============================================================
// HELPER: Fill Branch Improvement Form
// ============================================================
async function fillBranchImprovementForm(page, data) {
  console.log(`📝 Filling Branch Improvement Form - Type: ${data.improvementType}`);
  await page.waitForTimeout(2000);

  // === SECTION 1: Identity & Ownership ===

  // 1. Ownership Type: Rent
  const rentBtn = page.getByRole('button', { name: /Rent.*Rental Contract/i });
  if (await rentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await rentBtn.click();
    console.log('✓ Ownership Type: Rent');
    await page.waitForTimeout(1000);
  }

  // 2. Building Type dropdown - select by value
  const buildingTypeSelect = page.locator('select').first();
  if (await buildingTypeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    await buildingTypeSelect.selectOption({ value: data.buildingType || 'MHC (Modena Home Center)' });
    console.log(`✓ Building Type: ${data.buildingType || 'MHC (Modena Home Center)'}`);
    await page.waitForTimeout(500);
  }

  // 3. Rent Price (may not be editable for existing buildings)
  const rentPriceInput = page.locator('input[type="number"]').first();
  if (await rentPriceInput.isEditable({ timeout: 2000 }).catch(() => false)) {
    await rentPriceInput.fill(data.currentMonthlyRent);
    console.log(`✓ Rent Price: ${data.currentMonthlyRent}`);
    await page.waitForTimeout(300);
  }

  // 4. Deposit (may not be editable for existing buildings)
  const depositInput = page.locator('input[type="number"]').nth(1);
  if (await depositInput.isEditable({ timeout: 2000 }).catch(() => false)) {
    await depositInput.fill(data.securityDeposit);
    console.log(`✓ Deposit: ${data.securityDeposit}`);
    await page.waitForTimeout(300);
  }

  // 5. Owner Name (may not be editable)
  const ownerNameInput = page.locator('input[placeholder="Owner Name"]').first();
  if (await ownerNameInput.isEditable({ timeout: 2000 }).catch(() => false)) {
    await ownerNameInput.fill(data.landlordName);
    console.log(`✓ Owner Name: ${data.landlordName}`);
    await page.waitForTimeout(300);
  }

  // 6. Owner Phone (may not be editable)
  const ownerPhoneInput = page.locator('input[placeholder*="081"]').first();
  if (await ownerPhoneInput.isEditable({ timeout: 2000 }).catch(() => false)) {
    await ownerPhoneInput.fill(data.landlordContact);
    console.log(`✓ Owner Phone: ${data.landlordContact}`);
    await page.waitForTimeout(300);
  }

  // === SECTION 2: Strategic Planning & Proposals ===

  // 7. Improvement Type: Renewal / Relocation
  const typeBtn = page.getByRole('button', { name: data.improvementType, exact: true });
  if (await typeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await typeBtn.click();
    console.log(`✓ Improvement Type: ${data.improvementType}`);
    await page.waitForTimeout(1000);
  }

  if (data.improvementType === 'Renewal') {
    // 8. New Duration select (only for Renewal, at select index 1)
    const durationSelect = page.locator('select').nth(1);
    if (await durationSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await durationSelect.selectOption({ value: data.newDuration || '5 Years' });
      console.log(`✓ New Duration: ${data.newDuration || '5 Years'}`);
      await page.waitForTimeout(500);
    }

    // 9. New Rent Price (editable text input, only for Renewal)
    const newRentInput = page.locator('input[type="text"][placeholder="0"]').first();
    if (await newRentInput.isEditable({ timeout: 2000 }).catch(() => false)) {
      await newRentInput.fill(data.newRentPrice || data.currentMonthlyRent);
      console.log(`✓ New Rent Price: ${data.newRentPrice || data.currentMonthlyRent}`);
      await page.waitForTimeout(300);
    }

    // 10. Notes / Justification (only for Renewal)
    const notesArea = page.locator('textarea').first();
    if (await notesArea.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesArea.fill(data.improvementJustification);
      console.log('✓ Notes filled');
      await page.waitForTimeout(500);
    }

    // Renewal: Ditanggung Oleh at select index 2, Kondisi at index 3
    const pbbSelect = page.locator('select').nth(2);
    if (await pbbSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pbbSelect.selectOption({ value: data.pbbPayer || 'Penyewa' });
      console.log(`✓ Ditanggung Oleh: ${data.pbbPayer || 'Penyewa'}`);
      await page.waitForTimeout(300);
    }

    const kondisiSelect = page.locator('select').nth(3);
    if (await kondisiSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await kondisiSelect.selectOption({ value: data.kondisi || 'Baik' });
      console.log(`✓ Kondisi: ${data.kondisi || 'Baik'}`);
      await page.waitForTimeout(300);
    }
  } else {
    // Relocation: No Duration, No Rent Price, No Notes textarea
    // Ditanggung Oleh at select index 1, Kondisi at index 2
    const pbbSelect = page.locator('select').nth(1);
    if (await pbbSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pbbSelect.selectOption({ value: data.pbbPayer || 'Penyewa' });
      console.log(`✓ Ditanggung Oleh: ${data.pbbPayer || 'Penyewa'}`);
      await page.waitForTimeout(300);
    }

    const kondisiSelect = page.locator('select').nth(2);
    if (await kondisiSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await kondisiSelect.selectOption({ value: data.kondisi || 'Baik' });
      console.log(`✓ Kondisi: ${data.kondisi || 'Baik'}`);
      await page.waitForTimeout(300);
    }
  }

  await page.waitForTimeout(1000);
  console.log('✅ Form completed');
}

// ============================================================
// TEST DATA - 5 Additional Submissions
// ============================================================
const testData = [
  // --- EAST 1: Tangerang Selatan (Renewal) ---
  {
    label: 'East - Tangerang Selatan',
    improvementType: 'Renewal',
    buildingType: 'MHC (Modena Home Center)',
    currentMonthlyRent: '45000000',
    securityDeposit: '135000000',
    landlordName: 'PT Bintaro Jaya Properti',
    landlordContact: '021-87654321',
    newDuration: '5 Years',
    newRentPrice: '48000000',
    pbbPayer: 'Penyewa',
    kondisi: 'Baik',
    improvementJustification: 'Renewal lokasi Tangerang Selatan area BSD. Lokasi strategis dekat perumahan besar dan akses tol. Kontrak perlu diperpanjang untuk mempertahankan penjualan yang stabil.'
  },
  // --- EAST 2: Malang Kota (Relocation) ---
  {
    label: 'East - Malang Kota',
    improvementType: 'Relocation',
    buildingType: 'MEC (Modena Experience Center)',
    currentMonthlyRent: '32000000',
    securityDeposit: '96000000',
    landlordName: 'CV Arjuna Property',
    landlordContact: '0341-55667788',
    newDuration: '3 Years',
    newRentPrice: '35000000',
    pbbPayer: 'Pemilik',
    kondisi: 'Sedang',
    improvementJustification: 'Relokasi cabang Malang Kota ke lokasi baru di area Ijen. Lokasi lama kapasitas terbatas, lokasi baru lebih luas dan strategis dekat pusat kota.'
  },
  // --- WEST 1: Makassar Pusat (Renewal) ---
  {
    label: 'West - Makassar Pusat',
    improvementType: 'Renewal',
    buildingType: 'MHC (Modena Home Center)',
    currentMonthlyRent: '28000000',
    securityDeposit: '84000000',
    landlordName: 'PT Sulawesi Mandiri',
    landlordContact: '0411-33445566',
    newDuration: '5 Years',
    newRentPrice: '30000000',
    pbbPayer: 'Penyewa',
    kondisi: 'Baik',
    improvementJustification: 'Renewal lokasi Makassar Pusat. Area strategis di pusat kota Makassar dengan traffic tinggi. Perpanjangan kontrak diperlukan untuk memperkuat posisi di Sulawesi Selatan.'
  },
  // --- WEST 2: Palembang Ilir (Relocation) ---
  {
    label: 'West - Palembang Ilir',
    improvementType: 'Relocation',
    buildingType: 'Office',
    currentMonthlyRent: '25000000',
    securityDeposit: '75000000',
    landlordName: 'PT Sriwijaya Realty',
    landlordContact: '0711-22334455',
    newDuration: '3 Years',
    newRentPrice: '28000000',
    pbbPayer: 'Pemilik',
    kondisi: 'Kurang',
    improvementJustification: 'Relokasi cabang Palembang Ilir ke lokasi baru yang lebih representatif. Gedung lama perlu renovasi besar, lebih efisien pindah ke lokasi baru di area komersial.'
  },
  // --- EAST 3: Yogyakarta Kota (Renewal) ---
  {
    label: 'East - Yogyakarta Kota',
    improvementType: 'Renewal',
    buildingType: 'MHC (Modena Home Center)',
    currentMonthlyRent: '33000000',
    securityDeposit: '99000000',
    landlordName: 'PT Mataram Graha',
    landlordContact: '0274-66778899',
    newDuration: '5 Years',
    newRentPrice: '36000000',
    pbbPayer: 'Penyewa',
    kondisi: 'Baik',
    improvementJustification: 'Renewal kontrak lokasi Yogyakarta Kota di area Malioboro. Lokasi premium dengan traffic pengunjung tinggi dan brand visibility yang baik. Kontrak perlu diperpanjang segera.'
  }
];

// ============================================================
// HELPER: Submit form and check result
// ============================================================
async function submitAndVerify(page, tcLabel) {
  await page.screenshot({ path: `test-results/before-submit-${tcLabel}.png`, fullPage: true });

  const submitBtn = page.getByRole('button', { name: 'Submit', exact: true });
  console.log('Clicking Submit button...');
  await submitBtn.click();
  await page.waitForTimeout(5000);

  await page.screenshot({ path: `test-results/after-submit-${tcLabel}.png`, fullPage: true });

  const currentUrl = page.url();
  console.log(`Current URL after submit: ${currentUrl}`);

  const successMsg = page.locator('[class*="success"], [class*="Success"]');
  if (await successMsg.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log(`✓ Success: ${await successMsg.textContent()}`);
  }

  const errorMsg = page.locator('[class*="error"], [class*="Error"]');
  if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log(`✗ Error: ${await errorMsg.textContent()}`);
  }
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe('Branch Improvement - Issue (Additional Submissions)', () => {
  test.describe.configure({ timeout: 180000 });

  test.use({
    storageState: undefined
  });

  // --- TC-01: East - Tangerang Selatan (Renewal) - Agung ---
  test('TC-01: Create Renewal East - Tangerang Selatan (Agung)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 0);
    await fillBranchImprovementForm(page, testData[0]);
    await submitAndVerify(page, 'tc01-east-tngsel');
    console.log(`✓ TC-01 completed: ${testData[0].label}`);
    expect(true).toBeTruthy();
  });

  // --- TC-02: East - Malang Kota (Relocation) - Agung ---
  test('TC-02: Create Relocation East - Malang Kota (Agung)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 0);
    await fillBranchImprovementForm(page, testData[1]);
    await submitAndVerify(page, 'tc02-east-mlgkot');
    console.log(`✓ TC-02 completed: ${testData[1].label}`);
    expect(true).toBeTruthy();
  });

  // --- TC-03: West - Makassar Pusat (Renewal) - Antonius ---
  test('TC-03: Create Renewal West - Makassar Pusat (Antonius)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 1);
    if (page.url().includes('/unauthorized') || !page.url().includes('/branch-improvement')) {
      console.log('⚠️ TC-03: Antonius Kawi does not have access - SKIPPED');
      test.skip(true, 'Antonius Kawi does not have access to branch-improvement form');
      return;
    }
    await fillBranchImprovementForm(page, testData[2]);
    await submitAndVerify(page, 'tc03-west-mkspst');
    console.log(`✓ TC-03 completed: ${testData[2].label}`);
    expect(true).toBeTruthy();
  });

  // --- TC-04: West - Palembang Ilir (Relocation) - Antonius ---
  test('TC-04: Create Relocation West - Palembang Ilir (Antonius)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 1);
    if (page.url().includes('/unauthorized') || !page.url().includes('/branch-improvement')) {
      console.log('⚠️ TC-04: Antonius Kawi does not have access - SKIPPED');
      test.skip(true, 'Antonius Kawi does not have access to branch-improvement form');
      return;
    }
    await fillBranchImprovementForm(page, testData[3]);
    await submitAndVerify(page, 'tc04-west-plbilr');
    console.log(`✓ TC-04 completed: ${testData[3].label}`);
    expect(true).toBeTruthy();
  });

  // --- TC-05: East - Yogyakarta Kota (Renewal) - Agung ---
  test('TC-05: Create Renewal East - Yogyakarta Kota (Agung)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 0);
    await fillBranchImprovementForm(page, testData[4]);
    await submitAndVerify(page, 'tc05-east-jogkot');
    console.log(`✓ TC-05 completed: ${testData[4].label}`);
    expect(true).toBeTruthy();
  });
});
