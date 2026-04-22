/**
 * 내담자 대시보드 스모크: `/client/dashboard` 진입·헤딩·콘솔 오류 수집
 *
 * 자격 증명 SSOT: `tests/e2e/helpers/erpAuth.ts` · `loginClientWeb()` — 기본 `01086322121` / `godgod826!`
 * 덮어쓰기: `TEST_CLIENT_USERNAME`·`TEST_CLIENT_PASSWORD` 또는 `E2E_CLIENT_LOGIN_ID`·`E2E_CLIENT_PASSWORD`
 *
 * 로컬 실행 예:
 *   cd tests/e2e && BASE_URL=http://localhost:3000 npm run test:client
 *
 * 리뉴얼 UI testid (`ClientDashboard.js`):
 * - `client-dashboard-quick-menu`, `client-dashboard-quick-menu-section` (빠른 메뉴).
 * - `client-dashboard-kpi-section`: 핵심 지표(KPI) 섹션.
 * - `client-dashboard-upcoming-schedule`: 다음 액션·일정 섹션(항상 마운트). "일정 보기" 버튼은 다가오는 일정이 0건일 때만 노출.
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

test.describe('내담자 대시보드 스모크', () => {
  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginClientWeb(page, test.info());
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

    await test.step('빠른 메뉴 영역(testid) 및 일정 버튼', async () => {
      await expect(page.getByTestId('client-dashboard-quick-menu')).toBeVisible();
      await expect(page.getByTestId('client-dashboard-quick-menu-section')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('button', { name: /^일정$/ })).toBeVisible();
    });

    await test.step('KPI 섹션(testid)', async () => {
      await expect(page.getByTestId('client-dashboard-kpi-section')).toBeVisible({ timeout: 10_000 });
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

  test('/client 접속 시 /client/dashboard 로 replace 리다이렉트된다', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/client', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/client\/dashboard$/, { timeout: 15_000 });
    await expect(page.locator('#client-dashboard-page-title')).toBeVisible({ timeout: 20_000 });
  });
});
