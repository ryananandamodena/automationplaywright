import { test, expect } from '@playwright/test';
import { cleanupNewsByTitle, isAutoCleanupEnabled } from '../utils/data-cleanup.mjs';

const BASE_URL = 'https://portal-dev.modena.com';
const NEWS_URL = `${BASE_URL}/sfa/scc-news`;
const USERNAME = 'ade.maradona@modena.com';
const PASSWORD = 'P@ssw0rd_ade.maradona';
const RUN_TS = Date.now().toString().slice(-6);

const NEWS_TITLE = `Berita Test Otomatis ${RUN_TS}`;
const NEWS_TITLE_EDITED = `Berita Test Edited ${RUN_TS}`;
const NEWS_CONTENT = 'Ini adalah konten berita yang dibuat secara otomatis oleh Playwright testing.';
const NEWS_CONTENT_EDITED = 'Konten berita telah diperbarui oleh Playwright testing.';

async function loginAndGoToNews(browser) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  // ── 1. Login portal ─────────────────────────────────────
  console.log('📍 Navigasi ke halaman login...');
  await page.goto(`${BASE_URL}/login`, { timeout: 60000, waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  console.log('📍 Current URL:', currentUrl);

  // Email field: type="text" name="email" (bukan type="email")
  const emailField = page.locator('input[name="email"]').first();
  const isLoginPage = await emailField.isVisible().catch(() => false);

  if (isLoginPage) {
    console.log('🔐 Melakukan login...');
    await emailField.fill(USERNAME);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(4000);
    console.log('✅ Login berhasil! URL:', page.url());
  } else {
    console.log('✅ Sudah terautentikasi.');
  }

  // ── 2. Navigasi ke SCC News ──────────────────────────────
  console.log('📍 Navigasi ke halaman SCC News...');
  await page.goto(NEWS_URL, { timeout: 60000, waitUntil: 'load' });
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForTimeout(3000);

  // Jika redirect ke /sfa/authentication, tunggu redirect otomatis
  if (page.url().includes('/sfa/authentication')) {
    console.log('⏳ Menunggu SFA authentication redirect...');
    await page.waitForURL(`**\/scc-news**`, { timeout: 30000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);
  }

  // Jika masih di authentication, navigasi ulang
  if (!page.url().includes('scc-news')) {
    console.log('🔄 Re-navigasi ke SCC News...');
    await page.goto(NEWS_URL, { timeout: 60000, waitUntil: 'load' });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);
  }

  console.log('📍 URL setelah navigasi:', page.url());

  // Tunggu tabel/konten list berita muncul
  await page.waitForSelector('table.m-table, .card-body', { timeout: 20000 }).catch(() => {});

  return { context, page };
}

// ─────────────────────────────────────────────────────────────
// TEST CASE 1 – CREATE NEWS
// ─────────────────────────────────────────────────────────────
test('TC-01: Create News - tambah berita baru', async ({ browser }) => {
  const { context, page } = await loginAndGoToNews(browser);
  let createdTitle = null;

  try {
    await page.screenshot({ path: 'test-results/news-01-list-page.png', fullPage: true });

    // Klik tombol Add (btn-info)
    console.log('➕ Klik tombol Add...');
    const addBtn = page.locator('button.btn-info').first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/news-02-create-form.png', fullPage: true });
    console.log('📝 Form create berita terbuka');

    // Isi judul berita
    console.log('📝 Mengisi judul berita...');
    const titleField = page.locator('input[placeholder="Masukkan judul berita..."]').first();
    await titleField.waitFor({ state: 'visible', timeout: 10000 });
    await titleField.fill(NEWS_TITLE);
    createdTitle = NEWS_TITLE;

    // Isi konten berita
    console.log('📝 Mengisi konten berita...');
    const contentField = page.locator('textarea').first();
    const isContentVisible = await contentField.isVisible().catch(() => false);
    if (isContentVisible) {
      await contentField.click();
      await contentField.fill(NEWS_CONTENT);
    }

    await page.screenshot({ path: 'test-results/news-03-filled-create.png', fullPage: true });

    // Klik tombol Publikasikan
    console.log('💾 Mempublikasikan berita...');
    const publishBtn = page.locator('button.btn-primary', { hasText: 'Publikasikan' }).first();
    await publishBtn.waitFor({ state: 'visible', timeout: 10000 });
    await publishBtn.click();

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/news-04-after-create.png', fullPage: true });

    // Verifikasi: tidak ada modal error SweetAlert
    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    console.log(`✅ TC-01 PASSED: Berita "${NEWS_TITLE}" berhasil dibuat`);
  } finally {
    if (createdTitle && isAutoCleanupEnabled()) {
      await cleanupNewsByTitle(page, { newsUrl: NEWS_URL, title: createdTitle });
    }
    await context.close();
  }
});

// ─────────────────────────────────────────────────────────────
// TEST CASE 2 – EDIT NEWS
// ─────────────────────────────────────────────────────────────
test('TC-02: Edit News - ubah berita yang sudah ada', async ({ browser }) => {
  const { context, page } = await loginAndGoToNews(browser);

  try {
    await page.screenshot({ path: 'test-results/news-05-list-before-edit.png', fullPage: true });

    // Klik tombol Ubah (title="Ubah") pada baris pertama
    console.log('✏️ Klik tombol Ubah pada baris pertama...');
    const editBtn = page.locator('button[title="Ubah"]').first();
    await editBtn.waitFor({ state: 'visible', timeout: 15000 });
    await editBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/news-06-edit-form.png', fullPage: true });
    console.log('📝 Form edit berita terbuka');

    // Ubah judul berita
    console.log('📝 Mengubah judul berita...');
    const titleField = page.locator('input[placeholder="Masukkan judul berita..."]').first();
    await titleField.waitFor({ state: 'visible', timeout: 10000 });
    await titleField.click({ clickCount: 3 });
    await titleField.fill(NEWS_TITLE_EDITED);

    // Ubah konten berita
    console.log('📝 Mengubah konten berita...');
    const contentField = page.locator('textarea').first();
    const isContentVisible = await contentField.isVisible().catch(() => false);
    if (isContentVisible) {
      await contentField.click();
      await page.keyboard.press('Control+A');
      await contentField.fill(NEWS_CONTENT_EDITED);
    }

    await page.screenshot({ path: 'test-results/news-07-filled-edit.png', fullPage: true });

    // Klik tombol Publikasikan / Simpan
    console.log('💾 Menyimpan perubahan berita...');
    const saveBtn = page.locator('button.btn-primary', { hasText: 'Publikasikan' }).first();
    await saveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await saveBtn.click();

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/news-08-after-edit.png', fullPage: true });

    // Verifikasi: tidak ada modal error SweetAlert
    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    console.log(`✅ TC-02 PASSED: Berita berhasil diubah menjadi "${NEWS_TITLE_EDITED}"`);
  } finally {
    await context.close();
  }
});

// ─────────────────────────────────────────────────────────────
// TEST CASE 3 – DELETE NEWS
// ─────────────────────────────────────────────────────────────
test('TC-03: Delete News - hapus berita', async ({ browser }) => {
  const { context, page } = await loginAndGoToNews(browser);

  try {
    await page.screenshot({ path: 'test-results/news-09-list-before-delete.png', fullPage: true });

    // Ambil jumlah baris sebelum delete
    const rows = page.locator('table.m-table tbody tr');
    const rowCountBefore = await rows.count().catch(() => 0);
    console.log(`📊 Jumlah item sebelum delete: ${rowCountBefore}`);
    expect(rowCountBefore).toBeGreaterThan(0);

    // Klik tombol Hapus (title="Hapus") pada baris pertama
    console.log('🗑️ Klik tombol Hapus pada baris pertama...');

    // Register dialog handler SEBELUM klik (untuk native confirm popup)
    page.on('dialog', async (dialog) => {
      console.log('🗑️ Native dialog:', dialog.message());
      await dialog.accept();
    });

    const deleteBtn = page.locator('button[title="Hapus"]').first();
    await deleteBtn.waitFor({ state: 'visible', timeout: 15000 });
    await deleteBtn.click();
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/news-10-delete-confirm.png', fullPage: true });

    // Handle SweetAlert2 konfirmasi
    const swalConfirm = page.locator('button.swal2-confirm');
    const isSwalVisible = await swalConfirm.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSwalVisible) {
      console.log('🗑️ Konfirmasi SweetAlert2...');
      await swalConfirm.click();
    }

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/news-11-after-delete.png', fullPage: true });

    // Verifikasi: tidak ada modal error SweetAlert
    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    // Verifikasi: jumlah baris berkurang
    const rowCountAfter = await rows.count().catch(() => 0);
    console.log(`📊 Jumlah item setelah delete: ${rowCountAfter}`);
    expect(rowCountAfter).toBeLessThan(rowCountBefore);

    console.log('✅ TC-03 PASSED: Berita berhasil dihapus');
  } finally {
    await context.close();
  }
});

