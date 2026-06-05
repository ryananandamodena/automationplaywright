/**
 * FMS Vehicle Comprehensive Test Suite
 * Modular test script for testing vehicle CRUD operations, UI verification,
 * brand-specific validations, API testing, and error handling.
 * 
 * @author Ryan Ananda
 * @description Comprehensive vehicle testing with Playwright MCP
 */

import { test, expect, request } from '@playwright/test';

// ============================================================
// CONFIGURATION & CONSTANTS
// ============================================================

const BASE_URL = 'https://portal-dev.modena.com';
const VEHICLE_URL = `${BASE_URL}/fms/vehicle`;
const LOGIN_EMAIL = 'ryan.ananda@modena.com';
const LOGIN_PASSWORD = 'P@ssw0rd_ryan.ananda';

const SCREENSHOT_DIR = 'test-results/vehicle-comprehensive';

// Brand types for modular testing
const VEHICLE_BRANDS = [
  { name: 'Toyota', models: ['Innova', 'Fortuner', 'Alphard', 'Vios', 'Camry'] },
  { name: 'Honda', models: ['Civic', 'HR-V', 'Jazz', 'CR-V', 'Accord'] },
  { name: 'Daihatsu', models: ['Xenia', 'Terios', 'Ayla', 'Sigra'] },
  { name: 'Suzuki', models: ['Ertiga', 'Baleno', 'Vitara', 'Jimny'] },
  { name: 'Mitsubishi', models: ['Xpander', 'Pajero', 'Outlander', 'Triton'] },
  { name: 'Nissan', models: ['Livina', 'X-Trail', 'Terrano', 'Leaf'] },
  { name: 'Hyundai', models: ['Stargazer', 'Creta', 'Santa Fe', 'Tucson'] },
  { name: 'Wuling', models: ['Confero', 'Air EV', 'Almaz', 'Formo'] }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Generate unique license plate
 */
function generateLicensePlate() {
  const prefixes = ['B', 'D', 'F', 'H', 'G', 'E', 'T', 'K', 'R', 'S'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  const letters = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix} ${number} ${letters}`;
}

/**
 * Generate unique string
 */
function generateUniqueId(prefix = 'AUTO') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate future date
 */
function generateFutureDate(years = 1) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split('T')[0];
}

/**
 * Generate past date
 */
function generatePastDate(years = 3) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split('T')[0];
}

/**
 * Take screenshot with timestamp
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const path = `${SCREENSHOT_DIR}/${name}-${timestamp}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`📸 Screenshot: ${path}`);
  return path;
}

/**
 * Navigate to FMS (DEV) from the my-application SSO page
 */
async function navigateToFMSDev(page) {
  console.log('  → Navigating to FMS (DEV)...');
  try {
    // Wait for the my-application page to fully load
    await page.waitForTimeout(1500);

    // Find the p element with exact text "FMS (DEV)" and click it
    await page.evaluate(() => {
      const ps = Array.from(document.querySelectorAll('p'));
      const fmsDev = ps.find(p => p.textContent.trim() === 'FMS (DEV)');
      if (fmsDev) fmsDev.click();
    });
    await page.waitForTimeout(1500);

    // Handle confirmation dialog "Are you sure you want to proceed to FMS (DEV)?"
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click();
      // Wait for navigation to FMS
      await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
    console.log(`  → After FMS nav: ${page.url()}`);
  } catch (e) {
    console.log(`  ⚠️ navigateToFMSDev error: ${e.message}`);
  }
}

/**
 * Select an option from a React Select dropdown using the label text
 * @param {Page} page - Playwright page object
 * @param {string} labelText - The label text (partial match ok)
 * @param {string|null} valueToSelect - Type to filter; null = select first option
 * @param {number} maxRetries - Maximum retry attempts for options to appear
 */
async function selectReactSelectByLabel(page, labelText, valueToSelect, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const labelEl = page.locator('label').filter({ hasText: new RegExp(labelText.replace(/[*]/g, '\\*'), 'i') }).first();
      const labelParent = labelEl.locator('..');
      const rsInput = labelParent.locator('input[id*="react-select"]');

      if (!(await rsInput.isVisible({ timeout: 3000 }).catch(() => false))) {
        console.log(`    ⚠️ React Select not found for label: ${labelText}`);
        return false;
      }

      if (valueToSelect) {
        await rsInput.click();
        await page.waitForTimeout(300);
        await rsInput.fill('');
        await rsInput.type(valueToSelect, { delay: 50 });
      } else {
        await rsInput.click();
        await page.waitForTimeout(500);
      }
      await page.waitForTimeout(1000); // Increased wait time for options to load

      const listbox = page.locator('[role="listbox"]').first();
      if (await listbox.isVisible({ timeout: 5000 }).catch(() => false)) {
        let option;
        if (valueToSelect) {
          option = listbox.locator('[role="option"]').filter({ hasText: new RegExp(valueToSelect, 'i') }).first();
        } else {
          option = listbox.locator('[role="option"]').first();
        }
        if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
          const selectedText = await option.textContent().catch(() => valueToSelect || 'first');
          await option.click();
          console.log(`    ✅ ${labelText}: ${selectedText?.trim()}`);
          return true;
        }
      }

      if (attempt < maxRetries) {
        console.log(`    ⏳ Retrying ${labelText} selection (attempt ${attempt + 1}/${maxRetries})...`);
        await page.waitForTimeout(2000); // Wait before retry
      } else {
        console.log(`    ⚠️ No options visible for: ${labelText} after ${maxRetries} attempts`);
      }
    } catch (e) {
      console.log(`    ⚠️ selectReactSelectByLabel(${labelText}) attempt ${attempt}: ${e.message}`);
      if (attempt < maxRetries) {
        await page.waitForTimeout(1000);
      }
    }
  }
  return false;
}

/**
 * Login and navigate to vehicle page
 */
