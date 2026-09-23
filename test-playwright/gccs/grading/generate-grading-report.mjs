import ExcelJS from 'exceljs';
import path from 'path';
import os from 'os';

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Automation QA';
workbook.created = new Date();

// ──────────────────────────────────────────────
// STYLES
// ──────────────────────────────────────────────
const COLORS = {
  headerBg:    '1F3864',  // Dark navy
  headerFont:  'FFFFFF',
  sectionBg:   '2E75B6',  // Blue section title
  sectionFont: 'FFFFFF',
  passed:      'E2EFDA',  // Light green
  failed:      'FFDCE1',  // Light red
  blocked:     'FFF2CC',  // Light yellow
  altRow:      'F2F2F2',
  border:      '999999',
};

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.font = { bold: true, color: { argb: COLORS.headerFont }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.border } },
      left: { style: 'thin', color: { argb: COLORS.border } },
      bottom: { style: 'thin', color: { argb: COLORS.border } },
      right: { style: 'thin', color: { argb: COLORS.border } },
    };
  });
  row.height = 30;
}

function styleDataRow(row, rowIndex, status) {
  let bgColor = rowIndex % 2 === 0 ? 'FFFFFF' : COLORS.altRow;
  if (status === 'Passed')  bgColor = COLORS.passed;
  if (status === 'Failed')  bgColor = COLORS.failed;
  if (status === 'Blocked') bgColor = COLORS.blocked;

  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = {
      top: { style: 'hair', color: { argb: COLORS.border } },
      left: { style: 'hair', color: { argb: COLORS.border } },
      bottom: { style: 'hair', color: { argb: COLORS.border } },
      right: { style: 'hair', color: { argb: COLORS.border } },
    };
    // Status cell center aligned & bold
    if (cell.value === 'Passed' || cell.value === 'Failed' || cell.value === 'Blocked') {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { bold: true };
    }
  });
  row.height = 22;
}

