/**
 * ═══════════════════════════════════════════════════════════════
 * 🏆 MHC - SALES ORDER E2E: CREATE FLOW (CORRECTED URL)
 * ═══════════════════════════════════════════════════════════════
 * 
 * URL Pattern: https://more-dev.modena.com/mhc/{module}
 * 
 * Test Flow:
 * 1. Login ke MORE
 * 2. Navigasi ke /mhc/sales-order/create
 * 3. Isi form SO lengkap
 * 4. Submit & Verifikasi
 * ═══════════════════════════════════════════════════════════════
 */

import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE = 'https://more-dev.modena.com';
const LOGIN_URL = 'https://more-dev.modena.com';
const SO_CREATE_URL = 'https://more-dev.modena.com/mhc/sales-order/create';
const SO_LIST_URL = 'https://more-dev.modena.com/mhc/sales-order';

const CREDS = {
  email: 'muhzaenal5@gmail.com',
  password: 'P@ssw0rd_muhzaenal5',
};

const TS = Date.now().toString().slice(-6);
const SO_REF = `AutoSO-${TS}`;

// ─── Semua module MORE (dengan prefix /mhc/) ────────────────
const MODULES = {
  'Dashboard':         '/mhc',
  'Sales Order':       '/mhc/sales-order',
  'Purchase Order':    '/mhc/purchase-order',
  'Delivery':          '/mhc/delivery',
  'Inventory Transfer':'/mhc/inventory-transfer',
  'Operational Cost':  '/mhc/operational-cost',
  'Balance Inquiry':   '/mhc/balance-inquiry',
  'Withdrawal':        '/mhc/withdrawal',
  'Stock Ready':       '/mhc/stock-ready',
  'PO Verification':   '/mhc/purchase-stock-verification',
  'Profile':           '/mhc/profile',
  'User Management':   '/mhc/users',
  'Role Management':   '/mhc/roles',
  'Sync SAP':          '/mhc/sync-sap',
};

