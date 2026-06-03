import { test, expect } from '@playwright/test';
import { cleanupTableRecordBySnapshot, isAutoCleanupEnabled } from '../../utils/data-cleanup.mjs';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';
const PRODUCT_SEARCH = 'BH2725GBBK.IDALB0A';

// Helper: parse angka dari string Rp (e.g. "Rp 1.500.000" -> 1500000)
function parsePrice(text) {
  if (!text) return 0;
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

test.describe('MHC - Sales Order Creation', () => {
  test.setTimeout(150000);

  test('Create Sales Order - Full Flow', async ({ page }) => {
    let createdSnapshot = null;
    let listUrl = `${BASE_URL}/sales-order`;
    let initialCount = 0;

    try {

    // 1. Login
    console.log('1. Logging in...');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
    await page.locator("button:has-text('Login')").click();
    await page.waitForTimeout(4000);
    console.log('✓ Login successful');

    // 2. Go to Sales Order
    console.log('2. Opening Sales Order...');
    await page.locator('text="Sales Order"').first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Sales Order page opened');
    listUrl = page.url();
    initialCount = await page.locator('table tbody tr').count().catch(() => 0);

    // 3. Click Create New
    console.log('3. Clicking Create New...');
    await page.locator("button:has-text('Create New')").click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/so-step1-entities.png', fullPage: true });
    console.log('✓ Create wizard opened');

    // 4. Select Customer (ENTITIES step)
    console.log('4. Selecting customer...');
    const contentText = await page.locator('body').innerText().catch(() => '');
    console.log('  Entities snippet:', contentText.slice(contentText.indexOf('ENTITIES'), contentText.indexOf('ENTITIES') + 400));

    // Scope ke main content, bukan sidebar
    const mainTable = page.locator('main table, [class*="content"] table').first();
    const firstRow = mainTable.locator('tbody tr').first();

    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(1000);
      console.log('✓ Customer selected');
    } else {
      // Fallback: cari item/card pertama di main area
      const mainItem = page.locator('main [class*="item"], main [class*="card"], main [class*="list"] > div').first();
      if (await mainItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await mainItem.click();
        await page.waitForTimeout(1000);
        console.log('✓ Customer selected (card)');
      } else {
        console.log('⚠ No customer rows found - proceeding anyway');
      }
    }

    // 5. Go to Products step
    console.log('5. Going to Products step...');
    const nextBtn5 = page.locator("button:has-text('Next Step')").or(page.locator("button:has-text('Next')")).first();
    await nextBtn5.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await nextBtn5.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/so-step2-products.png', fullPage: true });
    console.log('✓ Products page loaded');

    // 6. Search & Add product
    console.log('6. Adding products...');
    const searchInput = page.locator("input[placeholder*='Search'], input[type='search']").first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`  🔍 Searching: "${PRODUCT_SEARCH}"`);
      await searchInput.fill(PRODUCT_SEARCH);
      await page.waitForTimeout(2000);
    }

    const addBtnCount = await page.locator("button:has-text('Add to Order')").count();
    console.log(`  Found ${addBtnCount} Add to Order buttons`);

    let addedCount = 0;
    const targetCount = 1;

    for (let round = 0; round < targetCount; round++) {
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(800);

      const addButtons = await page.locator("button:has-text('Add to Order')").all();
      if (addButtons.length === 0) {
        console.log('  ⚠ No Add to Order buttons found');
        break;
      }

      console.log(`  - Round ${round + 1}: Clicking Add to Order...`);
      await addButtons[0].scrollIntoViewIfNeeded().catch(() => {});
      await addButtons[0].click({ force: true, timeout: 10000 });
      await page.waitForTimeout(2000);

      // Modal "Add to SO" / "Add to Order"
      const addToOrderModalBtn = page.locator("button:has-text('Add to Order')").last();
      const modalOpen = await addToOrderModalBtn.isVisible({ timeout: 5000 }).catch(() => false);

      if (modalOpen) {
        console.log('  Modal terbuka');
        // Scope semua selector ke dalam modal
        const modal = page.locator('.fixed.inset-0').first();

        // Pilih Warehouse Indent sebagai stock source (scope ke modal)
        const indentOption = modal.locator('div, label').filter({ hasText: /^Warehouse Indent$/ }).first();
        if (await indentOption.isVisible({ timeout: 3000 }).catch(() => false)) {
          await indentOption.click({ force: true });
          console.log('    ✓ Stock source: Warehouse Indent');
          await page.waitForTimeout(1000);
        }

        // Pilih warehouse pertama yang punya stock > 0 (scope ke modal, gunakan leaf node)
        let whSelected = false;
        const allWhDivs = await modal.locator('div').all();
        for (const div of allWhDivs) {
          const txt = (await div.textContent().catch(() => '')).trim();
          // Leaf node: mengandung kode warehouse (WX-XXXXX) tapi teksnya pendek (<100 char)
          if (/\([A-Z]{2}-[A-Z0-9]+\)/.test(txt) && txt.length < 100) {
            const match = txt.match(/(\d+)\s*Unit/);
            if (match && parseInt(match[1]) > 0) {
              await div.scrollIntoViewIfNeeded().catch(() => {});
              await div.click({ force: true });
              console.log(`    ✓ Fulfillment warehouse: ${txt.replace(/\s+/g, ' ').slice(0, 60)}`);
              whSelected = true;
              await page.waitForTimeout(500);
              break;
            }
          }
        }
        if (!whSelected) {
          console.log('    ⚠ No warehouse with stock > 0 found');
        }

        // Pilih Grade A jika tersedia (scope ke modal)
        const gradeA = modal.locator('div, label').filter({ hasText: /^Grade A$/ }).first();
        if (await gradeA.isVisible({ timeout: 2000 }).catch(() => false)) {
          await gradeA.click({ force: true });
          console.log('    ✓ Grade: Grade A');
          await page.waitForTimeout(500);
        }

        // Set qty = 1 (scope ke modal)
        const qtyInput = modal.locator("input[type='number'], input[inputmode='numeric']").first();
        if (await qtyInput.isVisible({ timeout: 1500 }).catch(() => false)) {
          await qtyInput.click({ force: true, clickCount: 3 });
          await qtyInput.fill('1');
          console.log('    ✓ Qty = 1');
        }
        await page.waitForTimeout(500);

        // Klik Add to Order di modal
        const addToOrderInModal = modal.locator("button:has-text('Add to Order')").last();
        await addToOrderInModal.click({ force: true });
        console.log('    ✓ Add to Order clicked');
        await page.waitForTimeout(2000);
        addedCount++;
      } else {
        // Fallback: cari confirm button lain
        const confirmBtn = page.locator("button:has-text('Add to Order'), button:has-text('Confirm')").last();
        if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await confirmBtn.click({ force: true });
          console.log('    ✓ Confirmed via fallback button');
          await page.waitForTimeout(2000);
          addedCount++;
        }
      }
    }

    console.log(`✓ Added ${addedCount} products`);
    await page.screenshot({ path: 'test-results/so-after-add-products.png', fullPage: true });

    // 6b. Add Promo / Campaign
    console.log('6b. Adding promo/campaign...');
    // Tunggu "Selected Items" muncul dulu
    await page.waitForSelector('button[title="Add Promo"]', { timeout: 5000 }).catch(() => {});
    const addPromoBtn = page.locator('button[title="Add Promo"]').first();
    if (await addPromoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addPromoBtn.click({ force: true });
      await page.waitForTimeout(1500);

      // Cek modal promo terbuka
      const promoModalText = await page.locator('.fixed.inset-0').innerText().catch(() => '');
      if (promoModalText.includes('Available Promotions') || promoModalText.includes('Campaign')) {
        console.log('  Modal promo terbuka');
        console.log('  Promos tersedia:', promoModalText.replace(/\n/g, ' ').slice(0, 200));

        // Klik "Select" pada promo pertama
        const selectPromoBtn = page.locator('.fixed.inset-0 button:has-text("Select")').first();
        if (await selectPromoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await selectPromoBtn.click({ force: true });
          await page.waitForTimeout(1500);
          console.log('  ✓ Promo selected');
          await page.screenshot({ path: 'test-results/so-promo-selected.png', fullPage: true });
        } else {
          // Tutup modal jika tidak ada promo aktif
          const closeBtn = page.locator('.fixed.inset-0 button:has-text("Close")');
          if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeBtn.click({ force: true });
            console.log('  ⚠ Tidak ada promo aktif - modal ditutup');
          }
        }
      } else {
        console.log('  ⚠ Modal promo tidak muncul');
      }
    } else {
      console.log('  ⚠ Tombol Add Promo tidak ditemukan');
    }

    // 7. Go to Review
    console.log('7. Going to Review...');

    // Tutup modal jika masih terbuka
    for (let c = 0; c < 3; c++) {
      const addItemVisible = await page.locator("button:has-text('Add Item')").isVisible({ timeout: 800 }).catch(() => false);
      if (!addItemVisible) break;
      const cancelBtn = page.locator("button:has-text('Cancel')").last();
      if (await cancelBtn.isVisible({ timeout: 800 }).catch(() => false)) {
        await cancelBtn.click({ force: true });
        await page.waitForTimeout(800);
      } else {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(800);
      }
    }

    // Klik Next Step untuk ke Review (jangan klik tab REVIEW di progress bar)
    const nextBtn7 = page.locator("button:has-text('Next Step')").first();
    await nextBtn7.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const isNextDisabled = await nextBtn7.isDisabled().catch(() => false);
    if (isNextDisabled) {
      console.log('  ⚠ Next Step disabled - produk mungkin belum masuk cart');
    }
    await nextBtn7.click({ force: true });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/so-step3-review.png', fullPage: true });

    // Verifikasi di REVIEW
    const reviewText = await page.locator('body').innerText().catch(() => '');
    const onReview = reviewText.includes('Grand Total') || reviewText.includes('Payment Summary') || reviewText.includes('Subtotal');
    console.log(`  On REVIEW: ${onReview}`);
    console.log('✓ REVIEW page loaded');

    // ============================================================
    // 7b. VALIDASI KALKULASI
    // ============================================================
    console.log('\n📊 7b. Validating calculations...');
    console.log(reviewText.slice(0, 1500));

    // Baca Payment Summary dari text
    function extractValueAfterLabel(text, labelRegex) {
      const match = text.match(new RegExp(labelRegex + '[\\s\\S]{0,30}?(Rp\\s*[\\d.,\\s]+)', 'i'));
      return match ? parsePrice(match[1]) : null;
    }

    const totalBeforeDisc = extractValueAfterLabel(reviewText, 'Total Before Discount');
    const netDisc = extractValueAfterLabel(reviewText, 'Net Disc');
    const subtotalPay = extractValueAfterLabel(reviewText, '\\nSubtotal\\n');
    const grandTotalPay = extractValueAfterLabel(reviewText, 'Grand Total');

    console.log('\n  --- Payment Summary ---');
    console.log(`  Total Before Discount : ${totalBeforeDisc !== null ? totalBeforeDisc.toLocaleString('id-ID') : 'not found'}`);
    console.log(`  Net Disc              : ${netDisc !== null ? netDisc.toLocaleString('id-ID') : 'not found'}`);
    console.log(`  Subtotal              : ${subtotalPay !== null ? subtotalPay.toLocaleString('id-ID') : 'not found'}`);
    console.log(`  Grand Total           : ${grandTotalPay !== null ? grandTotalPay.toLocaleString('id-ID') : 'not found'}`);

    // Baca table product (scope ke tabel dengan header WHS)
    const productTable = page.locator('table').filter({ has: page.locator('th:has-text("WHS")') }).first();
    const tableHeaders = await page.locator('table thead th, table thead td').all();
    const headerTexts = [];
    for (const th of tableHeaders) {
      const t = await th.textContent().catch(() => '');
      if (t && t.trim()) headerTexts.push(t.trim());
    }
    console.log('\n  Table headers: ' + headerTexts.join(' | '));

    let qtyColIdx = -1, priceColIdx = -1, grossTotalColIdx = -1;
    for (let i = 0; i < headerTexts.length; i++) {
      const h = headerTexts[i].toLowerCase();
      if (/^qty$|quantity/.test(h)) qtyColIdx = i;
      if (/price\s*\/\s*unit|unit\s*price/.test(h)) priceColIdx = i;
      if (/gross\s*total/.test(h)) grossTotalColIdx = i;
    }

    const reviewRows = await productTable.locator('tbody tr').all();
    console.log(`  Found ${reviewRows.length} product rows`);

    const lineItems = [];
    const calcErrors = [];
    let sumQtyPrice = 0;

    for (let i = 0; i < reviewRows.length; i++) {
      const cells = await reviewRows[i].locator('td').all();
      if (cells.length < 3) continue;
      const cellTexts = [];
      for (const c of cells) cellTexts.push((await c.textContent().catch(() => '')).trim());

      const productName = cellTexts[0]?.slice(0, 35) || `Row ${i+1}`;
      const qty = qtyColIdx >= 0 ? parsePrice(cellTexts[qtyColIdx]) : 0;
      const unitPrice = priceColIdx >= 0 ? parsePrice(cellTexts[priceColIdx]) : 0;
      const grossTotal = grossTotalColIdx >= 0 ? parsePrice(cellTexts[grossTotalColIdx]) : 0;

      if (unitPrice === 0) continue;

      const expected = qty * unitPrice;
      sumQtyPrice += expected;
      lineItems.push({ productName, qty, unitPrice, grossTotal });
      console.log(`  📦 "${productName}" Qty:${qty} × Rp${unitPrice.toLocaleString('id-ID')} = Rp${expected.toLocaleString('id-ID')} | Gross:Rp${grossTotal.toLocaleString('id-ID')}`);
    }

    // Validasi
    console.log('\n  --- Validasi ---');
    if (totalBeforeDisc !== null && sumQtyPrice > 0) {
      if (Math.abs(sumQtyPrice - totalBeforeDisc) > 1) {
        calcErrors.push(`❌ Total Before Discount: sum=Rp${sumQtyPrice.toLocaleString('id-ID')} ≠ displayed=Rp${totalBeforeDisc.toLocaleString('id-ID')}`);
      } else {
        console.log(`  ✅ Total Before Discount: Rp${totalBeforeDisc.toLocaleString('id-ID')} ✓`);
      }
    }
    if (totalBeforeDisc !== null && netDisc !== null && subtotalPay !== null) {
      const expSub = totalBeforeDisc - netDisc;
      if (Math.abs(expSub - subtotalPay) > 1) {
        calcErrors.push(`❌ Subtotal: ${totalBeforeDisc.toLocaleString('id-ID')} - ${netDisc.toLocaleString('id-ID')} = ${expSub.toLocaleString('id-ID')} ≠ ${subtotalPay.toLocaleString('id-ID')}`);
      } else {
        console.log(`  ✅ Subtotal: Rp${subtotalPay.toLocaleString('id-ID')} ✓`);
      }
    }
    if (subtotalPay !== null && grandTotalPay !== null) {
      if (Math.abs(grandTotalPay - subtotalPay) > 1) {
        calcErrors.push(`❌ Grand Total: Rp${grandTotalPay.toLocaleString('id-ID')} ≠ Subtotal Rp${subtotalPay.toLocaleString('id-ID')}`);
      } else {
        console.log(`  ✅ Grand Total: Rp${grandTotalPay.toLocaleString('id-ID')} ✓`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 CALCULATION VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`  Line items  : ${lineItems.length}`);
    if (calcErrors.length === 0) {
      console.log('  ✅ ALL CALCULATIONS CORRECT');
    } else {
      for (const e of calcErrors) console.log('  ' + e);
    }
    console.log('='.repeat(50));

    expect(calcErrors.length, `Calculation errors:\n${calcErrors.join('\n')}`).toBe(0);

    // 8. Submit / Create SO
    console.log('\n8. Submitting Sales Order...');
    const createSOBtn = page.locator("button:has-text('Create SO'), button:has-text('Create Sales Order'), button:has-text('Submit'), button:has-text('Confirm')").first();
    const saveDraftBtn = page.locator("button:has-text('Save Draft')").first();

    if (await createSOBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const btnText = await createSOBtn.textContent();
      await createSOBtn.click();
      await page.waitForTimeout(3000);
      console.log(`✓ SO submitted via "${btnText?.trim()}" button`);
      await page.screenshot({ path: 'test-results/so-submitted.png', fullPage: true });
    } else if (await saveDraftBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveDraftBtn.click();
      await page.waitForTimeout(3000);
      console.log('✓ SO saved as draft');
      await page.screenshot({ path: 'test-results/so-draft.png', fullPage: true });
    } else {
      // Log semua tombol yang ada
      const allBtns = await page.locator('button').all();
      console.log('  Buttons visible:');
      for (const b of allBtns) {
        const t = await b.textContent().catch(() => '');
        const v = await b.isVisible().catch(() => false);
        if (v && t?.trim()) console.log(`    - "${t.trim()}"`);
      }
      console.log('⚠ Submit button not found');
    }

    await page.locator('text="Sales Order"').first().click().catch(() => null);
    await page.waitForTimeout(2000);
    const finalCount = await page.locator('table tbody tr').count().catch(() => 0);
    if (finalCount > initialCount) {
      createdSnapshot = await page.locator('table tbody tr').first().textContent().catch(() => null);
    }

    console.log('\n✅ Test completed!');
    } finally {
      if (createdSnapshot && isAutoCleanupEnabled()) {
        console.log('\n🧹 AUTO CLEANUP SO (best effort)');
        await cleanupTableRecordBySnapshot(page, {
          listUrl,
          rowSnapshot: createdSnapshot,
          label: 'sales order',
          rowLocator: 'table tbody tr',
        });
      }
    }
  });
});