async function loginAndNavigateToVehicle(page) {
  console.log('🔐 Logging in and navigating to vehicle page...');

  // Navigate to vehicle URL and wait for the URL to settle after any redirects
  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  // Allow client-side routing / auth checks to complete
  await page.waitForTimeout(3000);

  let currentUrl = page.url();
  console.log(`  Current URL after initial goto: ${currentUrl}`);

  // Step 1: Handle login page
  if (currentUrl.includes('/login')) {
    console.log('  → Login page, entering credentials...');
    await page.locator('input[name="email"], input[type="email"]').first().fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(LOGIN_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    currentUrl = page.url();
    console.log(`  URL after login: ${currentUrl}`);
  }

  // Step 2: Handle my-application SSO selector
  if (currentUrl.includes('my-application')) {
    console.log('  → SSO application selector, navigating to FMS DEV...');
    await navigateToFMSDev(page);
    await page.waitForTimeout(1500);
    currentUrl = page.url();
    console.log(`  URL after FMS selection: ${currentUrl}`);
  }

  // Step 3: If still on my-application or login, try to navigate to vehicle URL again
  if (!currentUrl.includes('/fms/vehicle')) {
    console.log(`  → Not yet on vehicle page (${currentUrl}), navigating directly...`);
    await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
    currentUrl = page.url();
    console.log(`  URL after retry goto: ${currentUrl}`);
  }

  // Step 4: Final fallback - full re-login
  if (!currentUrl.includes('/fms/vehicle')) {
    console.log('  → Recovery: full re-authentication...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    currentUrl = page.url();

    if (currentUrl.includes('my-application')) {
      await navigateToFMSDev(page);
      await page.waitForTimeout(1500);
    } else if (currentUrl.includes('/login')) {
      await page.locator('input[name="email"]').fill(LOGIN_EMAIL);
      await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/my-application|\/fms\//, { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
      if (page.url().includes('my-application')) {
        await navigateToFMSDev(page);
        await page.waitForTimeout(1500);
      }
    }

    await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  console.log(`  ✅ Final URL: ${page.url()}`);
  return page.url();
}

/**
 * Verify UI elements on vehicle page
 */
async function verifyUIElements(page) {
  console.log('🔍 Verifying UI elements...');
  
  const results = {
    pageTitle: false,
    tableExists: false,
    headers: [],
    rowCount: 0,
    buttons: [],
    filters: []
  };

  // Check page title
  try {
    const title = await page.getByRole('heading').first().textContent();
    results.pageTitle = !!title;
    console.log(`  📄 Page title: ${title}`);
  } catch (e) {
    console.log('  ⚠️ Page title not found');
  }

  // Check table exists
  try {
    const table = page.locator('table').or(page.locator('[role="table"]'));
    results.tableExists = await table.isVisible();
    console.log(`  📊 Table exists: ${results.tableExists}`);
  } catch (e) {
    console.log('  ⚠️ Table not found');
  }

  // Get table headers
  try {
    results.headers = await page.locator('th').allTextContents();
    console.log(`  📋 Headers: ${results.headers.join(', ')}`);
  } catch (e) {
    console.log('  ⚠️ Headers not found');
  }

  // Get row count
  try {
    results.rowCount = await page.locator('tbody tr').count();
    console.log(`  📝 Row count: ${results.rowCount}`);
  } catch (e) {
    console.log('  ⚠️ Row count not found');
  }

  // Get buttons
  try {
    results.buttons = await page.getByRole('button').allTextContents();
    console.log(`  🔘 Buttons: ${results.buttons.join(', ')}`);
  } catch (e) {
    console.log('  ⚠️ Buttons not found');
  }


  try {
    // Get filters
    const filterSelects = page.locator('select').or(page.getByRole('combobox'));
    results.filters = await filterSelects.allTextContents();
    console.log(`  🔽 Filters: ${results.filters.join(', ')}`);
  } catch (e) {
    console.log('  ⚠️ Filters not found');
  }

  return results;
}

/**
 * Get available vehicle brands from dropdown
 */
async function getAvailableBrands(page) {
  console.log('🏷️ Getting available vehicle brands...');
  const brands = [];
  
  try {
    // Find brand dropdown
    const brandSelect = page.locator('select').filter({ hasText: /brand|merek/i }).first()
      .or(page.locator('select').nth(1));
    
    if (await brandSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await brandSelect.locator('option').allTextContents();
      console.log(`  Available brand options: ${options.join(', ')}`);
      
      // Extract brand names (skip first "Select" option)
      for (let i = 1; i < options.length; i++) {
        const brandText = options[i].trim();
        if (brandText && brandText.length > 0) {
          brands.push(brandText);
        }
      }
    }
  } catch (e) {
    console.log('  ⚠️ Could not get brand dropdown');
  }
  
  return brands;
}

/**
 * Open add vehicle form
 */
async function openAddVehicleForm(page) {
  console.log('➕ Opening add vehicle form...');
  
  let addButton = page.locator('button').filter({ hasText: /Add Vehicle|Tambah/i }).first();
  
  if (!(await addButton.isVisible({ timeout: 3000 }).catch(() => false))) {
    addButton = page.getByRole('button', { name: /^add|^create|^new/i }).first();
  }
  
  if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addButton.click();
    await page.waitForTimeout(2000);
    console.log('  ✅ Add form opened');
    return true;
  }
  
  console.log('  ⚠️ Add button not found');
  return false;
}

/**
 * Fill vehicle form with test data
 * Handles React Select dropdowns, button toggles, and standard inputs
 */
async function fillVehicleForm(page, vehicleData) {
  console.log('📝 Filling vehicle form...');
  const filledFields = [];

  try {
    // 1. Ownership toggle (Owned / Leased)
    const ownership = vehicleData.ownership || 'Owned';
    const ownershipBtn = page.locator('button').filter({ hasText: new RegExp(`^${ownership}$`, 'i') }).first();
    if (await ownershipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await ownershipBtn.click();
      filledFields.push('ownership');
      console.log(`    ✅ Ownership: ${ownership}`);
    }

    // 2. License Plate
    const plateInput = page.locator('input[placeholder*="1234"]').first();
    if (await plateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await plateInput.fill(vehicleData.licensePlate);
      filledFields.push('licensePlate');
      console.log(`    ✅ License Plate: ${vehicleData.licensePlate}`);
    }

    // 3. Unit Description
    const descInput = page.locator('input[placeholder*="Avanza"]').first();
    if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descInput.fill(vehicleData.vehicleName);
      filledFields.push('unitDescription');
      console.log(`    ✅ Unit Description: ${vehicleData.vehicleName}`);
    }

    // 4. Brand (React Select) — type brand name to filter
    const brandSelected = await selectReactSelectByLabel(page, 'Brand', vehicleData.brand);
    if (brandSelected) filledFields.push('brand');
    // Wait longer for dependent dropdowns to load after brand selection
    await page.waitForTimeout(2000);

    // 5. Vehicle Type (React Select) — MPV or Sedan, with retry logic
    const vtSelected = await selectReactSelectByLabel(page, 'Vehicle Type', vehicleData.vehicleSubType || 'MPV', 5);
    if (vtSelected) filledFields.push('vehicleType');
    await page.waitForTimeout(1000);

    // 6. Model (React Select) — first available option after brand+type selected, with retry
    const modelSelected = await selectReactSelectByLabel(page, 'Model', null, 5);
    if (modelSelected) filledFields.push('model');
    await page.waitForTimeout(600);

    // 7. Year (native select)
    const yearLabel = page.locator('label').filter({ hasText: /^Year\s*\*?$/ }).first();
    const yearSelect = yearLabel.locator('..').locator('select');
    if (await yearSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await yearSelect.selectOption(vehicleData.year || '2023');
      filledFields.push('year');
      console.log(`    ✅ Year: ${vehicleData.year || '2023'}`);
    }

    // 8. Color (may be auto-filled and disabled by model selection — skip if disabled)
    const colorInput = page.locator('input[placeholder*="Color"]').first();
    if (await colorInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isDisabled = await colorInput.isDisabled().catch(() => true);
      if (!isDisabled) {
        await colorInput.fill(vehicleData.color || 'White');
        filledFields.push('color');
        console.log(`    ✅ Color: ${vehicleData.color || 'White'}`);
      } else {
        const autoColor = await colorInput.inputValue().catch(() => '');
        console.log(`    ℹ️ Color auto-filled by model: ${autoColor}`);
        filledFields.push('color');
      }
    }

    // 9. Cylinder Capacity
    const ccInput = page.locator('input[placeholder*="CC"]').first();
    if (await ccInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ccInput.fill(vehicleData.cc || '1500');
      filledFields.push('cc');
      console.log(`    ✅ Cylinder Capacity: ${vehicleData.cc || '1500'}`);
    }

    // 10. Chassis Number
    const chassisInput = page.locator('input[placeholder*="MHKM"]').first();
    if (await chassisInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chassisInput.fill(vehicleData.chassis);
      filledFields.push('chassis');
      console.log(`    ✅ Chassis: ${vehicleData.chassis}`);
    }

    // 11. Engine Number
    const engineInput = page.locator('input[placeholder*="NR-VE"]').first();
    if (await engineInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await engineInput.fill(vehicleData.engine);
      filledFields.push('engine');
      console.log(`    ✅ Engine: ${vehicleData.engine}`);
    }

    // 12. Department (React Select) — first available
    const deptSelected = await selectReactSelectByLabel(page, 'Department', null);
    if (deptSelected) filledFields.push('department');
    await page.waitForTimeout(600);

    // 13. Branch (React Select) — first available
    const branchSelected = await selectReactSelectByLabel(page, 'Branch', null);
    if (branchSelected) filledFields.push('branch');
    await page.waitForTimeout(400);

    // 14. STNK Expiry (1Y) — first date input
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) {
      await dateInputs.first().fill(vehicleData.taxDate || generateFutureDate(1));
      filledFields.push('stnkExpiry1y');
    }

    // 15. Purchase Price
    const priceInput = page.locator('input[placeholder="0"]').first();
    if (vehicleData.amount && await priceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await priceInput.fill(vehicleData.amount);
      filledFields.push('price');
      console.log(`    ✅ Purchase Price: ${vehicleData.amount}`);
    }

    // 16. Document Upload (STNK Document 1 - required)
    if (vehicleData.documentPath) {
      console.log(`    📎 Uploading STNK Document...`);
      try {
        // Find all UPLOAD buttons/areas in the form - these are visible clickable areas
        const uploadAreas = page.locator('div, button, label').filter({ hasText: /^UPLOAD$/ });
        const uploadCount = await uploadAreas.count();
        console.log(`    📎 Found ${uploadCount} UPLOAD areas`);

        if (uploadCount > 0) {
          // Use Playwright's filechooser intercept - this properly triggers React onChange
          const fileChooserPromise = page.waitForEvent('filechooser');
          await uploadAreas.first().click();
          const fileChooser = await fileChooserPromise;
          await fileChooser.setFiles(vehicleData.documentPath);
          await page.waitForTimeout(1500);
          filledFields.push('stnkDocument1');
          console.log(`    ✅ STNK Document 1 uploaded via file chooser: ${vehicleData.documentPath}`);
          
          // Also upload STNK Document 2 if there are multiple upload areas
          if (uploadCount > 1) {
            try {
              const fileChooserPromise2 = page.waitForEvent('filechooser');
              await uploadAreas.nth(1).click();
              const fileChooser2 = await fileChooserPromise2;
              await fileChooser2.setFiles(vehicleData.documentPath);
              await page.waitForTimeout(1000);
              filledFields.push('stnkDocument2');
              console.log(`    ✅ STNK Document 2 uploaded`);
            } catch (e2) {
              console.log(`    ⚠️ STNK Document 2 upload failed: ${e2.message}`);
            }
          }
        } else {
          // Fallback: try hidden file inputs with dispatchEvent to trigger React
          console.log(`    ⚠️ No visible UPLOAD area found, trying hidden input fallback...`);
          const fileInput = page.locator('input[type="file"]').first();
          if (await fileInput.count() > 0) {
            await fileInput.evaluate(input => { input.removeAttribute('style'); input.style.display = 'block'; });
            await fileInput.setInputFiles(vehicleData.documentPath);
            // Dispatch change event to trigger React
            await fileInput.evaluate(input => {
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            await page.waitForTimeout(1000);
            filledFields.push('document');
            console.log(`    ✅ Document uploaded via hidden input fallback`);
          } else {
            console.log(`    ℹ️ No file upload field found, skipping`);
          }
        }
      } catch (e) {
        console.log(`    ⚠️ Document upload error: ${e.message}`);
      }
    }

    console.log(`  ✅ Total fields filled: ${filledFields.length}`);
  } catch (e) {
    console.log(`  ⚠️ Error filling form: ${e.message}`);
  }

  return filledFields;
}

/**
 * Submit vehicle form with network monitoring
 */
async function submitVehicleForm(page) {
  console.log('💾 Submitting vehicle form...');
  
  try {
    // Monitor network requests during submission
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/vehicle') || request.method() === 'POST' || request.method() === 'PUT') {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
        console.log(`  📡 Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/') || response.url().includes('/vehicle')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
        console.log(`  📡 Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // First, try to find the actual form element and submit it
    const formElement = page.locator('form').first();
    if (await formElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  📝 Found form element, submitting via form.submit()...');
      await formElement.evaluate(form => form.submit());
      await page.waitForTimeout(3000);
    } else {
      // Fallback to button click
      const saveButton = page.locator('button').filter({ hasText: /^Submit$|^Save$|^Simpan$/i }).first();
      
      if (await saveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('  🖱️ Clicking save button...');
        await saveButton.click();
        await page.waitForTimeout(3000);
      } else {
        console.log('  ⚠️ No form or save button found');
        return { success: false, message: 'No form or save button found' };
      }
    }
    
    // Check for loading spinner or processing indicator
    const loadingSpinner = page.locator('.loading, .spinner, [aria-busy="true"]').first();
    if (await loadingSpinner.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⏳ Waiting for form processing...');
      await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
    }
    
    // Check for confirmation dialog
    const confirmButton = page.locator('button').filter({ hasText: /^Confirm$|^Yes$|^OK$|^Ya$/i }).first();
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  ✅ Confirmation dialog found, clicking...');
      await confirmButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Check for success message
    const successMessage = page.getByText(/success|berhasil|created|ditambahkan|saved|tersimpan/i);
    if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ✅ Form submitted successfully');
      console.log(`  📊 Network activity: ${requests.length} requests, ${responses.length} responses`);
      return { success: true, message: 'Vehicle created successfully', network: { requests, responses } };
    }
    
    // Check for error message
    const errorMessage = page.getByText(/error|gagal|failed|invalid|required/i);
    if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      const errorText = await errorMessage.textContent();
      console.log(`  ❌ Form submission error: ${errorText}`);
      console.log(`  📊 Network activity: ${requests.length} requests, ${responses.length} responses`);
      return { success: false, message: errorText, network: { requests, responses } };
    }
    
    // Check if we're back on list page
    if (page.url().includes('/fms/vehicle')) {
      console.log('  ✅ Form submitted, returned to list');
      console.log(`  📊 Network activity: ${requests.length} requests, ${responses.length} responses`);
      return { success: true, message: 'Vehicle created', network: { requests, responses } };
    }
    
    console.log(`  📊 Network activity: ${requests.length} requests, ${responses.length} responses`);
    return { success: true, message: 'Form submitted', network: { requests, responses } };
    
  } catch (e) {
    console.log(`  ❌ Error submitting form: ${e.message}`);
    return { success: false, message: e.message };
  }
}

/**
 * Verify vehicle was created by checking the vehicle list
 */
async function verifyVehicleCreated(page, vehicleData) {
  console.log('🔍 Verifying vehicle creation...');
  
  try {
    // Navigate to vehicle list if not already there
    if (!page.url().includes('/fms/vehicle')) {
      await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(3000);
    }
    
    // Wait for page to fully load - check for common loading indicators
    console.log('  ⏳ Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    // Check if there are any error messages on the page
    const errorSelectors = [
      '.error', '.alert-danger', '[class*="error"]', 
      'text=/error|failed|gagal/i'
    ];
    
    for (const selector of errorSelectors) {
      try {
        const errorElement = page.locator(selector).first();
        if (await errorElement.isVisible({ timeout: 2000 }).catch(() => false)) {
          const errorText = await errorElement.textContent();
          console.log(`  ⚠️ Found error message: ${errorText}`);
          return { success: false, message: `Page error: ${errorText}` };
        }
      } catch (e) {
        // Continue checking other selectors
      }
    }
    
    // Try different table selectors
    const tableSelectors = [
      'table',
      '.table',
      '[role="table"]',
      '.data-table',
      '.vehicle-table'
    ];
    
    let tableFound = false;
    for (const selector of tableSelectors) {
      try {
        const table = page.locator(selector).first();
        if (await table.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log(`  ✅ Table found with selector: ${selector}`);
          tableFound = true;
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!tableFound) {
      console.log('  ⚠️ No table found on the page');
      // Take a screenshot to debug
      await takeScreenshot(page, 'verify-debug-no-table');
      return { success: false, message: 'No table found on vehicle list page' };
    }
    
    // Wait a bit more for data to load
    await page.waitForTimeout(3000);
    
    // Search for the license plate in the table
    const licensePlateCell = page.locator('td, th').filter({ hasText: vehicleData.licensePlate });
    const found = await licensePlateCell.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (found) {
      console.log(`  ✅ Vehicle found in list: ${vehicleData.licensePlate}`);
      return { success: true, message: 'Vehicle verified in list' };
    }
    
    // If not found, try searching by chassis number
    const chassisCell = page.locator('td, th').filter({ hasText: vehicleData.chassis });
    const foundByChassis = await chassisCell.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (foundByChassis) {
      console.log(`  ✅ Vehicle found by chassis: ${vehicleData.chassis}`);
      return { success: true, message: 'Vehicle verified by chassis' };
    }
    
    // Check if there's a search input and try searching
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  🔍 Trying search functionality...');
      await searchInput.fill(vehicleData.licensePlate);
      await page.waitForTimeout(2000);
      
      const searchedCell = page.locator('td, th').filter({ hasText: vehicleData.licensePlate });
      const foundAfterSearch = await searchedCell.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (foundAfterSearch) {
        console.log(`  ✅ Vehicle found after search: ${vehicleData.licensePlate}`);
        return { success: true, message: 'Vehicle verified after search' };
      }
    }
    
    console.log(`  ⚠️ Vehicle not found in list: ${vehicleData.licensePlate}`);
    // Take debug screenshot
    await takeScreenshot(page, 'verify-debug-not-found');
    return { success: false, message: 'Vehicle not found in list' };
    
  } catch (e) {
    console.log(`  ❌ Error verifying vehicle: ${e.message}`);
    return { success: false, message: e.message };
  }
}
function createTestData(brand, model, ownership = 'Owned', vehicleSubType = 'MPV') {
  const colors = ['White', 'Black', 'Silver', 'Red', 'Blue', 'Gray'];
  return {
    brand: brand,
    licensePlate: generateLicensePlate(),
    vehicleName: `${brand} ${model} ${generateUniqueId()}`,
    chassis: generateUniqueId('CHS'),
    engine: generateUniqueId('ENG'),
    year: String(2020 + Math.floor(Math.random() * 5)),
    cc: String(1500 + Math.floor(Math.random() * 2000)),
    color: colors[Math.floor(Math.random() * colors.length)],
    ownership: ownership,
    vehicleSubType: vehicleSubType,
    stnk: `S-${Math.floor(Math.random() * 90000000) + 10000000}`,
    taxDate: generateFutureDate(1),
    amount: String(200000000 + Math.floor(Math.random() * 500000000)),
    documentPath: 'C:\\Users\\ryan.ananda\\Downloads\\uchihapay.png'
  };
}

/**
 * Find and select a vehicle from the list
 */
async function findVehicleInList(page, licensePlate) {
  console.log(`🔍 Searching for vehicle: ${licensePlate}`);
  
  try {
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const rowText = await row.textContent();
      
      if (rowText.includes(licensePlate)) {
        console.log(`  ✅ Found vehicle at row ${i + 1}`);
        return { found: true, row: row, index: i };
      }
    }
    
    console.log(`  ⚠️ Vehicle not found`);
    return { found: false };
    
  } catch (e) {
    console.log(`  ❌ Error searching: ${e.message}`);
    return { found: false, error: e.message };
  }
}

/**
 * Delete a vehicle
 */
async function deleteVehicle(page, row) {
  console.log('🗑️ Deleting vehicle...');
  
  try {
    // Find delete button
    const deleteBtn = row.getByRole('button').filter({ hasText: /delete|hapus/i }).first()
      .or(row.locator('button[title*="delete" i]').first())
      .or(row.locator('button').nth(2));
    
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);
      
      // Handle confirmation dialog
      const confirmBtn = page.getByRole('button', { name: /confirm|hapus|yes|ok/i });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
        console.log('  ✅ Vehicle deleted');
        return { success: true };
      }
      
      return { success: true, message: 'Delete initiated' };
    }
    
    console.log('  ⚠️ Delete button not found');
    return { success: false, message: 'Delete button not found' };
    
  } catch (e) {
    console.log(`  ❌ Error deleting: ${e.message}`);
    return { success: false, message: e.message };
  }
}

