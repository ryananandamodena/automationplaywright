import { test, expect } from '@playwright/test';

/**
 * Create Vehicle Contract Records
 * Form fields (inspected from https://portal-dev.modena.com/fms/vehicle/contract):
 *   - Vendor / Lessor * (React-Select: #react-select-2-input)
 *   - Start Date * (date input)
 *   - End Date * (date input)
 *   - Select Vehicle Unit * (native <select> from Master Data)
 *   - Channel * (React-Select: #react-select-3-input)
 *   - Branch * (React-Select: #react-select-4-input)
 *   - Main User (React-Select: #react-select-5-input, optional)
 *   - Rent Cost (IDR / Month) * (text input)
 */

const contractTestData = [
  {
    id: 1,
    vehicleValue: 'B 6666 BHA',
    vehicleLabel: 'B 6666 BHA - wkwkwkw',
    vendor: 'Vendor',
    channel: 'People',
    branch: 'Jakarta',
    branchOption: 'MODENA Kemang',
    mainUser: 'Ryan',
    startDate: '2026-04-01',
    endDate: '2027-04-01',
    rentCost: '8000000',
  },
  {
    id: 2,
    vehicleValue: 'L 2005 MOD',
    vehicleLabel: 'L 2005 MOD - Honda HR-V 1.5L SE CVT',
    vendor: 'Vendor',
    channel: 'People',
    branch: 'Jakarta',
    branchOption: 'MODENA Satrio',
    mainUser: 'Ryan',
    startDate: '2026-04-15',
    endDate: '2027-04-15',
    rentCost: '6500000',
  },
  {
    id: 3,
    vehicleValue: 'H 2004 MOD',
    vehicleLabel: 'H 2004 MOD - Mitsubishi Eclipse Cross MPV',
    vendor: 'Vendor',
    channel: 'People',
    branch: 'Jakarta',
    branchOption: 'MODENA Suryo',
    mainUser: 'Ryan',
    startDate: '2026-05-01',
    endDate: '2027-05-01',
    rentCost: '10000000',
  },
  {
    id: 4,
    vehicleValue: 'B 3253 GH',
    vehicleLabel: 'B 3253 GH - Toyota 212',
    vendor: 'Vendor',
    channel: 'People',
    branch: 'Jakarta',
    branchOption: 'Jakarta Branch',
    mainUser: 'Ryan',
    startDate: '2026-05-15',
    endDate: '2027-05-15',
    rentCost: '7500000',
  },
];

