import { APIRequestContext, APIResponse } from '@playwright/test';

/** Endpoint under test - lives under /api/v1, not the SPA's root (that returns 405). */
export const WORKORDER_GRADING_ENDPOINT = '/api/v1/transaction/workorder/grading';

/** Fixed security header required by the endpoint. */
export const SECURITY_CODE = '23FB29BB50B8432E916549F1E45E59A3';

export interface WorkorderGradingPayload {
  phone_number: string;
  product_code: string;
  serial_number: string;
  post_code: string;
  app_name: string;
}

/**
 * Sends POST /api/v1/transaction/workorder/grading.
 * `headers` overrides let tests exercise missing/invalid X-Security-Code scenarios.
 */
export async function postWorkorderGrading(
  request: APIRequestContext,
  payload: Partial<WorkorderGradingPayload>,
  headers: Record<string, string> = { 'X-Security-Code': SECURITY_CODE }
): Promise<APIResponse> {
  return request.post(WORKORDER_GRADING_ENDPOINT, {
    headers,
    data: payload,
  });
}