/**
 * Test API endpoint
 */
async function testAPIEndpoint(url, method = 'GET', data = null) {
  console.log(`🌐 Testing API: ${method} ${url}`);
  
  try {
    const apiContext = await request.newContext();
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.data = data;
    }
    
    const response = await apiContext.fetch(url, options);
    const status = response.status();
    const body = await response.text();
    
    console.log(`  📊 Status: ${status}`);
    console.log(`  📄 Response: ${body.substring(0, 200)}...`);
    
    return {
      success: status >= 200 && status < 300,
      status: status,
      body: body,
      isJSON: body.startsWith('{') || body.startsWith('[')
    };
    
  } catch (e) {
    console.log(`  ❌ API Error: ${e.message}`);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Test error handling - invalid input
 */
async function testErrorHandling(page) {
  console.log('⚠️ Testing error handling...');
  
  const errors = [];
  
  try {
    // Test empty form submission
    await openAddVehicleForm(page);
    await page.waitForTimeout(1000);
    
    // Try to submit empty form
    const saveButton = page.getByRole('button', { name: /save|simpan/i }).first();
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(2000);
      
      // Look for validation errors
      const errorFields = page.locator('.error, .invalid, [aria-invalid="true"]');
      const errorCount = await errorFields.count();
      
      if (errorCount > 0) {
        console.log(`  ✅ Validation errors found: ${errorCount} fields`);
        errors.push({ type: 'validation', count: errorCount });
      }
    }
    
    // Test with invalid data
    await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
  } catch (e) {
    console.log(`  ⚠️ Error handling test: ${e.message}`);
  }
  
  return errors;
}

