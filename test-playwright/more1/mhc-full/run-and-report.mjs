#!/usr/bin/env node
/**
 * run-and-report.mjs
 * 
 * Script utama untuk:
 * 1. Menjalankan semua Playwright automation test (semua menu MHC)
 * 2. Generate laporan HTML
 * 3. Kirim email report ke ryan.ananda@modena.com jika ada bug/failure
 *
 * Usage:
 *   node run-and-report.mjs              # headed (browser terlihat)
 *   node run-and-report.mjs --headless   # headless (background)
 *   node run-and-report.mjs --no-email   # tanpa kirim email
 */

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sendEmailReport } from './helpers/email-reporter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_JSON = path.join(__dirname, 'test-results', 'results.json');
const REPORT_DIR = path.join(__dirname, 'playwright-report');
const CONFIG_FILE = path.join(__dirname, 'playwright.config.js');

// Load .env jika ada
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log('✓ .env loaded');
} else {
  console.warn('⚠ File .env tidak ditemukan - email tidak akan dikirim');
  console.warn('  Salin .env.example menjadi .env dan isi SMTP credentials');
}

const args = process.argv.slice(2);
const headless = args.includes('--headless');
const noEmail = args.includes('--no-email');
const noRun = args.includes('--no-run');

// Bersihkan hasil lama jika akan menjalankan test
if (!noRun) {
  if (fs.existsSync(RESULTS_JSON)) fs.unlinkSync(RESULTS_JSON);
  if (fs.existsSync(path.join(__dirname, 'test-results')))
    fs.readdirSync(path.join(__dirname, 'test-results'))
      .filter(f => f.endsWith('.png') || f.endsWith('.webm'))
      .forEach(f => fs.unlinkSync(path.join(__dirname, 'test-results', f)));
}

console.log('\n' + '='.repeat(60));
console.log('🤖 MHC AUTOMATION TEST SUITE');
console.log('   Target: https://mhc-dev.modena.com');
console.log(`   Mode: ${headless ? 'Headless' : 'Headed (browser terlihat)'}`);
console.log(`   Email: ${noEmail ? 'Dinonaktifkan' : 'Aktif → ryan.ananda@modena.com'}`);
if (noRun) console.log('   Test Execution: SKIPPED (--no-run)');
console.log('='.repeat(60) + '\n');

// Jalankan Playwright
let exitCode = 0;
if (!noRun) {
  try {
    const headlessFlag = headless ? ' --headed=false' : ' --headed';
    const cmd = `npx playwright test --config="${CONFIG_FILE}"${headlessFlag} --reporter=line,json,html`;
    console.log('▶ Menjalankan tests...\n');
    execSync(cmd, {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch (err) {
    exitCode = err.status || 1;
  }
}

// Baca dan tampilkan summary
console.log('\n' + '='.repeat(60));
console.log('📊 SUMMARY');
console.log('='.repeat(60));

let failed = 0, passed = 0, skipped = 0;
if (fs.existsSync(RESULTS_JSON)) {
  const results = JSON.parse(fs.readFileSync(RESULTS_JSON, 'utf-8'));
  function countResults(suites) {
    for (const suite of (suites || [])) {
      for (const spec of (suite.specs || [])) {
        for (const t of (spec.tests || [])) {
          const s = t.results?.[0]?.status;
          if (s === 'passed') passed++;
          else if (s === 'failed' || s === 'timedOut') {
            failed++;
            console.log(`  ❌ FAILED: [${suite.title}] ${spec.title}`);
          } else if (s === 'skipped') skipped++;
        }
      }
      if (suite.suites) countResults(suite.suites);
    }
  }
  countResults(results.suites);

  console.log(`\n  ✅ Passed  : ${passed}`);
  console.log(`  ❌ Failed  : ${failed}`);
  console.log(`  ⚠  Skipped : ${skipped}`);
  console.log(`  📝 Total   : ${passed + failed + skipped}`);
  console.log(`\n  📁 HTML Report: ${REPORT_DIR}${path.sep}index.html`);
}

// Kirim email
if (!noEmail) {
  console.log('\n' + '='.repeat(60));
  if (failed > 0) {
    console.log(`📧 ${failed} bug ditemukan - mengirim email ke ryan.ananda@modena.com...`);
  } else {
    console.log('📧 Semua test passed - mengirim summary email...');
  }
  await sendEmailReport(RESULTS_JSON);
} else {
  console.log('\n  (Email dinonaktifkan dengan flag --no-email)');
}

console.log('\n' + '='.repeat(60));
console.log(failed === 0 ? '✅ SEMUA TEST PASSED' : `❌ ${failed} TEST GAGAL`);
console.log('='.repeat(60) + '\n');

process.exit(exitCode);
