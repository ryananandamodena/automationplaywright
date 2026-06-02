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

// Helper: klik div/item dalam modal berdasarkan text
async function clickModalItemByText(page, partialText) {
  await page.evaluate((text) => {
    const all = document.querySelectorAll('div');
    const modal = Array.from(all).find(d =>
      d.classList.contains('fixed') && d.classList.contains('inset-0') && d.style.display !== 'none'
    );
    if (!modal) return;
    const items = modal.querySelectorAll('div[class*="border"][class*="rounded"]');
    const item = Array.from(items).find(d => d.textContent.includes(text));
    if (item) item.click();
  }, partialText);
  await page.waitForTimeout(500);
}

test.describe('MHC - Purchase Order', () => {
  test.setTimeout(120000);

  test('Purchase Order List - load & elemen utama', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);
    await page.goto(`${BASE}/purchase-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const { bugs: pageBugs } = await checkPageLoaded(page, '/purchase-order');
    bugs.push(...pageBugs);

    const heading = page.locator('h1, h2, h3').filter({ hasText: /Purchase Order/i }).first();
    if (!await heading.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Heading "Purchase Order" tidak ditemukan');
    else console.log('✓ Heading "Purchase Order" visible');

    const tableOrList = page.locator('table, [class*="list"]').first();
    if (!await tableOrList.isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Tabel/list PO tidak ditemukan');
    else console.log('✓ Tabel/list visible');

    // Cek kolom tabel
    const poNumberCol = page.locator('table thead th').filter({ hasText: /PO Number/i }).first();
    if (await poNumberCol.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Kolom PO Number ada');

    const createBtn = page.locator("button:has-text('Create New')").first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Tombol Create New tidak ditemukan');
    else console.log('✓ Tombol Create New visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Purchase Order - Create PO full flow', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/purchase-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // === STEP 1: ENTITIES ===
    console.log('Step 1: Entities (Supplier & Customer info)...');
    const createBtn = page.locator("button:has-text('Create New')").first();
    if (!await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Tombol Create New tidak ditemukan');
      expect(bugs).toHaveLength(0); return;
    }
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Verifikasi wizard muncul
    const wizardTitle = page.locator('h1, h2').filter({ hasText: /Create Purchase Order/i }).first();
    if (!await wizardTitle.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Wizard Create PO tidak muncul');
      expect(bugs).toHaveLength(0); return;
    }
    console.log('✓ Wizard Create Purchase Order terbuka');

    // Verifikasi Supplier pre-filled
    const supplierName = page.locator('text=Modena Indonesia-FGS-MHC01').first();
    if (await supplierName.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Supplier Name pre-filled: Modena Indonesia-FGS-MHC01');
    } else {
      bugs.push('Supplier Name tidak muncul di step Entities');
    }

    // Verifikasi ORDER TYPE dropdown ada
    const orderTypeDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /Finish Goods|Order Type/i }).first();
    const orderTypeLabel = page.locator('text=ORDER TYPE').first();
    if (await orderTypeLabel.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ ORDER TYPE field ada');

    // Verifikasi NPWP dropdown ada
    const npwpLabel = page.locator('text=NPWP').first();
    if (await npwpLabel.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ NPWP field ada');

    // Klik Next Step ke Products
    const nextBtn1 = page.locator("button:has-text('Next Step')").first();
    await nextBtn1.click();
    await page.waitForTimeout(3000);

    // === STEP 2: PRODUCTS ===
    console.log('Step 2: Add Products...');
    const productsHeading = page.locator('text=Available Products').first();
    if (!await productsHeading.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Halaman Products tidak muncul di step 2');
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

    // Klik Add to Order untuk produk dengan INDENT STOCK > 0
    const addBtns = page.locator("div.grid > div button:has-text('Add to O')");
    const addCount = await addBtns.count();
    console.log(`  Found ${addCount} Add to Order buttons`);

    if (addCount === 0) {
      bugs.push('Tidak ada tombol Add to Order di produk PO');
      expect(bugs).toHaveLength(0); return;
    }

    // Pilih card ke-2 (BH2725GABK - INDENT: 2495) atau yang punya stok > 0
    let addClicked = false;
    for (let i = 0; i < Math.min(addCount, 8); i++) {
      const card = page.locator('div.grid > div').nth(i);
      const cardText = await card.textContent().catch(() => '');
      const indentMatch = cardText.match(/INDENT\s*STOCK\s*(\d+)/i);
      const hasIndent = indentMatch && parseInt(indentMatch[1]) > 0;
      if (hasIndent || i === 1) {
        const btn = card.locator("button:has-text('Add to O')").first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(2000);
          addClicked = true;
          console.log(`✓ Klik Add to Order card ${i + 1}: ${cardText.slice(0, 50).trim()}`);
          break;
        }
      }
    }

    if (!addClicked) {
      await addBtns.first().click();
      await page.waitForTimeout(2000);
      addClicked = true;
      console.log('✓ Klik Add to Order (fallback: btn pertama)');
    }

    // Verifikasi modal "Add to PO" muncul
    const modalVisible = await page.locator('.fixed.inset-0').isVisible({ timeout: 5000 }).catch(() => false);
    if (modalVisible) {
      console.log('✓ Modal Add to PO terbuka');

      // Cek Grade A sudah terpilih (default)
      const gradeABtn = page.locator('.fixed.inset-0 button:has-text("Grade A")').first();
      if (await gradeABtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✓ Grade A tersedia di modal');
        // Grade A sudah ter-select by default (warna hitam/bold)
      }

      // Pilih warehouse pertama yang punya stok (klik via JS karena overlay)
      await clickModalItemByText(page, 'Warehouse Finished Goods Jatake 2');
      console.log('✓ Warehouse dipilih via JS click');
      await page.waitForTimeout(500);

      // Klik "Add Item" via JS evaluate (overlay intercepts normal click)
      await clickModalButton(page, 'Add Item');
      console.log('✓ Konfirmasi Add Item di modal');
    } else {
      console.log('  ⚠ Modal Add to PO tidak terdeteksi - lanjut cek selected items');
    }

    await page.waitForTimeout(2000);

    // Verifikasi produk ter-add (ada "Selected Items" section)
    const selectedSection = page.locator('text=/Selected Items|Selected Item/i').first();
    const isSelected = await selectedSection.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSelected) {
      const selectedText = await selectedSection.textContent().catch(() => '');
      console.log(`✓ Produk berhasil ditambahkan: ${selectedText.trim()}`);
    } else {
      bugs.push('Produk tidak berhasil ditambahkan ke PO (Selected Items section tidak muncul)');
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
    const createPOBtn = page.locator("button:has-text('Create PO')").first();
    const saveDraftBtn = page.locator("button:has-text('Save Draft')").first();

    if (!await createPOBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Tombol Create PO tidak muncul di step Review');
    } else {
      console.log('✓ Step Review muncul dengan tombol Create PO');
    }

    // Verifikasi Supplier Details di review
    const supplierReview = page.locator('text=Supplier Details').first();
    if (await supplierReview.isVisible({ timeout: 5000 }).catch(() => false))
      console.log('✓ Supplier Details di Review ada');

    // Verifikasi Payment Summary
    const paymentSummary = page.locator('text=/Payment Summary|Total Before Discount/i').first();
    if (await paymentSummary.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Payment Summary visible');

    // NOTE: Tidak submit Create PO otomatis untuk menghindari data sampah
    // Uncomment baris berikut jika ingin test full create:
    // await createPOBtn.click();
    // await page.waitForTimeout(5000);
    // const successMsg = page.locator('text=/Success|Berhasil|PO.*created/i').first();
    // if (!await successMsg.isVisible({ timeout: 10000 }).catch(() => false))
    //   bugs.push('Tidak ada pesan sukses setelah Create PO');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Purchase Order - detail PO (buka View item pertama)', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/purchase-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const viewBtn = page.locator('table tbody tr').first().locator("button:has-text('View'), a:has-text('View')").first();
    if (!await viewBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tidak ada data PO atau tombol View - skip detail test');
      return;
    }

    await viewBtn.click();
    await page.waitForTimeout(3000);

    const bodyText = await page.locator('body').innerText().catch(() => '');
    const isDetailPage = bodyText.includes('Purchase Order') && (
      bodyText.includes('Supplier') || bodyText.includes('Total') || bodyText.includes('Status')
    );
    if (!isDetailPage) bugs.push('Halaman detail PO tidak termuat dengan benar');
    else console.log('✓ Detail PO termuat');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('Purchase Order - search data', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${BASE}/purchase-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const searchInput = page.locator("input[placeholder*='Search data']").first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('MoRe');
      await page.waitForTimeout(2500);
      const rows = await page.locator('table tbody tr').count();
      console.log(`✓ Search berjalan, rows: ${rows}`);
      await searchInput.clear();
      await page.waitForTimeout(1500);
    } else {
      bugs.push('Input search tidak ditemukan');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
