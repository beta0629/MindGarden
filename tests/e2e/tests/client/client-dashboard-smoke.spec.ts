/**
 * 내담자 대시보드 스모크: `/client/dashboard` 진입·헤딩·콘솔 오류 수집
 *
 * 자격 증명: `TEST_CLIENT_USERNAME` · `TEST_CLIENT_PASSWORD` 가 **모두** 설정된 경우에만 로그인 후 검증한다.
 * (내담자 전용 계정; 관리자/상담사 계정과 혼용하지 않음)
 *
 * 로컬 실행 예:
 *   cd tests/e2e && BASE_URL=http://localhost:3000 TEST_CLIENT_USERNAME=... TEST_CLIENT_PASSWORD=... npm run test:client
 *
 * 리뉴얼 UI testid (`ClientDashboard.js`):
 * - `client-dashboard-hero-illustration`, `client-dashboard-quickmenu-accent`, `client-dashboard-quick-menu` 가
 *   DOM에 없으면 동일 이름으로 `data-testid` 를 부착해 주세요 (스모크가 해당 노드를 전제로 합니다).
 * - `client-dashboard-quick-menu-section`: 빠른 메뉴 영역 섹션 래퍼(스모크에서 `client-dashboard-quick-menu` 직후 가시성 검증).
 * - `client-dashboard-upcoming-schedule`: 다가오는 일정 섹션(항상 마운트). "일정 보기" 버튼은 다가오는 일정이 0건일 때만 노출.
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

test.describe('내담자 대시보드 스모크', () => {
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

  test('/client/dashboard 에서 대시보드 문구가 보이고 런타임 오류가 없다', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/client/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/dashboard/, { timeout: 15_000 });

    const heading = page.locator('#client-dashboard-page-title');
    await expect(heading).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(
        async () => {
          const docTitle = await page.title();
          let headingText = '';
          try {
            headingText = (await heading.innerText()).trim();
          } catch {
            headingText = '';
          }
          const titleOk = /대시보드|MindGarden|마인드가든/i.test(docTitle);
          const bodyOk = /내 대시보드|대시보드/.test(headingText);
          return titleOk || bodyOk;
        },
        {
          message:
            'document.title 또는 #client-dashboard-page-title 에 대시보드 관련 문구가 나타나야 합니다.',
          timeout: 20_000,
        }
      )
      .toBe(true);

    await test.step('히어로·빠른 메뉴 영역(testid) 및 상담 일정 버튼', async () => {
      await expect(page.getByTestId('client-dashboard-hero-illustration')).toBeVisible({
        timeout: 5_000,
      });
      await expect(page.getByTestId('client-dashboard-quickmenu-accent')).toBeVisible();
      await expect(page.getByTestId('client-dashboard-quick-menu')).toBeVisible();
      await expect(page.getByTestId('client-dashboard-quick-menu-section')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('button', { name: /상담 일정/ })).toBeVisible();
    });

    await test.step('다가오는 일정 섹션(testid)', async () => {
      const upcomingSection = page.getByTestId('client-dashboard-upcoming-schedule');
      await expect(upcomingSection).toBeVisible({ timeout: 10_000 });
      // "일정 보기"는 다가오는 일정이 0건인 빈 상태에서만 노출됨(`ClientDashboard.js` empty CTA). 일정이 있으면 목록만 표시.
      // 빈 일정 계정에서만 검증하려면: await expect.soft(upcomingSection.getByRole('button', { name: /일정 보기/ })).toBeVisible();
    });

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child:\n${reactHits.join('\n---\n')}\n전체:\n${collectedErrors.join('\n')}`
    ).toEqual([]);

    const severe = collectedErrors.filter((line) => !REACT_130_OR_INVALID_CHILD.test(line));
    expect(severe, `pageerror / console.error:\n${severe.join('\n---\n')}`).toEqual([]);
  });
});
