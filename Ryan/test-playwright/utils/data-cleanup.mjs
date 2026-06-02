const AUTO_CLEANUP = process.env.AUTO_CLEANUP !== 'false';

function normalizeText(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function buildSearchToken(rowSnapshot = '') {
  const normalized = normalizeText(rowSnapshot);
  if (!normalized) return '';

  const contractId = normalized.match(/KTR\/[^\s]+/i)?.[0];
  if (contractId) return contractId;

  const serviceId = normalized.match(/SRV\/[^\s]+/i)?.[0];
  if (serviceId) return serviceId;

  const tokens = normalized.split(' ').filter(Boolean);
  return tokens.slice(0, 4).join(' ');
}

async function tryClickFirstVisible(locators, timeout = 1500) {
  for (const locator of locators) {
    if (await locator.isVisible({ timeout }).catch(() => false)) {
      await locator.click();
      return true;
    }
  }
  return false;
}

export function isAutoCleanupEnabled() {
  return AUTO_CLEANUP;
}

export async function cleanupNewsByTitle(page, { newsUrl, title }) {
  if (!AUTO_CLEANUP || !title) return false;

  page.once('dialog', async (dialog) => {
    await dialog.accept().catch(() => null);
  });

  await page.goto(newsUrl, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1500);

  const row = page.locator(`table tbody tr:has-text("${title}")`).first();
  const rowVisible = await row.isVisible({ timeout: 5000 }).catch(() => false);
  if (!rowVisible) return false;

  const deleteClicked = await tryClickFirstVisible([
    row.locator('button[title*="Hapus" i]').first(),
    row.locator('button[title*="Delete" i]').first(),
    row.locator('button:has-text("Hapus")').first(),
    row.locator('button:has-text("Delete")').first(),
    row.locator('a:has-text("Hapus")').first(),
    row.locator('a:has-text("Delete")').first(),
  ]);

  if (!deleteClicked) return false;

  await page.waitForTimeout(600);

  await tryClickFirstVisible([
    page.locator('button.swal2-confirm').first(),
    page.locator('button:has-text("Ya")').first(),
    page.locator('button:has-text("Yes")').first(),
    page.locator('button:has-text("Confirm")').first(),
    page.locator('button:has-text("OK")').first(),
  ], 3000);

  await page.waitForTimeout(1500);
  return true;
}

export async function cleanupTableRecordBySnapshot(page, {
  listUrl,
  rowSnapshot,
  label = 'record',
  rowLocator = 'tbody tr',
}) {
  if (!AUTO_CLEANUP || !rowSnapshot) return false;

  const searchToken = buildSearchToken(rowSnapshot);

  page.once('dialog', async (dialog) => {
    await dialog.accept().catch(() => null);
  });

  await page.goto(listUrl, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000);

  const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i]').first();
  if (searchToken && await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.fill(searchToken);
    await page.waitForTimeout(1500);
  }

  const rows = page.locator(rowLocator);
  const rowCount = await rows.count();
  if (rowCount === 0) return false;

  const snapshotText = normalizeText(rowSnapshot);

  for (let i = 0; i < Math.min(rowCount, 10); i++) {
    const row = rows.nth(i);
    const rowText = normalizeText(await row.textContent().catch(() => ''));
    if (!rowText) continue;

    const tokenFound = searchToken && rowText.toLowerCase().includes(searchToken.toLowerCase());
    const snapshotFound = snapshotText && (rowText.includes(snapshotText.slice(0, 40)) || snapshotText.includes(rowText.slice(0, 40)));
    if (!tokenFound && !snapshotFound) continue;

    const deleteClicked = await tryClickFirstVisible([
      row.locator('button[title*="Hapus" i]').first(),
      row.locator('button[title*="Delete" i]').first(),
      row.locator('[aria-label*="Hapus" i]').first(),
      row.locator('[aria-label*="Delete" i]').first(),
      row.locator('button:has-text("Hapus")').first(),
      row.locator('button:has-text("Delete")').first(),
      row.locator('a:has-text("Hapus")').first(),
      row.locator('a:has-text("Delete")').first(),
      row.locator('button.btn-danger, a.btn-danger').first(),
      row.locator('[class*="delete" i], [class*="trash" i]').first(),
    ]);

    if (!deleteClicked) continue;

    await page.waitForTimeout(700);

    await tryClickFirstVisible([
      page.locator('button.swal2-confirm').first(),
      page.locator('button:has-text("Ya")').first(),
      page.locator('button:has-text("Yes")').first(),
      page.locator('button:has-text("Confirm")').first(),
      page.locator('button:has-text("OK")').first(),
      page.locator('button:has-text("Delete")').first(),
      page.locator('button:has-text("Hapus")').first(),
    ], 3000);

    await page.waitForTimeout(1800);
    console.log(`🧹 Auto cleanup: ${label} berhasil dihapus (${searchToken || 'matched snapshot'})`);
    return true;
  }

  console.log(`🧹 Auto cleanup: ${label} tidak ditemukan atau tombol delete tidak tersedia`);
  return false;
}

export async function cleanupContractBySnapshot(page, { baseUrl, rowSnapshot }) {
  return cleanupTableRecordBySnapshot(page, {
    listUrl: `${baseUrl}/fms/vehicle/contract`,
    rowSnapshot,
    label: 'contract',
  });
}

export async function cleanupServiceBySnapshot(page, { baseUrl, rowSnapshot }) {
  return cleanupTableRecordBySnapshot(page, {
    listUrl: `${baseUrl}/fms/vehicle/service`,
    rowSnapshot,
    label: 'service',
  });
}

export async function cleanupVehicleByPlate(page, { baseUrl, licensePlate }) {
  if (!AUTO_CLEANUP || !licensePlate) return false;

  return cleanupTableRecordBySnapshot(page, {
    listUrl: `${baseUrl}/fms/vehicle`,
    rowSnapshot: licensePlate,
    label: 'vehicle',
  });
}
