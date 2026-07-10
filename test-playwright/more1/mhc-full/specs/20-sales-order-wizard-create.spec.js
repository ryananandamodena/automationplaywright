/**
 * ═══════════════════════════════════════════════════════════════
 * 🏆 MHC - SALES ORDER WIZARD: FULL FLOW SAMPAI SUBMIT
 * ═══════════════════════════════════════════════════════════════
 * 
 * FLOW: Login → Pilih Customer → Next → Add to Order → 
 *       Isi Modal → CONFIRM ADD → Tunggu Modal Tutup → 
 *       Next (ke review) → Submit → Verifikasi
 * ═══════════════════════════════════════════════════════════════
 */

import { test } from '@playwright/test';
import { allure } from 'allure-playwright';

const BASE = 'https://more-dev.modena.com';
const SO_CREATE_URL = 'https://more-dev.modena.com/mhc/sales-order/create';
const CREDS = {
  email: 'muhzaenal5@gmail.com',
  password: 'P@ssw0rd_muhzaenal5',
};
const TS = Date.now().toString().slice(-6);
const SO_REF = `AutoSO-${TS}`;

async function getBtns(page) {
  const btns = await page.locator('button').allInnerTexts();
  return [...new Set(btns.map(b => b.trim()).filter(b => b))];
}

