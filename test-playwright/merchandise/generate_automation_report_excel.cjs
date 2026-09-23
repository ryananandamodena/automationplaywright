// Builds the automation EXECUTION report (as opposed to the test-case
// DESIGN docs exported by generate_storefront_testcase_excel.cjs /
// generate_testcase_excel.cjs) — actual pass/fail/skip counts from the real
// Playwright runs performed this session, plus two chart images.
//
// Chart PNGs are pre-rendered separately (scratchpad/shoot_charts.cjs, via
// Playwright screenshotting a small self-contained SVG/HTML page) because
// neither `xlsx` nor `exceljs` can author native Excel chart objects —
// images are the practical way to get a chart into the workbook.
//
// Run: node merchandise/generate_automation_report_excel.cjs
const os = require('os');
const path = require('path');
const ExcelJS = require('exceljs');

const CHART_DIR = 'C:\\Users\\RYAN~1.ANA\\AppData\\Local\\Temp\\claude\\c--Users-ryan-ananda-AppData-Roaming-Kilo-Code-MCP-playwright-server\\ed36f6f8-533b-4c12-95a4-34d35cca92e2\\scratchpad';
const OUT = path.join(os.homedir(), 'Downloads', 'Merchandise_Automation_Report.xlsx');

// Real results — see Ryan/test-playwright/merchandise/README.md and
// cms/automation/README.md for the specs these came from; every number
// here traces back to an actual `npx playwright test` run in this session,
// not an estimate.
const RUNS = [
  { suite: 'Storefront', file: 'automation/smoke.spec.js', pass: 4, fail: 0, skip: 4, note: 'SMK-005..008 skipped: /login is Microsoft-SSO-only, no test account' },
  { suite: 'Storefront', file: 'automation/functional.listing.spec.js', pass: 7, fail: 0, skip: 0, note: '' },
  { suite: 'Storefront', file: 'automation/functional.pdp_cart.spec.js', pass: 6, fail: 0, skip: 1, note: 'NEG-007 skipped: single pre-selected size, no longer a reachable state' },
  { suite: 'Storefront', file: 'automation/functional.auth.spec.js', pass: 1, fail: 0, skip: 4, note: 'Same SSO-only login reason as smoke' },
  { suite: 'Storefront', file: 'automation/functional.checkout.spec.js', pass: 0, fail: 0, skip: 0, note: 'Not executed — creates real orders on shared dev DB (see automation/README.md)' },
  { suite: 'Storefront', file: 'automation/functional.orders.spec.js', pass: 0, fail: 0, skip: 0, note: 'Not executed — same reason' },
  { suite: 'Storefront', file: 'automation/e2e.spec.js', pass: 0, fail: 0, skip: 0, note: 'Not executed — E2E-003 creates a real order' },
  { suite: 'CMS Admin', file: 'cms/automation/smoke.spec.js', pass: 11, fail: 0, skip: 0, note: '' },
  { suite: 'CMS Admin', file: 'cms/automation/functional.spec.js', pass: 7, fail: 0, skip: 0, note: '' },
  { suite: 'CMS Admin', file: 'cms/automation/ui.spec.js', pass: 3, fail: 1, skip: 0, note: 'CMS-DSH-005 fails on a real bug: 5 broken product images in Low Stock Alert' },
  { suite: 'CMS Admin', file: 'cms/automation/e2e.spec.js', pass: 1, fail: 1, skip: 0, note: 'E2E-CMS-002 failed on a 30s test timeout during cleanup — cleanup finished manually outside the test; needs a longer timeout or a split test' },
];

async function main() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Merchandise QA automation';
  wb.created = new Date('2026-08-04T00:00:00Z');

  // --- Sheet 1: Run results table ---
  const ws = wb.addWorksheet('Run Results');
  ws.columns = [
    { header: 'Suite', key: 'suite', width: 14 },
    { header: 'Spec File', key: 'file', width: 42 },
    { header: 'Passed', key: 'pass', width: 10 },
    { header: 'Failed', key: 'fail', width: 10 },
    { header: 'Skipped', key: 'skip', width: 10 },
    { header: 'Total', key: 'total', width: 10 },
    { header: 'Note', key: 'note', width: 70 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.autoFilter = { from: 'A1', to: 'G1' };
  for (const r of RUNS) {
    ws.addRow({ ...r, total: r.pass + r.fail + r.skip });
  }
  const totalPass = RUNS.reduce((s, r) => s + r.pass, 0);
  const totalFail = RUNS.reduce((s, r) => s + r.fail, 0);
  const totalSkip = RUNS.reduce((s, r) => s + r.skip, 0);
  const totalRow = ws.addRow({ suite: '', file: 'TOTAL (executed)', pass: totalPass, fail: totalFail, skip: totalSkip, total: totalPass + totalFail + totalSkip, note: '' });
  totalRow.font = { bold: true };
  ws.getColumn('pass').eachCell((cell, i) => { if (i > 1) cell.font = { color: { argb: 'FF2F7D4F' } }; });
  ws.getColumn('fail').eachCell((cell, i) => { if (i > 1) cell.font = { color: { argb: 'FFA4402E' } }; });

  // --- Sheet 2: Charts ---
  const wsChart = wb.addWorksheet('Charts');
  const barImg = wb.addImage({ filename: path.join(CHART_DIR, 'chart_bar.png'), extension: 'png' });
  const donutImg = wb.addImage({ filename: path.join(CHART_DIR, 'chart_donut.png'), extension: 'png' });
  wsChart.addImage(barImg, { tl: { col: 0, row: 0 }, ext: { width: 860, height: 400 } });
  wsChart.addImage(donutImg, { tl: { col: 0, row: 22 }, ext: { width: 860, height: 280 } });

  // --- Sheet 3: How this was produced ---
  const wsNote = wb.addWorksheet('Method');
  wsNote.columns = [{ width: 100 }];
  [
    'How this report was produced',
    '',
    'Every count on "Run Results" comes from an actual `npx playwright test` run against the live dev environments (merchandise-dev.modena.com storefront + /cms admin), executed during this QA session — not an estimate or a design-time plan.',
    '',
    'Order-creating specs (checkout, orders, storefront e2e checkout) were intentionally not executed, to avoid polluting the shared dev database — see automation/README.md for that policy.',
    '',
    'Charts are pre-rendered PNGs (Playwright screenshot of a small self-contained SVG/HTML page), not native Excel chart objects — the xlsx and exceljs libraries available in this project do not support authoring native Excel charts.',
    '',
    'Regenerate: update the RUNS array in generate_automation_report_excel.cjs after a new test run, re-render the charts (scratchpad HTML + shoot script), then re-run this script.',
  ].forEach((line) => wsNote.addRow([line]));
  wsNote.getRow(1).font = { bold: true, size: 13 };

  await wb.xlsx.writeFile(OUT);
  console.log(`Written to ${OUT}`);
}

main();
