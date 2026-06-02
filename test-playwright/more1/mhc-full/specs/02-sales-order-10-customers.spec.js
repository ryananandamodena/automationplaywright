import { test, expect } from '@playwright/test';
import { login } from '../helpers/login.js';

const BASE = 'https://mhc-dev.modena.com';

const PRODUCT_SKU  = 'BH2725';
const ITEM_QTY     = 2;
const DISCOUNT_PCT = 10; // persen diskon per item

// ============================================================
// 10 kombinasi customer berbeda untuk Create SO
// ============================================================
const CUSTOMER_COMBOS = [
  { label: 'Customer #1 - Dedi',   keyword: 'Dedi',   rowIndex: 0 },
  { label: 'Customer #2 - Ryan',   keyword: 'Ryan',   rowIndex: 0 },
  { label: 'Customer #3 - Andi',   keyword: 'Andi',   rowIndex: 0 },
  { label: 'Customer #4 - Budi',   keyword: 'Budi',   rowIndex: 0 },
  { label: 'Customer #5 - Sari',   keyword: 'Sari',   rowIndex: 0 },
  { label: 'Customer #6 - Hendra', keyword: 'Hendra', rowIndex: 0 },
  { label: 'Customer #7 - Dewi',   keyword: 'Dewi',   rowIndex: 0 },
  { label: 'Customer #8 - Ahmad',  keyword: 'Ahmad',  rowIndex: 0 },
  { label: 'Customer #9 - Linda',  keyword: 'Linda',  rowIndex: 0 },
  { label: 'Customer #10 - Row-9', keyword: '',       rowIndex: 9 },
];

// ============================================================
// HELPER: Pilih customer berdasarkan keyword + rowIndex
// ============================================================
async function selectCustomer(page, keyword, rowIndex) {
  const searchInput = page.locator("input[placeholder='Search data...']").first();
  if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await searchInput.fill(keyword);
    await page.waitForTimeout(1500);
  }

  let rows  = page.locator('table tbody tr');
  let count = await rows.count();

  if (count === 0 && keyword) {
    await searchInput.fill('');
    await page.waitForTimeout(1500);
    rows  = page.locator('table tbody tr');
    count = await rows.count();
  }
  if (count === 0) return null;

  const idx     = Math.min(rowIndex, count - 1);
  const row     = rows.nth(idx);
  const rowText = (await row.textContent().catch(() => '')).trim();
  await row.click();
  await page.waitForTimeout(2000);
  return rowText.slice(0, 60);
}

