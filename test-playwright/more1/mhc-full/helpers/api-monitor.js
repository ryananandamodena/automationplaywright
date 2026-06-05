/**
 * api-monitor.js - Helper untuk menangkap API failures dan console errors
 * Digunakan bersama test untuk mendeteksi bug tersembunyi
 */

/**
 * Setup network monitoring pada page.
 * Returns object dengan method untuk mengambil hasil monitoring.
 */
export function setupApiMonitor(page) {
  const failures = [];
  const consoleErrors = [];
  const requests = [];

  // Tangkap response gagal
  page.on('response', async response => {
    const status = response.status();
    const url = response.url();

    // Hanya monitor API dari domain aplikasi (mhc-dev.modena.com)
    if (!url.includes('mhc-dev.modena.com')) return;
    // Abaikan static assets dan favicon
    if (url.match(/\.(png|jpg|ico|woff|woff2|css|svg)(\?|$)/)) return;
    if (url.includes('favicon')) return;

    requests.push({ url, status, method: response.request().method() });

    if (status >= 400) {
      let body = '';
      try {
        // Hanya baca body untuk API calls (bukan redirect)
        if (response.headers()['content-type']?.includes('json')) {
          body = await response.text().catch(() => '');
        }
      } catch (_) { /* ignore */ }

      failures.push({
        url,
        status,
        method: response.request().method(),
        body: body.slice(0, 200),
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Tangkap console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter noise dari browser extensions dan favicon
      if (!text.includes('favicon') && !text.includes('extension://')) {
        consoleErrors.push({ text, timestamp: new Date().toISOString() });
      }
    }
  });

  // Tangkap unhandled page errors
  page.on('pageerror', err => {
    consoleErrors.push({
      text: `[PageError] ${err.message}`,
      timestamp: new Date().toISOString(),
    });
  });

  return {
    /** Semua API request yang dimonitor */
    getAllRequests: () => [...requests],

    /** Hanya API yang gagal (4xx/5xx) */
    getFailures: () => [...failures],

    /** Kegagalan critical (5xx dan 4xx non-auth) */
    getCriticalFailures: () => failures.filter(f =>
      f.status >= 500 || (f.status >= 400 && f.status !== 401 && f.status !== 403)
    ),

    /** Console errors */
    getConsoleErrors: () => [...consoleErrors],

    /** Summary untuk logging */
    getSummary: () => {
      const critical = failures.filter(f => f.status >= 500 || (f.status >= 400 && f.status !== 401 && f.status !== 403));
      return {
        totalRequests: requests.length,
        totalFailures: failures.length,
        criticalFailures: critical.length,
        consoleErrors: consoleErrors.length,
        failures: critical.map(f => `[${f.status}] ${f.method} ${f.url}`),
      };
    },
  };
}

/**
 * Generate teks laporan API failures untuk dimasukkan ke bug report
 */
export function formatApiReport(monitor) {
  const summary = monitor.getSummary();
  if (summary.criticalFailures === 0 && summary.consoleErrors === 0) return null;

  const lines = [];
  if (summary.criticalFailures > 0) {
    lines.push(`API Failures (${summary.criticalFailures}):`);
    monitor.getCriticalFailures().forEach(f => {
      lines.push(`  [${f.status}] ${f.method} ${f.url}`);
      if (f.body) lines.push(`    Response: ${f.body}`);
    });
  }
  if (summary.consoleErrors > 0) {
    lines.push(`Console Errors (${summary.consoleErrors}):`);
    monitor.getConsoleErrors().slice(0, 5).forEach(e => lines.push(`  ${e.text}`));
  }
  return lines.join('\n');
}
