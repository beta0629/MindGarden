/**
 * 관리자 대시보드·LNB 경로 콘솔 스모크 (React #130 등 런타임 오류 수집)
 *
 * 로컬 실행 예 (프론트가 이미 떠 있어야 함; 연결 거부 시 서버 기동 후 재시도):
 *   cd tests/e2e && BASE_URL=http://localhost:3000 TEST_USERNAME=... TEST_PASSWORD=... \
 *     npx playwright test tests/admin/admin-dashboard-lnb-console-smoke.spec.ts --project=chromium \
 *     --config=playwright.manual.config.ts
 *
 * `playwright.config.ts`만 쓸 경우 webServer.command 설정이 없으면 Playwright가 즉시 실패할 수 있음.
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import {
  loginErpUser,
  skipWhenCiMissingE2eCredentials
} from '../../helpers/erpAuth';

const REACT_130_OR_INVALID_CHILD =
  /Minified React error #130|Objects are not valid as a React child|invariant=130/i;

/**
 * `integrated-schedule-client-notes.spec.ts` S5와 동일하게 console `error`·`pageerror`를 버킷에 적재하고,
 * 아래 테스트에서는 React #130·invalid child 패턴만 실패 조건으로 필터한다(다른 경로의 기존 콘솔 노이즈와 구분).
 */
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

/** SPA에서 의미 있는 본문 영역이 보이고 body가 완전 공백이 아닌지 확인 */
async function assertNotBlankScreen(page: Page) {
  const contentRoot = page.locator('main, .mg-v2-ad-b0kla, .mg-admin-layout').first();
  await expect(contentRoot).toBeVisible({ timeout: 15000 });
  await expect(page.locator('body')).not.toHaveText(/^\s*$/);
}

async function gotoAdminPathOptional403(
  page: Page,
  path: string
): Promise<'ok' | 'skipped'> {
  const resp = await page.goto(path, { waitUntil: 'domcontentloaded' });
  if (resp?.status() === 403) {
    test.info().annotations.push({
      type: 'note',
      description: `HTTP 403 — 경로 건너뜀: ${path}`,
    });
    return 'skipped';
  }
  const bodyText = (await page.locator('body').innerText()).trim();
  if (/^(403\b|Forbidden|접근\s*거부|권한이\s*없습니다)/i.test(bodyText.slice(0, 200))) {
    test.info().annotations.push({
      type: 'note',
      description: `본문상 403/권한 안내 — 경로 건너뜀: ${path}`,
    });
    return 'skipped';
  }
  return 'ok';
}

test.describe('관리자 — 대시보드 및 LNB 경로 콘솔 스모크 (React #130 감지)', () => {
  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }, testInfo) => {
    skipWhenCiMissingE2eCredentials();
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginErpUser(page, testInfo, { timeoutMs: 25_000 });
  });

  test('대시보드 → 사용자(컨설턴트) → 매핑관리 → 공통코드 순회 및 콘솔 검사', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await assertNotBlankScreen(page);

    const paths = [
      '/admin/user-management?type=consultant',
      '/admin/mapping-management',
      '/admin/integrated-schedule',
      '/admin/common-codes',
    ];

    for (const path of paths) {
      const outcome = await gotoAdminPathOptional403(page, path);
      if (outcome === 'skipped') {
        continue;
      }
      if (path === '/admin/integrated-schedule') {
        const calendarHost = page.locator('[data-layout-context="integrated-schedule"]');
        await expect(calendarHost).toBeVisible({ timeout: 20_000 });
        await page.waitForTimeout(500);
      }
      await assertNotBlankScreen(page);
    }

    console.log(
      '[admin-dashboard-lnb-console-smoke] 수집된 console error / pageerror:',
      JSON.stringify(collectedErrors, null, 2)
    );

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child 패턴이 감지됨:\n${reactHits.join('\n---\n')}`
    ).toEqual([]);
  });
});
