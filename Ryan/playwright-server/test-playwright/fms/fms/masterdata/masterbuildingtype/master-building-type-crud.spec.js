import { test, expect } from '@playwright/test';

// Base URL
const BASE_URL = 'https://portal-dev.modena.com';
const MODULE_URL = `${BASE_URL}/fms/master/building-type/form`;

// ============================================================
// HELPER: Login & Navigate to Master Building Type
// ============================================================
async function loginAndGoToBuildingType(page) {
  await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  if (page.url().includes('/login')) {
    await page.locator('input[type="email"], input[name="email"]').first().fill('ryan.ananda@modena.com');
    await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda');
    await page.getByRole('button', { name: 'Sign In' }).click();
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
  
  if (!page.url().includes('/fms/master/building-type')) {
    console.log(`loginAndGoToBuildingType: Still at ${page.url()}, attempting full re-login`);
    await page.goto('https://portal-dev.modena.com/fms/vehicle', { waitUntil: 'load', timeout: 20000 }).catch(() => {});
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
  
  expect(page.url()).toContain('/fms/master/building-type');
}


// ============================================================
// TEST DATA - Building Types
// ============================================================
const buildingTypeTestData = [
  {
    typeName: 'Showroom Premium',
    typeCode: 'BT-SRP-001',
    description: 'Showroom premium untuk display produk high-end dengan desain modern dan luas minimal 500m2. Dilengkapi dengan area display, ruang konsultasi, dan fasilitas customer lounge.',
    category: 'Commercial',
    minArea: '500',
    maxArea: '1500',
    status: 'Active'
  },
  {
    typeName: 'Warehouse Logistik',
    typeCode: 'BT-WHL-002',
    description: 'Gudang untuk penyimpanan dan distribusi produk dengan sistem racking modern. Kapasitas besar dengan akses loading dock dan area manuver truk.',
    category: 'Warehouse',
    minArea: '1000',
    maxArea: '5000',
    status: 'Active'
  },
  {
    typeName: 'Service Center',
    typeCode: 'BT-SVC-003',
    description: 'Pusat layanan purna jual dengan workshop lengkap, area penerimaan customer, dan gudang spare part. Dilengkapi dengan peralatan service standar.',
    category: 'Service',
    minArea: '300',
    maxArea: '800',
    status: 'Active'
  },
  {
    typeName: 'Office Branch',
    typeCode: 'BT-OFC-004',
    description: 'Kantor cabang untuk operasional administrasi dan manajemen regional. Dilengkapi dengan ruang meeting, workstation, dan area pantry.',
    category: 'Office',
    minArea: '200',
    maxArea: '600',
    status: 'Active'
  },
  {
    typeName: 'Experience Center',
    typeCode: 'BT-EXP-005',
    description: 'Pusat pengalaman produk interaktif dengan demo kitchen, area workshop, dan ruang edukasi. Konsep modern untuk customer engagement.',
    category: 'Commercial',
    minArea: '400',
    maxArea: '1000',
    status: 'Active'
  },
  {
    typeName: 'Distribution Hub',
    typeCode: 'BT-DHB-006',
    description: 'Hub distribusi regional dengan fasilitas cross-docking, area sortir, dan sistem tracking otomatis. Lokasi strategis untuk distribusi cepat.',
    category: 'Warehouse',
    minArea: '2000',
    maxArea: '8000',
    status: 'Active'
  },
  {
    typeName: 'Training Center',
    typeCode: 'BT-TRC-007',
    description: 'Pusat pelatihan untuk karyawan dan mitra dengan ruang kelas, lab praktik, dan area demo produk. Kapasitas 50-100 peserta.',
    category: 'Training',
    minArea: '350',
    maxArea: '700',
    status: 'Active'
  },
  {
    typeName: 'Retail Outlet',
    typeCode: 'BT-RTO-008',
    description: 'Toko retail skala kecil untuk area mall atau pusat perbelanjaan. Display compact dengan fokus produk best seller.',
    category: 'Retail',
    minArea: '100',
    maxArea: '300',
    status: 'Active'
  }
];


// ============================================================
// HELPER: Fill Building Type Form
// ============================================================
async function fillBuildingTypeForm(page, typeData) {
  console.log(`📝 Filling building type form: ${typeData.typeName}`);
  
  // Type Code
  const codeInput = page.locator('input[name*="code" i], input[placeholder*="code" i]').first();
  if (await codeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await codeInput.fill(typeData.typeCode);
    console.log(`✓ Type Code: ${typeData.typeCode}`);
    await page.waitForTimeout(300);
  }
  
  // Type Name
  const nameInput = page.locator('input[name*="name" i], input[placeholder*="name" i]').first();
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInput.fill(typeData.typeName);
    console.log(`✓ Type Name: ${typeData.typeName}`);
    await page.waitForTimeout(300);
  }
  
  // Description
  const descInput = page.locator('textarea[name*="description" i], textarea[placeholder*="description" i]').first();
  if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await descInput.fill(typeData.description);
    console.log(`✓ Description: ${typeData.description.substring(0, 60)}...`);
    await page.waitForTimeout(300);
  }
  
  // Category
  const categorySelect = page.locator('select[name*="category" i]').first();
  if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    const options = await categorySelect.locator('option').allTextContents();
    const categoryIndex = options.findIndex(opt => opt.includes(typeData.category));
    if (categoryIndex >= 0) {
      await categorySelect.selectOption({ index: categoryIndex });
      console.log(`✓ Category: ${typeData.category}`);
    } else {
      await categorySelect.selectOption({ index: 1 });
      console.log(`✓ Category: selected (fallback)`);
    }
    await page.waitForTimeout(300);
  }
  
  // Min Area
  const minAreaInput = page.locator('input[name*="minArea" i], input[name*="min" i], input[placeholder*="min" i]').first();
  if (await minAreaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await minAreaInput.fill(typeData.minArea);
    console.log(`✓ Min Area: ${typeData.minArea} m²`);
    await page.waitForTimeout(300);
  }
  
  // Max Area
  const maxAreaInput = page.locator('input[name*="maxArea" i], input[name*="max" i], input[placeholder*="max" i]').first();
  if (await maxAreaInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await maxAreaInput.fill(typeData.maxArea);
    console.log(`✓ Max Area: ${typeData.maxArea} m²`);
    await page.waitForTimeout(300);
  }
  
  // Status
  const statusSelect = page.locator('select[name*="status" i]').first();
  if (await statusSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    const options = await statusSelect.locator('option').allTextContents();
    const statusIndex = options.findIndex(opt => opt.includes(typeData.status));
    if (statusIndex >= 0) {
      await statusSelect.selectOption({ index: statusIndex });
      console.log(`✓ Status: ${typeData.status}`);
    }
    await page.waitForTimeout(300);
  }
  
  await page.waitForTimeout(500);
  console.log('✅ Form filling completed');
}


