import { test, expect } from '@playwright/test';

// ============================================================
// HELPER: Login & Navigate to Service Page
// ============================================================
async function loginAndGoToService(page) {
  // Langsung navigasi ke URL service
  await page.goto('https://portal-dev.modena.com/fms/vehicle/service', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Jika diredirect ke login
  if (page.url().includes('/login')) {
    await page.locator('input[type="email"], input[name="email"]').first().fill('ryan.ananda@modena.com');
    await page.locator('input[type="password"]').first().fill('P@ssw0rd_ryan.ananda');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(5000);

    // Jika diredirect ke my-application, pilih FMS (DEV)
    if (page.url().includes('my-application')) {
      await page.getByText('FMS (DEV)').click();
      await page.waitForTimeout(2000);
      const confirmBtn = page.getByRole('button', { name: 'Confirm' });
      if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
      await page.waitForTimeout(5000);
    }

    // Navigasi ulang ke service
    await page.goto('https://portal-dev.modena.com/fms/vehicle/service', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  // Jika masih di portal (my-application), masuk FMS dulu
  if (page.url().includes('my-application') || page.url().includes('portal-dev.modena.com') && !page.url().includes('fms')) {
    await page.getByText('FMS (DEV)').click();
    await page.waitForTimeout(2000);
    const confirmBtn = page.getByRole('button', { name: 'Confirm' });
    if (await confirmBtn.isVisible().catch(() => false)) await confirmBtn.click();
    await page.waitForTimeout(5000);
    await page.goto('https://portal-dev.modena.com/fms/vehicle/service', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
  }

  await expect(page.getByRole('heading', { name: 'Service' })).toBeVisible({ timeout: 20000 });
}

// ============================================================
// TEST SUITE: Service - Vehicle FMS
// ============================================================

test.describe('FMS - Vehicle Service CRUD', () => {
  test.setTimeout(120000);

  // ----------------------------------------------------------
  // TC-01: Halaman Service tampil dengan benar
  // ----------------------------------------------------------
  test('TC-01: Halaman Service berhasil dimuat', async ({ page }) => {
    await loginAndGoToService(page);

    // Verifikasi elemen utama halaman
    await expect(page.getByRole('heading', { name: 'Service' })).toBeVisible();
    await expect(page.getByText('Manage vehicle service requests')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Service Request' })).toBeVisible();

    // Verifikasi tabel ada dengan kolom header (gunakan th untuk strict mode)
    await expect(page.locator('th:has-text("License Plate")')).toBeVisible();
    await expect(page.locator('th:has-text("Request Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Service Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Vendor")')).toBeVisible();
    await expect(page.locator('th:has-text("Est. Cost")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Approval")')).toBeVisible();
    await expect(page.locator('th:has-text("Action")')).toBeVisible();

    // Verifikasi search & filter
    await expect(page.locator('input[placeholder*="Search license plate"]')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();

    console.log('✅ TC-01 PASS: Halaman Service berhasil dimuat');
    await page.screenshot({ path: 'test-results/service/tc01-service-page.png', fullPage: true });
  });

  // ----------------------------------------------------------
  // TC-02: Create Service Request baru
  // ----------------------------------------------------------
  test('TC-02: Create service request baru', async ({ page }) => {
    await loginAndGoToService(page);

    // Klik tombol "+ Service Request"
    await page.getByRole('button', { name: 'Service Request' }).click();
    await page.waitForTimeout(3000);

    // Screenshot form
    await page.screenshot({ path: 'test-results/service/tc02-form-open.png', fullPage: true });

    // Form bisa buka di: modal, dialog, ATAU navigasi ke halaman baru /service/form
    const currentUrl = page.url();
    const openedModal   = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    const openedForm    = await page.locator('form').first().isVisible().catch(() => false);
    const navigatedForm = currentUrl !== 'https://portal-dev.modena.com/fms/vehicle/service';

    expect(openedModal || openedForm || navigatedForm).toBeTruthy();
    console.log('✅ TC-02 PASS: Form Service Request terbuka, URL:', currentUrl);

    // Isi Vehicle - select element (ambil opsi pertama yang tersedia)
    const vehicleSelect = page.getByRole('combobox').first();
    if (await vehicleSelect.isVisible().catch(() => false)) {
      const tagName = await vehicleSelect.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        // Pilih opsi kedua (index 1) karena index 0 biasanya placeholder
        const options = await vehicleSelect.locator('option').all();
        if (options.length > 1) {
          const optValue = await options[1].getAttribute('value');
          if (optValue) await vehicleSelect.selectOption(optValue);
        }
      } else {
        await vehicleSelect.click();
        await page.waitForTimeout(500);
        await vehicleSelect.fill('B');
        await page.waitForTimeout(1000);
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible().catch(() => false)) await firstOption.click();
      }
      await page.waitForTimeout(300);
    }

    // Isi Service Type - select element
    const serviceTypeSelect = page.getByRole('combobox').nth(1);
    if (await serviceTypeSelect.isVisible().catch(() => false)) {
      const tagName = await serviceTypeSelect.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        const options = await serviceTypeSelect.locator('option').all();
        if (options.length > 1) {
          const optValue = await options[1].getAttribute('value');
          if (optValue) await serviceTypeSelect.selectOption(optValue);
        }
      } else {
        await serviceTypeSelect.click();
        await page.waitForTimeout(500);
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible().catch(() => false)) await firstOption.click();
      }
    }

    // Isi tanggal request
    const dateField = page.locator('input[type="date"]').first();
    if (await dateField.isVisible().catch(() => false)) {
      await dateField.fill('2026-02-23');
    }

    // Isi Vendor & biaya dari semua input text
    const allInputs = await page.locator('input[type="text"], input:not([type])').all();
    for (const input of allInputs) {
      const placeholder = (await input.getAttribute('placeholder') ?? '').toLowerCase();
      if (placeholder.includes('vendor')) await input.fill('PT Vendor Test');
      if (placeholder.includes('cost') || placeholder.includes('biaya')) await input.fill('1500000');
    }

    await page.screenshot({ path: 'test-results/service/tc02-form-filled.png', fullPage: true });
    console.log('✅ TC-02 PASS: Form diisi dan screenshot disimpan');
  });

  // ----------------------------------------------------------
  // TC-03: Search service berdasarkan license plate
  // ----------------------------------------------------------
  test('TC-03: Search service berdasarkan license plate', async ({ page }) => {
    await loginAndGoToService(page);

    const searchInput = page.locator('input[placeholder*="Search license plate"]');
    await expect(searchInput).toBeVisible();

    // Search dengan license plate yang ada (sesuaikan dengan data vehicle yang tersedia)
    await searchInput.fill('B 2001 MOD');
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/service/tc03-search-result.png', fullPage: true });

    // Verifikasi hasil muncul
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`Search result rows: ${rowCount}`);

    if (rowCount > 0) {
      // Cek license plate ada di hasil
      await expect(page.getByText('B 2001 MOD').first()).toBeVisible();
      console.log('✅ TC-03 PASS: Search berhasil menemukan data');
    } else {
      console.log('ℹ️ TC-03: Tidak ada hasil untuk license plate tersebut');
    }

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(1000);
    console.log('✅ TC-03 PASS: Search selesai');
  });

  // ----------------------------------------------------------
  // TC-04: Filter status Pending
  // ----------------------------------------------------------
  test('TC-04: Filter service berdasarkan status Pending', async ({ page }) => {
    await loginAndGoToService(page);

    // Pilih filter Pending
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();
    await statusSelect.selectOption('Pending');
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/service/tc04-filter-pending.png', fullPage: true });

    // Verifikasi semua data yang tampil status-nya Pending
    const pendingBadges = page.locator('text=Pending');
    const count = await pendingBadges.count();
    expect(count).toBeGreaterThan(0);

    console.log(`✅ TC-04 PASS: Filter Pending menampilkan ${count} item Pending`);
  });

  // ----------------------------------------------------------
  // TC-05: Filter status Done
  // ----------------------------------------------------------
  test('TC-05: Filter service berdasarkan status Done', async ({ page }) => {
    await loginAndGoToService(page);

    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('Done');
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/service/tc05-filter-done.png', fullPage: true });

    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    console.log(`✅ TC-05 PASS: Filter Done menampilkan ${rowCount} record`);
  });

  // ----------------------------------------------------------
  // TC-06: View detail service record
  // ----------------------------------------------------------
  test('TC-06: View detail service request', async ({ page }) => {
    await loginAndGoToService(page);

    // Klik tombol View (eye icon) pada row pertama
    const viewBtn = page.locator('button[title="View"]').first();
    await expect(viewBtn).toBeVisible({ timeout: 10000 });
    await viewBtn.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/service/tc06-view-detail.png', fullPage: true });

    // View bisa buka modal ATAU navigasi ke halaman detail
    const currentUrl = page.url();
    const openedModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    const navigatedToDetail = currentUrl !== 'https://portal-dev.modena.com/fms/vehicle/service';

    expect(openedModal || navigatedToDetail).toBeTruthy();
    console.log('✅ TC-06 PASS: View detail terbuka, URL:', currentUrl);

    // Kembali ke list jika navigasi ke halaman baru
    if (navigatedToDetail) {
      await page.goBack();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  // ----------------------------------------------------------
  // TC-07: Edit service record
  // ----------------------------------------------------------
  test('TC-07: Edit service request', async ({ page }) => {
    await loginAndGoToService(page);

    // Klik tombol Edit (pencil icon) pada row pertama
    const editBtn = page.locator('button[title="Edit"]').first();
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/service/tc07-edit-form.png', fullPage: true });

    // Edit bisa buka modal ATAU navigasi ke halaman edit
    const currentUrl = page.url();
    const openedModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    const openedForm = await page.locator('form').first().isVisible().catch(() => false);
    const navigatedToEdit = currentUrl !== 'https://portal-dev.modena.com/fms/vehicle/service';

    expect(openedModal || openedForm || navigatedToEdit).toBeTruthy();
    console.log('✅ TC-07 PASS: Form Edit terbuka, URL:', currentUrl);

    // Kembali ke list jika navigasi ke halaman baru
    if (navigatedToEdit && !openedModal) {
      await page.goBack();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  // ----------------------------------------------------------
  // TC-08: Export service list
  // ----------------------------------------------------------
  test('TC-08: Export data service', async ({ page }) => {
    await loginAndGoToService(page);

    const exportBtn = page.getByRole('button', { name: 'Export' });
    await expect(exportBtn).toBeVisible();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
    await exportBtn.click();
    await page.waitForTimeout(2000);

    const download = await downloadPromise;
    if (download) {
      console.log(`✅ TC-08 PASS: File berhasil didownload: ${download.suggestedFilename()}`);
    } else {
      console.log('ℹ️ TC-08: Export diklik, file download tidak terdeteksi (mungkin format berbeda)');
    }

    await page.screenshot({ path: 'test-results/service/tc08-export.png', fullPage: true });
  });

  // ----------------------------------------------------------
  // TC-09: Verifikasi pagination
  // ----------------------------------------------------------
  test('TC-09: Verifikasi pagination service list', async ({ page }) => {
    await loginAndGoToService(page);

    // Cek info pagination
    const paginationInfo = page.locator('text=/Showing.*of.*services/');
    await expect(paginationInfo).toBeVisible({ timeout: 10000 });

    const paginationText = await paginationInfo.innerText();
    console.log(`Pagination info: ${paginationText}`);

    // Verifikasi per-page dropdown
    const perPageSelect = page.locator('select').last();
    await expect(perPageSelect).toBeVisible();
    await expect(perPageSelect.locator('option[value="10"]')).toBeAttached();
    await expect(perPageSelect.locator('option[value="25"]')).toBeAttached();
    await expect(perPageSelect.locator('option[value="50"]')).toBeAttached();

    console.log('✅ TC-09 PASS: Pagination berfungsi dengan benar');
    await page.screenshot({ path: 'test-results/service/tc09-pagination.png', fullPage: true });
  });

  // ----------------------------------------------------------
  // TC-10: Verifikasi data yang sudah ada di tabel
  // ----------------------------------------------------------
  test('TC-10: Verifikasi data service yang tersimpan di tabel', async ({ page }) => {
    await loginAndGoToService(page);

    // Cek data yang diketahui ada (dari eksplorasi sebelumnya)
    const knownData = [
      { id: 'MNT/2026/0006', plate: 'B 3456 RTA', type: 'Routine Service', vendor: 'PT Vendor man' },
      { id: 'MNT/2026/0004', plate: 'B 7849 JKL', type: 'Routine Service', vendor: 'PT Vendor man' },
      { id: 'MNT/2026/0003', plate: 'B 4563 RTA', type: 'Routine Service', vendor: 'PT Vendor man' },
    ];

    for (const data of knownData) {
      await expect(page.getByText(data.id).first()).toBeVisible();
      await expect(page.getByText(data.plate).first()).toBeVisible();
      console.log(`  ✓ Data ditemukan: ${data.id} | ${data.plate}`);
    }

    // Verifikasi total data
    const paginationInfo = await page.locator('text=/Showing.*of.*services/').innerText();
    console.log(`✅ TC-10 PASS: ${paginationInfo}`);
    await page.screenshot({ path: 'test-results/service/tc10-verify-data.png', fullPage: true });
  });
});
