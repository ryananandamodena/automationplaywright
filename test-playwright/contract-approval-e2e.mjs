/**
 * CONTRACT APPROVAL E2E - MULTI USER
 * 
 * Complete approval flow:
 * 1. Ryan creates contract
 * 2. Novyan approves (Approver 1)
 * 3. Daniel Aritonga approves (Approver 2)
 * 4. Verify final status
 */

import { chromium } from 'playwright';
import { cleanupContractBySnapshot, isAutoCleanupEnabled } from './utils/data-cleanup.mjs';

const BASE_URL = 'https://portal-dev.modena.com';

// User accounts
const USERS = {
  admin: {
    email: 'ryan.ananda@modena.com',
    password: 'P@ssw0rd_ryan.ananda',
    name: 'Ryan Ananda',
    role: 'Admin/Creator'
  },
  approver1: {
    email: 'novyan.ramdhan@modena.com',
    password: 'P@ssw0rd_novyan.ramdhan',
    name: 'Novyan Ramdhan',
    role: 'Approver 1'
  },
  approver2: {
    email: 'daniel.aritonga@modena.com',
    password: 'P@ssw0rd_daniel.aritonga',
    name: 'Daniel Aritonga',
    role: 'Approver 2'
  }
};

// Helper: Fill react-select
async function fillReactSelect(page, containerIndex, searchText) {
  const container = page.locator('div.css-b62m3t-container').nth(containerIndex);
  await container.click();
  await page.waitForTimeout(1000);
  
  await page.keyboard.type(searchText);
  await page.waitForTimeout(2000);
  
  const opts = await page.locator('div[id*="react-select"][id*="option"]').count();
  if (opts > 0) {
    const firstOption = await page.locator('div[id*="react-select"][id*="option"]').first().textContent();
    await page.locator('div[id*="react-select"][id*="option"]').first().click();
    return firstOption.trim();
  }
  return null;
}

// Helper: Login
async function login(page, user) {
  console.log(`\nLogging in as ${user.name} (${user.role})...`);
  
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  
  // Handle FMS selection
  if (page.url().includes('my-application')) {
    await page.click('text=FMS (DEV)');
    await page.waitForTimeout(2000);
    
    if (await page.locator('.swal2-confirm').isVisible().catch(() => false)) {
      await page.click('.swal2-confirm');
      await page.waitForTimeout(3000);
    }
  }
  
  console.log(`✓ Logged in as ${user.name}`);
}

// Helper: Logout
async function logout(page) {
  try {
    // Try to find and click user menu/profile
    const userMenu = page.locator('button, div').filter({ hasText: /ryan|novyan|daniel/i }).first();
    if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenu.click();
      await page.waitForTimeout(1000);
      
      // Click logout
      const logoutBtn = page.locator('button, a').filter({ hasText: /logout|sign out|keluar/i }).first();
      if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await logoutBtn.click();
        await page.waitForTimeout(2000);
        console.log('✓ Logged out');
        return;
      }
    }
    
    // Fallback: direct navigation to logout
    await page.goto(`${BASE_URL}/logout`, { waitUntil: 'load' }).catch(() => null);
    await page.waitForTimeout(2000);
    console.log('✓ Logged out (via URL)');
  } catch (error) {
    console.log('⚠️ Logout attempt:', error.message);
  }
}

