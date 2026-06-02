// Negative test cases for create product
// import hanya sekali di bagian atas
import { test, expect } from '@playwright/test';

async function loginAndOpenCallEntry(page) {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
}

async function cleanupGccsProductBySerial(page, serialNumber) {
  if (!serialNumber) return false;

  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');
  await page.waitForTimeout(1500);

  const row = page.locator(`tr:has-text("${serialNumber}")`).first();
  if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) {
    console.log(`🧹 Cleanup GCCS: serial ${serialNumber} tidak ditemukan`);
    return false;
  }

  const deleteClicked = await row.locator('button[title*="Delete" i], button[title*="Hapus" i], .pi-trash').first().click().then(() => true).catch(() => false);
  if (!deleteClicked) {
    console.log(`🧹 Cleanup GCCS: tombol delete tidak ditemukan untuk ${serialNumber}`);
    return false;
  }

  await page.locator('button:has-text("Yes"), button:has-text("Ya"), button:has-text("Confirm"), button.swal2-confirm').first().click().catch(() => null);
  await page.waitForTimeout(1500);
  console.log(`🧹 Cleanup GCCS: serial ${serialNumber} dihapus (best effort)`);
  return true;
}

test('create product - nomor telepon kosong', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
  // Nomor telepon kosong
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('');
  await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
  await expect(page.locator('text=Phone number is required')).toBeVisible();
});

test('create product - nomor telepon tidak valid', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
  // Nomor telepon tidak valid
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('abcde');
  await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
  await expect(page.locator('text=Invalid phone number')).toBeVisible();
});

test('create product - sales model tidak dipilih', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');
  // Sales model tidak dipilih
  await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
  await expect(page.locator('text=Sales model is required')).toBeVisible();
});

test('create product - produk tidak dipilih', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');
  await page.locator('div').filter({ hasText: /^Select Sales Model$/ }).nth(4).click();
  // Produk tidak dipilih
  await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
  await expect(page.locator('text=Product is required')).toBeVisible();
});

test('create product - serial number kosong', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');
  await page.locator('div').filter({ hasText: /^Select Sales Model$/ }).nth(4).click();
  await page.locator('#react-select-2-input').fill('wf');
  await page.getByText('WF0763ZZAA - MODENA WASHING').click();
  await page.waitForTimeout(2000);
  await page.waitForSelector('text=WF0670ZZAB');
  await page.getByText(/WF0670ZZAB/).click();
  // Serial number kosong
  await page.getByRole('textbox', { name: 'Input Serial Number' }).fill('');
  await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
  await expect(page.locator('text=Serial number is required')).toBeVisible();
});

test('create product - serial number tidak valid', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');
  await page.locator('div').filter({ hasText: /^Select Sales Model$/ }).nth(4).click();
  await page.locator('#react-select-2-input').fill('wf');
  await page.getByText('WF0763ZZAA - MODENA WASHING').click();
  await page.waitForTimeout(2000);
  await page.waitForSelector('text=WF0670ZZAB');
  await page.getByText(/WF0670ZZAB/).click();
  // Serial number tidak valid
  await page.getByRole('textbox', { name: 'Input Serial Number' }).fill('@@@###');
  await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
  await expect(page.locator('text=Invalid serial number')).toBeVisible();
});

test('create product - dealer tidak dipilih', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');
  await page.locator('div').filter({ hasText: /^Select Sales Model$/ }).nth(4).click();
  await page.locator('#react-select-2-input').fill('wf');
  await page.getByText('WF0763ZZAA - MODENA WASHING').click();
  await page.waitForTimeout(2000);
  await page.waitForSelector('text=WF0670ZZAB');
  await page.getByText(/WF0670ZZAB/).click();
  await page.getByRole('textbox', { name: 'Input Serial Number' }).fill('2342434533333r4');
  // Dealer tidak dipilih
  await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
  await expect(page.locator('text=Dealer is required')).toBeVisible();
});

test('create product - tanggal pembelian kosong', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');
  await page.locator('div').filter({ hasText: /^Select Sales Model$/ }).nth(4).click();
  await page.locator('#react-select-2-input').fill('wf');
  await page.getByText('WF0763ZZAA - MODENA WASHING').click();
  await page.waitForTimeout(2000);
  await page.waitForSelector('text=WF0670ZZAB');
  await page.getByText(/WF0670ZZAB/).click();
  await page.getByRole('textbox', { name: 'Input Serial Number' }).fill('2342434533333r4');
  await page.getByRole('textbox', { name: 'Select Dealer' }).click();
  await page.locator('div:nth-child(2) > .p-datatable-wrapper > .p-datatable-table > .p-datatable-tbody > tr > td > .align-center-column > .flex > svg').first().click();
  // Tanggal pembelian kosong
  await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
  await expect(page.locator('text=Purchase date is required')).toBeVisible();
});

