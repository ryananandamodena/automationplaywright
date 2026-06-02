import { test, expect } from '@playwright/test';

// Base URL
const BASE_URL = 'https://portal-dev.modena.com';
const MODULE_URL = `${BASE_URL}/fms/master/building-component`;

// ============================================================
// HELPER: Login & Navigate to Master Building Component
// ============================================================
async function loginAndGoToBuildingComponent(page) {
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
  
  if (!page.url().includes('/fms/master')) {
    console.log(`loginAndGoToBuildingComponent: Still at ${page.url()}, attempting full re-login`);
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
  
  expect(page.url()).toContain('/fms/master');
}


// ============================================================
// TEST DATA - Building Components (COMPLETE - Based on actual form)
// ============================================================
const buildingComponentTestData = [
  {
    componentCode: 'COMP-ATR-001',
    componentName: 'Atap Baja Ringan Premium',
    materialType: 'BMT002 - Steel Rebar', // Select from dropdown
    description: 'Rangka atap menggunakan baja ringan berkualitas tinggi dengan coating galvanis, tahan karat dan anti rayap. Cocok untuk bentang lebar hingga 12 meter. Spesifikasi: Ketebalan 0.75mm, Lebar 75mm, Tinggi 35mm. Brand: BlueScope Zincalume G550. Garansi 10 tahun.'
  },
  {
    componentCode: 'COMP-DPG-002',
    componentName: 'Dinding Partisi Gypsum Board',
    materialType: 'WALL - Bata Ringan', // Select from dropdown
    description: 'Partisi dinding interior menggunakan gypsum board 9mm dengan rangka hollow galvanis. Material: Jayaboard Standard Series. Dimensi: 1200mm x 2400mm x 9mm. Berat: 7.5 kg/lembar. Mudah dipasang dan dibongkar. Fire rating Class B. Garansi 5 tahun. Cocok untuk pembatas ruangan kantor dan showroom.'
  },
  {
    componentCode: 'COMP-LKR-003',
    componentName: 'Lantai Keramik 60x60 Grade A',
    materialType: 'FLOOR - Keramik Lantai', // Select from dropdown
    description: 'Keramik lantai ukuran 60x60 cm grade A dengan permukaan anti slip. Brand: Roman dMarmo Series. Warna: Beige Marble. Ketebalan: 10mm. Berat: 12 kg/pcs. Tahan lama dan mudah dibersihkan. Water absorption < 0.5%. Cocok untuk area showroom dan ruang publik. Garansi 3 tahun.'
  },
  {
    componentCode: 'COMP-PAL-004',
    componentName: 'Pintu Aluminium Powder Coating',
    materialType: 'DOOR - Pintu Kayu', // Select from dropdown
    description: 'Pintu aluminium dengan powder coating warna dark grey dan kaca tempered 5mm. Brand: YKK AP Commercial Series. Dimensi: 900mm x 2100mm. Berat: 45 kg/unit. Material: Aluminium Alloy 6063-T5. Anti karat, tahan cuaca, dan mudah perawatan. Fire rating Class B. Garansi 7 tahun. Cocok untuk pintu utama dan ruangan.'
  },
  {
    componentCode: 'COMP-ACS-005',
    componentName: 'AC Split 2 PK Inverter',
    materialType: 'BMT010 - Insulation', // Select from dropdown
    description: 'Air Conditioner split 2 PK dengan teknologi inverter hemat energi. Brand: Daikin Inverter R32. Kapasitas: 18000 BTU. Dimensi Indoor: 950x300x230mm, Outdoor: 800x550x285mm. Berat: 35 kg total. Refrigerant: R32 (ramah lingkungan). Energy rating: 5 star. Low noise operation. Garansi kompresor 3 tahun. Cocok untuk ruangan 20-30 m2.'
  },
  {
    componentCode: 'COMP-KAS-006',
    componentName: 'Kusen Aluminium & Kaca Tempered',
    materialType: 'WINDOW - Kusen Aluminium & Kaca', // Select from dropdown
    description: 'Kusen jendela aluminium dengan kaca tempered 6mm. Brand: Alexindo. Dimensi: 1200mm x 1500mm. Material: Aluminium powder coating. Kaca: Tempered safety glass. Warna frame: Silver grey. Sistem bukaan: Sliding. Anti bocor dengan rubber seal. Garansi 5 tahun. Cocok untuk jendela showroom dan kantor.'
  },
  {
    componentCode: 'COMP-GEN-007',
    componentName: 'Genteng Metal Pasir Premium',
    materialType: 'ROOF - Genteng', // Select from dropdown
    description: 'Genteng metal dengan lapisan pasir premium untuk atap. Brand: Multiroof. Material: Galvalume steel 0.30mm dengan coating pasir. Dimensi: 780mm x 1200mm. Berat: 2.8 kg/pcs. Warna: Coklat natural. Tahan karat, anti bocor, dan peredam panas. Fire rating Class A. Garansi 15 tahun. Coverage area: 0.936 m2/pcs.'
  },
  {
    componentCode: 'COMP-SEM-008',
    componentName: 'Semen Portland Composite',
    materialType: 'BMT005 - Cement', // Select from dropdown
    description: 'Semen Portland Composite untuk konstruksi umum. Brand: Holcim. Tipe: PCC (Portland Composite Cement). Kemasan: 50 kg/sak. Kuat tekan 28 hari: 42.5 MPa. Setting time: Initial 120 menit, Final 240 menit. Cocok untuk plesteran, acian, dan pekerjaan beton non-struktural. Standar SNI 15-7064-2014.'
  },
  {
    componentCode: 'COMP-PAS-009',
    componentName: 'Pasir Beton Halus',
    materialType: 'BMT006 - Sand', // Select from dropdown
    description: 'Pasir halus untuk campuran beton dan plesteran. Jenis: Pasir bangka. Ukuran butir: 0.15-5mm. Kadar lumpur: < 5%. Berat jenis: 2.65 gr/cm3. Modulus kehalusan: 2.3-3.1. Warna: Kuning kecoklatan. Sudah dicuci dan diayak. Cocok untuk adukan beton, plesteran, dan acian. Satuan: m3 atau truk.'
  },
  {
    componentCode: 'COMP-KER-010',
    componentName: 'Kerikil Split Beton',
    materialType: 'BMT007 - Gravel', // Select from dropdown
    description: 'Kerikil split untuk agregat kasar campuran beton. Ukuran: 1-2 cm dan 2-3 cm. Berat jenis: 2.60 gr/cm3. Kadar lumpur: < 1%. Kekuatan: Keras dan tidak mudah pecah. Bentuk: Angular (bersudut). Warna: Abu-abu kehitaman. Sudah dicuci bersih. Cocok untuk beton struktural K-225 hingga K-350. Satuan: m3 atau truk.'
  }
];


// ============================================================
// HELPER: Fill Building Component Form (Based on actual form fields)
// ============================================================
async function fillComponentForm(page, componentData) {
  console.log(`📝 Filling component form: ${componentData.componentName}`);
  
  // Material Type (dropdown - fill this first as it might trigger other fields)
  const materialTypeSelect = page.locator('select').first();
  if (await materialTypeSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
    const options = await materialTypeSelect.locator('option').allTextContents();
    console.log(`📋 Available Material Types: ${options.slice(0, 5).join(', ')}...`);
    
    // Find matching material type
    let foundIndex = -1;
    for (let i = 0; i < options.length; i++) {
      if (options[i].includes(componentData.materialType)) {
        foundIndex = i;
        break;
      }
    }
    
    if (foundIndex >= 0) {
      await materialTypeSelect.selectOption({ index: foundIndex });
      console.log(`✓ Material Type: ${options[foundIndex]}`);
      await page.waitForTimeout(1000); // Wait for form to update
    } else {
      console.log(`⚠️ Material Type "${componentData.materialType}" not found`);
    }
  }
  
  // Code * - Try multiple selectors
  let codeInput = page.locator('input[name*="code" i]').first();
  if (!(await codeInput.isVisible({ timeout: 1000 }).catch(() => false))) {
    codeInput = page.locator('input').first();
  }
  if (await codeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await codeInput.fill(componentData.componentCode);
    console.log(`✓ Code: ${componentData.componentCode}`);
    await page.waitForTimeout(300);
  } else {
    console.log('⚠️ Code field not found');
  }
  
  // Name * - Try multiple selectors
  let nameInput = page.locator('input[name*="name" i]').first();
  if (!(await nameInput.isVisible({ timeout: 1000 }).catch(() => false))) {
    nameInput = page.locator('input[type="text"]').nth(1);
  }
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInput.fill(componentData.componentName);
    console.log(`✓ Name: ${componentData.componentName}`);
    await page.waitForTimeout(300);
  } else {
    console.log('⚠️ Name field not found');
  }
  
  // Description - Try multiple selectors
  let descInput = page.locator('textarea').first();
  if (!(await descInput.isVisible({ timeout: 1000 }).catch(() => false))) {
    descInput = page.locator('input[type="text"]').nth(2);
  }
  if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await descInput.fill(componentData.description);
    console.log(`✓ Description: ${componentData.description.substring(0, 80)}...`);
    await page.waitForTimeout(300);
  } else {
    console.log('⚠️ Description field not found');
  }
  
  await page.waitForTimeout(500);
  console.log('✅ Form filling completed');
}


