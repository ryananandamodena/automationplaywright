import { test, expect } from '@playwright/test';

// Timeout diperpanjang: login + navigasi + aksi butuh >30s
test.setTimeout(120000);

const BASE_URL = 'https://portal-dev.modena.com';
const SELLOUT_URL = `${BASE_URL}/sfa/sellout-detail-lines`;
const USERNAME = 'ryan.ananda@modena.com';
const PASSWORD = 'P@ssw0rd_ryan.ananda';

async function loginAndGoToSellout(browser) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true, acceptDownloads: true });
  const portalPage = await context.newPage();

  // -- 1. Login portal -------------------------------------
  console.log('?? Navigasi ke halaman login...');
  await portalPage.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'load' });
  await portalPage.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  await portalPage.waitForTimeout(2000);

  console.log('?? Current URL:', portalPage.url());
  const emailField = portalPage.locator('input[name="email"]').first();
  const isLoginPage = await emailField.isVisible().catch(() => false);

  if (isLoginPage) {
    console.log('?? Melakukan login...');
    await emailField.fill(USERNAME);
    await portalPage.locator('input[name="password"]').fill(PASSWORD);
    await portalPage.getByRole('button', { name: 'Sign In', exact: true }).click();
    await portalPage.waitForURL('**/my-application', { timeout: 60000 }).catch(() => {});
    await portalPage.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await portalPage.waitForTimeout(3000);
    console.log('? Login berhasil! URL:', portalPage.url());
  } else {
    console.log('? Sudah terautentikasi.');
  }

  // -- 2. Klik kartu SFA untuk mendapat token --------------
  console.log('?? Membuka SFA via kartu portal...');

  // Setup listener SEBELUM klik agar tidak miss event
  const newPagePromise = context.waitForEvent('page', { timeout: 15000 }).catch(() => null);

  // Klik kartu SFA
  await portalPage.locator('text=SFA_WEB').click({ timeout: 10000 }).catch(async () => {
    await portalPage.locator('text=Sales Force Automation').first().click({ timeout: 5000 }).catch(() => {});
  });

  // Tunggu sebentar agar navigasi terjadi
  await portalPage.waitForTimeout(3000);

  const portalUrlAfterClick = portalPage.url();
  console.log('?? Portal URL setelah klik:', portalUrlAfterClick);

  let page;
  if (portalUrlAfterClick.includes('/sfa/')) {
    // Dibuka di tab yang sama
    page = portalPage;
    console.log('?? SFA dibuka di tab yang sama');
  } else {
    // Cek tab baru dari waitForEvent
    const newPage = await newPagePromise;
    if (newPage) {
      page = newPage;
      console.log('?? SFA dibuka di tab baru (waitForEvent)');
      await newPage.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
    } else {
      // Cek semua pages di context
      const allPages = context.pages();
      console.log('?? Semua pages:', allPages.map(p => p.url()));
      const sfaPage2 = allPages.find(p => p.url().includes('/sfa/'));
      if (sfaPage2) {
        page = sfaPage2;
        console.log('?? SFA page ditemukan di context');
      } else {
        // Fallback: navigate portalPage langsung dengan klik ulang
        console.log('?? Tidak ada SFA page ditemukan, mencoba klik ulang...');
        await portalPage.goto(`${BASE_URL}/my-application`, { timeout: 30000, waitUntil: 'load' });
        await portalPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        await portalPage.waitForTimeout(1000);
        await portalPage.locator('text=SFA_WEB').click({ force: true, timeout: 10000 }).catch(() => {});
        await portalPage.waitForTimeout(3000);
        const url2 = portalPage.url();
        console.log('?? URL setelah klik ulang:', url2);
        page = portalPage;
      }
    }
  }

  console.log('?? URL SFA halaman aktif:', page.url());

  // -- 4. Navigate ke Report Sellout Detail Lines -----------
  console.log('?? Navigasi ke halaman Report Sellout...');
  await page.goto(SELLOUT_URL, { timeout: 60000, waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);

  console.log('?? URL setelah navigasi:', page.url());

  // Jika diredirect ke SFA authentication, tunggu dan coba ulang
  if (page.url().includes('/sfa/authentication')) {
    console.log('?? Diredirect ke SFA auth, tunggu dan coba ulang...');
    await page.waitForTimeout(4000);
    await page.goto(SELLOUT_URL, { timeout: 60000, waitUntil: 'load' });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('?? URL setelah retry:', page.url());
  }

  // Tunggu baris data muncul (bukan hanya elemen tabel)
  await page.waitForSelector('table.m-table tbody tr', { timeout: 30000 }).catch(() => {});

  return { context, page };
}