// ─────────────────────────────────────────────────────────────
// TEST CASE 4 – CREATE NEWS AS DRAFT
// ─────────────────────────────────────────────────────────────
test('TC-04: Create News Draft - simpan sebagai draft', async ({ browser }) => {
  const { context, page } = await loginAndGoToNews(browser);
  let createdTitle = null;

  try {
    await page.screenshot({ path: 'test-results/news-12-list-before-draft.png', fullPage: true });

    // Klik tombol Add
    console.log('➕ Klik tombol Add...');
    const addBtn = page.locator('button.btn-info').first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/news-13-draft-form.png', fullPage: true });
    console.log('📝 Form create berita terbuka');

    // Isi judul berita
    const draftTitle = `Berita Draft ${RUN_TS}`;
    console.log('📝 Mengisi judul berita draft...');
    const titleField = page.locator('input[placeholder="Masukkan judul berita..."]').first();
    await titleField.waitFor({ state: 'visible', timeout: 10000 });
    await titleField.fill(draftTitle);
    createdTitle = draftTitle;

    // Isi konten berita
    console.log('📝 Mengisi konten berita draft...');
    const contentField = page.locator('textarea').first();
    const isContentVisible = await contentField.isVisible().catch(() => false);
    if (isContentVisible) {
      await contentField.click();
      await contentField.fill('Ini adalah berita yang disimpan sebagai draft.');
    }

    await page.screenshot({ path: 'test-results/news-14-draft-filled.png', fullPage: true });

    // Klik tombol Simpan Draft (btn-warning)
    console.log('💾 Menyimpan sebagai draft...');
    const draftBtn = page.locator('button.btn-warning', { hasText: 'Simpan Draft' }).first();
    await draftBtn.waitFor({ state: 'visible', timeout: 10000 });
    await draftBtn.click();

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/news-15-after-draft.png', fullPage: true });

    // Verifikasi: tidak ada modal error SweetAlert
    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    // Verifikasi: berita dengan status Draft muncul di list
    await page.goto(NEWS_URL, { timeout: 30000, waitUntil: 'load' });
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(1500);

    const draftBadge = page.locator('table.m-table tbody').getByText('Draft').first();
    const isDraftVisible = await draftBadge.isVisible({ timeout: 10000 }).catch(() => false);
    if (isDraftVisible) {
      console.log('✅ Berita dengan status Draft terlihat di list');
    }

    console.log(`✅ TC-04 PASSED: Berita "${draftTitle}" berhasil disimpan sebagai draft`);
  } finally {
    if (createdTitle && isAutoCleanupEnabled()) {
      await cleanupNewsByTitle(page, { newsUrl: NEWS_URL, title: createdTitle });
    }
    await context.close();
  }
});