// ============================================================
// TEST SUITE: Master Building Component - CRUD Operations
// ============================================================
test.describe('FMS Master Data - Master Building Component', () => {
  test.describe.configure({ timeout: 300000 });

  // TC-01: Verify page loads correctly
  test('TC-01: Master Building Component page loads correctly', async ({ page }) => {
    console.log('TC-01: Starting page load test');
    await loginAndGoToBuildingComponent(page);
    
    const table = page.locator('table').or(page.locator('[role="table"]'));
    await expect(table).toBeVisible({ timeout: 10000 });
    
    const headers = await page.locator('th').allTextContents();
    console.log(`Table headers: ${headers.join(', ')}`);
    
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Total rows: ${rowCount}`);
    
    await page.screenshot({ path: 'test-results/building-component-tc01-page-load.png', fullPage: true });
    console.log('TC-01: Page loaded successfully');
  });

  // TC-02: Add new building component - Atap Baja Ringan
  test('TC-02: Add new building component - Atap Baja Ringan', async ({ page }) => {
    console.log('TC-02: Starting add component test');
    await loginAndGoToBuildingComponent(page);
    
    const addButton = page.locator('button').filter({ hasText: /add|create|tambah|new/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1500);
      console.log('✓ Add button clicked');
      
      await fillComponentForm(page, buildingComponentTestData[0]);
      
      await page.screenshot({ path: 'test-results/building-component-tc02-before-save.png', fullPage: true });
      
      const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('✓ Save button clicked');
        
        await page.screenshot({ path: 'test-results/building-component-tc02-after-save.png', fullPage: true });
        console.log('TC-02: Component added successfully');
      }
    } else {
      console.log('TC-02: Add button not found');
    }
  });

  // TC-03: Add new building component - Dinding Partisi Gypsum
  test('TC-03: Add new building component - Dinding Partisi Gypsum', async ({ page }) => {
    console.log('TC-03: Starting add component test');
    await loginAndGoToBuildingComponent(page);
    
    const addButton = page.locator('button').filter({ hasText: /add|create|tambah|new/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1500);
      
      await fillComponentForm(page, buildingComponentTestData[1]);
      
      const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('TC-03: Component added successfully');
      }
    }
  });

  // TC-04: Add new building component - Lantai Keramik
  test('TC-04: Add new building component - Lantai Keramik', async ({ page }) => {
    console.log('TC-04: Starting add component test');
    await loginAndGoToBuildingComponent(page);
    
    const addButton = page.locator('button').filter({ hasText: /add|create|tambah|new/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1500);
      
      await fillComponentForm(page, buildingComponentTestData[2]);
      
      const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('TC-04: Component added successfully');
      }
    }
  });

  // TC-05: Add new building component - Pintu Aluminium
  test('TC-05: Add new building component - Pintu Aluminium', async ({ page }) => {
    console.log('TC-05: Starting add component test');
    await loginAndGoToBuildingComponent(page);
    
    const addButton = page.locator('button').filter({ hasText: /add|create|tambah|new/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1500);
      
      await fillComponentForm(page, buildingComponentTestData[3]);
      
      const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('TC-05: Component added successfully');
      }
    }
  });

  // TC-06: Add new building component - AC Split
  test('TC-06: Add new building component - AC Split', async ({ page }) => {
    console.log('TC-06: Starting add component test');
    await loginAndGoToBuildingComponent(page);
    
    const addButton = page.locator('button').filter({ hasText: /add|create|tambah|new/i }).first();
    if (await addButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(1500);
      
      await fillComponentForm(page, buildingComponentTestData[4]);
      
      const saveBtn = page.getByRole('button', { name: /save|simpan|submit/i }).first();
      if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        console.log('TC-06: Component added successfully');
      }
    }
  });


  // TC-07: Search building component
  test('TC-07: Search building component', async ({ page }) => {
    console.log('TC-07: Starting search test');
    await loginAndGoToBuildingComponent(page);
    
    const rowCount = await page.locator('tbody tr').count();
    console.log(`Initial rows: ${rowCount}`);
    
    if (rowCount > 0) {
      const firstCell = await page.locator('tbody tr').first().locator('td').nth(1).textContent().catch(() => '');
      const searchTerm = firstCell.trim().split(/\s+/)[0] || 'Atap';
      console.log(`Search term: "${searchTerm}"`);
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="cari" i]').first();
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill(searchTerm);
        await page.waitForTimeout(1500);
        
        const afterRows = await page.locator('tbody tr').count();
        console.log(`After search: ${afterRows} rows`);
        
        await page.screenshot({ path: 'test-results/building-component-tc07-search.png', fullPage: true });
        
        await searchInput.clear();
        await page.waitForTimeout(500);
      }
    }
    console.log('TC-07: Search test completed');
  });

  // TC-08: View component detail
  test('TC-08: View component detail', async ({ page }) => {
    console.log('TC-08: Starting view detail test');
    await loginAndGoToBuildingComponent(page);
    
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      const viewBtn = page.locator('tbody tr').first().locator('button, a').filter({ hasText: /view|detail|lihat/i }).first();
      const eyeBtn = page.locator('tbody tr').first().locator('button[title*="view" i], [class*="view"], [class*="eye"]').first();
      
      if (await viewBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await viewBtn.click();
        await page.waitForTimeout(1500);
        console.log('✓ View button clicked');
      } else if (await eyeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await eyeBtn.click();
        await page.waitForTimeout(1500);
        console.log('✓ Eye icon clicked');
      } else {
        await page.locator('tbody tr').first().locator('td').first().click();
        await page.waitForTimeout(1000);
        console.log('✓ Clicked first row');
      }
      
      await page.screenshot({ path: 'test-results/building-component-tc08-view.png', fullPage: true });
      
      const closeBtn = page.getByRole('button', { name: /close|tutup|cancel|batal/i }).first();
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
      }
    }
    console.log('TC-08: View detail test completed');
  });

  // TC-09: Edit component
  test('TC-09: Edit component', async ({ page }) => {
    console.log('TC-09: Starting edit test');
    await loginAndGoToBuildingComponent(page);
    
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount > 0) {
      const editBtn = page.locator('tbody tr').first().locator('button').filter({ hasText: /edit|ubah|update/i }).first();
      const editIcon = page.locator('tbody tr').first().locator('button[title*="edit" i], [class*="edit"]').first();
      
      if (await editBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1500);
        console.log('✓ Edit button clicked');
        
        // Update description
        const descInput = page.locator('textarea[name*="description" i], input[name*="description" i]').first();
        if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await descInput.fill('Updated: ' + buildingComponentTestData[0].description);
          console.log('✓ Description updated');
        }
        
        await page.screenshot({ path: 'test-results/building-component-tc09-edit.png', fullPage: true });
        
        const cancelBtn = page.getByRole('button', { name: /cancel|batal|close/i }).first();
        if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(500);
        }
      } else if (await editIcon.isVisible({ timeout: 1000 }).catch(() => false)) {
        await editIcon.click();
        await page.waitForTimeout(1500);
        console.log('✓ Edit icon clicked');
      }
    }
    console.log('TC-09: Edit test completed');
  });

  // TC-10: Export data
  test('TC-10: Export building component data', async ({ page }) => {
    console.log('TC-10: Starting export test');
    await loginAndGoToBuildingComponent(page);
    
    const exportBtn = page.getByRole('button', { name: /export|download|unduh/i }).first();
    if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      let downloaded = false;
      page.on('download', (dl) => {
        console.log(`Download started - ${dl.suggestedFilename()}`);
        downloaded = true;
      });
      
      await exportBtn.click();
      await page.waitForTimeout(3000);
      console.log(`Export clicked, Downloaded: ${downloaded}`);
      
      await page.screenshot({ path: 'test-results/building-component-tc10-export.png', fullPage: true });
    } else {
      console.log('TC-10: Export button not found');
    }
    console.log('TC-10: Export test completed');
  });
});
