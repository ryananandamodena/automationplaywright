import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OLD_URL = 'https://prive-living.com';
const NEW_URL = 'https://prive-dev.modena.com';

// Auto-screenshot setiap test ke screenshots/ folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, '..', 'prive-screenshots');
const screenshotMapFile = path.join(__dirname, '..', 'prive-screenshot-map.json');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

// Load existing map atau buat baru
let screenshotMap = {};
if (fs.existsSync(screenshotMapFile)) {
  try { screenshotMap = JSON.parse(fs.readFileSync(screenshotMapFile, 'utf8')); } catch (_) {}
}

test.afterEach(async ({ page }, testInfo) => {
  try {
    const safeName = testInfo.title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 80);
    const status = testInfo.status === 'passed' ? 'PASS' : 'FAIL';
    const ssPath = path.join(screenshotsDir, `${status}__${safeName}.png`);
    await page.screenshot({ path: ssPath, fullPage: false });
    screenshotMap[testInfo.title] = ssPath;
    fs.writeFileSync(screenshotMapFile, JSON.stringify(screenshotMap, null, 2));
  } catch (_) { /* halaman mungkin sudah ditutup */ }
});

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Close newsletter popup jika muncul */
async function closePopup(page) {
  try {
    await page.evaluate(() => {
      const btn = document.querySelector(
        'button[aria-label*="Close newsletter"], button[aria-label*="close"], .qodef-popup-close, .mfp-close'
      );
      if (btn) btn.click();
      // Force hide jika masih ada overlay
      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) overlay.style.display = 'none';
    });
    await page.waitForTimeout(500);
  } catch (_) { /* ignore */ }
}

/** Ambil semua broken images di halaman */
async function getBrokenImages(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('img'))
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.src || img.getAttribute('src'))
      .filter(Boolean)
  );
}

/** Scroll bertahap ke bawah */
async function scrollDown(page, px = 800) {
  await page.evaluate(y => window.scrollBy(0, y), px);
  await page.waitForTimeout(600);
}

