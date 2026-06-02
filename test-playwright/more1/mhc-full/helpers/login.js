// Shared login helper - digunakan oleh semua spec
const BASE_URL = 'https://mhc-dev.modena.com';
const LOGIN_EMAIL = 'muhzaenal5@gmail.com';
const LOGIN_PASSWORD = 'P@ssw0rd';

export async function login(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.locator('input[type="email"]').fill(LOGIN_EMAIL);
  await page.locator('input[type="password"]').fill(LOGIN_PASSWORD);
  await page.locator("button:has-text('Login')").click();
  await page.waitForTimeout(4000);
  // Tunggu dashboard/header muncul
  await page.waitForSelector('aside, nav, header', { timeout: 10000 }).catch(() => {});
}

// Cek apakah halaman berhasil load (tidak ada error page)
export async function checkPageLoaded(page, expectedUrlPart) {
  const url = page.url();
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const bugs = [];
  if (!url.includes(expectedUrlPart)) {
    bugs.push(`URL salah: expected "${expectedUrlPart}" got "${url}"`);
  }
  // Deteksi error page dari page title atau heading khusus, bukan konten umum
  const pageTitle = await page.title().catch(() => '');
  const hasErrorPage = /^(404|500|403|error|not found)/i.test(pageTitle) ||
    /Access Denied|Internal Server Error|Forbidden/i.test(bodyText.slice(0, 200));
  if (hasErrorPage) {
    bugs.push(`Error page terdeteksi: title="${pageTitle}" body="${bodyText.slice(0, 80)}"`);
  }
  return { bugs, url, bodyText };
}

// Capture console errors di halaman
export function captureConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });
  return errors;
}

/**
 * Klik button di dalam modal overlay.
 * Modal overlay (fixed inset-0) menghalangi pointer events biasa,
 * sehingga perlu menggunakan JavaScript click.
 * @param {import('@playwright/test').Page} page
 * @param {string} buttonText - Exact text dari button
 */
export async function clickModalButton(page, buttonText) {
  await page.evaluate((text) => {
    const all = document.querySelectorAll('div');
    const modal = Array.from(all).find(d =>
      d.classList.contains('fixed') && d.classList.contains('inset-0') && d.style.display !== 'none'
    );
    const btns = (modal || document).querySelectorAll('button');
    const btn = Array.from(btns).find(b => b.textContent.trim() === text);
    if (btn) btn.click();
  }, buttonText);
  await page.waitForTimeout(1500);
}

/**
 * Klik item (div dengan border) di dalam modal berdasarkan partial text.
 * Digunakan untuk memilih warehouse/option di modal Add to PO / Add to Order.
 * @param {import('@playwright/test').Page} page
 * @param {string} partialText - Sebagian text dari item yang dicari
 */
export async function clickModalItemByText(page, partialText) {
  await page.evaluate((text) => {
    const all = document.querySelectorAll('div');
    const modal = Array.from(all).find(d =>
      d.classList.contains('fixed') && d.classList.contains('inset-0') && d.style.display !== 'none'
    );
    if (!modal) return;
    const items = modal.querySelectorAll('div[class*="border"][class*="rounded"]');
    const item = Array.from(items).find(d => d.textContent.includes(text));
    if (item) item.click();
  }, partialText);
  await page.waitForTimeout(500);
}
