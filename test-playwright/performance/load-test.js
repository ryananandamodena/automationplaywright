import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { APPS } from './apps.config.js';

const APP_KEY = __ENV.APP || 'fms';
const app = APPS[APP_KEY];

if (!app) {
  throw new Error(
    `Unknown APP "${APP_KEY}". Valid options: ${Object.keys(APPS).join(', ')}`
  );
}

const pageDuration = new Trend(`${APP_KEY}_page_duration`, true);

export const options = {
  scenarios: {
    ramping_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: Number(__ENV.VUS_RAMP || 10) },
        { duration: __ENV.HOLD_DURATION || '2m', target: Number(__ENV.VUS_RAMP || 10) },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
    [`${APP_KEY}_page_duration`]: ['p(95)<2000'],
  },
};

const BROWSER_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

export default function () {
  for (const page of app.urls) {
    const res = http.get(page.url, {
      headers: BROWSER_HEADERS,
      tags: { app: APP_KEY, page: page.name },
    });

    check(res, {
      [`${APP_KEY}/${page.name}: status is 200-399`]: (r) => r.status >= 200 && r.status < 400,
      [`${APP_KEY}/${page.name}: loaded under 3s`]: (r) => r.timings.duration < 3000,
    });

    pageDuration.add(res.timings.duration);
    sleep(1);
  }
}