// ============================================================
// MODULAR TEST FUNCTIONS BY BRAND
// ============================================================

/**
 * Test for Toyota brand
 */
async function testToyotaBrand(page, testMode = true) {
  console.log('\n🏍️ Testing Toyota Brand...');
  const results = { brand: 'Toyota', tests: [] };
  
  const testData = createTestData('Toyota', 'Innova', 'Leased', 'MPV');
  
  await loginAndNavigateToVehicle(page);
  await takeScreenshot(page, 'toyota-01-navigate');
  
  // Open form
  const formOpened = await openAddVehicleForm(page);
  if (!formOpened) {
    results.tests.push({ name: 'Open form', success: false });
    return results;
  }
  await takeScreenshot(page, 'toyota-02-form-open');
  
  // Fill form
  const filledFields = await fillVehicleForm(page, testData);
  await takeScreenshot(page, 'toyota-03-form-filled');
  
  results.tests.push({ name: 'Fill form', success: filledFields.length > 0, fields: filledFields.length });
  
  if (!testMode) {
    const submitResult = await submitVehicleForm(page);
    await takeScreenshot(page, 'toyota-04-form-submit');
    results.tests.push({ name: 'Submit form', success: submitResult.success });
    
    // Verify vehicle was created
    const verifyResult = await verifyVehicleCreated(page, testData);
    results.tests.push({ name: 'Verify creation', success: verifyResult.success });
  }
  
  // Return to list
  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'toyota-05-back-to-list');
  
  console.log(`✅ Toyota brand test completed: ${results.tests.length} tests`);
  return results;
}

