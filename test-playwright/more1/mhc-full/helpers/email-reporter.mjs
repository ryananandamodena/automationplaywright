import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Baca hasil JSON dari Playwright
function readResults(resultsPath) {
  if (!fs.existsSync(resultsPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  } catch {
    return null;
  }
}

// Format hasil ke HTML email
function formatEmailHTML(results) {
  const suites = results.suites || [];
  const stats = results.stats || {};

  let passed = 0, failed = 0, skipped = 0;
  const failedTests = [];

  function traverseSuites(suites) {
    for (const suite of suites) {
      for (const spec of (suite.specs || [])) {
        for (const test of (spec.tests || [])) {
          const status = test.results?.[0]?.status;
          if (status === 'passed') passed++;
          else if (status === 'failed' || status === 'timedOut') {
            failed++;
            const error = test.results?.[0]?.error?.message || 'Unknown error';
            failedTests.push({
              suite: suite.title,
              test: spec.title,
              error: error.slice(0, 500),
              file: spec.file || '',
            });
          } else if (status === 'skipped') skipped++;
        }
      }
      if (suite.suites) traverseSuites(suite.suites);
    }
  }

  traverseSuites(suites);

  const total = passed + failed + skipped;
  const status = failed === 0 ? '✅ ALL PASSED' : `❌ ${failed} FAILED`;
  const color = failed === 0 ? '#27ae60' : '#e74c3c';

  let failedHtml = '';
  if (failedTests.length > 0) {
    failedHtml = `
      <h2 style="color:#e74c3c;">🐛 Bug / Failures Ditemukan</h2>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px;">
        <thead style="background:#e74c3c;color:white;">
          <tr>
            <th>#</th>
            <th>Module / Suite</th>
            <th>Test Case</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          ${failedTests.map((f, i) => `
            <tr style="background:${i % 2 === 0 ? '#fff5f5' : '#fff'}">
              <td>${i + 1}</td>
              <td><b>${f.suite}</b></td>
              <td>${f.test}</td>
              <td style="font-family:monospace;font-size:11px;color:#c0392b;">${f.error.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f4f6f8;">
      <div style="max-width:900px;margin:auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background:#1a1a2e;padding:24px;color:white;">
          <h1 style="margin:0;font-size:22px;">🤖 MHC Automation Test Report</h1>
          <p style="margin:4px 0 0;color:#aaa;font-size:13px;">https://mhc-dev.modena.com | ${new Date().toLocaleString('id-ID')}</p>
        </div>

        <!-- Summary -->
        <div style="padding:24px;border-bottom:1px solid #eee;">
          <h2 style="margin:0 0 16px;color:#333;">📊 Ringkasan Hasil</h2>
          <div style="display:flex;gap:16px;flex-wrap:wrap;">
            <div style="background:#eafaf1;border-left:4px solid #27ae60;padding:12px 20px;border-radius:4px;min-width:120px;">
              <div style="font-size:28px;font-weight:bold;color:#27ae60;">${passed}</div>
              <div style="color:#555;font-size:13px;">Passed ✅</div>
            </div>
            <div style="background:#fdedec;border-left:4px solid #e74c3c;padding:12px 20px;border-radius:4px;min-width:120px;">
              <div style="font-size:28px;font-weight:bold;color:#e74c3c;">${failed}</div>
              <div style="color:#555;font-size:13px;">Failed ❌</div>
            </div>
            <div style="background:#fef9e7;border-left:4px solid #f39c12;padding:12px 20px;border-radius:4px;min-width:120px;">
              <div style="font-size:28px;font-weight:bold;color:#f39c12;">${skipped}</div>
              <div style="color:#555;font-size:13px;">Skipped ⚠</div>
            </div>
            <div style="background:#eaf0fb;border-left:4px solid #2980b9;padding:12px 20px;border-radius:4px;min-width:120px;">
              <div style="font-size:28px;font-weight:bold;color:#2980b9;">${total}</div>
              <div style="color:#555;font-size:13px;">Total Tests</div>
            </div>
          </div>

          <div style="margin-top:16px;padding:12px 16px;background:${color}22;border-left:4px solid ${color};border-radius:4px;">
            <span style="font-size:16px;font-weight:bold;color:${color};">${status}</span>
          </div>
        </div>

        <!-- Failed Tests -->
        <div style="padding:24px;">
          ${failedHtml || '<p style="color:#27ae60;font-size:15px;">🎉 Tidak ada bug ditemukan! Semua test berhasil.</p>'}
        </div>

        <!-- Footer -->
        <div style="background:#f4f6f8;padding:16px 24px;font-size:12px;color:#888;border-top:1px solid #eee;">
          Report ini digenerate otomatis oleh Playwright Automation &bull; MHC-Dev &bull; ${new Date().toISOString()}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Kirim email
export async function sendEmailReport(resultsJsonPath) {
  // Konfigurasi dari env
  const smtpHost   = process.env.SMTP_HOST   || 'smtp.gmail.com';
  const smtpPort   = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser   = process.env.SMTP_USER   || '';
  const smtpPass   = process.env.SMTP_PASS   || '';
  const emailFrom  = process.env.EMAIL_FROM  || smtpUser;
  const emailTo    = process.env.EMAIL_TO    || 'ryan.ananda@modena.com';

  if (!smtpUser || !smtpPass) {
    console.warn('⚠ SMTP_USER / SMTP_PASS tidak dikonfigurasi di .env - email tidak dikirim');
    return false;
  }

  const results = readResults(resultsJsonPath);
  if (!results) {
    console.warn('⚠ File hasil test tidak ditemukan:', resultsJsonPath);
    return false;
  }

  const html = formatEmailHTML(results);

  // Hitung failed untuk subject
  let failed = 0;
  function countFailed(suites) {
    for (const s of suites) {
      for (const spec of (s.specs || [])) {
        for (const t of (spec.tests || [])) {
          if (['failed', 'timedOut'].includes(t.results?.[0]?.status)) failed++;
        }
      }
      if (s.suites) countFailed(s.suites);
    }
  }
  countFailed(results.suites || []);

  const subject = failed > 0
    ? `❌ [MHC Automation] ${failed} Bug Ditemukan - ${new Date().toLocaleDateString('id-ID')}`
    : `✅ [MHC Automation] Semua Test Passed - ${new Date().toLocaleDateString('id-ID')}`;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    await transporter.sendMail({
      from: `"MHC Automation Bot" <${emailFrom}>`,
      to: emailTo,
      subject,
      html,
    });
    console.log(`✅ Email report berhasil dikirim ke ${emailTo}`);
    return true;
  } catch (err) {
    console.error('❌ Gagal mengirim email:', err.message);
    return false;
  }
}