// ─────────────────────────────────────────────────────────────
// TEST CASE 5 – CREATE NEWS AS SCHEDULED
// ─────────────────────────────────────────────────────────────
test('TC-05: Create News Scheduled - jadwalkan berita', async ({ browser }) => {
  const { context, page } = await loginAndGoToNews(browser);
  let createdTitle = null;

  try {
    await page.screenshot({ path: 'test-results/news-16-list-before-scheduled.png', fullPage: true });

    // Klik tombol Add
    console.log('➕ Klik tombol Add...');
    const addBtn = page.locator('button.btn-info').first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/news-17-scheduled-form.png', fullPage: true });
    console.log('📝 Form create berita terbuka');

    // Isi judul berita
    const scheduledTitle = `Berita Terjadwal ${RUN_TS}`;
    console.log('📝 Mengisi judul berita terjadwal...');
    const titleField = page.locator('input[placeholder="Masukkan judul berita..."]').first();
    await titleField.waitFor({ state: 'visible', timeout: 10000 });
    await titleField.fill(scheduledTitle);
    createdTitle = scheduledTitle;

    // Isi konten berita
    console.log('📝 Mengisi konten berita terjadwal...');
    const contentField = page.locator('textarea').first();
    const isContentVisible = await contentField.isVisible().catch(() => false);
    if (isContentVisible) {
      await contentField.click();
      await contentField.fill('Ini adalah berita yang dijadwalkan untuk terbit di kemudian hari.');
    }

    // Pilih mode Jadwalkan (pub-later) — klik label karena radio diintercept label
    console.log('📅 Memilih mode jadwal...');
    const pubLaterLabel = page.locator('label[for="pub-later"]');
    await pubLaterLabel.waitFor({ state: 'visible', timeout: 10000 });
    await pubLaterLabel.click();
    await page.waitForTimeout(500);

    // Isi tanggal & jam terbit (format: MM/DD/YYYY HH:mm)
    // Jadwalkan 7 hari dari sekarang
    const pubDate = new Date();
    pubDate.setDate(pubDate.getDate() + 7);
    const mm = String(pubDate.getMonth() + 1).padStart(2, '0');
    const dd = String(pubDate.getDate()).padStart(2, '0');
    const yyyy = pubDate.getFullYear();
    const scheduleValue = `${mm}/${dd}/${yyyy} 09:00`;

    console.log(`📅 Mengisi tanggal terbit: ${scheduleValue}`);
    const dateField = page.locator('input[placeholder="Pilih tanggal & jam"]').first();
    await dateField.waitFor({ state: 'visible', timeout: 10000 });
    await dateField.fill(scheduleValue);
    // JANGAN tekan Tab — PrimeReact Calendar akan clear nilai jika klik di luar
    // Langsung klik tombol Jadwalkan (bekerja meski calendar picker masih terbuka)
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'test-results/news-18-scheduled-filled.png', fullPage: true });

    // Klik tombol Jadwalkan (btn-primary berubah jadi "Jadwalkan")
    console.log('📅 Menjadwalkan berita...');
    const scheduleBtn = page.locator('button.btn-primary', { hasText: 'Jadwalkan' }).first();
    await scheduleBtn.waitFor({ state: 'visible', timeout: 10000 });
    await scheduleBtn.click();

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/news-19-after-scheduled.png', fullPage: true });

    // Verifikasi: tidak ada modal error SweetAlert
    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    // Verifikasi: berita dengan status Scheduled muncul di list
    await page.goto(NEWS_URL, { timeout: 30000, waitUntil: 'load' });
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(1500);

    const scheduledBadge = page.locator('table.m-table tbody .badge', { hasText: 'Scheduled' }).first();
    await scheduledBadge.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Berita dengan status Scheduled terlihat di list');

    console.log(`✅ TC-05 PASSED: Berita "${scheduledTitle}" berhasil dijadwalkan pada ${scheduleValue}`);
  } finally {
    if (createdTitle && isAutoCleanupEnabled()) {
      await cleanupNewsByTitle(page, { newsUrl: NEWS_URL, title: createdTitle });
    }
    await context.close();
  }
});