// Step 1: Create Contract (Ryan)
async function createContract(page) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: CREATE CONTRACT (Ryan)');
  console.log('='.repeat(60));
  
  await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const initialCount = await page.locator('tbody tr').count();
  console.log(`Initial contract count: ${initialCount}`);
  
  // Open form
  await page.click('button:has-text("Add Contract")');
  await page.waitForTimeout(3000);
  console.log('✓ Form opened');
  
  // Fill form
  console.log('\nFilling contract form...');
  
  // Vendor
  const vendor = await fillReactSelect(page, 0, 'PT');
  console.log(`  ✓ Vendor: ${vendor}`);
  await page.waitForTimeout(500);
  
  // Dates
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() + 1);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  await page.locator('input[type="date"]').first().fill(startDateStr);
  await page.locator('input[type="date"]').nth(1).fill(endDateStr);
  console.log(`  ✓ Period: ${startDateStr} to ${endDateStr}`);
  
  // Vehicle
  await page.locator('select').first().selectOption({ index: 1 });
  const vehicleText = await page.locator('select option:checked').first().textContent();
  console.log(`  ✓ Vehicle: ${vehicleText}`);
  await page.waitForTimeout(500);
  
  // Channel
  const channel = await fillReactSelect(page, 1, 'Retail');
  console.log(`  ✓ Channel: ${channel}`);
  await page.waitForTimeout(500);
  
  // Branch
  const branch = await fillReactSelect(page, 2, 'Jakarta');
  console.log(`  ✓ Branch: ${branch}`);
  await page.waitForTimeout(500);
  
  // Main User
  const mainUser = await fillReactSelect(page, 3, 'Ryan');
  console.log(`  ✓ Main User: ${mainUser}`);
  await page.waitForTimeout(500);
  
  // Rent Cost
  const rentCost = (Math.floor(Math.random() * 5) + 3) * 1000000;
  const rentInput = page.locator('input[placeholder="0"]');
  await rentInput.click();
  await rentInput.fill(rentCost.toString());
  console.log(`  ✓ Rent Cost: Rp ${rentCost.toLocaleString('id-ID')}`);
  
  await page.screenshot({ path: 'approval-01-contract-form.png', fullPage: true });
  
  // Submit
  console.log('\nSubmitting contract...');
  await page.click('button:has-text("Save Contract")');
  await page.waitForTimeout(3000);
  
  // Handle alert
  const swalTitle = await page.locator('.swal2-title').textContent().catch(() => null);
  if (swalTitle) {
    console.log(`📢 ${swalTitle}`);
    await page.click('.swal2-confirm');
    await page.waitForTimeout(2000);
  }
  
  await page.screenshot({ path: 'approval-02-contract-submitted.png', fullPage: true });
  
  // Verify and get contract ID
  await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  const finalCount = await page.locator('tbody tr').count();
  
  if (finalCount > initialCount) {
    // Get the new contract details
    const firstRow = await page.locator('tbody tr').first().textContent();
    const contractId = firstRow.match(/KTR\/[^\s]+/)?.[0] || 'Unknown';
    
    console.log(`\n✅ Contract created successfully!`);
    console.log(`   Contract ID: ${contractId}`);
    console.log(`   Count: ${initialCount} → ${finalCount}`);
    
    await page.screenshot({ path: 'approval-03-contract-list.png', fullPage: true });
    
    return contractId;
  } else {
    console.log(`\n⚠️ Contract not created`);
    return null;
  }
}

// Step 2: Approve by Novyan (Approver 1)
async function approveByNovyan(page, contractId) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: APPROVE BY NOVYAN (Approver 1)');
  console.log('='.repeat(60));
  
  // Try 1: Check approval page/menu
  console.log('\nChecking for approval menu...');
  
  // Look for approval menu items
  const approvalMenus = [
    page.locator('a, button').filter({ hasText: /approval|persetujuan|pending/i }),
    page.locator('[href*="approval"]'),
    page.locator('[href*="pending"]'),
  ];
  
  let foundApprovalPage = false;
  
  for (const menu of approvalMenus) {
    const count = await menu.count();
    if (count > 0) {
      console.log(`Found ${count} approval menu items`);
      await menu.first().click();
      await page.waitForTimeout(3000);
      foundApprovalPage = true;
      break;
    }
  }
  
  if (!foundApprovalPage) {
    // Try direct URL
    console.log('Trying direct approval URLs...');
    const approvalUrls = [
      `${BASE_URL}/fms/vehicle/contract/approval`,
      `${BASE_URL}/fms/vehicle/contract/pending`,
      `${BASE_URL}/fms/approval`,
      `${BASE_URL}/fms/vehicle/contract`,
    ];
    
    for (const url of approvalUrls) {
      await page.goto(url, { waitUntil: 'load', timeout: 10000 }).catch(() => null);
      await page.waitForTimeout(2000);
      
      // Check if there are contracts to approve
      const hasContracts = await page.locator('tbody tr').count().catch(() => 0);
      if (hasContracts > 0) {
        console.log(`✓ Found approval page: ${url}`);
        foundApprovalPage = true;
        break;
      }
    }
  }
  
  await page.screenshot({ path: 'approval-04-novyan-page.png', fullPage: true });
  
  // Try 2: Search for the contract
  console.log(`\nLooking for contract: ${contractId}`);
  
  const searchInput = page.locator('input[type="text"], input[placeholder*="search"]').first();
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.fill(contractId);
    await page.waitForTimeout(2000);
    console.log('✓ Search performed');
  }
  
  await page.screenshot({ path: 'approval-05-novyan-search.png', fullPage: true });
  
  // Try 3: Find contract row
  const rows = await page.locator('tbody tr').count();
  console.log(`Found ${rows} rows`);
  
  if (rows === 0) {
    console.log('\n⚠️ No contracts found for approval');
    console.log('   Possible reasons:');
    console.log('   - Contract does not require approval');
    console.log('   - Novyan does not have approval access');
    console.log('   - Contract already approved');
    return false;
  }
  
  // Try 4: Look for approve button in various places
  const firstRow = page.locator('tbody tr').first();
  
  // Get row content for debugging
  const rowText = await firstRow.textContent().catch(() => 'Unable to read row');
  console.log(`\nFirst row: ${rowText.substring(0, 100)}...`);
  
  // Try different approve button selectors
  const approveBtnSelectors = [
    firstRow.locator('button').filter({ hasText: /approve|setuju/i }),
    firstRow.locator('a').filter({ hasText: /approve|setuju/i }),
    firstRow.locator('button[title*="approve"]'),
    firstRow.locator('svg').filter({ hasText: /check|approve/i }).locator('..'),
    page.locator('button').filter({ hasText: /approve|setuju/i }).first(),
  ];
  
  for (const btnSelector of approveBtnSelectors) {
    if (await btnSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✓ Approve button found');
      await btnSelector.click();
      await page.waitForTimeout(2000);
      
      // Handle confirmation
      const confirmBtn = page.locator('button').filter({ hasText: /confirm|yes|approve|setuju|ya/i }).first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);
        console.log('✓ Approval confirmed');
      }
      
      // Handle success alert
      const swalTitle = await page.locator('.swal2-title').textContent().catch(() => null);
      if (swalTitle) {
        console.log(`📢 ${swalTitle}`);
        await page.click('.swal2-confirm');
        await page.waitForTimeout(2000);
      }
      
      await page.screenshot({ path: 'approval-06-novyan-approved.png', fullPage: true });
      
      console.log('\n✅ Approved by Novyan');
      return true;
    }
  }
  
  // Try 5: Click on row to open details
  console.log('\nTrying to open contract details...');
  await firstRow.click();
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'approval-07-novyan-details.png', fullPage: true });
  
  // Look for approve button in details page
  const detailApproveBtn = page.locator('button').filter({ hasText: /approve|setuju/i }).first();
  if (await detailApproveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await detailApproveBtn.click();
    await page.waitForTimeout(2000);
    
    const confirmBtn = page.locator('button').filter({ hasText: /confirm|yes|approve|setuju|ya/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
    }
    
    const swalTitle = await page.locator('.swal2-title').textContent().catch(() => null);
    if (swalTitle) {
      console.log(`📢 ${swalTitle}`);
      await page.click('.swal2-confirm');
      await page.waitForTimeout(2000);
    }
    
    console.log('\n✅ Approved by Novyan (from details)');
    return true;
  }
  
  console.log('\n⚠️ Approve button not found anywhere');
  console.log('   Contract may not require approval or already approved');
  
  return false;
}