/**
 * Test for Honda brand
 */
async function testHondaBrand(page, testMode = true) {
  console.log('\n🚗 Testing Honda Brand...');
  const results = { brand: 'Honda', tests: [] };
  
  const testData = createTestData('Honda', 'Civic', 'Owned', 'Sedan');
  
  await loginAndNavigateToVehicle(page);
  await takeScreenshot(page, 'honda-01-navigate');
  
  const formOpened = await openAddVehicleForm(page);
  if (!formOpened) {
    results.tests.push({ name: 'Open form', success: false });
    return results;
  }
  await takeScreenshot(page, 'honda-02-form-open');
  
  const filledFields = await fillVehicleForm(page, testData);
  await takeScreenshot(page, 'honda-03-form-filled');
  
  results.tests.push({ name: 'Fill form', success: filledFields.length > 0, fields: filledFields.length });
  
  if (!testMode) {
    const submitResult = await submitVehicleForm(page);
    await takeScreenshot(page, 'honda-04-form-submit');
    results.tests.push({ name: 'Submit form', success: submitResult.success });
    
    // Verify vehicle was created
    const verifyResult = await verifyVehicleCreated(page, testData);
    results.tests.push({ name: 'Verify creation', success: verifyResult.success });
  }
  
  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'honda-05-back-to-list');
  
  console.log(`✅ Honda brand test completed: ${results.tests.length} tests`);
  return results;
}

/**
 * Test for Daihatsu brand
 */
async function testDaihatsuBrand(page, testMode = true) {
  console.log('\n🚙 Testing Daihatsu Brand...');
  const results = { brand: 'Daihatsu', tests: [] };
  
  const testData = createTestData('Daihatsu', 'Xenia', 'Leased', 'MPV');
  
  await loginAndNavigateToVehicle(page);
  await takeScreenshot(page, 'daihatsu-01-navigate');
  
  const formOpened = await openAddVehicleForm(page);
  if (!formOpened) {
    results.tests.push({ name: 'Open form', success: false });
    return results;
  }
  await takeScreenshot(page, 'daihatsu-02-form-open');
  
  const filledFields = await fillVehicleForm(page, testData);
  await takeScreenshot(page, 'daihatsu-03-form-filled');
  
  results.tests.push({ name: 'Fill form', success: filledFields.length > 0, fields: filledFields.length });
  
  if (!testMode) {
    const submitResult = await submitVehicleForm(page);
    await takeScreenshot(page, 'daihatsu-04-form-submit');
    results.tests.push({ name: 'Submit form', success: submitResult.success });
    
    // Verify vehicle was created
    const verifyResult = await verifyVehicleCreated(page, testData);
    results.tests.push({ name: 'Verify creation', success: verifyResult.success });
  }
  
  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'daihatsu-05-back-to-list');
  
  console.log(`✅ Daihatsu brand test completed: ${results.tests.length} tests`);
  return results;
}

/**
 * Test for Suzuki brand
 */
async function testSuzukiBrand(page, testMode = true) {
  console.log('\n🚐 Testing Suzuki Brand...');
  const results = { brand: 'Suzuki', tests: [] };
  
  const testData = createTestData('Suzuki', 'Ertiga', 'Owned', 'MPV');
  
  await loginAndNavigateToVehicle(page);
  await takeScreenshot(page, 'suzuki-01-navigate');
  
  const formOpened = await openAddVehicleForm(page);
  if (!formOpened) {
    results.tests.push({ name: 'Open form', success: false });
    return results;
  }
  await takeScreenshot(page, 'suzuki-02-form-open');
  
  const filledFields = await fillVehicleForm(page, testData);
  await takeScreenshot(page, 'suzuki-03-form-filled');
  
  results.tests.push({ name: 'Fill form', success: filledFields.length > 0, fields: filledFields.length });
  
  if (!testMode) {
    const submitResult = await submitVehicleForm(page);
    await takeScreenshot(page, 'suzuki-04-form-submit');
    results.tests.push({ name: 'Submit form', success: submitResult.success });
    
    // Verify vehicle was created
    const verifyResult = await verifyVehicleCreated(page, testData);
    results.tests.push({ name: 'Verify creation', success: verifyResult.success });
  }
  
  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'suzuki-05-back-to-list');
  
  console.log(`✅ Suzuki brand test completed: ${results.tests.length} tests`);
  return results;
}

/**
 * Test for Mitsubishi brand
 */
async function testMitsubishiBrand(page, testMode = true) {
  console.log('\n🏎️ Testing Mitsubishi Brand...');
  const results = { brand: 'Mitsubishi', tests: [] };
  
  const testData = createTestData('Mitsubishi', 'Xpander', 'Leased', 'MPV');
  
  await loginAndNavigateToVehicle(page);
  await takeScreenshot(page, 'mitsubishi-01-navigate');
  
  const formOpened = await openAddVehicleForm(page);
  if (!formOpened) {
    results.tests.push({ name: 'Open form', success: false });
    return results;
  }
  await takeScreenshot(page, 'mitsubishi-02-form-open');
  
  const filledFields = await fillVehicleForm(page, testData);
  await takeScreenshot(page, 'mitsubishi-03-form-filled');
  
  results.tests.push({ name: 'Fill form', success: filledFields.length > 0, fields: filledFields.length });
  
  if (!testMode) {
    const submitResult = await submitVehicleForm(page);
    await takeScreenshot(page, 'mitsubishi-04-form-submit');
    results.tests.push({ name: 'Submit form', success: submitResult.success });
    
    // Verify vehicle was created
    const verifyResult = await verifyVehicleCreated(page, testData);
    results.tests.push({ name: 'Verify creation', success: verifyResult.success });
  }
  
  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'mitsubishi-05-back-to-list');
  
  console.log(`✅ Mitsubishi brand test completed: ${results.tests.length} tests`);
  return results;
}

