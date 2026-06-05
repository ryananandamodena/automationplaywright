// specs/03-call-entry.spec.js - GCCS Call Entry Tests
import { test, expect } from '@playwright/test';
import { loginGCCS } from '../helpers/login.js';

test.describe('TC-CE: Call Entry', () => {

  test.beforeEach(async ({ page }) => {
    await loginGCCS(page);
    await page.goto('/call-center/call-entry');
    await page.waitForLoadState('domcontentloaded');
  });

  // TC-CE-001: Halaman Call Entry tampil dengan benar
  test('TC-CE-001: Halaman Call Entry tampil dengan benar', async ({ page }) => {
    // Verifikasi judul
    await expect(page.locator('body')).toContainText('Call Entry');

    // Verifikasi section Customer Info
    await expect(page.locator('body')).toContainText('Customer Info');
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="customerName"]')).toBeVisible();

    // Verifikasi section Product Info
    await expect(page.locator('body')).toContainText('Product Info');

    // Verifikasi tab List Product & List Membership
    await expect(page.locator('body')).toContainText('List Product');
    await expect(page.locator('body')).toContainText('List Membership');

    // Verifikasi tab List Explanation, List Work Order, dll.
    await expect(page.locator('body')).toContainText('List Explanation');
    await expect(page.locator('body')).toContainText('List Work Order');
    await expect(page.locator('body')).toContainText('List VOC');

    // Verifikasi form bawah: Explanation, Work Order, VOC
    await expect(page.locator('body')).toContainText('Explanation');
    await expect(page.locator('body')).toContainText('Work Order');
    await expect(page.locator('body')).toContainText('VOC');
  });

  // TC-CE-002: Field Customer Info memiliki semua field yang diperlukan
  test('TC-CE-002: Form Customer Info memiliki semua field yang diperlukan', async ({ page }) => {
    const fields = [
      'input[name="phone"]',
      'input[name="customerName"]',
      'input[name="addressName"]',
      'input[name="address"]',
      'input[name="province"]',
      'input[name="city"]',
      'input[name="emailAddress"]',
      'input[name="companyName"]',
      'input[name="officePhone"]',
      'input[name="customerTypeName"]',
    ];
    for (const selector of fields) {
      await expect(page.locator(selector)).toBeAttached({ timeout: 5000 });
    }
  });

  // TC-CE-003: Field Product Info memiliki semua field yang diperlukan
  test('TC-CE-003: Form Product Info memiliki semua field yang diperlukan', async ({ page }) => {
    await expect(page.locator('input[name="subcategoryName"]')).toBeAttached();
    await expect(page.locator('input[name="modelName"]')).toBeAttached();
    await expect(page.locator('input[name="brandName"]')).toBeAttached();
    await expect(page.locator('input[name="productName"]')).toBeAttached();
    await expect(page.locator('input[name="serialNumber"]')).toBeAttached();
    await expect(page.locator('input[name="dealer"]')).toBeAttached();
    await expect(page.locator('input[name="purchaseDate"]')).toBeAttached();
  });

  // TC-CE-004: Tab List Product dapat di-klik dan menampilkan tabel
  test('TC-CE-004: Tab List Product dapat diklik dan menampilkan tabel', async ({ page }) => {
    const listProductTab = page.locator('.sub-tab').filter({ hasText: 'List Product' });
    await listProductTab.click();
    await page.waitForTimeout(500);

    // Verifikasi kolom tabel
    await expect(page.locator('body')).toContainText('Brand');
    await expect(page.locator('body')).toContainText('Model Code');
    await expect(page.locator('body')).toContainText('Sales Model');
    await expect(page.locator('body')).toContainText('Serial Number');
  });

  // TC-CE-005: Tab List Membership dapat di-klik
  test('TC-CE-005: Tab List Membership dapat diklik', async ({ page }) => {
    const listMembershipTab = page.locator('.sub-tab').filter({ hasText: 'List Membership' });
    await listMembershipTab.click();
    await page.waitForTimeout(500);
    // Tab aktif berganti
    await expect(listMembershipTab).toHaveClass(/sub-tab-active|active/);
  });

  // TC-CE-006: Input nomor telepon - negative test (format tidak valid)
  test('TC-CE-006: Input nomor telepon format tidak valid (negative test)', async ({ page }) => {
    const phoneInput = page.locator('input[name="phone"]');
    await phoneInput.fill('abc123');
    await phoneInput.press('Enter');
    await page.waitForTimeout(1500);
    // Customer Name tetap kosong = tidak ada data yang ditemukan
    const customerName = await page.inputValue('input[name="customerName"]');
    expect(customerName).toBe('');
  });

  // TC-CE-007: Field Customer Name adalah readonly (auto-filled)
  test('TC-CE-007: Field Customer Name bersifat readonly', async ({ page }) => {
    const customerNameInput = page.locator('input[name="customerName"]');
    const isReadonly = await customerNameInput.getAttribute('readonly');
    expect(isReadonly).not.toBeNull();
  });

  // TC-CE-008: Form Explanation memiliki field yang diperlukan
  test('TC-CE-008: Form Explanation memiliki field yang diperlukan', async ({ page }) => {
    await expect(page.locator('textarea[name="notes"]')).toBeAttached();
    await expect(page.locator('select[name="statusId"]')).toBeAttached();
    await expect(page.locator('select[name="typeId"]')).toBeAttached();
    await expect(page.locator('input[name="modelNumber"]')).toBeAttached();
  });

});