// Step 3: Approve by Daniel Aritonga (Approver 2)
async function approveByDaniel(page, contractId) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 3: APPROVE BY DANIEL ARITONGA (Approver 2)');
  console.log('='.repeat(60));
  
  // Navigate to approval page
  await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log(`\nLooking for contract: ${contractId}`);
  
  // Search for the contract
  const searchInput = page.locator('input[type="text"], input[placeholder*="search"]').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill(contractId);
    await page.waitForTimeout(2000);
    console.log('✓ Contract found in search');
  }
  
  await page.screenshot({ path: 'approval-06-daniel-search.png', fullPage: true });
  
  // Find and click approve button
  const approveBtn = page.locator('tbody tr').first().locator('button, a').filter({ hasText: /approve|setuju/i }).first();
  
  if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await approveBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ Approve button clicked');
    
    // Handle confirmation modal
    const confirmBtn = page.locator('button').filter({ hasText: /confirm|yes|approve|setuju/i }).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(3000);
      console.log('✓ Approval confirmed');
    }
    
    // Handle success alert
    const swalTitle = await page.locator('.swal2-title').textContent().catch(() => null);
    if (swalTitle) {
      console.log(`📢 ${swalTitle}`);
      await page.click('.swal2-confirm');
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ path: 'approval-07-daniel-approved.png', fullPage: true });
    
    console.log('\n✅ Approved by Daniel Aritonga');
    return true;
  } else {
    console.log('\n⚠️ Approve button not found');
    console.log('   Contract may already be fully approved or button selector needs update');
    
    // Check contract status
    const firstRow = await page.locator('tbody tr').first().textContent();
    console.log(`   Row content: ${firstRow.substring(0, 150)}...`);
    
    return false;
  }
}

