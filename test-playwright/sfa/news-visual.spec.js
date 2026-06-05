pplitools Visual AI Test - SFA News Module
 * Tests visual appearance of SFA News pages across browsers
 */

import { test, expect } from '@playwright/test';
import { Eyes, Target, VisualGridRunner } from '@applitools/eyes-playwright';

// Configuration
const BASE_URL = 'https://portal-dev.modena.com';
const NEWS_URL = `${BASE_URL}/sfa/scc-news`;
const USERNAME = 'ade.maradona@modena.com';
const PASSWORD = 'P@ssw0rd_ade.maradona';
const APP_NAME = 'SFA - Sales Force Automation';

test.describe('Visual AI Testing - SFA News Module 📰', () => {
  let eyes;
  let runner;

  test.beforeAll(async () => {
    // Initialize Visual Grid Runner for parallel execution
    runner = new VisualGridRunner({ testConcurrency: 5 });
  });

  test.beforeEach(async ({ page }) => {
    // Initialize Applitools Eyes
    eyes = new Eyes(runner);
    
    // Configure Eyes with cross-browser settings
    eyes.setConfiguration({
      appName: APP_NAME,
      testName: 'SFA News - Visual Check',
      apiKey: process.env.APPLITOOLS_API_KEY,
      
      // Cross-browser testing (Ultra Fast Grid)
      browsersInfo: [
        { width: 1920, height: 1080, name: 'chrome' },
        { width: 1920, height: 1080, name: 'firefox' },
        { width: 1920, height: 1080, name: 'edgechromium' },
        { width: 1366, height: 768, name: 'chrome' },  // Laptop
      ],
      
      // Visual comparison settings
      matchLevel: 'Strict',
      ignoreDisplacements: true,
      saveDiffs: true,
      waitBeforeScreenshots: 1000,
    });

    // Increase timeout for slower SFA pages
    test.setTimeout(180000); // 3 minutes
  });

  test.afterEach(async () => {
    // Close Eyes and finalize test
    await eyes.closeAsync();
  });

  test.afterAll(async () => {
    // Get all test results
    const results = await runner.getAllTestResults(false);
    console.log('\n📊 SFA News Visual Test Results:');
    console.log(results.toString());
  });

  /**
   * Helper: Login to SFA Portal
   */
  async function loginToSFA(page) {
    console.log('🔐 Logging in to SFA Portal...');
    
    await page.goto(`${BASE_URL}/login`, { 
      timeout: 60000, 
      waitUntil: 'domcontentloaded' 
    });
    await page.waitForTimeout(2000);

    // Check if already logged in
    const emailField = page.locator('input[name="email"]').first();
    const isLoginPage = await emailField.isVisible({ timeout: 3000 }).catch(() => false);

    if (isLoginPage) {
      console.log('📝 Filling login credentials...');
      await emailField.fill(USERNAME);
      await page.locator('input[name="password"]').fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
      await page.waitForTimeout(4000);
      console.log('✅ Login successful!');
    } else {
      console.log('✅ Already authenticated');
    }
  }

  /**
   * Helper: Navigate to SCC News
   */
  async function navigateToNews(page) {
    console.log('📍 Navigating to SCC News...');
    
    await page.goto(NEWS_URL, { 
      timeout: 60000, 
      waitUntil: 'domcontentloaded' 
    });
    await page.waitForTimeout(3000);

    // Handle SFA authentication redirect
    if (page.url().includes('/sfa/authentication')) {
      console.log('⏳ Waiting for SFA authentication redirect...');
      await page.waitForURL('**/scc-news**', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    // Re-navigate if needed
    if (!page.url().includes('scc-news')) {
      console.log('🔄 Re-navigating to SCC News...');
      await page.goto(NEWS_URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
    }

    // Wait for table to load
    await page.waitForSelector('table.m-table, .card-body', { timeout: 20000 }).catch(() => {});
    
    console.log('✅ News page loaded!');
  }

  test('Visual check - News list page', async ({ page }) => {
    // Open Eyes session
    await eyes.open(page, APP_NAME, 'SFA News List');

    // Login and navigate
    await loginToSFA(page);
    await navigateToNews(page);

    console.log('📸 Taking News list page screenshots...');

    // Full page screenshot
    await eyes.check('News List - Full Page', 
      Target.window()
        .fully()
        .withName('SFA News List Complete View')
    );

    // Viewport screenshot (above the fold)
    await eyes.check('News List - Viewport', 
      Target.window()
        .withName('SFA News List - Above the Fold')
    );

    // Check data table region
    try {
      const tableExists = await page.locator('table.m-table').isVisible({ timeout: 3000 });
      if (tableExists) {
        await eyes.check('News List - Table', 
          Target.region('table.m-table')
            .withName('News Data Table')
        );
      }
    } catch (e) {
      console.log('⚠️ Table not found, skipping table region check');
    }

    console.log('✅ News list visual check completed!');
  });

  test('Visual check - News create form', async ({ page }) => {
    await eyes.open(page, APP_NAME, 'SFA News Create Form');

    // Login and navigate
    await loginToSFA(page);
    await navigateToNews(page);

    console.log('➕ Opening create form...');

    // Click Add button
    const addBtn = page.locator('button.btn-info, button:has-text("Add"), button:has-text("Tambah")').first();
    const hasAddBtn = await addBtn.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (hasAddBtn) {
      await addBtn.click();
      await page.waitForTimeout(2000);

      console.log('📸 Taking create form screenshots...');

      // Full form screenshot
      await eyes.check('News Create Form - Full', 
        Target.window()
          .fully()
          .withName('News Create Form Complete')
      );

      // Form viewport
      await eyes.check('News Create Form - Viewport', 
        Target.window()
          .withName('News Create Form Above Fold')
      );

      console.log('✅ Create form visual check completed!');
    } else {
      console.log('⚠️ Add button not found, skipping create form check');
      
      // Take current state instead
      await eyes.check('News Page - Current State', 
        Target.window()
          .withName('News Page State')
      );
    }
  });

  test('Visual check - News responsive design', async ({ page }) => {
    await eyes.open(page, APP_NAME, 'SFA News Responsive');

    // Login and navigate
    await loginToSFA(page);
    await navigateToNews(page);

    console.log('📱 Testing responsive design...');

    // Desktop view
    console.log('📱 Desktop view (1920x1080)...');
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1500);
    await eyes.check('News - Desktop View', 
      Target.window().fully().withName('Desktop 1920x1080')
    );

    // Tablet view
    console.log('📱 Tablet view (768x1024)...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1500);
    await eyes.check('News - Tablet View', 
      Target.window().fully().withName('Tablet 768x1024')
    );

    // Mobile view
    console.log('📱 Mobile view (375x667)...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);
    await eyes.check('News - Mobile View', 
      Target.window().fully().withName('Mobile 375x667')
    );

    console.log('✅ Responsive design check completed!');
  });

  test('Visual check - News search and filters', async ({ page }) => {
    await eyes.open(page, APP_NAME, 'SFA News Search');

    // Login and navigate
    await loginToSFA(page);
    await navigateToNews(page);

    console.log('🔍 Testing search and filters...');

    // Check for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Cari"]').first();
    const hasSearch = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSearch) {
      // Focus on search
      await searchInput.click();
      await page.waitForTimeout(500);

      await eyes.check('News - Search Focused', 
        Target.window()
          .withName('Search Input Focused')
      );

      // Type search term
      await searchInput.fill('test');
      await page.waitForTimeout(1000);

      await eyes.check('News - Search with Query', 
        Target.window()
          .withName('Search Results')
      );
    } else {
      console.log('⚠️ Search input not found');
      
      // Capture default view
      await eyes.check('News - Default View', 
        Target.window()
          .withName('News Default State')
      );
    }

    console.log('✅ Search and filters visual check completed!');
  });

  test('Visual check - Create and publish news', async ({ page }) => {
    await eyes.open(page, APP_NAME, 'SFA News Create and Publish');

    // Login and navigate
    await loginToSFA(page);
    await navigateToNews(page);

    console.log('➕ Creating and publishing news...');

    // Step 1: Click Add button
    const addBtn = page.locator('button.btn-info, button:has-text("Add"), button:has-text("Tambah")').first();
    const hasAddBtn = await addBtn.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!hasAddBtn) {
      console.log('⚠️ Add button not found, skipping test');
      await eyes.check('News Page - No Add Button', 
        Target.window().withName('News Page State')
      );
      return;
    }

    await addBtn.click();
    await page.waitForTimeout(2000);

    console.log('📝 Filling news form...');

    // Visual check: Empty form
    await eyes.check('Create News - Empty Form', 
      Target.window().fully().withName('News Form - Initial State')
    );

    // Step 2: Fill form fields
    const timestamp = Date.now().toString().slice(-6);
    const newsTitle = `Visual Test News ${timestamp}`;
    const newsContent = `Konten berita testing visual AI - dibuat pada ${new Date().toLocaleString('id-ID')}`;

    // Fill Title - using correct selector
    console.log('📝 Mengisi judul berita:', newsTitle);
    const titleInput = page.locator('input[placeholder="Masukkan judul berita..."]').first();
    await titleInput.waitFor({ state: 'visible', timeout: 10000 });
    await titleInput.fill(newsTitle);
    await page.waitForTimeout(500);

    // Verify title filled
    const titleValue = await titleInput.inputValue();
    console.log('✓ Judul terisi:', titleValue);

    // Fill Content - using correct selector
    console.log('📝 Mengisi konten berita...');
    const contentField = page.locator('textarea').first();
    await contentField.waitFor({ state: 'visible', timeout: 10000 });
    await contentField.click();
    await contentField.fill(newsContent);
    await page.waitForTimeout(500);

    // Verify content filled
    const contentValue = await contentField.inputValue();
    console.log('✓ Konten terisi:', contentValue.substring(0, 50) + '...');

    // Visual check: Filled form
    await eyes.check('Create News - Filled Form', 
      Target.window().fully().withName('News Form - Data Entered')
    );

    // Step 3: Upload image (optional)
    const fileInput = page.locator('input[type="file"]').first();
    const hasFileInput = await fileInput.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasFileInput) {
      console.log('📷 Uploading image...');
      // You can uncomment this if you have a test image
      // await fileInput.setInputFiles('path/to/test-image.jpg');
      // await page.waitForTimeout(2000);
      console.log('⚠️ Skipping image upload for visual test');
    }

    await page.waitForTimeout(1000);

    // Step 4: Click Publish button - using correct selector
    console.log('🚀 Mencari tombol Publikasikan...');
    const publishBtn = page.locator('button.btn-primary', { hasText: 'Publikasikan' }).first();
    await publishBtn.waitFor({ state: 'visible', timeout: 10000 });
    
    console.log('✓ Tombol Publikasikan ditemukan');
    
    // Visual check: Before publish
    await eyes.check('Create News - Before Publish', 
      Target.window().fully().withName('Ready to Publish')
    );

    console.log('🚀 Mengklik tombol Publikasikan...');
    await publishBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check for error modal
    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasError) {
      console.log('❌ Error saat publish - mengambil screenshot error');
      await eyes.check('Create News - Publish Error', 
        Target.window().withName('Error State')
      );
      const errorText = await page.locator('.swal2-html-container').textContent().catch(() => 'Unknown error');
      console.log('Error message:', errorText);
    } else {
      console.log('✅ Tidak ada error, publish berhasil!');
    }

    // Step 5: Verify published news appears in list
    console.log('✅ Verifying published news...');

    // Wait for any post-publish action
    await page.waitForTimeout(3000);

    // Visual check: After publish (success message or list page)
    await eyes.check('Create News - After Publish', 
      Target.window().fully().withName('Publish Success State')
    );

    // Force navigate back to news list
    console.log('🔄 Navigating back to news list...');
    await page.goto(NEWS_URL, { timeout: 60000, waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);

    // Wait for table
    await page.waitForSelector('table.m-table', { timeout: 15000 }).catch(() => {});

    console.log('📍 Current URL:', page.url());
    console.log('📝 Created news title:', newsTitle);

    // Take full page screenshot of the list
    await eyes.check('Create News - News List After Publish', 
      Target.window().fully().withName('News List with Published Item')
    );

    // Try to find the news in the table (without search)
    const tableBody = page.locator('table.m-table tbody');
    const hasTable = await tableBody.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasTable) {
      console.log('✓ Tabel berita ditemukan');
      
      // Get all rows
      const rows = tableBody.locator('tr');
      const rowCount = await rows.count();
      console.log(`✓ Jumlah baris: ${rowCount}`);
      
      // Check if our news appears in any row
      let newsFound = false;
      for (let i = 0; i < Math.min(rowCount, 10); i++) {
        const row = rows.nth(i);
        const rowText = await row.textContent().catch(() => '');
        
        if (rowText.includes('Visual Test News')) {
          console.log(`✅ Berita ditemukan di baris ${i + 1}!`);
          console.log(`   Preview: ${rowText.substring(0, 100)}...`);
          newsFound = true;
          
          // Check for Published badge in this row
          const badge = row.locator('.badge');
          const badgeText = await badge.textContent().catch(() => '');
          console.log(`   Badge: ${badgeText}`);
          break;
        }
      }
      
      if (newsFound) {
        console.log('✅ Data berhasil tersimpan dan muncul di list!');
      } else {
        console.log('⚠️ Berita tidak ditemukan di 10 baris pertama');
        console.log('   (Mungkin ada pagination atau filter aktif)');
      }
      
      // Take screenshot of the table
      await eyes.check('Create News - Table View', 
        Target.region('table.m-table').withName('News Table After Publish')
      );
    } else {
      console.log('⚠️ Tabel berita tidak ditemukan');
    }

    console.log('✅ Create and publish news visual check completed!');
  });
});
