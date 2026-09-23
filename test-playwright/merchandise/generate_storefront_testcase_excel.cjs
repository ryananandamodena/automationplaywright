// Converts the storefront test-case docs (01_ui_test_cases.md ..
// 09_regression_smoke_sanity.md) into an .xlsx workbook — one sheet per
// source file, using that file's own column schema (each file uses a
// different set of columns, unlike 11_cms_admin_test_cases.md's uniform
// 13-column format), plus a combined normalized sheet and a summary.
//
// Run: node merchandise/generate_storefront_testcase_excel.cjs
const fs = require('fs');
const os = require('os');
const path = require('path');
const XLSX = require('xlsx');

const FILES = [
  { file: '01_ui_test_cases.md', sheet: '01 UI' },
  { file: '02_functional_test_cases.md', sheet: '02 Functional' },
  { file: '03_e2e_test_cases.md', sheet: '03 E2E' },
  { file: '04_api_test_cases.md', sheet: '04 API' },
  { file: '05_security_test_cases.md', sheet: '05 Security' },
  { file: '06_negative_boundary_test_cases.md', sheet: '06 Negative-Boundary' },
  { file: '07_accessibility_responsive_compatibility.md', sheet: '07 A11y-Compat' },
  { file: '08_performance_test_cases.md', sheet: '08 Performance' },
  { file: '09_regression_smoke_sanity.md', sheet: '09 Regr-Smoke-Sanity' },
];

function stripMd(cell) {
  return cell
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\\\|/g, '|')
    .replace(/&amp;/g, '&')
    .trim();
}

function splitRow(line) {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split(/(?<!\\)\|/).map(stripMd);
}

// Parses every markdown table in a file (any header, any width) — a table
// starts at a `|`-led line followed by a `|---|---|` separator line.
function parseAllTables(text) {
  const lines = text.split('\n');
  const tables = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|')) continue;
    if (!/^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) continue;
    const header = splitRow(lines[i]);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith('|')) {
      const cells = splitRow(lines[j]);
      if (cells.length === header.length) rows.push(cells);
      j++;
    }
    tables.push({ header, rows });
    i = j - 1;
  }
  return tables;
}

const dir = __dirname;
const wb = XLSX.utils.book_new();
const allNormalized = [['Source File', 'Test ID', 'Scenario/Feature', 'Priority', 'Severity', 'Automation']];
const perFileCounts = [];

for (const { file, sheet } of FILES) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const tables = parseAllTables(text).filter((t) => t.header[0] === 'Test ID');
  if (tables.length === 0) continue;

  const header = tables[0].header;
  const allRows = tables.flatMap((t) => t.rows);
  const ws = XLSX.utils.aoa_to_sheet([header, ...allRows]);
  ws['!cols'] = header.map((h) => ({ wch: Math.max(12, Math.min(40, h.length + 8)) }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: allRows.length, c: header.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, ws, sheet);

  const idIdx = header.indexOf('Test ID');
  const scenarioIdx = header.indexOf('Scenario') >= 0 ? header.indexOf('Scenario') : header.indexOf('Feature');
  const prioIdx = header.indexOf('Priority');
  const sevIdx = header.indexOf('Severity');
  const autoIdx = header.indexOf('Automation');
  for (const r of allRows) {
    allNormalized.push([
      file, r[idIdx] || '', scenarioIdx >= 0 ? r[scenarioIdx] : '',
      prioIdx >= 0 ? r[prioIdx] : '', sevIdx >= 0 ? r[sevIdx] : '',
      autoIdx >= 0 ? r[autoIdx] : '',
    ]);
  }

  const autoCounts = {};
  if (autoIdx >= 0) {
    for (const r of allRows) autoCounts[r[autoIdx]] = (autoCounts[r[autoIdx]] || 0) + 1;
  }
  perFileCounts.push({ file, sheet, count: allRows.length, autoCounts });
}

const wsAll = XLSX.utils.aoa_to_sheet(allNormalized);
wsAll['!cols'] = [{ wch: 34 }, { wch: 16 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, wsAll, 'All Test Cases (normalized)');

const summaryData = [
  ['Storefront test-case design coverage (01-09)'],
  [],
  ['Source File', 'Test Case Count', 'Automated (P)', 'Manual (M)'],
  ...perFileCounts.map((f) => [f.file, f.count, f.autoCounts.P || 0, f.autoCounts.M || 0]),
  [],
  ['Total', perFileCounts.reduce((s, f) => s + f.count, 0),
    perFileCounts.reduce((s, f) => s + (f.autoCounts.P || 0), 0),
    perFileCounts.reduce((s, f) => s + (f.autoCounts.M || 0), 0)],
];
const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
wsSummary['!cols'] = [{ wch: 40 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

const OUT = path.join(os.homedir(), 'Downloads', 'Merchandise_Storefront_Test_Cases.xlsx');
XLSX.writeFile(wb, OUT);
console.log(`Written to ${OUT}`);
console.log(perFileCounts.map((f) => `${f.sheet}: ${f.count} cases`).join('\n'));
