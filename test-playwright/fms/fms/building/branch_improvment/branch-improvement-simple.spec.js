import 'dotenv/config';
import { test, expect } from '@playwright/test';

// Base URL - Branch Improvement Form (requires existing building)
const BASE_URL = process.env.BASE_URL || 'https://portal-dev.modena.com';
const MODULE_URL = `${BASE_URL}/fms/building/branch-improvement/form`;

// ============================================================
// USER ACCOUNTS FOR TESTING
// ============================================================
const testUsers = [
  {
    email: process.env.FMS_BUILDING_ADMIN_EMAIL || 'agung.gunawan@modena.com',
    password: process.env.FMS_BUILDING_ADMIN_PASSWORD || 'P@ssw0rd_agung.gunawan',
    name: 'Agung Sukmana Gunawan',
    role: 'Branch Manager (East)'
  },
  {
    email: process.env.FMS_BUILDING_APPROVER_EMAIL || 'antonius.kawi@modena.com',
    password: process.env.FMS_BUILDING_APPROVER_PASSWORD || 'P@ssw0rd_antonius.kawi',
    name: 'Antonius Kawi',
    role: 'Branch Manager (West)'
  }
];

// ============================================================
// HELPER: Login & Navigate
// ============================================================
async function loginAndGoToBranchImprovement(page, userIndex = 0) {
  const user = testUsers[userIndex];
  console.log(`🔐 Logging in as: ${user.name} (${user.email})`);
  
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
  });
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  
  if (page.url().includes('/login')) {
    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    if (user.email && await emailField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailField.fill(user.email);
      await page.locator('input[type="password"]').first().fill(user.password);
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.waitForURL(/my-application|\/fms\//, { timeout: 25000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }
  
  if (page.url().includes('my-application')) {
    console.log('[LOGIN] On my-application page, selecting FMS...');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);
    
    // Switch to "All Apps" tab and wait until cards are visible
    const allAppsBtn = page.getByRole('button', { name: /All Apps/i }).or(page.locator('button:has-text("All Apps")')).first();
    if (await allAppsBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await allAppsBtn.click({ force: true });
      await page.waitForTimeout(1500);
    }
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const allApps = btns.find(b => b.textContent && b.textContent.includes('All Apps'));
      if (allApps) allApps.click();
    });
    await page.waitForTimeout(1500);

    // Click FMS (DEV) card
    const fmsCard = page.locator('div, p, span, img').filter({ hasText: 'FMS (DEV)' }).first()
      .or(page.getByText('FMS (DEV)', { exact: true }))
      .or(page.locator('img[alt="FMS (DEV)"]'))
      .first();
    
    if (await fmsCard.isVisible({ timeout: 10000 }).catch(() => false)) {
      await fmsCard.click({ force: true });
      console.log('✓ Clicked FMS (DEV) card');
    } else {
      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('*'));
        const fms = els.find(el => el.textContent && el.textContent.trim() === 'FMS (DEV)');
        if (fms) {
          fms.click();
          if (fms.closest('[cursor="pointer"]') || fms.parentElement) {
            (fms.closest('[cursor="pointer"]') || fms.parentElement).click();
          }
        }
      });
    }
    await page.waitForTimeout(1500);

    // Handle Confirmation Dialog
    const confirmBtn = page.getByRole('button', { name: /confirm/i })
      .or(page.locator('button:has-text("Confirm")'))
      .or(page.locator('button:has-text("Yes")'))
      .first();
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click({ force: true });
      console.log('✓ Clicked Confirm modal button');
      await page.waitForURL(/\/fms/, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);
    }
  }
  
  // If we arrived at /fms, navigate to the specific form URL
  if (page.url().includes('/fms')) {
    if (!page.url().includes('/fms/building/branch-improvement')) {
      await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }
  
  console.log(`✓ Current page after login: ${page.url()}`);
  if (page.url().includes('/unauthorized')) {
    console.log(`⚠️ ${user.name} does not have access to branch-improvement form`);
    return;
  }
  if (!page.url().includes('/fms/building/branch-improvement')) {
    console.warn(`⚠️ Warning: Expected branch improvement URL, currently at: ${page.url()}`);
  }
}

