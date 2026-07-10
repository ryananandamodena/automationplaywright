/**
 * AUTO-DISCOVERY EXPLORER - MORE Application
 * 
 * Script ini akan:
 * 1. Login ke MORE aplikasi
 * 2. Menemukan semua menu di sidebar secara otomatis
 * 3. Mengexplore setiap halaman untuk mendeteksi fitur
 * 4. Mencatat: tabel, form, button CRUD, filter, export
 * 5. Generate output untuk test spec
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://more-dev.modena.com';
const CREDENTIALS = {
  email: 'muhzaenal5@gmail.com',
  password: 'P@ssw0rd_muhzaenal5',
};

/**
 * Deteksi fitur di halaman secara otomatis
 */
async function detectPageFeatures(page, url) {
  const features = {
    url,
    tables: false,
    tableHeaders: [],
    buttons: [],
    searchInput: false,
    filterSelect: false,
    dateRangePicker: false,
    exportButton: false,
    addButton: false,
    editButton: false,
    deleteButton: false,
    formInputs: [],
    pagination: false,
    hasData: false,
    rowCount: 0,
    apiCalls: [],
  };

  try {
    // Deteksi tabel
    const tables = await page.locator('table').count();
    features.tables = tables > 0;

    if (tables > 0) {
      const headers = await page.locator('table thead th, table thead td').allInnerTexts().catch(() => []);
      features.tableHeaders = headers.filter(h => h.trim());
      
      const rows = await page.locator('table tbody tr').count().catch(() => 0);
      features.rowCount = rows;
      features.hasData = rows > 0;
    }

    // Deteksi button berdasarkan teks
    const allButtons = await page.locator('button').allInnerTexts().catch(() => []);
    const buttonSet = new Set(allButtons.map(b => b.trim()).filter(b => b));

    for (const btn of buttonSet) {
      const lower = btn.toLowerCase();
      if (lower.includes('add') || lower.includes('tambah') || lower.includes('create') || lower.includes('new') || lower.includes('buat') || lower.includes('+')) {
        features.addButton = true;
        features.buttons.push({ type: 'add', text: btn });
      } else if (lower.includes('edit') || lower.includes('ubah')) {
        features.editButton = true;
        features.buttons.push({ type: 'edit', text: btn });
      } else if (lower.includes('delete') || lower.includes('hapus') || lower.includes('remove')) {
        features.deleteButton = true;
        features.buttons.push({ type: 'delete', text: btn });
      } else if (lower.includes('export') || lower.includes('download') || lower.includes('excel') || lower.includes('csv') || lower.includes('pdf') || lower.includes('print')) {
        features.exportButton = true;
        features.buttons.push({ type: 'export', text: btn });
      } else if (lower.includes('search') || lower.includes('cari') || lower.includes('filter')) {
        features.buttons.push({ type: 'search-filter', text: btn });
      }
    }

    // Deteksi search input
    const searchInputs = await page.locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="Cari" i], input[placeholder*="cari" i]').count().catch(() => 0);
    features.searchInput = searchInputs > 0;

    // Deteksi filter select
    const filterSelects = await page.locator('select').count().catch(() => 0);
    features.filterSelect = filterSelects > 0;

    // Deteksi date range picker
    const dateInputs = await page.locator('input[type="date"], input[placeholder*="date" i], input[placeholder*="tanggal" i]').count().catch(() => 0);
    features.dateRangePicker = dateInputs > 0;

    // Deteksi form inputs
    const formInputElements = await page.locator('input:not([type="hidden"]):not([type="search"])').all().catch(() => []);
    for (const input of formInputElements) {
      const name = await input.getAttribute('name').catch(() => '');
      const placeholder = await input.getAttribute('placeholder').catch(() => '');
      const type = await input.getAttribute('type').catch(() => 'text');
      if (name || placeholder) {
        features.formInputs.push({ name, placeholder, type });
      }
    }

    // Deteksi pagination
    const paginationEl = await page.locator('[class*="pagination"], nav[aria-label*="pagination"], [class*="page"]').count().catch(() => 0);
    features.pagination = paginationEl > 0;

  } catch (e) {
    console.error(`  ⚠ Error detecting features: ${e.message}`);
  }

  return features;
}

/**
 * Dapatkan semua menu dari sidebar secara otomatis
 */