// ─────────────────────────────────────────────────────────────
// TEST CASE 6 – CREATE NEWS (PUBLISH) #2 — verifikasi badge Published
// ─────────────────────────────────────────────────────────────
test('TC-06: Create News Publish - verifikasi badge Published di list', async ({ browser }) => {
  const { context, page } = await loginAndGoToNews(browser);
  let createdTitle = null;

  try {
    await page.screenshot({ path: 'test-results/news-20-list-before-publish2.png', fullPage: true });

    // Klik tombol Add
    console.log('➕ Klik tombol Add...');
    const addBtn = page.locator('button.btn-info').first();
    await addBtn.waitFor({ state: 'visible', timeout: 15000 });
    await addBtn.click();
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/news-21-publish2-form.png', fullPage: true });
    console.log('📝 Form create berita terbuka');

    // Isi judul & konten berita
    const publishTitle2 = `Berita Publish Ke-2 ${RUN_TS}`;
    console.log('📝 Mengisi judul berita...');
    const titleField = page.locator('input[placeholder="Masukkan judul berita..."]').first();
    await titleField.waitFor({ state: 'visible', timeout: 10000 });
    await titleField.fill(publishTitle2);
    createdTitle = publishTitle2;

    console.log('📝 Mengisi konten berita...');
    const contentField = page.locator('textarea').first();
    const isContentVisible = await contentField.isVisible().catch(() => false);
    if (isContentVisible) {
      await contentField.click();
      await contentField.fill('Ini adalah berita publish kedua yang dibuat oleh Playwright testing.');
    }

    await page.screenshot({ path: 'test-results/news-22-publish2-filled.png', fullPage: true });

    // Klik tombol Publikasikan
    console.log('💾 Mempublikasikan berita...');
    const publishBtn = page.locator('button.btn-primary', { hasText: 'Publikasikan' }).first();
    await publishBtn.waitFor({ state: 'visible', timeout: 10000 });
    await publishBtn.click();

    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/news-23-after-publish2.png', fullPage: true });

    // Verifikasi: tidak ada modal error SweetAlert
    const swalError = page.locator('.swal2-icon.swal2-error');
    const hasError = await swalError.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();

    // Verifikasi: berita dengan status Published muncul di list
    await page.goto(NEWS_URL, { timeout: 30000, waitUntil: 'load' });
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(1500);

    const publishedBadge = page.locator('table.m-table tbody .badge', { hasText: 'Published' }).first();
    await publishedBadge.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✅ Berita dengan status Published terlihat di list');

    console.log(`✅ TC-06 PASSED: Berita "${publishTitle2}" berhasil dipublikasikan`);
  } finally {
    if (createdTitle && isAutoCleanupEnabled()) {
      await cleanupNewsByTitle(page, { newsUrl: NEWS_URL, title: createdTitle });
    }
    await context.close();
  }
});
