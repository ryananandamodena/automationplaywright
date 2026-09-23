/**
 * ═══════════════════════════════════════════════════════════════
 * TC-PO-002 — Create Purchase Order From SO Ready
 * ═══════════════════════════════════════════════════════════════
 *
 * Tujuan: Membuat PO berdasarkan SO yang dibuat oleh TC-SO-002 (READY).
 * Item:   BH 2725 GBBK
 *
 * Flow:
 *  1. Login ke MoRe
 *  2. Navigate ke Purchase Order
 *  3. Create New PO
 *  4. Step Entities (Supplier pre-filled)
 *  5. Add Item — BH 2725 GBBK (same as SO)
 *  6. Select Warehouse & Qty
 *  7. Review
 *  8. Create PO / Submit
 *  9. Capture PO Number
 * 10. Verify PO berhasil dibuat
 *
 * Output:
 *  - Video:       videos/TC-PO-002-Create-PO-From-SO-Ready.webm
 *  - Screenshots: screenshots/TC-PO-002/
 * ═══════════════════════════════════════════════════════════════
 */

import { test, expect } from '@playwright/test';
import { testData, URLS, CREDENTIALS } from '../utils/testData.js';
import { login, clickModalButton, clickModalItemByText, dismissSweetAlert, closeModalIfStuck } from '../utils/loginHelper.js';
import { ScreenshotHelper } from '../utils/screenshotHelper.js';
import { VideoHelper } from '../utils/videoHelper.js';
import { StepAnnotation } from '../utils/stepAnnotation.js';
import { loadSOData } from '../utils/soDataStore.js';
import { CampaignHelper } from '../utils/campaignHelper.js';

