/**
 * Xendit Payment Helper — Handles Payment Gateway flow with Virtual Account BCA
 * and executes simulation via "Click here to simulate your payment with BCA".
 */

export class XenditHelper {
  /**
   * Process payment via Xendit -> Bank Transfer -> VA BCA -> Simulate Payment
   * @param {import('@playwright/test').Page} page
   * @param {import('./stepAnnotation.js').StepAnnotation} ann
   * @param {import('./screenshotHelper.js').ScreenshotHelper} ss
   */
  static async payWithXenditBCA(page, ann, ss) {
    ann.step('Xendit Payment — Generate Invoice');

    // Scroll to Detail Pembayaran
    await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      for (const el of all) {
        if (el.scrollHeight > el.clientHeight && el.clientHeight > 200) {
          el.scrollTop = el.scrollHeight;
        }
      }
    });
    await page.waitForTimeout(1500);

    // Select PAYMENT GATEWAY if dropdown is available
    const payTypeSelect = page.locator('select').first();
    if (await payTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await payTypeSelect.selectOption('PAYMENT GATEWAY').catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Click "Buat Pembayaran" button
    const buatPayBtn = page.locator("button:has-text('Buat Pembayaran')").first();
    if (await buatPayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await buatPayBtn.click();
      await page.waitForTimeout(4000);
      ann.success('Invoice Payment Gateway berhasil dibuat');
    }

    await ss.capture('xendit-invoice-generated');

    // Find "Buka Link Pembayaran Invoice"
    ann.step('Open Xendit Checkout Page');
    const invoiceLink = page.locator('a:has-text("Buka Link Pembayaran Invoice"), a[href*="xendit.co"]').first();
    const invoiceVisible = await invoiceLink.isVisible({ timeout: 8000 }).catch(() => false);

    if (!invoiceVisible) {
      ann.warn('Link invoice Xendit tidak ditemukan pada card pembayaran');
      return false;
    }

    const xenditUrl = await invoiceLink.getAttribute('href');
    const currentMoreUrl = page.url();

    // Navigate on SAME page so Playwright video recorder captures the full payment screen
    if (xenditUrl) {
      ann.success(`Membuka Xendit Checkout di tab yang sama: ${xenditUrl}`);
      await page.goto(xenditUrl, { waitUntil: 'domcontentloaded' });
    } else {
      await invoiceLink.click({ force: true });
    }
    await page.waitForTimeout(4000);

    await ss.capture('xendit-checkout-loaded');

    // ═══ STEP: SELECT BANK TRANSFER & BCA ═══
    ann.step('Select Payment Method', 'Bank Transfer -> VA BCA');

    // Click Bank Transfer accordion
    const bankTransfer = page.locator('text=Bank Transfer').first();
    if (await bankTransfer.isVisible({ timeout: 6000 }).catch(() => false)) {
      await bankTransfer.click();
      await page.waitForTimeout(1500);
      ann.success('Metode Bank Transfer dipilih');
    }

    // Click BCA logo tile (using visible selector)
    const bcaTile = page.locator('img[alt="BCA"]:visible, div:has(> img[alt="BCA"]):visible, [aria-label*="BCA"]:visible').first();
    if (await bcaTile.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bcaTile.click({ force: true });
      await page.waitForTimeout(3000);
      ann.success('Virtual Account BCA dipilih');
    } else {
      // Fallback: try click text BCA
      await page.locator('text=BCA').first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(3000);
    }

    await ss.capture('xendit-va-bca-selected');

    // ═══ STEP: CLICK SIMULATOR LINK ABOVE IT ═══
    ann.step('Simulate Payment BCA', 'Click link: "Click here to simulate your payment with BCA"');

    const simLink = page.locator('text=/Click here to simulate your payment/i').first();
    const simVisible = await simLink.isVisible({ timeout: 6000 }).catch(() => false);

    if (simVisible) {
      // Click simulation link directly
      await simLink.click({ force: true });
      await page.waitForTimeout(3500);
      ann.success('Link simulasi pembayaran BCA diklik');
    } else {
      ann.warn('Link simulasi pembayaran tidak ditemukan di atas kartu BCA');
    }

    await ss.capture('xendit-payment-simulation-completed');

    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (bodyText.includes('Payment simulation completed') || bodyText.includes('completed')) {
      ann.success('Status Xendit: Payment simulation completed!');
    }

    // Pause so the video viewer clearly sees the simulation result
    await page.waitForTimeout(3500);

    // Return back to MoRe detail page so video tutorial shows the complete journey
    if (currentMoreUrl) {
      ann.step('Return to MoRe Sales Order');
      await page.goto(currentMoreUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(3000);
      await ss.capture('more-returned-after-payment');
      ann.success('Kembali ke MoRe Sales Order detail');
    }

    return true;
  }
}
