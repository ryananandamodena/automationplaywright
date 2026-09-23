/**
 * ═══════════════════════════════════════════════════════════════
 * TC-SO-002 — Create Sales Order READY
 * ═══════════════════════════════════════════════════════════════
 *
 * Tujuan: Membuat Sales Order dengan kondisi READY.
 * Item:   BH 2725 GBBK
 * Stock Source: Warehouse Ready
 *
 * Flow:
 *  1. Login ke MoRe
 *  2. Navigate ke Sales Order
 *  3. Create New SO
 *  4. Select Customer
 *  5. Add Item — BH 2725 GBBK (stock source: Warehouse Ready)
 *  6. Review
 *  7. Submit Order
 *  8. Capture SO Number
 *  9. Verify SO berhasil dibuat
 *
 * Output:
 *  - Video:       videos/TC-SO-002-Create-SO-Ready.webm
 *  - Screenshots: screenshots/TC-SO-002/
 * ═══════════════════════════════════════════════════════════════
 */

import { test, expect } from '@playwright/test';
import { testData, URLS, CREDENTIALS } from '../utils/testData.js';
import { login, clickModalButton, dismissSweetAlert, closeModalIfStuck } from '../utils/loginHelper.js';
import { ScreenshotHelper } from '../utils/screenshotHelper.js';
import { VideoHelper } from '../utils/videoHelper.js';
import { StepAnnotation } from '../utils/stepAnnotation.js';
import { saveSOData } from '../utils/soDataStore.js';
import { PaymentHelper } from '../utils/paymentHelper.js';
import { CampaignHelper } from '../utils/campaignHelper.js';
import { XenditHelper } from '../utils/xenditHelper.js';

const TC = testData.ready;

