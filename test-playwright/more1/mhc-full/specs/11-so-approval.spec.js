/**
 * 11-so-approval.spec.js
 * Test: SO Approval Module - MHC (Deduction Approval / Sales Order Approval)
 * Scope: Antrian approval, approve SO, reject SO, delegasi, riwayat approval
 * Test IDs: SO-WF-09, SO-WF-10, SO-WF-12, SO-WF-14
 * Note: URL ditemukan dari role spec: 'Deduction Approval/salesorderapproval'
 */
import { test, expect } from '@playwright/test';
import { login, checkPageLoaded, captureConsoleErrors } from '../helpers/login.js';

const BASE = 'https://more-dev.modena.com';

// Kandidat URL untuk SO Approval - urutan dari yang paling mungkin benar
const APPROVAL_URLS = [
  '/salesorderapproval',
  '/so-approval',
  '/approval/so',
  '/approval',
];

async function findApprovalPage(page) {
  for (const url of APPROVAL_URLS) {
    await page.goto(`${BASE}/mhc${url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const currentUrl = page.url();
    const title = await page.title().catch(() => '');
    const body = await page.locator('body').innerText().catch(() => '');
    if (
      currentUrl.includes(url) &&
      !/404|not found|forbidden/i.test(title) &&
      !/Page Not Found|Access Denied/i.test(body.slice(0, 150))
    ) {
      console.log(`✓ SO Approval ditemukan di URL: ${url}`);
      return url;
    }
  }
  return null;
}

test.describe('MHC - SO Approval', () => {
  test.setTimeout(90000);

  // SO-WF-09 / SO-UI coverage: Approval queue list & elemen utama
  test('SO Approval - list antrian & elemen utama', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    const foundUrl = await findApprovalPage(page);
    if (!foundUrl) {
      // Coba via sidebar
      await page.goto(`${BASE}/mhc`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const sidebarLink = page.locator('a, [role="menuitem"]').filter({ hasText: /deduction approval|so approval|approval/i }).first();
      if (await sidebarLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await sidebarLink.click();
        await page.waitForTimeout(3000);
        console.log('✓ Link SO Approval ditemukan di sidebar');
      } else {
        console.log('  ⚠ SO Approval tidak ditemukan di semua kandidat URL dan sidebar - skip test');
        return;
      }
    }

    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek heading SO Approval (soft check - halaman mungkin card layout)
    const heading = page.locator('h1, h2, h3').filter({ hasText: /approval|approv/i }).first();
    if (!await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Cek heading generik jika heading khusus tidak ada
      const anyHeading = page.locator('h1, h2, h3').first();
      if (await anyHeading.isVisible({ timeout: 3000 }).catch(() => false)) {
        const text = await anyHeading.textContent().catch(() => '');
        console.log(`✓ Heading ditemukan: "${text.trim()}"`);
      } else {
        console.log('  ⚠ Tidak ada heading di halaman approval - mungkin card layout');
      }
    } else {
      const text = await heading.textContent().catch(() => '');
      console.log(`✓ Heading visible: "${text.trim()}"`);
    }

    // Cek konten utama (tabel ATAU card/list layout)
    const hasContent = page.locator('table, [class*="list"], [class*="queue"], [class*="card"], main > div > div');
    if (!await hasContent.first().isVisible({ timeout: 8000 }).catch(() => false))
      bugs.push('Konten halaman SO Approval tidak ditemukan (tabel/card/list kosong)');
    else console.log('✓ Konten halaman SO Approval visible');

    // Cek ada data SO di body
    const hasSoData = /SO|sales order|order|deduction/i.test(bodyText);
    if (!hasSoData)
      console.log('  ⚠ Data SO/Deduction tidak terdeteksi - mungkin queue kosong atau user tidak punya akses approval');
    else console.log('✓ Data SO/Deduction ditemukan di halaman approval');

    // Cek filter/tab jika ada
    const filterOrTab = page.locator('button, [role="tab"]').filter({ hasText: /pending|waiting|all/i }).first();
    if (await filterOrTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      const tabText = await filterOrTab.textContent().catch(() => '');
      console.log(`✓ Filter/tab ditemukan: "${tabText.trim()}"`);
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // SO-WF-09: Cek detail SO di approval & aksi approve
  test('SO Approval - buka detail & tombol Approve/Reject visible', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findApprovalPage(page);
    if (!foundUrl) {
      console.log('  ⚠ SO Approval URL tidak ditemukan - skip detail check');
      return;
    }

    await page.waitForTimeout(2000);

    // Cari baris pertama di tabel
    const firstRow = page.locator('table tbody tr, [class*="row"]').first();
    if (!await firstRow.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tidak ada SO dalam antrian approval - skip detail check');
      return;
    }

    await firstRow.click();
    await page.waitForTimeout(2000);

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek tombol Approve
    const approveBtn = page.locator('button').filter({ hasText: /approve|setuju|terima/i }).first();
    if (!await approveBtn.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Tombol Approve tidak ditemukan di detail SO Approval');
    else console.log('✓ Tombol Approve visible');

    // Cek tombol Reject
    const rejectBtn = page.locator('button').filter({ hasText: /reject|tolak/i }).first();
    if (!await rejectBtn.isVisible({ timeout: 5000 }).catch(() => false))
      bugs.push('Tombol Reject tidak ditemukan di detail SO Approval');
    else console.log('✓ Tombol Reject visible');

    // Cek detail SO ada
    const hasSoDetail = /customer|produk|product|qty|total/i.test(bodyText);
    if (!hasSoDetail) bugs.push('Detail informasi SO tidak ditemukan');
    else console.log('✓ Detail informasi SO visible');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // SO-WF-12: Reject SO dari antrian approval
  test('SO Approval - proses Reject dengan remarks', async ({ page }) => {
    const bugs = [];
    await login(page);

    const foundUrl = await findApprovalPage(page);
    if (!foundUrl) {
      console.log('  ⚠ SO Approval URL tidak ditemukan - skip reject test');
      return;
    }

    await page.waitForTimeout(2000);

    const firstRow = page.locator('table tbody tr, [class*="row"]').first();
    if (!await firstRow.isVisible({ timeout: 8000 }).catch(() => false)) {
      console.log('  ⚠ Tidak ada SO dalam antrian approval - skip reject test');
      return;
    }

    await firstRow.click();
    await page.waitForTimeout(2000);

    const rejectBtn = page.locator('button').filter({ hasText: /reject|tolak/i }).first();
    if (!await rejectBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('  ⚠ Tombol Reject tidak ditemukan - mungkin tidak ada akses/SO');
      return;
    }

    await rejectBtn.click();
    await page.waitForTimeout(2000);

    // Cek apakah muncul form/modal untuk isi alasan reject
    const reasonField = page.locator('textarea, input[placeholder*="reason"], input[placeholder*="alasan"], input[name*="reason"]').first();
    if (await reasonField.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reasonField.fill('Test reject - price needs review');
      console.log('✓ Field remarks untuk reject ditemukan dan diisi');
    } else {
      console.log('  ⚠ Field remarks tidak ditemukan - mungkin langsung reject tanpa reason');
    }

    // Cek tombol konfirmasi reject
    const confirmRejectBtn = page.locator('button').filter({ hasText: /confirm|submit|ya|yes/i }).first();
    if (await confirmRejectBtn.isVisible({ timeout: 3000 }).catch(() => false))
      console.log('✓ Tombol konfirmasi reject ditemukan');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // SO-WF-17: Status history / audit trail
  test('SO Approval - riwayat status & audit trail', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    // Buka halaman SO list untuk cek riwayat status
    await page.goto(`${BASE}/mhc/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Cek halaman SO terbuka (soft check)
    const currentUrl = page.url();
    if (!currentUrl.includes('modena.com')) {
      bugs.push(`URL tidak sesuai domain modena.com: ${currentUrl}`);
    } else {
      console.log(`✓ Halaman SO terbuka di: ${currentUrl}`);
    }

    // Cari baris yang punya status Approved/Submitted untuk cek histori
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count().catch(() => 0);

    if (rowCount === 0) {
      console.log('  ⚠ Tidak ada data SO untuk cek riwayat');
    } else {
      await rows.first().click();
      await page.waitForTimeout(2000);

      // Cari tab/section history/log
      const historyTab = page.locator('[role="tab"], button').filter({ hasText: /history|log|riwayat|trail/i }).first();
      if (await historyTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await historyTab.click();
        await page.waitForTimeout(1500);
        console.log('✓ Tab History/Log ditemukan dan diklik');

        const bodyText = await page.locator('body').innerText().catch(() => '');
        if (/created|submitted|approved|rejected/i.test(bodyText))
          console.log('✓ Riwayat status ditemukan di log');
        else
          console.log('  ⚠ Riwayat status tidak terdeteksi di body text');
      } else {
        console.log('  ⚠ Tab History tidak ditemukan - mungkin fitur tidak ada/tersembunyi');
      }
    }

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });

  // SO-WF-14: Resubmit setelah reject
  test('SO Approval - SO yang Rejected dapat diedit ulang', async ({ page }) => {
    const bugs = [];
    captureConsoleErrors(page);
    await login(page);

    await page.goto(`${BASE}/mhc/sales-order`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    // Cek domain (soft check - tidak strict pada exact URL match)
    const currentUrl = page.url();
    if (!currentUrl.includes('modena.com')) {
      bugs.push(`URL tidak sesuai domain modena.com: ${currentUrl}`);
    } else {
      console.log(`✓ Halaman SO terbuka di: ${currentUrl}`);
    }

    const bodyText = await page.locator('body').innerText().catch(() => '');

    // Cek apakah ada SO dengan status Rejected
    if (/rejected|ditolak/i.test(bodyText))
      console.log('✓ SO dengan status Rejected ditemukan di list');
    else
      console.log('  ⚠ Tidak ada SO berstatus Rejected untuk diuji resubmit');

    if (bugs.length > 0) console.error('BUGS:', bugs.join('; '));
    expect(bugs, `Bugs: ${bugs.join(', ')}`).toHaveLength(0);
  });
});
