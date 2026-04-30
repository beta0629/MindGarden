/**
 * React #130·invalid child 등 크리티컬 런타임 오류 수집 (admin-dashboard-lnb-console-smoke 등과 공유)
 */
import type { Page } from '@playwright/test';

export const REACT_130_OR_INVALID_CHILD =
  /Minified React error #130|Objects are not valid as a React child|invariant=130/i;

export function attachRuntimeErrorCollectors(page: Page, bucket: string[]): void {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      bucket.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    const stack = err.stack ? '\n' + err.stack : '';
    bucket.push('[pageerror] ' + err.message + stack);
  });
}