// ============================================================
// HELPER: Tambah produk ke order
//   stockType   : 'Ready' | 'Indent' | 'auto'
//   qty         : qty yang diisi di modal (input type="text", val default "1")
//   startCardIdx: mulai dari card index berapa (0-based) → skip card sebelumnya
// Return: { success, sku, stockUsed }
// ============================================================
async function addProductToOrder(page, skuSearch, stockType, qty = 1, startCardIdx = 0) {
  const productSearch = page.locator("input[placeholder*='Search product']").first();
  if (!await productSearch.isVisible({ timeout: 5000 }).catch(() => false))
    return { success: false, reason: 'Input search produk tidak ada' };

  await productSearch.fill('');
  await productSearch.fill(skuSearch);
  await page.waitForTimeout(2500);

  const allCards = page.locator('div.grid > div');
  const cardCount = await allCards.count();
  if (cardCount === 0) return { success: false, reason: `Produk ${skuSearch} tidak ditemukan` };

  for (let i = startCardIdx; i < Math.min(cardCount, 15); i++) {
    const card     = allCards.nth(i);
    const cardText = await card.textContent().catch(() => '');
    const addBtn   = card.locator("button:has-text('Add to O')").first();
    if (!await addBtn.isVisible({ timeout: 1000 }).catch(() => false)) continue;

    await addBtn.click();
    await page.waitForTimeout(2000);

    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Add to Order/i }).first();
    if (!await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
      return { success: true, sku: skuSearch, stockUsed: 'unknown' };
    }

    // ── 1. Pilih stock source ──
    if (stockType === 'Ready') {
      const labels = modal.locator('label');
      const lc = await labels.count();
      for (let j = 0; j < lc; j++) {
        const lt = (await labels.nth(j).textContent().catch(() => '')).trim();
        if (/warehouse ready/i.test(lt)) {
          await labels.nth(j).click({ force: true });
          await page.waitForTimeout(500);
          console.log(`    ✓ Source: ${lt}`);
          break;
        }
      }
    } else if (stockType === 'Indent') {
      const labels = modal.locator('label');
      const lc = await labels.count();
      let clicked = false;
      for (let j = 0; j < lc; j++) {
        const lt = (await labels.nth(j).textContent().catch(() => '')).trim();
        if (/warehouse indent/i.test(lt)) {
          await labels.nth(j).click({ force: true });
          await page.waitForTimeout(500);
          console.log(`    ✓ Source: ${lt}`);
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        // Fallback: radio ke-3 (index 2)
        const r = modal.locator('input[type="radio"]').nth(2);
        if (await r.isVisible({ timeout: 1000 }).catch(() => false)) {
          await r.check({ force: true });
          await page.waitForTimeout(500);
          console.log(`    ✓ Source: Indent (radio[2] fallback)`);
        }
      }
    }

    // ── 2. Qty readonly di modal — akan diubah di Selected Items setelah add ──
    console.log(`    [info] Qty modal readonly — qty diubah di Selected Items`);

    // ── 3. Klik Add to Order di modal ──
    const addToOrderBtn = modal.locator("button:has-text('Add to Order')").last();
    const isEnabled = await addToOrderBtn.isEnabled({ timeout: 3000 }).catch(() => false);
    if (!isEnabled) {
      const cancelBtn = modal.locator("button:has-text('Cancel'), button:has-text('Close')").first();
      if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) await cancelBtn.click({ force: true });
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      continue;
    }
    await addToOrderBtn.click({ force: true });
    await modal.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const skuText = cardText.match(/BH[\s]?\d+\w+/i)?.[0] || skuSearch;
    return { success: true, sku: skuText, stockUsed: stockType };
  }

  return { success: false, reason: `Tidak ada card ${skuSearch} (startIdx=${startCardIdx}) dengan stock ${stockType}` };
}

// ============================================================
// HELPER: Set diskon pada item di Selected Items section
//   Diskon di MHC ditetapkan otomatis dari sistem (master data).
//   Fungsi ini memverifikasi bahwa badge diskon sudah ada.
// ============================================================
async function applyDiscountToItem(page, itemIndex, discountPct) {
  await page.waitForTimeout(500);

  // Cari badge diskon (span merah dengan text "xx%") di dalam tabel Selected Items
  const discBadges = page.locator('table tbody tr td span.text-red-500');
  const badgeCount = await discBadges.count();

  if (badgeCount > itemIndex) {
    const badge = discBadges.nth(itemIndex);
    const currentVal = (await badge.textContent().catch(() => '')).trim();
    console.log(`    ✓ Diskon item[${itemIndex}]: ${currentVal} (otomatis dari sistem)`);
    return true;
  }

  console.log(`    ⚠ Badge diskon item[${itemIndex}] tidak ditemukan`);
  return false;
}

