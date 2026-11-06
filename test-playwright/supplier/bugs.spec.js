// supplier/bugs.spec.js - Automated Bug Audit with Video Recording untuk SEMUA langkah
import { test, expect } from '@playwright/test';
import { loginSupplier, applySessionIfAvailable, closeOCRWorker } from './helpers/auth.helper.js';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://supplier.modena.com';
const DUMMY_FILE_PATH = path.resolve('supplier/dummy-lampiran.pdf');
const VIDEO_OUTPUT_DIR = path.resolve('supplier/bug-videos');

// ✅ Rekam video SEMUA langkah (bukan hanya saat gagal)
test.use({
  video: 'on',
  screenshot: 'on',
  trace: 'on'
});

test.beforeAll(async () => {
  if (!fs.existsSync(DUMMY_FILE_PATH)) {
    fs.writeFileSync(DUMMY_FILE_PATH, '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF');
  }
  if (!fs.existsSync(VIDEO_OUTPUT_DIR)) {
    fs.mkdirSync(VIDEO_OUTPUT_DIR, { recursive: true });
  }
});

test.afterAll(async () => {
  await closeOCRWorker();
});

test.afterEach(async ({ page }, testInfo) => {
  // ✅ Copy video untuk SEMUA test (bukan hanya yang gagal)
  const video = page.video();
  if (video) {
    try {
      const testSlug = testInfo.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
      const destPath = path.join(VIDEO_OUTPUT_DIR, `${testSlug}.webm`);
      
      // Flush video dengan menutup page terlebih dahulu
      await page.close();
      const videoPath = await video.path();
      if (videoPath && fs.existsSync(videoPath)) {
        fs.copyFileSync(videoPath, destPath);
        const status = testInfo.status === testInfo.expectedStatus ? '✅ PASS' : '🐛 BUG';
        console.log(`🎥 [${status}] Video tersimpan: ${destPath}`);
      }
    } catch (err) {
      console.log('Video copy notice:', err.message);
    }
  }
});

async function ensureAuth(page) {
  await applySessionIfAvailable(page.context());
  await page.goto(`${BASE_URL}/invoice`, { waitUntil: 'domcontentloaded' });
  if (page.url().includes('/login')) {
    await loginSupplier(page, 'adm1', '1357');
  }
}

test.describe('BUG AUDIT: Modena Supplier Security & Business Logic Flaws', () => {

  test.beforeEach(async ({ page }) => {
    await ensureAuth(page);
  });

  test('AUDIT-BUG-001_Stored_XSS_Catatan', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoice/create`, { waitUntil: 'domcontentloaded' });

    const xssPayload = `<script>window.__xss_detected=true</script><img src="x" onerror="window.__xss_img=true">`;
    const uniqueInvNo = `XSS-VID-${Date.now().toString().slice(-4)}`;

    await page.fill('#apDesc', xssPayload);
    await page.fill('input[name="invoices[0][invNo]"]', uniqueInvNo);
    await page.fill('input[name="invoices[0][amount]"]', '100000');
    await page.locator('input[type="checkbox"][name*="documents"]').first().check();

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      page.click('#btn-submit-penagihan')
    ]);

    const content = await page.content();
    const hasUnsafeXSS = content.includes('<script>window.__xss_detected') || content.includes('onerror="window.__xss_img');

    // BUG DETECTED: Script tag tidak di-escape
    expect(hasUnsafeXSS, 'BUG DITEMUKAN: Tag HTML/Script tidak di-escape (Stored XSS)').toBe(false);
  });

  test('AUDIT-BUG-002_Checklist_Kosong_Tersubmit', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoice/create`, { waitUntil: 'domcontentloaded' });

    await page.fill('#apDesc', 'Test zero document checklist validation');
    await page.fill('input[name="invoices[0][invNo]"]', `NOCHECK-VID-${Date.now().toString().slice(-4)}`);
    await page.fill('input[name="invoices[0][amount]"]', '250000');

    // Kosongkan checklist
    const checkboxes = page.locator('input[type="checkbox"][name*="documents"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).uncheck();
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      page.click('#btn-submit-penagihan')
    ]);

    // BUG DETECTED: Berhasil disubmit padahal checklist dokumen wajib kosong
    expect(page.url(), 'BUG DITEMUKAN: Form berhasil disubmit tanpa satu pun dokumen wajib dicentang').toContain('/invoice/create');
  });

  test('AUDIT-BUG-003_Duplikasi_Nomor_Invoice', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoice/create`, { waitUntil: 'domcontentloaded' });
    await page.click('#btn-add-row');

    const dupInvNo = `DUP-VID-${Date.now().toString().slice(-4)}`;
    await page.locator('input[name*="[invNo]"]').nth(0).fill(dupInvNo);
    await page.locator('input[name*="[amount]"]').nth(0).fill('100000');

    await page.locator('input[name*="[invNo]"]').nth(1).fill(dupInvNo);
    await page.locator('input[name*="[amount]"]').nth(1).fill('200000');

    await page.locator('input[type="checkbox"][name*="documents"]').first().check();

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      page.click('#btn-submit-penagihan')
    ]);

    // BUG DETECTED: Mengizinkan nomor faktur ganda
    expect(page.url(), 'BUG DITEMUKAN: Sistem mengizinkan nomor invoice yang sama pada 2 baris berbeda').toContain('/invoice/create');
  });

  test('AUDIT-BUG-004_Upload_Ekstensi_File_Bypass', async ({ page }) => {
    await page.goto(`${BASE_URL}/invoice/create`, { waitUntil: 'domcontentloaded' });

    const testTxtPath = path.resolve('supplier/dummy-test.txt');
    fs.writeFileSync(testTxtPath, 'File teks yang dilarang');

    const fileInput = page.locator('input[type="file"][name*="[file]"]').first();
    await fileInput.setInputFiles(testTxtPath);

    await page.fill('#apDesc', 'Test upload non-whitelisted file extension');
    await page.fill('input[name="invoices[0][invNo]"]', `EXT-VID-${Date.now().toString().slice(-4)}`);
    await page.fill('input[name="invoices[0][amount]"]', '100000');
    await page.locator('input[type="checkbox"][name*="documents"]').first().check();

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
      page.click('#btn-submit-penagihan')
    ]);

    fs.unlinkSync(testTxtPath);

    // BUG DETECTED: File .txt diterima oleh server
    expect(page.url(), 'BUG DITEMUKAN: File .txt berhasil diunggah dan disimpan tanpa validasi MIME backend').toContain('/invoice/create');
  });
});
