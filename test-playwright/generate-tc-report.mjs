import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const BASE = 'c:\\Users\\ryan.ananda\\AppData\\Roaming\\Kilo-Code\\MCP\\playwright-server\\Ryan\\test-playwright';
const OUTPUT = path.join('C:\\Users\\ryan.ananda\\Downloads', 'TEST_CASES_MORE1_MERCHANDISE_REPORT.xlsx');

function scanTests(dir) {
  const results = [];
  function walk(d) {
    for (const item of fs.readdirSync(d, { withFileTypes: true })) {
      if (item.name === 'node_modules') continue;
      const full = path.join(d, item.name);
      if (item.isDirectory()) { walk(full); continue; }
      if (!item.name.endsWith('.spec.js')) continue;
      const content = fs.readFileSync(full, 'utf8');
      const testRe = /(?<!\.)test\s*\(\s*[`'"](.*?)[`'"]/g;
      const descRe = /test\.describe\s*\(\s*[`'"](.*?)[`'"]/g;
      
      // Get describes
      const describes = [];
      let dm;
      while ((dm = descRe.exec(content)) !== null) { describes.push(dm[1]); }
      const suite = describes.length > 0 ? describes[0] : '';

      let m;
      while ((m = testRe.exec(content)) !== null) {
        results.push({
          file: full.replace(dir + '\\', '').replace(/\\/g, '/'),
          suite,
          testName: m[1]
        });
      }
      // If no tests found but file exists, record it
      if (results.filter(r => r.file === full.replace(dir + '\\', '').replace(/\\/g, '/')).length === 0) {
        results.push({
          file: full.replace(dir + '\\', '').replace(/\\/g, '/'),
          suite: suite || '(template/empty)',
          testName: '(no test() found - possible template)'
        });
      }
    }
  }
  walk(dir);
  return results;
}

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Ryan Ananda - QA Automation';
  wb.created = new Date();

  // --- Styles ---
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  const borderThin = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' }
  };

  function styleHeader(ws) {
    ws.getRow(1).eachCell(c => {
      c.fill = headerFill;
      c.font = headerFont;
      c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      c.border = borderThin;
    });
    ws.getRow(1).height = 28;
  }

  // ===================== SHEET 1: SUMMARY =====================
  const wsSummary = wb.addWorksheet('Summary', { properties: { tabColor: { argb: 'FF00B050' } } });
  wsSummary.columns = [
    { header: 'Project Folder', key: 'folder', width: 22 },
    { header: 'Subfolder / Module', key: 'subfolder', width: 28 },
    { header: 'Spec Files', key: 'specFiles', width: 14 },
    { header: 'Test Cases', key: 'testCases', width: 14 },
  ];
  styleHeader(wsSummary);

  // Scan MORE1
  const more1Dir = path.join(BASE, 'more1');
  const more1Tests = scanTests(more1Dir);
  const more1Subfolders = {};
  for (const t of more1Tests) {
    const sf = t.file.split('/')[0];
    if (!more1Subfolders[sf]) more1Subfolders[sf] = { files: new Set(), tests: 0 };
    more1Subfolders[sf].files.add(t.file);
    if (!t.testName.startsWith('(no test')) more1Subfolders[sf].tests++;
  }
  let more1TotalFiles = 0, more1TotalTests = 0;
  for (const [sf, data] of Object.entries(more1Subfolders).sort()) {
    const row = wsSummary.addRow({ folder: 'more1', subfolder: sf, specFiles: data.files.size, testCases: data.tests });
    row.eachCell(c => { c.border = borderThin; c.alignment = { vertical: 'middle' }; });
    more1TotalFiles += data.files.size;
    more1TotalTests += data.tests;
  }
  const m1Total = wsSummary.addRow({ folder: '', subfolder: 'SUBTOTAL more1', specFiles: more1TotalFiles, testCases: more1TotalTests });
  m1Total.eachCell(c => { c.font = { bold: true }; c.border = borderThin; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } }; });
  
  wsSummary.addRow({});

  // Scan MERCHANDISE
  const merchDir = path.join(BASE, 'merchandise');
  const merchTests = scanTests(merchDir);
  const merchSubfolders = {};
  for (const t of merchTests) {
    const sf = t.file.split('/')[0];
    if (!merchSubfolders[sf]) merchSubfolders[sf] = { files: new Set(), tests: 0 };
    merchSubfolders[sf].files.add(t.file);
    if (!t.testName.startsWith('(no test')) merchSubfolders[sf].tests++;
  }
  let merchTotalFiles = 0, merchTotalTests = 0;
  for (const [sf, data] of Object.entries(merchSubfolders).sort()) {
    const row = wsSummary.addRow({ folder: 'merchandise', subfolder: sf, specFiles: data.files.size, testCases: data.tests });
    row.eachCell(c => { c.border = borderThin; c.alignment = { vertical: 'middle' }; });
    merchTotalFiles += data.files.size;
    merchTotalTests += data.tests;
  }
  const mTotal = wsSummary.addRow({ folder: '', subfolder: 'SUBTOTAL merchandise', specFiles: merchTotalFiles, testCases: merchTotalTests });
  mTotal.eachCell(c => { c.font = { bold: true }; c.border = borderThin; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCE6F1' } }; });

  wsSummary.addRow({});
  const grandTotal = wsSummary.addRow({ folder: '', subfolder: 'GRAND TOTAL', specFiles: more1TotalFiles + merchTotalFiles, testCases: more1TotalTests + merchTotalTests });
  grandTotal.eachCell(c => {
    c.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    c.border = borderThin;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
  });

  // ===================== SHEET 2: MORE1 Detail =====================
  const wsMore1 = wb.addWorksheet('More1 - Test Cases', { properties: { tabColor: { argb: 'FF4472C4' } } });
  wsMore1.columns = [
    { header: 'No.', key: 'no', width: 6 },
    { header: 'Subfolder', key: 'subfolder', width: 20 },
    { header: 'Spec File', key: 'file', width: 45 },
    { header: 'Suite / Describe', key: 'suite', width: 40 },
    { header: 'Test Case Name', key: 'testName', width: 65 },
  ];
  styleHeader(wsMore1);

  let idx = 1;
  const validMore1 = more1Tests.filter(t => !t.testName.startsWith('(no test'));
  for (const t of validMore1) {
    const sf = t.file.split('/')[0];
    const row = wsMore1.addRow({ no: idx++, subfolder: sf, file: t.file, suite: t.suite, testName: t.testName });
    row.eachCell(c => { c.border = borderThin; c.alignment = { vertical: 'middle', wrapText: true }; });
    // Alternate row coloring
    if (idx % 2 === 0) {
      row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; });
    }
  }

  // ===================== SHEET 3: MERCHANDISE Detail =====================
  const wsMerch = wb.addWorksheet('Merchandise - Test Cases', { properties: { tabColor: { argb: 'FFED7D31' } } });
  wsMerch.columns = [
    { header: 'No.', key: 'no', width: 6 },
    { header: 'Subfolder', key: 'subfolder', width: 20 },
    { header: 'Spec File', key: 'file', width: 45 },
    { header: 'Suite / Describe', key: 'suite', width: 40 },
    { header: 'Test Case Name', key: 'testName', width: 65 },
  ];
  styleHeader(wsMerch);

  idx = 1;
  const validMerch = merchTests.filter(t => !t.testName.startsWith('(no test'));
  for (const t of validMerch) {
    const sf = t.file.split('/')[0];
    const row = wsMerch.addRow({ no: idx++, subfolder: sf, file: t.file, suite: t.suite, testName: t.testName });
    row.eachCell(c => { c.border = borderThin; c.alignment = { vertical: 'middle', wrapText: true }; });
    if (idx % 2 === 0) {
      row.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } }; });
    }
  }

  // ===================== SHEET 4: FILES WITH 0 TESTS =====================
  const wsEmpty = wb.addWorksheet('Empty Spec Files', { properties: { tabColor: { argb: 'FFFF0000' } } });
  wsEmpty.columns = [
    { header: 'No.', key: 'no', width: 6 },
    { header: 'Project', key: 'project', width: 16 },
    { header: 'Spec File', key: 'file', width: 70 },
    { header: 'Note', key: 'note', width: 35 },
  ];
  styleHeader(wsEmpty);

  const emptyFiles = [
    ...more1Tests.filter(t => t.testName.startsWith('(no test')).map(t => ({ project: 'more1', ...t })),
    ...merchTests.filter(t => t.testName.startsWith('(no test')).map(t => ({ project: 'merchandise', ...t })),
  ];
  idx = 1;
  for (const t of emptyFiles) {
    const row = wsEmpty.addRow({ no: idx++, project: t.project, file: t.file, note: 'Template / no test() found' });
    row.eachCell(c => { c.border = borderThin; c.alignment = { vertical: 'middle', wrapText: true }; });
  }

  // Add autofilter to all sheets
  [wsMore1, wsMerch, wsEmpty].forEach(ws => { ws.autoFilter = { from: 'A1', to: ws.getRow(1).cellCount > 0 ? ws.getColumn(ws.columnCount).letter + '1' : 'E1' }; });

  await wb.xlsx.writeFile(OUTPUT);
  console.log(`\n✅ Excel tersimpan di: ${OUTPUT}`);
  console.log(`📊 more1: ${validMore1.length} test cases in ${more1TotalFiles} files`);
  console.log(`📊 merchandise: ${validMerch.length} test cases in ${merchTotalFiles} files`);
  console.log(`📊 GRAND TOTAL: ${validMore1.length + validMerch.length} test cases`);
  console.log(`⚠️ Empty spec files: ${emptyFiles.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });

