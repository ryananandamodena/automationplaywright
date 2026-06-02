/**
 * MHC - EXPLORE STAGING DATA MENU
 * 
 * Script untuk explore semua menu di bawah "Staging Data"
 * dan generate struktur menu untuk test case CRUD
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.MHC_BASE_URL || 'https://mhc-dev.modena.com';
const USER = {
  email: process.env.MHC_EMAIL || 'your.email@modena.com',
  password: process.env.MHC_PASSWORD || 'YourPassword',
};
const HEADLESS = process.env.HEADLESS === 'true';

async function exploreMenu() {
  console.log('\n' + '='.repeat(60));
  console.log('MHC - EXPLORE STAGING DATA MENU');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User: ${USER.email}`);
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: HEADLESS ? ['--no-sandbox', '--disable-setuid-sandbox'] : ['--start-maximized']
  });
  
  const context = await browser.newContext({ viewport: null });
  const page = await context.newPage();
  
  try {
    // Login
    console.log('\n📍 LOGIN');
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    
    // Fill login form
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.fill(USER.email);
    
    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.fill(USER.password);
    
    // Click login button
    const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await loginButton.click();
    
    console.log('Waiting for login...');
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'mhc-after-login.png', fullPage: true });
    console.log('✓ Logged in');
    
    // Look for Staging Data menu
    console.log('\n📍 SEARCHING FOR STAGING DATA MENU');
    
    // Try different selectors for menu
    const menuSelectors = [
      'text=Staging Data',
      'a:has-text("Staging Data")',
      '[class*="menu"] >> text=Staging Data',
      '[class*="sidebar"] >> text=Staging Data',
      '[class*="nav"] >> text=Staging Data',
    ];
    
    let stagingMenuFound = false;
    for (const selector of menuSelectors) {
      const exists = await page.locator(selector).count() > 0;
      if (exists) {
        console.log(`✓ Found with selector: ${selector}`);
        stagingMenuFound = true;
        
        // Click to expand
        await page.locator(selector).first().click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    if (!stagingMenuFound) {
      console.log('⚠️ Staging Data menu not found. Exploring all menus...');
      
      // Get all menu items
      const allMenus = await page.locator('[class*="menu"] a, [class*="sidebar"] a, [class*="nav"] a').allTextContents();
      console.log('\n📋 All available menus:');
      allMenus.forEach((menu, idx) => {
        if (menu.trim()) console.log(`  ${idx + 1}. ${menu.trim()}`);
      });
    }
    
    await page.screenshot({ path: 'mhc-staging-menu.png', fullPage: true });
    
    // Get submenu items under Staging Data
    console.log('\n📍 EXTRACTING SUBMENU ITEMS');
    
    // Try to find submenu items
    const submenuSelectors = [
      '[class*="submenu"] a',
      '[class*="child"] a',
      '[class*="nested"] a',
      'ul ul a',
      'li li a',
    ];
    
    const submenus = [];
    for (const selector of submenuSelectors) {
      const items = await page.locator(selector).allTextContents();
      if (items.length > 0) {
        console.log(`✓ Found ${items.length} items with: ${selector}`);
        items.forEach(item => {
          if (item.trim() && !submenus.includes(item.trim())) {
            submenus.push(item.trim());
          }
        });
        break;
      }
    }
    
    if (submenus.length > 0) {
      console.log('\n📋 Staging Data Submenus:');
      submenus.forEach((menu, idx) => {
        console.log(`  ${idx + 1}. ${menu}`);
      });
      
      // Generate test structure
      console.log('\n📝 Generating test structure...');
      const testStructure = generateTestStructure(submenus);
      console.log(testStructure);
    } else {
      console.log('⚠️ No submenus found');
    }
    
    // Keep browser open for manual inspection
    console.log('\n⏳ Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'mhc-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('DONE');
  console.log('='.repeat(60));
}

function generateTestStructure(menus) {
  let structure = '\n📁 Suggested Test Structure:\n\n';
  structure += 'playwright-server/test-playwright/mhc/staging/\n';
  
  menus.forEach(menu => {
    const filename = menu.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    structure += `├── ${filename}-crud.spec.js\n`;
  });
  
  return structure;
}

exploreMenu().catch(console.error);
