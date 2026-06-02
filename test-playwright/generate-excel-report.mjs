import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jsonFile = path.join(__dirname, 'prive-results.json');

if (!fs.existsSync(jsonFile)) {
  console.error('File prive-results.json tidak ditemukan. Jalankan playwright test dulu.');
  process.exit(1);
}

const raw = fs.readFileSync(jsonFile, 'utf8');
// JSON reporter output bisa ada prefix text sebelum { atau [
const jsonStart = raw.indexOf('{');
const data = JSON.parse(raw.slice(jsonStart));

// Load screenshot map (title → path)
const screenshotMapFile = path.join(__dirname, 'prive-screenshot-map.json');
let screenshotMap = {};
if (fs.existsSync(screenshotMapFile)) {
  try { screenshotMap = JSON.parse(fs.readFileSync(screenshotMapFile, 'utf8')); } catch (_) {}
}

// Helper: ambil path screenshot dari attachments test result
function getScreenshotPath(result) {
  const attachments = result.attachments || [];
  const ss = attachments.find(a => a.name === 'screenshot' && a.path && fs.existsSync(a.path));
  return ss ? ss.path : null;
}

// Helper: cari screenshot PNG di test-results berdasarkan folder yang cocok dengan title
const testResultsDir = path.join(__dirname, 'test-results');
let _allResultFolders = null;
function getAllResultFolders() {
  if (_allResultFolders) return _allResultFolders;
  if (!fs.existsSync(testResultsDir)) return (_allResultFolders = []);
  _allResultFolders = fs.readdirSync(testResultsDir).map(name => ({
    name,
    nameLower: name.toLowerCase(),
    fullPath: path.join(testResultsDir, name),
  }));
  return _allResultFolders;
}

function makeSlug(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function findScreenshotByFolder(specTitle) {
  const folders = getAllResultFolders();
  const titleSlug = makeSlug(specTitle);

  // Cari folder yang paling mirip dengan title
  let best = null;
  let bestScore = 0;

  for (const folder of folders) {
    // Check 10-char chunks of title slug in folder name
    let score = 0;
    for (let i = 0; i + 10 <= titleSlug.length; i += 5) {
      const chunk = titleSlug.slice(i, i + 10);
      if (folder.nameLower.includes(chunk)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = folder;
    }
  }

  if (best && bestScore > 0) {
    try {
      const files = fs.readdirSync(best.fullPath).filter(f => f.endsWith('.png'));
      if (files.length > 0) return path.join(best.fullPath, files[0]);
    } catch (_) {}
  }
  return null;
}

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Playwright Test Reporter';
workbook.created = new Date();

// ─── Sheet 1: Summary ───
const sheetSummary = workbook.addWorksheet('Summary');
sheetSummary.columns = [
  { header: 'Metric', key: 'metric', width: 35 },
  { header: 'Value', key: 'value', width: 20 },
];

const stats = data.stats || {};
const totalPassed = stats.expected || 0;
const totalFailed = stats.unexpected || 0;
const totalFlaky = stats.flaky || 0;
const totalSkipped = stats.skipped || 0;
const totalTests = (stats.expected || 0) + (stats.unexpected || 0) + (stats.flaky || 0) + (stats.skipped || 0);
const duration = stats.duration ? (stats.duration / 1000).toFixed(1) + 's' : '-';

const summaryRows = [
  { metric: 'Tanggal Eksekusi', value: new Date().toLocaleDateString('id-ID', { dateStyle: 'long' }) },
  { metric: 'Total Tests', value: totalTests },
  { metric: 'PASSED ✅', value: totalPassed },
  { metric: 'FAILED ❌', value: totalFailed },
  { metric: 'SKIPPED ⏭', value: totalSkipped },
  { metric: 'FLAKY ⚠', value: totalFlaky },
  { metric: 'Pass Rate', value: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) + '%' : '0%' },
  { metric: 'Total Duration', value: duration },
];
sheetSummary.addRows(summaryRows);

// Style header
sheetSummary.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
sheetSummary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E4057' } };

// Color PASSED / FAILED rows
summaryRows.forEach((row, i) => {
  const r = sheetSummary.getRow(i + 2);
  if (row.metric.includes('PASSED')) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
  if (row.metric.includes('FAILED')) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE8E6' } };
});

// ─── Sheet 2: Detail Results ───
const sheetDetail = workbook.addWorksheet('Detail Results');
sheetDetail.columns = [
  { header: 'No', key: 'no', width: 6 },
  { header: 'Suite / Group', key: 'suite', width: 40 },
  { header: 'Test Case', key: 'testCase', width: 55 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Duration', key: 'duration', width: 12 },
  { header: 'Error / Notes', key: 'error', width: 55 },
  { header: 'Screenshot', key: 'screenshot', width: 30 },
];

// Header style
sheetDetail.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
sheetDetail.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E4057' } };
sheetDetail.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

let rowNo = 0;

function collectTests(suite, parentTitle = '') {
  const suiteTitle = parentTitle
    ? parentTitle + ' › ' + (suite.title || '')
    : suite.title || '';

  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      rowNo++;
      const result = test.results?.[0] || {};
      const status = result.status || test.status || 'unknown';
      const durationMs = result.duration || 0;
      const errorMsg = result.error?.message
        ? result.error.message.replace(/\n/g, ' ').slice(0, 200)
        : '';

      const row = sheetDetail.addRow({
        no: rowNo,
        suite: suiteTitle,
        testCase: spec.title,
        status: status.toUpperCase(),
        duration: durationMs > 0 ? (durationMs / 1000).toFixed(1) + 's' : '-',
        error: errorMsg,
        screenshot: '',
      });

      // Color by status
      const statusCell = row.getCell('status');
      if (status === 'passed' || status === 'expected') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
        statusCell.font = { bold: true, color: { argb: 'FF274E13' } };
      } else if (status === 'failed' || status === 'unexpected') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE8E6' } };
        statusCell.font = { bold: true, color: { argb: 'FF900000' } };
        row.getCell('error').font = { color: { argb: 'FF900000' } };
      } else if (status === 'flaky') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
        statusCell.font = { bold: true, color: { argb: 'FF7F4F00' } };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F3F3' } };
      }

      row.alignment = { vertical: 'top', wrapText: true };
      row.height = 20;

      // Embed screenshot jika ada
      const ssPath = getScreenshotPath(result) || screenshotMap[spec.title] || findScreenshotByFolder(spec.title);
      if (ssPath) console.log(`  📷 Screenshot found: ${path.basename(ssPath)} (${spec.title.slice(0,40)})`)
      if (ssPath) {
        try {
          const imgId = workbook.addImage({ filename: ssPath, extension: 'png' });
          const rowIdx = row.number - 1; // 0-based
          // Tinggi row disesuaikan untuk gambar (sekitar 120px = 90pt)
          row.height = 90;
          sheetDetail.addImage(imgId, {
            tl: { col: 6, row: rowIdx },
            br: { col: 7, row: rowIdx + 1 },
            editAs: 'oneCell',
          });
        } catch (_) { /* skip if image embed fails */ }
      }
    }
  }

  for (const child of suite.suites || []) {
    collectTests(child, suiteTitle);
  }
}