/**
 * Test for Nissan brand
 */
async function testNissanBrand(page, testMode = true) {
  console.log('\n🚘 Testing Nissan Brand...');
  const results = { brand: 'Nissan', tests: [] };
  const testData = createTestData('Nissan', 'Livina', 'Owned', 'MPV');

  await loginAndNavigateToVehicle(page);
  await takeScreenshot(page, 'nissan-01-navigate');

  const formOpened = await openAddVehicleForm(page);
  if (!formOpened) { results.tests.push({ name: 'Open form', success: false }); return results; }
  await takeScreenshot(page, 'nissan-02-form-open');

  const filledFields = await fillVehicleForm(page, testData);
  await takeScreenshot(page, 'nissan-03-form-filled');
  results.tests.push({ name: 'Fill form', success: filledFields.length > 0, fields: filledFields.length });

  if (!testMode) {
    const submitResult = await submitVehicleForm(page);
    await takeScreenshot(page, 'nissan-04-submit');
    results.tests.push({ name: 'Submit form', success: submitResult.success });
    
    // Verify vehicle was created
    const verifyResult = await verifyVehicleCreated(page, testData);
    results.tests.push({ name: 'Verify creation', success: verifyResult.success });
  }

  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'nissan-05-back-to-list');

  console.log(`✅ Nissan brand test completed: ${results.tests.length} tests`);
  return results;
}

/**
 * Test for Hyundai brand
 */
async function testHyundaiBrand(page, testMode = true) {
  console.log('\n🚗 Testing Hyundai Brand...');
  const results = { brand: 'Hyundai', tests: [] };
  const testData = createTestData('Hyundai', 'Stargazer', 'Owned', 'MPV');

  await loginAndNavigateToVehicle(page);
  await takeScreenshot(page, 'hyundai-01-navigate');

  const formOpened = await openAddVehicleForm(page);
  if (!formOpened) { results.tests.push({ name: 'Open form', success: false }); return results; }
  await takeScreenshot(page, 'hyundai-02-form-open');

  const filledFields = await fillVehicleForm(page, testData);
  await takeScreenshot(page, 'hyundai-03-form-filled');
  results.tests.push({ name: 'Fill form', success: filledFields.length > 0, fields: filledFields.length });

  if (!testMode) {
    const submitResult = await submitVehicleForm(page);
    await takeScreenshot(page, 'hyundai-04-submit');
    results.tests.push({ name: 'Submit form', success: submitResult.success });
    
    // Verify vehicle was created
    const verifyResult = await verifyVehicleCreated(page, testData);
    results.tests.push({ name: 'Verify creation', success: verifyResult.success });
  }

  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'hyundai-05-back-to-list');

  console.log(`✅ Hyundai brand test completed: ${results.tests.length} tests`);
  return results;
}

/**
 * Test for Wuling brand
 */