test('create product - warranty tidak dipilih', async ({ page }) => {
  await page.goto('https://gccs-test.modena.com/');
  await page.getByRole('textbox', { name: 'Username' }).fill('sysadmin');
  await page.getByRole('textbox', { name: 'Input Your Password' }).fill('P@ssw0rd12');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByText('Call Center').click();
  await page.getByRole('link', { name: 'Call Entry' }).click();
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');
  await page.locator('div').filter({ hasText: /^Select Sales Model$/ }).nth(4).click();
  await page.locator('#react-select-2-input').fill('wf');
  await page.getByText('WF0763ZZAA - MODENA WASHING').click();
  await page.waitForTimeout(2000);
  await page.waitForSelector('text=WF0670ZZAB');
  await page.getByText(/WF0670ZZAB/).click();
  await page.getByRole('textbox', { name: 'Input Serial Number' }).fill('2342434533333r4');
  await page.getByRole('textbox', { name: 'Select Dealer' }).click();
  await page.locator('div:nth-child(2) > .p-datatable-wrapper > .p-datatable-table > .p-datatable-tbody > tr > td > .align-center-column > .flex > svg').first().click();
  await page.locator('input[name="purchaseDate"]').click();
  await page.getByRole('option', { name: 'Choose Rabu, 22 Oktober' }).click();
  // Warranty tidak dipilih
  await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
  await expect(page.locator('text=Warranty is required')).toBeVisible();
});

test('create product', async ({ page }) => {
  const serialNumber = `SNWF${Date.now().toString().slice(-8)}`;

  try {
    await loginAndOpenCallEntry(page);

  // Input nomor telepon
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');

  // Pilih sales model dan produk
  await page.locator('div').filter({ hasText: /^Select Sales Model$/ }).nth(4).click();
  await page.locator('#react-select-2-input').fill('wf');
  await page.getByText('WF0763ZZAA - MODENA WASHING').click();
  // Tambahkan delay dan log agar produk benar-benar muncul
  console.log('Menunggu produk WF0670ZZAB muncul...');
  await page.waitForTimeout(2000); // tunggu 2 detik
  await page.waitForSelector('text=WF0670ZZAB');

  // Input serial number
    await page.getByRole('textbox', { name: 'Input Serial Number' }).fill(serialNumber);

  // Pilih dealer
  await page.getByRole('textbox', { name: 'Select Dealer' }).click();
  await page.locator('div:nth-child(2) > .p-datatable-wrapper > .p-datatable-table > .p-datatable-tbody > tr > td > .align-center-column > .flex > svg').first().click();

  // Input tanggal pembelian
  await page.locator('input[name="purchaseDate"]').click();
  await page.getByRole('option', { name: 'Choose Rabu, 22 Oktober' }).click();

  // Pilih warranty
  await page.locator('span').filter({ hasText: 'OUT WARRANTY' }).click();
  await page.getByRole('option', { name: 'IN WARRANTY' }).click();
  

  // Simpan
  // Klik tombol Save menggunakan XPath
    await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
    await page.waitForTimeout(2000);
  } finally {
    await cleanupGccsProductBySerial(page, serialNumber).catch(() => null);
  }
});

test('create product BH 0325', async ({ page }) => {
  const serialNumber = `SNBH${Date.now().toString().slice(-8)}`;

  try {
    await loginAndOpenCallEntry(page);

  // Input nomor telepon
  await page.getByRole('textbox', { name: 'Input Phone Number' }).fill('087770666214');
  await page.getByRole('textbox', { name: 'Input Phone Number' }).press('Enter');

  // Pilih sales model dan produk
  await page.locator('div').filter({ hasText: /^Select Sales Model$/ }).nth(4).click();
  await page.locator('#react-select-2-input').fill('bh');
  await page.getByText('BH 0325').click(); // Asumsikan ini adalah model untuk BH
  // Tambahkan delay dan log agar produk benar-benar muncul
  console.log('Menunggu produk BH 0325 muncul...');
  await page.waitForTimeout(2000); // tunggu 2 detik
  await page.waitForSelector('text=BH 0325');

  // Input serial number
    await page.getByRole('textbox', { name: 'Input Serial Number' }).fill(serialNumber);

  // Pilih dealer
  await page.getByRole('textbox', { name: 'Select Dealer' }).click();
  await page.locator('div:nth-child(2) > .p-datatable-wrapper > .p-datatable-table > .p-datatable-tbody > tr > td > .align-center-column > .flex > svg').first().click();

  // Input tanggal pembelian
  await page.locator('input[name="purchaseDate"]').click();
  await page.getByRole('option', { name: 'Choose Rabu, 22 Oktober' }).click();

  // Pilih warranty
  await page.locator('span').filter({ hasText: 'OUT WARRANTY' }).click();
  await page.getByRole('option', { name: 'IN WARRANTY' }).click();
  

  // Simpan
  // Klik tombol Save menggunakan XPath
    await page.locator('xpath=//*[@id="root"]/div/main/div[2]/div[1]/div[1]/div[2]/form/div/div[10]/button[1]').click();
    await page.waitForTimeout(2000);
  } finally {
    await cleanupGccsProductBySerial(page, serialNumber).catch(() => null);
  }
});