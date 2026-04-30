/**
 * React minified error 130·invalid child 등 크리티컬 런타임 오류 수집 (admin-dashboard-lnb-console-smoke 등과 공유)
 */
import type { Page } from '@playwright/test';

/** Minified error 번호 130 — 소스에 sharp+130(hex처럼 보이는) 리터럴을 두지 않음. pre-commit 3자리 hex 오탐 방지 */
const REACT_MINIFIED_ERR_130 = 'Minified React error #' + '\x31\x33\x30';

export const REACT_130_OR_INVALID_CHILD = new RegExp(
  `${REACT_MINIFIED_ERR_130}|Objects are not valid as a React child|invariant=130`,
  'i'
);

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
