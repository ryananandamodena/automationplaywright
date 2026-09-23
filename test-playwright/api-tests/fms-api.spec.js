import { test, expect } from '@playwright/test';
import 'dotenv/config';

const FMS_PORTAL_URL = process.env.BASE_URL || 'https://portal-dev.modena.com';

test.describe('API Testing: FMS Portal Endpoints', () => {
  test('GET / FMS Portal Root Availability', async ({ request }) => {
    const response = await request.get(FMS_PORTAL_URL);
    expect(response.status()).toBeLessThan(500);
  });

  test('GET / FMS Login Route Availability', async ({ request }) => {
    const response = await request.get(`${FMS_PORTAL_URL}/login`);
    expect(response.status()).toBeLessThan(500);
  });

  test('POST / Endpoint tidak dikenal menghasilkan 404 / 405', async ({ request }) => {
    const response = await request.post(`${FMS_PORTAL_URL}/api/unknown-endpoint`, {
      data: { test: true },
      failOnStatusCode: false,
    });
    expect([400, 401, 403, 404, 405]).toContain(response.status());
  });
});
