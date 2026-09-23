/**
 * Screenshot Helper — Organised screenshots per test case
 *
 * Creates structured screenshot folders:
 *   screenshots/TC-SO-001/01-login.png
 *   screenshots/TC-SO-001/02-sales-order-page.png
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');

export class ScreenshotHelper {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} testCaseId — e.g. 'TC-SO-001'
   */
  constructor(page, testCaseId) {
    this.page = page;
    this.testCaseId = testCaseId;
    this.stepCounter = 0;
    this.dir = path.join(SCREENSHOTS_DIR, testCaseId);

    // Ensure directory exists
    fs.mkdirSync(this.dir, { recursive: true });
  }

  /**
   * Take a screenshot with an auto-numbered filename.
   * @param {string} label — e.g. 'login', 'customer-selected'
   * @param {object} [opts] — extra Playwright screenshot options
   * @returns {string} absolute path of the saved file
   */
  async capture(label, opts = {}) {
    this.stepCounter++;
    const paddedNum = String(this.stepCounter).padStart(2, '0');
    const filename = `${paddedNum}-${label}.png`;
    const filepath = path.join(this.dir, filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: true,
      ...opts,
    });

    console.log(`  📸 Screenshot: ${this.testCaseId}/${filename}`);
    return filepath;
  }

  /** Returns the directory where screenshots are stored */
  getDir() {
    return this.dir;
  }
}
