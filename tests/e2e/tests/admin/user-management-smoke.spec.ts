/**
 * 통합 사용자 관리(UserManagementPage) 콘솔 스모크 (React #130 등 런타임 오류 수집)
 *
 * 로컬 실행 예 (프론트가 이미 떠 있어야 함; 연결 거부 시 서버 기동 후 재시도):
 *   cd tests/e2e && BASE_URL=http://localhost:3000 TEST_USERNAME=... TEST_PASSWORD=... \
 *     npx playwright test tests/admin/user-management-smoke.spec.ts --project=chromium \
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
import {
  REACT_130_OR_INVALID_CHILD,
  attachRuntimeErrorCollectors
} from '../../helpers/react130ConsoleGate';

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

test.describe('관리자 — 통합 사용자 관리 콘솔 스모크 (React #130 감지)', () => {
  let collectedErrors: string[] = [];

  const USER_MGMT_PATHS = [
    '/admin/user-management?type=client',
    '/admin/user-management?type=consultant',
    '/admin/user-management?type=staff',
  ] as const;

  test.beforeEach(async ({ page }, testInfo) => {
    skipWhenCiMissingE2eCredentials();
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginErpUser(page, testInfo, { timeoutMs: 25_000 });
  });

  for (const viewport of [
    { label: '1280', width: 1280, height: 800 },
    { label: '768', width: 768, height: 1024 },
  ]) {
    test(`${viewport.label}px viewport — 3화면 blank·#130 없음`, async ({ page }: { page: Page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const path of USER_MGMT_PATHS) {
        const outcome = await gotoAdminPathOptional403(page, path);
        if (outcome === 'skipped') {
          test.info().annotations.push({
            type: 'note',
            description: `HTTP 403 — 경로 건너뜀: ${path}`,
          });
          continue;
        }
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(1500);
        await assertNotBlankScreen(page);
      }

      const reactHits = collectedErrors.filter((line) =>
        REACT_130_OR_INVALID_CHILD.test(line)
      );
      expect(
        reactHits,
        `React #130 또는 invalid child (${viewport.label}px):\n${reactHits.join('\n---\n')}`
      ).toEqual([]);
    });
  }

  test('사용자 관리 진입·pill 전환·콘솔 검사', async ({ page }: { page: Page }) => {
    const outcome = await gotoAdminPathOptional403(
      page,
      '/admin/user-management?type=consultant'
    );
    if (outcome === 'skipped') {
      test.info().annotations.push({
        type: 'note',
        description: '통합 사용자 관리 페이지 접근 불가 — 탭 전환 생략',
      });
    } else {
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
      await assertNotBlankScreen(page);

      const tabLabels = ['상담사', '내담자', '스태프'] as const;
      for (const label of tabLabels) {
        const tabBtn = page.getByRole('button', { name: label, exact: true });
        const n = await tabBtn.count();
        if (n === 0) {
          test.info().annotations.push({
            type: 'note',
            description: `탭 버튼 없음/숨김 — ${label} (권한 등)`,
          });
          continue;
        }
        const first = tabBtn.first();
        if (!(await first.isVisible())) {
          test.info().annotations.push({
            type: 'note',
            description: `탭 비가시 — ${label} (권한 등)`,
          });
          continue;
        }
        await first.click();
        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(1000);
        await assertNotBlankScreen(page);
      }
    }

    console.log(
      '[user-management-smoke] 수집된 console error / pageerror:',
      JSON.stringify(collectedErrors, null, 2)
    );

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child 패턴이 감지됨:\n${reactHits.join('\n---\n')}`
    ).toEqual([]);
  });
});
