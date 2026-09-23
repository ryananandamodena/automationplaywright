/**
 * Campaign Helper — Automates applying discount campaigns on SO and PO creation wizards.
 */

import { dismissSweetAlert } from './loginHelper.js';

export class CampaignHelper {
  /**
   * Apply an active campaign to the added product
   * @param {import('@playwright/test').Page} page
   * @param {import('./stepAnnotation.js').StepAnnotation} ann
   * @param {import('./screenshotHelper.js').ScreenshotHelper} ss
   */
  static async applyCampaign(page, ann, ss) {
    ann.step('Apply Campaign / Promo Diskon');

    await page.waitForTimeout(1000);

    // Look for Promo/Campaign button in the selected item table
    const promoBtn = page.locator('button[title*="Promo" i], button:has-text("Promo"), button:has-text("Campaign"), button:has-text("Diskon")').first();
    const isPromoBtnVisible = await promoBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (isPromoBtnVisible) {
      await promoBtn.click({ force: true });
      await page.waitForTimeout(1500);

      // Modal Available Promotions / Promo Tersedia
      const promoModal = page.locator('.fixed.inset-0').filter({ hasText: /Promo Tersedia|Available Promotions|Campaign/i }).first();
      if (await promoModal.isVisible({ timeout: 8000 }).catch(() => false)) {
        // Wait for promo loading to finish
        await page.waitForFunction(() => {
          const m = document.querySelector('.fixed.inset-0');
          return m && !m.innerText.includes('Memuat promo') && !m.innerText.includes('Loading');
        }, { timeout: 10000 }).catch(() => {});
        await page.waitForTimeout(1000);

        await ss.capture('campaign-modal-open');

        // Prioritize campaign explicitly granting discount to BH 2725 (e.g. Promo Reguler 3% Q3 2026 or Campaign Q3)
        let targetCampaignRow = promoModal.locator('tr').filter({ hasText: /BH 2725|Promo Reguler 3%|Campaign Q3 2026 Add 10%/i }).first();
        if (!await targetCampaignRow.isVisible({ timeout: 2000 }).catch(() => false)) {
          targetCampaignRow = promoModal.locator('table tbody tr').first();
        }

        if (await targetCampaignRow.isVisible({ timeout: 4000 }).catch(() => false)) {
          const campaignText = (await targetCampaignRow.textContent().catch(() => '')).trim();
          ann.success(`Campaign diskon dipilih: ${campaignText.slice(0, 60)}`);

          const selectBtn = targetCampaignRow.locator("button:has-text('Pilih'), button:has-text('Select')").first();
          if (await selectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await selectBtn.click({ force: true });
            await page.waitForTimeout(2000);
            await dismissSweetAlert(page);
            ann.success('Campaign diskon berhasil diterapkan!');
          }
        } else {
          ann.warn('Tidak ada baris campaign aktif di modal, menutup modal...');
          const closeBtn = promoModal.locator("button:has-text('Tutup'), button:has-text('Close')").first();
          if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) await closeBtn.click({ force: true });
          else await page.keyboard.press('Escape').catch(() => {});
        }
      }
    } else {
      ann.warn('Tombol Promo/Campaign tidak ditemukan pada item ini');
    }

    await ss.capture('campaign-applied');
    return true;
  }
}
