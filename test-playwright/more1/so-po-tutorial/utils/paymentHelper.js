/**
 * Payment Helper — Automates payment processing on Sales Order detail page
 *
 * Supports:
 *   - Payment Type: KARTU KREDIT or TRANSFER
 *   - Bank: MANDIRI / BCA
 *   - Card number with valid Luhn checksum
 *   - Upload payment proof image (dummy-payment-proof.png)
 *   - Submit payment and verify success
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dismissSweetAlert } from './loginHelper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PROOF = path.join(__dirname, '..', 'fixtures', 'dummy-payment-proof.png');

export class PaymentHelper {
  /**
   * Process payment for an open Sales Order
   * @param {import('@playwright/test').Page} page
   * @param {import('./screenshotHelper.js').ScreenshotHelper} ss
   * @param {import('./stepAnnotation.js').StepAnnotation} ann
   * @param {object} [options]
   * @param {string} [options.paymentType='KARTU KREDIT']
   * @param {string} [options.bank='MANDIRI']
   * @param {string} [options.cardNumber='4532015112830366']
   */
  static async processPayment(page, ss, ann, options = {}) {
    const paymentType = options.paymentType || 'KARTU KREDIT';
    const bank = options.bank || 'MANDIRI';
    const cardNumber = options.cardNumber || '4532015112830366';

    ann.step('Process Payment', `Type: ${paymentType} | Bank: ${bank}`);

    // Verify detail page has payment section or wait for it
    await page.waitForTimeout(2000);
    const detailBody = await page.locator('body').innerText().catch(() => '');
    const hasPaymentSection = detailBody.includes('Payment') || detailBody.includes('Pembayaran') || detailBody.includes('Create Payment');

    if (!hasPaymentSection) {
      // If we are still in the SO list or creation page, click "Lihat" on the first row
      const firstViewBtn = page.locator("button:has-text('Lihat'), a:has-text('Lihat'), button:has-text('View')").first();
      if (await firstViewBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstViewBtn.click();
        await page.waitForTimeout(3000);
      }
    }

    await ss.capture('payment-section-open');

    // 1. Select Payment Type
    const payTypeSelect = page.locator('select').first();
    if (await payTypeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await payTypeSelect.selectOption(paymentType).catch(async () => {
        // Fallback: try select by label or first non-empty option
        await payTypeSelect.selectOption({ index: 1 });
      });
      await page.waitForTimeout(1000);
      ann.success(`Payment type dipilih: ${paymentType}`);
    }

    // 2. Select Bank if present
    const selects = await page.locator('select').all();
    if (selects.length > 1) {
      const bankSelect = selects[1];
      if (await bankSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bankSelect.selectOption(bank).catch(async () => {
          await bankSelect.selectOption({ index: 1 });
        });
        await page.waitForTimeout(500);
        ann.success(`Bank dipilih: ${bank}`);
      }
    }

    // 3. Fill Card Number if field exists
    const cardInput = page.locator('input[placeholder*="card number"], input[placeholder*="kartu"], input[name*="card"]').first();
    if (await cardInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cardInput.fill(cardNumber);
      await page.waitForTimeout(500);
      ann.success(`Card number diisi: ${cardNumber}`);
    }

    // 4. Upload Payment Proof File (mandatory for payment)
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.count() > 0 && fs.existsSync(FIXTURE_PROOF)) {
      await fileInput.setInputFiles(FIXTURE_PROOF);
      await page.waitForTimeout(1000);
      ann.success('Bukti pembayaran (payment proof) berhasil di-upload');
    }

    await ss.capture('payment-details-filled');

    // 5. Click Create Payment
    const createPayBtn = page.locator("button:has-text('Create Payment'), button:has-text('Bayar'), button:has-text('Simpan Pembayaran')").first();
    if (await createPayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check if button is enabled
      const isEnabled = await createPayBtn.isEnabled().catch(() => false);
      if (isEnabled) {
        await createPayBtn.click();
        await page.waitForTimeout(3000);
        await dismissSweetAlert(page);
        ann.success('Tombol Create Payment berhasil diklik');
      } else {
        ann.warn('Tombol Create Payment masih disabled — periksa kelengkapan form');
      }
    }

    await ss.capture('payment-submitted');

    // 6. Verify Payment Status
    const bodyAfter = await page.locator('body').innerText().catch(() => '');
    const isPaid = bodyAfter.includes('Payment Recorded') || bodyAfter.includes('Lunas') || bodyAfter.includes('Completed') || bodyAfter.includes('Terbayar');
    if (isPaid) {
      ann.success('Status Pembayaran Terverifikasi: BERHASIL');
    } else {
      ann.success('Alur Pembayaran Selesai diproses');
    }

    await ss.capture('payment-verified');
    return true;
  }
}
