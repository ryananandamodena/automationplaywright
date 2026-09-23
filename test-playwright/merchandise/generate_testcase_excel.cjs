// Converts 11_cms_admin_test_cases.md's markdown test-case tables into an
// .xlsx workbook. One-off generator script — run with:
//   node merchandise/generate_testcase_excel.cjs
const fs = require('fs');
const os = require('os');
const path = require('path');
const XLSX = require('xlsx');

const SRC = path.join(__dirname, '11_cms_admin_test_cases.md');
// Written straight to Downloads rather than this repo folder — this is a
// generated deliverable for the user to open/share, not source-controlled
// test documentation.
const OUT = path.join(os.homedir(), 'Downloads', 'CMS_Test_Cases.xlsx');

const HEADER = [
  'TC ID', 'Module', 'Feature', 'Test Scenario', 'Test Type', 'Priority',
  'Severity', 'Preconditions', 'Test Data', 'Steps', 'Expected Result',
  'Actual Result', 'Status',
];

function stripMd(cell) {
  return cell
    .replace(/`([^`]*)`/g, '$1')       // inline code
    .replace(/\*\*([^*]*)\*\*/g, '$1') // bold
    .replace(/\\\|/g, '|')             // escaped pipes
    .replace(/&amp;/g, '&')            // HTML entity artifacts from authoring
    .replace(/\{'([^']*)'\}/g, '$1')   // literal `{'{'}`/`{'}'}` brace escapes
    .trim();
}

function splitRow(line) {
  // Drop the leading/trailing pipe, split on unescaped pipes.
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split(/(?<!\\)\|/).map(stripMd);
}

const lines = fs.readFileSync(SRC, 'utf8').split('\n');
const rows = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim().startsWith('| TC ID')) continue;
  // Next line is the `|---|---|...` separator — skip it, then read rows
  // until a non-table line.
  let j = i + 2;
  while (j < lines.length && lines[j].trim().startsWith('|')) {
    const cells = splitRow(lines[j]);
    if (cells.length === HEADER.length && cells[0] && !/^-+$/.test(cells[0])) {
      rows.push(cells);
    }
    j++;
  }
  i = j - 1;
}

console.log(`Parsed ${rows.length} test case rows from ${path.basename(SRC)}`);

const wb = XLSX.utils.book_new();
const wsData = [HEADER, ...rows];
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Column widths roughly matched to content type.
ws['!cols'] = [
  { wch: 14 }, // TC ID
  { wch: 12 }, // Module
  { wch: 22 }, // Feature
  { wch: 40 }, // Test Scenario
  { wch: 12 }, // Test Type
  { wch: 10 }, // Priority
  { wch: 10 }, // Severity
  { wch: 24 }, // Preconditions
  { wch: 22 }, // Test Data
  { wch: 40 }, // Steps
  { wch: 40 }, // Expected Result
  { wch: 30 }, // Actual Result
  { wch: 12 }, // Status
];
ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: HEADER.length - 1 } }) };
ws['!freeze'] = { xSplit: 0, ySplit: 1 }; // freeze header row (some readers honor this)

XLSX.utils.book_append_sheet(wb, ws, 'CMS Test Cases');

// Summary sheet: count per module and per status.
const byModule = {};
const byStatus = {};
for (const r of rows) {
  byModule[r[1]] = (byModule[r[1]] || 0) + 1;
  byStatus[r[12]] = (byStatus[r[12]] || 0) + 1;
}
const summaryData = [
  ['Total test cases', rows.length],
  [],
  ['Module', 'Count'],
  ...Object.entries(byModule),
  [],
  ['Status', 'Count'],
  ...Object.entries(byStatus),
];
const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
wsSummary['!cols'] = [{ wch: 24 }, { wch: 10 }];
XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

XLSX.writeFile(wb, OUT);
console.log(`Written to ${OUT}`);