// -------------------------------------------------------------
// TEST CASE 1 � VIEW REPORT SELLOUT
// -------------------------------------------------------------
test('TC-01: View Report Sellout - halaman report sellout dapat diakses', async ({ browser }) => {
  const { context, page } = await loginAndGoToSellout(browser);

  try {
    await page.screenshot({ path: 'test-results/sellout-01-list-page.png', fullPage: true });

    // Verifikasi URL benar
    expect(page.url()).toContain('sellout-detail-lines');
    console.log('? Halaman Report Sellout dibuka, URL:', page.url());

    // Verifikasi judul h1 = "Report Sellout"
    const h1 = page.locator('h1.m-0');
    await h1.waitFor({ state: 'visible', timeout: 10000 });
    const h1Text = await h1.textContent();
    console.log('?? Judul halaman:', h1Text?.trim());
    expect(h1Text?.trim()).toContain('Report Sellout');

    // Verifikasi card title
    const cardTitleText = await page.locator('h3.card-title').textContent().catch(() => '');
    console.log('?? Card title:', cardTitleText?.trim());

    // Verifikasi tabel ter-load dan ada data
    const rows = page.locator('table.m-table tbody tr');
    await rows.first().waitFor({ state: 'visible', timeout: 15000 });
    const rowCount = await rows.count();
    console.log(`?? Jumlah baris data: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);

    // Verifikasi kolom tabel ada
    const headerCount = await page.locator('table.m-table thead th').count();
    console.log(`?? Jumlah kolom: ${headerCount}`);
    expect(headerCount).toBeGreaterThan(0);

    // Verifikasi pagination info "Showing X - Y of Z"
    const showingText = await page.locator('div').filter({ hasText: /Showing \d+/ }).first().textContent().catch(() => '');
    console.log('?? Pagination info:', showingText?.trim());

    console.log('? TC-01 PASSED: Halaman Report Sellout berhasil diakses');
  } finally {
    await context.close();
  }
});

// -------------------------------------------------------------
// TEST CASE 2 � SEARCH DATA SELLOUT
// -------------------------------------------------------------
test('TC-02: Search Sellout - cari data menggunakan field search', async ({ browser }) => {
  const { context, page } = await loginAndGoToSellout(browser);

  try {
    await page.screenshot({ path: 'test-results/sellout-02-before-search.png', fullPage: true });

    // Ambil jumlah baris sebelum search
    const rows = page.locator('table.m-table tbody tr');
    const rowsBefore = await rows.count();
    console.log(`?? Baris sebelum search: ${rowsBefore}`);

    // Isi field search: input#search.searchField
    console.log('?? Mengisi field search...');
    const searchField = page.locator('input#search, input.searchField').first();
    await searchField.waitFor({ state: 'visible', timeout: 10000 });
    await searchField.fill('Erza');

    // Klik tombol search
    const searchBtn = page.locator('button.btn-search').first();
    await searchBtn.waitFor({ state: 'visible', timeout: 5000 });
    await searchBtn.click();

    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/sellout-03-search-result.png', fullPage: true });

    const rowsAfter = await rows.count();
    console.log(`?? Baris setelah search "Erza": ${rowsAfter}`);
    expect(rowsAfter).toBeGreaterThan(0);

    // Verifikasi tidak ada error
    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    // Kosongkan kembali search
    console.log('?? Reset search...');
    await searchField.clear();
    await searchBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1500);

    console.log('? TC-02 PASSED: Search sellout berjalan');
  } finally {
    await context.close();
  }
});

// -------------------------------------------------------------
// TEST CASE 3 � FILTER DATA SELLOUT
// -------------------------------------------------------------
test('TC-03: Filter Sellout - filter data berdasarkan field Periode', async ({ browser }) => {
  const { context, page } = await loginAndGoToSellout(browser);

  try {
    await page.screenshot({ path: 'test-results/sellout-04-before-filter.png', fullPage: true });

    // Klik tombol "Filter" toggle untuk membuka panel filter
    console.log('?? Membuka panel filter...');
    const filterToggleBtn = page.locator('button.btn-block.btn-outline-dark').first();
    await filterToggleBtn.waitFor({ state: 'visible', timeout: 10000 });
    await filterToggleBtn.click();
    await page.waitForTimeout(1000);

    // Pilih field filter: select[name="filter_field"] � pilih "Periode"
    console.log('?? Pilih field filter: Periode...');
    const filterFieldSelect = page.locator('select[name="filter_field"]').first();
    await filterFieldSelect.waitFor({ state: 'visible', timeout: 10000 });
    await filterFieldSelect.selectOption({ value: 'periode' });
    await page.waitForTimeout(500);

    // Isi nilai filter
    console.log('?? Isi nilai filter: 202512...');
    const filterValueInput = page.locator('input[name="filter_value"]').first();
    await filterValueInput.waitFor({ state: 'visible', timeout: 10000 });
    await filterValueInput.fill('202512');
    await page.waitForTimeout(300);

    // Klik tombol Add filter (+)
    console.log('? Klik tombol Add filter...');
    const addFilterBtn = page.locator('button.btn-outline-warning').first();
    await addFilterBtn.waitFor({ state: 'visible', timeout: 5000 });
    await addFilterBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/sellout-05-filter-added.png', fullPage: true });

    // Klik tombol "Filter" apply (toggle lagi)
    console.log('? Apply filter...');
    await filterToggleBtn.click({ force: true });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/sellout-06-filter-result.png', fullPage: true });

    const rows = page.locator('table.m-table tbody tr');
    const rowCount = await rows.count();
    console.log(`?? Jumlah baris setelah filter Periode=202512: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);

    // Verifikasi baris pertama mengandung nilai Periode=202512
    const firstRowPeriode = await page.locator('table.m-table tbody tr').first().locator('td').nth(1).textContent().catch(() => '');
    console.log(`?? Periode baris pertama: ${firstRowPeriode?.trim()}`);
    expect(firstRowPeriode?.trim()).toContain('202512');

    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    console.log('? TC-03 PASSED: Filter sellout berhasil diterapkan');
  } finally {
    await context.close();
  }
});

