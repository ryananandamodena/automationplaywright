// Static registry of runnable Playwright projects.
// Add a new project by adding one entry here — nothing else needs to change.
//
// cwd, config, testDir, reportDir are all relative to the repo root (one level up from this file).
export const PROJECTS = [
  {
    id: 'gccs',
    label: 'GCCS (Core)',
    cwd: 'gccs',
    config: 'playwright.config.gccs.js',
    testDir: 'specs',
    reportDir: 'gccs-report',
  },
  {
    id: 'gccs-grading',
    label: 'GCCS / Master Grading',
    cwd: 'gccs/grading',
    config: 'playwright.config.ts',
    testDir: 'tests',
    reportDir: 'report',
  },
  {
    id: 'gccs-mobile',
    label: 'GCCS Mobile',
    cwd: 'gccs/mobile',
    config: 'playwright.config.mobile.js',
    testDir: '.',
    reportDir: 'mobile-test-report',
  },
  {
    id: 'gccs-mobile-bluestacks',
    label: 'GCCS Mobile (BlueStacks)',
    cwd: 'gccs/mobile',
    config: 'playwright.config.bluestacks.js',
    testDir: '.',
    reportDir: 'mobile-test-report',
  },
  {
    id: 'mhc-full',
    label: 'MHC Full',
    cwd: 'more1/mhc-full',
    config: 'playwright.config.js',
    testDir: 'specs',
    reportDir: 'playwright-report',
  },

  // The projects below have no playwright.config of their own — they all run through the
  // ROOT config (playwright.config.js, testDir: './', baseURL default portal-dev.modena.com,
  // report output 'playwright-report' at repo root). Since the dashboard only ever runs one
  // test at a time (single FIFO queue), sharing that reportDir is safe: "view report" always
  // shows the most recent run, which is always the one that was just triggered.
  {
    id: 'fms',
    label: 'FMS (Facility Management)',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: 'fms',
    reportDir: 'playwright-report',
  },
  {
    id: 'merchandise',
    label: 'Merchandise',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: 'merchandise',
    reportDir: 'playwright-report',
  },
  {
    id: 'scb',
    label: 'SCB (Safe/CRUD)',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: 'scb',
    reportDir: 'playwright-report',
  },
  {
    id: 'sfa',
    label: 'SFA',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: 'sfa',
    reportDir: 'playwright-report',
  },
  {
    id: 'scmp',
    label: 'SCMP',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: 'scmp',
    reportDir: 'playwright-report',
  },
  {
    id: 'prive',
    label: 'Prive',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: 'prive',
    reportDir: 'playwright-report',
  },
  {
    id: 'service_1',
    label: 'Service 1 (MSP Registrasi)',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: 'service_1',
    reportDir: 'playwright-report',
  },
  {
    id: 'tersbarumobile',
    label: 'Tersbarumobile',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: 'tersbarumobile',
    reportDir: 'playwright-report',
  },
  {
    id: 'test',
    label: 'Test (contoh/boilerplate)',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: 'test',
    reportDir: 'playwright-report',
  },
  {
    id: 'root-misc',
    label: 'Root (misc specs)',
    cwd: '.',
    config: 'playwright.config.js',
    testDir: '.',
    reportDir: 'playwright-report',
    // Loose spec files sitting directly in the repo root (contract-allure-demo.spec.js etc).
    // Must NOT recurse — every other registered project already covers its own subfolder, and
    // recursing from '.' would re-walk the entire repo (fms, merchandise, gccs, ...) and blow past
    // that overlap.
    shallow: true,
  },
];

export function getProject(id) {
  return PROJECTS.find((p) => p.id === id);
}
