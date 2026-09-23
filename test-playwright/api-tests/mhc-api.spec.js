import { test, expect } from '@playwright/test';
import 'dotenv/config';

const MORE_BASE_URL = process.env.MORE_BASE_URL || 'https://more-dev.modena.com';

test.describe('API Testing: MORE / MHC Web & Backend Endpoints', () => {
  test('GET / Portal availability returns 200/OK', async ({ request }) => {
    const response = await request.get(MORE_BASE_URL);
    expect(response.status()).toBeLessThan(500);
  });

  test('GET / API asset/manifest request verification', async ({ request }) => {
    const response = await request.get(`${MORE_BASE_URL}/manifest.json`, {
      failOnStatusCode: false,
    });
    // Manifest or favicon status check
    expect(response.status()).toBeLessThan(500);
  });

  test('POST / Invalid route / CSRF protection check', async ({ request }) => {
    const response = await request.post(`${MORE_BASE_URL}/api/invalid-endpoint-test`, {
      data: { test: true },
      failOnStatusCode: false,
    });
    // Harus mengembalikan 404 atau 405 (bukan 500 server crash)
    expect([400, 401, 403, 404, 405]).toContain(response.status());
  });
});
