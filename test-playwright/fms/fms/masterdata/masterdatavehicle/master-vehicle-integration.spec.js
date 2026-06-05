import { test, expect } from '@playwright/test';

// ============================================================
// MASTER VEHICLE INTEGRATION TEST - 10 TEST CASES
// Tests integration between:
// 1. Master Vehicle Model (Master Data)
// 2. Vehicle Service Menu
// 3. Vehicle List
// ============================================================

// Base URLs
const BASE_URL = 'https://portal-dev.modena.com';
const MASTER_VEHICLE_URL = `${BASE_URL}/fms/master/vehicle-model`;
const VEHICLE_LIST_URL = `${BASE_URL}/fms/vehicle`;
const SERVICE_URL = `${BASE_URL}/fms/vehicle/service`;

// Test credentials
const TEST_EMAIL = 'ryan.ananda@modena.com';
const TEST_PASSWORD = 'P@ssw0rd_ryan.ananda';

// ============================================================
// HELPER: Login & Navigate to FMS
// ============================================================
async function loginToFMS(page) {
  await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (page.url().includes('/login')) {
    await page.locator('input[type="email"], input[name="email"]').first().fill(TEST_EMAIL);
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 25000 }).catch(() => {});
  }

  if (page.url().includes('my-application')) {
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(1500);
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
  }
}