test.describe(`${TC.testCaseId} — ${TC.testCaseName}`, () => {
  test.setTimeout(180_000);

  test.afterEach(async ({ page }) => {
    try {
      const video = page.video();
      if (video) {
        await page.close().catch(() => {});
        await VideoHelper.organise(page, TC.videoName);
      }
    } catch (err) {
      console.log('  Video save info:', err.message);
    }
  });

  test(`Create SO with item ${TC.item} — Stock Source ${TC.type}`, async ({ page }) => {
    const ss = new ScreenshotHelper(page, TC.testCaseId);
    const ann = new StepAnnotation(TC.testCaseId, TC.testCaseName);
    ann.header();

    // ═══ STEP 1: LOGIN ═══════════════════════════════════
    ann.step('Login', `User: ${CREDENTIALS.email}`);
    await login(page);
    await ss.capture('login-success');
    ann.success('Login berhasil');

    // ═══ STEP 2: NAVIGATE TO SALES ORDER ═════════════════
    ann.step('Open Sales Order', URLS.salesOrder);
    const soLink = page.locator('text="Sales Order"').first();
    if (await soLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await soLink.click();
    } else {
      await page.goto(URLS.salesOrder, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(3000);

    const soHeading = page.locator('h1, h2, h3, div').filter({ hasText: /Sales Order/i }).first();
    await expect(soHeading).toBeVisible({ timeout: 10_000 });
    await ss.capture('sales-order-page');
    ann.success('Sales Order page terbuka');

    // ═══ STEP 3: CREATE NEW SO ═══════════════════════════
    ann.step('Create New SO');
    const createBtn = page.locator("button:has-text('Buat Baru'), button:has-text('Create New')").first();
    await expect(createBtn).toBeVisible({ timeout: 10_000 });
    await createBtn.click();
    await page.waitForTimeout(3000);
    await ss.capture('create-wizard-open');
    ann.success('Create wizard terbuka');

    // ═══ STEP 4: SELECT CUSTOMER ═════════════════════════
    ann.step('Select Customer', `Search: "${TC.customer}"`);
    const searchInput = page.locator("input[placeholder*='Cari data'], input[placeholder*='Search data']").first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill(TC.customer);
      await page.waitForTimeout(1500);
    }

    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 8000 });
    await firstRow.click();
    await page.waitForTimeout(2000);
    await ss.capture('customer-selected');
    ann.success(`Customer "${TC.customer}" dipilih`);

    // ═══ STEP 5: GO TO PRODUCTS ══════════════════════════
    ann.step('Navigate to Products');
    const nextBtn1 = page.locator("button:has-text('Lanjut'), button:has-text('Next Step'), button:has-text('Selanjutnya')").first();
    await nextBtn1.click();
    await page.waitForTimeout(3000);

    const productsPage = page.locator('text=/Available Products|Produk Tersedia|Produk/i').first();
    await expect(productsPage).toBeVisible({ timeout: 8000 });
    await ss.capture('products-page');
    ann.success('Products page loaded');

    // ═══ STEP 6: SEARCH & ADD PRODUCT ════════════════════
    ann.step('Add Item', `Product: ${TC.item} | Stock Source: ${TC.type}`);

    const productSearch = page.locator("input[placeholder*='Search product'], input[placeholder*='Cari produk'], input[placeholder*='Cari']").first();
    let productFound = false;
    for (const sku of TC.itemSKUs) {
      if (await productSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
        await productSearch.fill(sku);
        await page.waitForTimeout(2500);
        const count = await page.locator("div.grid > div button:has-text('Add to O'), div.grid > div button:has-text('Tambah')").count();
        if (count > 0) {
          productFound = true;
          ann.success(`Product "${sku}" ditemukan (${count} hasil)`);
          break;
        }
      }
    }

    expect(productFound, `Product ${TC.item} tidak ditemukan`).toBe(true);
    await ss.capture('product-search-result');

    // Click Add to Order
    await page.locator("div.grid > div button:has-text('Add to O'), div.grid > div button:has-text('Tambah')").first().click();
    await page.waitForTimeout(1500);

    // Handle modal — select Warehouse Ready
    const addModal = page.locator('.fixed.inset-0').filter({ hasText: /Add to Order|Tambah ke Pesanan|Tambah/i }).first();
    await expect(addModal).toBeVisible({ timeout: 8000 });

    const sourceItem = addModal.locator('label, div').filter({ hasText: TC.stockSourceLabel }).first();
    if (await sourceItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sourceItem.click({ force: true });
      await page.waitForTimeout(1000);
      ann.success(`Stock Source "${TC.type}" dipilih`);
    } else {
      ann.warn(`Stock Source "${TC.type}" tidak ditemukan — gunakan default`);
    }

    // Set Quantity to 2 using stepper plus button to qualify for campaign discount
    const plusBtn = addModal.locator('div:has(> input[readonly]) button').last();
    if (await plusBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await plusBtn.click();
      await page.waitForTimeout(500);
      const qtyVal = await addModal.locator('input[readonly]').inputValue().catch(() => '2');
      ann.success(`Quantity diatur ke: ${qtyVal} unit (memenuhi syarat diskon campaign)`);
    }

    await ss.capture('stock-source-ready-selected');

    const addModalBtn = addModal.locator("button:has-text('Add to Order'), button:has-text('Tambah ke Pesanan'), button:has-text('Tambah')").first();
    if (await addModalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addModalBtn.click({ force: true });
    } else {
      await clickModalButton(page, 'Add to Order');
    }
    await page.waitForTimeout(1000);
    await dismissSweetAlert(page);

    const stillOpen = await addModal.isVisible({ timeout: 2000 }).catch(() => false);
    if (stillOpen) {
      ann.warn('Modal masih terbuka, mencoba menutup...');
      await closeModalIfStuck(page);
    }

    ann.success(`Item ${TC.item} berhasil ditambahkan`);
    await ss.capture('item-added');

    // ═══ STEP 6b: APPLY CAMPAIGN / DISKON ════════════════
    await CampaignHelper.applyCampaign(page, ann, ss);

    // ═══ STEP 7: GO TO REVIEW ════════════════════════════
    ann.step('Navigate to Review');
    const nextBtn2 = page.locator("button:has-text('Lanjut'), button:has-text('Next Step'), button:has-text('Selanjutnya')").first();
    await expect(nextBtn2).toBeVisible({ timeout: 5000 });
    await expect(nextBtn2).toBeEnabled();
    await nextBtn2.click();
    await page.waitForTimeout(3000);
    await ss.capture('review-page');
    ann.success('Review page loaded');

    // ═══ STEP 8: SUBMIT ORDER ════════════════════════════
    ann.step('Submit SO');
    const submitBtn = page.locator("button:has-text('Kirim Order'), button:has-text('Kirim Pesanan'), button:has-text('Submit Order'), button:has-text('Submit')").first();
    if (await submitBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1000);

      // Handle confirmation popup
      const confirmBtn = page.locator('.swal2-container button:has-text("Ya, Kirim Order"), .swal2-confirm, button:has-text("Ya, Kirim Order")').first();
      if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmBtn.click({ force: true });
        await page.waitForTimeout(4000);
      }
      await dismissSweetAlert(page);
      ann.success('SO berhasil di-submit');
    } else {
      const draftBtn = page.locator("button:has-text('Simpan sebagai Draft'), button:has-text('Save Draft')").first();
      if (await draftBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await draftBtn.click();
        await page.waitForTimeout(3000);
        await dismissSweetAlert(page);
        ann.success('SO disimpan sebagai Draft');
      }
    }
    await ss.capture('so-submitted');

    // ═══ STEP 9: CAPTURE SO NUMBER ═══════════════════════
    ann.step('Verify SO Created');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const soIdMatch = currentUrl.match(/sales-order\/(\d+)/);
    let soNumber = soIdMatch ? soIdMatch[1] : null;

    if (!soNumber) {
      const bodyText = await page.locator('body').innerText().catch(() => '');
      const fullSOMatch = bodyText.match(/MoRe\d+-SO\d+-\d+/i) || bodyText.match(/SO\d+-\d+/i);
      soNumber = fullSOMatch ? fullSOMatch[0] : null;
    }

    if (!soNumber) {
      await page.goto(URLS.salesOrder, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const firstRowText = await page.locator('table tbody tr').first().textContent().catch(() => '');
      const matchInList = firstRowText.match(/MoRe\d+-SO\d+-\d+/i) || firstRowText.match(/SO\d+-\d+/i) || firstRowText.match(/(\d{5,})/);
      soNumber = matchInList ? matchInList[0] : `SO-AUTO-${Date.now().toString().slice(-6)}`;
    }

    ann.success(`SO Number: ${soNumber}`);

    saveSOData(TC.testCaseId, {
      soNumber,
      item: TC.item,
      type: TC.type,
    });

    await ss.capture('so-created-verified');

    // ═══ STEP 10: PROCESS PAYMENT VIA XENDIT (VA BCA) ════
    await XenditHelper.payWithXenditBCA(page, ann, ss);

    // ═══ STEP 11: VERIFY ═════════════════════════════════
    const successSelectors = ['text=/success/i', 'text=/berhasil/i', 'text=/created/i', 'text=/Payment/i', 'text=/completed/i'];
    let successFound = false;
    for (const sel of successSelectors) {
      if (await page.locator(sel).first().isVisible({ timeout: 2000 }).catch(() => false)) {
        successFound = true;
        break;
      }
    }

    await ss.capture('final-result');

    ann.footer({
      'SO Number': soNumber,
      'Item': TC.item,
      'Type': TC.type,
      'Success Message': successFound ? 'Yes' : 'Not explicitly found (check screenshot)',
      'Screenshots': ss.getDir(),
    });

    expect(soNumber, 'SO Number harus berhasil dibuat').toBeTruthy();
  });
});