// ──────────────────────────────────────────────
// TEST DATA
// ──────────────────────────────────────────────
const testData = {
  'Grade Categories': [
    { id: 'TC-GC-001', name: 'Create category with valid data succeeds',              category: 'Positive',   priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-GC-002', name: 'Create with empty required fields shows inline validation', category: 'Negative', priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-GC-003', name: 'Whitespace-only name is treated as empty (trimmed)',    category: 'Negative',   priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-GC-004', name: 'Duplicate grade name is rejected server-side',          category: 'Negative',   priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-GC-005', name: 'Min score greater than max score is rejected client-side', category: 'Negative', priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-GC-006', name: 'HTML/script injection in fields is escaped, not executed', category: 'Security', priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-GC-007', name: 'Very long input is rejected or truncated safely',        category: 'Boundary',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-GC-008', name: 'Search filters the table',                               category: 'Positive',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-GC-009', name: 'Search with no match shows empty state',                 category: 'Negative',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-GC-010', name: 'Cancel on create does not persist data',                 category: 'Negative',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-GC-011', name: 'Edit an existing category and persist changes',          category: 'Positive',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-GC-012', name: 'Delete a category shows confirmation and removes row',   category: 'Positive',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-GC-013', name: 'Cancel delete keeps the row',                            category: 'Negative',  priority: 'Medium', status: 'Passed',  notes: '' },
  ],
  'Questions Setup': [
    { id: 'TC-QS-001', name: 'Create question with valid data succeeds',               category: 'Positive',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-QS-002', name: 'Empty required fields blocked by validation',            category: 'Negative',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-QS-003', name: 'Checklist-only toggle forces zero points (business rule)', category: 'Positive', priority: 'High',  status: 'Passed',  notes: '' },
    { id: 'TC-QS-004', name: 'Script injection in question text is not executed',      category: 'Security',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-QS-005', name: 'Search filters question list',                           category: 'Positive',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-QS-006', name: 'Total default points widget reflects sum of default questions', category: 'Positive', priority: 'Medium', status: 'Passed', notes: '' },
    { id: 'TC-QS-007', name: 'Regression guard: "question 3" is not duplicated (BUG-QS-01)', category: 'Regression', priority: 'High', status: 'Passed', notes: 'BUG-QS-01' },
  ],
  'Item Grading': [
    { id: 'TC-IG-001', name: '"Load Default Questions" applies what is configured in Questions Setup', category: 'Positive', priority: 'High', status: 'Passed', notes: '' },
    { id: 'TC-IG-002', name: 'Save without selecting a product is blocked',            category: 'Negative',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-IG-003', name: 'Removing all question slots is blocked (at least one required)', category: 'Negative', priority: 'High', status: 'Passed', notes: '' },
    { id: 'TC-IG-004', name: 'List shows Product, Total Questions and Status columns', category: 'Positive',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-IG-005', name: 'Search filters by product/remarks',                      category: 'Positive',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-IG-006', name: 'Integration: item grading total questions matches configured slots', category: 'Integration', priority: 'High', status: 'Passed', notes: '' },
  ],
  'Warehouse Grading': [
    { id: 'TC-WHG-001', name: 'Add warehouse grading with valid ERP code and category succeeds', category: 'Positive', priority: 'High', status: 'Passed', notes: '' },
    { id: 'TC-WHG-002', name: 'Regression: "Is Grading Location?" blocks Save entirely (BUG-WHG-03)', category: 'Regression', priority: 'High', status: 'Failed', notes: 'BUG-WHG-03: Modal stays open, no toast/error shown' },
    { id: 'TC-WHG-002b', name: 'Business rule: "Is Grading Location?" disables and clears Category', category: 'Positive', priority: 'High', status: 'Passed', notes: '' },
    { id: 'TC-WHG-003', name: 'Closing modal without saving does not add a row',      category: 'Negative',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-WHG-004', name: 'Regression: saving with no ERP/category not blocked (BUG-WHG-01)', category: 'Regression', priority: 'High', status: 'Blocked', notes: 'BUG-WHG-01: Empty submit silently adds "-/-" row' },
    { id: 'TC-WHG-005', name: 'Already-added warehouse no longer appears in ERP Code choices', category: 'Positive', priority: 'Medium', status: 'Passed', notes: '' },
    { id: 'TC-WHG-006', name: 'Delete shows a confirmation and removes the row on confirm', category: 'Positive', priority: 'High', status: 'Passed', notes: '' },
    { id: 'TC-WHG-007', name: 'Cancelling the delete confirmation keeps the row',     category: 'Negative',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-WHG-008', name: 'Editing an existing row pre-fills current ERP code and category', category: 'Positive', priority: 'High', status: 'Passed', notes: '' },
  ],
  'Matrix Approval': [
    { id: 'TC-MA-001', name: 'Create Matrix Approval with valid data succeeds',        category: 'Positive',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-MA-002', name: 'Create with empty required fields shows validation',     category: 'Negative',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-MA-003', name: 'Search with no match shows empty state',                 category: 'Negative',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-MA-004', name: 'Cancel on create does not persist data',                 category: 'Negative',  priority: 'Medium', status: 'Passed',  notes: '' },
    { id: 'TC-MA-005', name: 'Edit an existing Matrix Approval',                       category: 'Positive',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-MA-006', name: 'Delete shows confirmation and removes row',              category: 'Positive',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-MA-007', name: 'Create with invalid email format shows validation',      category: 'Negative',  priority: 'High',   status: 'Passed',  notes: '' },
    { id: 'TC-MA-008', name: 'HTML/Script injection is safely escaped and does not execute', category: 'Security', priority: 'High', status: 'Passed', notes: '' },
  ],
};

// ──────────────────────────────────────────────
// SUMMARY SHEET
// ──────────────────────────────────────────────
function buildSummarySheet(wb, allData) {
  const ws = wb.addWorksheet('Summary');
  ws.views = [{ state: 'frozen', ySplit: 5 }];

  // Title
  ws.mergeCells('A1:H1');
  const title = ws.getCell('A1');
  title.value = '📋 GCCS GRADING – AUTOMATION TEST REPORT';
  title.font = { bold: true, size: 16, color: { argb: COLORS.headerFont } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 40;

  ws.mergeCells('A2:H2');
  const sub = ws.getCell('A2');
  sub.value = `Generated: ${new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}   |   Environment: portal-dev.modena.com`;
  sub.font = { italic: true, size: 10, color: { argb: '555555' } };
  sub.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 20;

  ws.addRow([]);

  // Summary table header
  const hdr = ws.addRow(['Module', 'Total TC', 'Passed ✅', 'Failed ❌', 'Blocked ⚠️', 'Pass Rate', 'File Spec', 'Status']);
  styleHeader(hdr);
  ws.columns = [
    { key: 'module',   width: 28 },
    { key: 'total',    width: 10 },
    { key: 'passed',   width: 12 },
    { key: 'failed',   width: 12 },
    { key: 'blocked',  width: 12 },
    { key: 'rate',     width: 12 },
    { key: 'spec',     width: 38 },
    { key: 'overall',  width: 14 },
  ];

  const specMap = {
    'Grade Categories': '02-grade-categories.spec.ts',
    'Questions Setup':  '03-questions-setup.spec.ts',
    'Item Grading':     '04-item-grading.spec.ts',
    'Warehouse Grading':'07-warehouse-grading.spec.ts',
    'Matrix Approval':  '08-matrix-approval.spec.js',
  };

  let grandTotal = 0, grandPassed = 0, grandFailed = 0, grandBlocked = 0;
  let ri = 1;

  for (const [module, cases] of Object.entries(allData)) {
    const total   = cases.length;
    const passed  = cases.filter(c => c.status === 'Passed').length;
    const failed  = cases.filter(c => c.status === 'Failed').length;
    const blocked = cases.filter(c => c.status === 'Blocked').length;
    const rate    = total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0%';
    const overall = failed > 0 ? 'FAIL' : blocked > 0 ? 'PARTIAL' : 'PASS';

    grandTotal   += total;
    grandPassed  += passed;
    grandFailed  += failed;
    grandBlocked += blocked;

    const row = ws.addRow([module, total, passed, failed, blocked, rate, specMap[module] || '', overall]);
    styleDataRow(row, ri++, overall === 'FAIL' ? 'Failed' : overall === 'PARTIAL' ? 'Blocked' : 'Passed');

    // Center numbers
    [2,3,4,5,6,8].forEach(c => {
      row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
    });
  }

  // Grand total row
  const grandRate = grandTotal > 0 ? ((grandPassed / grandTotal) * 100).toFixed(1) + '%' : '0%';
  const grandRow = ws.addRow(['TOTAL', grandTotal, grandPassed, grandFailed, grandBlocked, grandRate, '', '']);
  grandRow.eachCell({ includeEmpty: true }, cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };
    cell.font = { bold: true, color: { argb: COLORS.headerFont } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });
  grandRow.height = 26;
}

// ──────────────────────────────────────────────
// MODULE SHEET
// ──────────────────────────────────────────────
function buildModuleSheet(wb, moduleName, cases) {
  const ws = wb.addWorksheet(moduleName);
  ws.views = [{ state: 'frozen', ySplit: 3 }];

  // Module title banner
  ws.mergeCells('A1:G1');
  const title = ws.getCell('A1');
  title.value = `🔍 ${moduleName.toUpperCase()} – TEST CASES`;
  title.font = { bold: true, size: 13, color: { argb: COLORS.headerFont } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 32;

  ws.addRow([]);

  const hdr = ws.addRow(['Test Case ID', 'Test Case Name', 'Category', 'Priority', 'Status', 'Notes / Bug ID', 'Executed On']);
  styleHeader(hdr);

  ws.columns = [
    { key: 'id',       width: 16 },
    { key: 'name',     width: 60 },
    { key: 'category', width: 16 },
    { key: 'priority', width: 12 },
    { key: 'status',   width: 12 },
    { key: 'notes',    width: 32 },
    { key: 'date',     width: 18 },
  ];

  const today = new Date().toLocaleDateString('id-ID');
  cases.forEach((tc, i) => {
    const row = ws.addRow([tc.id, tc.name, tc.category, tc.priority, tc.status, tc.notes, today]);
    styleDataRow(row, i + 1, tc.status);
    // Center ID, category, priority, status, date
    [1, 3, 4, 5, 7].forEach(c => {
      row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });
}

// ──────────────────────────────────────────────
// BUILD & SAVE
// ──────────────────────────────────────────────
buildSummarySheet(workbook, testData);
for (const [module, cases] of Object.entries(testData)) {
  buildModuleSheet(workbook, module, cases);
}

const fileName = `GCCS_Grading_Test_Report_${new Date().toISOString().slice(0,10)}.xlsx`;
const filePath = path.join(os.homedir(), 'Downloads', fileName);

await workbook.xlsx.writeFile(filePath);
console.log(`✅ Report berhasil dibuat: ${filePath}`);