// Step 4: Verify Final Status
async function verifyFinalStatus(page, contractId) {
  console.log('\n' + '='.repeat(60));
  console.log('STEP 4: VERIFY FINAL STATUS');
  console.log('='.repeat(60));
  
  await page.goto(`${BASE_URL}/fms/vehicle/contract`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Search for the contract
  const searchInput = page.locator('input[type="text"], input[placeholder*="search"]').first();
  if (await searchInput.isVisible().catch(() => false)) {
    await searchInput.fill(contractId);
    await page.waitForTimeout(2000);
  }
  
  // Get contract status
  const firstRow = await page.locator('tbody tr').first();
  const rowText = await firstRow.textContent();
  
  console.log(`\nContract: ${contractId}`);
  console.log(`Status: ${rowText.includes('Approved') ? '✅ APPROVED' : '⏳ PENDING'}`);
  
  // Check for status indicators
  const statusBadge = await firstRow.locator('[class*="badge"], [class*="status"], span').filter({ hasText: /approved|pending|rejected/i }).first().textContent().catch(() => 'Unknown');
  console.log(`Badge: ${statusBadge}`);
  
  await page.screenshot({ path: 'approval-08-final-status.png', fullPage: true });
  
  return statusBadge.toLowerCase().includes('approved');
}

// Main E2E Flow
async function runApprovalE2E() {
  console.log('\n' + '█'.repeat(60));
  console.log('CONTRACT APPROVAL E2E - MULTI USER');
  console.log('█'.repeat(60));
  console.log('Flow: Ryan → Novyan → Daniel Aritonga');
  console.log('█'.repeat(60));
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });
  
  const results = {
    createContract: false,
    approveNovyan: false,
    approveDaniel: false,
    verifyStatus: false,
    contractId: null,
    cleanupContract: false,
  };
  
  try {
    // ===== RYAN: Create Contract =====
    const contextRyan = await browser.newContext({ viewport: null });
    const pageRyan = await contextRyan.newPage();
    
    await login(pageRyan, USERS.admin);
    results.contractId = await createContract(pageRyan);
    results.createContract = !!results.contractId;
    
    await logout(pageRyan);
    await contextRyan.close();
    
    if (!results.contractId) {
      throw new Error('Failed to create contract');
    }
    
    // Wait before next user
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // ===== NOVYAN: Approve (Level 1) =====
    const contextNovyan = await browser.newContext({ viewport: null });
    const pageNovyan = await contextNovyan.newPage();
    
    await login(pageNovyan, USERS.approver1);
    results.approveNovyan = await approveByNovyan(pageNovyan, results.contractId);
    
    await logout(pageNovyan);
    await contextNovyan.close();
    
    // Wait before next user
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // ===== DANIEL: Approve (Level 2) =====
    const contextDaniel = await browser.newContext({ viewport: null });
    const pageDaniel = await contextDaniel.newPage();
    
    await login(pageDaniel, USERS.approver2);
    results.approveDaniel = await approveByDaniel(pageDaniel, results.contractId);
    
    // Verify final status
    results.verifyStatus = await verifyFinalStatus(pageDaniel, results.contractId);
    
    await logout(pageDaniel);
    await contextDaniel.close();
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    if (isAutoCleanupEnabled() && results.contractId) {
      console.log('\n🧹 AUTO CLEANUP CONTRACT (best effort)');
      const cleanupContext = await browser.newContext({ viewport: null });
      const cleanupPage = await cleanupContext.newPage();

      try {
        await login(cleanupPage, USERS.admin);
        results.cleanupContract = await cleanupContractBySnapshot(cleanupPage, {
          baseUrl: BASE_URL,
          rowSnapshot: results.contractId,
        });
      } catch (cleanupError) {
        console.log(`⚠️ Cleanup error: ${cleanupError.message}`);
      } finally {
        await logout(cleanupPage);
        await cleanupContext.close();
      }
    }

    // Summary
    console.log('\n' + '█'.repeat(60));
    console.log('APPROVAL E2E SUMMARY');
    console.log('█'.repeat(60));
    
    const steps = [
      { name: 'Create Contract (Ryan)', status: results.createContract, detail: results.contractId },
      { name: 'Approve Level 1 (Novyan)', status: results.approveNovyan },
      { name: 'Approve Level 2 (Daniel)', status: results.approveDaniel },
      { name: 'Final Status Verified', status: results.verifyStatus },
      { name: 'Cleanup Contract', status: results.cleanupContract || !results.contractId },
    ];
    
    steps.forEach(step => {
      const icon = step.status ? '✅' : '❌';
      const detail = step.detail ? ` - ${step.detail}` : '';
      console.log(`${icon} ${step.name}${detail}`);
    });
    
    const passedCount = steps.filter(s => s.status).length;
    const totalCount = steps.length;
    const passRate = ((passedCount / totalCount) * 100).toFixed(1);
    
    console.log('\n' + '-'.repeat(60));
    console.log(`Total: ${passedCount}/${totalCount} passed (${passRate}%)`);
    console.log('-'.repeat(60));
    
    if (passedCount === totalCount) {
      console.log('\n🎉 FULL APPROVAL FLOW COMPLETED!');
    } else {
      console.log(`\n⚠️ ${totalCount - passedCount} step(s) failed`);
    }
    
    console.log('\n⏳ Closing browser in 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
  
  console.log('\n' + '█'.repeat(60));
  console.log('APPROVAL E2E TEST COMPLETED');
  console.log('█'.repeat(60));
}

// Run
runApprovalE2E().catch(console.error);