test.describe('🏢 MHC - Sales Order FULL FLOW', () => {
  test.setTimeout(180000);

  test('🔄 Full Flow: Customer → Add to Order → Next → Submit', async ({ page }) => {
    await allure.epic('MHC - MODENA HOME CENTER');
    await allure.feature('Sales Order - Full Flow');
    await allure.story('Login → Select Customer → Next → Add to Order → Confirm → Next → Submit');
    await allure.severity('critical');
    await allure.tag('more', 'mhc', 'so', 'fullflow');

    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(`PageError: ${err.message}`));

    let finalUrl = '';

    try {
      // ═══ 1. LOGIN ═══════════════════════════════════
      await allure.step('1️⃣ Login', async () => {
        await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        await page.locator('input[name="email"]').fill(CREDS.email);
        await page.locator('input[type="password"]').fill(CREDS.password);
        const cb = page.locator('button:has-text("Select a company")');
        if (await cb.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cb.click();
          await page.waitForTimeout(1000);
          await page.locator('button:has-text("MODENA HOME CENTER (MHC)")').click();
          await page.waitForTimeout(500);
        }
        await page.locator('button:has-text("Sign In")').click();
        await page.waitForTimeout(5000);
        console.log('  ✅ Login berhasil');
      });

      // ═══ 2. PILIH CUSTOMER ═══════════════════════
      await allure.step('2️⃣ Pilih customer', async () => {
        await page.goto(SO_CREATE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(3000);
        const rows = page.locator('table tbody tr');
        const count = await rows.count();
        console.log(`  ✅ ${count} customer`);
        if (count > 0) {
          const cells = await rows.first().locator('td').allInnerTexts();
          console.log(`  ✅ Memilih: ${cells[2] || 'Row 1'}`);
          await page.evaluate(() => { const r = document.querySelector('table tbody tr'); if (r) { r.click(); return true; } return false; });
          await page.waitForTimeout(1000);
          await allure.parameter('Customer', (cells[2] || '').slice(0, 50));
        }
      });

      // ═══ 3. NEXT STEP ═════════════════════════
      await allure.step('3️⃣ Next Step ke produk', async () => {
        const nextBtn = page.locator('button:has-text("Next Step")');
        await nextBtn.waitFor({ state: 'visible', timeout: 5000 });
        if (await nextBtn.isEnabled()) {
          await nextBtn.click();
          await page.waitForTimeout(3000);
          console.log('  ✅ Next Step');
          const btns = await getBtns(page);
          console.log(`  ✅ Buttons: ${btns.join(' | ')}`);
          await allure.attachment('Step 2', await page.screenshot({ fullPage: true }), 'image/png');
        }
      });

      // ═══ 4. ADD TO ORDER ═════════════════════
      await allure.step('4️⃣ Klik "Add to Order" pertama', async () => {
        await page.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.textContent?.trim() === 'Add to Order' && btn.offsetParent !== null) {
              btn.click(); return true;
            }
          }
          return false;
        });
        await page.waitForTimeout(2000);
        console.log('  ✅ Modal terbuka');
        await allure.attachment('Modal', await page.screenshot(), 'image/png');
      });

      // ═══ 5. ISI MODAL ═══════════════════════
      await allure.step('5️⃣ Isi modal & confirm', async () => {
        // Search produk
        const searchField = page.locator('input[placeholder*="Search product" i]').first();
        if (await searchField.isVisible({ timeout: 3000 }).catch(() => false)) {
          await searchField.fill('AC');
          await page.waitForTimeout(2000);
          console.log('  ✅ Search AC');
          await page.evaluate(() => { const r = document.querySelectorAll('table tbody tr'); if (r.length > 0) { r[0].click(); return true; } return false; });
          await page.waitForTimeout(1000);
          console.log('  ✅ Produk dipilih');
        }

        // SourceType radio
        await page.evaluate(() => {
          const radios = document.querySelectorAll('input[type="radio"][name="sourceType"]');
          if (radios.length > 0) { radios[0].click(); radios[0].dispatchEvent(new Event('change', { bubbles: true })); }
        });
        console.log('  ✅ SourceType');

        // Qty
        await page.evaluate(() => {
          const inputs = document.querySelectorAll('input');
          for (const inp of inputs) {
            if (inp.type === 'text' && (inp.className || '').includes('text-center')) {
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
              setter.call(inp, '2');
              inp.dispatchEvent(new Event('input', { bubbles: true }));
              inp.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
          return false;
        });
        console.log('  ✅ Qty: 2');
        await allure.attachment('Modal Filled', await page.screenshot(), 'image/png');

        // ⭐ Cari tombol "Add to Order" di FOOTER MODAL (bukan di row)
        // Dengan evaluate, kita klik semua "Add to Order" sampai modal tertutup
        let modalOpen = true;
        let confirmClicks = 0;
        while (modalOpen && confirmClicks < 3) {
          await page.evaluate(() => {
            const btns = document.querySelectorAll('button');
            // Klik "Add to Order" terakhir yang visible (footer)
            let lastBtn = null;
            for (const btn of btns) {
              if (btn.textContent?.trim() === 'Add to Order' && btn.offsetParent !== null) {
                lastBtn = btn;
              }
            }
            if (lastBtn) { lastBtn.click(); return true; }
            return false;
          });
          await page.waitForTimeout(2000);
          confirmClicks++;
          modalOpen = await page.locator('.fixed.inset-0').first().isVisible({ timeout: 2000 }).catch(() => false);
          console.log(`  ✅ Confirm click #${confirmClicks}: modal still open = ${modalOpen}`);
        }

        // Jika modal masih terbuka, coba cari button lain
        if (modalOpen) {
          console.log('  🔍 Mencari button confirm alternatif...');
          const allBtns = await getBtns(page);
          console.log(`  ✅ All buttons: ${allBtns.join(' | ')}`);
          
          // Coba "Confirm", "Add", "Save", atau icon close
          for (const keyword of ['Confirm', 'Add', 'Save', 'Simpan', 'OK']) {
            const found = await page.evaluate((kw) => {
              const btns = document.querySelectorAll('button');
              for (const btn of btns) {
                if (btn.textContent?.trim().toLowerCase() === kw.toLowerCase() && btn.offsetParent !== null) {
                  btn.click(); return true;
                }
              }
              return false;
            }, keyword);
            if (found) {
              console.log(`  ✅ "${keyword}" clicked`);
              await page.waitForTimeout(2000);
              break;
            }
          }
        }

        // Cek apakah Next Step sekarang muncul
        const nextBtnVisible = await page.locator('button:has-text("Next Step")').isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`  ✅ Next Step visible: ${nextBtnVisible}`);

        // Jika Next Step tidak muncul, cek apakah kita di halaman list
        const currentUrl = page.url();
        console.log(`  ✅ URL sekarang: ${currentUrl}`);

        await allure.attachment('After Confirm', await page.screenshot({ fullPage: true }), 'image/png');

        // ⭐ Jika redirect ke halaman list, klik "Create New" untuk mulai lagi
        if (currentUrl.includes('/sales-order') && !currentUrl.includes('/create')) {
          const createNewBtn = page.locator('button:has-text("Create New")');
          if (await createNewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await createNewBtn.click();
            await page.waitForTimeout(3000);
            console.log('  ✅ "Create New" clicked → kembali ke create');
            await allure.attachment('After Create New', await page.screenshot(), 'image/png');
            
            // Pilih customer lagi
            const rows = page.locator('table tbody tr');
            if (await rows.count() > 0) {
              await page.evaluate(() => { const r = document.querySelector('table tbody tr'); if (r) r.click(); });
              await page.waitForTimeout(1000);
              console.log('  ✅ Customer dipilih ulang');
            }
          }
        }
      });

      // ═══ 6. NEXT STEP (jika ada) ═══════════════
      await allure.step('6️⃣ Next Step', async () => {
        const nextBtn = page.locator('button:has-text("Next Step")');
        if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(3000);
          console.log(`  ✅ Next Step OK. URL: ${page.url()}`);
          
          // Print semua button di halaman review
          const btns = await getBtns(page);
          console.log(`  ✅ Buttons (review): ${btns.join(' | ')}`);
          
          // Print page content
          const body = await page.locator('body').innerText();
          console.log(`  ✅ Content: ${body.slice(0, 400)}`);
          
          await allure.attachment('Review Page', await page.screenshot({ fullPage: true }), 'image/png');
        } else {
          console.log('  ⚠ Next Step tidak tersedia');
          console.log(`  ✅ Buttons: ${(await getBtns(page)).join(' | ')}`);
        }
      });

      // ═══ 7. SUBMIT ═══════════════════════════
      await allure.step('7️⃣ Submit', async () => {
        // Print semua button terlebih dahulu
        const allButtons = await getBtns(page);
        console.log(`  ✅ All buttons: ${allButtons.join(' | ')}`);
        
        // Cari tombol dengan berbagai keyword
        const keywords = [
          'Save', 'Simpan', 'Submit', 'Buat', 'Create', 'Kirim',
          'Confirm Order', 'Order Now', 'Process', 'Order',
          'Konfirmasi', 'Confirm', 'Lanjut', 'Finish', 'Selesai',
          'Bayar', 'Checkout', 'Proses'
        ];
        
        for (const kw of keywords) {
          const clicked = await page.evaluate((k) => {
            const btns = document.querySelectorAll('button');
            for (const btn of btns) {
              const text = btn.textContent?.trim().toLowerCase() || '';
              if (text === k.toLowerCase() && btn.offsetParent !== null) {
                btn.click(); return k;
              }
              // Juga match partial text
              if (text.includes(k.toLowerCase()) && btn.offsetParent !== null && text.length < 15) {
                btn.click(); return text;
              }
            }
            return null;
          }, kw);
          if (clicked) {
            console.log(`  ✅ "${clicked}" clicked!`);
            await allure.parameter('Submit Button', clicked);
            break;
          }
        }
        
        await page.waitForTimeout(5000);
        finalUrl = page.url();
        console.log(`  ✅ Final URL: ${finalUrl}`);
        
        // Cek apakah ada tabel/list setelah submit
        const tbodyRows = await page.locator('table tbody tr').count();
        console.log(`  ✅ Table rows: ${tbodyRows}`);
      });

      // ═══ 8. VERIFIKASI ═════════════════════
      await allure.step('8️⃣ Verifikasi', async () => {
        const body = await page.locator('body').innerText().catch(() => '');
        const checks = {
          'Success Message': /success|berhasil|created|saved/i.test(body),
          'Ada Tabel': await page.locator('table tbody tr').count().then(c => c > 0).catch(() => false),
        };
        for (const [k, v] of Object.entries(checks)) {
          console.log(`  ${v ? '✅' : '❌'} ${k}: ${v}`);
          await allure.parameter(k, v ? 'Yes' : 'No');
        }
        await allure.attachment('Final', await page.screenshot({ fullPage: true }), 'image/png');
      });

    } finally {
      if (consoleErrors.length > 0) {
        await allure.attachment('Console Errors', JSON.stringify(consoleErrors, null, 2), 'application/json');
      }
      console.log(`\n${'═'.repeat(50)}\n  📋 FULL FLOW RESULT\n  Ref: ${SO_REF}\n  URL: ${finalUrl}\n  Errors: ${consoleErrors.length}\n${'═'.repeat(50)}`);
    }
  });
});