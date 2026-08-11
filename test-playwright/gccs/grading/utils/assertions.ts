import { Page, expect } from '@playwright/test';

export async function expectNoConsoleErrors(page: Page, errors: string[]) {
  expect(errors, `Console errors detected:\n${errors.join('\n')}`).toEqual([]);
}

export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

export async function expectValidationMessage(page: Page, text: string | RegExp) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
}

export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = process.hrtime.bigint();
  const result = await fn();
  const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
  // eslint-disable-next-line no-console
  console.log(`[PERF] ${label}: ${ms.toFixed(0)}ms`);
  return result;
}