for (const suite of data.suites || []) {
  collectTests(suite);
}

// Freeze header row
sheetDetail.views = [{ state: 'frozen', ySplit: 1 }];

// Auto filter
sheetDetail.autoFilter = { from: 'A1', to: 'F1' };

// ─── Sheet 3: Failures Only ───
const sheetFail = workbook.addWorksheet('Failures');
sheetFail.columns = [
  { header: 'No', key: 'no', width: 6 },
  { header: 'Suite / Group', key: 'suite', width: 40 },
  { header: 'Test Case', key: 'testCase', width: 55 },
  { header: 'Duration', key: 'duration', width: 12 },
  { header: 'Error Message', key: 'error', width: 65 },
  { header: 'Screenshot', key: 'screenshot', width: 35 },
];

sheetFail.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
sheetFail.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF990000' } };

let failNo = 0;

function collectFailures(suite, parentTitle = '') {
  const suiteTitle = parentTitle
    ? parentTitle + ' › ' + (suite.title || '')
    : suite.title || '';

  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      const result = test.results?.[0] || {};
      const status = result.status || test.status || 'unknown';
      if (status === 'failed' || status === 'unexpected') {
        failNo++;
        const errorMsg = result.error?.message
          ? result.error.message.replace(/\n/g, ' ').slice(0, 500)
          : '-';

        const row = sheetFail.addRow({
          no: failNo,
          suite: suiteTitle,
          testCase: spec.title,
          duration: result.duration ? (result.duration / 1000).toFixed(1) + 's' : '-',
          error: errorMsg,
          screenshot: '',
        });
        row.getCell('error').font = { color: { argb: 'FF900000' } };
        row.alignment = { vertical: 'top', wrapText: true };
        row.height = 20;

        // Embed screenshot
        const ssPath = getScreenshotPath(result) || screenshotMap[spec.title] || findScreenshotByFolder(spec.title);
        if (ssPath) {
          try {
            const imgId = workbook.addImage({ filename: ssPath, extension: 'png' });
            const rowIdx = row.number - 1; // 0-based
            row.height = 110;
            sheetFail.addImage(imgId, {
              tl: { col: 5, row: rowIdx },
              br: { col: 6, row: rowIdx + 1 },
              editAs: 'oneCell',
            });
          } catch (_) { /* skip */ }
        }
      }
    }
  }

  for (const child of suite.suites || []) {
    collectFailures(child, suiteTitle);
  }
}

for (const suite of data.suites || []) {
  collectFailures(suite);
}

sheetFail.views = [{ state: 'frozen', ySplit: 1 }];
sheetFail.autoFilter = { from: 'A1', to: 'E1' };

// ─── Save ───
const outFile = path.join(__dirname, `prive-test-report-${new Date().toISOString().slice(0,10)}.xlsx`);
await workbook.xlsx.writeFile(outFile);
console.log(`✅ Excel report saved: ${outFile}`);
console.log(`   Total: ${totalTests} tests | Passed: ${totalPassed} | Failed: ${totalFailed}`);
