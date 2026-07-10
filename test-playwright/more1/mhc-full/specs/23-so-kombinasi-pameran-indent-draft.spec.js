import { test, expect } from '@playwright/test';
import { login, clickModalButton } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';
const MHC = `${BASE}/mhc`;

const GBBK_SKUS = ['BH2725GBBK', 'BH 2725 GBBK'];
const GABK_SKUS = ['BH2725GABK', 'BH 2725 GABK'];
const RAC_SKUS = ['RA0511AAWH.IDJAB0A', 'RA0511AAWH', '0511'];

async function dismissSweetAlert(page) {
  const swal = page.locator('.swal2-container').first();
  if (await swal.isVisible({ timeout: 3000 }).catch(() => false)) {
    const confirmBtn = swal.locator('.swal2-confirm, button:has-text("OK"), button:has-text("Ya")').first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click({ force: true }).catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(1000);
  }
}

/**
 * Kalau sebuah langkah gagal di tengah dan modal "Add to Order" masih terbuka,
 * tutup dulu (Cancel/Escape) supaya tidak memblokir klik-klik berikutnya di test
 * yang sama (mencegah cascading failure ke produk lain yang mau ditambahkan).
 */
async function closeModalIfStuck(page) {
  const modal = page.locator('.fixed.inset-0').first();
  if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
    const cancelBtn = modal.locator("button:has-text('Cancel'), button:has-text('Close')").first();
    if (await cancelBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await cancelBtn.click({ force: true }).catch(() => {});
    } else {
      await page.keyboard.press('Escape').catch(() => {});
    }
    await page.waitForTimeout(1000);
  }
}

async function clickCustomer(page, keyword = 'Agus') {
  const searchInput = page.locator("input[placeholder='Search data...']").first();
  if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await searchInput.fill(keyword);
    await page.waitForTimeout(1500);
  }
  const row = page.locator('table tbody tr').first();
  if (!await row.isVisible({ timeout: 8000 }).catch(() => false)) return false;
  await row.click();
  await page.waitForTimeout(2000);
  return true;
}

async function searchProduct(page, skuCandidates) {
  const productSearch = page.locator("input[placeholder*='Search product']").first();
  await productSearch.waitFor({ state: 'visible', timeout: 8000 });
  for (const sku of skuCandidates) {
    await productSearch.fill('');
    await productSearch.fill(sku);
    await page.waitForTimeout(2500);
    const count = await page.locator("div.grid > div button:has-text('Add to O')").count();
    if (count > 0) return sku;
  }
  return null;
}

/**
 * Tambah produk BH 2725 GBBK dengan Order Type Pameran + pilih Warehouse Pameran.
 * Return true kalau berhasil ditambahkan (modal tertutup).
 */