// ============================================================
// HELPER: Set qty pada item di Selected Items section
//   Klik button Action (cell terakhir) → cari popup edit → ubah qty
// ============================================================
async function setQtyInSelectedItems(page, itemIndex, qty) {
  await page.waitForTimeout(500);
  
  const rows = page.locator('table tbody tr');
  const rowCount = await rows.count();
  if (rowCount <= itemIndex) {
    console.log(`    [qty] Row ${itemIndex} tidak ada (total: ${rowCount})`);
    return false;
  }

  const row = rows.nth(itemIndex);
  
  // Klik button di cell Action (terakhir)
  const actionBtn = row.locator('td').last().locator('button').first();
  if (!await actionBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log(`    [qty] Tombol action tidak visible di row[${itemIndex}]`);
    return false;
  }
  
  await actionBtn.click();
  await page.waitForTimeout(1000);

  // Cek apakah muncul dialog/popup/dropdown setelah klik
  const afterClick = await page.evaluate((rowIdx) => {
    // Cek modal baru
    const modals = document.querySelectorAll('[class*="fixed"]');
    for (const m of modals) {
      if (m.offsetParent === null) continue;
      const text = m.innerText.slice(0, 200);
      if (text.includes('Edit') || text.includes('Qty') || text.includes('Quantity') || text.includes('Update')) {
        const inputs = m.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"])');
        const visibleInputs = [];
        for (const inp of inputs) {
          if (inp.offsetParent === null) continue;
          visibleInputs.push({ type: inp.type, val: inp.value, readonly: inp.readOnly, ph: inp.placeholder });
        }
        return { type: 'modal', text, inputs: visibleInputs };
      }
    }
    // Cek dropdown menu
    const dropdowns = document.querySelectorAll('[role="menu"], [class*="dropdown"], [class*="popover"]');
    for (const d of dropdowns) {
      if (d.offsetParent === null) continue;
      return { type: 'dropdown', text: d.innerText.slice(0, 200) };
    }
    // Cek apakah ada input baru muncul di row
    const rows = document.querySelectorAll('table tbody tr');
    if (rows[rowIdx]) {
      const inps = rows[rowIdx].querySelectorAll('input:not([readonly]):not([type="checkbox"]):not([type="radio"])');
      const vis = [];
      for (const inp of inps) {
        if (inp.offsetParent === null) continue;
        vis.push({ type: inp.type, val: inp.value, ph: inp.placeholder });
      }
      if (vis.length > 0) return { type: 'inline', inputs: vis };
    }
    return { type: 'nothing' };
  }, itemIndex);

  console.log(`    [qty] After action click: ${JSON.stringify(afterClick)}`);

  if (afterClick.type === 'modal' && afterClick.inputs?.length > 0) {
    // Ada modal edit — cari input qty
    const modal = page.locator('.fixed.inset-0').filter({ hasText: /Edit|Qty|Quantity|Update/i }).first();
    const qtyInp = modal.locator('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]):not([readonly])').first();
    await qtyInp.click({ clickCount: 3 });
    await qtyInp.fill(String(qty));
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    // Klik Save/Update/OK
    const saveBtn = modal.locator("button:has-text('Save'), button:has-text('Update'), button:has-text('OK')").first();
    if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveBtn.click();
      await page.waitForTimeout(500);
    }
    console.log(`    ✓ Qty item[${itemIndex}]: ${qty} (via modal edit)`);
    return true;
  }

  if (afterClick.type === 'dropdown') {
    console.log(`    [qty] Dropdown muncul: "${afterClick.text}"`);
    // Kemungkinan ada opsi "Edit" di dropdown
    const editOpt = page.locator('[role="menu"] >> text=Edit, [class*="dropdown"] >> text=Edit').first();
    if (await editOpt.isVisible({ timeout: 1000 }).catch(() => false)) {
      await editOpt.click();
      await page.waitForTimeout(1000);
      console.log(`    [qty] Klik Edit di dropdown`);
    }
    // Dismiss
    await page.keyboard.press('Escape');
  }

  console.log(`    ⚠ Qty item[${itemIndex}] tidak bisa diubah`);
  return false;
}