async function discoverMenus(page) {
  const menus = [];
  
  try {
    // Coba berbagai selector untuk sidebar menu items
    const linkSelectors = [
      'aside a[href]',
      'nav a[href]', 
      '[class*="sidebar"] a[href]',
      '[class*="menu"] a[href]',
      'a[class*="nav-link"]',
      'a[class*="sidebar-link"]',
    ];

    let allLinks = [];
    for (const selector of linkSelectors) {
      const links = await page.locator(selector).all().catch(() => []);
      const linkData = [];
      for (const link of links) {
        const href = await link.getAttribute('href').catch(() => '');
        const text = (await link.innerText().catch(() => '')).trim();
        const visible = await link.isVisible().catch(() => false);
        if (href && text && visible && !href.startsWith('#') && !href.startsWith('javascript')) {
          linkData.push({ text, href, visible });
        }
      }
      allLinks = [...allLinks, ...linkData];
      if (allLinks.length > 0) break;
    }

    // Filter unique menus
    const seen = new Set();
    for (const link of allLinks) {
      const key = `${link.text}|${link.href}`;
      if (!seen.has(key)) {
        seen.add(key);
        menus.push(link);
      }
    }

    console.log(`  ✓ Found ${menus.length} menu items in sidebar`);
  } catch (e) {
    console.error(`  ⚠ Error discovering menus: ${e.message}`);
  }

  return menus;
}

