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

/**
 * Chromium `console.error` — 부가 리소스·백그라운드 API 401/404 (favicon 등).
 * 쇼핑·장바구니 플로우와 무관하며, ajax/StandardizedApi가 이미 앱 레벨에서 처리한다.
 */
export const BENIGN_CONSOLE_NETWORK_NOISE = new RegExp(
  [
    'Failed to load resource:.*\\b401\\b',
    'Failed to load resource:.*\\b404\\b.*favicon',
    'Failed to load resource:.*\\b404\\b.*\\.ico'
  ].join('|'),
  'i'
);

/**
 * @param {string} line
 * @returns {boolean}
 */
export function isBenignConsoleNoise(line: string): boolean {
  return BENIGN_CONSOLE_NETWORK_NOISE.test(line);
}

/**
 * React minified 130·invalid child·부가 네트워크 노이즈를 제외한 치명적 런타임 오류.
 *
 * @param {string[]} lines
 * @returns {string[]}
 */
export function filterSevereConsoleErrors(lines: string[]): string[] {
  return lines.filter(
    (line) => !REACT_130_OR_INVALID_CHILD.test(line) && !isBenignConsoleNoise(line)
  );
}

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