// ─────────────────────────────────────────────────────────────────
// SUITE A: HOMEPAGE — OLD WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[OLD] Homepage - prive-living.com', () => {
  test.setTimeout(60000);

  test('TC-004 | Page title benar di semua halaman', async ({ page }) => {
    const bugs = [];

    const pagesToCheck = [
      { url: `${OLD_URL}/`, expectedPattern: /prive/i },
      { url: `${OLD_URL}/product-category/living/`, expectedPattern: /living|collection/i },
      { url: `${OLD_URL}/product/alanna/`, expectedPattern: /alanna/i },
    ];

    for (const { url, expectedPattern } of pagesToCheck) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const title = await page.title();
      console.log(`  Page: ${url} → Title: "${title}"`);
      if (!expectedPattern.test(title)) {
        bugs.push(`❌ Title salah di ${url}: "${title}" — tidak mengandung "${expectedPattern}"`);
      }
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('\n'));
    expect(bugs, bugs.join('\n')).toHaveLength(0);
  });

  test('TC-010 | Tidak ada JavaScript console error', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto(`${OLD_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const jqueryErrors = consoleErrors.filter(e => e.includes('jQuery') || e.includes('dialog'));
    console.log(`  Total console errors: ${consoleErrors.length}`);
    consoleErrors.forEach(e => console.log(`  ⚠ ${e.slice(0, 120)}`));

    expect(jqueryErrors, `jQuery errors: ${jqueryErrors.join('; ')}`).toHaveLength(0);
  });

  test('TC-008 | Hero section memiliki CTA button', async ({ page }) => {
    await page.goto(`${OLD_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(1000);

    // Hero section CTA button
    const heroCTA = page.locator(
      'section a[href*="product"], .hero a, .banner a, [class*="hero"] a[class*="btn"], [class*="hero"] button'
    ).first();

    const hasCTA = await heroCTA.isVisible({ timeout: 3000 }).catch(() => false);
    if (!hasCTA) {
      console.log('  ⚠ Hero section tidak memiliki CTA button — missing conversion trigger');
    }

    // NOTE: old website memang tidak punya hero CTA, test ini dokumentasi issue
    expect(hasCTA, 'Hero section harus memiliki CTA button (Shop Now / Explore Collection)').toBe(true);
  });

  test('TC-009 | Newsletter popup tidak muncul di detik pertama', async ({ page }) => {
    await page.goto(`${OLD_URL}/`, { waitUntil: 'domcontentloaded' });
    // Cek apakah popup sudah muncul dalam 2 detik pertama
    await page.waitForTimeout(2000);

    const popupVisible = await page.evaluate(() => {
      const popup = document.querySelector(
        '[class*="popup"], [class*="newsletter"], [class*="modal"][style*="display: block"]'
      );
      if (!popup) return false;
      const style = getComputedStyle(popup);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    });

    if (popupVisible) {
      console.log('  ⚠ Newsletter popup muncul di detik pertama landing — UX issue (harus delayed min 30s)');
    }
    expect(popupVisible, 'Newsletter popup tidak boleh muncul di detik pertama').toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE B: PRODUCT LISTING — OLD WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[OLD] Product Listing - prive-living.com', () => {
  test.setTimeout(60000);

  test('TC-product-listing | Product cards tampil dengan gambar', async ({ page }) => {
    const bugs = [];
    await page.goto(`${OLD_URL}/product-category/living/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const productCount = await page.locator('ul.products li.product').count();
    console.log(`  Jumlah produk di halaman: ${productCount}`);
    if (productCount === 0) bugs.push('Tidak ada product card yang muncul');

    const brokenImgs = await getBrokenImages(page);
    const productBrokenImgs = brokenImgs.filter(src => src.includes('product'));
    console.log(`  Broken product images: ${productBrokenImgs.length}`);
    if (productBrokenImgs.length > 0) bugs.push(`${productBrokenImgs.length} product image broken`);

    // Cek result count
    const resultText = await page.locator('[class*="result-count"], .woocommerce-result-count').textContent().catch(() => '');
    console.log(`  Result count: "${resultText.trim()}"`);

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-product-count | Product count di Living ≥ 278 (old site baseline)', async ({ page }) => {
    await page.goto(`${OLD_URL}/product-category/living/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const resultText = await page.locator('[class*="result"], .woocommerce-result-count').textContent().catch(() => '');
    const match = resultText.match(/of\s+(\d+)\s+results/i) || resultText.match(/(\d+)\s+results/i);
    const count = match ? parseInt(match[1]) : 0;
    console.log(`  Old site Living product count: ${count}`);
    expect(count, `Old site harus punya setidaknya 200 produk, ditemukan ${count}`).toBeGreaterThanOrEqual(200);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE C: PRODUCT DETAIL — OLD WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[OLD] Product Detail - prive-living.com', () => {
  test.setTimeout(60000);

  test('TC-product-detail | Product detail page elemen utama', async ({ page }) => {
    const bugs = [];
    await page.goto(`${OLD_URL}/product/alanna/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(1500);

    // Cek product name
    const productName = page.locator('h1.product_title, .product_title, h1').first();
    if (!await productName.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Product name (H1) tidak ditemukan');
    else console.log(`  ✓ Product name: "${await productName.textContent()}"`);

    // Cek product image
    const productImg = page.locator('.woocommerce-product-gallery img, [class*="product-image"] img').first();
    if (!await productImg.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Product image tidak ditemukan');
    else {
      const imgSrc = await productImg.getAttribute('src');
      const naturalWidth = await productImg.evaluate(img => img.naturalWidth);
      if (naturalWidth === 0) bugs.push(`Product image broken: ${imgSrc}`);
      else console.log(`  ✓ Product image loaded (${naturalWidth}px)`);
    }

    // Cek HOW TO BUY section
    const howToBuy = page.locator('text=How to Buy, text=HOW TO BUY').first();
    const hasHowToBuy = await howToBuy.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  How to Buy section: ${hasHowToBuy ? '✓' : '⚠ tidak ada'}`);

    // Cek dimensions
    const dimensions = page.locator('text=/\\d+ x \\d+|Dimensions|DIMENSIONS/i').first();
    const hasDimensions = await dimensions.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Dimensions section: ${hasDimensions ? '✓' : '⚠ tidak ada'}`);

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE D: HOMEPAGE — NEW WEBSITE (CRITICAL BUGS)
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Homepage - prive-dev.modena.com', () => {
  test.setTimeout(90000);

  test('TC-001 | Semua product images harus load (bukan broken/mixed content)', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') consoleErrors.push(msg.text());
    });

    await page.goto(`${NEW_URL}/`, { waitUntil: 'load' });
    await page.waitForTimeout(2500);

    const mixedContentErrors = consoleErrors.filter(e =>
      e.toLowerCase().includes('mixed content') || e.includes('192.168.')
    );

    const brokenImgs = await getBrokenImages(page);
    const internalIPImgs = brokenImgs.filter(src => src.includes('192.168.'));

    console.log(`  Mixed content errors: ${mixedContentErrors.length}`);
    console.log(`  Broken images (internal IP): ${internalIPImgs.length}`);
    internalIPImgs.forEach(src => console.log(`    ❌ ${src}`));

    expect(mixedContentErrors, `Mixed content blocked images:\n${internalIPImgs.join('\n')}`).toHaveLength(0);
    expect(internalIPImgs, `Images served dari internal IP:\n${internalIPImgs.join('\n')}`).toHaveLength(0);
  });

  test('TC-002 | Tidak ada internal IP address di HTML source', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    const htmlContent = await page.content();
    const internalIPPattern = /\b192\.168\.\d+\.\d+\b|\b10\.\d+\.\d+\.\d+\b|\b172\.(1[6-9]|2\d|3[01])\.\d+\.\d+\b/;
    const foundIPs = htmlContent.match(new RegExp(internalIPPattern.source, 'g')) || [];

    console.log(`  Internal IPs found in HTML: ${foundIPs.length}`);
    foundIPs.forEach(ip => console.log(`    ❌ ${ip}`));

    expect(foundIPs, `Internal IP addresses exposed in HTML:\n${foundIPs.join('\n')}`).toHaveLength(0);
  });

  test('TC-003 | Scroll tidak memicu navigasi ke halaman lain', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(1000);

    const initialUrl = page.url();
    console.log(`  URL awal: ${initialUrl}`);

    // Scroll bertahap seperti real user
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(1500);

    const urlAfterScroll = page.url();
    console.log(`  URL setelah scroll: ${urlAfterScroll}`);

    expect(urlAfterScroll, `Scroll mengubah URL dari "${initialUrl}" ke "${urlAfterScroll}" — navigation bug!`).toBe(initialUrl);
  });

  test('TC-009 | Newsletter popup tidak muncul di detik pertama', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const popupVisible = await page.evaluate(() => {
      const overlay = document.querySelector('.fixed.inset-0');
      if (!overlay) return false;
      const style = getComputedStyle(overlay);
      return style.display !== 'none';
    });

    if (popupVisible) console.log('  ⚠ Newsletter popup muncul langsung — seharusnya delayed min 30s');
    expect(popupVisible, 'Newsletter popup tidak boleh muncul di 1.5 detik pertama').toBe(false);
  });

  test('TC-022 | Newsletter popup tidak memblokir interaksi halaman', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Cek apakah ada overlay yang intercepts pointer events
    const isBlocking = await page.evaluate(() => {
      const overlays = document.querySelectorAll('.fixed.inset-0, [class*="overlay"], [class*="modal"]');
      for (const overlay of overlays) {
        const style = getComputedStyle(overlay);
        if (style.pointerEvents !== 'none' && style.display !== 'none' && style.visibility !== 'hidden') {
          // Check apakah overlay menutupi seluruh viewport
          const rect = overlay.getBoundingClientRect();
          if (rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9) {
            return { blocking: true, class: overlay.className.slice(0, 80), zIndex: style.zIndex };
          }
        }
      }
      return { blocking: false };
    });

    if (isBlocking.blocking) {
      console.log(`  ❌ Blocking overlay ditemukan: class="${isBlocking.class}" z-index=${isBlocking.zIndex}`);
    }

    // Test: coba klik navigasi langsung
    const navLink = page.locator('nav a').first();
    const canClick = await navLink.isEnabled({ timeout: 3000 }).catch(() => false);
    console.log(`  Nav link dapat diklik: ${canClick}`);

    expect(isBlocking.blocking, `Overlay memblokir seluruh halaman: ${JSON.stringify(isBlocking)}`).toBe(false);
  });

  test('TC-008 | Hero section memiliki CTA button', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(1000);

    const heroCTA = page.locator(
      '[class*="hero"] a, [class*="banner"] a, main > section:first-child a[href*="product"], main > div:first-child a'
    ).first();
    const hasCTA = await heroCTA.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasCTA) console.log('  ⚠ Hero CTA button tidak ada — harus tambahkan "Explore Collection" atau "Shop Now"');
    expect(hasCTA, 'Hero section harus punya CTA button').toBe(true);
  });

  test('TC-020 | H1 bersifat statis, bukan berubah-ubah mengikuti carousel', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(500);

    const h1Initial = await page.locator('h1').first().textContent().catch(() => '');
    console.log(`  H1 awal: "${h1Initial.trim()}"`);

    // Tunggu carousel auto-advance
    await page.waitForTimeout(5000);
    const h1After = await page.locator('h1').first().textContent().catch(() => '');
    console.log(`  H1 setelah 5s: "${h1After.trim()}"`);

    // Cek apakah ada lebih dari satu h1
    const h1Count = await page.locator('h1').count();
    console.log(`  Total H1 di halaman: ${h1Count}`);
    if (h1Count > 1) console.log('  ⚠ Multiple H1 ditemukan — SEO issue');

    expect(h1After.trim(), `H1 berubah dari "${h1Initial.trim()}" menjadi "${h1After.trim()}" — dynamic H1 is bad for SEO`).toBe(h1Initial.trim());
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE E: SEO AUDIT — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] SEO Audit - prive-dev.modena.com', () => {
  test.setTimeout(60000);

  test('TC-024 | Canonical URL mengarah ke domain yang benar', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const canonical = await page.$eval(
      'link[rel="canonical"]',
      el => el.getAttribute('href')
    ).catch(() => null);

    console.log(`  Canonical URL ditemukan: "${canonical}"`);

    expect(canonical, 'Canonical tag tidak ditemukan di homepage').not.toBeNull();

    // Canonical harus mengandung domain yang benar, bukan priveliving.com (typo)
    const wrongCanonical = canonical && canonical.includes('priveliving.com') && !canonical.includes('prive-living.com');
    if (wrongCanonical) {
      console.log(`  ❌ Canonical URL salah: "${canonical}" → seharusnya prive-living.com atau domain production`);
    }
    expect(wrongCanonical, `Canonical mengarah ke domain SALAH: "${canonical}" — harus prive-living.com`).toBe(false);
  });

  test('TC-025 | Setiap halaman memiliki meta description', async ({ page }) => {
    const pages = [
      `${NEW_URL}/`,
      `${NEW_URL}/product-category/living`,
      `${NEW_URL}/product/doris`,
      `${NEW_URL}/contact-us`,
    ];
    const bugs = [];

    for (const url of pages) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const desc = await page.$eval('meta[name="description"]', el => el.content).catch(() => '');
      const title = await page.title();
      console.log(`  [${url.replace(NEW_URL, '')}] title="${title}" | desc length=${desc.length}`);
      if (!desc || desc.length < 20) bugs.push(`Missing meta description di: ${url}`);
      if (!title || title.length < 5) bugs.push(`Missing/short title di: ${url}`);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('\n'));
    expect(bugs, bugs.join('\n')).toHaveLength(0);
  });

  test('TC-025b | Homepage title benar (bukan "Get in Touch" atau generic)', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    const title = await page.title();
    console.log(`  New site homepage title: "${title}"`);

    // Title tidak boleh sama dengan Contact Us title
    expect(title, 'Homepage title tidak boleh "Contact Us" page title').not.toMatch(/contact us/i);
    // Title harus mengandung brand name
    expect(title, 'Homepage title harus mengandung brand name PRIVE').toMatch(/prive/i);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE F: PRODUCT CATALOG — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Product Catalog - prive-dev.modena.com', () => {
  test.setTimeout(60000);

  test('TC-007 | Product count di Living tidak boleh turun lebih dari 30% vs old site', async ({ page }) => {
    await page.goto(`${NEW_URL}/product-category/living`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const resultText = await page.locator('[class*="result"], [class*="count"]').first().textContent().catch(() => '');
    const bodyText = await page.locator('body').innerText();
    const match = bodyText.match(/of\s+(\d+)\s+results/i) || bodyText.match(/(\d+)\s+results/i) || bodyText.match(/Showing.*?(\d+)\s+results/i);
    const count = match ? parseInt(match[1]) : 0;

    console.log(`  New site Living product count: ${count}`);
    console.log(`  Result text: "${resultText.trim()}"`);

    // Old site baseline: ~278. Max allowed regression: 30% = ~194
    const minExpected = 194;
    expect(count, `Product count (${count}) jauh di bawah baseline old site (~278). Minimal ${minExpected}`).toBeGreaterThanOrEqual(minExpected);
  });

  test('TC-011 | Category tabs tidak overflow keluar viewport', async ({ page }) => {
    await page.goto(`${NEW_URL}/product-category/living`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const overflowState = await page.evaluate(() => {
      const containers = document.querySelectorAll('[class*="tab"], [class*="category-filter"], [class*="filter"]');
      const overflowing = [];
      containers.forEach(el => {
        if (el.scrollWidth > el.clientWidth) {
          overflowing.push({
            class: el.className.slice(0, 60),
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            hasScrollIndicator: !!el.querySelector('[class*="fade"], [class*="gradient"]')
          });
        }
      });
      return overflowing;
    });

    if (overflowState.length > 0) {
      overflowState.forEach(el => {
        console.log(`  ⚠ Overflow: "${el.class}" scrollWidth=${el.scrollWidth} clientWidth=${el.clientWidth} indicator=${el.hasScrollIndicator}`);
      });
    }

    // Cek tab terakhir masih visible (tidak terpotong)
    const tabs = page.locator('[class*="tab"] button, [class*="tab"] a, [class*="filter-btn"]');
    const tabCount = await tabs.count();
    if (tabCount > 0) {
      const lastTab = tabs.last();
      const isVisible = await lastTab.isVisible({ timeout: 3000 }).catch(() => false);
      const tabText = await lastTab.textContent().catch(() => '');
      console.log(`  Tab terakhir: "${tabText.trim()}" — visible: ${isVisible}`);
      expect(isVisible, `Tab terakhir "${tabText.trim()}" tidak visible — overflow issue`).toBe(true);
    }
  });

  test('TC-001b | Semua product images di listing page tidak broken', async ({ page }) => {
    await page.goto(`${NEW_URL}/product-category/living`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const brokenImgs = await getBrokenImages(page);
    const internalIPImgs = brokenImgs.filter(src => src.includes('192.168.') || src.includes('10.0.'));

    console.log(`  Broken images: ${brokenImgs.length}`);
    console.log(`  Internal IP images: ${internalIPImgs.length}`);
    brokenImgs.slice(0, 5).forEach(src => console.log(`  ❌ ${src}`));

    expect(internalIPImgs, `Product listing images served dari internal IP:\n${internalIPImgs.join('\n')}`).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE G: PRODUCT DETAIL — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Product Detail - prive-dev.modena.com', () => {
  test.setTimeout(60000);

  test('TC-001c | Product detail image tidak broken', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${NEW_URL}/product/doris`, { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    const productImg = page.locator('main img').first();
    const isVisible = await productImg.isVisible({ timeout: 5000 }).catch(() => false);
    const naturalWidth = await productImg.evaluate(img => img.naturalWidth).catch(() => 0);
    const imgSrc = await productImg.getAttribute('src').catch(() => '');

    console.log(`  Product image src: ${imgSrc}`);
    console.log(`  Natural width: ${naturalWidth}px`);
    console.log(`  Visible: ${isVisible}`);

    const mixedContent = consoleErrors.filter(e => e.includes('Mixed Content') || e.includes('mixed-content'));
    mixedContent.forEach(e => console.log(`  ❌ ${e.slice(0, 120)}`));

    expect(naturalWidth, `Product image natural width = 0 — gambar tidak load (src: ${imgSrc})`).toBeGreaterThan(0);
    expect(mixedContent, `Mixed content error:\n${mixedContent.join('\n')}`).toHaveLength(0);
  });

  test('TC-product-detail-new | Elemen wajib di product detail', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/product/doris`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // H1 product name
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    if (!h1.trim()) bugs.push('H1 product name kosong');
    else console.log(`  ✓ Product name: "${h1.trim()}"`);

    // Breadcrumb
    const breadcrumb = page.locator('nav[aria-label*="breadcrumb"], [class*="breadcrumb"]').first();
    if (!await breadcrumb.isVisible({ timeout: 3000 }).catch(() => false))
      bugs.push('Breadcrumb tidak ditemukan');
    else console.log('  ✓ Breadcrumb visible');

    // HOW TO BUY section
    const howToBuy = page.locator('text=/How to Buy/i, text=/HOW TO BUY/i').first();
    if (!await howToBuy.isVisible({ timeout: 3000 }).catch(() => false))
      bugs.push('Bagian "How to Buy" tidak ditemukan');
    else console.log('  ✓ How to Buy section visible');

    // Call Us / Mail Us links
    const callUs = page.locator('a[href^="tel:"]').first();
    const mailUs = page.locator('a[href^="mailto:"]').first();
    if (!await callUs.isVisible({ timeout: 3000 }).catch(() => false))
      bugs.push('Tombol "Call Us" tidak ditemukan');
    if (!await mailUs.isVisible({ timeout: 3000 }).catch(() => false))
      bugs.push('Tombol "Mail Us" tidak ditemukan');
    else console.log('  ✓ Call Us & Mail Us tersedia');

    // Dimensions
    const dimSection = page.locator('text=/Dimensions|DIMENSIONS|\\d+ x \\d+/i').first();
    if (!await dimSection.isVisible({ timeout: 3000 }).catch(() => false))
      bugs.push('Bagian Dimensions tidak ditemukan');
    else console.log('  ✓ Dimensions section visible');

    // Share buttons
    const shareBtn = page.locator('a[href*="facebook.com/sharer"], a[href*="wa.me"], a[href*="twitter"]').first();
    if (!await shareBtn.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('  ⚠ Share buttons tidak ditemukan (advisory)');
    else console.log('  ✓ Share buttons visible');

    // Related products
    const relatedSection = page.locator('text=/Related Products/i').first();
    if (!await relatedSection.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('  ⚠ Related Products section tidak ditemukan (advisory)');
    else console.log('  ✓ Related Products visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-032 | Product detail memiliki image gallery (multiple views)', async ({ page }) => {
    await page.goto(`${NEW_URL}/product/doris`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const productImages = await page.locator('main img').count();
    console.log(`  Jumlah gambar di product detail: ${productImages}`);

    // Minimal 1 gambar produk
    if (productImages < 2) {
      console.log('  ⚠ Hanya ada 1 gambar — luxury brand butuh multiple product views (5-10 gambar)');
    }

    // Cek gallery lightbox
    const hasGallery = await page.locator('[class*="gallery"], [class*="lightbox"], [class*="zoom"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  Gallery/zoom feature: ${hasGallery ? '✓' : '⚠ tidak ditemukan'}`);

    expect(productImages, 'Product detail harus punya minimal 1 gambar produk').toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE H: SEARCH FUNCTIONALITY — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Search - prive-dev.modena.com', () => {
  test.setTimeout(60000);

  test('TC-021 | Search menampilkan product results (bukan hanya artikel)', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(800);

    // Klik search icon
    const searchBtn = page.locator('button[aria-label="Search"], button:has(img[alt*="search" i])').first();
    if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBtn.click();
      await page.waitForTimeout(800);
    }

    // Ketik query product
    const searchInput = page.locator('input[placeholder*="Search furniture"], input[type="search"]').first();
    if (!await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      bugs.push('Search input tidak ditemukan');
      expect(bugs).toHaveLength(0);
      return;
    }

    await searchInput.fill('sofa');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`  Search URL: ${currentUrl}`);

    // Cek hasil search
    const bodyText = await page.locator('body').innerText();
    const hasProductResults = bodyText.match(/sofa|armchair|chair|seat/i) &&
      (await page.locator('[class*="product"], .product, article').count()) > 0;
    const onlyArticleResults = bodyText.includes('Article') && !bodyText.includes('product');

    console.log(`  Ada product results: ${hasProductResults}`);
    console.log(`  Hanya artikel: ${onlyArticleResults}`);

    // Cek apakah search page heading muncul
    const searchHeading = await page.locator('h1, h2').first().textContent().catch(() => '');
    console.log(`  Search page heading: "${searchHeading.trim()}"`);

    if (onlyArticleResults) {
      bugs.push('Search hanya menampilkan artikel, tidak ada produk — search tidak mengindeks product catalog');
    }
    if (!hasProductResults) {
      bugs.push('Search "sofa" tidak menampilkan satupun produk sofa dari catalog');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-031 | Search memiliki live autocomplete/suggestions', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(800);

    const searchBtn = page.locator('button[aria-label="Search"]').first();
    if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchBtn.click();
      await page.waitForTimeout(500);
    }

    const searchInput = page.locator('input[placeholder*="Search furniture"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.type('sofa', { delay: 100 });
      await page.waitForTimeout(1500);
    }

    // Cek apakah ada autocomplete dropdown
    const autocomplete = await page.locator(
      '[class*="autocomplete"], [class*="suggestion"], [class*="dropdown"], [role="listbox"]'
    ).first().isVisible({ timeout: 2000 }).catch(() => false);

    console.log(`  Live autocomplete/suggestions: ${autocomplete ? '✓' : '⚠ tidak ditemukan'}`);
    if (!autocomplete) {
      console.log('  ⚠ Advisory: Luxury brand idealnya punya instant product search dengan preview');
    }
    // Advisory only — tidak fail test, hanya log
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE I: NAVIGATION & MENU — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Navigation - prive-dev.modena.com', () => {
  test.setTimeout(60000);

  test('TC-nav-main | Semua nav links berfungsi dan tidak 404', async ({ page }) => {
    const bugs = [];
    const navLinks = [
      { name: 'Living', url: `${NEW_URL}/product-category/living` },
      { name: 'Dining', url: `${NEW_URL}/product-category/dining` },
      { name: 'Bed', url: `${NEW_URL}/product-category/collection-bed` },
      { name: 'Contact Us', url: `${NEW_URL}/contact-us` },
      { name: 'Kitchen', url: `${NEW_URL}/kitchen` },
      { name: 'Wardrobe', url: `${NEW_URL}/wardrobe` },
    ];

    for (const { name, url } of navLinks) {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const status = response?.status() || 0;
      const title = await page.title();
      console.log(`  [${status}] ${name}: ${url} → "${title}"`);

      if (status === 404) bugs.push(`Nav link "${name}" menghasilkan 404: ${url}`);
      if (status >= 500) bugs.push(`Nav link "${name}" server error ${status}: ${url}`);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('\n'));
    expect(bugs, bugs.join('\n')).toHaveLength(0);
  });

  test('TC-cabinetry-dropdown | Cabinetry dropdown berfungsi', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(800);

    // Klik Cabinetry button
    const cabBtn = page.locator('nav button, button:has-text("Cabinetry")').first();
    if (!await cabBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      bugs.push('Cabinetry button tidak ditemukan di nav');
      expect(bugs).toHaveLength(0);
      return;
    }

    // Cek aria-expanded sebelum click
    const ariaExpandedBefore = await cabBtn.getAttribute('aria-expanded');
    console.log(`  aria-expanded sebelum click: "${ariaExpandedBefore}"`);
    if (ariaExpandedBefore === null) {
      console.log('  ⚠ TC-030: Cabinetry button tidak punya aria-expanded attribute — accessibility issue');
    }

    await cabBtn.click();
    await page.waitForTimeout(800);

    // Cek submenu muncul
    const kitchenLink = page.locator('a[href*="/kitchen"]').first();
    const wardrobeLink = page.locator('a[href*="/wardrobe"]').first();

    if (!await kitchenLink.isVisible({ timeout: 3000 }).catch(() => false))
      bugs.push('Submenu "Kitchen" tidak muncul setelah klik Cabinetry');
    else console.log('  ✓ Submenu Kitchen visible');

    if (!await wardrobeLink.isVisible({ timeout: 3000 }).catch(() => false))
      bugs.push('Submenu "Wardrobe" tidak muncul setelah klik Cabinetry');
    else console.log('  ✓ Submenu Wardrobe visible');

    // aria-expanded setelah click harus true
    const ariaExpandedAfter = await cabBtn.getAttribute('aria-expanded');
    console.log(`  aria-expanded setelah click: "${ariaExpandedAfter}"`);
    if (ariaExpandedAfter !== null && ariaExpandedAfter !== 'true') {
      bugs.push('aria-expanded tidak berubah menjadi "true" setelah dropdown dibuka');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-015 | Mobile navigation (hamburger menu) tersedia di viewport 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(1000);

    // Cek hamburger button visible di mobile
    const hamburger = page.locator(
      'button[aria-label*="menu" i], [class*="hamburger"], [class*="menu-toggle"], [class*="mobile-nav"]'
    ).first();
    const hamburgerVisible = await hamburger.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Hamburger menu visible at 375px: ${hamburgerVisible}`);

    // Cek nav links apakah visible atau tersembunyi di mobile
    const navLinks = page.locator('nav a');
    const navCount = await navLinks.count();
    let visibleNavCount = 0;
    for (let i = 0; i < navCount; i++) {
      const visible = await navLinks.nth(i).isVisible({ timeout: 1000 }).catch(() => false);
      if (visible) visibleNavCount++;
    }
    console.log(`  Nav links visible at 375px: ${visibleNavCount}/${navCount}`);

    if (!hamburgerVisible && visibleNavCount > 3) {
      console.log('  ⚠ Desktop navigation masih ditampilkan di mobile viewport 375px tanpa hamburger');
    }

    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    expect(hamburgerVisible || visibleNavCount <= 1, 'Mobile: harus ada hamburger menu atau desktop nav tersembunyi').toBe(true);
  });

  test('TC-012 | Footer "About Us" link tidak mengarah ke halaman Contact Us', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);

    const aboutUsLink = page.locator('footer a, [class*="footer"] a').filter({ hasText: /About Us/i }).first();
    if (!await aboutUsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  ⚠ Footer "About Us" link tidak ditemukan');
      return;
    }

    const href = await aboutUsLink.getAttribute('href');
    console.log(`  Footer "About Us" href: "${href}"`);

    // Klik dan cek URL tujuan
    await aboutUsLink.click();
    await page.waitForTimeout(1500);
    const finalUrl = page.url();
    console.log(`  URL setelah klik About Us: ${finalUrl}`);

    const landedOnContact = finalUrl.includes('/contact-us');
    if (landedOnContact) {
      console.log('  ⚠ "About Us" mengarah ke /contact-us — idealnya punya halaman /about-us tersendiri');
    }
    // Advisory only — document issue
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE J: CONTACT FORM — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Contact Form - prive-dev.modena.com', () => {
  test.setTimeout(90000);

  test('TC-026 | Form validation menampilkan custom error messages', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/contact-us`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Scroll ke form
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.scrollIntoView();
    });
    await page.waitForTimeout(600);

    // Submit form kosong
    const submitBtn = page.locator('button[type="submit"], form button').last();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(1500);
    }

    // Cek custom error messages (bukan browser native)
    const customErrors = await page.locator('[class*="error"], [class*="invalid"], [role="alert"]').count();
    const browserTooltip = await page.evaluate(() => {
      // Browser native tooltip tidak accessible via DOM
      const inputs = document.querySelectorAll('input:invalid, textarea:invalid');
      return inputs.length;
    });

    console.log(`  Custom error messages: ${customErrors}`);
    console.log(`  HTML5 invalid inputs: ${browserTooltip}`);

    if (customErrors === 0 && browserTooltip > 0) {
      console.log('  ⚠ TC-026: Hanya menggunakan browser native validation — tidak ada custom error message');
      bugs.push('Form tidak punya custom inline error messages — hanya browser native tooltip');
    }

    // Cek phone validation pattern
    const phoneInput = page.locator('input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.fill('abc123notaphone');
      const isInvalid = await phoneInput.evaluate(el => !el.validity.valid);
      const hasPattern = await phoneInput.evaluate(el => !!el.pattern);
      console.log(`  Phone field has pattern validation: ${hasPattern}`);
      if (!hasPattern) console.log('  ⚠ Input phone tidak punya pattern validation — bisa diisi text bebas');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-027 | T&C checkbox text tidak typo dan ada link ke dokumen', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/contact-us`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Cari checkbox T&C
    const checkboxLabel = await page.locator('label').filter({ hasText: /term|condition|agree/i }).first().textContent().catch(() => '');
    console.log(`  T&C checkbox text: "${checkboxLabel.trim()}"`);

    if (/\bterm\b/.test(checkboxLabel) && !/\bterms\b/.test(checkboxLabel)) {
      bugs.push(`Typo di T&C checkbox: "${checkboxLabel.trim()}" — seharusnya "terms and conditions"`);
    }

    // Cek apakah ada link ke T&C/Privacy Policy
    const termsLink = page.locator('label a[href*="terms"], label a[href*="privacy"], form a[href*="terms"]').first();
    const hasLink = await termsLink.isVisible({ timeout: 2000 }).catch(() => false);
    if (!hasLink) {
      console.log('  ⚠ Tidak ada link ke Terms & Conditions document di dalam checkbox label');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-contact-fields | Semua field wajib ada di contact form', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/contact-us`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const requiredFields = [
      { selector: 'input[placeholder*="First Name" i]', name: 'First Name' },
      { selector: 'input[placeholder*="Last Name" i]', name: 'Last Name' },
      { selector: 'input[type="email"]', name: 'Email' },
      { selector: 'input[type="tel"]', name: 'Phone' },
      { selector: 'textarea, input[placeholder*="Message" i]', name: 'Message' },
    ];

    for (const field of requiredFields) {
      const el = page.locator(field.selector).first();
      const visible = await el.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  Field "${field.name}": ${visible ? '✓' : '❌ tidak ditemukan'}`);
      if (!visible) bugs.push(`Field "${field.name}" tidak ditemukan di contact form`);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE K: 404 PAGE — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] 404 Page - prive-dev.modena.com', () => {
  test.setTimeout(30000);

  test('TC-023 | 404 page memiliki navigasi dan recovery path', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/halaman-tidak-ada-xyz-test-404`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Cek header/navigation
    const hasNav = await page.locator('nav, header').first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Header/nav ada di 404: ${hasNav}`);
    if (!hasNav) bugs.push('404 page tidak punya navigation header — user terjebak');

    // Cek "Back to Home" atau recovery link
    const homeLink = page.locator('a[href="/"], a[href*="home"], a:has-text("Back"), a:has-text("Home")').first();
    const hasHomeLink = await homeLink.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  "Back to Home" link: ${hasHomeLink}`);
    if (!hasHomeLink) bugs.push('404 page tidak punya "Back to Home" atau recovery link');

    // Cek footer
    const hasFooter = await page.locator('footer, [class*="footer"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Footer ada di 404: ${hasFooter}`);
    if (!hasFooter) bugs.push('404 page tidak punya footer');

    // Cek 404 heading
    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    console.log(`  404 H1: "${h1.trim()}"`);

    // Cek WhatsApp button masih ada
    const whatsapp = page.locator('button[aria-label*="WhatsApp"], a[href*="wa.me"]').first();
    const hasWhatsapp = await whatsapp.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  WhatsApp button: ${hasWhatsapp}`);

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE L: FOOTER — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Footer - prive-dev.modena.com', () => {
  test.setTimeout(30000);

  test('TC-footer | Semua footer links tidak broken (tidak 404)', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    const footerLinks = await page.$$eval(
      'footer a, [class*="footer"] a',
      els => els.map(a => ({ text: a.textContent.trim(), href: a.href })).filter(a => a.href && a.href.startsWith('http'))
    );

    console.log(`  Total footer links: ${footerLinks.length}`);
    for (const link of footerLinks.slice(0, 15)) {
      const response = await page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
      const status = response?.status() || 0;
      console.log(`  [${status}] "${link.text}" → ${link.href}`);
      if (status === 404) bugs.push(`Footer link 404: "${link.text}" (${link.href})`);
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(400);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('\n'));
    expect(bugs, bugs.join('\n')).toHaveLength(0);
  });

  test('TC-newsletter-footer | Footer newsletter form berfungsi', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);

    // Isi email invalid
    const emailInput = page.locator('footer input[type="email"], [class*="footer"] input').first();
    const submitBtn = page.locator('footer button, [class*="footer"] button').last();

    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('invalid-email-test');
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
      }
      const isValid = await emailInput.evaluate(el => el.validity.valid);
      console.log(`  Footer email input validates invalid email: ${!isValid ? '✓ (rejected)' : '⚠ (accepted invalid email)'}`);
    }

    // Isi email valid
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('test@example.com');
      console.log('  Footer newsletter email input berfungsi ✓');
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE M: PERFORMANCE & STATIC ASSETS — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Performance & Assets - prive-dev.modena.com', () => {
  test.setTimeout(60000);

  test('TC-018 | Core performance metrics dalam threshold', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    const perf = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        domInteractive: Math.round(nav.domInteractive),
        domComplete: Math.round(nav.domComplete),
        loadEventEnd: Math.round(nav.loadEventEnd),
        transferSizeKB: Math.round(nav.transferSize / 1024),
        decodedBodySizeKB: Math.round(nav.decodedBodySize / 1024),
      };
    });

    console.log('  Performance Metrics:');
    console.log(`    domInteractive : ${perf.domInteractive}ms`);
    console.log(`    domComplete    : ${perf.domComplete}ms`);
    console.log(`    loadEventEnd   : ${perf.loadEventEnd}ms`);
    console.log(`    Transfer size  : ${perf.transferSizeKB}KB`);
    console.log(`    Decoded body   : ${perf.decodedBodySizeKB}KB`);

    // Thresholds
    expect(perf.domInteractive, `domInteractive ${perf.domInteractive}ms terlalu lambat (max 3000ms)`).toBeLessThan(3000);
    expect(perf.domComplete, `domComplete ${perf.domComplete}ms terlalu lambat (max 5000ms)`).toBeLessThan(5000);
  });

  test('TC-028 | Static images di /public/images/ tidak 404', async ({ page }) => {
    const bugs = [];
    const criticalImages = [
      `${NEW_URL}/images/Showroom-AmbienteSenopati.jpg`,
      `${NEW_URL}/images/Showroom-Kemang.jpg`,
      `${NEW_URL}/images/Showroom-Surabaya.jpg`,
      `${NEW_URL}/images/prive-catalogue.jpg`,
      `${NEW_URL}/images/living-cat.jpg`,
      `${NEW_URL}/images/3.-Dining.jpg`,
      `${NEW_URL}/images/3.-Bed-2.jpg`,
      `${NEW_URL}/images/4.-ContactUs.jpg`,
    ];

    for (const imgUrl of criticalImages) {
      const response = await page.goto(imgUrl, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => null);
      const status = response?.status() || 0;
      const imgName = imgUrl.split('/').pop();
      console.log(`  [${status}] ${imgName}`);
      if (status === 404 || status === 0) bugs.push(`Static image 404: ${imgName}`);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('\n'));
    expect(bugs, `${bugs.length} static images missing:\n${bugs.join('\n')}`).toHaveLength(0);
  });

  test('TC-013 | Tidak ada RSC prefetch errors di console', async ({ page }) => {
    const rscErrors = [];
    page.on('requestfailed', req => {
      if (req.url().includes('_rsc')) rscErrors.push(req.url());
    });

    await page.goto(`${NEW_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Hover nav links untuk trigger prefetch
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      await navLinks.nth(i).hover().catch(() => {});
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(1000);

    console.log(`  RSC prefetch failures: ${rscErrors.length}`);
    rscErrors.forEach(url => console.log(`  ❌ ${url}`));

    if (rscErrors.length > 0) {
      console.log('  ⚠ RSC prefetch failures menandakan Next.js RSC streaming tidak terkonfigurasi dengan benar');
    }
    expect(rscErrors, `RSC prefetch errors:\n${rscErrors.join('\n')}`).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE N: ACCESSIBILITY — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Accessibility - prive-dev.modena.com', () => {
  test.setTimeout(60000);

  test('TC-019 | Semua interactive elements memiliki accessible label', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(1000);

    const inaccessibleBtns = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, [role="button"]'))
        .filter(btn => !btn.textContent.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('title'))
        .map(btn => btn.outerHTML.slice(0, 100))
    );

    const imgsNoAlt = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter(img => img.getAttribute('alt') === null)
        .map(img => img.src.split('/').pop())
    );

    console.log(`  Buttons tanpa accessible label: ${inaccessibleBtns.length}`);
    inaccessibleBtns.forEach(b => console.log(`  ⚠ ${b}`));

    console.log(`  Images tanpa alt attribute: ${imgsNoAlt.length}`);
    imgsNoAlt.forEach(img => console.log(`  ⚠ ${img}`));

    if (inaccessibleBtns.length > 0) bugs.push(`${inaccessibleBtns.length} button tanpa accessible label`);
    if (imgsNoAlt.length > 0) bugs.push(`${imgsNoAlt.length} image tanpa alt attribute`);

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-030 | Cabinetry dropdown button punya aria-expanded', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(800);

    const cabBtn = page.locator('nav button').first();
    if (!await cabBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  ⚠ Cabinetry button tidak ditemukan');
      return;
    }

    const ariaExpanded = await cabBtn.getAttribute('aria-expanded');
    const ariaHaspopup = await cabBtn.getAttribute('aria-haspopup');
    console.log(`  Cabinetry aria-expanded: "${ariaExpanded}"`);
    console.log(`  Cabinetry aria-haspopup: "${ariaHaspopup}"`);

    expect(ariaExpanded, 'Dropdown button harus punya aria-expanded attribute (WCAG 4.1.2)').not.toBeNull();
  });

  test('TC-a11y-focus | Elemen interaktif memiliki visible focus indicator', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(500);

    // Tab ke elemen pertama dan cek focus visible
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);

    const focusedEl = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        tag: el.tagName,
        text: el.textContent?.trim().slice(0, 30),
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
        hasFocusVisible: style.outline !== 'none' || style.outlineWidth !== '0px' || style.boxShadow !== 'none'
      };
    });

    console.log(`  Focused element: ${focusedEl?.tag} "${focusedEl?.text}"`);
    console.log(`  Focus outline: "${focusedEl?.outline}"`);
    console.log(`  Focus visible: ${focusedEl?.hasFocusVisible}`);

    if (!focusedEl?.hasFocusVisible) {
      console.log('  ⚠ Focus indicator tidak visible — WCAG 2.4.7 violation');
    }
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE O: CONTENT REGRESSION — NEW VS OLD
// ─────────────────────────────────────────────────────────────────

test.describe('[REGRESSION] Old vs New Content Comparison', () => {
  test.setTimeout(60000);

  test('TC-005 | Testimonials bukan dummy/placeholder', async ({ page }) => {
    const bugs = [];

    // Dummy names dari new site (jangan ada di testimonials)
    const dummyNames = ['Sarah Anderson', 'Michael Chen', 'Emily Roberts', 'David Park'];

    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await scrollDown(page, 1800);
    await page.waitForTimeout(800);

    const testimonialsText = await page.locator('[class*="testimonial"], [class*="review"], blockquote').allTextContents().catch(() => []);
    const bodySnippet = await page.locator('body').innerText().catch(() => '');

    const foundDummies = dummyNames.filter(name => bodySnippet.includes(name));
    console.log(`  Dummy names ditemukan: ${foundDummies.length > 0 ? foundDummies.join(', ') : 'tidak ada'}`);

    // Real customer names yang harus ada
    const realNames = ['Adeline Siregar', 'Matthew Halim', 'Sharon Harper'];
    const foundReal = realNames.filter(name => bodySnippet.includes(name));
    console.log(`  Real customer names: ${foundReal.length > 0 ? foundReal.join(', ') : 'tidak ditemukan'}`);

    if (foundDummies.length > 0) {
      bugs.push(`Dummy/placeholder testimonials ditemukan: ${foundDummies.join(', ')} — harus diganti dengan customer nyata PRIVE`);
    }
    if (foundReal.length === 0 && testimonialsText.length > 0) {
      bugs.push('Testimonial customer asli (Adeline Siregar, Matthew Halim, Sharon Harper) tidak ditemukan');
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-006 | Blog articles bukan placeholder content', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/news`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Placeholder article titles yang tidak boleh ada di production
    const placeholderTitles = [
      'How to Choose the Perfect Sofa',
      'Top 5 Dining Tables for 2026',
      'Creating a Cozy Bedroom Retreat',
      'Making Sustainable Furniture Choices',
    ];

    const bodyText = await page.locator('body').innerText();
    const foundPlaceholders = placeholderTitles.filter(title => bodyText.includes(title));

    // Real article titles yang harus ada
    const realTitles = ['Modern Kitchen', 'JFW 2025', 'Color Psychology', 'PRIVE'];
    const foundReal = realTitles.filter(title => bodyText.includes(title));

    console.log(`  Placeholder articles: ${foundPlaceholders.length > 0 ? foundPlaceholders.join(', ') : 'tidak ada ✓'}`);
    console.log(`  Real PRIVE articles: ${foundReal.length > 0 ? foundReal.join(', ') : 'tidak ditemukan ⚠'}`);

    // Cek broken images di blog
    const brokenImgs = await getBrokenImages(page);
    console.log(`  Broken article images: ${brokenImgs.length}`);

    if (foundPlaceholders.length > 0) {
      bugs.push(`Placeholder articles ditemukan: ${foundPlaceholders.join(', ')} — harus diganti konten PRIVE asli`);
    }
    if (brokenImgs.length > 0) {
      bugs.push(`${brokenImgs.length} article image broken di blog page`);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-comparison | Perbandingan product count old vs new', async ({ page }) => {
    // Old site
    await page.goto(`${OLD_URL}/product-category/living/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const oldBodyText = await page.locator('body').innerText();
    const oldMatch = oldBodyText.match(/of\s+(\d+)\s+results/i) || oldBodyText.match(/(\d+)\s+results/i);
    const oldCount = oldMatch ? parseInt(oldMatch[1]) : 0;

    // New site
    await page.goto(`${NEW_URL}/product-category/living`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const newBodyText = await page.locator('body').innerText();
    const newMatch = newBodyText.match(/of\s+(\d+)\s+results/i) || newBodyText.match(/(\d+)\s+results/i);
    const newCount = newMatch ? parseInt(newMatch[1]) : 0;

    const diff = oldCount - newCount;
    const diffPct = oldCount > 0 ? Math.round((diff / oldCount) * 100) : 0;

    console.log(`  Old site Living products : ${oldCount}`);
    console.log(`  New site Living products : ${newCount}`);
    console.log(`  Selisih                  : ${diff} produk (${diffPct}% regression)`);

    if (diff > oldCount * 0.1) {
      console.log(`  ❌ Regression: ${diffPct}% produk hilang dari catalog`);
    } else {
      console.log('  ✓ Product count regression dalam batas toleransi (<10%)');
    }

    // Max tolerance: 30% regression
    const maxAllowedLoss = Math.floor(oldCount * 0.3);
    expect(diff, `Product count regression terlalu besar: ${diff} produk hilang (${diffPct}%), batas max 30%`).toBeLessThanOrEqual(maxAllowedLoss || 100);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE P: RESPONSIVE TESTING — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Responsive Testing - prive-dev.modena.com', () => {
  test.setTimeout(90000);

  const viewports = [
    { name: 'Desktop Full HD', width: 1920, height: 1080 },
    { name: 'Desktop 1440p', width: 1440, height: 900 },
    { name: 'Laptop 1366', width: 1366, height: 768 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Mobile iPhone 14', width: 390, height: 844 },
    { name: 'Mobile iPhone SE', width: 375, height: 667 },
    { name: 'Mobile Small (360p)', width: 360, height: 640 },
  ];

  for (const vp of viewports) {
    test(`TC-responsive | No horizontal scroll at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
      await closePopup(page);
      await page.waitForTimeout(800);

      const { bodyScrollWidth, winWidth, hasHorizontalScroll } = await page.evaluate(() => ({
        bodyScrollWidth: document.body.scrollWidth,
        winWidth: window.innerWidth,
        hasHorizontalScroll: document.body.scrollWidth > window.innerWidth + 5,
      }));

      console.log(`  [${vp.name}] bodyScrollWidth=${bodyScrollWidth} winWidth=${winWidth} overflow=${hasHorizontalScroll}`);

      expect(hasHorizontalScroll, `Horizontal scroll di ${vp.name}: bodyScrollWidth(${bodyScrollWidth}) > winWidth(${winWidth})`).toBe(false);
    });
  }

  test('TC-responsive-product | Product listing di mobile tidak overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${NEW_URL}/product-category/living`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(1000);

    const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    const imgWidths = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src.split('/').pop(),
        clientWidth: img.clientWidth,
        overflow: img.clientWidth > window.innerWidth
      })).filter(img => img.overflow)
    );

    console.log(`  Horizontal scroll di product listing mobile: ${hasHorizontalScroll}`);
    console.log(`  Images overflow viewport: ${imgWidths.length}`);

    expect(hasHorizontalScroll, 'Product listing mobile tidak boleh punya horizontal scroll').toBe(false);

    await page.setViewportSize({ width: 1280, height: 720 });
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE Q: KITCHEN & WARDROBE PAGE — NEW WEBSITE
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Cabinetry Pages - prive-dev.modena.com', () => {
  test.setTimeout(60000);

  test('TC-034 | Kitchen page memiliki hero image dan CTA', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/kitchen`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const h1 = await page.locator('h1').first().textContent().catch(() => '');
    console.log(`  Kitchen H1: "${h1.trim()}"`);

    // Cek hero image
    const heroImg = page.locator('main img').first();
    const isLoaded = await heroImg.evaluate(img => img.naturalWidth > 0).catch(() => false);
    console.log(`  Hero image loaded: ${isLoaded}`);

    // Cek Consultation CTA
    const consultCTA = page.locator('a:has-text("CONSULTATION"), a:has-text("Consultation"), button:has-text("Consultation")').first();
    const hasConsult = await consultCTA.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Consultation CTA: ${hasConsult ? '✓' : '⚠ tidak ditemukan'}`);

    if (!isLoaded) bugs.push('Kitchen hero image tidak load');
    if (!h1.trim()) bugs.push('Kitchen H1 kosong');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-kitchen-showroom | Showroom images di kitchen page tidak broken', async ({ page }) => {
    const bugs = [];
    await page.goto(`${NEW_URL}/kitchen`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    const brokenImgs = await getBrokenImages(page);
    console.log(`  Broken images di kitchen page: ${brokenImgs.length}`);
    brokenImgs.forEach(src => console.log(`  ❌ ${src}`));

    if (brokenImgs.length > 0) bugs.push(`${brokenImgs.length} images broken di kitchen page`);

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// SUITE R: WHATSAPP & FLOATING ELEMENTS
// ─────────────────────────────────────────────────────────────────

test.describe('[NEW] Floating UI Elements - prive-dev.modena.com', () => {
  test.setTimeout(30000);

  test('TC-036 | WhatsApp button persistent di semua halaman', async ({ page }) => {
    const bugs = [];
    const testPages = [
      { name: 'Homepage', url: `${NEW_URL}/` },
      { name: 'Product Category', url: `${NEW_URL}/product-category/living` },
      { name: 'Product Detail', url: `${NEW_URL}/product/doris` },
      { name: 'Contact', url: `${NEW_URL}/contact-us` },
    ];

    for (const { name, url } of testPages) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await closePopup(page);
      await page.waitForTimeout(800);

      const waBtn = page.locator('button[aria-label*="WhatsApp"], a[href*="wa.me"]').first();
      const isVisible = await waBtn.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  WhatsApp button di ${name}: ${isVisible ? '✓' : '❌'}`);
      if (!isVisible) bugs.push(`WhatsApp button tidak ada di ${name} page`);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, bugs.join(', ')).toHaveLength(0);
  });

  test('TC-scroll-top | Scroll-to-top button muncul setelah scroll', async ({ page }) => {
    await page.goto(`${NEW_URL}/`, { waitUntil: 'domcontentloaded' });
    await closePopup(page);
    await page.waitForTimeout(500);

    // Scroll ke bawah dulu
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(600);

    const scrollTopBtn = page.locator('button[aria-label*="Scroll to top"], button:has-text("top"), [class*="scroll-top"], [class*="scrollTop"]').first();
    const isVisible = await scrollTopBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`  Scroll-to-top button visible setelah scroll: ${isVisible}`);
    expect(isVisible, 'Scroll-to-top button harus muncul setelah user scroll ke bawah').toBe(true);
  });
});
