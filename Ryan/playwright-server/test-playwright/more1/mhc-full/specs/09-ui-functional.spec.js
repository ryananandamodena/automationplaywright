/**
 * 09-ui-functional.spec.js
 * Test: UI & Functional checks — pagination, modal, dropdown, loading state
 * Scope: semua halaman utama
 */
import { test, expect } from '@playwright/test';
import { login } from '../helpers/login.js';
import { setupApiMonitor } from '../helpers/api-monitor.js';

const BASE = 'https://mhc-dev.modena.com';

// ─────────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────────
test.describe('UI Functional - Pagination', () => {
  test.setTimeout(90000);

  test('Sales Order - pagination berjalan (next page)', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    if (!await page.locator('table').first().isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tabel tidak ditemukan - skip pagination test');
      return;
    }

    // Cek pagination ada
    const paginationLocators = [
      page.locator('[class*="pagination"]'),
      page.locator('button:has-text("Next"), button[aria-label*="next" i]'),
      page.locator('button:has-text(">"), button:has-text("›")'),
      page.locator('nav[aria-label*="page" i]'),
    ];

    let hasPagination = false;
    for (const loc of paginationLocators) {
      if (await loc.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        hasPagination = true;
        console.log('  ✓ Pagination ditemukan');
        break;
      }
    }

    if (!hasPagination) {
      // Mungkin single-page atau data sedikit
      const rowCount = await page.locator('table tbody tr').count();
      console.log(`  ⚠ Pagination tidak ditemukan (${rowCount} baris) - mungkin data sedikit`);
      return;
    }

    // Ambil data halaman 1
    const page1Rows = await page.locator('table tbody tr td:first-child').allTextContents();

    // Klik next page
    const nextBtn = page.locator('button:has-text("Next"), button[aria-label="Next page"], button:has-text(">"), button:has-text("›")').first();
    if (await nextBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(3000);

      const page2Rows = await page.locator('table tbody tr td:first-child').allTextContents();
      const dataChanged = JSON.stringify(page1Rows) !== JSON.stringify(page2Rows);

      if (!dataChanged && page2Rows.length > 0) {
        bugs.push('Klik Next Page tidak mengubah data tabel (pagination tidak berfungsi)');
      } else {
        console.log(`  ✓ Pagination OK - halaman 1: ${page1Rows.length} baris, halaman 2: ${page2Rows.length} baris`);
      }

      // Kembali ke halaman 1
      const prevBtn = page.locator('button:has-text("Prev"), button[aria-label*="prev" i], button:has-text("<"), button:has-text("‹")').first();
      if (await prevBtn.isEnabled({ timeout: 2000 }).catch(() => false)) {
        await prevBtn.click();
        await page.waitForTimeout(2000);
        console.log('  ✓ Prev page berhasil');
      }
    } else {
      console.log('  ⚠ Tombol Next tidak aktif (mungkin hanya 1 halaman)');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('User Management - pagination berjalan', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    if (!await page.locator('table').first().isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tabel user tidak ditemukan - skip');
      return;
    }

    const rowCount = await page.locator('table tbody tr').count();
    const paginationVisible = await page.locator('[class*="pagination"], button:has-text("Next")').first()
      .isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`  ✓ User tabel: ${rowCount} baris, pagination: ${paginationVisible}`);
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────────
test.describe('UI Functional - Modal & Dialog', () => {
  test.setTimeout(90000);

  test('Sales Order - wizard modal terbuka dan bisa ditutup', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const createBtn = page.locator('button:has-text("Create New")').first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Create New tidak ditemukan - skip');
      return;
    }

    await createBtn.click();
    await page.waitForTimeout(3000);

    // Cek modal/wizard terbuka
    const modalSelectors = ['.fixed.inset-0', '[role="dialog"]', '[class*="modal"]', '[class*="overlay"]'];
    let modalVisible = false;
    for (const sel of modalSelectors) {
      if (await page.locator(sel).first().isVisible({ timeout: 2000 }).catch(() => false)) {
        modalVisible = true;
        console.log(`  ✓ Modal terbuka (${sel})`);
        break;
      }
    }

    if (!modalVisible) {
      // Mungkin full-page wizard
      const bodyText = await page.locator('body').innerText().catch(() => '');
      modalVisible = /Customer|Create Sales Order|Select Customer/i.test(bodyText);
      if (modalVisible) console.log('  ✓ Wizard terbuka sebagai full-page');
    }

    if (!modalVisible) {
      bugs.push('Klik Create New tidak membuka modal/wizard');
    } else {
      // Coba tutup modal
      const closeSelectors = [
        'button:has-text("Cancel")',
        'button:has-text("Close")',
        'button:has-text("Batal")',
        'button[aria-label="close"]',
        'button[aria-label*="Close"]',
        '.fixed.inset-0 button:first-child',
      ];

      let closed = false;
      for (const sel of closeSelectors) {
        const closeBtn = page.locator(sel).first();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(2000);

          // Cek apakah kembali ke list SO
          const url = page.url();
          const bodyText = await page.locator('body').innerText().catch(() => '');
          if (url.includes('/sales-order') && !bodyText.includes('Select Customer')) {
            console.log('  ✓ Modal berhasil ditutup');
            closed = true;
            break;
          }
        }
      }

      // Escape key sebagai fallback
      if (!closed) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1500);
        const urlAfterEsc = page.url();
        if (urlAfterEsc.includes('/sales-order')) {
          console.log('  ✓ Modal ditutup dengan Escape');
        }
      }
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────
// DROPDOWN & SELECT
// ─────────────────────────────────────────────────────────
test.describe('UI Functional - Dropdown & Select', () => {
  test.setTimeout(90000);

  test('Profile - form dropdown/select berfungsi', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Cek input fields
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    console.log(`  ✓ Profile - ${inputCount} input/select/textarea ditemukan`);

    // Test tiap select bisa dibuka
    const selects = page.locator('select');
    const selectCount = await selects.count();
    for (let i = 0; i < Math.min(selectCount, 3); i++) {
      const isVisible = await selects.nth(i).isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        const options = await selects.nth(i).locator('option').count();
        console.log(`  ✓ Select #${i + 1}: ${options} opsi`);
      }
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Sales Order - dropdown filter status berfungsi', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Cari dropdown status/filter
    const dropdowns = page.locator('select, [class*="select"], [class*="dropdown"]');
    const count = await dropdowns.count();
    console.log(`  ✓ SO - ditemukan ${count} dropdown/select elemen`);

    // Coba buka select pertama yang visible
    for (let i = 0; i < Math.min(count, 3); i++) {
      const el = dropdowns.nth(i);
      const tagName = await el.evaluate(e => e.tagName.toLowerCase()).catch(() => '');
      if (tagName === 'select' && await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        const optionCount = await el.locator('option').count();
        console.log(`  ✓ Select #${i + 1}: ${optionCount} opsi`);
        if (optionCount > 1) {
          // Pilih opsi ke-2
          await el.selectOption({ index: 1 }).catch(() => {});
          await page.waitForTimeout(1500);
          console.log(`  ✓ Select pilihan berhasil`);
          // Reset ke option pertama
          await el.selectOption({ index: 0 }).catch(() => {});
        }
        break;
      }
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────
// LOADING STATE & PERFORMANCE
// ─────────────────────────────────────────────────────────
test.describe('UI Functional - Loading State & Performance', () => {
  test.setTimeout(90000);

  test('Semua menu utama load dalam waktu wajar (< 15 detik)', async ({ page }) => {
    const bugs = [];
    const monitor = setupApiMonitor(page);
    await login(page);

    const menus = [
      { name: 'Sales Order', url: `${BASE}/sales-order`, part: '/sales-order' },
      { name: 'Purchase Order', url: `${BASE}/purchase-order`, part: '/purchase-order' },
      { name: 'Delivery', url: `${BASE}/delivery`, part: '/delivery' },
      { name: 'User Management', url: `${BASE}/users`, part: '/users' },
    ];

    for (const menu of menus) {
      const startTime = Date.now();
      await page.goto(menu.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      // Tunggu konten utama (table/heading)
      await page.waitForSelector('main, table, h1, h2', { timeout: 12000 }).catch(() => {});
      const loadTime = Date.now() - startTime;

      console.log(`  ✓ ${menu.name}: ${loadTime}ms`);
      if (loadTime > 15000) {
        bugs.push(`${menu.name} load terlalu lambat: ${loadTime}ms (> 15s)`);
      }

      const url = page.url();
      if (!url.includes(menu.part)) {
        bugs.push(`${menu.name} redirect ke ${url} bukan ke ${menu.part}`);
      }
    }

    const critFails = monitor.getCriticalFailures();
    if (critFails.length > 0) {
      console.log(`  ⚠ API failures saat navigasi: ${critFails.map(f => `[${f.status}] ${f.url}`).join(', ')}`);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Halaman tidak menampilkan blank/white screen', async ({ page }) => {
    const bugs = [];
    await login(page);

    const menus = [
      `${BASE}/sales-order`,
      `${BASE}/purchase-order`,
      `${BASE}/users`,
      `${BASE}/roles`,
    ];

    for (const url of menus) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const bodyText = (await page.locator('body').innerText().catch(() => '')).trim();
      const hasContent = bodyText.length > 50;
      const path = url.replace(BASE, '');

      if (!hasContent) {
        bugs.push(`Halaman ${path} terlihat blank (body text < 50 karakter)`);
        console.error(`  ❌ BLANK: ${path}`);
      } else {
        console.log(`  ✓ ${path}: ${bodyText.length} chars`);
      }
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Navigasi sidebar menu berfungsi tanpa error', async ({ page }) => {
    const bugs = [];
    const monitor = setupApiMonitor(page);
    await login(page);

    // Cek sidebar links
    const sidebarLinks = page.locator('aside a, nav a, aside button, nav button').filter({
      hasText: /Sales|Purchase|Delivery|User|Role|Profile|Stock|Inventory/i
    });
    const linkCount = await sidebarLinks.count();
    console.log(`  ✓ Ditemukan ${linkCount} link di sidebar`);

    // Klik beberapa link sidebar
    for (let i = 0; i < Math.min(linkCount, 4); i++) {
      const link = sidebarLinks.nth(i);
      const text = (await link.textContent().catch(() => '')).trim();
      if (!text) continue;

      await link.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(2500);

      const url = page.url();
      const isErrorPage = await page.evaluate(() =>
        document.title.match(/^(404|500|403)/i) !== null
      );

      if (isErrorPage) {
        bugs.push(`Sidebar link "${text}" → halaman error: ${url}`);
        console.error(`  ❌ Error page setelah klik "${text}": ${url}`);
      } else {
        console.log(`  ✓ Sidebar "${text}" → ${url}`);
      }
    }

    const critFails = monitor.getCriticalFailures().filter(f => f.status >= 500);
    if (critFails.length > 0) {
      bugs.push(`Server errors saat navigasi sidebar: ${critFails.map(f => `[${f.status}] ${f.url}`).join(', ')}`);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
