/**
 * 내담자 회기 관리 화면 스모크: `/client/session-management` 진입·루트 testid 가시성
 *
 * 자격 증명 SSOT: `getClientWebLogin()` — 기본 `01086322121` / `godgod826!` (`.cursor/skills/core-solution-testing/SKILL.md`)
 *
 * testid (`ClientSessionManagement.js`): `client-session-management-page`
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import { loginClientWeb } from '../../helpers/erpAuth';

const REACT_130_OR_INVALID_CHILD =
  /Minified React error #130|Objects are not valid as a React child|invariant=130/i;

function attachRuntimeErrorCollectors(page: Page, bucket: string[]) {
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

test.describe('내담자 회기 관리 화면 스모크', () => {
  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginClientWeb(page, test.info());
  });

  test('/client/session-management 에서 페이지 testid가 보인다', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/client/session-management', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/session-management/, { timeout: 15_000 });

    const pageRoot = page.getByTestId('client-session-management-page');
    await expect(pageRoot).toBeVisible({ timeout: 20_000 });

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child:\n${reactHits.join('\n---\n')}\n전체:\n${collectedErrors.join('\n')}`
    ).toEqual([]);

    const severe = collectedErrors.filter((line) => !REACT_130_OR_INVALID_CHILD.test(line));
    expect(severe, `pageerror / console.error:\n${severe.join('\n---\n')}`).toEqual([]);
  });
});
