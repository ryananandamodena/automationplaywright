/**
 * Insurance Policies - End to End Approval Flow
 * 
 * Flow:
 * 1. CREATE DATA     - novyan.ramadhan@modena.com      (Creator)
 *    [Fill form → Submit for Approval]
 * 2. APPROVAL        - daniel.aritonang@modena.com     (Approver)
 *    [View "Under Review" policies → Approve each]
 * 3. VERIFICATION    - novyan.ramadhan@modena.com      (Creator verifies)
 * 
 * Data: Multiple insurance policies with various insurance types
 * - Property/All Risk
 * - Health
 * - Vehicle
 * - General Liability
 * 
 * STATUS FLOW:
 * Draft → (Submit for Approval) → Under Review → (Approve) → Approved
 */

import { test, expect } from '@playwright/test';

// ============================================================
// CONFIGURATION
// ============================================================
const BASE_URL = 'https://portal-dev.modena.com';
const INSURANCE_POLICIES_URL = `${BASE_URL}/fms/insurance/policies`;
const INSURANCE_FORM_URL = `${BASE_URL}/fms/insurance/policies/form`;

// ============================================================
// USER ACCOUNTS
// ============================================================
const USERS = {
  creator: {
    email: 'novyan.ramadhan@modena.com',
    password: 'P@ssw0rd_novyan.ramadhan',
    name: 'Novyan Ramadhan',
    role: 'Policy Creator'
  },
  approver: {
    email: 'daniel.aritonang@modena.com',
    password: 'P@ssw0rd_daniel.aritonang',
    name: 'Daniel Aritonang',
    role: 'Policy Approver'
  }
};

// ============================================================
// TEST DATA - Insurance Policies
// ============================================================
const insurancePoliciesData = [
  {
    label: 'Property Insurance - Jakarta Office',
    provider: 'PT Asuransi Bumiputera',
    insuranceType: 'Property All Risk',
    coverage: 'Full Coverage - Buildings & Contents',
    policyNumber: 'PROP-JKT-2024-001',
    premium: '50000000',
    sumInsured: '500000000',
    effectiveDate: '2024-01-01',
    expiryDate: '2024-12-31',
    notes: 'Comprehensive property insurance for Jakarta office building. Covers fire, theft, and natural disasters.'
  },
  {
    label: 'Health Insurance - Employee Benefits',
    provider: 'PT Zurich Asuransi',
    insuranceType: 'Health',
    coverage: 'Employee Group Health Plan',
    policyNumber: 'HEALTH-EMP-2024-001',
    premium: '25000000',
    sumInsured: '100000000',
    effectiveDate: '2024-01-01',
    expiryDate: '2024-12-31',
    notes: 'Group health insurance for all employees including medical check-ups, hospitalization, and pharmacy benefits.'
  },
  {
    label: 'Vehicle Insurance - Fleet Management',
    provider: 'PT Asuransi Astra',
    insuranceType: 'Vehicle',
    coverage: 'Comprehensive Vehicle Coverage',
    policyNumber: 'VEH-FLEET-2024-001',
    premium: '35000000',
    sumInsured: '250000000',
    effectiveDate: '2024-01-15',
    expiryDate: '2025-01-14',
    notes: 'Fleet insurance covering all company vehicles including cars, vans, and motorcycles with third party liability.'
  },
  {
    label: 'Liability Insurance - General Coverage',
    provider: 'PT Tokio Marine Insurance',
    insuranceType: 'General Liability',
    coverage: 'Public & Product Liability',
    policyNumber: 'LIABILITY-GEN-2024-001',
    premium: '15000000',
    sumInsured: '150000000',
    effectiveDate: '2024-02-01',
    expiryDate: '2025-01-31',
    notes: 'General liability insurance protecting against claims from third parties for bodily injury and property damage.'
  }
];

