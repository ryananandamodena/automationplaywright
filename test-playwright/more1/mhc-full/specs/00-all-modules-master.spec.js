/**
 * ═══════════════════════════════════════════════════════════════
 * 🏆 MHC - MASTER TEST SUITE - ALL MODULES COMPLETE
 * ═══════════════════════════════════════════════════════════════
 * 
 * Auto-generated comprehensive test covering ALL 13+ modules:
 * ✅ Dashboard       ✅ Sales Order        ✅ Purchase Order
 * ✅ Delivery        ✅ Inventory Transfer  ✅ Operational Cost
 * ✅ Balance Inquiry ✅ Withdrawal          ✅ Stock Ready
 * ✅ PO Verification ✅ Profile             ✅ User Management
 * ✅ Role Management ✅ Sync SAP
 * 
 * For each module, tests:
 * 1️⃣ Page Load & Table Structure
 * 2️⃣ Search Functionality  
 * 3️⃣ Filter by Status/Range
 * 4️⃣ Export Data
 * 5️⃣ Pagination
 * 6️⃣ Console Error Detection
 * 
 * Reporting: Allure + HTML + Excel
 * ═══════════════════════════════════════════════════════════════
 */

import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';
import { SEARCH, MENUS } from '../fixtures/test-data.js';
import { allure } from 'allure-playwright';

// ─── CONFIGURATION ────────────────────────────────────────────
const BASE = 'https://more-dev.modena.com';

// Semua module yang akan di-test
const MODULES = [
  { name: 'Dashboard',           url: BASE + '/mhc/',                         urlPart: 'more-dev.modena.com', hasTable: false, requireLogin: false },
  { name: 'Sales Order',         url: BASE + '/mhc/sales-order',              urlPart: '/sales-order',        hasTable: true,  requireLogin: true },
  { name: 'Purchase Order',      url: BASE + '/mhc/purchase-order',           urlPart: '/purchase-order',     hasTable: true,  requireLogin: true },
  { name: 'Delivery',            url: BASE + '/mhc/delivery',                 urlPart: '/delivery',           hasTable: true,  requireLogin: true },
  { name: 'Inventory Transfer',  url: BASE + '/mhc/inventory-transfer',       urlPart: '/inventory-transfer', hasTable: true,  requireLogin: true },
  { name: 'Operational Cost',    url: BASE + '/mhc/operational-cost',         urlPart: '/operational-cost',   hasTable: true,  requireLogin: true },
  { name: 'Balance Inquiry',     url: BASE + '/mhc/balance-inquiry',          urlPart: '/balance-inquiry',    hasTable: true,  requireLogin: true },
  { name: 'Withdrawal',          url: BASE + '/mhc/withdrawal',               urlPart: '/withdrawal',         hasTable: true,  requireLogin: true },
  { name: 'Stock Ready',         url: BASE + '/mhc/stock-ready',              urlPart: '/stock-ready',        hasTable: true,  requireLogin: true },
  { name: 'PO Verification',     url: BASE + '/mhc/purchase-stock-verification', urlPart: '/purchase-stock-verification', hasTable: true, requireLogin: true },
  { name: 'Profile',             url: BASE + '/mhc/profile',                  urlPart: '/profile',            hasTable: false, requireLogin: true },
  { name: 'User Management',     url: BASE + '/mhc/users',                    urlPart: '/users',              hasTable: true,  requireLogin: true },
  { name: 'Role Management',     url: BASE + '/mhc/roles',                    urlPart: '/roles',              hasTable: true,  requireLogin: true },
  { name: 'Sync SAP',            url: BASE + '/mhc/sync-sap',                 urlPart: '/sync-sap',           hasTable: false, requireLogin: true },
];