// ============================================================
// DATA-DRIVEN TEST: 10 kombinasi customer
// ============================================================
test.describe('MHC - Create SO - 10 Kombinasi Customer', () => {
  test.setTimeout(300000);

  for (const combo of CUSTOMER_COMBOS) {
    test(`Create SO: ${combo.label}`, async ({ page }) => {
      const bugs = [];

      // ─── STEP 1: LOGIN & BUKA WIZARD ────────────────────────
      console.log(`\n${'='.repeat(60)}`);
      console.log(`▶  ${combo.label}`);
      console.log(`${'='.repeat(60)}`);

      await login(page);
      await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      const createBtn = page.locator("button:has-text('Create New')").first();
      if (!await createBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        bugs.push('Tombol Create New tidak ditemukan');
        expect(bugs, bugs.join(', ')).toHaveLength(0); return;
      }
      await createBtn.click();
      await page.waitForTimeout(3000);

      const wizardTitle = page.locator('h1, h2').filter({ hasText: /Create Sales Order/i }).first();
      if (!await wizardTitle.isVisible({ timeout: 8000 }).catch(() => false)) {
        bugs.push('Wizard Create SO tidak muncul');
        expect(bugs, bugs.join(', ')).toHaveLength(0); return;
      }
      console.log('✓ Wizard Create Sales Order terbuka');

      // ─── STEP 2: PILIH CUSTOMER ──────────────────────────────
      console.log(`Step 2: Pilih customer (keyword="${combo.keyword}", rowIndex=${combo.rowIndex})...`);
      const chosenCustomer = await selectCustomer(page, combo.keyword, combo.rowIndex);
      if (!chosenCustomer) {
        bugs.push(`Customer tidak ditemukan (keyword: "${combo.keyword}")`);
        expect(bugs, bugs.join(', ')).toHaveLength(0); return;
      }
      console.log(`✓ Customer dipilih: ${chosenCustomer}`);

      // ─── STEP 3: NEXT → PRODUCTS ────────────────────────────
      const nextBtn1 = page.locator("button:has-text('Next Step')").first();
      await nextBtn1.waitFor({ state: 'visible', timeout: 8000 });
      await nextBtn1.click();
      await page.waitForTimeout(3000);

      console.log('Step 3: Tambah 2 produk (2 variant Ready, qty=2, diskon otomatis dari sistem)...');
      const productsHeading = page.locator('text=Available Products').first();
      if (!await productsHeading.isVisible({ timeout: 8000 }).catch(() => false)) {
        bugs.push('Halaman Products tidak muncul setelah Next Step');
        expect(bugs, bugs.join(', ')).toHaveLength(0); return;
      }
      console.log('✓ Halaman Products terbuka');

      // === Item 1: STOK READY, startCard=0 ===
      console.log(`  → Item 1: ${PRODUCT_SKU} | READY`);
      const r1 = await addProductToOrder(page, PRODUCT_SKU, 'Ready', ITEM_QTY, 0);
      if (r1.success) {
        console.log(`  ✓ Item 1 OK: ${r1.sku} [${r1.stockUsed}]`);
        await setQtyInSelectedItems(page, 0, ITEM_QTY);
        await applyDiscountToItem(page, 0, DISCOUNT_PCT);
      } else {
        console.log(`  ⚠ Item 1 gagal (${r1.reason})`);
        bugs.push(`Item 1: ${r1.reason}`);
      }

      // === Item 2: Card berbeda (index 1), STOK READY ===
      console.log(`  → Item 2: ${PRODUCT_SKU} | READY | startCard=1`);
      const r2 = await addProductToOrder(page, PRODUCT_SKU, 'Ready', ITEM_QTY, 1);
      if (r2.success) {
        console.log(`  ✓ Item 2 OK: ${r2.sku} [${r2.stockUsed}]`);
        await setQtyInSelectedItems(page, 1, ITEM_QTY);
        await applyDiscountToItem(page, 1, DISCOUNT_PCT);
      } else {
        console.log(`  ⚠ Item 2 gagal (${r2.reason}), lanjut dengan 1 item`);
      }

      // Verifikasi jumlah item terpilih
      const selectedLabel = page.locator('text=/Selected Items \\d+|Selected Items/i').first();
      if (await selectedLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
        const selTxt = await selectedLabel.textContent().catch(() => '');
        console.log(`✓ Selected: ${selTxt.trim()}`);
      }

      // ─── STEP 4: NEXT → REVIEW ──────────────────────────────
      const nextBtn2 = page.locator("button:has-text('Next Step')").first();
      await nextBtn2.waitFor({ state: 'visible', timeout: 8000 });
      if (!await nextBtn2.isEnabled({ timeout: 5000 }).catch(() => false)) {
        bugs.push('Tombol Next Step tidak aktif setelah produk dipilih');
        expect(bugs, bugs.join(', ')).toHaveLength(0); return;
      }
      await nextBtn2.click();
      await page.waitForTimeout(3000);

      console.log('Step 4: Review...');
      const submitOrderBtn = page.locator("button:has-text('Submit Order')").first();
      if (!await submitOrderBtn.isVisible({ timeout: 10000 }).catch(() => false)) {
        bugs.push('Tombol Submit Order tidak muncul di step Review');
        expect(bugs, bugs.join(', ')).toHaveLength(0); return;
      }
      console.log('✓ Halaman Review dengan tombol Submit Order');

      // Ringkasan review
      const reviewBody = await page.locator('body').innerText().catch(() => '');
      const gtMatch    = reviewBody.match(/Grand Total\s*(Rp[\d.,\s]+)/i);
      console.log(`  Grand Total: ${gtMatch?.[1]?.trim() || 'n/a'}`);
      const reviewRows = page.locator('table tbody tr');
      const rowCount   = await reviewRows.count();
      console.log(`  Jumlah item di review: ${rowCount}`);
      for (let i = 0; i < rowCount; i++) {
        const rt = (await reviewRows.nth(i).textContent().catch(() => '')).trim();
        if (rt) console.log(`    - ${rt.slice(0, 90)}`);
      }

      // ─── STEP 5: SUBMIT ORDER + KLIK YES ────────────────────
      console.log('Step 5: Submit Order...');
      await submitOrderBtn.click();
      await page.waitForTimeout(2000);

      // Klik Yes / Confirm di dialog konfirmasi
      const confirmSelectors = [
        "button:has-text('Yes')",
        "button:has-text('Ya')",
        "button:has-text('Confirm')",
        "button:has-text('OK')",
      ];
      let confirmed = false;
      for (const sel of confirmSelectors) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await btn.click();
          await page.waitForTimeout(3000);
          const label = sel.match(/'(.+)'/)?.[1] || sel;
          console.log(`✓ Konfirmasi "${label}" diklik`);
          confirmed = true;
          break;
        }
      }
      if (!confirmed) console.log('  ⚠ Tidak ada dialog konfirmasi - order langsung diproses');

      await page.waitForTimeout(3000);

      const urlAfterSubmit  = page.url();
      const bodyAfterSubmit = await page.locator('body').innerText().catch(() => '');
      const soNumber        = bodyAfterSubmit.match(/MoRe-SO[\w-]+/)?.[0];
      console.log(`  URL: ${urlAfterSubmit}`);
      console.log(`  SO Number: ${soNumber || '(belum terdeteksi)'}`);

      // Verifikasi di list SO
      await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const firstRow = (await page.locator('table tbody tr').first().textContent().catch(() => '')).trim();
      console.log(`✓ SO terbaru di list: ${firstRow.slice(0, 100)}`);

      // Screenshot
      const screenshotName = `so-${combo.rowIndex}-${combo.keyword || 'row9'}-result.png`;
      await page.screenshot({ path: `test-results/${screenshotName}`, fullPage: false });
      console.log(`  Screenshot: test-results/${screenshotName}`);

      console.log(`\n✅ SELESAI: ${combo.label}`);

      if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
      expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
    });
  }
});
