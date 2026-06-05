import { test, expect } from '@playwright/test';
import { login } from '../helpers/login.js';

const BASE = 'https://mhc-dev.modena.com';

test('DEBUG: Dump Selected Items DOM setelah add produk', async ({ page }) => {
  test.setTimeout(120000);

  await login(page);
  await page.goto(`${BASE}/sales-order`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Create New
  await page.locator("button:has-text('Create New')").first().click();
  await page.waitForTimeout(3000);

  // Pilih customer pertama
  const rows = page.locator('table tbody tr');
  await rows.first().click();
  await page.waitForTimeout(2000);

  // Next Step → Products
  await page.locator("button:has-text('Next Step')").first().click();
  await page.waitForTimeout(3000);

  // Search & Add produk BH2725
  const searchInput = page.locator("input[placeholder*='Search product']").first();
  await searchInput.fill('BH2725');
  await page.waitForTimeout(2500);

  // Klik Add to Order pada card pertama
  const card = page.locator('div.grid > div').first();
  const addBtn = card.locator("button:has-text('Add to O')").first();
  await addBtn.click();
  await page.waitForTimeout(2000);

  // Di modal: pilih Ready, qty=2, lalu Add to Order
  const modal = page.locator('.fixed.inset-0').filter({ hasText: /Add to Order/i }).first();
  
  // Pilih Warehouse Ready
  const labels = modal.locator('label');
  const lc = await labels.count();
  for (let j = 0; j < lc; j++) {
    const lt = (await labels.nth(j).textContent().catch(() => '')).trim();
    if (/warehouse ready/i.test(lt)) {
      await labels.nth(j).click({ force: true });
      break;
    }
  }
  await page.waitForTimeout(500);

  // Set qty = 2
  await page.evaluate(() => {
    const modals = document.querySelectorAll('[class*="fixed"]');
    for (const m of modals) {
      if (!m.innerText.includes('Add to Order')) continue;
      const inputs = m.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"])');
      for (const inp of inputs) {
        if (inp.offsetParent === null) continue;
        const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSet.call(inp, '2');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
  });
  await page.waitForTimeout(300);

  // Klik Add to Order
  await modal.locator("button:has-text('Add to Order')").last().click();
  await modal.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(2000);

  console.log('\n' + '='.repeat(80));
  console.log('=== DUMP SELECTED ITEMS AREA ===');
  console.log('='.repeat(80));

  // Screenshot setelah item ditambah
  await page.screenshot({ path: 'test-results/debug-after-add-item.png', fullPage: true });

  // Dump semua section yang mungkin berisi Selected Items
  const bodyHTML = await page.evaluate(() => {
    // Cari section "Selected Items"
    const allElements = document.querySelectorAll('*');
    let selectedSection = null;
    for (const el of allElements) {
      if (el.textContent && el.textContent.includes('Selected Items') && el.children.length > 0) {
        // Ambil parent yang cukup besar
        if (el.innerHTML.length > 100 && el.innerHTML.length < 10000) {
          selectedSection = el;
          break;
        }
      }
    }
    if (selectedSection) {
      return { found: true, html: selectedSection.innerHTML.slice(0, 5000), tag: selectedSection.tagName, className: selectedSection.className };
    }
    
    // Fallback: cari table yang visible
    const tables = document.querySelectorAll('table');
    const tableInfo = [];
    for (const t of tables) {
      if (t.offsetParent === null) continue;
      tableInfo.push({ html: t.outerHTML.slice(0, 3000), rows: t.querySelectorAll('tr').length });
    }
    return { found: false, tables: tableInfo };
  });

  console.log('Selected Section Found:', bodyHTML.found);
  if (bodyHTML.found) {
    console.log('Tag:', bodyHTML.tag, '| Class:', bodyHTML.className);
    console.log('HTML:\n', bodyHTML.html);
  } else {
    console.log('Tables on page:', bodyHTML.tables?.length);
    for (let i = 0; i < (bodyHTML.tables?.length || 0); i++) {
      console.log(`\n--- Table ${i} (${bodyHTML.tables[i].rows} rows) ---`);
      console.log(bodyHTML.tables[i].html.slice(0, 2000));
    }
  }

  // Juga dump semua input yang visible di page (bukan di modal)
  console.log('\n' + '='.repeat(80));
  console.log('=== ALL VISIBLE INPUTS ON PAGE (setelah modal tutup) ===');
  console.log('='.repeat(80));

  const allInputs = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    const results = [];
    for (const inp of inputs) {
      if (inp.offsetParent === null) continue; // hidden
      results.push({
        type: inp.type,
        placeholder: inp.placeholder,
        value: inp.value,
        name: inp.name,
        id: inp.id,
        className: inp.className.slice(0, 80),
        parentText: inp.parentElement?.textContent?.trim().slice(0, 60) || '',
      });
    }
    return results;
  });

  for (let i = 0; i < allInputs.length; i++) {
    const inp = allInputs[i];
    console.log(`  input[${i}]: type="${inp.type}" ph="${inp.placeholder}" val="${inp.value}" name="${inp.name}" id="${inp.id}"`);
    console.log(`    class: ${inp.className}`);
    console.log(`    parent: ${inp.parentText}`);
  }

  // Coba add item kedua dari card yang SAMA (index 0) tapi pilih Indent
  console.log('\n' + '='.repeat(80));
  console.log('=== COBA ADD ITEM 2 DARI CARD YANG SAMA (Indent) ===');
  console.log('='.repeat(80));

  await searchInput.fill('');
  await searchInput.fill('BH2725');
  await page.waitForTimeout(2500);

  const card2 = page.locator('div.grid > div').first();
  const addBtn2 = card2.locator("button:has-text('Add to O')").first();
  if (await addBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addBtn2.click();
    await page.waitForTimeout(2000);

    const modal2 = page.locator('.fixed.inset-0').filter({ hasText: /Add to Order/i }).first();
    if (await modal2.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Modal terbuka lagi untuk card yang sama');

      // Pilih Warehouse Indent
      const labels2 = modal2.locator('label');
      const lc2 = await labels2.count();
      for (let j = 0; j < lc2; j++) {
        const lt = (await labels2.nth(j).textContent().catch(() => '')).trim();
        if (/warehouse indent/i.test(lt)) {
          await labels2.nth(j).click({ force: true });
          console.log(`✓ Klik label: ${lt}`);
          break;
        }
      }
      await page.waitForTimeout(500);

      // Set qty = 2
      await page.evaluate(() => {
        const modals = document.querySelectorAll('[class*="fixed"]');
        for (const m of modals) {
          if (!m.innerText.includes('Add to Order')) continue;
          const inputs = m.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"])');
          for (const inp of inputs) {
            if (inp.offsetParent === null) continue;
            const nativeSet = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSet.call(inp, '2');
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            return;
          }
        }
      });
      await page.waitForTimeout(300);

      // Klik Add to Order
      const addBtn3 = modal2.locator("button:has-text('Add to Order')").last();
      const enabled = await addBtn3.isEnabled({ timeout: 3000 }).catch(() => false);
      console.log(`Add to Order button enabled: ${enabled}`);
      if (enabled) {
        await addBtn3.click({ force: true });
        await modal2.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(2000);
        console.log('✓ Item 2 (Indent) berhasil ditambahkan dari card yang sama');
      } else {
        console.log('⚠ Add to Order disabled — mungkin stok Indent = 0');
        // Screenshot
        await page.screenshot({ path: 'test-results/debug-indent-disabled.png' });
      }
    } else {
      console.log('⚠ Modal tidak muncul saat klik card kedua kali');
    }
  } else {
    console.log('⚠ Tombol Add to Order tidak visible pada card');
  }

  // Final screenshot
  await page.screenshot({ path: 'test-results/debug-after-2items.png', fullPage: true });
  console.log('\n✅ Debug selesai');
});