async function loginAndGoToContract(page) {
  await page.goto('https://portal-dev.modena.com/fms/vehicle/contract', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);

  if (page.url().includes('/login')) {
    console.log('Login page detected, entering credentials...');
    await page.locator('input[type="email"], input[name="email"]').first().fill('ryan.ananda@modena.com');
    await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(5000);

    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(2000);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
      await page.waitForTimeout(5000);
    }

    await page.goto('https://portal-dev.modena.com/fms/vehicle/contract', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  if (page.url().includes('my-application') || (page.url().includes('portal-dev.modena.com') && !page.url().includes('fms'))) {
    console.log('On my-application, selecting FMS...');
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(2000);
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
    await page.waitForTimeout(5000);
    await page.goto('https://portal-dev.modena.com/fms/vehicle/contract', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  console.log('Contract page URL: ' + page.url());
}

async function fillReactSelect(page, inputSelector, searchText, optionText) {
  const input = page.locator(inputSelector);
  await input.click();
  await input.fill(searchText);
  await page.waitForTimeout(1000);

  if (optionText) {
    await page.locator('[class*="option"]').filter({ hasText: optionText }).first().click({ timeout: 10000 });
  } else {
    await page.locator('[class*="option"]').first().click({ timeout: 10000 });
  }
  await page.waitForTimeout(500);
}

test('Create Vehicle Contract Records', async ({ page }) => {
  test.setTimeout(600000);

  console.log('=== CREATE ' + contractTestData.length + ' VEHICLE CONTRACT RECORDS ===');
  await loginAndGoToContract(page);

  let created = 0;
  let failed = 0;
  const errors = [];

  for (let i = 0; i < contractTestData.length; i++) {
    const data = contractTestData[i];
    console.log('\n--- Contract ' + (i + 1) + '/' + contractTestData.length + ': ' + data.vehicleLabel + ' ---');

    try {
      const addButton = page.getByRole('button', { name: /add contract/i });
      await addButton.click({ timeout: 15000 });
      await page.waitForTimeout(2000);
      console.log('Clicked Add Contract button');
    } catch (e) {
      console.log('Could not find Add Contract button: ' + e.message);
      errors.push('Contract ' + data.id + ': Could not find Add Contract button');
      failed++;
      await page.screenshot({ path: 'test-results/contract-add-btn-fail-' + (i + 1) + '.png' });
      continue;
    }

    try {
      // 1) Vendor / Lessor
      console.log('Filling Vendor/Lessor...');
      await fillReactSelect(page, '#react-select-2-input', data.vendor, 'PT Vendor man');
      console.log('  Vendor selected: PT Vendor man');

      // 2) Dates
      console.log('Filling dates...');
      const startDateInput = page.locator('input[type="date"]').first();
      await startDateInput.fill(data.startDate);
      console.log('  Start Date: ' + data.startDate);

      const endDateInput = page.locator('input[type="date"]').nth(1);
      await endDateInput.fill(data.endDate);
      console.log('  End Date: ' + data.endDate);

      // 3) Select Vehicle Unit (native <select>)
      console.log('Selecting Vehicle Unit...');
      const vehicleSelect = page.locator('select');
      await vehicleSelect.selectOption(data.vehicleValue);
      await page.waitForTimeout(500);
      console.log('  Vehicle: ' + data.vehicleLabel);

      // 4) Channel
      console.log('Filling Channel...');
      await fillReactSelect(page, '#react-select-3-input', data.channel, null);
      console.log('  Channel selected');

      // 5) Branch
      console.log('Filling Branch...');
      await fillReactSelect(page, '#react-select-4-input', data.branch, data.branchOption);
      console.log('  Branch: ' + data.branchOption);

      // 6) Main User (optional)
      try {
        console.log('Filling Main User...');
        await fillReactSelect(page, '#react-select-5-input', data.mainUser, null);
        console.log('  Main User selected');
      } catch (e) {
        console.log('  Main User skipped: ' + e.message);
      }

      // 7) Rent Cost
      console.log('Filling Rent Cost...');
      const costInput = page.locator('input[type="text"]').last();
      await costInput.click();
      await costInput.fill('');
      await costInput.fill(data.rentCost);
      await page.waitForTimeout(300);
      console.log('  Rent Cost: Rp ' + data.rentCost);

      await page.screenshot({ path: 'test-results/contract-before-submit-' + (i + 1) + '.png' });

      // 8) Save as Draft
      const saveButton = page.getByRole('button', { name: 'Save as Draft' });
      if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await saveButton.click();
        console.log('Clicked Save as Draft');
      } else {
        const saveContractBtn = page.getByRole('button', { name: /save contract/i });
        await saveContractBtn.click();
        console.log('Clicked Save Contract');
      }
      await page.waitForTimeout(3000);

      // Verify
      await page.screenshot({ path: 'test-results/contract-after-submit-' + (i + 1) + '.png' });
      created++;
      console.log('OK Contract ' + data.id + ' saved (' + created + '/' + contractTestData.length + ')');

      // Navigate back
      await page.goto('https://portal-dev.modena.com/fms/vehicle/contract', { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(2000);

    } catch (e) {
      console.log('FAIL Contract ' + data.id + ': ' + e.message);
      errors.push('Contract ' + data.id + ' (' + data.vehicleLabel + '): ' + e.message);
      failed++;
      await page.screenshot({ path: 'test-results/contract-fail-' + (i + 1) + '.png' }).catch(() => {});

      try {
        const cancelBtn = page.getByRole('button', { name: /cancel|back/i }).first();
        if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(1000);
        }
      } catch {}
      await page.goto('https://portal-dev.modena.com/fms/vehicle/contract', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log('Created: ' + created + '/' + contractTestData.length);
  console.log('Failed: ' + failed + '/' + contractTestData.length);
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(err => console.log('- ' + err));
  }
  await page.screenshot({ path: 'test-results/contract-test-final.png' });
});