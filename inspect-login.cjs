const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to https://more-dev.modena.com...');
  await page.goto('https://more-dev.modena.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Fill login form
  await page.locator('input[name="email"]').fill('muhzaenal5@gmail.com');
  await page.locator('input[type="password"]').fill('P@ssw0rd_muhzaenal5');

  // Click company dropdown
  console.log('\n=== CLICKING COMPANY DROPDOWN ===');
  const companyBtn = page.locator('button:has-text("Select a company")');
  await companyBtn.click();
  await page.waitForTimeout(2000);

  // List all visible elements after click
  console.log('\n=== VISIBLE TEXT ELEMENTS ===');
  const visibleEls = await page.locator('div, span, button, li, a, p, label').all();
  for (const el of visibleEls) {
    const text = await el.textContent().catch(() => '');
    const visible = await el.isVisible().catch(() => false);
    if (visible && text && text.trim()) {
      const tag = await el.evaluate(el => el.tagName).catch(() => '?');
      console.log(`  <${tag}> "${text.trim().replace(/\s+/g, ' ')}"`);
    }
  }

  // Check for input/select
  console.log('\n=== SELECT ELEMENTS ===');
  const selects = await page.locator('select').all();
  console.log(`Selects found: ${selects.length}`);
  for (const sel of selects) {
    const name = await sel.getAttribute('name');
    const visible = await sel.isVisible();
    console.log(`  Select name="${name}" visible=${visible}`);
    const opts = await sel.locator('option').all();
    for (const opt of opts) {
      const val = await opt.getAttribute('value');
      const txt = await opt.textContent();
      console.log(`    option value="${val}" text="${txt.trim()}"`);
    }
  }

  await page.waitForTimeout(60000);
  await browser.close();
})();