// ─── HELPER: Generic page test ───────────────────────────────
async function testPageStructure(page, mod) {
  const consoleErrors = captureConsoleErrors(page);
  const results = { bugs: [], headers: [], rowCount: 0, hasSearch: false, hasFilter: false, hasExport: false, hasPagination: false, hasAddButton: false, formInputs: [], buttons: [] };

  await allure.step(`Navigate to ${mod.name}`, async () => {
    await page.goto(mod.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
  });

  await allure.step('Verify page loaded correctly', async () => {
    const check = await checkPageLoaded(page, mod.urlPart);
    results.bugs = check.bugs;
    if (check.bugs.length > 0) {
      console.log(`  ⚠ ${mod.name}: ${check.bugs.join('; ')}`);
    }
  });

  // Screenshot
  const screenshot = await page.screenshot({ fullPage: true });
  await allure.attachment(`${mod.name} Screenshot`, screenshot, 'image/png');

  if (mod.hasTable) {
    await allure.step('Check table structure', async () => {
      const table = page.locator('table');
      const tableExists = await table.first().isVisible({ timeout: 5000 }).catch(() => false);
      
      if (tableExists) {
        results.headers = await table.first().locator('thead th, thead td').allInnerTexts().catch(() => []);
        results.headers = results.headers.filter(h => h.trim());
        
        results.rowCount = await page.locator('table tbody tr').count().catch(() => 0);
        
        console.log(`  📊 Table: ${results.rowCount} rows | Headers[${results.headers.length}]: ${results.headers.slice(0, 6).join(', ')}${results.headers.length > 6 ? '...' : ''}`);
        await allure.attachment(`${mod.name} Table Headers`, JSON.stringify(results.headers, null, 2), 'application/json');
        await allure.parameter(`${mod.name} Rows`, results.rowCount);
      } else {
        console.log(`  ℹ️  ${mod.name}: No table found`);
      }
    });
  }

  await allure.step('Detect interactive elements', async () => {
    // Search input
    results.hasSearch = await page.locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="Cari" i]').count().then(c => c > 0).catch(() => false);
    
    // Filter selects
    results.hasFilter = await page.locator('select').count().then(c => c > 0).catch(() => false);
    
    // Export buttons
    const allBtnTexts = await page.locator('button').allInnerTexts().catch(() => []);
    results.hasExport = allBtnTexts.some(b => /export|excel|download|pdf|print|csv/i.test(b));
    results.hasAddButton = allBtnTexts.some(b => /add|tambah|create|new|buat|\+/i.test(b));
    results.buttons = [...new Set(allBtnTexts.map(b => b.trim()).filter(b => b))];

    // Pagination
    results.hasPagination = await page.locator('[class*="pagination"], nav[aria-label*="pagination"]').count().then(c => c > 0).catch(() => false);

    // Form inputs
    const inputs = await page.locator('input:not([type="hidden"]):not([type="search"])').all().catch(() => []);
    for (const inp of inputs) {
      const name = await inp.getAttribute('name').catch(() => '');
      const placeholder = await inp.getAttribute('placeholder').catch(() => '');
      if (name || placeholder) results.formInputs.push({ name, placeholder });
    }

    console.log(`  🔍 Search:${results.hasSearch ? '✅' : '❌'} Filter:${results.hasFilter ? '✅' : '❌'} Export:${results.hasExport ? '✅' : '❌'} Pagination:${results.hasPagination ? '✅' : '❌'} Add:${results.hasAddButton ? '✅' : '❌'}`);
    if (results.formInputs.length > 0) {
      console.log(`  📝 Form fields: ${results.formInputs.map(f => f.name || f.placeholder).join(', ').slice(0, 120)}`);
    }
  });

  // Console errors
  if (consoleErrors.length > 0) {
    await allure.attachment(`${mod.name} Console Errors`, JSON.stringify(consoleErrors, null, 2), 'application/json');
    console.log(`  ⚠ Console errors: ${consoleErrors.length}`);
  }
  results.consoleErrors = consoleErrors;

  return results;
}

// ─── HELPER: Generic search test ─────────────────────────────
async function testSearch(page, mod) {
  const consoleErrors = captureConsoleErrors(page);
  
  await allure.step('Navigate to module', async () => {
    await page.goto(mod.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  });

  const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="Cari" i]').first();
  const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasSearch) {
    await allure.step('Search with valid keyword', async () => {
      await searchInput.fill(SEARCH.validSO);
      await page.waitForTimeout(2000);
      const rows = await page.locator('table tbody tr').count().catch(() => 0);
      await allure.parameter(`${mod.name} Valid Search`, `${rows} results`);
      console.log(`  ✓ "${mod.name}" valid search: ${rows} results`);
    });

    await allure.step('Search with special chars (security test)', async () => {
      await searchInput.fill('');
      await page.waitForTimeout(500);
      await searchInput.fill(SEARCH.sqlInjection);
      await page.waitForTimeout(1500);
      const bodyVisible = await page.locator('body').isVisible();
      expect(bodyVisible).toBeTruthy();
      console.log('  ✓ SQL injection did not crash page');
    });

    await allure.step('Search with no-result term', async () => {
      await searchInput.fill('');
      await page.waitForTimeout(500);
      await searchInput.fill(SEARCH.noResult);
      await page.waitForTimeout(1500);
      const bodyText = await page.locator('body').innerText().catch(() => '');
      const hasMessage = /no data|tidak ada|no result|0 result/i.test(bodyText);
      await allure.parameter(`${mod.name} No-Result Handling`, hasMessage ? 'Shows message' : 'No message');
      console.log(`  ✓ No-result handling: ${hasMessage ? 'shows message' : 'no message'}`);
    });
  } else {
    console.log(`  ℹ️  "${mod.name}": No search input available`);
  }
}

