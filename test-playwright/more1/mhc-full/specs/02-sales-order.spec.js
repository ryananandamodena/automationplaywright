import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://mhc-dev.modena.com';
const PRODUCT_SEARCH = 'BH2725';

// Helper: klik button di dalam modal (overlay intercepts pointer events biasa)
async function clickModalButton(page, buttonText) {
  await page.evaluate((text) => {
    const all = document.querySelectorAll('div');
    const modal = Array.from(all).find(d =>
      d.classList.contains('fixed') && d.classList.contains('inset-0') && d.style.display !== 'none'
    );
    const btns = (modal || document).querySelectorAll('button');
    const btn = Array.from(btns).find(b => b.textContent.trim() === text);
    if (btn) btn.click();
  }, buttonText);
  await page.waitForTimeout(1500);
}

test.describe('MHC - Sales Order', () => {
  test.setTimeout(120000);

  test('Sales Order List - load & elemen utama', async ({ page }) => {
    const bugs = [];
    const consoleErrors = captureConsoleErrors(page);
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const { bugs: pageBugs } = await checkPageLoaded(page, '/sales-order');
    bugs.push(...pageBugs);

    // Cek heading Sales Order
    const heading = page.locator('h1, h2, h3').filter({ hasText: /Sales Order/i }).first();
    if (!await heading.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Heading "Sales Order" tidak ditemukan');
    else console.log('✓ Heading "Sales Order" visible');

    // Cek tabel/list ada
    const tableOrList = page.locator('table, [class*="list"], [class*="table"]').first();
    if (!await tableOrList.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel/list Sales Order tidak ditemukan');
    else console.log('✓ Tabel/list visible');

    // Cek kolom header tabel
    const soNumberCol = page.locator('table thead th').filter({ hasText: /SO Number/i }).first();
    if (await soNumberCol.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Kolom SO Number ada');

    // Cek tombol Create New
    const createBtn = page.locator("button:has-text('Create New')").first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Tombol "Create New" tidak ditemukan');
    else console.log('✓ Tombol Create New visible');

    // Cek search input
    const searchInput = page.locator("input[placeholder*='Search data']").first();
    if (!await searchInput.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Input Search tidak ditemukan');
    else console.log('✓ Search input visible');

    // Cek Filter & Sort By button
    const filterBtn = page.locator("button:has-text('Filter')").first();
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Filter button visible');

    if (consoleErrors.length > 0) console.log(`  ⚠ Console errors: ${consoleErrors[0]}`);
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Sales Order - Create SO full flow', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // === STEP 1: CUSTOMER ===
    console.log('Step 1: Select Customer...');
    const createBtn = page.locator("button:has-text('Create New')").first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Tombol Create New tidak ditemukan');
      expect(bugs).toHaveLength(0); return;
    }
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Verifikasi wizard muncul
    const wizardTitle = page.locator('h1, h2').filter({ hasText: /Create Sales Order/i }).first();
    if (!await wizardTitle.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Wizard Create SO tidak muncul');
      expect(bugs).toHaveLength(0); return;
    }
    console.log('✓ Wizard Create Sales Order terbuka');

    // Pilih customer dari tabel - klik baris pertama
    const customerTable = page.locator('table tbody tr').first();
    if (!await customerTable.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Tabel customer kosong');
      expect(bugs).toHaveLength(0); return;
    }
    await customerTable.click();
    await page.waitForTimeout(2000);

    // Verifikasi customer terpilih (muncul kartu customer)
    const customerCard = page.locator('text=Change Customer').first();
    if (!await customerCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Customer tidak berhasil dipilih (Change Customer tidak muncul)');
    } else {
      const customerName = await page.locator('h1, h2, h3, h4').filter({ hasText: /Ryan|Customer/i }).first().textContent().catch(() => '');
      console.log(`✓ Customer dipilih: ${customerName.trim()}`);
    }

    // Klik Next Step ke Products
    const nextBtn1 = page.locator("button:has-text('Next Step')").first();
    await nextBtn1.click();
    await page.waitForTimeout(3000);

    // === STEP 2: PRODUCTS ===
    console.log('Step 2: Add Products...');
    const productsHeading = page.locator('text=Available Products').first();
    if (!await productsHeading.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Halaman Products tidak muncul');
      expect(bugs).toHaveLength(0); return;
    }
    console.log('✓ Halaman Products terbuka');

    // Search produk
    const productSearch = page.locator("input[placeholder*='Search product']").first();
    if (await productSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await productSearch.fill(PRODUCT_SEARCH);
      await page.waitForTimeout(2500);
      console.log(`✓ Search produk: "${PRODUCT_SEARCH}"`);
    }

    // Cari produk ke-2 yang punya stok READY > 0 (BH2725GABK - READY: 79)
    // Klik tombol "Add to Order" di card produk ke-2
    const addBtns = page.locator("div.grid > div button:has-text('Add to O')");
    const addCount = await addBtns.count();
    console.log(`  Found ${addCount} Add to Order buttons`);

    if (addCount === 0) {
      bugs.push('Tidak ada tombol Add to Order di produk');
      expect(bugs).toHaveLength(0); return;
    }

    // Cari produk yang punya stok > 0 (cari text "READY" dengan angka > 0)
    let addClicked = false;
    for (let i = 0; i < Math.min(addCount, 8); i++) {
      const card = page.locator('div.grid > div').nth(i);
      const cardText = await card.textContent().catch(() => '');
      // Cek apakah ada stok ready > 0
      const readyMatch = cardText.match(/READY\s*(\d+)/i);
      const hasStock = readyMatch && parseInt(readyMatch[1]) > 0;
      if (hasStock || i === 1) { // Fallback ke card ke-2 (BH2725GABK)
        const btn = card.locator("button:has-text('Add to O')").first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(2000);
          addClicked = true;
          console.log(`✓ Klik Add to Order card ${i + 1}: ${cardText.slice(0, 40).trim()}`);
          break;
        }
      }
    }

    if (!addClicked) {
      // Fallback: klik Add to Order pertama
      await addBtns.first().click();
      await page.waitForTimeout(2000);
      addClicked = true;
      console.log('✓ Klik Add to Order (fallback: btn pertama)');
    }

    // Verifikasi modal muncul
    const modalTitle = page.locator('.fixed.inset-0 h2, .fixed.inset-0 h3, .fixed.inset-0 h4').filter({ hasText: /Add to Order|Add to SO/i }).first();
    const modalVisible = await modalTitle.isVisible({ timeout: 5000 }).catch(() => false);
    if (modalVisible) {
      console.log('✓ Modal Add to Order terbuka');

      // Stock Source: pilih "Warehouse Ready" (biasanya sudah ter-select)
      // Tidak perlu klik lagi kalau sudah default Warehouse Ready

      // Klik "Add to Order" di footer modal menggunakan JS (overlay intercepts normal clicks)
      await clickModalButton(page, 'Add to Order');
      console.log('✓ Konfirmasi Add to Order di modal');
    } else {
      // Modal tidak muncul atau langsung ter-select
      console.log('  ⚠ Modal tidak terdeteksi - lanjut cek selected items');
    }

    await page.waitForTimeout(1500);

    // Verifikasi produk ter-add (ada label "Selected" atau "Selected (1)")
    const selectedLabel = page.locator('text=/Selected \\(\\d+\\)|Selected/i').first();
    const isSelected = await selectedLabel.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSelected) {
      console.log('✓ Produk berhasil ditambahkan ke order');
    } else {
      bugs.push('Produk tidak berhasil ditambahkan (label Selected tidak muncul)');
    }

    // Klik Next Step ke Review
    const nextBtn2 = page.locator("button:has-text('Next Step')").first();
    if (!await nextBtn2.isEnabled({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Tombol Next Step tidak aktif setelah produk dipilih');
      expect(bugs).toHaveLength(0); return;
    }
    await nextBtn2.click();
    await page.waitForTimeout(3000);

    // === STEP 3: REVIEW ===
    console.log('Step 3: Review...');
    const reviewHeading = page.locator('h1, h2').filter({ hasText: /Create Sales Order/i }).first();
    const reviewStep = page.locator('text=REVIEW').first();
    const submitBtn = page.locator("button:has-text('Submit Order')").first();

    if (!await submitBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Tombol Submit Order tidak muncul di step Review');
    } else {
      console.log('✓ Step Review muncul dengan tombol Submit Order');
    }

    // Verifikasi ada product di tabel review
    const reviewTable = page.locator('table tbody tr').first();
    if (await reviewTable.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Tabel produk di Review ada');
    } else {
      bugs.push('Tabel produk tidak ada di step Review');
    }

    // Verifikasi Payment Details / summary muncul
    const paymentSummary = page.locator('text=/Payment Details|Total Before Discount/i').first();
    if (await paymentSummary.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Payment Details visible');

    // NOTE: Tidak submit order otomatis untuk menghindari data sampah di production
    // Uncomment baris berikut jika ingin test full submit:
    // await submitBtn.click();
    // await page.waitForTimeout(5000);
    // const successMsg = page.locator('text=/Success|Berhasil|SO.*created/i').first();
    // if (!await successMsg.isVisible({ timeout: 10000 }).catch(() => false))
    //   bugs.push('Tidak ada pesan sukses setelah Submit Order');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Sales Order - detail SO (buka View item pertama)', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Klik tombol View di baris pertama
    const viewBtn = page.locator("table tbody tr").first().locator("button:has-text('View'), a:has-text('View')").first();
    if (!await viewBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tidak ada data SO atau tombol View - skip detail test');
      return;
    }

    await viewBtn.click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const isDetailPage = bodyText.includes('Sales Order') && (
      bodyText.includes('Total') || bodyText.includes('Status') || bodyText.includes('Customer')
    );
    if (!isDetailPage) bugs.push('Halaman detail SO tidak termuat dengan benar');
    else console.log('✓ Detail SO termuat');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Sales Order - search & filter', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Test search
    const searchInput = page.locator("input[placeholder*='Search data']").first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Ryan');
      await page.waitForTimeout(2500);
      const rowsAfterSearch = await page.locator('table tbody tr').count();
      console.log(`✓ Search berjalan, rows: ${rowsAfterSearch}`);
      await searchInput.clear();
      await page.waitForTimeout(1500);
    } else {
      bugs.push('Input search tidak ditemukan');
    }

    // Test Filter button
    const filterBtn = page.locator("button:has-text('Filter')").first();
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1500);
      const filterPanel = page.locator('[class*="filter"], [class*="Filter"], [aria-label*="filter"]').first();
      const filterPanelVisible = await filterPanel.isVisible({ timeout: 3000 }).catch(() => false);
      if (filterPanelVisible) console.log('✓ Filter panel terbuka');
      // Tutup filter
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
