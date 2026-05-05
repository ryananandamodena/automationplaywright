import { test, expect } from '@playwright/test';

test.describe('Create Product and Work Order - BH Series', () => {
  const products = [
    { name: 'BH 0325 ACBK', code: 'BH0325ACBK' },
    { name: 'BH 0325 (CKD)', code: 'BH0325CKD' },
    { name: 'BH 0325 (CR)', code: 'BH0325CR' },
    { name: 'BH 0325 L', code: 'BH0325L' },
    { name: 'BH 0325 L (CKD)', code: 'BH0325LCKD' },
    { name: 'BH 0325 L (SKD)', code: 'BH0325LSKD' },
    { name: 'BH 0325 (SKD)', code: 'BH0325SKD' },
    { name: 'BH 0725', code: 'BH0725' },
    { name: 'BH 0725 (CKD)', code: 'BH0725CKD' },
    { name: 'BH 0725 (CR)', code: 'BH0725CR' },
    { name: 'BH 0725 + PX 6111', code: 'BH0725PX6111' },
    { name: 'BH 0725 (SKD)', code: 'BH0725SKD' },
    { name: 'BH 0725 (VN)', code: 'BH0725VN' },
    { name: 'BH 0735', code: 'BH0735' },
    { name: 'BH 0735 (VN)', code: 'BH0735VN' },
    { name: 'BH 0935', code: 'BH0935' },
    { name: 'BH 0935 (CKD)', code: 'BH0935CKD' },
    { name: 'BH 0935 (KHM)', code: 'BH0935KHM' },
    { name: 'BH 0935 + PX 9002', code: 'BH0935PX9002' },
    { name: 'BH 0935 (SKD)', code: 'BH0935SKD' },
    { name: 'BH 0935 + SX 9512 L', code: 'BH0935SX9512L' }
  ];

  products.forEach((product, index) => {
    test(`Create Product and WO - ${product.name}`, async ({ page }) => {
      // Login
      await page.goto('https://gccs-test.modena.com/');
      await page.getByRole('textbox', { name: 'Username' }).click();
      await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
      await page.getByRole('textbox', { name: 'Input Your Password' }).click();
      await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd.1');
      await page.getByRole('button', { name: 'Login' }).click();

      // Navigasi ke Call Entry
      await page.getByRole('list').locator('div').filter({ hasText: 'Call Center' }).click();
      await page.getByRole('link', { name: 'Call Entry' }).click();

      // Input nomor telepon
      await page.getByRole('textbox', { name: 'Input Phone Number' }).click();
      await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
      await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');

      // Input Sales Model/Product - menggunakan locator baru
      await page.locator('div.css-1xlselm').locator('div').nth(1).fill(product.name);
      await page.locator('div.css-1xlselm').locator('div').nth(1).press('Enter');
      await page.waitForTimeout(1000);
      
      // Cari produk berdasarkan nama
      const productSelector = page.getByText(new RegExp(`.*${product.name}.*`, 'i'));
      await productSelector.first().click();

      // Input Serial Number - unique per produk
      const serialNumber = `SN${product.code}${Date.now().toString().slice(-6)}`;
      await page.getByRole('textbox', { name: 'Input Serial Number' }).click();
      await page.getByRole('textbox', { name: 'Input Serial Number' }).fill(serialNumber);

      // Pilih Dealer
      await page.getByRole('textbox', { name: 'Select Dealer' }).click();
      await page.locator('div:nth-child(2) > .p-datatable-wrapper > .p-datatable-table > .p-datatable-tbody > tr:nth-child(3) > td > .align-center-column > .flex > svg').click();

      // Input Purchase Date
      await page.locator('input[name="purchaseDate"]').click();
      await page.getByRole('option', { name: 'Choose Senin, 19 Januari' }).click();

      // Pilih Warranty
      await page.locator('span').filter({ hasText: 'OUT WARRANTY' }).click();
      await page.getByRole('option', { name: 'IN WARRANTY' }).click();

      // Save Product
      await page.locator('form').getByLabel('Save').first().click();
      await page.waitForTimeout(2000);

      // Create Work Order
      await page.locator('div').filter({ hasText: /^Select Product$/ }).nth(1).click();
      await page.getByText('Work Order', { exact: true }).click();
      await page.getByRole('button', { name: 'Select' }).nth(2).click();
      await page.locator('tr:nth-child(3) > td > span:nth-child(2) > .flex > svg').click();

      // Input Work Order Details
      await page.locator('span').filter({ hasText: 'Select Received Method' }).click();
      await page.getByRole('option', { name: 'SMS' }).click();

      await page.getByRole('textbox', { name: 'Input Complaint Customer' }).click();
      await page.getByRole('textbox', { name: 'Input Complaint Customer' }).fill(`Complaint untuk ${product.name}`);

      await page.locator('input[name="requestDate"]').click();
      await page.getByRole('option', { name: 'Choose Senin, 19 Januari' }).click();

      await page.locator('input[name="requestTime"]').click();
      await page.getByText('2:00 PM', { exact: true }).click();

      await page.locator('span').filter({ hasText: 'Select Technician' }).click();
      await page.getByRole('option', { name: 'AAN SUGIANTO' }).click();

      await page.getByRole('textbox', { name: 'Input Call Agent Note' }).click();
      await page.getByRole('textbox', { name: 'Input Call Agent Note' }).fill(`Note untuk ${product.name}`);

      await page.locator('span').filter({ hasText: 'Select RON Purpose' }).click();
      await page.getByRole('option', { name: 'End User' }).click();

      // Save Work Order
      await page.locator('form').filter({ hasText: 'Create New WO NumberAddress' }).getByLabel('Save').click();
      await page.waitForTimeout(2000);

      console.log(`✓ Completed: ${product.name} - SN: ${serialNumber}`);
    });
  });
});