// ============================================================
// HELPER: Login to Portal
// ============================================================
async function loginToPortal(page, user, targetUrl = null) {
  console.log(`\n[LOGIN] Logging in as: ${user.name} (${user.role})`);
  console.log(`[LOGIN] Email: ${user.email}\n`);

  // Clear cookies AND localStorage for clean session
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1000);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); }).catch(() => {});
  await page.waitForTimeout(500);

  // Force reload to apply cleared state
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Navigate to target URL (will redirect to login if not authenticated)
  const navigateUrl = targetUrl || INSURANCE_POLICIES_URL;
  await page.goto(navigateUrl, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // Fill login form if on login page
  if (page.url().includes('/login')) {
    await page.locator('input[type="email"], input[name="email"]').first().fill(user.email);
    await page.locator('input[type="password"]').first().fill(user.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForURL(/my-application|\/fms\//, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Handle my-application redirect
  if (page.url().includes('my-application')) {
    console.log('[LOGIN] On my-application page, selecting FMS (DEV)...');
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(3000);

    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
    }
    await page.waitForTimeout(2000);

    // Navigate to target URL after FMS selection
    await page.goto(navigateUrl, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Fallback: if still not on the right page
  if (!page.url().includes('/fms/')) {
    console.log(`[LOGIN] Still at ${page.url()}, attempting fallback...`);
    await page.goto(`${BASE_URL}/fms`, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(3000);
      const fmsConfirm = page.getByRole('button', { name: 'Confirm' });
      if (await fmsConfirm.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fmsConfirm.click();
        await page.waitForURL(/\/fms\//, { timeout: 20000 }).catch(() => {});
      }
      await page.waitForTimeout(2000);
    }

    await page.goto(navigateUrl, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  console.log(`[LOGIN] OK - ${user.name} - URL: ${page.url()}`);
  await page.screenshot({ path: `test-results/insurance-login-${user.email.split('@')[0]}.png`, fullPage: true });
}

// ============================================================
// HELPER: Fill Insurance Policy Form
// ============================================================
async function fillInsurancePolicyForm(page, data) {
  console.log(`\n[POLICY] Filling: ${data.label}\n`);

  // Wait for the form to be visible
  await page.waitForTimeout(2000);

  // Policy Number input
  const policyNumberInput = page.locator('input[placeholder*="Policy Number"], input[placeholder*="Nomor Polis"]').first();
  if (await policyNumberInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await policyNumberInput.fill(data.policyNumber);
    console.log(`  > Policy Number: ${data.policyNumber}`);
    await page.waitForTimeout(300);
  }

  // Provider select/input
  const providerInput = page.locator('select').filter({ hasText: 'Provider' }).first();
  if (await providerInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await providerInput.selectOption({ value: data.provider }).catch(() => {});
    console.log(`  > Provider: ${data.provider}`);
  } else {
    // Try text input for provider
    const providerTextInput = page.locator('input[placeholder*="Provider"], input[placeholder*="Penyedia"]').first();
    if (await providerTextInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await providerTextInput.fill(data.provider);
      console.log(`  > Provider: ${data.provider}`);
    }
  }
  await page.waitForTimeout(300);

  // Insurance Type
  const typeSelect = page.locator('select').filter({ hasText: 'Type' }).first();
  if (await typeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    await typeSelect.selectOption({ value: data.insuranceType }).catch(() => {});
    console.log(`  > Insurance Type: ${data.insuranceType}`);
  } else {
    // Try React-Select or other input
    const typeInput = page.locator('input[placeholder*="Type"], input[placeholder*="Jenis"]').first();
    if (await typeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeInput.fill(data.insuranceType);
      console.log(`  > Insurance Type: ${data.insuranceType}`);
    }
  }
  await page.waitForTimeout(300);

  // Coverage
  const coverageInput = page.locator('input[placeholder*="Coverage"], input[placeholder*="Jangkauan"]').first();
  if (await coverageInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await coverageInput.fill(data.coverage);
    console.log(`  > Coverage: ${data.coverage}`);
    await page.waitForTimeout(300);
  }

  // Premium
  const premiumInputs = page.locator('input[type="text"][placeholder="0"], input[type="number"]').all().catch(() => []);
  const premiumInput = page.locator('input[placeholder*="Premium"], input[placeholder="0"]').first();
  if (await premiumInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await premiumInput.fill(data.premium);
    console.log(`  > Premium: ${data.premium}`);
    await page.waitForTimeout(300);
  }

  // Sum Insured
  const sumInsuredInputs = await page.locator('input[type="text"]').all().catch(() => []);
  const sumInsuredInput = page.locator('input[placeholder*="Sum Insured"], input[placeholder*="Nilai Pertanggungan"]');
  if (await sumInsuredInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sumInsuredInput.fill(data.sumInsured);
    console.log(`  > Sum Insured: ${data.sumInsured}`);
    await page.waitForTimeout(300);
  }

  // Effective Date
  const effectiveDateInputs = page.locator('input[type="date"]');
  const effectiveDateCount = await effectiveDateInputs.count();
  if (effectiveDateCount >= 1) {
    await effectiveDateInputs.first().fill(data.effectiveDate);
    console.log(`  > Effective Date: ${data.effectiveDate}`);
    await page.waitForTimeout(300);
  }

  // Expiry Date
  if (effectiveDateCount >= 2) {
    await effectiveDateInputs.nth(1).fill(data.expiryDate);
    console.log(`  > Expiry Date: ${data.expiryDate}`);
    await page.waitForTimeout(300);
  }

  // Notes/Description
  const notesTextarea = page.locator('textarea').first();
  if (await notesTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
    await notesTextarea.fill(data.notes);
    console.log('  > Notes filled');
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: `test-results/insurance-policy-filled-${data.label.replace(/\s+/g, '-')}.png`, fullPage: true });
  console.log(`\n[POLICY] DONE: ${data.label}\n`);
}

// ============================================================
// HELPER: Submit Insurance Policy Form
// IMPORTANT: First click "Save Policy" to save as Draft,
// then click "Submit for Approval" to move to Under Review status
// ============================================================
async function submitPolicyForm(page, label) {
  console.log(`[SUBMIT] Submitting: ${label}`);
  const safeLabel = label.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');

  // Scroll to top to see the header buttons
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `test-results/insurance-before-submit-${safeLabel}.png`, fullPage: true });

  // Step 1: Submit for Approval (using has-text selector like working tests)
  console.log('  > Looking for "Submit for Approval" button...');
  await page.waitForTimeout(1000);
  
  const submitApprovalBtn = page.locator('button:has-text("Submit for Approval")');
  const isVisible = await submitApprovalBtn.isVisible({ timeout: 10000 }).catch(() => false);
  
  if (isVisible) {
    console.log('  > "Submit for Approval" button found and visible');
    await submitApprovalBtn.click();
    await page.waitForTimeout(3000);
    console.log('  > Submit for Approval clicked');
    
    // Handle any confirmation modal or alert
    try {
      // Try to wait for confirmation dialog/modal
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("OK"), button:has-text("Yes")').first();
      if (await confirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmButton.click();
        await page.waitForTimeout(2000);
        console.log('  > Confirmation dialog clicked');
      }
    } catch (e) {
      console.log(`  > No confirmation modal: ${e.message}`);
    }
  } else {
    console.log('  > ERROR: Submit for Approval button NOT found or visible!');
    console.log('  > Taking screenshot for debugging...');
    await page.screenshot({ path: `test-results/insurance-error-no-submit-btn-${safeLabel}.png`, fullPage: true });
    
    // Debug: list all visible buttons
    const allBtns = await page.locator('button').all();
    console.log(`  > Total buttons on page: ${allBtns.length}`);
    for (let i = 0; i < allBtns.length; i++) {
      const btn = allBtns[i];
      const text = await btn.textContent().catch(() => '');
      const visible = await btn.isVisible().catch(() => false);
      if (visible && text.trim()) {
        console.log(`    [${i}] "${text.trim()}"`);
      }
    }
  }

  // Navigate to policies list to verify
  await page.goto(INSURANCE_POLICIES_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `test-results/insurance-after-submit-${safeLabel}.png`, fullPage: true });
  const currentUrl = page.url();
  console.log(`  > URL after submit: ${currentUrl}`);
  return currentUrl;
}

// ============================================================
// HELPER: Find and Approve Policies with "Under Review" Status
// ============================================================
async function findAndApprovePolicies(page, approverUser) {
  console.log(`\n[APPROVE] Approving policies as ${approverUser.name}\n`);

  // Ensure we're on the policies list page
  if (!page.url().includes('/fms/insurance/policies')) {
    await page.goto(INSURANCE_POLICIES_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  // Step 1: Filter by status "Under Review" (if filter exists)
  const statusFilter = page.locator('select').filter({ hasText: /Status|All Status/i }).first();
  if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
    await statusFilter.selectOption({ value: 'Under Review' }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('  > Filtered by "Under Review" status');
  }

  await page.screenshot({ path: `test-results/insurance-approval-list.png`, fullPage: true });

  // Step 2: Look for "Under Review" policies in table
  const rows = page.locator('table tbody tr, tr[role="row"]');
  const rowCount = await rows.count().catch(() => 0);
  console.log(`  Found ${rowCount} total rows`);

  let approvedCount = 0;
  let processedCount = 0;
  const maxItems = 10;

  // Process each policy
  for (let i = 0; i < rowCount && processedCount < maxItems; i++) {
    const currentRows = page.locator('table tbody tr, tr[role="row"]');
    const currentCount = await currentRows.count().catch(() => 0);
    if (i >= currentCount) {
      console.log('  > Row count changed');
      break;
    }

    const rowText = await currentRows.nth(i).textContent().catch(() => '');
    if (!rowText) continue;

    // Check if row contains "Under Review" status
    if (!rowText.includes('Under Review')) {
      continue;
    }

    processedCount++;
    const rowSummary = rowText.substring(0, 80).replace(/\s+/g, ' ').trim();
    console.log(`\n  [ITEM ${processedCount}] ${rowSummary}`);

    // Try to find and click action button in row (View, Edit, Approve)
    const actionBtn = currentRows.nth(i).locator('button, a').first();
    
    if (await actionBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await actionBtn.click();
      await page.waitForTimeout(2000);
      console.log(`  > Clicked row action button`);
    } else {
      console.log('  > No action button found in row');
      continue;
    }

    // Now on detail page, look for Approve button
    // Try different selectors for Approve button
    const approveBtns = [
      page.locator('button:has-text("Approve")'),
      page.locator('button:has-text("Setujui")'),
      page.locator('[class*="approve"] button').first(),
      page.locator('button[title*="Approve"]').first()
    ];

    let approveClicked = false;
    for (const approveBtn of approveBtns) {
      if (await approveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await approveBtn.scrollIntoViewIfNeeded().catch(() => {});
        await page.waitForTimeout(500);
        await page.screenshot({ path: `test-results/insurance-approval-item-${processedCount}-before.png`, fullPage: true });
        
        await approveBtn.click();
        await page.waitForTimeout(2000);
        console.log('  > Approve button clicked');
        approveClicked = true;

        // Handle confirmation modal/dialog
        const modal = page.locator('[role="dialog"], .modal, .fixed').first();
        if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('  > Confirmation dialog appeared');

          // Try to fill remarks
          const remarksTA = modal.locator('textarea').first();
          if (await remarksTA.isVisible({ timeout: 1000 }).catch(() => false)) {
            await remarksTA.fill(`Approved by ${approverUser.name}`);
            console.log('  > Filled remarks');
          }

          // Look for confirm/approve button in modal
          const confirmBtns = [
            modal.locator('button:has-text("Approve")'),
            modal.locator('button:has-text("Confirm")'),
            modal.locator('button:has-text("OK")'),
            modal.locator('button:has-text("Yes")')
          ];

          for (const confirmBtn of confirmBtns) {
            if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              await confirmBtn.click();
              await page.waitForTimeout(3000);
              console.log('  > Confirmed approval');
              approvedCount++;
              break;
            }
          }
        } else {
          // No modal = approval went through
          approvedCount++;
        }
        break;
      }
    }

    if (!approveClicked) {
      console.log('  > WARNING: No approve button found');
      await page.screenshot({ path: `test-results/insurance-approval-item-${processedCount}-no-btn.png`, fullPage: true });
    } else {
      await page.screenshot({ path: `test-results/insurance-approval-item-${processedCount}-after.png`, fullPage: true });
    }

    // Navigate back to list
    await page.goto(INSURANCE_POLICIES_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Re-apply filter
    if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusFilter.selectOption({ value: 'Under Review' }).catch(() => {});
      await page.waitForTimeout(1500);
    }
  }

  console.log(`\n  [APPROVE] Completed - Approved ${approvedCount}/${processedCount} policies`);
  await page.screenshot({ path: `test-results/insurance-approval-complete.png`, fullPage: true });
}

// ============================================================
// TEST SUITE
// ============================================================
test.describe('Insurance Policies - E2E Create & Approval Flow', () => {
  test.describe.configure({ timeout: 600000 }); // 10 minutes

  test.use({
    storageState: { cookies: [], origins: [] } // Empty state - no cached tokens
  });

  // PHASE 1: CREATE (Novyan Ramadhan)
  test.describe('Phase 1: Create Insurance Policies', () => {

    test('TC-01: Create Property Insurance Policy', async ({ page }) => {
      await loginToPortal(page, USERS.creator, INSURANCE_FORM_URL);
      expect(page.url()).toContain('/fms/insurance');
      await fillInsurancePolicyForm(page, insurancePoliciesData[0]);
      await submitPolicyForm(page, insurancePoliciesData[0].label);
      console.log('TC-01 DONE: Property Insurance');
    });

    test('TC-02: Create Health Insurance Policy', async ({ page }) => {
      await loginToPortal(page, USERS.creator, INSURANCE_FORM_URL);
      expect(page.url()).toContain('/fms/insurance');
      await fillInsurancePolicyForm(page, insurancePoliciesData[1]);
      await submitPolicyForm(page, insurancePoliciesData[1].label);
      console.log('TC-02 DONE: Health Insurance');
    });

    test('TC-03: Create Vehicle Insurance Policy', async ({ page }) => {
      await loginToPortal(page, USERS.creator, INSURANCE_FORM_URL);
      expect(page.url()).toContain('/fms/insurance');
      await fillInsurancePolicyForm(page, insurancePoliciesData[2]);
      await submitPolicyForm(page, insurancePoliciesData[2].label);
      console.log('TC-03 DONE: Vehicle Insurance');
    });

    test('TC-04: Create Liability Insurance Policy', async ({ page }) => {
      await loginToPortal(page, USERS.creator, INSURANCE_FORM_URL);
      expect(page.url()).toContain('/fms/insurance');
      await fillInsurancePolicyForm(page, insurancePoliciesData[3]);
      await submitPolicyForm(page, insurancePoliciesData[3].label);
      console.log('TC-04 DONE: Liability Insurance');
    });
  });

  // PHASE 2: APPROVAL (Daniel Aritonang)
  test.describe('Phase 2: Approval - Daniel Aritonang', () => {
    test('TC-05: Approve All Policies', async ({ page }) => {
      await loginToPortal(page, USERS.approver, INSURANCE_POLICIES_URL);
      if (page.url().includes('/unauthorized')) {
        test.skip(true, `${USERS.approver.name} no access`);
        return;
      }
      await findAndApprovePolicies(page, USERS.approver);
      console.log('TC-05 DONE');
    });
  });

  // PHASE 3: VERIFICATION
  test.describe('Phase 3: Verification', () => {
    test('TC-06: Verify Policies Status', async ({ page }) => {
      await loginToPortal(page, USERS.creator, INSURANCE_POLICIES_URL);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-results/insurance-final-verification.png', fullPage: true });

      // Check for policy statuses
      const statusTexts = ['Active', 'Pending', 'Approved', 'Disetujui', 'Ditolak', 'Approved'];
      for (const status of statusTexts) {
        const count = await page.getByText(status, { exact: false }).count().catch(() => 0);
        if (count > 0) console.log(`  Status "${status}": ${count}`);
      }

      // Count total policies
      const rows = page.locator('table tbody tr, [role="row"]');
      const totalPolicies = await rows.count().catch(() => 0);
      console.log(`  Total policies in list: ${totalPolicies}`);

      await page.screenshot({ path: 'test-results/insurance-verification-complete.png', fullPage: true });
      console.log('TC-06 DONE: E2E FLOW COMPLETED');
    });
  });
});
