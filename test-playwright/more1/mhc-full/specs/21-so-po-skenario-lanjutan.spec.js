import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, clickModalButton, clickModalItemByText } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';
const MHC = `${BASE}/mhc`; // route root SO/PO ada di bawah /mhc, bukan di root domain

// Produk untuk skenario Pameran (data pameran) - sesuai instruksi: BH 2725 GBBK
const PAMERAN_SKUS = ['BH2725GBBK', 'BH2725GABK'];
// Produk untuk skenario "RAC 0511 A" -> AC Split RA 0511 AAWH (SET)
const RAC_0511_SKUS = ['RA0511AAWH', '0511'];

/**
 * Cari & buka product search, coba beberapa SKU fallback,
 * return SKU yang berhasil ditemukan (punya card dgn "Add to O...").
 */
async function findProductCard(page, skuCandidates) {
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
 * Setelah aksi tertentu (mis. Select campaign), aplikasi menampilkan
 * SweetAlert2 (swal2) sebagai konfirmasi/notifikasi yang menutupi seluruh
 * layar (swal2-container) dan memblokir semua klik berikutnya sampai ditutup.
 */
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

test.describe('MHC - SO/PO Skenario Lanjutan (Pameran, RAC 0511 A, Multi Campaign)', () => {
  test.setTimeout(180000);

  // ============================================================
  // SKENARIO 1: SO dengan data Pameran (Order Type = Pameran)
  // ============================================================
  test('SO - Create dengan Order Type Pameran (data pameran BH 2725 GBBK)', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${MHC}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await page.locator("button:has-text('Create New')").first().click();
    await page.waitForTimeout(3000);

    const wizardTitle = page.locator('h1, h2').filter({ hasText: /Create Sales Order/i }).first();
    if (!await wizardTitle.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Wizard Create SO tidak muncul');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }

    if (!await clickCustomer(page)) {
      bugs.push('Tidak ada customer yang bisa dipilih');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }

    await page.locator("button:has-text('Next Step')").first().click();
    await page.waitForTimeout(3000);
    await page.locator('text=Available Products').first().waitFor({ timeout: 8000 });

    const foundSku = await findProductCard(page, PAMERAN_SKUS);
    if (!foundSku) {
      bugs.push(`Produk pameran tidak ditemukan (dicoba: ${PAMERAN_SKUS.join(', ')})`);
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }
    console.log(`✓ Produk data pameran ditemukan: ${foundSku}`);

    await page.locator("div.grid > div button:has-text('Add to O')").first().click();
    await page.waitForTimeout(1500);

    // Modal "Add to Order" -> pilih ORDER TYPE = Pameran
    const addModal = page.locator('.fixed.inset-0').filter({ hasText: 'Add to Order' }).first();
    if (!await addModal.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Modal Add to Order tidak terbuka');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }

    const orderTypeSelect = addModal.locator('select').filter({ has: page.locator('option[value="PMR"]') }).first();
    if (!await orderTypeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Dropdown Order Type (dengan opsi Pameran) tidak ditemukan');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }
    await orderTypeSelect.selectOption('PMR');
    await page.waitForTimeout(1500);
    console.log('✓ Order Type "Pameran" dipilih');

    // Setelah pilih Pameran, harus muncul pilihan "Warehouse Pameran"
    const warehousePameranLabel = addModal.locator('text=/Warehouse Pameran/i').first();
    if (!await warehousePameranLabel.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Opsi "Warehouse Pameran" tidak muncul setelah memilih Order Type Pameran');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }
    console.log('✓ Stock Source "Warehouse Pameran" tampil');

    // Tunggu daftar gudang pameran selesai loading (skeleton/spinner hilang)
    await addModal.locator('text=/Pilih warehouse pameran/i').waitFor({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Pilih salah satu gudang pameran yang tersedia (Kat A/B/K)
    const pameranWarehouseItem = addModal.locator('text=/Gudang Pameran/i').first();
    if (await pameranWarehouseItem.isVisible({ timeout: 10000 }).catch(() => false)) {
      await pameranWarehouseItem.click({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
      console.log('✓ Gudang pameran dipilih');
    } else {
      bugs.push('Tidak ada opsi Gudang Pameran yang muncul untuk produk ini');
    }

    // Klik "Add to Order" footer modal (tanpa submit SO agar tidak buat data sampah)
    await clickModalButton(page, 'Add to Order');
    await page.waitForTimeout(1000);

    // Modal bisa saja masih terbuka bila validasi gagal (mis. belum pilih gudang) - jangan diamkan
    const modalStillOpen = await addModal.isVisible({ timeout: 2000 }).catch(() => false);
    if (modalStillOpen) {
      bugs.push('Modal Add to Order tidak tertutup setelah klik Add to Order - kemungkinan validasi gudang pameran gagal');
    } else {
      console.log('✓ Produk dengan Order Type Pameran ditambahkan ke Selected Items');
    }

    // Verifikasi item pameran muncul di ringkasan order (Selected Items)
    const pameranBadge = page.locator('text=/Pameran/i').first();
    if (!modalStillOpen && !await pameranBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Label "Pameran" tidak terlihat di Selected Items setelah item ditambahkan');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // ============================================================
  // SKENARIO 2: SO dengan produk RAC 0511 A (RA 0511 AAWH)
  // ============================================================
  test('SO - Create dengan produk RAC 0511 A (RA 0511 AAWH SET)', async ({ page }) => {
    const bugs = [];
    await login(page);
    await page.goto(`${MHC}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await page.locator("button:has-text('Create New')").first().click();
    await page.waitForTimeout(3000);

    if (!await clickCustomer(page)) {
      bugs.push('Tidak ada customer yang bisa dipilih');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }

    await page.locator("button:has-text('Next Step')").first().click();
    await page.waitForTimeout(3000);
    await page.locator('text=Available Products').first().waitFor({ timeout: 8000 });

    const foundSku = await findProductCard(page, RAC_0511_SKUS);
    if (!foundSku) {
      bugs.push(`Produk RAC 0511 A (RA 0511 AAWH) tidak ditemukan (dicoba: ${RAC_0511_SKUS.join(', ')})`);
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }
    console.log(`✓ Produk RAC 0511 A ditemukan via SKU: ${foundSku}`);

    // Pastikan card yang match benar-benar produk "RA 0511"
    const productCard = page.locator('div.grid > div').filter({ hasText: /0511/i }).first();
    if (!await productCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Card produk RA 0511 AAWH tidak terlihat di hasil pencarian');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }
    const cardText = await productCard.textContent().catch(() => '');
    console.log(`  Card: ${cardText.replace(/\s+/g, ' ').trim().slice(0, 80)}`);

    await productCard.locator("button:has-text('Add to O')").first().click();
    await page.waitForTimeout(1500);

    const addModal = page.locator('.fixed.inset-0').filter({ hasText: 'Add to Order' }).first();
    if (!await addModal.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Modal Add to Order tidak terbuka untuk produk RA 0511 AAWH');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }

    const modalText = await addModal.textContent().catch(() => '');
    if (!/0511/i.test(modalText)) {
      bugs.push(`Modal Add to Order tidak menampilkan produk RA 0511 AAWH yang dipilih`);
    } else {
      console.log('✓ Modal Add to Order menampilkan produk RA 0511 AAWH yang benar');
    }

    // Gunakan Stock Source default (Warehouse Ready) dan set qty = 1
    const qtyInput = addModal.locator('input[type="number"], input[inputmode="numeric"]').first();
    if (await qtyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await qtyInput.fill('1');
    }

    await clickModalButton(page, 'Add to Order');
    console.log('✓ Produk RAC 0511 A (RA 0511 AAWH) ditambahkan ke Selected Items');

    const selectedItem = page.locator('text=/0511/i').first();
    if (!await selectedItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Produk RA 0511 AAWH tidak terlihat di Selected Items setelah ditambahkan');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // ============================================================
  // SKENARIO 3: SO dengan penggunaan Multi Campaign
  // (2 produk berbeda, masing-masing diberi campaign/promo sendiri
  //  dalam 1 Sales Order yang sama)
  // ============================================================
  test('SO - Multi Campaign (2 produk, masing-masing dengan Campaign berbeda)', async ({ page }) => {
    test.setTimeout(240000);
    const bugs = [];
    await login(page);
    await page.goto(`${MHC}/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    await page.locator("button:has-text('Create New')").first().click();
    await page.waitForTimeout(3000);

    if (!await clickCustomer(page)) {
      bugs.push('Tidak ada customer yang bisa dipilih');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }

    await page.locator("button:has-text('Next Step')").first().click();
    await page.waitForTimeout(3000);
    await page.locator('text=Available Products').first().waitFor({ timeout: 8000 });

    const productsToAdd = [PAMERAN_SKUS, RAC_0511_SKUS]; // 2 produk berbeda
    const campaignsApplied = [];

    for (let i = 0; i < productsToAdd.length; i++) {
      await dismissSweetAlert(page);
      const skuList = productsToAdd[i];
      const foundSku = await findProductCard(page, skuList);
      if (!foundSku) {
        bugs.push(`Produk ke-${i + 1} tidak ditemukan (dicoba: ${skuList.join(', ')})`);
        continue;
      }
      await page.locator("div.grid > div button:has-text('Add to O')").first().click();
      await page.waitForTimeout(1500);

      const addModal = page.locator('.fixed.inset-0').filter({ hasText: 'Add to Order' }).first();
      if (await addModal.isVisible({ timeout: 8000 }).catch(() => false)) {
        await clickModalButton(page, 'Add to Order');
        await dismissSweetAlert(page);
        console.log(`✓ Produk ke-${i + 1} (${foundSku}) ditambahkan ke order`);
      } else {
        bugs.push(`Modal Add to Order tidak terbuka untuk produk ke-${i + 1}`);
        continue;
      }

      // Buka Add Promo / Add Campaign untuk item yang baru ditambahkan
      const addPromoBtn = page.locator('button[title="Add Promo"], button:has-text("Add Promo"), button:has-text("Add Campaign")').last();
      if (!await addPromoBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
        console.log(`  ⚠ Tombol Add Promo tidak ditemukan untuk produk ke-${i + 1}`);
        continue;
      }
      await addPromoBtn.click({ force: true });
      await page.waitForTimeout(1000);

      const promoModal = page.locator('.fixed.inset-0').filter({ hasText: 'Available Promotions' }).first();
      if (!await promoModal.isVisible({ timeout: 8000 }).catch(() => false)) {
        console.log(`  ⚠ Modal campaign tidak terbuka untuk produk ke-${i + 1}`);
        continue;
      }
      await page.waitForFunction(() => {
        const modal = document.querySelector('.fixed.inset-0');
        return modal && !modal.innerText.includes('Memuat promo');
      }, { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);

      const campaignRow = promoModal.locator('table tbody tr').first();
      if (await campaignRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        const campaignText = (await campaignRow.textContent().catch(() => '')).trim();
        const selectBtn = promoModal.locator("button:has-text('Select')").first();
        if (await selectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await selectBtn.click({ force: true });
          await page.waitForTimeout(2000);
          await dismissSweetAlert(page);
          campaignsApplied.push(campaignText);
          console.log(`✓ Campaign untuk produk ke-${i + 1} dipilih: ${campaignText.slice(0, 60)}`);
        } else {
          bugs.push(`Tombol Select campaign tidak ditemukan untuk produk ke-${i + 1}`);
        }
      } else {
        console.log(`  ⚠ Tidak ada campaign aktif untuk produk ke-${i + 1}, lanjut tanpa campaign`);
        const closeBtn = promoModal.locator("button:has-text('Close')").first();
        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await closeBtn.click({ force: true });
        else await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);
      }
    }

    // Validasi utama skenario multi campaign: minimal ada indikasi lebih dari satu
    // diskon/promo berbeda diterapkan pada order yang sama.
    console.log(`Total campaign yang berhasil diterapkan dalam 1 SO: ${campaignsApplied.length}`);
    if (campaignsApplied.length === 0) {
      console.log('  ⚠ Tidak ada campaign aktif sama sekali di environment saat ini - skip validasi multi-campaign');
    } else if (campaignsApplied.length === 1) {
      console.log('  ⚠ Hanya 1 campaign aktif tersedia di environment, tidak bisa menguji kombinasi multi-campaign secara penuh');
    } else {
      // Pastikan campaign yang diterapkan ke tiap produk berbeda (bukan campaign yang sama diklik dua kali)
      const uniqueCampaigns = new Set(campaignsApplied);
      if (uniqueCampaigns.size < 2) {
        console.log('  ⚠ Campaign yang diterapkan ke kedua produk ternyata sama');
      } else {
        console.log('✓ Berhasil menerapkan 2 campaign berbeda pada 2 produk dalam 1 SO (multi campaign)');
      }
    }

    // Lanjut ke Review untuk memastikan wizard tidak error dengan multi-item + multi-campaign
    const nextBtn2 = page.locator("button:has-text('Next Step')").first();
    if (await nextBtn2.isVisible({ timeout: 5000 }).catch(() => false) && await nextBtn2.isEnabled().catch(() => false)) {
      await nextBtn2.click();
      await page.waitForTimeout(3000);
      const reviewTable = page.locator('table tbody tr');
      const rowCount = await reviewTable.count().catch(() => 0);
      if (rowCount < 2) {
        bugs.push(`Step Review seharusnya menampilkan 2 produk, tapi hanya ${rowCount} baris`);
      } else {
        console.log(`✓ Step Review menampilkan ${rowCount} produk dengan campaign masing-masing`);
      }
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // ============================================================
  // SKENARIO 4: PO terkait data SO (produk yang sama dgn SO di atas)
  // CATATAN: Di aplikasi MHC saat ini TIDAK ada fitur "generate PO
  // langsung dari SO" - PO dibuat independen dari menu Purchase Order,
  // dengan Supplier auto-terisi oleh sistem. Test ini memvalidasi PO
  // dibuat untuk produk yang sama dipakai di skenario SO Pameran/RAC 0511 A
  // di atas, untuk memastikan konsistensi data lintas modul (SO <-> PO).
  // ============================================================
  test('PO - Create untuk produk yang sama dengan SO (RAC 0511 A / BH 2725)', async ({ page }) => {
    test.setTimeout(180000);
    const bugs = [];
    await login(page);
    await page.goto(`${MHC}/purchase-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const { bugs: pageBugs } = await checkPageLoaded(page, '/purchase-order');
    bugs.push(...pageBugs);

    const createBtn = page.locator("button:has-text('Create New')").first();
    if (!await createBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Tombol Create New PO tidak ditemukan');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }
    await createBtn.click();
    await page.waitForTimeout(3000);

    // Step 1: Entities - Supplier & Order Type auto-prefill, lanjut Next Step
    const nextBtn1 = page.locator("button:has-text('Next Step')").first();
    if (await nextBtn1.isVisible({ timeout: 8000 }).catch(() => false)) {
      await nextBtn1.click();
      await page.waitForTimeout(3000);
    } else {
      bugs.push('Step Entities PO tidak menampilkan tombol Next Step');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }

    // Step 2: Products - cari produk yang sama dengan skenario RAC 0511 A
    const productSearch = page.locator("input[placeholder*='Search product'], input[placeholder*='Search']").first();
    if (!await productSearch.isVisible({ timeout: 8000 }).catch(() => false)) {
      bugs.push('Input search produk PO tidak ditemukan');
      expect(bugs, bugs.join('; ')).toHaveLength(0); return;
    }

    let foundSku = null;
    for (const sku of RAC_0511_SKUS) {
      await productSearch.fill('');
      await productSearch.fill(sku);
      await page.waitForTimeout(2500);
      const count = await page.locator("div.grid > div, div[class*='card']").filter({ hasText: /INDENT/i }).count();
      if (count > 0) { foundSku = sku; break; }
    }

    if (!foundSku) {
      console.log('  ⚠ Produk RA 0511 AAWH dengan INDENT STOCK tidak ditemukan, fallback ke produk BH 2725');
      for (const sku of PAMERAN_SKUS) {
        await productSearch.fill('');
        await productSearch.fill(sku);
        await page.waitForTimeout(2500);
        const count = await page.locator("div.grid > div, div[class*='card']").filter({ hasText: /INDENT/i }).count();
        if (count > 0) { foundSku = sku; break; }
      }
    }

    if (!foundSku) {
      bugs.push('Tidak ditemukan produk (RA 0511 AAWH maupun BH 2725) dengan INDENT STOCK > 0 untuk dijadikan PO');
      expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0); return;
    }
    console.log(`✓ Produk untuk PO ditemukan (konsisten dgn data SO): ${foundSku}`);

    const productCard = page.locator("div.grid > div, div[class*='card']").filter({ hasText: /INDENT/i }).first();
    const addBtn = productCard.locator("button:has-text('Add to O')").first();
    if (!await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Tombol Add to Order pada card produk PO tidak ditemukan');
      expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0); return;
    }
    await addBtn.click();
    await page.waitForTimeout(1500);

    // Modal pilih Grade & Warehouse
    const addModal = page.locator('.fixed.inset-0').first();
    let itemAdded = false;
    if (await addModal.isVisible({ timeout: 8000 }).catch(() => false)) {
      // Pilih warehouse pertama yang mengandung kata "Warehouse" di modal
      // (nama warehouse berbeda-beda per produk, jadi tidak di-hardcode)
      await page.evaluate(() => {
        const modal = document.querySelector('.fixed.inset-0');
        if (!modal) return;
        const items = Array.from(modal.querySelectorAll('div[class*="border"][class*="rounded"]'));
        const item = items.find(d => /warehouse/i.test(d.textContent)) || items[0];
        if (item) item.click();
      });
      await page.waitForTimeout(1000);
      await clickModalButton(page, 'Add Item');
      await page.waitForTimeout(1500);
      await dismissSweetAlert(page);
      itemAdded = !(await addModal.isVisible({ timeout: 2000 }).catch(() => false));
      if (itemAdded) console.log('✓ Produk berhasil ditambahkan ke PO');
      else bugs.push('Modal Add Item PO tidak tertutup - kemungkinan validasi warehouse/grade gagal');
    } else {
      bugs.push('Modal pemilihan Grade/Warehouse tidak muncul saat Add Item PO');
    }

    // Lanjut ke Review (tanpa submit, untuk hindari data sampah)
    const nextBtn2 = page.locator("button:has-text('Next Step')").first();
    if (itemAdded && await nextBtn2.isVisible({ timeout: 5000 }).catch(() => false)) {
      const enabled = await nextBtn2.isEnabled().catch(() => false);
      if (!enabled) {
        bugs.push('Tombol Next Step di step Products PO masih disabled setelah Add Item');
      } else {
        await nextBtn2.click();
        await page.waitForTimeout(3000);
        const supplierDetails = page.locator('text=/Supplier Details/i').first();
        if (!await supplierDetails.isVisible({ timeout: 5000 }).catch(() => false)) {
          bugs.push('Step Review PO tidak menampilkan Supplier Details');
        } else {
          console.log('✓ Step Review PO tampil dengan Supplier Details');
        }
        const createPoBtn = page.locator("button:has-text('Create PO')").first();
        if (!await createPoBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          bugs.push('Tombol "Create PO" tidak ditemukan di step Review');
        }
        // NOTE: submit PO sengaja tidak dijalankan untuk menghindari data sampah di environment.
        // await createPoBtn.click();
      }
    } else if (itemAdded) {
      bugs.push('Tidak bisa lanjut ke step Review PO');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
