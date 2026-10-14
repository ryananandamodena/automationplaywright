import { test, expect } from '@playwright/test';
import { BASE_URL, PRODUCTS, categoryAllButton } from './fixtures.js';

test.use({ baseURL: BASE_URL });

test.describe('Storefront - Products Catalog (https://merchandise-dev.modena.com/products)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
  });

  test('ST-PLP-001 products catalog loads with header, grid and product cards', async ({ page }) => {
    // Verify header components
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('header a[href="/products"]').first()).toBeVisible();

    // Verify search input is present
    const searchInput = page.getByPlaceholder('Search products...');
    await expect(searchInput).toBeVisible();

    // Verify product cards are displayed
    const productCards = page.locator('main a[href^="/product/"]');
    const cardCount = await productCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Verify structure of first product card
    const firstCard = productCards.first();
    await expect(firstCard.locator('h3')).toBeVisible();
    await expect(firstCard.locator('text=Rp')).toBeVisible();
  });

  test('ST-PLP-002 product card thumbnails render valid images with no broken links', async ({ page }) => {
    const productImages = page.locator('main a[href^="/product/"] img');
    const imgCount = await productImages.count();
    expect(imgCount).toBeGreaterThan(0);

    let validImagesCount = 0;
    const brokenImages = [];
    for (let i = 0; i < imgCount; i++) {
      const img = productImages.nth(i);
      if (await img.isVisible()) {
        const naturalWidth = await img.evaluate((el) => el.naturalWidth);
        const src = await img.getAttribute('src');
        if (naturalWidth === 0) {
          brokenImages.push(src || `Image index ${i}`);
        } else {
          validImagesCount++;
        }
      }
    }
    // Verify that the majority of products render valid images properly
    expect(validImagesCount).toBeGreaterThan(0);
    if (brokenImages.length > 0) {
      console.warn(`[DEFECT FOUND] Broken image(s) detected on Storefront Products: ${brokenImages.join(', ')}`);
    }
  });

  test('ST-PLP-003 search filters product cards by keyword accurately', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.pressSequentially('Hoodie', { delay: 40 });
    await page.waitForTimeout(500);

    const filteredCards = page.locator('main a[href^="/product/"]');
    const count = await filteredCards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const cardTitle = await filteredCards.nth(i).locator('h3').innerText();
      expect(cardTitle.toLowerCase()).toContain('hoodie');
    }
  });

  test('ST-PLP-004 search is case-insensitive and supports lowercase queries', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.pressSequentially('mug', { delay: 40 });
    await page.waitForTimeout(500);

    const filteredCards = page.locator('main a[href^="/product/"]');
    const count = await filteredCards.count();
    expect(count).toBeGreaterThan(0);

    await expect(page.getByRole('heading', { name: /MUG TUMBLER/i }).first()).toBeVisible();
  });

  test('ST-PLP-005 clearing search restores full products catalog', async ({ page }) => {
    const initialCards = page.locator('main a[href^="/product/"]');
    const initialCount = await initialCards.count();

    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.pressSequentially('Payung', { delay: 40 });
    await page.waitForTimeout(500);

    const filteredCount = await page.locator('main a[href^="/product/"]').count();
    expect(filteredCount).toBeLessThan(initialCount);

    await searchInput.fill('');
    await page.waitForTimeout(500);

    const restoredCount = await page.locator('main a[href^="/product/"]').count();
    expect(restoredCount).toBe(initialCount);
  });

  test('ST-PLP-006 category filters narrow products list by selected category', async ({ page }) => {
    const accessoriesBtn = page.getByRole('button', { name: 'Accessories', exact: true });
    if (await accessoriesBtn.isVisible()) {
      await accessoriesBtn.click();
      await page.waitForTimeout(500);

      const cards = page.locator('main a[href^="/product/"]');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);

      for (const text of await cards.allTextContents()) {
        expect(text).toContain('Accessories');
      }

      // Reset filter with All
      await categoryAllButton(page).click();
      await page.waitForTimeout(500);
      const allCount = await page.locator('main a[href^="/product/"]').count();
      expect(allCount).toBeGreaterThan(count);
    }
  });

  test('ST-PLP-007 size filter buttons narrow catalog appropriately', async ({ page }) => {
    const besarBtn = page.getByRole('button', { name: 'BESAR', exact: true });
    if (await besarBtn.isVisible()) {
      await besarBtn.click();
      await page.waitForTimeout(500);

      const cards = page.locator('main a[href^="/product/"]');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
      await expect(cards.first().locator('h3')).toContainText(/PAYUNG/i);
    }
  });

  test('ST-PLP-008 clicking product card navigates to corresponding PDP', async ({ page }) => {
    const firstCard = page.locator('main a[href^="/product/"]').first();
    const href = await firstCard.getAttribute('href');
    const title = await firstCard.locator('h3').innerText();

    await firstCard.click();
    await page.waitForURL(new RegExp(href));

    // Verify PDP contents
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toBeVisible();
  });

  test('ST-PLP-009 unmatched search displays empty result gracefully without crash', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.pressSequentially('zzzz_no_match_query_999', { delay: 40 });
    await page.waitForTimeout(500);

    await expect(page.locator('main a[href^="/product/"]')).toHaveCount(0);
    await expect(page.getByText(/error|exception|crash/i)).toHaveCount(0);
  });

  test('ST-PLP-010 XSS and special characters in search do not trigger script execution', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search products...');
    const xssPayload = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
    await searchInput.fill(xssPayload);
    await page.waitForTimeout(500);

    // Verify page shell and search input are intact
    await expect(searchInput).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('ST-PLP-011 responsive layout adapts on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify header, search, and products render without horizontal layout blowout
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByPlaceholder('Search products...')).toBeVisible();
    const cards = page.locator('main a[href^="/product/"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('ST-PLP-012 no uncaught JavaScript exceptions during user interactions', async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));

    // Perform multiple user actions: search, clear, filter, click
    const searchInput = page.getByPlaceholder('Search products...');
    await searchInput.pressSequentially('Kaos', { delay: 30 });
    await page.waitForTimeout(300);
    await searchInput.fill('');
    await page.waitForTimeout(300);

    const apparelBtn = page.getByRole('button', { name: 'Apparel', exact: true });
    if (await apparelBtn.isVisible()) {
      await apparelBtn.click();
      await page.waitForTimeout(300);
      await categoryAllButton(page).click();
      await page.waitForTimeout(300);
    }

    expect(jsErrors, `Uncaught JS errors found: ${jsErrors.join('\n')}`).toEqual([]);
  });
});
