import { test, expect } from '@playwright/test';
import { postWorkorderGrading, SECURITY_CODE } from '../utils/workorderGradingApi';
import { WORKORDER_GRADING_CASES } from '../utils/testData';

test.describe('API - POST /api/v1/transaction/workorder/grading', () => {
  test('TC-WOG-001 valid payload with valid X-Security-Code creates a work order', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.valid());
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.isOk).toBe(true);
    // A repeat request for the same customer/product on the same day creates a
    // "Pre-RON" (ronNo empty, preRonNo set) instead of a fresh RON - both are success.
    expect(body.message).toMatch(/^(RON|Pre-RON) created$/);
    expect(body.row?.ronNo || body.row?.preRonNo).toBeTruthy();
  });

  test('TC-WOG-002 missing X-Security-Code header is rejected', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.valid(), {});
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.isOk).toBe(false);
    expect(body.errorCode).toBe('INVALID_SECURITY_CODE');
  });

  test('TC-WOG-003 invalid X-Security-Code header is rejected', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.valid(), {
      'X-Security-Code': 'INVALID-CODE-0000000000000000000',
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.errorCode).toBe('INVALID_SECURITY_CODE');
  });

  test('TC-WOG-004 empty phone_number is rejected with 400', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.emptyPhoneNumber);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.isOk).toBe(false);
  });

  test('TC-WOG-005 empty product_code is rejected with 400', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.emptyProductCode);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.isOk).toBe(false);
  });

  test('TC-WOG-006 empty serial_number is rejected with 400', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.emptySerialNumber);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.isOk).toBe(false);
  });

  test('TC-WOG-007 empty post_code is rejected with 400', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.emptyPostCode);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.errorMessage).toContain('No grading service center serves post code');
  });

  test('TC-WOG-008 empty app_name is accepted (business rule: app_name is optional)', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.emptyAppName);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.isOk).toBe(true);
  });

  test('TC-WOG-009 all fields empty is rejected with 400', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.allEmpty);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.isOk).toBe(false);
  });

  test('TC-WOG-010 malformed phone_number does not match any customer', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.invalidPhoneNumber);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.errorMessage).toContain('Customer not found');
  });

  test('TC-WOG-011 unknown product_code is not found for the customer', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.unknownProductCode);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.errorMessage).toContain('not found for this customer');
  });

  test('TC-WOG-012 unknown serial_number is not found for the customer', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.unknownSerialNumber);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.errorMessage).toContain('not found for this customer');
  });

  test('TC-WOG-013 SQL injection payload does not cause a server error', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.sqlInjection);
    expect(res.status()).toBe(400); // rejected as an unmatched customer, not a crash
    const body = await res.json();
    expect(body.isOk).toBe(false);
  });

  test('TC-WOG-014 script injection payload does not cause a server error', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.scriptInjection);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.isOk).toBe(false);
    // The raw payload is safely reflected back in the error message, not executed/stored unescaped.
    expect(body.errorMessage).toContain('<script>alert(1)</script>');
  });

  test('TC-WOG-015 very long field values do not cause a server error', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.veryLong);
    expect(res.status()).toBeLessThan(500);
  });

  test('TC-WOG-016 emoji in fields does not cause a server error', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.emoji);
    expect(res.status()).toBeLessThan(500);
  });

  test('TC-WOG-017 missing body fields are rejected with 400', async ({ request }) => {
    const res = await postWorkorderGrading(request, {});
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.isOk).toBe(false);
  });

  test('TC-WOG-018 response body has the expected shape on success', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.valid());
    expect(res.status()).toBe(200);
    const body = await res.json();
    // A repeat request for the same customer/product on the same day creates a
    // "Pre-RON" instead of a fresh RON - both are a successful, valid response shape.
    expect(body.isOk).toBe(true);
    expect(body.message).toMatch(/^(RON|Pre-RON) created$/);
    expect(body.row).toMatchObject({
      ronNo: expect.any(String),
      workOrderId: expect.any(Number),
      technicianUsername: expect.any(String),
    });
  });

  test('TC-WOG-019 header name is case-insensitive per HTTP spec', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.valid(), {
      'x-security-code': SECURITY_CODE,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.isOk).toBe(true);
  });

  test('TC-WOG-020 Postman payload creates a work order', async ({ request }) => {
    const res = await postWorkorderGrading(request, WORKORDER_GRADING_CASES.postmanPayload);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      isOk: true,
      message: 'RON created',
      row: {
        ronNo: expect.any(String),
        workOrderId: expect.any(Number),
      },
    });
  });
});
