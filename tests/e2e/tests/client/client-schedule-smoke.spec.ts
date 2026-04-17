/**
 * 내담자 일정 화면 스모크: `/client/schedule` 진입·루트 testid 가시성
 *
 * 자격 증명: `TEST_CLIENT_USERNAME` · `TEST_CLIENT_PASSWORD` 가 **모두** 설정된 경우에만 로그인 후 검증한다.
 *
 * testid (`ClientSchedule.js`): `client-schedule-page`
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';

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

async function loginClientWithEnv(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill(
    'input[name="username"], input[type="email"], input[placeholder*="아이디"], input[placeholder*="이메일"]',
    username
  );
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("로그인"), button:has-text("Login")');
  await page.waitForURL(/\/client\/dashboard/, { timeout: 20_000 });
}

test.describe('내담자 일정 화면 스모크', () => {
  const username = ((process as any).env.TEST_CLIENT_USERNAME as string | undefined)?.trim();
  const password = (process as any).env.TEST_CLIENT_PASSWORD as string | undefined;

  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }, testInfo) => {
    if (!username || !password) {
      testInfo.skip(
        true,
        'TEST_CLIENT_USERNAME / TEST_CLIENT_PASSWORD 를 모두 설정한 뒤 실행하세요.'
      );
      return;
    }
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginClientWithEnv(page, username, password);
  });

  test('/client/schedule 에서 페이지 testid가 보인다', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/client/schedule', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/schedule/, { timeout: 15_000 });

    const pageRoot = page.getByTestId('client-schedule-page');
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