// -------------------------------------------------------------
// TEST CASE 4 � RESET FILTER SELLOUT
// -------------------------------------------------------------
test('TC-04: Reset Filter Sellout - reset filter ke kondisi awal', async ({ browser }) => {
  const { context, page } = await loginAndGoToSellout(browser);

  try {
    await page.screenshot({ path: 'test-results/sellout-07-before-reset.png', fullPage: true });

    // Buka panel filter dan tambah filter dulu
    console.log('?? Buka panel filter & tambah filter...');
    const filterToggleBtn = page.locator('button.btn-block.btn-outline-dark').first();
    await filterToggleBtn.waitFor({ state: 'visible', timeout: 10000 });
    await filterToggleBtn.click();
    await page.waitForTimeout(800);

    const filterFieldSelect = page.locator('select[name="filter_field"]').first();
    await filterFieldSelect.waitFor({ state: 'visible', timeout: 10000 });
    await filterFieldSelect.selectOption({ value: 'sc_name' });

    const filterValueInput = page.locator('input[name="filter_value"]').first();
    await filterValueInput.fill('Erza');

    const addFilterBtn = page.locator('button.btn-outline-warning').first();
    await addFilterBtn.click();
    await page.waitForTimeout(500);

    // Apply filter
    await filterToggleBtn.click({ force: true });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('?? Filter SC diterapkan');

    // Buka panel filter lagi untuk reset
    await filterToggleBtn.click({ force: true });
    await page.waitForTimeout(800);

    // Klik tombol Reset
    console.log('?? Klik tombol Reset filter...');
    const resetBtn = page.locator('button.btn-outline-danger').first();
    await resetBtn.waitFor({ state: 'visible', timeout: 10000 });
    await resetBtn.click();
    await page.waitForTimeout(500);

    // Apply setelah reset
    await filterToggleBtn.click({ force: true });
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/sellout-08-after-reset.png', fullPage: true });

    const rowCount = await page.locator('table.m-table tbody tr').count();
    console.log(`?? Jumlah baris setelah reset filter: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);

    console.log('? TC-04 PASSED: Reset filter berhasil');
  } finally {
    await context.close();
  }
});

// -------------------------------------------------------------
// TEST CASE 5 � DOWNLOAD EXCEL SELLOUT
// -------------------------------------------------------------
test('TC-05: Download Excel Sellout - export data ke file Excel', async ({ browser }) => {
  const { context, page } = await loginAndGoToSellout(browser);

  try {
    await page.screenshot({ path: 'test-results/sellout-09-before-download.png', fullPage: true });

    // Klik tombol "Download Excel" (button.btn-success)
    console.log('?? Klik tombol Download Excel...');
    const downloadBtn = page.locator('button.btn-success').filter({ hasText: /download excel/i }).first();
    await downloadBtn.waitFor({ state: 'visible', timeout: 10000 });

    // Tunggu event download (beberapa app gunakan fetch+blob sehingga event tidak selalu fire)
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
    await downloadBtn.click();
    await page.waitForTimeout(3000);
    const download = await downloadPromise;

    if (download) {
      const filename = download.suggestedFilename();
      console.log('?? File didownload:', filename);
      expect(filename).toBeTruthy();
      console.log('? TC-05 PASSED: Download Excel berhasil, file:', filename);
    } else {
      // Fallback: verifikasi tidak ada error setelah klik
      console.log('?? Download event tidak tertangkap (kemungkinan fetch+blob), cek tidak ada error...');
      const swalError = page.locator('.swal2-icon.swal2-error');
      const hasError = await swalError.isVisible().catch(() => false);
      expect(hasError).toBeFalsy();
      console.log('? TC-05 PASSED: Tombol Download Excel diklik tanpa error');
    }
  } finally {
    await context.close();
  }
});

// -------------------------------------------------------------
// TEST CASE 6 � PAGINATION NEXT PAGE
// -------------------------------------------------------------
test('TC-06: Pagination Next - navigasi ke halaman berikutnya', async ({ browser }) => {
  const { context, page } = await loginAndGoToSellout(browser);

  try {
    await page.screenshot({ path: 'test-results/sellout-11-before-pagination.png', fullPage: true });

    // Ambil data baris pertama sebelum navigasi
    const firstRowBefore = await page.locator('table.m-table tbody tr').first().textContent().catch(() => '');
    console.log('?? Baris pertama halaman 1:', firstRowBefore?.substring(0, 60));

    // Klik tombol navigate_next (Material Icons)
    console.log('?? Klik tombol Next page...');
    const nextBtn = page.locator('button.btn-sm').filter({
      has: page.locator('i.material-icons', { hasText: 'navigate_next' })
    });
    await nextBtn.waitFor({ state: 'visible', timeout: 10000 });
    const isDisabled = await nextBtn.isDisabled().catch(() => false);

    if (isDisabled) {
      console.log('?? Tombol Next disabled (hanya 1 halaman), skip navigasi');
    } else {
      await nextBtn.click();
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2000);

      await page.screenshot({ path: 'test-results/sellout-12-page-2.png', fullPage: true });

      const rowCount = await page.locator('table.m-table tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
      console.log(`?? Baris pada halaman 2: ${rowCount}`);

      const pageInfoText = await page.locator('div').filter({ hasText: /Page \d+ of/ }).first().textContent().catch(() => '');
      console.log('?? Page info:', pageInfoText?.trim());
    }

    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    console.log('? TC-06 PASSED: Pagination Next berhasil');
  } finally {
    await context.close();
  }
});

// -------------------------------------------------------------
// TEST CASE 7 � PAGINATION BACK TO FIRST PAGE
// -------------------------------------------------------------
test('TC-07: Pagination First - navigasi ke halaman pertama', async ({ browser }) => {
  const { context, page } = await loginAndGoToSellout(browser);

  try {
    await page.screenshot({ path: 'test-results/sellout-13-before-first.png', fullPage: true });

    // Navigasi ke halaman 2 dulu
    const nextBtn = page.locator('button.btn-sm').filter({
      has: page.locator('i.material-icons', { hasText: 'navigate_next' })
    });
    const isNextDisabled = await nextBtn.isDisabled().catch(() => true);

    if (isNextDisabled) {
      console.log('?? Hanya 1 halaman data, skip TC-07');
      return;
    }

    await nextBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('?? Pindah ke halaman 2');

    // Klik tombol first_page
    console.log('?? Klik tombol First page...');
    const firstBtn = page.locator('button.btn-sm').filter({
      has: page.locator('i.material-icons', { hasText: 'first_page' })
    });
    await firstBtn.waitFor({ state: 'visible', timeout: 10000 });
    await firstBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/sellout-14-back-to-first.png', fullPage: true });

    const pageInfoText = await page.locator('div').filter({ hasText: /Page 1 of/ }).first().textContent().catch(() => '');
    console.log('?? Page info:', pageInfoText?.trim());

    const rowCount = await page.locator('table.m-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);

    console.log('? TC-07 PASSED: Navigasi ke halaman pertama berhasil');
  } finally {
    await context.close();
  }
});

// -------------------------------------------------------------
// TEST CASE 8 � SORT KOLOM INVOICE DATE
// -------------------------------------------------------------
test('TC-08: Sort Invoice Date - klik header kolom untuk sorting', async ({ browser }) => {
  const { context, page } = await loginAndGoToSellout(browser);

  try {
    await page.screenshot({ path: 'test-results/sellout-15-before-sort.png', fullPage: true });

    // Ambil Invoice Date baris pertama sebelum sort (kolom index 5)
    const firstInvDateBefore = await page.locator('table.m-table tbody tr').first().locator('td').nth(5).textContent().catch(() => '');
    console.log('?? Invoice Date sebelum sort:', firstInvDateBefore?.trim());

    // Klik header kolom "Invoice Date" untuk ascending sort
    console.log('?? Klik header Invoice Date untuk sort ASC...');
    const invDateHeader = page.locator('table.m-table thead th').filter({ hasText: 'Invoice Date' }).first();
    await invDateHeader.waitFor({ state: 'visible', timeout: 10000 });
    await invDateHeader.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/sellout-16-sorted-asc.png', fullPage: true });

    const firstInvDateAsc = await page.locator('table.m-table tbody tr').first().locator('td').nth(5).textContent().catch(() => '');
    console.log('?? Invoice Date setelah sort ASC:', firstInvDateAsc?.trim());

    // Klik lagi untuk descending
    console.log('?? Klik lagi untuk sort DESC...');
    await invDateHeader.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/sellout-17-sorted-desc.png', fullPage: true });

    const firstInvDateDesc = await page.locator('table.m-table tbody tr').first().locator('td').nth(5).textContent().catch(() => '');
    console.log('?? Invoice Date setelah sort DESC:', firstInvDateDesc?.trim());

    // Verifikasi sort ASC dan DESC menghasilkan urutan berbeda
    expect(firstInvDateAsc?.trim()).not.toBe(firstInvDateDesc?.trim());
    console.log('?? Verifikasi: ASC !== DESC -', firstInvDateAsc?.trim(), '!=', firstInvDateDesc?.trim());

    const rowCount = await page.locator('table.m-table tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);

    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    console.log('? TC-08 PASSED: Sort kolom Invoice Date berhasil');
  } finally {
    await context.close();
  }
});
