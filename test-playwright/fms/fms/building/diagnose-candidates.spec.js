import { test, expect } from '@playwright/test';

const BASE_URL = 'https://portal-dev.modena.com';
const MODULE_URL = `${BASE_URL}/fms/building/form`;

test('Diagnose Building Candidates Section', async ({ page }) => {
  test.setTimeout(120000);

  // Login
  await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Detect login page by checking for email input
  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  const isEmailVisible = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);
  if (isEmailVisible || !page.url().includes('/fms')) {
    console.log('Login page detected, logging in...');
    await emailInput.fill('ryan.ananda@modena.com');
    await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda');
    await page.getByRole('button', { name: 'Sign In', exact: true }).first().click();
    await page.waitForTimeout(5000);
    await page.waitForURL(/my-application|\/fms\//, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  if (page.url().includes('my-application')) {
    await page.getByText('FMS (DEV)').click();
    await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(2000);
    await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  // Extra: ensure we're on the building form
  if (!page.url().includes('/fms/building')) {
    await page.goto(MODULE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  // Wait for form to be rendered
  await page.waitForSelector('button', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  console.log(`URL: ${page.url()}`);

  // 1. Screenshot full page
  await page.screenshot({ path: 'test-results/diag-01-fullpage.png', fullPage: true });
  console.log('📸 Screenshot 1: fullpage saved');

  // 2. List ALL buttons on the page
  const buttons = await page.locator('button').all();
  console.log(`\n=== ALL BUTTONS (${buttons.length}) ===`);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent().catch(() => '');
    const visible = await buttons[i].isVisible().catch(() => false);
    if (text.trim()) {
      console.log(`  [${i}] "${text.trim().substring(0, 80)}" visible=${visible}`);
    }
  }

  // 3. Look for "candidate" text anywhere
  const candidateElements = await page.locator('text=/candidate/i').count();
  console.log(`\n=== Elements with "candidate" text: ${candidateElements} ===`);

  // 4. Look for "ekspansi" text
  const ekspansiElements = await page.locator('text=/ekspansi/i').count();
  console.log(`Elements with "ekspansi" text: ${ekspansiElements}`);

  // 5. Look for "building candidate" text
  const buildingCandidateText = await page.locator('text=/building.*candidate/i').count();
  console.log(`Elements with "building candidate" text: ${buildingCandidateText}`);

  // 6. Look for "Add" buttons
  const addButtons = await page.locator('button:has-text("Add")').all();
  console.log(`\n=== "Add" buttons: ${addButtons.length} ===`);
  for (let i = 0; i < addButtons.length; i++) {
    const text = await addButtons[i].textContent().catch(() => '');
    const visible = await addButtons[i].isVisible().catch(() => false);
    console.log(`  Add[${i}] "${text.trim()}" visible=${visible}`);
  }

  // 7. Look for SVG icons (often the "+" button is an SVG)
  const svgButtons = await page.locator('button svg, button [class*="icon"], button [class*="plus"]').count();
  console.log(`\nButtons with SVG/icons: ${svgButtons}`);

  // 8. Scroll down and look for "No building candidates yet" section
  const noCandidateText = await page.locator('text=/no.*building.*candidate/i, text=/belum ada.*kandidat/i').count();
  console.log(`"No building candidates" text count: ${noCandidateText}`);

  // 9. Look at all headings / section titles
  const headings = await page.locator('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="header"], [class*="heading"]').all();
  console.log(`\n=== SECTION HEADINGS ===`);
  for (let i = 0; i < Math.min(headings.length, 30); i++) {
    const text = await headings[i].textContent().catch(() => '');
    if (text.trim() && text.trim().length < 100) {
      console.log(`  H[${i}] "${text.trim()}"`);
    }
  }

  // 10. Dump the DOM near "candidate" if found
  const candidateSection = await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    let found = [];
    for (const el of allElements) {
      const text = el.textContent || '';
      if (text.toLowerCase().includes('candidate') && el.children.length < 10) {
        found.push({
          tag: el.tagName,
          className: el.className?.toString()?.substring(0, 100) || '',
          text: text.substring(0, 200),
          innerHTML: el.innerHTML?.substring(0, 300) || ''
        });
      }
    }
    return found.slice(0, 20);
  });
  console.log(`\n=== DOM NEAR "candidate" (${candidateSection.length} elements) ===`);
  for (const el of candidateSection) {
    console.log(`  <${el.tag} class="${el.className}"> text="${el.text.substring(0, 80)}"`);
  }

  // 11. Click "Add Location Candidate" and explore EACH TAB
  const addLocBtn = page.locator('button:has-text("Add Location Candidate")').first();
  if (await addLocBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addLocBtn.scrollIntoViewIfNeeded().catch(() => {});
    await addLocBtn.click();
    console.log('\n✓ Clicked "Add Location Candidate"');
    await page.waitForTimeout(1500);

    // Screenshot after clicking Add
    await page.screenshot({ path: 'test-results/diag-02-after-add-click.png', fullPage: true });

    // Tab names to click through
    const tabs = [
      '1. Identitas & Harga',
      '2. Alamat Lokasi',
      '3. Utilitas',
      '4. Luas & Kondisi Fisik',
      '5. Keamanan',
      '6. Jumlah Tingkat',
      '7. Jenis Bangunan (Material)',
      '8. Dokumen Legal & Pajak',
      '9. Dokumentasi Visual',
      '10. Catatan'
    ];

    for (const tabName of tabs) {
      const tabBtn = page.locator(`button:has-text("${tabName}")`).first();
      if (await tabBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await tabBtn.click();
        await page.waitForTimeout(800);
        console.log(`\n══════ TAB: ${tabName} ══════`);

        // Dump visible inputs
        const inputs = await page.locator('input:visible').all();
        for (let i = 0; i < inputs.length; i++) {
          const type = await inputs[i].getAttribute('type').catch(() => '');
          const placeholder = await inputs[i].getAttribute('placeholder').catch(() => '');
          if (placeholder && placeholder !== 'null') {
            console.log(`  input[${i}] type="${type}" placeholder="${placeholder}"`);
          }
        }
        // Dump visible selects
        const selects = await page.locator('select:visible').all();
        for (let i = 0; i < selects.length; i++) {
          const opts = await selects[i].locator('option').allTextContents();
          console.log(`  select[${i}] options=[${opts.join(' | ')}]`);
        }
        // Dump visible textareas
        const textareas = await page.locator('textarea:visible').all();
        for (let i = 0; i < textareas.length; i++) {
          const ph = await textareas[i].getAttribute('placeholder').catch(() => '');
          console.log(`  textarea[${i}] placeholder="${ph}"`);
        }
        // Dump visible checkboxes with labels
        const checkboxes = await page.locator('input[type="checkbox"]:visible').all();
        if (checkboxes.length > 0) {
          console.log(`  checkboxes: ${checkboxes.length}`);
        }
        // Dump labels
        const labels = await page.evaluate(() => {
          const main = document.querySelector('main') || document.body;
          const els = main.querySelectorAll('label, h3, h4, h5, [class*="label"]');
          return Array.from(els)
            .map(e => e.textContent?.trim())
            .filter(t => t && t.length < 80 && t.length > 1);
        });
        for (const l of labels) {
          console.log(`  label: "${l}"`);
        }
        // Buttons in this tab
        const tabBtns = await page.locator('button:visible').all();
        const relevantBtns = [];
        for (const b of tabBtns) {
          const txt = await b.textContent().catch(() => '');
          const trimmed = txt.trim();
          if (trimmed && !tabs.some(t => trimmed.includes(t)) && !['General Supplies','Stock Adjustment','Stock Opname','Visitor Logbook','Locker Requests','Modena Pod','Business Trip','Helpdesk','Building','Vehicle','Insurance','Master Data','User Role','Configurations','Minimize Menu'].includes(trimmed)) {
            relevantBtns.push(trimmed.substring(0, 50));
          }
        }
        if (relevantBtns.length > 0) {
          console.log(`  buttons: [${relevantBtns.join(', ')}]`);
        }

        await page.screenshot({ path: `test-results/diag-tab-${tabName.substring(0,2).trim()}.png`, fullPage: false });
      }
    }
  }

  expect(true).toBeTruthy();
});