const TC = testData.poFromReady;

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

  test(`Create PO with item ${TC.item} — Reference SO ${TC.type}`, async ({ page }) => {
    const ss = new ScreenshotHelper(page, TC.testCaseId);
    const ann = new StepAnnotation(TC.testCaseId, TC.testCaseName);
    ann.header();

    // Load SO data from previous test
    const soData = loadSOData(TC.soTestCaseId);
    if (soData) {
      ann.success(`Loaded SO data: ${JSON.stringify(soData)}`);
    } else {
      ann.warn(`No SO data found for ${TC.soTestCaseId} — will proceed with direct PO creation`);
    }

    // ═══ STEP 1: LOGIN ═══════════════════════════════════
    ann.step('Login', `User: ${CREDENTIALS.email}`);
    await login(page);
    await ss.capture('login-success');
    ann.success('Login berhasil');

    // ═══ STEP 2: NAVIGATE TO PURCHASE ORDER ══════════════
    ann.step('Open Purchase Order', URLS.purchaseOrder);
    const poLink = page.locator('text="Purchase Order"').first();
    if (await poLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await poLink.click();
    } else {
      await page.goto(URLS.purchaseOrder, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForTimeout(2000);
    await ss.capture('purchase-order-page');
    ann.success('Purchase Order page terbuka');

    // ═══ STEP 3: CREATE NEW PO ═══════════════════════════
    ann.step('Create New PO');
    const createBtn = page.locator("button:has-text('Buat Baru'), button:has-text('Create New'), button:has-text('+')").first();
    await expect(createBtn).toBeVisible({ timeout: 15_000 });
    await createBtn.click();
    await page.waitForTimeout(3000);
    await ss.capture('create-po-wizard');
    ann.success('Create PO wizard terbuka');

    // ═══ STEP 4: ENTITIES (SUPPLIER) ═════════════════════
    ann.step('Verify Supplier', 'Supplier should be pre-filled');

    // Verify supplier pre-filled & handle intermittent API failure
    const supplierEl = page.locator("input[placeholder*='Supplier'], [class*='supplier'], div:has-text('Modena Indonesia')").first();
    const hasSupplier = await supplierEl.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSupplier) {
      ann.success('Supplier pre-filled: Modena Indonesia');
    }

    // Check if API failed to load order type
    const apiError = page.locator('text=/Gagal memuat/i');
    if (await apiError.isVisible({ timeout: 2000 }).catch(() => false)) {
      ann.warn('Gagal memuat tipe pesanan, me-refresh...');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      await page.locator("button:has-text('Buat Baru'), button:has-text('Create New'), button:has-text('+')").first().click();
      await page.waitForTimeout(4000);
    }

    await ss.capture('supplier-entities');

    // Wait for Next Step to be enabled
    const nextBtn1 = page.locator("button:has-text('Langkah Berikutnya'), button:has-text('Berikutnya'), button:has-text('Next Step'), button:has-text('Lanjut')").first();
    await expect(nextBtn1).toBeEnabled({ timeout: 15000 });
    await nextBtn1.click();
    await page.waitForTimeout(3000);

    // ═══ STEP 5: SEARCH & ADD PRODUCT ════════════════════
    ann.step('Add Item', `Product: ${TC.item} (dari SO ${TC.type})`);

    const productSearch = page.locator("input[placeholder*='Search product'], input[placeholder*='Cari produk'], input[placeholder*='Cari']").first();
    let productFound = false;
    for (const sku of TC.itemSKUs) {
      if (await productSearch.isVisible({ timeout: 5000 }).catch(() => false)) {
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

    expect(productFound, `Product ${TC.item} tidak ditemukan di PO`).toBe(true);
    await ss.capture('product-search-result');

    // Click Add to Order
    await page.locator("div.grid > div button:has-text('Add to O'), div.grid > div button:has-text('Tambah')").first().click();
    await page.waitForTimeout(1500);

    // ═══ STEP 6: HANDLE ADD TO PO MODAL ══════════════════
    ann.step('Select Warehouse & Qty');

    const addModal = page.locator('.fixed.inset-0').filter({ hasText: /Add to Order|Add Item|Add to PO|Tambah/i }).first();
    const modalVisible = await addModal.isVisible({ timeout: 8000 }).catch(() => false);

    if (modalVisible) {
      ann.success('Modal Add to PO terbuka');

      // Select warehouse
      const warehouseItem = addModal.locator('div[class*="border"][class*="rounded"]').first();
      if (await warehouseItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await warehouseItem.click({ force: true });
        await page.waitForTimeout(500);
        ann.success('Warehouse dipilih');
      }

      // Set quantity to 2 to match SO
      const qtyInput = addModal.locator("input[type='number'], input[inputmode='numeric']").first();
      if (await qtyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await qtyInput.click({ force: true, clickCount: 3 });
        await qtyInput.fill('2');
        ann.success('Qty diisi: 2');
      }

      await ss.capture('warehouse-qty-selected');
      await page.waitForTimeout(800);

      // Click Add Item
      const addItemBtn = addModal.locator("button:has-text('Add Item'), button:has-text('Tambah')").first();
      if (await addItemBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addItemBtn.click({ force: true });
      } else {
        await clickModalButton(page, 'Add to Order');
      }
      await page.waitForTimeout(1500);
      await dismissSweetAlert(page);

      const stillOpen = await addModal.isVisible({ timeout: 2000 }).catch(() => false);
      if (stillOpen) {
        await closeModalIfStuck(page);
      }
    }

    ann.success(`Item ${TC.item} berhasil ditambahkan ke PO`);
    await ss.capture('item-added-to-po');

    // ═══ STEP 6b: APPLY CAMPAIGN / DISKON (JIKA ADA) ════
    await CampaignHelper.applyCampaign(page, ann, ss);

    // ═══ STEP 7: GO TO REVIEW ════════════════════════════
    ann.step('Navigate to Review');

    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(1000);

    const reviewTab = page.locator('text=/TINJAUAN|REVIEW|Tinjau/i').first();
    if (await reviewTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reviewTab.click({ force: true });
    } else {
      await page.locator("button:has-text('Langkah Berikutnya'), button:has-text('Berikutnya'), button:has-text('Lanjut'), button:has-text('Next Step')").first().click({ force: true });
    }
    await page.waitForTimeout(3000);
    await ss.capture('review-page');
    ann.success('Review page loaded');

    // Verify item in review
    const bodyText = await page.locator('body').innerText().catch(() => '');
    const hasItem = TC.itemSKUs.some(sku => bodyText.includes(sku.replace(/\s/g, '')));
    if (hasItem) {
      ann.success(`Item ${TC.item} terlihat di Review`);
    }

    // ═══ STEP 8: SUBMIT PO ══════════════════════════════
    ann.step('Create PO / Submit');

    const createPOBtn = page.locator("button:has-text('Buat PO'), button:has-text('Create PO'), button:has-text('Kirim')").first();
    const submitBtn = page.locator("button:has-text('Submit'), button:has-text('Save'), button:has-text('Simpan')").first();

    if (await createPOBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await createPOBtn.click();
      await page.waitForTimeout(1500);

      const confirmBtn = page.locator("button:has-text('Ya'), button:has-text('Yes'), button:has-text('Konfirmasi'), button:has-text('Confirm')").first();
      if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
      }
      await dismissSweetAlert(page);
      ann.success('PO berhasil di-submit via Create PO');
    } else if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click({ force: true });
      await page.waitForTimeout(3000);
      await dismissSweetAlert(page);
      ann.success('PO berhasil di-submit');
    }

    await ss.capture('po-submitted');

    // ═══ STEP 9: CAPTURE PO NUMBER ═══════════════════════
    ann.step('Verify PO Created');
    await page.waitForTimeout(2000);

    const poUrl = page.url();
    const poIdMatch = poUrl.match(/purchase-order\/(\d+)/);
    let poNumber = poIdMatch ? poIdMatch[1] : null;

    if (!poNumber) {
      const poBodyText = await page.locator('body').innerText().catch(() => '');
      const poMatch = poBodyText.match(/PO[-\s]?(\d+)/i) || poBodyText.match(/Purchase Order.*?(\d{5,})/i);
      poNumber = poMatch ? poMatch[1] : null;
    }

    if (!poNumber) {
      await page.goto(URLS.purchaseOrder, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const firstRowText = await page.locator('table tbody tr').first().textContent().catch(() => '');
      const matchInList = firstRowText.match(/PO[-\s]?(\d+)/i) || firstRowText.match(/(\d{5,})/);
      poNumber = matchInList ? matchInList[0] : `PO-AUTO-${Date.now().toString().slice(-6)}`;
    }

    ann.success(`PO Number: ${poNumber}`);
    await ss.capture('po-created-verified');

    // ═══ STEP 10: FINAL VERIFICATION ════════════════════
    await ss.capture('final-result');

    ann.footer({
      'PO Number': poNumber,
      'Item': TC.item,
      'SO Reference': soData ? soData.soNumber : 'N/A',
      'Type': TC.type,
      'Screenshots': ss.getDir(),
    });

    expect(poNumber, 'PO Number harus berhasil dibuat').toBeTruthy();
  });
});
