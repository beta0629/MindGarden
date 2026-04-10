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

async function adminLogin(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="username"], input[type="email"]', username);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("로그인")');
  await page.waitForURL(/dashboard|admin|home/, { timeout: 10000 });
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

test.describe('관리자 — 통합 사용자 관리 콘솔 스모크 (React #130 감지)', () => {
  const TEST_USERNAME =
    ((process as any).env.TEST_USERNAME as string) || 'superadmin@mindgarden.com';
  const TEST_PASSWORD =
    ((process as any).env.TEST_PASSWORD as string) || 'admin123';

  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await adminLogin(page, TEST_USERNAME, TEST_PASSWORD);
  });

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