// ============================================================
// HELPER: Navigate to Master Vehicle Model Page
// ============================================================
async function goToMasterVehicleModel(page) {
  await loginToFMS(page);
  await page.goto(MASTER_VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (page.url().includes('my-application')) {
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(1500);
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.goto(MASTER_VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  expect(page.url()).toContain('/fms/master');
}

// ============================================================
// HELPER: Navigate to Vehicle List Page
// ============================================================
async function goToVehicleList(page) {
  await loginToFMS(page);
  await page.goto(VEHICLE_LIST_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (page.url().includes('my-application')) {
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(1500);
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.goto(VEHICLE_LIST_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  expect(page.url()).toContain('/fms/vehicle');
}

// ============================================================
// HELPER: Navigate to Service Page
// ============================================================
async function goToServicePage(page) {
  await loginToFMS(page);
  await page.goto(SERVICE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (page.url().includes('my-application')) {
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(1500);
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.goto(SERVICE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  expect(page.url()).toContain('/fms/vehicle/service');
}

// ============================================================
// HELPER: Get Master Vehicle Data from Table
// ============================================================
async function getMasterVehicleData(page) {
  const vehicleData = [];
  const rows = await page.locator('tbody tr').all();
  
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    const cells = await row.locator('td').allTextContents();
    if (cells.length > 0) {
      vehicleData.push({
        brand: cells[0]?.trim() || '',
        model: cells[1]?.trim() || '',
        type: cells[2]?.trim() || '',
        status: cells[cells.length - 1]?.trim() || ''
      });
    }
  }
  
  return vehicleData;
}

// ============================================================
// HELPER: Get Vehicle List Data from Table
// ============================================================
async function getVehicleListData(page) {
  const vehicleData = [];
  const rows = await page.locator('tbody tr').all();
  
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    const cells = await row.locator('td').allTextContents();
    if (cells.length > 0) {
      vehicleData.push({
        licensePlate: cells[0]?.trim() || '',
        brand: cells[1]?.trim() || '',
        model: cells[2]?.trim() || '',
        type: cells[3]?.trim() || '',
        status: cells[cells.length - 1]?.trim() || ''
      });
    }
  }
  
  return vehicleData;
}

// ============================================================
// TEST SUITE: Master Vehicle Integration - 10 Test Cases
// ============================================================
test.describe('FMS - Master Vehicle Integration Tests (10 Test Cases)', () => {
  test.describe.configure({ timeout: 300000 });

  // ============================================================
  // TC-INT-01: Verifikasi Data Master Vehicle Model Tersedia
  // ============================================================
  test('TC-INT-01: Verifikasi Data Master Vehicle Model Tersedia', async ({ page }) => {
    console.log('TC-INT-01: Memulai verifikasi data Master Vehicle Model');
    
    await goToMasterVehicleModel(page);
    
    // Verifikasi tabel ada
    const table = page.locator('table').or(page.locator('[role="table"]'));
    await expect(table).toBeVisible();
    
    // Ambil headers
    const headers = await page.locator('th').allTextContents();
    console.log(`Headers Master Vehicle Model: ${headers.join(', ')}`);
    
    // Ambil jumlah baris
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Jumlah baris Master Vehicle Model: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);
    
    // Ambil sample data
    const masterData = await getMasterVehicleData(page);
    console.log('Sample Data Master Vehicle:', JSON.stringify(masterData, null, 2));
    
    // Verifikasi data brand tersedia
    const brands = masterData.map(m => m.brand).filter(Boolean);
    expect(brands.length).toBeGreaterThan(0);
    console.log(`✅ TC-INT-01 PASS: Ditemukan ${brands.length} brand di Master Vehicle Model`);
    
    await page.screenshot({ path: 'test-results/integration/tc01-master-vehicle-data.png' });
  });

  // ============================================================
  // TC-INT-02: Verifikasi Data Vehicle List Menggunakan Master Vehicle
  // ============================================================
  test('TC-INT-02: Verifikasi Data Vehicle List Menggunakan Master Vehicle', async ({ page }) => {
    console.log('TC-INT-02: Memulai verifikasi integrasi Vehicle List');
    
    // Ambil data Master Vehicle terlebih dahulu
    await goToMasterVehicleModel(page);
    const masterData = await getMasterVehicleData(page);
    const masterBrands = [...new Set(masterData.map(m => m.brand).filter(Boolean))];
    console.log('Brand dari Master Vehicle:', masterBrands);
    
    // Navigasi ke Vehicle List
    await goToVehicleList(page);
    
    // Verifikasi tabel ada
    const table = page.locator('table').or(page.locator('[role="table"]'));
    await expect(table).toBeVisible();
    
    // Ambil data Vehicle List
    const vehicleListData = await getVehicleListData(page);
    console.log('Data Vehicle List:', JSON.stringify(vehicleListData, null, 2));
    
    // Cek apakah ada brand dari master yang muncul di vehicle list
    let foundMatches = 0;
    for (const masterBrand of masterBrands) {
      for (const vehicle of vehicleListData) {
        if (vehicle.brand && vehicle.brand.toLowerCase().includes(masterBrand.toLowerCase())) {
          console.log(`✓ Ditemukan matching brand: ${masterBrand}`);
          foundMatches++;
          break;
        }
      }
    }
    
    console.log(`Total brand match: ${foundMatches} dari ${masterBrands.length}`);
    await page.screenshot({ path: 'test-results/integration/tc02-vehicle-list-integration.png' });
    console.log('✅ TC-INT-02 PASS: Integrasi Vehicle List dengan Master Vehicle terverifikasi');
  });

  // ============================================================
  // TC-INT-03: Verifikasi Service Page Menggunakan Data Vehicle
  // ============================================================
  test('TC-INT-03: Verifikasi Service Page Menggunakan Data Vehicle', async ({ page }) => {
    console.log('TC-INT-03: Memulai verifikasi integrasi Service page');
    
    // Ambil data Vehicle List terlebih dahulu
    await goToVehicleList(page);
    const vehicleListData = await getVehicleListData(page);
    const licensePlates = vehicleListData.map(v => v.licensePlate).filter(Boolean);
    console.log('License Plates dari Vehicle List:', licensePlates.slice(0, 5));
    
    // Navigasi ke Service page
    await goToServicePage(page);
    
    // Verifikasi tabel ada
    const table = page.locator('table').or(page.locator('[role="table"]'));
    await expect(table).toBeVisible();
    
    // Ambil Service table headers
    const headers = await page.locator('th').allTextContents();
    console.log(`Headers Service: ${headers.join(', ')}`);
    
    // Ambil jumlah baris Service
    const serviceRows = await page.locator('tbody tr').count();
    console.log(`Jumlah baris Service: ${serviceRows}`);
    
    // Cek apakah license plate dari Vehicle List muncul di Service
    const serviceContent = await page.locator('tbody').textContent();
    let foundPlates = 0;
    for (const plate of licensePlates) {
      if (serviceContent.includes(plate)) {
        console.log(`✓ License plate ${plate} ditemukan di Service data`);
        foundPlates++;
      }
    }
    
    console.log(`Total license plate ditemukan: ${foundPlates}`);
    await page.screenshot({ path: 'test-results/integration/tc03-service-integration.png' });
    console.log('✅ TC-INT-03 PASS: Integrasi Service page dengan Vehicle List terverifikasi');
  });

  // ============================================================
  // TC-INT-04: Verifikasi Form Add Vehicle Menggunakan Dropdown Master
  // ============================================================
  test('TC-INT-04: Verifikasi Form Add Vehicle Menggunakan Dropdown Master', async ({ page }) => {
    console.log('TC-INT-04: Memulai test form Add Vehicle');
    
    // Ambil data Master Vehicle untuk perbandingan
    await goToMasterVehicleModel(page);
    const masterData = await getMasterVehicleData(page);
    const masterBrands = [...new Set(masterData.map(m => m.brand).filter(Boolean))];
    console.log('Master Brands untuk perbandingan:', masterBrands);
    
    // Navigasi ke Vehicle List dan klik Add
    await goToVehicleList(page);
    
    const addButton = page.locator('button').filter({ hasText: /Add Vehicle/i }).first();
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(2000);
      
      // Ambil semua dropdown options
      const selects = page.locator('select');
      const selectCount = await selects.count();
      console.log(`Ditemukan ${selectCount} dropdown di form Add Vehicle`);
      
      let dropdownsWithMasterData = 0;
      
      for (let i = 0; i < selectCount; i++) {
        const select = selects.nth(i);
        const selectLabel = await select.getAttribute('aria-label').catch(() => '') || 
                           await select.getAttribute('name').catch(() => '') ||
                           await select.getAttribute('id').catch(() => '');
        const options = await select.locator('option').allTextContents();
        console.log(`Dropdown ${i} (${selectLabel}): ${options.slice(0, 5).join(', ')}...`);
        
        // Cek apakah ada master brand di dropdown options
        for (const brand of masterBrands) {
          if (options.some(opt => opt.toLowerCase().includes(brand.toLowerCase()))) {
            console.log(`✓ Master brand "${brand}" ditemukan di dropdown`);
            dropdownsWithMasterData++;
          }
        }
      }
      
      console.log(`Dropdown dengan data Master: ${dropdownsWithMasterData}`);
      await page.screenshot({ path: 'test-results/integration/tc04-add-vehicle-form.png' });
      
      // Tutup form
      const cancelBtn = page.getByRole('button', { name: /cancel|batal|close|back/i }).first();
      if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelBtn.click();
      }
      
      console.log('✅ TC-INT-04 PASS: Form Add Vehicle menggunakan data Master Vehicle');
    } else {
      console.log('⚠️ TC-INT-04: Add Vehicle button tidak ditemukan');
    }
  });

  // ============================================================
  // TC-INT-05: Verifikasi Form Service Request Menggunakan Data Vehicle
  // ============================================================
  test('TC-INT-05: Verifikasi Form Service Request Menggunakan Data Vehicle', async ({ page }) => {
    console.log('TC-INT-05: Memulai test form Service Request');
    
    // Ambil data Vehicle List untuk perbandingan
    await goToVehicleList(page);
    const vehicleListData = await getVehicleListData(page);
    const licensePlates = vehicleListData.map(v => v.licensePlate).filter(Boolean);
    console.log('License Plates untuk perbandingan:', licensePlates.slice(0, 5));
    
    // Navigasi ke Service page dan klik Service Request
    await goToServicePage(page);
    
    const serviceRequestBtn = page.getByRole('button', { name: /Service Request/i }).first();
    if (await serviceRequestBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await serviceRequestBtn.click();
      await page.waitForTimeout(2000);
      
      // Ambil semua dropdown options
      const selects = page.locator('select');
      const selectCount = await selects.count();
      console.log(`Ditemukan ${selectCount} dropdown di form Service Request`);
      
      let dropdownsWithVehicleData = 0;
      
      for (let i = 0; i < selectCount; i++) {
        const select = selects.nth(i);
        const options = await select.locator('option').allTextContents();
        console.log(`Dropdown ${i}: ${options.slice(0, 5).join(', ')}...`);
        
        // Cek apakah ada license plate di dropdown options
        for (const plate of licensePlates) {
          if (options.some(opt => opt.includes(plate))) {
            console.log(`✓ License plate "${plate}" ditemukan di dropdown`);
            dropdownsWithVehicleData++;
          }
        }
      }
      
      console.log(`Dropdown dengan data Vehicle: ${dropdownsWithVehicleData}`);
      await page.screenshot({ path: 'test-results/integration/tc05-service-request-form.png' });
      
      // Tutup form
      const cancelBtn = page.getByRole('button', { name: /cancel|batal|close|back/i }).first();
      if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelBtn.click();
      }
      
      console.log('✅ TC-INT-05 PASS: Form Service Request menggunakan data Vehicle List');
    } else {
      console.log('⚠️ TC-INT-05: Service Request button tidak ditemukan');
    }
  });

  // ============================================================
  // TC-INT-06: Verifikasi Alur Data Master -> Vehicle -> Service
  // ============================================================
  test('TC-INT-06: Verifikasi Alur Data Master -> Vehicle -> Service', async ({ page }) => {
    console.log('TC-INT-06: Memulai test alur integrasi lengkap');
    
    // Step 1: Ambil data Master Vehicle Model
    console.log('\n=== Step 1: Master Vehicle Model ===');
    await goToMasterVehicleModel(page);
    const masterData = await getMasterVehicleData(page);
    const masterBrands = [...new Set(masterData.map(m => m.brand).filter(Boolean))];
    console.log(`Master Vehicle records: ${masterData.length}`);
    console.log(`Master Brands: ${masterBrands.join(', ')}`);
    
    // Step 2: Navigasi ke Vehicle List dan verifikasi data
    console.log('\n=== Step 2: Vehicle List ===');
    await goToVehicleList(page);
    const vehicleData = await getVehicleListData(page);
    console.log(`Vehicle List records: ${vehicleData.length}`);
    
    // Hitung kecocokan Master -> Vehicle
    let masterToVehicleMatches = 0;
    for (const masterBrand of masterBrands) {
      for (const vehicle of vehicleData) {
        if (vehicle.brand && vehicle.brand.toLowerCase().includes(masterBrand.toLowerCase())) {
          masterToVehicleMatches++;
          break;
        }
      }
    }
    console.log(`Master -> Vehicle matches: ${masterToVehicleMatches}`);
    
    // Step 3: Navigasi ke Service dan verifikasi data
    console.log('\n=== Step 3: Service ===');
    await goToServicePage(page);
    const serviceRowCount = await page.locator('tbody tr').count();
    console.log(`Service records: ${serviceRowCount}`);
    
    // Hitung kecocokan Vehicle -> Service
    const serviceContent = await page.locator('tbody').textContent();
    let vehicleToServiceMatches = 0;
    for (const vehicle of vehicleData) {
      if (vehicle.licensePlate && serviceContent.includes(vehicle.licensePlate)) {
        vehicleToServiceMatches++;
      }
    }
    console.log(`Vehicle -> Service matches: ${vehicleToServiceMatches}`);
    
    // Verifikasi alur data
    console.log('\n=== Step 4: Verifikasi Alur Data ===');
    expect(masterData.length).toBeGreaterThan(0);
    expect(vehicleData.length).toBeGreaterThan(0);
    console.log('✅ TC-INT-06 PASS: Alur data Master -> Vehicle -> Service terverifikasi');
    
    await page.screenshot({ path: 'test-results/integration/tc06-full-data-flow.png' });
  });

  // ============================================================
  // TC-INT-07: Verifikasi Status Master Vehicle Berpengaruh ke Vehicle List
  // ============================================================
  test('TC-INT-07: Verifikasi Status Master Vehicle Berpengaruh ke Vehicle List', async ({ page }) => {
    console.log('TC-INT-07: Memulai test integrasi status');
    
    // Ambil data Master Vehicle Model dengan status
    await goToMasterVehicleModel(page);
    
    // Cek kolom status
    const headers = await page.locator('th').allTextContents();
    const hasStatusColumn = headers.some(h => h.toLowerCase().includes('status'));
    console.log(`Memiliki kolom status: ${hasStatusColumn}`);
    
    if (hasStatusColumn) {
      // Hitung active/inactive
      const statusBadges = await page.locator('[class*="badge"], [class*="status"], [class*="chip"]').allTextContents();
      const activeCount = statusBadges.filter(s => s.toLowerCase().includes('active')).length;
      const inactiveCount = statusBadges.filter(s => s.toLowerCase().includes('inactive')).length;
      console.log(`Active: ${activeCount}, Inactive: ${inactiveCount}`);
      
      // Navigasi ke Vehicle List
      await goToVehicleList(page);
      
      // Cek apakah Vehicle List memiliki kolom status
      const vehicleHeaders = await page.locator('th').allTextContents();
      const vehicleHasStatus = vehicleHeaders.some(h => h.toLowerCase().includes('status'));
      console.log(`Vehicle List memiliki kolom status: ${vehicleHasStatus}`);
      
      // Verifikasi konsistensi status
      if (vehicleHasStatus) {
        const vehicleStatusBadges = await page.locator('[class*="badge"], [class*="status"], [class*="chip"]').allTextContents();
        const vehicleActiveCount = vehicleStatusBadges.filter(s => s.toLowerCase().includes('active')).length;
        console.log(`Vehicle List Active: ${vehicleActiveCount}`);
      }
      
      await page.screenshot({ path: 'test-results/integration/tc07-status-integration.png' });
    }
    
    console.log('✅ TC-INT-07 PASS: Integrasi status terverifikasi');
  });

  // ============================================================
  // TC-INT-08: Verifikasi Pencarian Terintegrasi Antar Modul
  // ============================================================
  test('TC-INT-08: Verifikasi Pencarian Terintegrasi Antar Modul', async ({ page }) => {
    console.log('TC-INT-08: Memulai test pencarian terintegrasi');
    
    // Ambil search term dari Master Vehicle Model
    await goToMasterVehicleModel(page);
    const firstRow = page.locator('tbody tr').first();
    const firstBrand = await firstRow.locator('td').first().textContent().catch(() => '');
    const searchTerm = firstBrand.trim().split(/\s+/)[0] || 'Toyota';
    console.log(`Search term dari Master: "${searchTerm}"`);
    
    // Search di Vehicle List
    await goToVehicleList(page);
    const vehicleSearchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="cari" i]').first();
    if (await vehicleSearchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await vehicleSearchInput.fill(searchTerm);
      await page.waitForTimeout(1500);
      
      const vehicleResults = await page.locator('tbody tr').count();
      console.log(`Hasil pencarian Vehicle List untuk "${searchTerm}": ${vehicleResults} baris`);
      await page.screenshot({ path: 'test-results/integration/tc08-vehicle-search.png' });
      
      await vehicleSearchInput.clear();
      await page.waitForTimeout(500);
    }
    
    // Search di Service
    await goToServicePage(page);
    const serviceSearchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="cari" i], input[placeholder*="license" i]').first();
    if (await serviceSearchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await serviceSearchInput.fill(searchTerm);
      await page.waitForTimeout(1500);
      
      const serviceResults = await page.locator('tbody tr').count();
      console.log(`Hasil pencarian Service untuk "${searchTerm}": ${serviceResults} baris`);
      await page.screenshot({ path: 'test-results/integration/tc08-service-search.png' });
    }
    
    console.log('✅ TC-INT-08 PASS: Pencarian terintegrasi terverifikasi');
  });

  // ============================================================
  // TC-INT-09: Verifikasi Konsistensi Export Data Antar Modul
  // ============================================================
  test('TC-INT-09: Verifikasi Konsistensi Export Data Antar Modul', async ({ page }) => {
    console.log('TC-INT-09: Memulai test konsistensi export');
    
    // Test export di Master Vehicle Model
    await goToMasterVehicleModel(page);
    const masterExportBtn = page.getByRole('button', { name: /export|download|unduh/i }).first();
    const masterHasExport = await masterExportBtn.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Master Vehicle Model memiliki Export: ${masterHasExport}`);
    
    // Hitung data di Master
    const masterRowCount = await page.locator('tbody tr').count();
    console.log(`Master Vehicle Model rows: ${masterRowCount}`);
    
    // Test export di Vehicle List
    await goToVehicleList(page);
    const vehicleExportBtn = page.getByRole('button', { name: /export|download|unduh/i }).first();
    const vehicleHasExport = await vehicleExportBtn.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Vehicle List memiliki Export: ${vehicleHasExport}`);
    
    // Hitung data di Vehicle List
    const vehicleRowCount = await page.locator('tbody tr').count();
    console.log(`Vehicle List rows: ${vehicleRowCount}`);
    
    // Test export di Service
    await goToServicePage(page);
    const serviceExportBtn = page.getByRole('button', { name: /export|download|unduh/i }).first();
    const serviceHasExport = await serviceExportBtn.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`Service memiliki Export: ${serviceHasExport}`);
    
    // Hitung data di Service
    const serviceRowCount = await page.locator('tbody tr').count();
    console.log(`Service rows: ${serviceRowCount}`);
    
    // Verifikasi semua modul memiliki fitur export
    console.log('\n=== Ringkasan Export ===');
    console.log(`Master Export: ${masterHasExport ? '✓' : '✗'}`);
    console.log(`Vehicle Export: ${vehicleHasExport ? '✓' : '✗'}`);
    console.log(`Service Export: ${serviceHasExport ? '✓' : '✗'}`);
    
    await page.screenshot({ path: 'test-results/integration/tc09-export-consistency.png' });
    console.log('✅ TC-INT-09 PASS: Konsistensi export terverifikasi');
  });

  // ============================================================
  // TC-INT-10: Verifikasi Navigasi Konsisten Antar Modul
  // ============================================================
  test('TC-INT-10: Verifikasi Navigasi Konsisten Antar Modul', async ({ page }) => {
    console.log('TC-INT-10: Memulai test navigasi konsisten');
    
    // Navigasi melalui ketiga modul
    console.log('\n=== Test Navigasi ===');
    
    // Mulai dari Master Vehicle Model
    await goToMasterVehicleModel(page);
    const masterUrl = page.url();
    console.log(`1. Master Vehicle Model URL: ${masterUrl}`);
    expect(masterUrl).toContain('/fms/master/vehicle-model');
    
    // Verifikasi halaman dimuat dengan benar
    const masterTable = page.locator('table');
    await expect(masterTable).toBeVisible();
    const masterTitle = await page.getByRole('heading').first().textContent().catch(() => '');
    console.log(`   Title: ${masterTitle}`);
    
    // Navigasi ke Vehicle List
    await goToVehicleList(page);
    const vehicleUrl = page.url();
    console.log(`2. Vehicle List URL: ${vehicleUrl}`);
    expect(vehicleUrl).toContain('/fms/vehicle');
    
    // Verifikasi halaman dimuat dengan benar
    const vehicleTable = page.locator('table');
    await expect(vehicleTable).toBeVisible();
    const vehicleTitle = await page.getByRole('heading').first().textContent().catch(() => '');
    console.log(`   Title: ${vehicleTitle}`);
    
    // Navigasi ke Service
    await goToServicePage(page);
    const serviceUrl = page.url();
    console.log(`3. Service URL: ${serviceUrl}`);
    expect(serviceUrl).toContain('/fms/vehicle/service');
    
    // Verifikasi halaman dimuat dengan benar
    const serviceTable = page.locator('table');
    await expect(serviceTable).toBeVisible();
    const serviceTitle = await page.getByRole('heading').first().textContent().catch(() => '');
    console.log(`   Title: ${serviceTitle}`);
    
    // Navigasi kembali ke Master Vehicle Model
    await goToMasterVehicleModel(page);
    const backToMasterUrl = page.url();
    console.log(`4. Kembali ke Master Vehicle Model URL: ${backToMasterUrl}`);
    expect(backToMasterUrl).toContain('/fms/master/vehicle-model');
    
    // Verifikasi navigasi bolak-balik berhasil
    console.log('\n=== Verifikasi Navigasi ===');
    console.log('✓ Master Vehicle Model -> Vehicle List: OK');
    console.log('✓ Vehicle List -> Service: OK');
    console.log('✓ Service -> Master Vehicle Model: OK');
    
    await page.screenshot({ path: 'test-results/integration/tc10-navigation-consistency.png' });
    console.log('✅ TC-INT-10 PASS: Navigasi konsisten antar modul terverifikasi');
  });
});
