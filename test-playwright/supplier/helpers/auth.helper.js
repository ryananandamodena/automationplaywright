import { createWorker } from 'tesseract.js';
import fs from 'fs';
import path from 'path';

let sharedWorker = null;
const STORAGE_STATE_PATH = './supplier/storageState-supplier.json';

export async function getOCRWorker() {
  if (!sharedWorker) {
    sharedWorker = await createWorker('eng');
    await sharedWorker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    });
  }
  return sharedWorker;
}

export async function solveCaptcha(page) {
  const worker = await getOCRWorker();
  const captchaEl = page.locator('#captchaImage');
  await captchaEl.waitFor({ state: 'visible', timeout: 5000 });
  const buffer = await captchaEl.screenshot();
  const ret = await worker.recognize(buffer);
  const text = ret.data.text.replace(/[^a-zA-Z0-9]/g, '').trim();
  return text;
}

export async function loginSupplier(page, username = 'adm1', password = '1357', maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await page.goto('https://supplier.modena.com/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    if (!page.url().includes('/login')) {
      return true;
    }

    await page.fill('#username', username);
    await page.fill('#password', password);

    const captcha = await solveCaptcha(page);
    await page.fill('#captcha', captcha);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);

    await page.waitForTimeout(1000);

    if (!page.url().includes('/login')) {
      // Save session state for reuse
      try {
        const cookies = await page.context().cookies();
        fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(cookies, null, 2));
      } catch (e) {}
      return true;
    }

    // Refresh captcha for next attempt
    await page.click('#btnRefreshCaptcha').catch(() => {});
    await page.waitForTimeout(600);
  }

  throw new Error(`Gagal login setelah ${maxRetries} percobaan`);
}

export async function applySessionIfAvailable(context) {
  if (fs.existsSync(STORAGE_STATE_PATH)) {
    try {
      const cookies = JSON.parse(fs.readFileSync(STORAGE_STATE_PATH, 'utf8'));
      await context.addCookies(cookies);
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

export async function closeOCRWorker() {
  if (sharedWorker) {
    await sharedWorker.terminate();
    sharedWorker = null;
  }
}