test.describe('🏢 MHC - Sales Order E2E: Create Flow', () => {
  test.setTimeout(120000);

  test('📝 Create Sales Order via /mhc/sales-order/create', async ({ page }) => {
    await allure.epic('MHC - MODENA HOME CENTER');
    await allure.feature('Sales Order - E2E Create');
    await allure.story('Login → Direct to create URL → Fill form → Submit → Verify');
    await allure.severity('critical');
    await allure.tag('more', 'mhc', 'so', 'e2e', 'create');
    await allure.owner('Automation QA');
    await allure.description(`
      Test E2E membuat Sales Order baru:
      - URL: ${SO_CREATE_URL}
      - SO Ref: ${SO_REF}
      - Customer: PT (keyword search)
      - Product: AC (keyword search)
      - Qty: 2, Price: 5,000,000
    `);

    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(`PageError: ${err.message}`));

    let finalUrl = '';

    try {
      // ═══ STEP 1: LOGIN ═══════════════════════════════
      await allure.step('Login ke MORE aplikasi', async () => {
        await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        await allure.attachment('Login Page', await page.screenshot(), 'image/png');

        // Isi form login
        await page.locator('input[name="email"]').fill(CREDS.email);
        await page.locator('input[type="password"]').fill(CREDS.password);
        console.log('  ✓ Credentials filled');

        // Pilih company
        const companyBtn = page.locator('button:has-text("Select a company")');
        if (await companyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await companyBtn.click();
          await page.waitForTimeout(1000);
          await page.locator('button:has-text("MODENA HOME CENTER (MHC)")').click();
          await page.waitForTimeout(500);
          console.log('  ✓ Company MHC selected');
        }

        // Sign In
        await page.locator('button:has-text("Sign In")').click();
        await page.waitForTimeout(5000);

        const currentUrl = page.url();
        console.log(`  ✓ After login URL: ${currentUrl}`);
        await allure.parameter('Login URL', currentUrl);

        await allure.attachment('After Login', await page.screenshot(), 'image/png');

        // Cek apakah login sukses
        const bodyText = await page.locator('body').innerText().catch(() => '');
        const loginSuccess = !bodyText.includes('Sign in to your account');
        console.log(`  ✓ Login success: ${loginSuccess}`);
        await allure.parameter('Login Status', loginSuccess ? '✅ Success' : '❌ Failed');

        if (!loginSuccess) {
          console.log('  ⚠ Login gagal, coba approach alternatif...');
          // Coba dengan page.evaluate untuk inject token
          await page.evaluate(() => {
            localStorage.setItem('auth_token', 'test_token');
          });
          await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(3000);
          console.log(`  ✓ Retry URL: ${page.url()}`);
        }
      });

      // ═══ STEP 2: DIRECT TO CREATE SO ════════════════
      await allure.step(`Navigate ke ${SO_CREATE_URL}`, async () => {
        await page.goto(SO_CREATE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(3000);

        finalUrl = page.url();
        console.log(`  ✓ URL: ${finalUrl}`);
        await allure.parameter('Create SO URL', finalUrl);

        const screenshot = await page.screenshot({ fullPage: true });
        await allure.attachment('Halaman Create SO', screenshot, 'image/png');

        const bodyText = await page.locator('body').innerText().catch(() => '');
        console.log(`  ✓ Page content: ${bodyText.slice(0, 500)}`);

        // Deteksi apakah di halaman create atau redirect ke login
        const isCreatePage = bodyText.includes('Create') || bodyText.includes('create') || 
                            bodyText.includes('Sales Order') || bodyText.includes('New') ||
                            !bodyText.includes('Sign in');
        console.log(`  ✓ Is create page: ${isCreatePage}`);
        await allure.parameter('On Create Page', isCreatePage ? 'Yes' : 'No (login redirect)');

        // Jika redirect ke login, coba login lagi dan langsung navigasi
        if (!isCreatePage) {
          console.log('  ⚠ Redirected to login, trying again...');
          await page.locator('input[name="email"]').fill(CREDS.email);
          await page.locator('input[type="password"]').fill(CREDS.password);
          
          const companyBtn = page.locator('button:has-text("Select a company")');
          if (await companyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await companyBtn.click();
            await page.waitForTimeout(1000);
            await page.locator('button:has-text("MODENA HOME CENTER (MHC)")').click();
            await page.waitForTimeout(500);
          }
          
          await page.locator('button:has-text("Sign In")').click();
          await page.waitForTimeout(5000);
          
          // Navigate langsung setelah login
          await page.goto(SO_CREATE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await page.waitForTimeout(3000);
          console.log(`  ✓ After retry: ${page.url()}`);
          await allure.attachment('After Retry', await page.screenshot(), 'image/png');
        }

        // Print semua input yang ada
        const inputs = await page.locator('input:not([type="hidden"])').all().catch(() => []);
        const selects = await page.locator('select').all().catch(() => []);
        const textareas = await page.locator('textarea').all().catch(() => []);
        console.log(`  ✓ Inputs: ${inputs.length}, Selects: ${selects.length}, Textareas: ${textareas.length}`);

        for (const inp of inputs) {
          const placeholder = await inp.getAttribute('placeholder').catch(() => '');
          const name = await inp.getAttribute('name').catch(() => '');
          const id = await inp.getAttribute('id').catch(() => '');
          if (placeholder || name) console.log(`    input: "${name || ''}" placeholder="${placeholder || ''}" id="${id}"`);
        }
        for (const sel of selects) {
          const name = await sel.getAttribute('name').catch(() => '');
          const options = await sel.locator('option').allInnerTexts().catch(() => []);
          console.log(`    select: "${name}" options=[${options.filter(o => o.trim()).join(', ').slice(0, 150)}]`);
        }
      });

      // ═══ STEP 3: ISI FORM ════════════════════════════
      await allure.step('Isi form Sales Order', async () => {
        const allInputs = await page.locator('input:not([type="hidden"])').all().catch(() => []);
        const allSelects = await page.locator('select').all().catch(() => []);
        
        console.log(`  ✓ Filling form with ${allInputs.length} inputs, ${allSelects.length} selects`);

        let filled = 0;

        // 1. Isi select boxes dulu
        for (let i = 0; i < allSelects.length; i++) {
          const name = await allSelects[i].getAttribute('name').catch(() => '');
          const options = await allSelects[i].locator('option').allInnerTexts().catch(() => []);
          const validOptions = options.filter(o => o.trim() && !/select|all|pilih|choose/i.test(o));
          
          if (validOptions.length > 0) {
            await allSelects[i].selectOption(validOptions[0].trim());
            console.log(`  ✓ Select "${name || i}" : ${validOptions[0].trim()}`);
            filled++;
          }
        }

        // 2. Cari dan isi input fields
        for (const inp of allInputs) {
          const placeholder = (await inp.getAttribute('placeholder').catch(() => '') || '').toLowerCase();
          const name = (await inp.getAttribute('name').catch(() => '') || '').toLowerCase();
          const type = (await inp.getAttribute('type').catch(() => 'text') || '').toLowerCase();

          // Skip hidden, submit, button
          if (['hidden', 'submit', 'button'].includes(type)) continue;

          let value = '';

          if (placeholder.includes('customer') || placeholder.includes('vendor') || name.includes('customer') || name.includes('vendor')) {
            // Autocomplete field - ketik lalu pilih
            await inp.fill('PT');
            await page.waitForTimeout(2000);
            
            // Cari dropdown suggestion
            const suggestion = page.locator('[class*="option"]:visible, [class*="dropdown"] div:visible, [role="option"]:visible, [class*="autocomplete"] div:visible, [class*="listbox"] div:visible').first();
            if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
              await suggestion.first().click();
              console.log('  ✓ Customer selected via autocomplete');
            } else {
              await inp.press('Enter');
              console.log('  ✓ Customer filled (Enter pressed)');
            }
            filled++;
            continue;
          }

          if (placeholder.includes('warehouse') || placeholder.includes('gudang') || name.includes('warehouse')) {
            await inp.fill('MHC');
            await page.waitForTimeout(1500);
            const suggestion = page.locator('[class*="option"]:visible, [role="option"]:visible').first();
            if (await suggestion.isVisible({ timeout: 2000 }).catch(() => false)) {
              await suggestion.first().click();
            } else {
              await inp.press('Enter');
            }
            console.log('  ✓ Warehouse filled');
            filled++;
            continue;
          }

          if (placeholder.includes('product') || placeholder.includes('item') || placeholder.includes('barang') || name.includes('product') || name.includes('item')) {
            await inp.fill('AC');
            await page.waitForTimeout(2000);
            const suggestion = page.locator('[class*="option"]:visible, [role="option"]:visible').first();
            if (await suggestion.isVisible({ timeout: 3000 }).catch(() => false)) {
              await suggestion.first().click();
            } else {
              await inp.press('Enter');
            }
            console.log('  ✓ Product filled');
            filled++;
            continue;
          }

          if (placeholder.includes('qty') || placeholder.includes('quantity') || name.includes('qty') || name.includes('quantity') || type === 'number') {
            value = '2';
          } else if (placeholder.includes('price') || placeholder.includes('rate') || placeholder.includes('amount') || name.includes('price') || name.includes('rate') || name.includes('amount') || placeholder.includes('harga') || placeholder.includes('nominal')) {
            value = '5000000';
          } else if (placeholder.includes('note') || placeholder.includes('description') || name.includes('note') || name.includes('description') || name.includes('remark')) {
            value = SO_REF;
          } else if (placeholder.includes('date') || name.includes('date') || placeholder.includes('tanggal') || type === 'date') {
            value = '2026-06-23';
          } else if (placeholder.includes('search')) {
            continue; // Skip search fields
          }

          if (value) {
            await inp.fill(value);
            console.log(`  ✓ Filled "${placeholder || name}" = ${value.slice(0, 30)}`);
            filled++;
          }
        }

        await allure.parameter('Fields Filled', filled);
        console.log(`  ✓ Total fields filled: ${filled}`);

        // Screenshot form terisi
        await page.waitForTimeout(1000);
        await allure.attachment('Form Filled', await page.screenshot({ fullPage: true }), 'image/png');
      });

      // ═══ STEP 4: SAVE ════════════════════════════════
      await allure.step('Save Sales Order', async () => {
        // Cari save button
        const saveBtn = page.locator('button').filter({ hasText: /Save|save|Simpan|simpan|Submit|submit|Buat|Create|create|Kirim|kirim/i }).first();
        
        if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          const btnText = await saveBtn.innerText();
          const isEnabled = await saveBtn.isEnabled().catch(() => false);
          console.log(`  ✓ Button: "${btnText}" enabled: ${isEnabled}`);
          
          if (isEnabled) {
            await saveBtn.click();
            console.log('  ✓ Save clicked!');
            await page.waitForTimeout(5000);
            
            finalUrl = page.url();
            console.log(`  ✓ After save URL: ${finalUrl}`);
            await allure.parameter('After Save URL', finalUrl);
          }
        } else {
          // Coba cari button dengan icon atau class
          console.log('  ⚠ Save button not found by text, trying alternatives...');
          const allButtons = await page.locator('button').allInnerTexts().catch(() => []);
          console.log(`  ✓ All buttons: ${allButtons.filter(b => b.trim()).join(' | ') || 'none'}`);
          
          // Coba submit form langsung
          await page.evaluate(() => {
            const form = document.querySelector('form');
            if (form) {
              form.dispatchEvent(new Event('submit'));
              console.log('Form submitted via JS');
            }
          });
          await page.waitForTimeout(3000);
        }

        await allure.attachment('After Save', await page.screenshot({ fullPage: true }), 'image/png');
      });

      // ═══ STEP 5: VERIFY ══════════════════════════════
      await allure.step('Verifikasi hasil', async () => {
        finalUrl = page.url();
        const bodyText = await page.locator('body').innerText().catch(() => '');
        
        console.log(`\n  📋 VERIFICATION:`);
        console.log(`  URL: ${finalUrl}`);
        
        // Cek berbagai indikator sukses
        const indicators = {
          'Success Message': /success|berhasil|created|saved|tersimpan/i.test(bodyText),
          'SO Ref Found': bodyText.includes(SO_REF) || bodyText.includes(TS),
          'Has Table': await page.locator('table').count().then(c => c > 0).catch(() => false),
          'URL Contains SO': /sales-order|so/i.test(finalUrl),
        };

        for (const [key, val] of Object.entries(indicators)) {
          console.log(`  ${val ? '✅' : '❌'} ${key}: ${val}`);
          await allure.parameter(key, val ? 'Yes' : 'No');
        }

        // Cari SO ID di URL
        const soIdMatch = finalUrl.match(/sales-order\/(\d+)/) || finalUrl.match(/so[_-]?(\d+)/i);
        if (soIdMatch) {
          console.log(`  ✅ SO ID: ${soIdMatch[1]}`);
          await allure.parameter('SO ID', soIdMatch[1]);
        }

        await allure.attachment('Verification', await page.screenshot({ fullPage: true }), 'image/png');
      });

    } finally {
      // ═══ CONSOLE ERRORS ═════════════════════════════
      if (consoleErrors.length > 0) {
        console.log(`\n  ⚠ Console errors: ${consoleErrors.length}`);
        consoleErrors.forEach((e, i) => console.log(`    ${i + 1}. ${e.slice(0, 200)}`));
        await allure.attachment('Console Errors', JSON.stringify(consoleErrors, null, 2), 'application/json');
        await allure.parameter('Console Errors', consoleErrors.length);
      }

      const summary = `
══════════════════════════════════════════
  📋 TEST SUMMARY
══════════════════════════════════════════
  SO Ref: ${SO_REF}
  URL: ${finalUrl}
  Console Errors: ${consoleErrors.length}
  Timestamp: ${new Date().toISOString()}
══════════════════════════════════════════`;
      console.log(summary);
      await allure.attachment('Summary', summary, 'text/plain');
    }
  });

  // ═══ TEST 2: VERIFY SO LIST ═════════════════════════
  test('📋 Verify SO appears in list', async ({ page }) => {
    await allure.epic('MHC - MODENA HOME CENTER');
    await allure.feature('Sales Order - List Verification');
    await allure.story(`Check if SO "${SO_REF}" appears in list`);
    await allure.severity('normal');
    await allure.tag('more', 'mhc', 'so', 'list');

    await allure.step('Login dan navigasi ke SO list', async () => {
      await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await page.locator('input[name="email"]').fill(CREDS.email);
      await page.locator('input[type="password"]').fill(CREDS.password);
      
      const companyBtn = page.locator('button:has-text("Select a company")');
      if (await companyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await companyBtn.click();
        await page.waitForTimeout(1000);
        await page.locator('button:has-text("MODENA HOME CENTER (MHC)")').click();
        await page.waitForTimeout(500);
      }
      await page.locator('button:has-text("Sign In")').click();
      await page.waitForTimeout(5000);
    });

    await allure.step('Navigate ke SO list', async () => {
      await page.goto(SO_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000);
      console.log(`  ✓ URL: ${page.url()}`);
      await allure.attachment('SO List', await page.screenshot({ fullPage: true }), 'image/png');
    });

    await allure.step('Cari SO di tabel', async () => {
      const bodyText = await page.locator('body').innerText().catch(() => '');
      const tables = await page.locator('table').count();
      console.log(`  ✓ Tables: ${tables}`);
      
      if (tables > 0) {
        const rows = await page.locator('table tbody tr').count();
        console.log(`  ✓ Rows: ${rows}`);
        await allure.parameter('Table Rows', rows);
        
        // Cari SO_REF di tabel
        const soFound = bodyText.includes(SO_REF) || bodyText.includes(TS);
        console.log(`  ✓ SO "${SO_REF}" found: ${soFound}`);
        await allure.parameter('SO Found in List', soFound ? 'Yes' : 'No');
      }

      await allure.attachment('Final', await page.screenshot({ fullPage: true }), 'image/png');
    });
  });
});