async function addProductPameran(page, bugs) {
  const found = await searchProduct(page, GBBK_SKUS);
  if (!found) { bugs.push('Produk BH 2725 GBBK tidak ditemukan'); return false; }

  await page.locator("div.grid > div button:has-text('Add to O')").first().click();
  await page.waitForTimeout(1500);
  const addModal = page.locator('.fixed.inset-0').filter({ hasText: 'Add to Order' }).first();
  if (!await addModal.isVisible({ timeout: 8000 }).catch(() => false)) {
    bugs.push('Modal Add to Order tidak terbuka untuk BH 2725 GBBK'); return false;
  }
  const orderTypeSelect = addModal.locator('select').filter({ has: page.locator('option[value="PMR"]') }).first();
  if (!await orderTypeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
    bugs.push('Dropdown Order Type Pameran tidak ditemukan untuk BH 2725 GBBK'); await closeModalIfStuck(page); return false;
  }
  await orderTypeSelect.selectOption('PMR');
  await page.waitForTimeout(1500);

  // Tunggu spinner "Pilih warehouse pameran:" hilang - API list gudang pameran
  // kadang butuh lebih dari 10 detik untuk selesai load.
  await addModal.locator('svg.animate-spin, .animate-spin, [class*="spinner"]').first()
    .waitFor({ state: 'detached', timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(500);

  const anyPameranItem = addModal.locator('text=/Gudang Pameran/i').first();
  if (!await anyPameranItem.isVisible({ timeout: 20000 }).catch(() => false)) {
    bugs.push('Tidak ada opsi Gudang Pameran untuk BH 2725 GBBK saat ini');
  } else {
    // PENTING: filter div/label by hasText bisa menangkap DIV PEMBUNGKUS BESAR yang berisi
    // ketiga baris gudang sekaligus (karena ia juga "hasText" match via descendant), bukan
    // baris spesifiknya - klik ke wrapper itu tidak benar-benar toggle radio manapun.
    // Gunakan pola "border+rounded" (item card individual) yang sudah terbukti benar di flow PO.
    let candidateRows = addModal.locator('div[class*="border"][class*="rounded"]').filter({ hasText: /Gudang Pameran/i });
    let rowCount = await candidateRows.count();
    if (rowCount === 0) {
      // Fallback: cari radio input, lalu ambil parent label/div terdekat sebagai baris klik.
      candidateRows = addModal.locator('label:has(input[type="radio"])').filter({ hasText: /Gudang Pameran/i });
      rowCount = await candidateRows.count();
    }

    let picked = false;
    for (let i = 0; i < rowCount; i++) {
      const row = candidateRows.nth(i);
      const rowText = (await row.textContent().catch(() => '')) || '';
      const unitMatch = rowText.match(/(\d+)\s*Unit/i);
      // Pastikan baris ini SPESIFIK (hanya 1 kemunculan "Gudang Pameran"), bukan wrapper gabungan.
      const occurrences = (rowText.match(/Gudang Pameran/gi) || []).length;
      if (occurrences === 1 && unitMatch && parseInt(unitMatch[1], 10) > 0) {
        const radioInside = row.locator('input[type="radio"]').first();
        if (await radioInside.count() > 0) {
          await radioInside.click({ force: true }).catch(() => {});
        } else {
          await row.click({ force: true }).catch(() => {});
        }
        await page.waitForTimeout(1000);
        picked = true;
        console.log(`✓ Gudang Pameran dipilih (stok ${unitMatch[1]} unit): ${rowText.trim().slice(0, 60)}`);
        break;
      }
    }
    if (!picked) {
      bugs.push('Semua Gudang Pameran menunjukkan stok 0 Unit (atau baris spesifik tidak ditemukan) untuk BH 2725 GBBK');
      await anyPameranItem.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
    }
  }

  // Produk Pameran (tracked by serial) menampilkan section "PILIH SERIAL NUMBER"
  // setelah gudang dipilih - wajib pilih minimal 1 serial sebelum Add to Order aktif.
  const serialSection = addModal.locator('text=/PILIH SERIAL NUMBER/i').first();
  if (await serialSection.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addModal.locator('text=/Memuat serial/i').first()
      .waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(500);
    // Checkbox serial terlihat kecil (kotak persegi) di kiri tiap baris - kemungkinan
    // native <input type="checkbox"> tapi hit-area kecil, atau dibungkus label.
    // Klik langsung via JS pada elemen checkbox PERTAMA di dalam section serial (paling reliable).
    let serialPicked = false;
    // Klik native checkbox via JS TIDAK mengubah counter "X/1 dipilih" - kemungkinan besar
    // handler toggle-nya ada di elemen PEMBUNGKUS baris (label/div), bukan di <input> itu sendiri
    // (pola umum untuk custom checkbox: input murni visual, onClick ada di parent row).
    // Ambil baris pertama secara spesifik lewat nomor serial (7162132 dkk selalu berupa angka utuh),
    // lalu klik pakai koordinat asli Playwright (BUKAN force) supaya event pointer benar-benar
    // dikirim ke elemen yang benar sesuai hierarki DOM asli.
    const firstSerialText = addModal.locator('text=/^\\d{5,}$/').first();
    if (await firstSerialText.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Coba klik langsung di teks nomor serial (baris/label biasanya membungkus teks ini juga).
      await firstSerialText.click().catch(() => {});
      await page.waitForTimeout(500);
      let counterNow = await addModal.locator('text=/\\d+\\/\\d+\\s*dipilih/i').first().textContent().catch(() => '');
      if (/^0\//.test((counterNow || '').trim())) {
        // Masih 0 - coba klik checkbox itu sendiri dengan Playwright click biasa (non-force, non-JS).
        const cbLocator = addModal.locator('input[type="checkbox"]').first();
        await cbLocator.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
      }
      serialPicked = true;
    } else {
      // Fallback: klik baris/card serial yang clickable (custom styled checkbox berupa div/span).
      const serialRow = addModal.locator('div[class*="border"][class*="rounded"], li, tr')
        .filter({ hasText: /\d{5,}/ }).first();
      if (await serialRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await serialRow.click({ force: true }).catch(() => {});
        serialPicked = true;
      }
    }
    await page.waitForTimeout(800);
    // Verifikasi lewat counter "X/1 dipilih" - kalau masih 0/1, klik belum berhasil terdaftar.
    const counterText = await addModal.locator('text=/\\d+\\/\\d+\\s*dipilih/i').first().textContent().catch(() => '');
    if (serialPicked && /^0\//.test((counterText || '').trim())) {
      bugs.push(`Klik serial number tidak terdaftar oleh sistem (counter masih "${counterText.trim()}")`);
    } else if (!serialPicked) {
      bugs.push('Tidak ada serial number yang tersedia untuk dipilih pada BH 2725 GBBK (Pameran)');
    } else {
      console.log(`✓ Serial number dipilih untuk BH 2725 GBBK (Pameran) - counter: ${counterText.trim()}`);
    }
  }

  await clickModalButton(page, 'Add to Order');
  await page.waitForTimeout(1000);
  await dismissSweetAlert(page);
  const stillOpen = await addModal.isVisible({ timeout: 2000 }).catch(() => false);
  if (stillOpen) {
    bugs.push('Modal BH 2725 GBBK Pameran tidak tertutup setelah Add to Order');
    await closeModalIfStuck(page);
    return false;
  }
  return true;
}

/**
 * Tambah produk BH 2725 GABK dengan stock source Indent ATAU Ready/Finish Goods.
 * stockType: 'Indent' | 'Ready'
 */
async function addProductGABK(page, bugs, stockType) {
  const found = await searchProduct(page, GABK_SKUS);
  if (!found) { bugs.push('Produk BH 2725 GABK tidak ditemukan'); return false; }

  await page.locator("div.grid > div button:has-text('Add to O')").first().click();
  await page.waitForTimeout(1500);
  const addModal = page.locator('.fixed.inset-0').filter({ hasText: 'Add to Order' }).first();
  if (!await addModal.isVisible({ timeout: 8000 }).catch(() => false)) {
    bugs.push('Modal Add to Order tidak terbuka untuk BH 2725 GABK'); return false;
  }

  const sourceLabel = stockType === 'Indent' ? /warehouse indent/i : /warehouse ready/i;
  const sourceItem = addModal.locator('label, div').filter({ hasText: sourceLabel }).first();
  if (await sourceItem.isVisible({ timeout: 5000 }).catch(() => false)) {
    await sourceItem.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);
  } else {
    bugs.push(`Stock Source "${stockType}" tidak ditemukan/tersedia untuk BH 2725 GABK`);
  }

  await clickModalButton(page, 'Add to Order');
  await page.waitForTimeout(1000);
  await dismissSweetAlert(page);
  const stillOpen = await addModal.isVisible({ timeout: 2000 }).catch(() => false);
  if (stillOpen) { bugs.push(`Modal BH 2725 GABK (${stockType}) tidak tertutup setelah Add to Order`); await closeModalIfStuck(page); return false; }
  return true;
}

/** Tambah produk RA0511AAWH.IDJAB0A dengan stock source default (tanpa kondisi khusus). */
async function addProductRAC(page, bugs) {
  const found = await searchProduct(page, RAC_SKUS);
  if (!found) { bugs.push('Produk RA0511AAWH.IDJAB0A tidak ditemukan'); return false; }

  await page.locator("div.grid > div button:has-text('Add to O')").first().click();
  await page.waitForTimeout(1500);
  const addModal = page.locator('.fixed.inset-0').filter({ hasText: 'Add to Order' }).first();
  if (!await addModal.isVisible({ timeout: 8000 }).catch(() => false)) {
    bugs.push('Modal Add to Order tidak terbuka untuk RA0511AAWH.IDJAB0A'); return false;
  }
  await clickModalButton(page, 'Add to Order');
  await page.waitForTimeout(1000);
  await dismissSweetAlert(page);
  const stillOpen = await addModal.isVisible({ timeout: 2000 }).catch(() => false);
  if (stillOpen) { bugs.push('Modal RA0511AAWH.IDJAB0A tidak tertutup setelah Add to Order'); await closeModalIfStuck(page); return false; }
  return true;
}

/** Apply campaign ke item TERAKHIR yang baru ditambahkan (tombol Add Promo paling bawah). */
async function applyCampaignToLastItem(page, bugs, itemLabel) {
  const addPromoBtn = page.locator('button[title="Add Promo"], button:has-text("Add Promo"), button:has-text("Add Campaign")').last();
  if (!await addPromoBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    bugs.push(`Tombol Add Promo tidak ditemukan untuk ${itemLabel}`); return false;
  }
  await addPromoBtn.click({ force: true });
  await page.waitForTimeout(1000);
  const promoModal = page.locator('.fixed.inset-0').filter({ hasText: 'Available Promotions' }).first();
  if (!await promoModal.isVisible({ timeout: 8000 }).catch(() => false)) {
    bugs.push(`Modal campaign tidak terbuka untuk ${itemLabel}`); return false;
  }
  await page.waitForFunction(() => {
    const modal = document.querySelector('.fixed.inset-0');
    return modal && !modal.innerText.includes('Memuat promo');
  }, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const campaignRow = promoModal.locator('table tbody tr').first();
  if (!await campaignRow.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log(`  ⚠ Tidak ada campaign aktif untuk ${itemLabel} saat ini`);
    const closeBtn = promoModal.locator("button:has-text('Close')").first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await closeBtn.click({ force: true });
    else await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    return false;
  }
  const campaignText = (await campaignRow.textContent().catch(() => '')).trim();
  const selectBtn = promoModal.locator("button:has-text('Select')").first();
  if (!await selectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    bugs.push(`Tombol Select campaign tidak ditemukan untuk ${itemLabel}`); return false;
  }
  await selectBtn.click({ force: true });
  await page.waitForTimeout(2000);
  await dismissSweetAlert(page);
  console.log(`✓ Campaign diterapkan pada ${itemLabel}: ${campaignText.slice(0, 60)}`);
  return true;
}

async function startSoWizard(page, bugs) {
  await login(page);
  await page.goto(`${MHC}/sales-order`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.locator("button:has-text('Create New')").first().click();
  await page.waitForTimeout(3000);
  if (!await clickCustomer(page)) { bugs.push('Tidak ada customer yang bisa dipilih'); return false; }
  await page.locator("button:has-text('Next Step')").first().click();
  await page.waitForTimeout(3000);
  const ok = await page.locator('text=Available Products').first().isVisible({ timeout: 8000 }).catch(() => false);
  if (!ok) { bugs.push('Step Products tidak terbuka'); return false; }
  return true;
}

async function goToReviewAndFinish(page, bugs, mode = 'submit') {
  const nextBtn = page.locator("button:has-text('Next Step')").first();
  if (!await nextBtn.isVisible({ timeout: 5000 }).catch(() => false) || !await nextBtn.isEnabled().catch(() => false)) {
    bugs.push('Tidak bisa lanjut ke step Review (Next Step disabled/tidak ada)'); return false;
  }
  await nextBtn.click();
  await page.waitForTimeout(3000);

  if (mode === 'draft') {
    const draftBtn = page.locator("button:has-text('Save Draft'), button:has-text('Save as Draft')").first();
    if (!await draftBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Tombol Save Draft tidak ditemukan di step Review SO'); return false;
    }
    await draftBtn.click();
    await page.waitForTimeout(3000);
    await dismissSweetAlert(page);
    console.log('✓ SO disimpan sebagai Draft');
    return true;
  } else {
    const submitBtn = page.locator("button:has-text('Submit Order'), button:has-text('Confirm Order'), button:has-text('Submit')").first();
    if (!await submitBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Tombol Submit Order tidak ditemukan di step Review'); return false;
    }
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await dismissSweetAlert(page);
    console.log('✓ SO berhasil disubmit');
    return true;
  }
}

test.describe('MHC - 10 Create SO Kombinasi (Pameran, Indent/FG, Draft, Campaign)', () => {
  test.setTimeout(180000);

  test('SO-CMB-01: BH 2725 GBBK - Order Type Pameran (WH Pameran) + campaign, submit', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (!await addProductPameran(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    await applyCampaignToLastItem(page, bugs, 'BH 2725 GBBK (Pameran)');
    await goToReviewAndFinish(page, bugs, 'submit');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('SO-CMB-02: BH 2725 GABK - Stock Source Indent + campaign, submit', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (!await addProductGABK(page, bugs, 'Indent')) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    await applyCampaignToLastItem(page, bugs, 'BH 2725 GABK (Indent)');
    await goToReviewAndFinish(page, bugs, 'submit');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('SO-CMB-03: BH 2725 GABK - Stock Source Ready/Finish Goods + campaign, submit', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (!await addProductGABK(page, bugs, 'Ready')) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    await applyCampaignToLastItem(page, bugs, 'BH 2725 GABK (Ready/FG)');
    await goToReviewAndFinish(page, bugs, 'submit');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('SO-CMB-04: RA0511AAWH.IDJAB0A - disimpan sebagai status Draft', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (!await addProductRAC(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    await goToReviewAndFinish(page, bugs, 'draft');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('SO-CMB-05: Multi-item - BH 2725 GBBK (Pameran+campaign) + BH 2725 GABK (Indent+campaign), submit', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (await addProductPameran(page, bugs)) await applyCampaignToLastItem(page, bugs, 'BH 2725 GBBK (Pameran)');
    if (await addProductGABK(page, bugs, 'Indent')) await applyCampaignToLastItem(page, bugs, 'BH 2725 GABK (Indent)');
    await goToReviewAndFinish(page, bugs, 'submit');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('SO-CMB-06: Multi-item - BH 2725 GBBK (Pameran+campaign) + BH 2725 GABK (Finish Goods+campaign), submit', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (await addProductPameran(page, bugs)) await applyCampaignToLastItem(page, bugs, 'BH 2725 GBBK (Pameran)');
    if (await addProductGABK(page, bugs, 'Ready')) await applyCampaignToLastItem(page, bugs, 'BH 2725 GABK (Ready/FG)');
    await goToReviewAndFinish(page, bugs, 'submit');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('SO-CMB-07: Multi-item - BH 2725 GABK (Indent+campaign) + RA0511AAWH.IDJAB0A, disimpan Draft', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (await addProductGABK(page, bugs, 'Indent')) await applyCampaignToLastItem(page, bugs, 'BH 2725 GABK (Indent)');
    await addProductRAC(page, bugs);
    await goToReviewAndFinish(page, bugs, 'draft');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('SO-CMB-08: 3-item - BH 2725 GBBK (Pameran+campaign) + BH 2725 GABK (Indent+campaign) + RA0511AAWH.IDJAB0A, disimpan Draft', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (await addProductPameran(page, bugs)) await applyCampaignToLastItem(page, bugs, 'BH 2725 GBBK (Pameran)');
    if (await addProductGABK(page, bugs, 'Indent')) await applyCampaignToLastItem(page, bugs, 'BH 2725 GABK (Indent)');
    await addProductRAC(page, bugs);
    await goToReviewAndFinish(page, bugs, 'draft');
    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('SO-CMB-09: BH 2725 GBBK (Pameran+campaign) disimpan Draft dulu, lalu dibuka & disubmit', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (!await addProductPameran(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    await applyCampaignToLastItem(page, bugs, 'BH 2725 GBBK (Pameran)');
    if (!await goToReviewAndFinish(page, bugs, 'draft')) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }

    // Buka lagi list SO, cari draft terbaru
    await page.goto(`${MHC}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const draftFilter = page.locator('select, button').filter({ hasText: /status|filter/i }).first();
    const draftRow = page.locator('table tbody tr').filter({ hasText: /draft/i }).first();
    if (!await draftRow.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Tidak ditemukan SO berstatus Draft di list setelah disimpan');
      if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
      expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0); return;
    }
    await draftRow.click();
    await page.waitForTimeout(3000);
    const hasPameranInfo = await page.locator('text=/Pameran/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasPameranInfo) bugs.push('Info Order Type Pameran tidak terlihat lagi setelah draft dibuka ulang');
    else console.log('✓ Data Pameran & campaign tetap tersimpan di draft');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  test('SO-CMB-10: Regresi konsistensi 3 kondisi produk dalam 1 Review (WH Pameran, Indent, item tanpa campaign)', async ({ page }) => {
    const bugs = [];
    if (!await startSoWizard(page, bugs)) { expect(bugs, bugs.join('; ')).toHaveLength(0); return; }
    if (await addProductPameran(page, bugs)) await applyCampaignToLastItem(page, bugs, 'BH 2725 GBBK (Pameran)');
    if (await addProductGABK(page, bugs, 'Indent')) await applyCampaignToLastItem(page, bugs, 'BH 2725 GABK (Indent)');
    await addProductRAC(page, bugs);

    const nextBtn = page.locator("button:has-text('Next Step')").first();
    if (!await nextBtn.isVisible({ timeout: 5000 }).catch(() => false) || !await nextBtn.isEnabled().catch(() => false)) {
      bugs.push('Tidak bisa lanjut ke step Review'); expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }
    await nextBtn.click();
    await page.waitForTimeout(3000);

    const reviewText = await page.locator('body').innerText().catch(() => '');
    const hasGBBK = /GBBK/i.test(reviewText);
    const hasGABK = /GABK/i.test(reviewText);
    const hasRAC = /0511/i.test(reviewText);
    if (!hasGBBK) bugs.push('BH 2725 GBBK tidak terlihat di Review');
    if (!hasGABK) bugs.push('BH 2725 GABK tidak terlihat di Review');
    if (!hasRAC) bugs.push('RA0511AAWH.IDJAB0A tidak terlihat di Review');
    if (hasGBBK && hasGABK && hasRAC) console.log('✓ Ketiga produk dengan kondisi berbeda tampil konsisten di Review');

    await page.screenshot({ path: 'test-results/so-cmb-10-review.png', fullPage: true }).catch(() => {});

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