async function main() {
  console.log('========================================');
  console.log('  🔍 AUTO-DISCOVERY EXPLORER - MORE APP');
  console.log('========================================\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });
  const page = await context.newPage();

  // Capture console logs & errors
  const consoleLogs = [];
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    consoleLogs.push(`[${msg.type()}] ${msg.text().slice(0, 200)}`);
  });
  page.on('pageerror', err => consoleErrors.push(`Page Error: ${err.message}`));

  const allModules = [];

  try {
    // ─── STEP 1: LOGIN ─────────────────────────────────
    console.log('\n📌 STEP 1: Login ke aplikasi MORE');
    console.log('----------------------------------------');
    
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    console.log('  ✓ Page loaded');
    
    // Screenshot before login
    await page.screenshot({ path: path.join(__dirname, '../screenshots/00-before-login.png') }).catch(() => {});

    // Fill credentials
    await page.locator('input[name="email"]').fill(CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(CREDENTIALS.password);
    console.log('  ✓ Credentials filled');

    // Check for company selector
    const companyBtn = page.locator('button:has-text("Select a company")');
    if (await companyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await companyBtn.click();
      await page.waitForTimeout(1000);
      await page.locator('button:has-text("MODENA HOME CENTER (MHC)")').click();
      await page.waitForTimeout(500);
      console.log('  ✓ Company selected: MHC');
    }

    // Click Sign In
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(3000);
    console.log('  ✓ Sign In clicked');

    // Wait for dashboard
    await page.waitForSelector('aside, nav, header, [class*="sidebar"]', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Screenshot after login
    await page.screenshot({ path: path.join(__dirname, '../screenshots/01-after-login.png') }).catch(() => {});

    const currentUrl = page.url();
    console.log(`  ✓ Current URL: ${currentUrl}`);

    if (consoleErrors.length > 0) {
      console.log(`  ⚠ Console errors: ${consoleErrors.length}`);
    }

    allModules.push({
      name: 'Login',
      url: currentUrl,
      type: 'system',
      features: {
        hasForm: true,
        hasAuth: true,
      }
    });

    // ─── STEP 2: DISCOVER MENUS ─────────────────────────
    console.log('\n📌 STEP 2: Discover all menus from sidebar');
    console.log('----------------------------------------');
    
    const menus = await discoverMenus(page);
    
    if (menus.length === 0) {
      // Fallback: hardcoded menus from test-data
      console.log('  ⚠ No menus found via auto-discovery, using fallback');
      const fallbackMenus = [
        { text: 'Dashboard', href: '/' },
        { text: 'Sales Order', href: '/sales-order' },
        { text: 'Purchase Order', href: '/purchase-order' },
        { text: 'Delivery', href: '/delivery' },
        { text: 'Inventory Transfer', href: '/inventory-transfer' },
        { text: 'Operational Cost', href: '/operational-cost' },
        { text: 'Balance Inquiry', href: '/balance-inquiry' },
        { text: 'Withdrawal', href: '/withdrawal' },
        { text: 'Stock Ready', href: '/stock-ready' },
        { text: 'PO Verification', href: '/purchase-stock-verification' },
        { text: 'Profile', href: '/profile' },
        { text: 'User Management', href: '/users' },
        { text: 'Role Management', href: '/roles' },
        { text: 'Sync SAP', href: '/sync-sap' },
      ];
      for (const m of fallbackMenus) {
        menus.push({ text: m.text, href: m.href, visible: true });
      }
    }

    console.log(`  📋 Total menus discovered: ${menus.length}`);
    menus.forEach((m, i) => console.log(`     ${i + 1}. ${m.text} → ${m.href}`));

    // ─── STEP 3: EXPLORE EACH MODULE ───────────────────
    console.log('\n📌 STEP 3: Explore each module');
    console.log('----------------------------------------');

    for (let i = 0; i < menus.length; i++) {
      const menu = menus[i];
      const fullUrl = menu.href.startsWith('http') ? menu.href : `${BASE_URL}${menu.href}`;
      
      console.log(`\n  🔍 Module ${i + 1}/${menus.length}: ${menu.text}`);
      console.log(`     URL: ${fullUrl}`);

      try {
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        // Screenshot
        await page.screenshot({ 
          path: path.join(__dirname, `../screenshots/module-${String(i + 1).padStart(2, '0')}-${menu.text.replace(/[^a-zA-Z0-9]/g, '-')}.png`) 
        }).catch(() => {});

        // Detect features
        const features = await detectPageFeatures(page, fullUrl);
        
        console.log(`     ├─ Tabel: ${features.tables ? '✅' : '❌'} (${features.rowCount} baris)`);
        console.log(`     ├─ Search: ${features.searchInput ? '✅' : '❌'}`);
        console.log(`     ├─ Filter: ${features.filterSelect ? '✅' : '❌'}`);
        console.log(`     ├─ Date Range: ${features.dateRangePicker ? '✅' : '❌'}`);
        console.log(`     ├─ Export: ${features.exportButton ? '✅' : '❌'}`);
        console.log(`     ├─ Add Button: ${features.addButton ? '✅' : '❌'}`);
        console.log(`     ├─ Form Inputs: ${features.formInputs.length}`);
        console.log(`     ├─ Pagination: ${features.pagination ? '✅' : '❌'}`);
        
        if (features.tableHeaders.length > 0) {
          console.log(`     └─ Kolom: ${features.tableHeaders.join(', ').slice(0, 120)}`);
        }

        allModules.push({
          name: menu.text,
          url: fullUrl,
          href: menu.href,
          type: 'module',
          features,
          consoleErrors: [...consoleErrors],
        });

        // Clear console errors for next module
        consoleErrors.length = 0;

      } catch (e) {
        console.log(`     ❌ Error: ${e.message.slice(0, 100)}`);
        allModules.push({
          name: menu.text,
          url: fullUrl,
          href: menu.href,
          type: 'module',
          error: e.message,
          features: {},
        });
      }
    }

    // ─── STEP 4: GENERATE DISCOVERY REPORT ─────────────
    console.log('\n\n📌 STEP 4: Generate Discovery Report');
    console.log('----------------------------------------');

    const report = {
      timestamp: new Date().toISOString(),
      application: 'MORE - MODENA HOME CENTER',
      baseUrl: BASE_URL,
      credentials: CREDENTIALS.email,
      totalModules: allModules.length,
      summary: {
        modulesWithTables: allModules.filter(m => m.features?.tables).length,
        modulesWithSearch: allModules.filter(m => m.features?.searchInput).length,
        modulesWithFilter: allModules.filter(m => m.features?.filterSelect).length,
        modulesWithExport: allModules.filter(m => m.features?.exportButton).length,
        modulesWithAdd: allModules.filter(m => m.features?.addButton).length,
        modulesWithEdit: allModules.filter(m => m.features?.editButton).length,
        modulesWithDelete: allModules.filter(m => m.features?.deleteButton).length,
        modulesWithForm: allModules.filter(m => m.features?.formInputs?.length > 0).length,
        modulesWithDateRange: allModules.filter(m => m.features?.dateRangePicker).length,
        modulesWithPagination: allModules.filter(m => m.features?.pagination).length,
      },
      modules: allModules,
    };

    // Save report
    const reportPath = path.join(__dirname, '../discovery-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n  ✅ Report saved: ${reportPath}`);

    // ─── PRINT SUMMARY ─────────────────────────────────
    console.log('\n\n========================================');
    console.log('  📊 DISCOVERY SUMMARY');
    console.log('========================================\n');
    console.log(`  Total Modules       : ${report.totalModules}`);
    console.log(`  With Tables         : ${report.summary.modulesWithTables}`);
    console.log(`  With Search         : ${report.summary.modulesWithSearch}`);
    console.log(`  With Filter         : ${report.summary.modulesWithFilter}`);
    console.log(`  With Export         : ${report.summary.modulesWithExport}`);
    console.log(`  With Add Button     : ${report.summary.modulesWithAdd}`);
    console.log(`  With Edit Button    : ${report.summary.modulesWithEdit}`);
    console.log(`  With Delete Button  : ${report.summary.modulesWithDelete}`);
    console.log(`  With Form Inputs    : ${report.summary.modulesWithForm}`);
    console.log(`  With Date Range     : ${report.summary.modulesWithDateRange}`);
    console.log(`  With Pagination     : ${report.summary.modulesWithPagination}`);

    console.log('\n✅ AUTO-DISCOVERY COMPLETE!\n');

  } catch (e) {
    console.error(`\n❌ Fatal error: ${e.message}`);
    console.error(e.stack);
  } finally {
    await browser.close();
  }
}

main();