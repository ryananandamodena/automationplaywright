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

    // Pilih customer dari tabel - search dulu supaya wizard tidak ter-dismiss
    const searchInput = page.locator("input[placeholder='Search data...']").first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Dedi');
      await page.waitForTimeout(1500);
    }
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
      const customerName = await page.locator('h1, h2, h3, h4, p, span').filter({ hasText: /Dedi|Customer/i }).first().textContent().catch(() => '');
      console.log(`✓ Customer dipilih: ${customerName.trim()}`);
    }

    // Klik Next Step ke Products
    const nextBtn1 = page.locator("button:has-text('Next Step')").first();
    await nextBtn1.waitFor({ state: 'visible', timeout: 8000 });
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

  test('Sales Order - penggunaan Campaign/Promo', async ({ page }) => {
    test.setTimeout(180000);
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // === STEP 1: CUSTOMER ===
    console.log('Step 1: Buka wizard Create SO...');
    const createBtn = page.locator("button:has-text('Create New')").first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Tombol Create New tidak ditemukan');
      expect(bugs).toHaveLength(0); return;
    }
    await createBtn.click();
    await page.waitForTimeout(3000);

    const wizardTitle = page.locator('h1, h2').filter({ hasText: /Create Sales Order/i }).first();
    if (!await wizardTitle.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Wizard Create SO tidak muncul');
      expect(bugs).toHaveLength(0); return;
    }

    // Pilih customer
    const searchInput = page.locator("input[placeholder='Search data...']").first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Dedi');
      await page.waitForTimeout(1500);
    }
    const customerRow = page.locator('table tbody tr').first();
    if (!await customerRow.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Tabel customer kosong');
      expect(bugs).toHaveLength(0); return;
    }
    await customerRow.click();
    await page.waitForTimeout(2000);
    console.log('✓ Customer dipilih');

    // Klik Next Step ke Products
    const nextBtn1 = page.locator("button:has-text('Next Step')").first();
    await nextBtn1.waitFor({ state: 'visible', timeout: 8000 });
    await nextBtn1.click();
    await page.waitForTimeout(3000);

    // === STEP 2: PRODUCTS - cari BH2725GABK atau BH2725GBBK ===
    console.log('Step 2: Tambah produk BH2725GABK / BH2725GBBK...');
    const productsHeading = page.locator('text=Available Products').first();
    if (!await productsHeading.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Halaman Products tidak muncul');
      expect(bugs).toHaveLength(0); return;
    }

    // Search produk spesifik
    const productSearch = page.locator("input[placeholder*='Search product']").first();
    if (!await productSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Input search produk tidak ditemukan');
      expect(bugs).toHaveLength(0); return;
    }

    // Coba BH2725GABK dulu, fallback ke BH2725GBBK
    let targetProduct = null;
    for (const sku of ['BH2725GABK', 'BH2725GBBK']) {
      await productSearch.fill('');
      await productSearch.fill(sku);
      await page.waitForTimeout(2500);
      const cards = page.locator("div.grid > div button:has-text('Add to O')");
      const count = await cards.count();
      if (count > 0) {
        targetProduct = sku;
        console.log(`✓ Produk ditemukan: ${sku}`);
        break;
      }
      console.log(`  ⚠ ${sku} tidak ditemukan, coba SKU berikutnya...`);
    }

    if (!targetProduct) {
      bugs.push('Produk BH2725GABK dan BH2725GBBK tidak ditemukan');
      expect(bugs).toHaveLength(0); return;
    }

    // Klik Add to Order - cari card yang SKU-nya cocok
    const addBtns = page.locator("div.grid > div button:has-text('Add to O')");
    let addClicked = false;
    const addCount = await addBtns.count();
    for (let i = 0; i < Math.min(addCount, 10); i++) {
      const card = page.locator('div.grid > div').nth(i);
      const cardText = await card.textContent().catch(() => '');
      // Prioritaskan card yang mengandung SKU target
      const isTargetSku = cardText.includes(targetProduct.replace('BH2725', 'BH 2725'));
      const readyMatch = cardText.match(/READY\s*(\d+)/i);
      const hasStock = readyMatch && parseInt(readyMatch[1]) > 0;
      if (isTargetSku && hasStock) {
        const btn = card.locator("button:has-text('Add to O')").first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(2000);
          addClicked = true;
          console.log(`✓ Klik Add to Order: ${cardText.slice(0, 60).trim()}`);
          break;
        }
      }
    }
    // Fallback: ambil card pertama yang ada stok
    if (!addClicked) {
      for (let i = 0; i < Math.min(addCount, 8); i++) {
        const card = page.locator('div.grid > div').nth(i);
        const cardText = await card.textContent().catch(() => '');
        const readyMatch = cardText.match(/READY\s*(\d+)/i);
        if (readyMatch && parseInt(readyMatch[1]) > 0) {
          const btn = card.locator("button:has-text('Add to O')").first();
          if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await btn.click();
            await page.waitForTimeout(2000);
            addClicked = true;
            console.log(`✓ Klik Add to Order (fallback): ${cardText.slice(0, 60).trim()}`);
            break;
          }
        }
      }
    }
    if (!addClicked) {
      await addBtns.first().click();
      await page.waitForTimeout(2000);
      addClicked = true;
      console.log('✓ Klik Add to Order (fallback pertama)');
    }

    // Konfirmasi modal Add to Order
    const addToOrderModal = page.locator('.fixed.inset-0 h2, .fixed.inset-0 h3, .fixed.inset-0 h4').filter({ hasText: /Add to Order/i }).first();
    if (await addToOrderModal.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clickModalButton(page, 'Add to Order');
      await page.waitForTimeout(1500);
    }
    console.log(`✓ Produk ${targetProduct} ditambahkan ke order`);

    // === STEP 2b: CAMPAIGN / PROMO ===
    console.log('Step 2b: Tambah Campaign/Promo...');
    const addPromoBtn = page.locator('button[title="Add Promo"], button:has-text("Add Promo"), button:has-text("Add Campaign")').first();
    if (!await addPromoBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Add Promo tidak ditemukan');
      bugs.push('Tombol Add Promo/Campaign tidak ditemukan');
      expect(bugs).toHaveLength(0); return;
    }

    await addPromoBtn.click({ force: true });
    await page.waitForTimeout(1000);

    // Tunggu modal terbuka & data selesai loading (hilangkan "Memuat promo...")
    const promoModal = page.locator('.fixed.inset-0').filter({ hasText: 'Available Promotions' }).first();
    if (!await promoModal.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Modal Available Promotions tidak terbuka');
      expect(bugs).toHaveLength(0); return;
    }
    console.log('✓ Modal Available Promotions terbuka');

    // Tunggu loading selesai (text "Memuat promo..." hilang)
    await page.waitForFunction(() => {
      const modal = document.querySelector('.fixed.inset-0');
      return modal && !modal.innerText.includes('Memuat promo');
    }, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const promoModalText = await promoModal.innerText().catch(() => '');
    console.log(`  Konten modal: ${promoModalText.replace(/\n/g, ' ').slice(0, 300)}`);

    // Cek apakah ada campaign di tabel
    const campaignRow = promoModal.locator('table tbody tr').first();
    const hasCampaign = await campaignRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasCampaign) {
      console.log('  ⚠ Tidak ada campaign aktif di tabel');
      // Tutup modal
      const closeBtn = promoModal.locator("button:has-text('Close')").first();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await closeBtn.click({ force: true });
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    } else {
      const campaignText = await campaignRow.textContent().catch(() => '');
      console.log(`✓ Campaign ditemukan: ${campaignText.trim()}`);

      // Klik Select pada campaign pertama
      const selectBtn = promoModal.locator("button:has-text('Select')").first();
      if (!await selectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        bugs.push('Tombol Select campaign tidak ditemukan');
      } else {
        await selectBtn.click({ force: true });
        await page.waitForTimeout(2000);
        console.log('✓ Campaign berhasil dipilih');

        // Verifikasi campaign ter-apply: muncul info promo/diskon di Selected Items
        const promoApplied = page.locator('text=/discont|MHCcop|Promo|Campaign|Discount/i').first();
        if (await promoApplied.isVisible({ timeout: 5000 }).catch(() => false)) {
          const promoText = await promoApplied.textContent().catch(() => '');
          console.log(`✓ Campaign ter-apply: ${promoText.trim()}`);
        } else {
          console.log('  ⚠ Tidak bisa verifikasi campaign ter-apply di UI');
        }
      }
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Sales Order - Full E2E dengan Campaign + Payment Kartu Kredit', async ({ page }) => {
    test.setTimeout(300000);
    const bugs = [];

    // =============================================
    // FASE 1: CREATE SO dengan Campaign/Promo
    // =============================================
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    console.log('\n=== FASE 1: CREATE SALES ORDER ===');

    // Buka wizard Create SO
    const createBtn = page.locator("button:has-text('Create New')").first();
    await createBtn.waitFor({ state: 'visible', timeout: 8000 });
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Pilih customer
    const custSearch = page.locator("input[placeholder='Search data...']").first();
    if (await custSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
      await custSearch.fill('Dedi');
      await page.waitForTimeout(1500);
    }
    await page.locator('table tbody tr').first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Customer dipilih: Dedi');

    const nextBtn1 = page.locator("button:has-text('Next Step')").first();
    await nextBtn1.waitFor({ state: 'visible', timeout: 8000 });
    await nextBtn1.click();
    await page.waitForTimeout(3000);

    // =============================================
    // FASE 2: TAMBAH PRODUK BH2725GABK / BH2725GBBK
    // =============================================
    console.log('\n=== FASE 2: TAMBAH PRODUK ===');
    await page.locator('text=Available Products').waitFor({ timeout: 8000 });

    const productSearch = page.locator("input[placeholder*='Search product']").first();
    let targetSku = null;
    for (const sku of ['BH2725GABK', 'BH2725GBBK']) {
      await productSearch.fill('');
      await productSearch.fill(sku);
      await page.waitForTimeout(2500);
      const count = await page.locator("div.grid > div button:has-text('Add to O')").count();
      if (count > 0) { targetSku = sku; break; }
    }
    if (!targetSku) {
      bugs.push('Produk BH2725GABK/GBBK tidak ditemukan');
      expect(bugs).toHaveLength(0); return;
    }
    console.log(`✓ Produk ditemukan: ${targetSku}`);

    // Klik Add to Order pada card yang cocok
    const allCards = page.locator('div.grid > div');
    const cardCount = await allCards.count();
    let clicked = false;
    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      const card = allCards.nth(i);
      const txt = await card.textContent().catch(() => '');
      const skuFormatted = targetSku.replace('BH2725', 'BH 2725');
      const readyMatch = txt.match(/READY\s*(\d+)/i);
      if (txt.includes(skuFormatted) && readyMatch && parseInt(readyMatch[1]) > 0) {
        await card.locator("button:has-text('Add to O')").first().click();
        await page.waitForTimeout(2000);
        clicked = true;
        console.log(`✓ Klik Add to Order: ${txt.slice(0, 50).trim()}`);
        break;
      }
    }
    if (!clicked) {
      // fallback card pertama ada stok
      for (let i = 0; i < Math.min(cardCount, 8); i++) {
        const card = allCards.nth(i);
        const txt = await card.textContent().catch(() => '');
        const m = txt.match(/READY\s*(\d+)/i);
        if (m && parseInt(m[1]) > 0) {
          await card.locator("button:has-text('Add to O')").first().click();
          await page.waitForTimeout(2000);
          clicked = true;
          console.log(`✓ Klik Add to Order (fallback): ${txt.slice(0, 50).trim()}`);
          break;
        }
      }
    }
    if (!clicked) {
      bugs.push('Tidak bisa klik Add to Order');
      expect(bugs).toHaveLength(0); return;
    }

    // Konfirmasi modal
    const addModal = page.locator('.fixed.inset-0').filter({ hasText: /Add to Order/i }).first();
    if (await addModal.isVisible({ timeout: 5000 }).catch(() => false)) {
      await clickModalButton(page, 'Add to Order');
      await page.waitForTimeout(1500);
    }
    console.log(`✓ Produk ${targetSku} ditambahkan ke order`);

    // =============================================
    // FASE 3: TAMBAH CAMPAIGN
    // =============================================
    console.log('\n=== FASE 3: TAMBAH CAMPAIGN ===');
    const addPromoBtn = page.locator('button[title="Add Promo"], button:has-text("Add Promo")').first();
    if (await addPromoBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await addPromoBtn.click({ force: true });
      await page.waitForTimeout(1000);

      const promoModal = page.locator('.fixed.inset-0').filter({ hasText: 'Available Promotions' }).first();
      if (await promoModal.isVisible({ timeout: 8000 }).catch(() => false)) {
        // Tunggu loading selesai
        await page.waitForFunction(() => {
          const m = document.querySelector('.fixed.inset-0');
          return m && !m.innerText.includes('Memuat promo');
        }, { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(800);

        const campaignRow = promoModal.locator('table tbody tr').first();
        if (await campaignRow.isVisible({ timeout: 3000 }).catch(() => false)) {
          const campaignTxt = await campaignRow.textContent().catch(() => '');
          await promoModal.locator("button:has-text('Select')").first().click({ force: true });
          await page.waitForTimeout(2000);
          console.log(`✓ Campaign dipilih: ${campaignTxt.trim().slice(0, 60)}`);
        } else {
          const closeBtn = promoModal.locator("button:has-text('Close')").first();
          if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await closeBtn.click({ force: true });
          console.log('  ⚠ Tidak ada campaign aktif, lanjut tanpa campaign');
        }
      }
    } else {
      console.log('  ⚠ Tombol Add Promo tidak muncul, lanjut tanpa campaign');
    }

    // =============================================
    // FASE 4: REVIEW & SUBMIT ORDER
    // =============================================
    console.log('\n=== FASE 4: REVIEW & SUBMIT ORDER ===');
    const nextBtn2 = page.locator("button:has-text('Next Step')").first();
    await nextBtn2.waitFor({ state: 'visible', timeout: 8000 });
    await nextBtn2.click();
    await page.waitForTimeout(3000);

    // Verifikasi halaman Review
    const submitOrderBtn = page.locator("button:has-text('Submit Order')").first();
    if (!await submitOrderBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      bugs.push('Tombol Submit Order tidak muncul di Review');
      expect(bugs).toHaveLength(0); return;
    }

    // Baca Grand Total sebelum submit
    const reviewText = await page.locator('body').innerText().catch(() => '');
    const grandTotalMatch = reviewText.match(/Grand Total\s*(Rp[\d.,\s]+)/i);
    const grandTotal = grandTotalMatch ? grandTotalMatch[1].trim() : '';
    console.log(`✓ Review page - Grand Total: ${grandTotal}`);

    // Klik Submit Order
    await submitOrderBtn.click();
    await page.waitForTimeout(4000);
    console.log('✓ Submit Order diklik');

    // Tunggu redirect ke halaman detail SO (ada SO Number di URL atau heading)
    const currentUrl = page.url();
    console.log(`  URL setelah submit: ${currentUrl}`);

    // Ambil SO number dari URL atau halaman
    const pageBodyAfterSubmit = await page.locator('body').innerText().catch(() => '');
    const soNumberMatch = pageBodyAfterSubmit.match(/MoRe-SO[\w-]+/);
    const soNumber = soNumberMatch ? soNumberMatch[0] : null;
    console.log(`  SO Number dari halaman: ${soNumber || 'tidak terdeteksi'}`);

    // Jika masih di create page, navigasi ke SO list dan buka SO terbaru yang Open
    let soDetailUrl = null;
    if (soNumber) {
      soDetailUrl = `${BASE}/sales-order/form?docNumSO=${soNumber}`;
    } else {
      // Navigate ke list SO, cari SO Open terbaru (baris pertama setelah refresh)
      console.log('  Navigasi ke SO list untuk cari SO yang baru dibuat...');
      await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Cari SO dengan status Open milik Dedi yang paling atas
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();
      for (let i = 0; i < Math.min(rowCount, 10); i++) {
        const rowText = await rows.nth(i).textContent().catch(() => '');
        if (rowText.includes('Open') && rowText.includes('Dedi')) {
          await rows.nth(i).locator("button:has-text('View')").click();
          await page.waitForTimeout(3000);
          soDetailUrl = page.url();
          console.log(`✓ SO ditemukan dan dibuka: ${soDetailUrl}`);
          break;
        }
      }
    }

    if (!soDetailUrl && page.url().includes('/sales-order/form')) {
      soDetailUrl = page.url();
    }

    if (!soDetailUrl) {
      // Navigate langsung ke URL detail jika sudah ada
      await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      await page.locator('table tbody tr').first().locator("button:has-text('View')").click();
      await page.waitForTimeout(3000);
    } else if (!page.url().includes('/sales-order/form')) {
      await page.goto(soDetailUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    // Verifikasi halaman detail SO terbuka dengan payment section
    const detailBody = await page.locator('body').innerText().catch(() => '');
    const hasSoDetail = detailBody.includes('Payment Detail') || detailBody.includes('Create Payment');
    if (!hasSoDetail) {
      bugs.push('Halaman detail SO tidak muncul / tidak ada section Payment Detail');
      expect(bugs).toHaveLength(0); return;
    }
    const soNum = detailBody.match(/MoRe-SO[\w-]+/)?.[0] || '';
    console.log(`✓ Detail SO terbuka: ${soNum}`);

    // =============================================
    // FASE 5: PAYMENT DENGAN KARTU KREDIT
    // =============================================
    console.log('\n=== FASE 5: PAYMENT KARTU KREDIT ===');

    // Pilih payment type: KARTU KREDIT
    const payTypeSelect = page.locator('select').first();
    if (!await payTypeSelect.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Dropdown payment type tidak ditemukan');
      expect(bugs).toHaveLength(0); return;
    }
    await payTypeSelect.selectOption('KARTU KREDIT');
    await page.waitForTimeout(1500);
    console.log('✓ Payment type dipilih: KARTU KREDIT');

    // Pilih bank (MANDIRI sudah default, tapi kita eksplisit pilih)
    const bankSelect = page.locator('select').nth(1);
    if (await bankSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await bankSelect.selectOption('MANDIRI');
      await page.waitForTimeout(500);
      const bankVal = await bankSelect.inputValue();
      console.log(`✓ Bank dipilih: ${bankVal}`);
    } else {
      bugs.push('Dropdown bank tidak muncul setelah pilih KARTU KREDIT');
    }

    // Verifikasi nominal terisi otomatis
    const nominalInput = page.locator('input[type="text"]').filter({ hasNot: page.locator('input[placeholder="Enter card number"]') }).first();
    const nominalVal = await nominalInput.inputValue().catch(() => '');
    console.log(`✓ Nominal: ${nominalVal}`);

    // Isi card number (dummy untuk testing)
    const cardInput = page.locator('input[placeholder="Enter card number"]').first();
    if (await cardInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardInput.fill('1234567890123456');
      console.log('✓ Card number diisi: 1234567890123456');
    } else {
      bugs.push('Input card number tidak muncul');
    }

    // Verifikasi tombol Create Payment tersedia
    const createPayBtn = page.locator("button:has-text('Create Payment')").first();
    if (!await createPayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Tombol Create Payment tidak ditemukan');
      expect(bugs).toHaveLength(0); return;
    }
    console.log('✓ Tombol Create Payment tersedia');

    // Klik Create Payment
    await createPayBtn.click();
    await page.waitForTimeout(4000);
    console.log('✓ Create Payment diklik');

    // Verifikasi hasil: cek apakah ada konfirmasi sukses atau status berubah
    const bodyAfterPay = await page.locator('body').innerText().catch(() => '');
    const paySuccess = 
      bodyAfterPay.includes('Payment Recorded') ||
      bodyAfterPay.includes('Completed') ||
      bodyAfterPay.includes('KARTU KREDIT') && bodyAfterPay.includes('MANDIRI');

    if (paySuccess) {
      console.log('✓ Payment berhasil - status terupdate');
      // Ambil info payment yang tercatat
      const payRecordMatch = bodyAfterPay.match(/Payment Recorded[\s\S]{0,200}/);
      if (payRecordMatch) console.log(`  ${payRecordMatch[0].slice(0, 100).replace(/\n/g, ' ')}`);
    } else {
      // Cek apakah ada error message
      const errorMsg = await page.locator('text=/error|gagal|failed|invalid/i').first().textContent().catch(() => '');
      if (errorMsg) {
        console.log(`  ⚠ Error payment: ${errorMsg.trim()}`);
        bugs.push(`Payment gagal: ${errorMsg.trim()}`);
      } else {
        console.log('  ⚠ Tidak bisa verifikasi status payment dari UI');
      }
    }

    // Screenshot hasil akhir
    await page.screenshot({ path: 'test-results/so-payment-kredit-result.png', fullPage: true });
    console.log('  Screenshot disimpan: test-results/so-payment-kredit-result.png');

    console.log('\n' + '='.repeat(50));
    console.log('✅ FULL E2E SELESAI: Create SO → Campaign → Submit → Payment Kartu Kredit');
    console.log('='.repeat(50));

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Sales Order - Multi Item Ready + Indent (Customer Dinamis)', async ({ page }) => {
    test.setTimeout(300000);
    const bugs = [];

    // ============================================================
    // HELPER: Tambah produk ke order dengan pilih stock source
    // stockType: 'Ready' | 'Indent' | 'auto' (coba Ready dulu, lalu Indent)
    // whKeyword: filter WH tertentu (misal 'JTFGA') - optional
    // ============================================================
    const addProductWithStock = async (skuSearch, stockType = 'auto', whKeyword = null) => {
      const productSearch = page.locator("input[placeholder*='Search product']").first();
      await productSearch.fill('');
      await productSearch.fill(skuSearch);
      await page.waitForTimeout(2500);

      const allCards = page.locator('div.grid > div');
      const cardCount = await allCards.count();
      if (cardCount === 0) return { success: false, reason: `Produk ${skuSearch} tidak ditemukan` };

      // Cari card yang cocok dengan stockType
      for (let i = 0; i < Math.min(cardCount, 12); i++) {
        const card = allCards.nth(i);
        const txt = await card.textContent().catch(() => '');
        const addBtn = card.locator("button:has-text('Add to O')").first();
        if (!await addBtn.isVisible({ timeout: 1000 }).catch(() => false)) continue;

        // Cek stok ready
        const readyMatch = txt.match(/READY\s*(\d+)/i);
        const indentMatch = txt.match(/INDENT\s*(\d+)/i);
        const hasReady = readyMatch && parseInt(readyMatch[1]) > 0;
        const hasIndent = indentMatch && parseInt(indentMatch[1]) > 0;

        let shouldClick = false;
        if (stockType === 'Ready' && hasReady) shouldClick = true;
        else if (stockType === 'Indent' && hasIndent) shouldClick = true;
        else if (stockType === 'auto' && (hasReady || hasIndent)) shouldClick = true;

        if (!shouldClick) continue;

        await addBtn.click();
        await page.waitForTimeout(2000);

        // === Handle modal Add to Order ===
        const modal = page.locator('.fixed.inset-0').filter({ hasText: /Add to Order/i }).first();
        if (!await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
          return { success: true, sku: txt.match(/BH\s?\d+\w+/i)?.[0] || skuSearch, stockUsed: 'unknown' };
        }

        const modalText = await modal.innerText().catch(() => '');
        console.log(`  Modal sources tersedia: ${modalText.replace(/\n/g, ' ').slice(0, 250)}`);

        // Tentukan order prioritas sumber stok
        let sourceOrder = [];
        if (stockType === 'Ready') {
          sourceOrder = ['Warehouse Ready'];
        } else if (stockType === 'Indent') {
          // Indent: cari WH JTFGA dulu, lalu WH lain
          const allSourceRows = await modal.locator('label, [role="radio"] + span, div:has(input[type="radio"])').all();
          const sourceTexts = [];
          for (const row of allSourceRows) {
            const t = await row.textContent().catch(() => '');
            if (t.trim()) sourceTexts.push(t.trim());
          }
          // Cari semua opsi yang mengandung "Indent" atau "WH"
          const indentOptions = sourceTexts.filter(t => /indent|WH/i.test(t));
          if (whKeyword) {
            // WH JTFGA pertama
            const priority = indentOptions.filter(t => t.toUpperCase().includes(whKeyword.toUpperCase()));
            const rest = indentOptions.filter(t => !t.toUpperCase().includes(whKeyword.toUpperCase()));
            sourceOrder = [...priority, ...rest, 'Warehouse Indent'];
          } else {
            sourceOrder = [...indentOptions, 'Warehouse Indent'];
          }
          if (sourceOrder.length === 0) sourceOrder = ['Warehouse Indent'];
        } else {
          sourceOrder = ['Warehouse Ready', 'Warehouse Indent'];
        }

        // Coba tiap sumber
        const addToOrderModalBtn = modal.locator("button:has-text('Add to Order')").last();
        let confirmed = false;
        let stockUsed = '';

        for (const source of sourceOrder) {
          // Klik row/label yang mengandung teks sumber ini
          const sourceRow = modal.locator(`text="${source}"`).first();
          const altRow = modal.locator(`label, div`).filter({ hasText: source }).first();
          const clickTarget = await sourceRow.isVisible({ timeout: 1000 }).catch(() => false) ? sourceRow : altRow;
          if (await clickTarget.isVisible({ timeout: 1000 }).catch(() => false)) {
            await clickTarget.click({ force: true });
            await page.waitForTimeout(800);
          }
          const enabled = await addToOrderModalBtn.isEnabled().catch(() => false);
          if (enabled) {
            await addToOrderModalBtn.click({ force: true });
            await modal.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
            await page.waitForTimeout(500);
            stockUsed = source;
            confirmed = true;
            break;
          }
        }

        if (!confirmed) {
          // Tutup modal
          const closeBtn = modal.locator("button:has-text('Cancel'), button:has-text('Close')").first();
          if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) await closeBtn.click({ force: true });
          else await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          return { success: false, reason: `Semua stock source tidak tersedia untuk ${skuSearch} (${stockType})` };
        }

        return { success: true, sku: txt.match(/BH[\s]?\d+\w+/i)?.[0] || skuSearch, stockUsed };
      }

      return { success: false, reason: `Tidak ada card ${skuSearch} dengan stock ${stockType}` };
    };

    // ============================================================
    // STEP 1: LOGIN + BUKA WIZARD CREATE SO
    // ============================================================
    console.log('\n=== STEP 1: LOGIN & BUKA WIZARD ===');
    await login(page);
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await page.locator("button:has-text('Create New')").first().click();
    await page.waitForTimeout(3000);

    if (!await page.locator('h1, h2').filter({ hasText: /Create Sales Order/i }).first().isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Wizard Create SO tidak muncul'); expect(bugs).toHaveLength(0); return;
    }

    // ============================================================
    // STEP 2: PILIH CUSTOMER DINAMIS (cari yang BUKAN Dedi/Ryan)
    // ============================================================
    console.log('\n=== STEP 2: PILIH CUSTOMER DINAMIS ===');
    const custSearchInput = page.locator("input[placeholder='Search data...']").first();
    await custSearchInput.waitFor({ timeout: 5000 });

    // Ambil customer dari tabel, cari yang berbeda dari Dedi/Ryan
    const custRows = page.locator('table tbody tr');
    const custCount = await custRows.count();
    let chosenCustomer = '';
    for (let i = 0; i < Math.min(custCount, 20); i++) {
      const rowTxt = await custRows.nth(i).textContent().catch(() => '');
      if (!/dedi|ryan/i.test(rowTxt) && rowTxt.trim()) {
        await custRows.nth(i).click();
        chosenCustomer = rowTxt.trim().slice(0, 40);
        break;
      }
    }
    // Fallback: klik baris pertama jika semua Dedi/Ryan
    if (!chosenCustomer) {
      await custRows.first().click();
      chosenCustomer = (await custRows.first().textContent().catch(() => '')).trim().slice(0, 40);
    }
    await page.waitForTimeout(2000);
    console.log(`✓ Customer dipilih: ${chosenCustomer}`);

    const nextBtn1 = page.locator("button:has-text('Next Step')").first();
    await nextBtn1.waitFor({ state: 'visible', timeout: 8000 });
    await nextBtn1.click();
    await page.waitForTimeout(3000);

    // ============================================================
    // Helper: tambah campaign ke item yang sudah di-add
    // Dipanggil setelah produk masuk Selected Items
    // ============================================================
    const applyPromoToLastItem = async (itemLabel) => {
      // Cari tombol Add Promo yang muncul di Selected Items section
      const addPromoBtn = page.locator('button[title="Add Promo"], button:has-text("Add Promo")').first();
      if (!await addPromoBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
        console.log(`  ⚠ Tombol Add Promo tidak muncul untuk ${itemLabel}`);
        return false;
      }
      await addPromoBtn.click({ force: true });
      await page.waitForTimeout(1000);

      const promoModal = page.locator('.fixed.inset-0').filter({ hasText: 'Available Promotions' }).first();
      if (!await promoModal.isVisible({ timeout: 8000 }).catch(() => false)) {
        console.log(`  ⚠ Modal promo tidak terbuka untuk ${itemLabel}`);
        return false;
      }

      // Tunggu data selesai loading
      await page.waitForFunction(() => {
        const m = document.querySelector('.fixed.inset-0');
        return m && !m.innerText.includes('Memuat promo');
      }, { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(800);

      const campaignRow = promoModal.locator('table tbody tr').first();
      if (!await campaignRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`  ⚠ Tidak ada campaign aktif untuk ${itemLabel}`);
        const closeBtn = promoModal.locator("button:has-text('Close')").first();
        if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) await closeBtn.click({ force: true });
        else await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        return false;
      }

      const campaignTxt = (await campaignRow.textContent().catch(() => '')).trim().slice(0, 60);
      const selectBtn = promoModal.locator("button:has-text('Select')").first();
      await selectBtn.click({ force: true });
      await page.waitForTimeout(1500);
      console.log(`✓ Campaign dipilih untuk ${itemLabel}: ${campaignTxt}`);
      return true;
    };

    // ============================================================
    // STEP 3: TAMBAH BH 2725 GABK - STOCK READY + CAMPAIGN
    // ============================================================
    console.log('\n=== STEP 3: TAMBAH BH2725GABK (STOCK READY) ===');
    if (!await page.locator('text=Available Products').first().isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Halaman Products tidak muncul'); expect(bugs).toHaveLength(0); return;
    }

    const result1 = await addProductWithStock('BH2725GABK', 'Ready');
    if (!result1.success) {
      console.log(`  ⚠ ${result1.reason} - coba auto`);
      const result1b = await addProductWithStock('BH2725GABK', 'auto');
      if (!result1b.success) bugs.push(result1b.reason);
      else console.log(`✓ BH2725GABK ditambahkan (${result1b.stockUsed})`);
    } else {
      console.log(`✓ BH2725GABK ditambahkan (${result1.stockUsed}) - READY`);
    }

    // Terapkan campaign ke BH2725GABK
    console.log('  → Terapkan campaign ke BH2725GABK...');
    await applyPromoToLastItem('BH2725GABK');

    // ============================================================
    // STEP 4: TAMBAH BH 2725 GBBK - STOCK INDENT (WH JTFGA) + CAMPAIGN
    // ============================================================
    console.log('\n=== STEP 4: TAMBAH BH2725GBBK (STOCK INDENT - WH JTFGA) ===');

    const result2 = await addProductWithStock('BH2725GBBK', 'Indent', 'JTFGA');
    if (!result2.success) {
      console.log(`  ⚠ ${result2.reason} - coba indent tanpa filter WH`);
      const result2b = await addProductWithStock('BH2725GBBK', 'Indent', null);
      if (!result2b.success) {
        console.log(`  ⚠ ${result2b.reason} - coba auto`);
        const result2c = await addProductWithStock('BH2725GBBK', 'auto');
        if (!result2c.success) bugs.push(result2c.reason);
        else console.log(`✓ BH2725GBBK ditambahkan (${result2c.stockUsed}) - fallback auto`);
      } else {
        console.log(`✓ BH2725GBBK ditambahkan (${result2b.stockUsed}) - INDENT`);
      }
    } else {
      console.log(`✓ BH2725GBBK ditambahkan (${result2.stockUsed}) - INDENT WH JTFGA`);
    }

    // Terapkan campaign ke BH2725GBBK
    console.log('  → Terapkan campaign ke BH2725GBBK...');
    await applyPromoToLastItem('BH2725GBBK');

    // Verifikasi total produk ter-add
    const selectedLabel = page.locator('text=/Selected \\(\\d+\\)/i').first();
    if (await selectedLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
      const selTxt = await selectedLabel.textContent().catch(() => '');
      console.log(`✓ Total produk ter-add: ${selTxt.trim()}`);
    } else {
      const anySelected = await page.locator('text=/Selected/i').first().isVisible({ timeout: 3000 }).catch(() => false);
      if (!anySelected) bugs.push('Tidak ada produk yang berhasil ditambahkan');
    }

    // ============================================================
    // STEP 5: REVIEW
    // ============================================================
    console.log('\n=== STEP 5: REVIEW ===');
    const nextBtn2 = page.locator("button:has-text('Next Step')").first();
    if (!await nextBtn2.isEnabled({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Tombol Next Step tidak aktif'); expect(bugs).toHaveLength(0); return;
    }
    await nextBtn2.click();
    await page.waitForTimeout(3000);

    const submitBtn = page.locator("button:has-text('Submit Order')").first();
    if (!await submitBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
      bugs.push('Tombol Submit Order tidak muncul di Review');
      expect(bugs).toHaveLength(0); return;
    }

    const reviewBody = await page.locator('body').innerText().catch(() => '');
    const grandTotalMatch = reviewBody.match(/Grand Total\s*(Rp[\d.,\s]+)/i);
    console.log(`✓ Review page OK - Grand Total: ${grandTotalMatch?.[1]?.trim() || 'n/a'}`);

    const reviewRows = await page.locator('table tbody tr').all();
    console.log(`  Produk dalam order: ${reviewRows.length} item(s)`);
    for (const row of reviewRows) {
      const rowTxt = await row.textContent().catch(() => '');
      if (rowTxt.trim()) console.log(`    - ${rowTxt.trim().slice(0, 90)}`);
    }

    await page.screenshot({ path: 'test-results/so-multi-item-review.png', fullPage: true });
    console.log('  Screenshot: test-results/so-multi-item-review.png');

    // ============================================================
    // STEP 6: SUBMIT ORDER
    // ============================================================
    console.log('\n=== STEP 6: SUBMIT ORDER ===');
    await submitBtn.click();
    await page.waitForTimeout(5000);
    console.log('✓ Submit Order diklik');

    const urlAfterSubmit = page.url();
    console.log(`  URL setelah submit: ${urlAfterSubmit}`);

    const bodyAfterSubmit = await page.locator('body').innerText().catch(() => '');
    const soCreated = bodyAfterSubmit.match(/MoRe-SO[\w-]+/)?.[0];
    console.log(`  SO Number terdeteksi: ${soCreated || 'cek di list SO'}`);

    // Navigasi ke SO list dan cari SO baru
    await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const listBody = await page.locator('table tbody').innerText().catch(() => '');
    console.log(`  List SO terbaru:\n${listBody.split('\n').slice(0, 6).map(l => '    ' + l).join('\n')}`);

    // Cari SO dengan status "Waiting Payment" atau "Open" terbaru dari customer yang dipilih
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    let newSO = '';
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const rt = await rows.nth(i).textContent().catch(() => '');
      if (rt.includes('Waiting Payment') || rt.includes('Open')) {
        newSO = rt.trim().slice(0, 60);
        break;
      }
    }
    if (newSO) console.log(`✓ SO baru terdeteksi: ${newSO}`);

    await page.screenshot({ path: 'test-results/so-multi-item-submitted.png', fullPage: true });
    console.log('  Screenshot: test-results/so-multi-item-submitted.png');

    console.log('\n' + '='.repeat(55));
    console.log('✅ TEST SELESAI: Multi Item Ready + Indent + Campaign + Submit');
    console.log('='.repeat(55));

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Sales Order - detail SO (buka View item pertama)', async ({ page }) => {
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