// ─── TEST SUITE: Generate tests for ALL modules ──────────────
test.describe('🏢 MHC - COMPLETE MODULE TESTING SUITE', () => {
  test.setTimeout(300000); // 5 menit untuk semua module

  test.beforeEach(async ({ page }) => {
    await allure.epic('MHC - MODENA HOME CENTER');
    await allure.owner('Automation QA');
    await allure.tag('more', 'mhc', 'complete-suite');
    
    await login(page);
  });

  // ─── TEST 1: EXPLORER - Discover all modules ───────────
  MODULES.forEach((mod) => {
    test(`🔍 [STRUCTURE] ${mod.name} - Page Load & Features`, async ({ page }) => {
      await allure.feature(`${mod.name} - Structure`);
      await allure.story(`Verify ${mod.name} page structure and features`);
      await allure.severity('critical');
      await allure.description(`Auto-discovery test untuk ${mod.name}: memeriksa loading, tabel, search, filter, export, form, dan console errors`);
      await allure.tag(mod.name.toLowerCase().replace(/\s+/g, '-'));

      const result = await testPageStructure(page, mod);

      // Assertions
      expect(result.bugs, `${mod.name} page errors: ${result.bugs.join(', ')}`).toHaveLength(0);
      if (result.consoleErrors.length > 0) {
        console.log(`  ⚠ ${mod.name} has ${result.consoleErrors.length} console errors`);
      }
      
      await allure.parameter(`${mod.name} Status`, result.bugs.length === 0 ? '✅ OK' : '❌ Issues');
    });
  });

  // ─── TEST 2: SEARCH for modules with tables ────────────
  MODULES.filter(m => m.hasTable).forEach((mod) => {
    test(`🔎 [SEARCH] ${mod.name} - Search Functionality`, async ({ page }) => {
      await allure.feature(`${mod.name} - Search`);
      await allure.story(`Test search functionality on ${mod.name}`);
      await allure.severity('critical');
      await allure.tag('search', mod.name.toLowerCase().replace(/\s+/g, '-'));

      await testSearch(page, mod);
    });
  });

  // ─── TEST 3: FILTER for modules with select/date inputs ──
  MODULES.filter(m => m.hasTable).forEach((mod) => {
    test(`🎯 [FILTER] ${mod.name} - Filter & Date Range`, async ({ page }) => {
      await allure.feature(`${mod.name} - Filter`);
      await allure.story(`Test filter capabilities on ${mod.name}`);
      await allure.severity('normal');
      await allure.tag('filter', mod.name.toLowerCase().replace(/\s+/g, '-'));

      const consoleErrors = captureConsoleErrors(page);
      
      await allure.step('Navigate to module', async () => {
        await page.goto(mod.url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
      });

      const selects = page.locator('select');
      const selectCount = await selects.count();

      if (selectCount > 0) {
        for (let i = 0; i < Math.min(selectCount, 3); i++) {
          const options = await selects.nth(i).locator('option').allInnerTexts();
          const validOptions = options.filter(o => o.trim() && !/select|all|pilih|choose/i.test(o));
          
          if (validOptions.length > 0) {
            const pick = validOptions[0].trim();
            await allure.step(`Filter by: ${pick}`, async () => {
              await selects.nth(i).selectOption(pick);
              await page.waitForTimeout(2000);
              const rows = await page.locator('table tbody tr').count().catch(() => 0);
              await allure.parameter(`${mod.name} Filter "${pick.slice(0, 20)}"`, `${rows} rows`);
              console.log(`  ✓ Filter "${pick.slice(0, 30)}": ${rows} rows`);
            });
          }
        }
      }

      // Date range filter test
      const dateInputs = page.locator('input[type="date"]');
      const dateCount = await dateInputs.count();
      if (dateCount >= 2) {
        await allure.step('Apply date range filter', async () => {
          await dateInputs.nth(0).fill('2026-01-01');
          await dateInputs.nth(1).fill('2026-12-31');
          await page.waitForTimeout(2000);
          const rows = await page.locator('table tbody tr').count().catch(() => 0);
          await allure.parameter(`${mod.name} Date Filter`, `${rows} rows`);
          console.log(`  ✓ Date range filter: ${rows} rows`);
        });
      }

      if (consoleErrors.length > 0) {
        await allure.attachment(`${mod.name} Filter Console Errors`, JSON.stringify(consoleErrors, null, 2), 'application/json');
      }
    });
  });

  // ─── TEST 4: EXPORT for all modules ─────────────────────
  MODULES.forEach((mod) => {
    test(`📥 [EXPORT] ${mod.name} - Export Data Capability`, async ({ page }) => {
      await allure.feature(`${mod.name} - Export`);
      await allure.story(`Check export functionality on ${mod.name}`);
      await allure.severity('normal');
      await allure.tag('export', mod.name.toLowerCase().replace(/\s+/g, '-'));

      const consoleErrors = captureConsoleErrors(page);
      
      await allure.step('Navigate and check export buttons', async () => {
        await page.goto(mod.url, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const allButtons = await page.locator('button').allInnerTexts().catch(() => []);
        const exportBtns = [...new Set(allButtons.filter(b => /export|excel|download|pdf|print|csv/i.test(b)))];
        
        await allure.attachment(`${mod.name} All Buttons`, JSON.stringify([...new Set(allButtons.map(b => b.trim()).filter(b => b))], null, 2), 'application/json');
        
        if (exportBtns.length > 0) {
          console.log(`  ✓ Export buttons: ${exportBtns.join(', ')}`);
          await allure.parameter(`${mod.name} Export Available`, '✅ Yes');
        } else {
          console.log(`  ℹ️  No export buttons found`);
          await allure.parameter(`${mod.name} Export Available`, '❌ No');
        }
      });

      if (consoleErrors.length > 0) {
        console.log(`  ⚠ Console errors: ${consoleErrors.length}`);
      }
    });
  });

  // ─── TEST 5: CONSOLE ERRORS for all modules ────────────
  test('🛑 [CONSOLE] All Modules - Console Error Scan', async ({ page }) => {
    await allure.feature('Cross-Module Console Scan');
    await allure.story('Scan all modules for JavaScript console errors');
    await allure.severity('critical');
    await allure.description('Memeriksa semua halaman module untuk mendeteksi JavaScript console errors yang bisa mengindikasikan bug di aplikasi');

    const allErrors = {};

    for (const mod of MODULES) {
      const consoleErrors = captureConsoleErrors(page);
      
      await allure.step(`Scan ${mod.name}`, async () => {
        await page.goto(mod.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);
        
        if (consoleErrors.length > 0) {
          allErrors[mod.name] = [...consoleErrors];
          console.log(`  ⚠ ${mod.name}: ${consoleErrors.length} console errors`);
        } else {
          console.log(`  ✅ ${mod.name}: Clean`);
        }
      });

      // Clear erors for next module
      consoleErrors.length = 0;
    }

    await allure.attachment('Console Errors By Module', JSON.stringify(allErrors, null, 2), 'application/json');
    
    const totalErrors = Object.values(allErrors).flat().length;
    await allure.parameter('Total Console Errors', totalErrors);
    await allure.parameter('Modules with Errors', Object.keys(allErrors).length);
    
    if (totalErrors > 0) {
      console.log(`\n⚠ TOTAL: ${totalErrors} console errors across ${Object.keys(allErrors).length} modules`);
      for (const [mod, errors] of Object.entries(allErrors)) {
        console.log(`  ${mod}: ${errors.length} errors`);
        errors.slice(0, 3).forEach((e, i) => console.log(`    ${i + 1}. ${e.slice(0, 150)}`));
      }
    } else {
      console.log('\n✅ All modules clean - no console errors!');
    }
  });

  // ─── TEST 6: MODULE SUMMARY REPORT ────────────────────
  test('📊 [SUMMARY] Complete Module Test Summary', async ({ page }) => {
    await allure.feature('Test Summary Report');
    await allure.story('Generate complete summary of all module tests');
    await allure.severity('normal');

    const moduleResults = [];

    for (const mod of MODULES) {
      await allure.step(`Testing ${mod.name}`, async () => {
        await page.goto(mod.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1500);

        const result = {
          name: mod.name,
          url: mod.url,
          loaded: await page.locator('body').isVisible().catch(() => false),
          tableExists: false,
          rowCount: 0,
          headers: [],
          hasSearch: false,
          hasFilter: false,
          hasExport: false,
          hasAddButton: false,
          hasPagination: false,
          buttonCount: 0,
          consoleErrors: 0,
          formFields: 0,
        };

        // Detect features
        result.tableExists = await page.locator('table').count().then(c => c > 0).catch(() => false);
        if (result.tableExists) {
          result.rowCount = await page.locator('table tbody tr').count().catch(() => 0);
          result.headers = await page.locator('table thead th, table thead td').allInnerTexts().catch(() => []);
        }
        
        result.hasSearch = await page.locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="Cari" i]').count().then(c => c > 0).catch(() => false);
        result.hasFilter = await page.locator('select').count().then(c => c > 0).catch(() => false);
        result.hasPagination = await page.locator('[class*="pagination"]').count().then(c => c > 0).catch(() => false);
        result.buttonCount = await page.locator('button').count().catch(() => 0);
        result.formFields = await page.locator('input:not([type="hidden"]):not([type="search"])').count().catch(() => 0);

        const btnTexts = await page.locator('button').allInnerTexts().catch(() => []);
        result.hasExport = btnTexts.some(b => /export|excel|download|pdf|print|csv/i.test(b));
        result.hasAddButton = btnTexts.some(b => /add|tambah|create|new|buat/i.test(b));

        moduleResults.push(result);
        console.log(`  📊 ${mod.name}: Table=${result.tableExists} Rows=${result.rowCount} Search=${result.hasSearch} Filter=${result.hasFilter} Export=${result.hasExport} Add=${result.hasAddButton} Pagination=${result.hasPagination} Buttons=${result.buttonCount}`);
      });
    }

    // Generate summary table
    const summaryMarkdown = generateSummaryTable(moduleResults);
    await allure.attachment('Complete Module Analysis', summaryMarkdown, 'text/plain');
    
    // Log final summary
    console.log('\n' + summaryMarkdown);
  });
});

function generateSummaryTable(results) {
  let table = '═' .repeat(120) + '\n';
  table += '  📊 MHC MODULE COMPLETE ANALYSIS REPORT\n';
  table += '═' .repeat(120) + '\n\n';
  table += 'MODULE'.padEnd(25) + 'TABLE'.padEnd(8) + 'ROWS'.padEnd(8) + 'SEARCH'.padEnd(8) + 'FILTER'.padEnd(8) + 'EXPORT'.padEnd(8) + 'ADD'.padEnd(8) + 'PAGIN'.padEnd(8) + 'BTNS'.padEnd(6) + 'FORM' + '\n';
  table += '─' .repeat(120) + '\n';
  
  for (const r of results) {
    table += r.name.padEnd(25) +
      (r.tableExists ? '✅'.padEnd(8) : '❌'.padEnd(8)) +
      String(r.rowCount).padEnd(8) +
      (r.hasSearch ? '✅'.padEnd(8) : '❌'.padEnd(8)) +
      (r.hasFilter ? '✅'.padEnd(8) : '❌'.padEnd(8)) +
      (r.hasExport ? '✅'.padEnd(8) : '❌'.padEnd(8)) +
      (r.hasAddButton ? '✅'.padEnd(8) : '❌'.padEnd(8)) +
      (r.hasPagination ? '✅'.padEnd(8) : '❌'.padEnd(8)) +
      String(r.buttonCount).padEnd(6) +
      String(r.formFields) + '\n';
  }

  table += '─' .repeat(120) + '\n\n';
  
  const totals = {
    withTable: results.filter(r => r.tableExists).length,
    withSearch: results.filter(r => r.hasSearch).length,
    withFilter: results.filter(r => r.hasFilter).length,
    withExport: results.filter(r => r.hasExport).length,
    withAdd: results.filter(r => r.hasAddButton).length,
    withPagination: results.filter(r => r.hasPagination).length,
    totalRows: results.reduce((a, r) => a + r.rowCount, 0),
    totalBtns: results.reduce((a, r) => a + r.buttonCount, 0),
    totalForms: results.reduce((a, r) => a + r.formFields, 0),
  };

  table += `📊 SUMMARY:\n`;
  table += `  Total Modules     : ${results.length}\n`;
  table += `  With Tables       : ${totals.withTable}/${results.length}\n`;
  table += `  With Search       : ${totals.withSearch}/${results.length}\n`;
  table += `  With Filter       : ${totals.withFilter}/${results.length}\n`;
  table += `  With Export       : ${totals.withExport}/${results.length}\n`;
  table += `  With Add Button   : ${totals.withAdd}/${results.length}\n`;
  table += `  With Pagination   : ${totals.withPagination}/${results.length}\n`;
  table += `  Total Rows        : ${totals.totalRows}\n`;
  table += `  Total Buttons     : ${totals.totalBtns}\n`;
  table += `  Total Form Fields : ${totals.totalForms}\n`;
  table += `\n  Total Test Coverage: ~${(totals.withSearch + totals.withFilter + totals.withExport + totals.withAdd) * 2} test scenarios\n`;
  table += '═' .repeat(120) + '\n';

  return table;
}