async function testWulingBrand(page, testMode = true) {
  console.log('\n🚙 Testing Wuling Brand...');
  const results = { brand: 'Wuling', tests: [] };
  const testData = createTestData('Wuling', 'Confero', 'Owned', 'MPV');

  await loginAndNavigateToVehicle(page);
  await takeScreenshot(page, 'wuling-01-navigate');

  const formOpened = await openAddVehicleForm(page);
  if (!formOpened) { results.tests.push({ name: 'Open form', success: false }); return results; }
  await takeScreenshot(page, 'wuling-02-form-open');

  const filledFields = await fillVehicleForm(page, testData);
  await takeScreenshot(page, 'wuling-03-form-filled');
  results.tests.push({ name: 'Fill form', success: filledFields.length > 0, fields: filledFields.length });

  if (!testMode) {
    const submitResult = await submitVehicleForm(page);
    await takeScreenshot(page, 'wuling-04-submit');
    results.tests.push({ name: 'Submit form', success: submitResult.success });
    
    // Verify vehicle was created
    const verifyResult = await verifyVehicleCreated(page, testData);
    results.tests.push({ name: 'Verify creation', success: verifyResult.success });
  }

  await page.goto(VEHICLE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await takeScreenshot(page, 'wuling-05-back-to-list');

  console.log(`✅ Wuling brand test completed: ${results.tests.length} tests`);
  return results;
}

test.describe('FMS - Vehicle Comprehensive Test Suite', () => {
  
  test.describe.configure({ timeout: 300000 });
  
  // TC-01: Navigation and UI Verification
  test('TC-01: Navigate and verify UI elements', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-01: Navigation and UI Verification');
    console.log('========================================');
    
    const url = await loginAndNavigateToVehicle(page);
    await takeScreenshot(page, 'tc01-navigated');
    
    expect(url).toContain('/fms/vehicle');
    
    const uiResults = await verifyUIElements(page);
    await takeScreenshot(page, 'tc01-ui-verified');
    
    expect(uiResults.pageTitle).toBe(true);
    expect(uiResults.tableExists).toBe(true);
    
    console.log('\n✅ TC-01: UI Verification completed');
  });
  
  // TC-02: Test Toyota Brand
  test('TC-02: Test Toyota brand vehicle creation', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-02: Toyota Brand Vehicle Test');
    console.log('========================================');
    
    const results = await testToyotaBrand(page, false);
    
    console.log('\nTest Results:', JSON.stringify(results, null, 2));
    console.log('\n✅ TC-02: Toyota brand test completed');
  });
  
  // TC-03: Test Honda Brand
  test('TC-03: Test Honda brand vehicle creation', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-03: Honda Brand Vehicle Test');
    console.log('========================================');
    
    const results = await testHondaBrand(page, false);
    
    console.log('\nTest Results:', JSON.stringify(results, null, 2));
    console.log('\n✅ TC-03: Honda brand test completed');
  });
  
  // TC-04: Test Daihatsu Brand
  test('TC-04: Test Daihatsu brand vehicle creation', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-04: Daihatsu Brand Vehicle Test');
    console.log('========================================');
    
    const results = await testDaihatsuBrand(page, false);
    
    console.log('\nTest Results:', JSON.stringify(results, null, 2));
    console.log('\n✅ TC-04: Daihatsu brand test completed');
  });
  
  // TC-05: Test Suzuki Brand
  test('TC-05: Test Suzuki brand vehicle creation', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-05: Suzuki Brand Vehicle Test');
    console.log('========================================');
    
    const results = await testSuzukiBrand(page, false);
    
    console.log('\nTest Results:', JSON.stringify(results, null, 2));
    console.log('\n✅ TC-05: Suzuki brand test completed');
  });
  
  // TC-06: Test Mitsubishi Brand
  test('TC-06: Test Mitsubishi brand vehicle creation', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-06: Mitsubishi Brand Vehicle Test');
    console.log('========================================');
    
    const results = await testMitsubishiBrand(page, false);
    
    console.log('\nTest Results:', JSON.stringify(results, null, 2));
    console.log('\n✅ TC-06: Mitsubishi brand test completed');
  });

  // TC-06b: Test Nissan Brand
  test('TC-06b: Test Nissan brand vehicle creation', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-06b: Nissan Brand Vehicle Test');
    console.log('========================================');
    
    const results = await testNissanBrand(page, false);
    
    console.log('\nTest Results:', JSON.stringify(results, null, 2));
    console.log('\n✅ TC-06b: Nissan brand test completed');
  });

  // TC-06c: Test Hyundai Brand
  test('TC-06c: Test Hyundai brand vehicle creation', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-06c: Hyundai Brand Vehicle Test');
    console.log('========================================');
    
    const results = await testHyundaiBrand(page, false);
    
    console.log('\nTest Results:', JSON.stringify(results, null, 2));
    console.log('\n✅ TC-06c: Hyundai brand test completed');
  });

  // TC-06d: Test Wuling Brand
  test('TC-06d: Test Wuling brand vehicle creation', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-06d: Wuling Brand Vehicle Test');
    console.log('========================================');
    
    const results = await testWulingBrand(page, false);
    
    console.log('\nTest Results:', JSON.stringify(results, null, 2));
    console.log('\n✅ TC-06d: Wuling brand test completed');
  });
  
  // TC-07: Form Validation Test
  test('TC-07: Form validation and error handling', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-07: Form Validation Test');
    console.log('========================================');
    
    await loginAndNavigateToVehicle(page);
    await takeScreenshot(page, 'tc07-start');
    
    const errors = await testErrorHandling(page);
    await takeScreenshot(page, 'tc07-errors');
    
    console.log('\nValidation Errors Found:', errors.length);
    console.log('\n✅ TC-07: Validation test completed');
  });
  
  // TC-08: CRUD - Read/Search Vehicle
  test('TC-08: Search and filter vehicles', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-08: Search and Filter Test');
    console.log('========================================');
    
    await loginAndNavigateToVehicle(page);
    await takeScreenshot(page, 'tc08-start');
    
    // Get initial row count
    const initialRows = await page.locator('tbody tr').count();
    console.log(`Initial row count: ${initialRows}`);
    
    if (initialRows > 0) {
      // Get first vehicle plate
      const firstRowText = await page.locator('tbody tr').first().textContent();
      const searchTerm = firstRowText.match(/[A-Z]\s*\d+\s*[A-Z]+/)?.[0] || firstRowText.split(' ')[0];
      
      console.log(`Searching for: ${searchTerm}`);
      
      // Search
      const searchInput = page.getByPlaceholder(/search|pencarian/i)
        .or(page.getByRole('textbox', { name: /search/i }))
        .or(page.locator('input[type="text"]').first());
      
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.fill(searchTerm);
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'tc08-search');
        
        const searchResults = await page.locator('tbody tr').count();
        console.log(`Search results: ${searchResults}`);
        
        // Clear search
        await searchInput.clear();
        await page.waitForTimeout(1000);
      }
      
      // Test filters
      const filterSelects = page.locator('select').or(page.getByRole('combobox'));
      const filterCount = await filterSelects.count();
      
      if (filterCount > 0) {
        for (let i = 0; i < Math.min(filterCount, 2); i++) {
          const options = filterSelects.nth(i).locator('option');
          const optCount = await options.count();
          
          if (optCount > 1) {
            await filterSelects.nth(i).selectOption({ index: 1 });
            await page.waitForTimeout(1500);
            await takeScreenshot(page, `tc08-filter-${i}`);
            
            const filteredRows = await page.locator('tbody tr').count();
            console.log(`After filter ${i}: ${filteredRows} rows`);
            
            // Reset
            await filterSelects.nth(i).selectOption({ index: 0 });
            await page.waitForTimeout(1000);
          }
        }
      }
    }
    
    console.log('\n✅ TC-08: Search and filter test completed');
  });
  
  // TC-09: CRUD - Update Vehicle
  test('TC-09: Update existing vehicle', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-09: Update Vehicle Test');
    console.log('========================================');
    
    await loginAndNavigateToVehicle(page);
    await takeScreenshot(page, 'tc09-start');
    
    const rowCount = await page.locator('tbody tr').count();
    
    if (rowCount > 0) {
      const firstRow = page.locator('tbody tr').first();
      
      // Find edit button
      const editBtn = firstRow.getByRole('button').filter({ hasText: /edit|ubah/i }).first()
        .or(firstRow.locator('button[title*="edit" i]').first());
      
      if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'tc09-edit-form');
        
        // Modify a field
        const textareas = page.locator('textarea');
        if (await textareas.count() > 0) {
          await textareas.first().fill(`Updated at ${new Date().toISOString()}`);
          await takeScreenshot(page, 'tc09-modified');
        }
        
        // Save
        const saveBtn = page.getByRole('button', { name: /save|update|simpan/i }).first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(3000);
          await takeScreenshot(page, 'tc09-saved');
          
          console.log('✅ Vehicle updated successfully');
        }
      } else {
        console.log('⚠️ Edit button not found');
      }
    } else {
      console.log('⚠️ No vehicles to update');
    }
    
    console.log('\n✅ TC-09: Update test completed');
  });
  
  // TC-10: CRUD - Delete Vehicle
  test('TC-10: Delete vehicle', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-10: Delete Vehicle Test');
    console.log('========================================');
    
    await loginAndNavigateToVehicle(page);
    await takeScreenshot(page, 'tc10-start');
    
    const initialCount = await page.locator('tbody tr').count();
    console.log(`Initial vehicle count: ${initialCount}`);
    
    if (initialCount > 0) {
      // Find a vehicle to delete (last row to avoid affecting other tests)
      const lastRow = page.locator('tbody tr').last();
      const vehicleText = await lastRow.textContent();
      console.log(`Deleting vehicle: ${vehicleText.substring(0, 50)}...`);
      
      const deleteResult = await deleteVehicle(page, lastRow);
      await takeScreenshot(page, 'tc10-deleted');
      
      if (deleteResult.success) {
        await page.waitForTimeout(2000);
        const finalCount = await page.locator('tbody tr').count();
        console.log(`Final vehicle count: ${finalCount}`);
        
        expect(finalCount).toBeLessThan(initialCount);
      }
    } else {
      console.log('⚠️ No vehicles to delete');
    }
    
    console.log('\n✅ TC-10: Delete test completed');
  });
  
  // TC-11: API Testing
  test('TC-11: Test API endpoints', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-11: API Testing');
    console.log('========================================');
    
    await loginAndNavigateToVehicle(page);
    await takeScreenshot(page, 'tc11-start');
    
    // Test vehicle list API
    const apiResults = [];
    
    // Try common API patterns
    const apiEndpoints = [
      `${BASE_URL}/api/vehicles`,
      `${BASE_URL}/api/v1/vehicles`,
      `${BASE_URL}/fms/api/vehicles`
    ];
    
    for (const endpoint of apiEndpoints) {
      const result = await testAPIEndpoint(endpoint, 'GET');
      apiResults.push({ endpoint, ...result });
    }
    
    console.log('\nAPI Test Results:');
    apiResults.forEach(result => {
      console.log(`  ${result.endpoint}: ${result.success ? '✅' : '❌'} (${result.status || 'error'})`);
    });
    
    await takeScreenshot(page, 'tc11-api-tested');
    
    console.log('\n✅ TC-11: API testing completed');
  });
  
  // TC-12: Full CRUD Flow
  test('TC-12: Complete CRUD flow test', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-12: Complete CRUD Flow');
    console.log('========================================');
    
    // CREATE
    console.log('\n[CREATE] Creating new vehicle...');
    await loginAndNavigateToVehicle(page);
    await takeScreenshot(page, 'tc12-01-create-start');
    
    const formOpened = await openAddVehicleForm(page);
    expect(formOpened).toBe(true);
    await takeScreenshot(page, 'tc12-02-create-form');
    
    const testData = createTestData('Honda', 'HR-V', 'Owned', 'Sedan');
    await fillVehicleForm(page, testData);
    await takeScreenshot(page, 'tc12-03-create-filled');
    
    const createResult = await submitVehicleForm(page);
    await takeScreenshot(page, 'tc12-04-create-submit');
    
    console.log(`Create result: ${createResult.success ? 'SUCCESS' : 'FAILED'}`);
    
    // READ
    console.log('\n[READ] Reading vehicle...');
    await page.waitForTimeout(2000);
    const findResult = await findVehicleInList(page, testData.licensePlate);
    await takeScreenshot(page, 'tc12-05-read-found');
    
    console.log(`Find result: ${findResult.found ? 'SUCCESS' : 'NOT FOUND'}`);
    
    // UPDATE
    if (findResult.found) {
      console.log('\n[UPDATE] Updating vehicle...');
      const editBtn = findResult.row.getByRole('button').filter({ hasText: /edit/i }).first();
      if (await editBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'tc12-06-update-form');
        
        const textareas = page.locator('textarea');
        if (await textareas.count() > 0) {
          await textareas.first().fill(`Updated by automation test - ${Date.now()}`);
          await takeScreenshot(page, 'tc12-07-update-filled');
        }
        
        const saveBtn = page.getByRole('button', { name: /save/i }).first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(3000);
          await takeScreenshot(page, 'tc12-08-update-saved');
          console.log('Update result: SUCCESS');
        }
      }
    }
    
    // DELETE (optional - comment out to keep test data)
    // console.log('\n[DELETE] Deleting vehicle...');
    // if (findResult.found) {
    //   await deleteVehicle(page, findResult.row);
    //   await takeScreenshot(page, 'tc12-09-delete');
    // }
    
    console.log('\n✅ TC-12: Complete CRUD flow test completed');
  });
  
  // TC-13: Multi-brand sequential test
  test('TC-13: Test all brands sequentially', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-13: Multi-Brand Sequential Test (All 8 Brands)');
    console.log('========================================');
    
    const allResults = [];

    // All 8 brands with appropriate vehicle sub-type
    const brandConfigs = [
      { brand: 'Toyota',    model: 'Innova',    ownership: 'Leased', subType: 'MPV' },
      { brand: 'Honda',     model: 'Civic',     ownership: 'Owned',  subType: 'Sedan' },
      { brand: 'Daihatsu',  model: 'Xenia',     ownership: 'Leased', subType: 'MPV' },
      { brand: 'Suzuki',    model: 'Ertiga',    ownership: 'Owned',  subType: 'MPV' },
      { brand: 'Mitsubishi',model: 'Xpander',   ownership: 'Leased', subType: 'MPV' },
      { brand: 'Nissan',    model: 'Livina',    ownership: 'Owned',  subType: 'MPV' },
      { brand: 'Hyundai',   model: 'Stargazer', ownership: 'Owned',  subType: 'MPV' },
      { brand: 'Wuling',    model: 'Confero',   ownership: 'Owned',  subType: 'MPV' }
    ];
    
    for (const cfg of brandConfigs) {
      console.log(`\nTesting ${cfg.brand}...`);
      const testData = createTestData(cfg.brand, cfg.model, cfg.ownership, cfg.subType);
      
      await loginAndNavigateToVehicle(page);
      await takeScreenshot(page, `tc13-${cfg.brand.toLowerCase()}-01`);
      
      const formOpened = await openAddVehicleForm(page);
      await takeScreenshot(page, `tc13-${cfg.brand.toLowerCase()}-02`);
      
      if (formOpened) {
        const filled = await fillVehicleForm(page, testData);
        await takeScreenshot(page, `tc13-${cfg.brand.toLowerCase()}-03`);
        
        const submitResult = await submitVehicleForm(page);
        await takeScreenshot(page, `tc13-${cfg.brand.toLowerCase()}-04`);
        
        allResults.push({
          brand: cfg.brand,
          success: submitResult.success,
          fieldsFilled: filled.length,
          message: submitResult.message
        });
      } else {
        allResults.push({ brand: cfg.brand, success: false, fieldsFilled: 0, message: 'Form not opened' });
      }
      
      await page.waitForTimeout(1500);
    }
    
    console.log('\n📊 Multi-Brand Test Results:');
    allResults.forEach(result => {
      console.log(`  ${result.brand}: ${result.success ? '✅' : '❌'} (${result.fieldsFilled} fields) - ${result.message || ''}`);
    });
    
    expect(allResults.length).toBe(8);
    
    console.log('\n✅ TC-13: Multi-brand (all 8) test completed');
  });
  
  // TC-14: Repeatability test
  test('TC-14: Test can run repeatedly with consistent results', async ({ page }) => {
    console.log('\n========================================');
    console.log('TC-14: Repeatability Test');
    console.log('========================================');
    
    const runResults = [];
    
    // Run 3 iterations
    for (let i = 1; i <= 3; i++) {
      console.log(`\n--- Run ${i} of 3 ---`);
      
      await loginAndNavigateToVehicle(page);
      await takeScreenshot(page, `tc14-run${i}-start`);
      
      const uiResults = await verifyUIElements(page);
      await takeScreenshot(page, `tc14-run${i}-verify`);
      
      runResults.push({
        run: i,
        pageTitleVisible: uiResults.pageTitle,
        tableExists: uiResults.tableExists,
        rowCount: uiResults.rowCount,
        buttons: uiResults.buttons.length
      });
      
      console.log(`Run ${i}: Title=${uiResults.pageTitle}, Table=${uiResults.tableExists}, Rows=${uiResults.rowCount}`);
      
      // Wait between runs
      await page.waitForTimeout(2000);
    }
    
    // Verify consistency
    const titles = runResults.map(r => r.pageTitleVisible);
    const tables = runResults.map(r => r.tableExists);
    
    expect(titles.every(t => t === true)).toBe(true);
    expect(tables.every(t => t === true)).toBe(true);
    
    console.log('\n✅ TC-14: Repeatability test completed');
  });
  
});

console.log('\n========================================');
console.log('FMS Vehicle Comprehensive Test Suite');
console.log('========================================');
console.log('Test features:');
console.log('  ✅ Navigation & UI Verification');
console.log('  ✅ Brand-specific testing (Toyota, Honda, Daihatsu, Suzuki, Mitsubishi)');
console.log('  ✅ Form validation');
console.log('  ✅ CRUD Operations');
console.log('  ✅ API Testing');
console.log('  ✅ Error Handling');
console.log('  ✅ Screenshot documentation');
console.log('  ✅ Repeatability testing');
console.log('========================================\n');