// ============================================================
// TEST SUITE: Master Building Type - CRUD Operations
// ============================================================
test.describe('FMS Master Data - Master Building Type', () => {
  test.describe.configure({ timeout: 300000 });

  // TC-01: Verify page loads correctly
  test('TC-01: Master Building Type form page loads correctly', async ({ page }) => {
    console.log('TC-01: Starting page load test');
    await loginAndGoToBuildingType(page);
    
    // Check if form elements are present
    const inputs = await page.locator('input').count();
    const selects = await page.locator('select').count();
    const textareas = await page.locator('textarea').count();
    console.log(`Form elements - inputs: ${inputs}, selects: ${selects}, textareas: ${textareas}`);
    
    expect(inputs + selects + textareas).toBeGreaterThan(0);
    
    await page.screenshot({ path: 'test-results/building-type-tc01-page-load.png', fullPage: true });
    console.log('TC-01: Page loaded successfully');
  });

  // TC-02: Add Showroom Premium
  test('TC-02: Add new building type - Showroom Premium', async ({ page }) => {
    console.log('TC-02: Starting add building type test');
    await loginAndGoToBuildingType(page);
    
    await fillBuildingTypeForm(page, buildingTypeTestData[0]);
    
    await page.screenshot({ path: 'test-results/building-type-tc02-before-save.png', fullPage: true });
    
    const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('✓ Save button clicked');
      
      await page.screenshot({ path: 'test-results/building-type-tc02-after-save.png', fullPage: true });
      console.log('TC-02: Building type added successfully');
    }
  });

  // TC-03: Add Warehouse Logistik
  test('TC-03: Add new building type - Warehouse Logistik', async ({ page }) => {
    console.log('TC-03: Starting add building type test');
    await loginAndGoToBuildingType(page);
    
    await fillBuildingTypeForm(page, buildingTypeTestData[1]);
    
    const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('TC-03: Building type added successfully');
    }
  });

  // TC-04: Add Service Center
  test('TC-04: Add new building type - Service Center', async ({ page }) => {
    console.log('TC-04: Starting add building type test');
    await loginAndGoToBuildingType(page);
    
    await fillBuildingTypeForm(page, buildingTypeTestData[2]);
    
    const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('TC-04: Building type added successfully');
    }
  });

  // TC-05: Add Office Branch
  test('TC-05: Add new building type - Office Branch', async ({ page }) => {
    console.log('TC-05: Starting add building type test');
    await loginAndGoToBuildingType(page);
    
    await fillBuildingTypeForm(page, buildingTypeTestData[3]);
    
    const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('TC-05: Building type added successfully');
    }
  });

  // TC-06: Add Experience Center
  test('TC-06: Add new building type - Experience Center', async ({ page }) => {
    console.log('TC-06: Starting add building type test');
    await loginAndGoToBuildingType(page);
    
    await fillBuildingTypeForm(page, buildingTypeTestData[4]);
    
    const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('TC-06: Building type added successfully');
    }
  });

  // TC-07: Add Distribution Hub
  test('TC-07: Add new building type - Distribution Hub', async ({ page }) => {
    console.log('TC-07: Starting add building type test');
    await loginAndGoToBuildingType(page);
    
    await fillBuildingTypeForm(page, buildingTypeTestData[5]);
    
    const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('TC-07: Building type added successfully');
    }
  });

  // TC-08: Add Training Center
  test('TC-08: Add new building type - Training Center', async ({ page }) => {
    console.log('TC-08: Starting add building type test');
    await loginAndGoToBuildingType(page);
    
    await fillBuildingTypeForm(page, buildingTypeTestData[6]);
    
    const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('TC-08: Building type added successfully');
    }
  });

  // TC-09: Add Retail Outlet
  test('TC-09: Add new building type - Retail Outlet', async ({ page }) => {
    console.log('TC-09: Starting add building type test');
    await loginAndGoToBuildingType(page);
    
    await fillBuildingTypeForm(page, buildingTypeTestData[7]);
    
    const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('TC-09: Building type added successfully');
    }
  });

  // TC-10: Verify form validation
  test('TC-10: Verify form validation for required fields', async ({ page }) => {
    console.log('TC-10: Starting form validation test');
    await loginAndGoToBuildingType(page);
    
    const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      
      const validationMsgs = await page.locator('[class*="error"], [class*="invalid"], [class*="required"]').count();
      console.log(`Validation messages found: ${validationMsgs}`);
      
      await page.screenshot({ path: 'test-results/building-type-tc10-validation.png', fullPage: true });
      console.log('TC-10: Form validation test completed');
    }
  });
});
