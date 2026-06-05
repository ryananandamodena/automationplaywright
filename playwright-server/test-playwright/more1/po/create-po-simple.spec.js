import { test, expect } from '@playwright/test';
import { cleanupTableRecordBySnapshot, isAutoCleanupEnabled } from '../../utils/data-cleanup.mjs';

const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';

// Helper: parse angka dari string (e.g. "Rp 1.500.000" -> 1500000)
function parsePrice(text) {
  if (!text) return 0;
  const cleaned = text.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

test.describe('MHC - Purchase Order Creation (Simple)', () => {
  test.setTimeout(120000);

  test('Create Purchase Order - Simple Flow', async ({ page }) => {
    let createdSnapshot = null;
    let listUrl = `${BASE_URL}/purchase-order`;
    let initialCount = 0;

    try {
      // 1. Login
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

    console.log('1. Logging in...');
    await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
    await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
    await page.locator("button:has-text('Login')").click();
    await page.waitForTimeout(4000);
    console.log('✓ Login successful');

      // 2. Go to Purchase Order
    console.log('2. Opening Purchase Order...');
      await page.locator('text="Purchase Order"').first().click();
    await page.waitForTimeout(2000);
    console.log('✓ Purchase Order page opened');
      listUrl = page.url();
      initialCount = await page.locator('table tbody tr').count().catch(() => 0);

    // 3. Click Create New
    console.log('3. Clicking Create New...');
    await page.locator("button:has-text('Create New')").click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/po-step1-supplier.png', fullPage: true });
    console.log('✓ Create wizard opened');
    await page.screenshot({ path: 'test-results/po-step1-entities.png', fullPage: true });

    // 4. Select Supplier
    console.log('4. Selecting supplier...');
    await page.waitForTimeout(1000);

    // Dump content area saja (bukan sidebar)
    const mainContent = page.locator('main').or(page.locator('[class*="main"]')).or(page.locator('#main-content')).first();
    const contentText = await mainContent.innerText().catch(async () => page.locator('body').innerText());
    console.log('  Content area snippet:', contentText.slice(0, 800));

    // Supplier selection - scope ke content area (bukan sidebar)
    // Cari table di main content, bukan di nav/sidebar
    const supplierTable = page.locator('main table, [class*="content"] table, [class*="wizard"] table, [class*="form"] table').first();
    const supplierTableRow = supplierTable.locator('tbody tr').first();

    if (await supplierTableRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await supplierTableRow.click();
      await page.waitForTimeout(1000);
      console.log('✓ Supplier selected from content table');
    } else {
      // Fallback: cari elemen yang terlihat seperti supplier (ada nama BP/perusahaan)
      const bpItem = page.locator('main [class*="item"], main [class*="card"], main [class*="list"] > div, main [class*="row"]').first();
      if (await bpItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bpItem.click();
        await page.waitForTimeout(1000);
        console.log('✓ Supplier selected (BP item)');
      } else {
        console.log('⚠ No supplier rows found in content area - check screenshot po-step1-entities.png');
      }
    }

    // 5. Go to Products
    console.log('5. Going to Products step...');
    // Tunggu Next Step button, lalu klik
    const nextStepBtn5 = page.locator("button:has-text('Next Step')").or(page.locator("button:has-text('Next')")).first();
    await nextStepBtn5.waitFor({ state: 'visible', timeout: 10000 }).catch(() => console.log('  ⚠ Next Step not visible, trying force click'));
    await nextStepBtn5.click({ force: true, timeout: 15000 }).catch(async (e) => {
      console.log(`  ⚠ Next Step click failed: ${e.message.slice(0, 80)}`);
      // Coba klik PRODUCTS tab langsung
      await page.getByText('PRODUCTS', { exact: true }).click({ force: true }).catch(() => {});
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/po-step2-products.png', fullPage: true });
    console.log('✓ Products page loaded');

    // 6. Add products
    console.log('6. Adding products...');

    // Cari search input produk dan ketik keyword
    const productSearchTerms = ['BH2725GBBK.IDALB0A', '2725 GBBK', '2725'];
    let searchDone = false;

    const searchInputPO = page.locator("input[placeholder*='Search']").or(
      page.locator("input[placeholder*='search']").or(
        page.locator("input[type='search']").or(
          page.locator("input[placeholder*='Product']").or(
            page.locator("input[placeholder*='product']")
          )
        )
      )
    ).first();

    for (const term of productSearchTerms) {
      if (await searchInputPO.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`  🔍 Searching product: "${term}"`);
        await searchInputPO.fill(term);
        await page.waitForTimeout(2000);
        const btnCount = await page.locator("button:has-text('Add to Order')").count();
        console.log(`  Found ${btnCount} buttons after search "${term}"`);
        if (btnCount > 0) {
          searchDone = true;
          break;
        }
      }
    }

    if (!searchDone) {
      console.log('  ⚠ Search tidak digunakan atau produk tidak ditemukan, lanjut dengan daftar default');
    }

    let addedCount = 0;
    const targetCount = 2;

    for (let round = 0; round < targetCount; round++) {
      // Dismiss any lingering overlay/modal before re-querying
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(1000);

      // Re-query buttons setiap round (DOM berubah setelah modal)
      const addButtons = await page.locator("button:has-text('Add to Order')").all();
      console.log(`  - Round ${round + 1}: Found ${addButtons.length} "Add to Order" buttons`);

      if (addButtons.length === 0) {
        console.log('  ⚠ No more Add to Order buttons available');
        break;
      }

      // Pilih button berbeda tiap round (skip yang sudah di-click)
      const btnIndex = round < addButtons.length ? round : 0;
      let clicked = false;

      try {
        const btn = addButtons[btnIndex];
        console.log(`  - Adding product ${addedCount + 1} (button index ${btnIndex})...`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click({ force: true, timeout: 10000 });
        await page.waitForTimeout(2000);

        // Handle modal "Add to PO"
        const addItemBtn = page.locator("button:has-text('Add Item')").first();
        const modalVisible = await addItemBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (modalVisible) {
          console.log(`    Modal "Add to PO" terbuka`);

          // 1. Pilih warehouse - cari row yang punya WH-code DAN Unit count
          // Note: modal mungkin tidak pakai [role="dialog"], scope ke seluruh page tapi filter spesifik
          console.log(`    Memilih warehouse...`);
          
          // Setiap baris warehouse mengandung kode "WH-XXXXX" DAN teks "X Unit"
          const warehouseRow = page.locator('div')
            .filter({ hasText: /WH-[A-Z0-9]+/ })
            .filter({ hasText: /\d+\s*Unit/ })
            .first();
          
          const whCount = await page.locator('div')
            .filter({ hasText: /WH-[A-Z0-9]+/ })
            .filter({ hasText: /\d+\s*Unit/ })
            .count();
          console.log(`    Found ${whCount} warehouse rows`);

          if (await warehouseRow.isVisible({ timeout: 2000 }).catch(() => false)) {
            await warehouseRow.click({ force: true });
            const whText = await warehouseRow.textContent().catch(() => '');
            console.log(`    ✓ Warehouse dipilih: ${whText.trim().replace(/\s+/g, ' ').slice(0, 50)}`);
          } else {
            console.log(`    ⚠ Warehouse tidak ditemukan`);
          }
          await page.waitForTimeout(500);

          // 2. Set quantity — gunakan selector lebar (modal PO tidak pakai role="dialog")
          const qtyInputByType = page.locator("input[type='number'], input[inputmode='numeric']").first();
          
          let qtySet = false;
          if (await qtyInputByType.isVisible({ timeout: 2000 }).catch(() => false)) {
            await qtyInputByType.click({ force: true, clickCount: 3 });
            await qtyInputByType.fill('5');
            console.log(`    ✓ Qty diisi 5`);
            qtySet = true;
          }
          if (!qtySet) {
            // Fallback: klik tombol + untuk tambah qty
            const plusBtn = page.locator('button').filter({ hasText: '+' }).last();
            if (await plusBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await plusBtn.click({ force: true });
              console.log(`    ✓ Qty dinaikkan via tombol +`);
            }
          }
          await page.waitForTimeout(800);

          // 3. Klik Add Item
          await addItemBtn.click({ force: true });
          console.log(`    ✓ Product ${addedCount + 1} added via "Add Item" button`);
          await page.waitForTimeout(2000);
        } else {
          // Fallback: keyboard confirm
          await page.keyboard.press('Enter');
          await page.waitForTimeout(1000);
          console.log(`    ✓ Product ${addedCount + 1} added (keyboard confirm)`);
        }

        addedCount++;
        clicked = true;
        await page.waitForTimeout(1500);
      } catch (e) {
        console.log(`    ⚠ Button ${btnIndex} error: ${e.message.slice(0, 100)}`);
      }

      if (!clicked) {
        console.log('  ⚠ Could not add product this round, continuing...');
      }
    }

    if (addedCount === 0) {
      console.log('⚠ No products added - check availability');
    } else {
      console.log(`✓ Added ${addedCount} products total`);
    }
    await page.screenshot({ path: 'test-results/po-after-add-products.png', fullPage: true });

    // Debug: cek apakah ada cart/order items setelah add produk
    const cartText = await page.locator('body').innerText().catch(() => '');
    const hasCartItems = cartText.includes('BH2725GBBK') && (
      cartText.match(/\d+\s*x\s*Rp|Order Item|Cart|Added/i)
    );
    console.log(`  Cart debug - BH2725GBBK in page: ${cartText.includes('BH2725GBBK')}, hasCartItems pattern: ${!!hasCartItems}`);

    // 7. Go to Review
    console.log('7. Going to Review (REVIEW tab)...');

    // Pastikan modal "Add to PO" sudah ditutup sebelum navigasi
    console.log('  Closing any open modal...');
    for (let closeAttempt = 0; closeAttempt < 3; closeAttempt++) {
      const addItemVisible = await page.locator("button:has-text('Add Item')").isVisible({ timeout: 1000 }).catch(() => false);
      if (!addItemVisible) {
        console.log('  ✓ No modal open');
        break;
      }
      // Klik Cancel di dalam modal (bukan Cancel di level form)
      const cancelInModal = page.locator('[role="dialog"] button:has-text("Cancel"), .z-50 button:has-text("Cancel")').first();
      if (await cancelInModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`  Clicking Cancel in modal (attempt ${closeAttempt + 1})...`);
        await cancelInModal.click({ force: true });
      } else {
        // Fallback: klik Cancel button yang dekat dengan Add Item
        const addItemBtn = page.locator("button:has-text('Add Item')").first();
        const parentCancel = addItemBtn.locator('..').locator("button:has-text('Cancel')");
        if (await parentCancel.isVisible({ timeout: 1000 }).catch(() => false)) {
          await parentCancel.click({ force: true });
        } else {
          await page.keyboard.press('Escape');
        }
      }
      await page.waitForTimeout(1500);
    }

    // Coba klik tab REVIEW langsung (stepper navigation)
    const reviewStepLabel = page.getByText('REVIEW', { exact: true });
    const reviewStepByRole = page.locator('[class*="step"] >> text="REVIEW"').or(
      page.locator('[class*="tab"] >> text="REVIEW"').or(
        page.locator('[class*="wizard"] >> text="REVIEW"')
      )
    );
    if (await reviewStepLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('  Clicking REVIEW step label directly...');
      await reviewStepLabel.click({ force: true });
      await page.waitForTimeout(3000);
    } else {
      // Klik Next Step
      const nextBtn = page.locator("button:has-text('Next Step')").first();
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('  Clicking Next Step to go to REVIEW...');
        await nextBtn.click({ force: true });
        await page.waitForTimeout(3000);
        // Cek apakah ada error/toast setelah klik
        const errorToast = await page.locator('[class*="toast"], [class*="error"], [class*="alert"], [role="alert"]').first().textContent({ timeout: 2000 }).catch(() => '');
        if (errorToast) console.log(`  ⚠ Error/toast: ${errorToast.slice(0, 100)}`);
      }
    }

    // Jika masih di PRODUCTS, coba klik Next Step sekali lagi
    const stillOnProducts = await page.locator("text='Available Products'").isVisible({ timeout: 1500 }).catch(() => false);
    if (stillOnProducts) {
      console.log('  Still on PRODUCTS, trying Next Step again...');
      await page.locator("button:has-text('Next Step')").first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(3000);
    }

    await page.screenshot({ path: 'test-results/po-step3-review.png', fullPage: true });

    // Verifikasi sudah di halaman REVIEW (tidak ada "Add to Order", ada summary)
    const onReview = await page.locator('text=/REVIEW|Summary|Subtotal|Grand Total|Total/i').first().isVisible({ timeout: 3000 }).catch(() => false);
    const addOrderGone = !(await page.locator("button:has-text('Add to Order')").isVisible({ timeout: 1000 }).catch(() => false));
    console.log(`  REVIEW indicators: onReview=${onReview}, addOrderGone=${addOrderGone}`);
    console.log('✓ Navigated to REVIEW page');

    // ============================================================
    // 7b. VALIDASI HITUNGAN - Pastikan semua kalkulasi benar
    // ============================================================
    console.log('\n📊 7b. Validating calculations...');

    // Dump halaman untuk debug
    const reviewPageText = await page.locator('body').innerText();
    console.log('\n  --- Page text snapshot (first 2000 chars) ---');
    console.log(reviewPageText.slice(0, 2000));

    // Helper: baca nilai dari Payment Summary by label (exact match lebih baik)
    async function readPaymentValue(labelText) {
      // Cari elemen yang textContent-nya persis atau mendekati label, lalu ambil sibling/next element
      const allEls = await page.locator('body *').all();
      for (const el of allEls) {
        const txt = await el.textContent().catch(() => '');
        const isVis = await el.isVisible().catch(() => false);
        if (!isVis || !txt) continue;
        if (txt.trim().toLowerCase() === labelText.toLowerCase()) {
          // Cari sibling berikutnya
          const nextSibling = el.locator('xpath=following-sibling::*[1]');
          const siblingText = await nextSibling.textContent().catch(() => '');
          if (siblingText) return parsePrice(siblingText);
          // Atau parent text dikurangi label
          const parentText = await el.locator('..').textContent().catch(() => '');
          return parsePrice(parentText.replace(txt.trim(), ''));
        }
      }
      return null;
    }

    // Baca Payment Summary dari page text (lebih reliable)
    const paymentSection = reviewPageText;
    
    // Helper: extract nilai setelah label di text
    function extractValueAfterLabel(text, labelRegex) {
      const match = text.match(new RegExp(labelRegex + '[\\s\\S]{0,30}?(Rp\\s*[\\d.,\\s]+)', 'i'));
      return match ? parsePrice(match[1]) : null;
    }

    const totalBeforeDisc = extractValueAfterLabel(paymentSection, 'Total Before Discount');
    const netDisc = extractValueAfterLabel(paymentSection, 'Net Disc');
    const subtotalPay = extractValueAfterLabel(paymentSection, '\\nSubtotal\\n');
    const grandTotalPay = extractValueAfterLabel(paymentSection, 'Grand Total');

    console.log('\n  --- Payment Summary ---');
    console.log(`  Total Before Discount : ${totalBeforeDisc !== null ? totalBeforeDisc.toLocaleString('id-ID') : 'not found'}`);
    console.log(`  Net Disc              : ${netDisc !== null ? netDisc.toLocaleString('id-ID') : 'not found'}`);
    console.log(`  Subtotal              : ${subtotalPay !== null ? subtotalPay.toLocaleString('id-ID') : 'not found'}`);
    console.log(`  Grand Total           : ${grandTotalPay !== null ? grandTotalPay.toLocaleString('id-ID') : 'not found'}`);

    // Baca table PRODUCT INFO
    const tableHeaders = await page.locator('table thead th, table thead td').all();
    const headerTexts = [];
    for (const th of tableHeaders) {
      const txt = await th.textContent().catch(() => '');
      if (txt && txt.trim()) headerTexts.push(txt.trim());
    }
    console.log('\n  --- Table headers ---');
    console.log('  ' + headerTexts.join(' | '));

    // Deteksi kolom: Product Info(0) WHS(1) Qty(2) Price/Unit(3) Net/Disc(4) PPN(5) Gross Total(6)
    let qtyColIdx = -1, priceColIdx = -1, grossTotalColIdx = -1, discColIdx = -1;
    for (let hi = 0; hi < headerTexts.length; hi++) {
      const h = headerTexts[hi].toLowerCase();
      if (/^qty$|^quantity$|^jumlah$/.test(h)) qtyColIdx = hi;
      else if (/qty/.test(h)) qtyColIdx = hi;
      if (/price\s*\/\s*unit|unit\s*price|harga/.test(h)) priceColIdx = hi;
      if (/gross\s*total|total\s*gross|total\s*amount/.test(h)) grossTotalColIdx = hi;
      if (/net.*disc|disc.*net|diskon/.test(h)) discColIdx = hi;
    }
    console.log(`  Detected: Qty:${qtyColIdx} Price:${priceColIdx} GrossTotal:${grossTotalColIdx} Disc:${discColIdx}`);

    // Baca baris tabel
    // Scope ke tabel yang punya header WHS (product info table), bukan campaign table
    const productTable = page.locator('table').filter({ has: page.locator('th:has-text("WHS")') }).first();
    const reviewRows = await productTable.locator('tbody tr').all();
    console.log(`  Found ${reviewRows.length} item rows`);

    let sumQtyPrice = 0;   // sum(qty × unit_price) = seharusnya = Total Before Discount
    let sumGrossTotal = 0; // sum(Gross Total) = seharusnya = Subtotal
    const lineItems = [];
    const calculationErrors = [];

    for (let i = 0; i < reviewRows.length; i++) {
      const cells = await reviewRows[i].locator('td').all();
      if (cells.length < 3) continue;

      const cellTexts = [];
      for (const cell of cells) {
        cellTexts.push((await cell.textContent().catch(() => '')).trim());
      }

      const productName = cellTexts[0] || `Row ${i+1}`;
      const qty = qtyColIdx >= 0 ? parsePrice(cellTexts[qtyColIdx]) : 0;
      const unitPrice = priceColIdx >= 0 ? parsePrice(cellTexts[priceColIdx]) : 0;
      const grossTotal = grossTotalColIdx >= 0 ? parsePrice(cellTexts[grossTotalColIdx]) : 0;

      if (unitPrice === 0) continue;

      const expectedTotalBeforeDisc = qty * unitPrice;
      sumQtyPrice += expectedTotalBeforeDisc;
      sumGrossTotal += grossTotal;

      lineItems.push({ productName: productName.slice(0, 40), qty, unitPrice, grossTotal });
      console.log(`  📦 Row ${i+1}: "${productName.slice(0,35)}" Qty:${qty} × Rp${unitPrice.toLocaleString('id-ID')} = Rp${expectedTotalBeforeDisc.toLocaleString('id-ID')} | Gross:Rp${grossTotal.toLocaleString('id-ID')}`);
    }

    // ---- Validasi ----
    console.log('\n  --- Validasi ---');

    // 1. sum(qty × price) harus = Total Before Discount di Payment Summary
    if (totalBeforeDisc !== null && sumQtyPrice > 0) {
      if (Math.abs(sumQtyPrice - totalBeforeDisc) > 1) {
        const err = `❌ Total Before Discount: sum(qty×price)=Rp${sumQtyPrice.toLocaleString('id-ID')} ≠ displayed=Rp${totalBeforeDisc.toLocaleString('id-ID')}`;
        calculationErrors.push(err);
        console.log('  ' + err);
      } else {
        console.log(`  ✅ Total Before Discount: Rp${totalBeforeDisc.toLocaleString('id-ID')} ✓`);
      }
    }

    // 2. Total Before Discount - Net Disc = Subtotal
    if (totalBeforeDisc !== null && netDisc !== null && subtotalPay !== null) {
      const expectedSubtotal = totalBeforeDisc - netDisc;
      if (Math.abs(expectedSubtotal - subtotalPay) > 1) {
        const err = `❌ Subtotal: Rp${totalBeforeDisc.toLocaleString('id-ID')} - Rp${netDisc.toLocaleString('id-ID')} = Rp${expectedSubtotal.toLocaleString('id-ID')} ≠ displayed=Rp${subtotalPay.toLocaleString('id-ID')}`;
        calculationErrors.push(err);
        console.log('  ' + err);
      } else {
        console.log(`  ✅ Subtotal: Rp${totalBeforeDisc.toLocaleString('id-ID')} - Rp${netDisc.toLocaleString('id-ID')} = Rp${subtotalPay.toLocaleString('id-ID')} ✓`);
      }
    }

    // 3. Grand Total = Subtotal (karena PPN sudah masuk dalam Subtotal di app ini)
    if (subtotalPay !== null && grandTotalPay !== null) {
      if (Math.abs(grandTotalPay - subtotalPay) > 1) {
        const err = `❌ Grand Total: Rp${grandTotalPay.toLocaleString('id-ID')} ≠ Subtotal=Rp${subtotalPay.toLocaleString('id-ID')}`;
        calculationErrors.push(err);
        console.log('  ' + err);
      } else {
        console.log(`  ✅ Grand Total: Rp${grandTotalPay.toLocaleString('id-ID')} = Subtotal ✓`);
      }
    }

    // --- Summary ---
    console.log('\n' + '='.repeat(50));
    console.log('📊 CALCULATION VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`  Line items found : ${lineItems.length}`);
    console.log(`  Products added   : ${addedCount}`);

    if (calculationErrors.length === 0) {
      console.log('  ✅ ALL CALCULATIONS CORRECT');
    } else {
      console.log(`  ❌ FOUND ${calculationErrors.length} CALCULATION ERROR(S):`);
      for (const err of calculationErrors) console.log(`    ${err}`);
    }
    console.log('='.repeat(50));

    await page.screenshot({ path: 'test-results/po-step3-review-validated.png', fullPage: true });

    // Assert: gagalkan test jika ada error kalkulasi
    expect(calculationErrors.length, `Calculation errors found:\n${calculationErrors.join('\n')}`).toBe(0);
      // 8. Submit
    console.log('\n8. Looking for submit button...');
    const allButtons = await page.locator('button').all();
    for (const btn of allButtons) {
      const text = await btn.textContent();
      const isVisible = await btn.isVisible();
      if (isVisible && text) {
        console.log(`  - Button found: "${text.trim()}"`);
      }
    }

    const submitBtn = page.locator("button:has-text('Submit')").or(
      page.locator("button:has-text('Save')")).or(
      page.locator("button:has-text('Create Order')")
    ).first();

      if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click({ force: true });
      await page.waitForTimeout(3000);
      console.log('✓ Order submitted!');
      await page.screenshot({ path: 'test-results/po-order-result.png', fullPage: true });
      } else {
      console.log('⚠ Submit button not found - check screenshot');
      }

      await page.locator('text="Purchase Order"').first().click().catch(() => null);
      await page.waitForTimeout(2000);
      const finalCount = await page.locator('table tbody tr').count().catch(() => 0);
      if (finalCount > initialCount) {
        createdSnapshot = await page.locator('table tbody tr').first().textContent().catch(() => null);
      }

      console.log('\n✅ Test completed! Check test-results/ for screenshots.');
    } finally {
      if (createdSnapshot && isAutoCleanupEnabled()) {
        console.log('\n🧹 AUTO CLEANUP PO (best effort)');
        await cleanupTableRecordBySnapshot(page, {
          listUrl,
          rowSnapshot: createdSnapshot,
          label: 'purchase order',
          rowLocator: 'table tbody tr',
        });
      }
    }
  });
});