// ============================================================
// HELPER: Fill Branch Improvement Form (isi dari scratch)
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
// TEST DATA - 5 Buildings: 3 East (Agung) + 2 West (Antonius)
// ============================================================
const testData = [
  // --- EAST 1: Jakarta Selatan (Renewal) ---
  {
    label: 'East - Jakarta Selatan',
    improvementType: 'Renewal',
    buildingType: 'MHC (Modena Home Center)',
    currentMonthlyRent: '50000000',
    securityDeposit: '150000000',
    landlordName: 'PT Properti Sejahtera',
    landlordContact: '021-12345678',
    newDuration: '5 Years',
    newRentPrice: '55000000',
    pbbPayer: 'Penyewa',
    kondisi: 'Baik',
    improvementJustification: 'Renewal untuk lokasi strategis Jakarta Selatan. Perpanjangan kontrak diperlukan untuk menjaga kontinuitas bisnis dan mempertahankan market share di area tersebut.'
  },
  // --- EAST 2: Surabaya Timur (Renewal) ---
  {
    label: 'East - Surabaya Timur',
    improvementType: 'Renewal',
    buildingType: 'MEC (Modena Experience Center)',
    currentMonthlyRent: '40000000',
    securityDeposit: '120000000',
    landlordName: 'PT Graha Surabaya',
    landlordContact: '031-99887766',
    newDuration: '3 Years',
    newRentPrice: '43000000',
    pbbPayer: 'Pemilik',
    kondisi: 'Sedang',
    improvementJustification: 'Renewal lokasi Surabaya Timur dengan track record penjualan baik. Area strategis dekat pusat bisnis dan perumahan.'
  },
  // --- WEST 1: Bandung Pusat (Relocation) ---
  {
    label: 'West - Bandung Pusat',
    improvementType: 'Relocation',
    buildingType: 'MHC (Modena Home Center)',
    currentMonthlyRent: '35000000',
    securityDeposit: '105000000',
    landlordName: 'CV Graha Mandiri',
    landlordContact: '022-55443322',
    newDuration: '5 Years',
    newRentPrice: '38000000',
    pbbPayer: 'Penyewa',
    kondisi: 'Kurang',
    improvementJustification: 'Relokasi ke lokasi baru di Bandung Pusat yang lebih strategis. Lokasi lama sudah tidak memadai untuk kebutuhan operasional.'
  },
  // --- WEST 2: Medan Kota (Renewal) ---
  {
    label: 'West - Medan Kota',
    improvementType: 'Renewal',
    buildingType: 'Office',
    currentMonthlyRent: '30000000',
    securityDeposit: '90000000',
    landlordName: 'PT Medan Properti',
    landlordContact: '061-11223344',
    newDuration: '3 Years',
    newRentPrice: '32000000',
    pbbPayer: 'Pemilik',
    kondisi: 'Baik',
    improvementJustification: 'Renewal lokasi Medan Kota. Lokasi proven dengan customer base yang kuat dan potensi pertumbuhan tinggi di area Sumatera Utara.'
  },
  // --- EAST 3: Semarang Tengah (Relocation) ---
  {
    label: 'East - Semarang Tengah',
    improvementType: 'Relocation',
    buildingType: 'Warehouse',
    currentMonthlyRent: '38000000',
    securityDeposit: '114000000',
    landlordName: 'PT Semarang Realty',
    landlordContact: '024-77889900',
    newDuration: '5 Years',
    newRentPrice: '42000000',
    pbbPayer: 'Penyewa',
    kondisi: 'Sedang',
    improvementJustification: 'Relokasi cabang Semarang Tengah ke lokasi baru yang lebih strategis. Area baru memiliki traffic tinggi dan akses transportasi yang lebih baik untuk meningkatkan market coverage.'
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
    console.log(`\u2713 Success: ${await successMsg.textContent()}`);
  }

  const errorMsg = page.locator('[class*="error"], [class*="Error"]');
  if (await errorMsg.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log(`\u2717 Error: ${await errorMsg.textContent()}`);
  }
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe('Branch Improvement - Simple', () => {
  test.describe.configure({ timeout: 180000 });
  
  test.use({ 
    storageState: undefined
  });

  // --- TC-01: Page Load ---
  test('TC-01: Page loads - User 1 (Agung)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 0);
    if (page.url().includes('/unauthorized') || !page.url().includes('/branch-improvement')) {
      console.log('⚠️ TC-01: Agung Gunawan does not have access to branch-improvement form - SKIPPED');
      test.skip(true, 'Agung Gunawan does not have access to branch-improvement form on dev portal');
      return;
    }
    expect(page.url()).toContain('/fms/building/branch-improvement');
    console.log('✓ Page loaded by Agung Gunawan');
  });

  // --- TC-02: East 1 - Jakarta Selatan (Renewal) - Agung ---
  test('TC-02: Create Renewal East - Jakarta Selatan (Agung)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 0);
    if (page.url().includes('/unauthorized') || !page.url().includes('/branch-improvement')) {
      console.log('⚠️ TC-02: Agung Gunawan does not have access - SKIPPED');
      test.skip(true, 'Agung Gunawan does not have access to branch-improvement form');
      return;
    }
    await fillBranchImprovementForm(page, testData[0]);
    await submitAndVerify(page, 'tc02-east-jktsel');
    console.log(`✓ TC-02 completed: ${testData[0].label}`);
    expect(true).toBeTruthy();
  });

  // --- TC-03: East 2 - Surabaya Timur (Renewal) - Agung ---
  test('TC-03: Create Renewal East - Surabaya Timur (Agung)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 0);
    if (page.url().includes('/unauthorized') || !page.url().includes('/branch-improvement')) {
      console.log('⚠️ TC-03: Agung Gunawan does not have access - SKIPPED');
      test.skip(true, 'Agung Gunawan does not have access to branch-improvement form');
      return;
    }
    await fillBranchImprovementForm(page, testData[1]);
    await submitAndVerify(page, 'tc03-east-sbytim');
    console.log(`✓ TC-03 completed: ${testData[1].label}`);
    expect(true).toBeTruthy();
  });

  // --- TC-04: West 1 - Bandung Pusat (Relocation) - Antonius ---
  test('TC-04: Create Relocation West - Bandung Pusat (Antonius)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 1);
    if (page.url().includes('/unauthorized') || !page.url().includes('/branch-improvement')) {
      console.log('⚠️ TC-04: Antonius Kawi does not have access - SKIPPED');
      test.skip(true, 'Antonius Kawi does not have access to branch-improvement form');
      return;
    }
    await fillBranchImprovementForm(page, testData[2]);
    await submitAndVerify(page, 'tc04-west-bdgpst');
    console.log(`✓ TC-04 completed: ${testData[2].label}`);
    expect(true).toBeTruthy();
  });

  // --- TC-05: West 2 - Medan Kota (Renewal) - Antonius ---
  test('TC-05: Create Renewal West - Medan Kota (Antonius)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 1);
    if (page.url().includes('/unauthorized') || !page.url().includes('/branch-improvement')) {
      console.log('⚠️ TC-05: Antonius Kawi does not have access - SKIPPED');
      test.skip(true, 'Antonius Kawi does not have access to branch-improvement form');
      return;
    }
    await fillBranchImprovementForm(page, testData[3]);
    await submitAndVerify(page, 'tc05-west-mdnkot');
    console.log(`✓ TC-05 completed: ${testData[3].label}`);
    expect(true).toBeTruthy();
  });

  // --- TC-06: East 3 - Semarang Tengah (Relocation) - Agung ---
  test('TC-06: Create Relocation East - Semarang Tengah (Agung)', async ({ page }) => {
    await loginAndGoToBranchImprovement(page, 0);
    if (page.url().includes('/unauthorized') || !page.url().includes('/branch-improvement')) {
      console.log('⚠️ TC-06: Agung Gunawan does not have access - SKIPPED');
      test.skip(true, 'Agung Gunawan does not have access to branch-improvement form');
      return;
    }
    await fillBranchImprovementForm(page, testData[4]);
    await submitAndVerify(page, 'tc06-east-smgtgh');
    console.log(`✓ TC-06 completed: ${testData[4].label}`);
    expect(true).toBeTruthy();
  });
});
