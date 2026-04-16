/**
 * 내담자 대시보드 스모크: `/client/dashboard` 진입·헤딩·콘솔 오류 수집
 *
 * 자격 증명: `TEST_CLIENT_USERNAME` · `TEST_CLIENT_PASSWORD` 가 **모두** 설정된 경우에만 로그인 후 검증한다.
 * (내담자 전용 계정; 관리자/상담사 계정과 혼용하지 않음)
 *
 * 로컬 실행 예:
 *   cd tests/e2e && BASE_URL=http://localhost:3000 TEST_CLIENT_USERNAME=... TEST_CLIENT_PASSWORD=... npm run test:client
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

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child:\n${reactHits.join('\n---\n')}\n전체:\n${collectedErrors.join('\n')}`
    ).toEqual([]);

    const severe = collectedErrors.filter((line) => !REACT_130_OR_INVALID_CHILD.test(line));
    expect(severe, `pageerror / console.error:\n${severe.join('\n---\n')}`).toEqual([]);
  });
});
