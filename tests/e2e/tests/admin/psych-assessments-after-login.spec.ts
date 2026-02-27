// @ts-ignore
import { test, expect } from '@playwright/test';

/**
 * 재로그인 후 심리검사 최근 업로드 목록 노출 확인
 * - 새 세션으로 로그인 → /admin/psych-assessments 이동 → 목록 영역이 정상 노출되는지 검증
 * 기본 계정: beta74@live.co.kr / 12345678 (개발 서버용). 덮어쓰기: TEST_USERNAME, TEST_PASSWORD
 * 실행: npm run test:dev (개발 서버) 또는 BASE_URL=... npx playwright test ...
 */
test.describe('재로그인 후 심리검사 목록', () => {
  const TEST_USERNAME = (process as any).env.TEST_USERNAME || 'beta74@live.co.kr';
  const TEST_PASSWORD = (process as any).env.TEST_PASSWORD || '12345678';

  test('새로 로그인 후 심리검사 페이지에서 최근 업로드 블록이 보인다', async ({ page }) => {
    // 1) 로그인 페이지에서 새로 로그인 (세션 새로 시작)
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USERNAME);
    await page.fill('input[name="password"]', TEST_PASSWORD);

    // 로그인 API 응답 대기 후 버튼 클릭 (폼 제출이 비동기이므로 응답까지 대기)
    const loginResponsePromise = page.waitForResponse(
      (r) => (r.url().includes('/auth/') || r.url().includes('/login')) && r.request().method() === 'POST',
      { timeout: 15000 }
    );
    await page.locator('form').locator('button:has-text("로그인")').first().click();
    const loginResponse = await loginResponsePromise;
    const status = loginResponse.status();
    if (status !== 200 && status !== 201) {
      const body = await loginResponse.text().catch(() => '');
      const msg = status === 401
        ? `로그인 실패(401). 개발 서버에서 사용할 계정으로 TEST_USERNAME, TEST_PASSWORD를 설정한 뒤 실행하세요. (${body.slice(0, 80)}...)`
        : `로그인 API 실패: ${status}. ${body.slice(0, 200)}`;
      throw new Error(msg);
    }

    // 중복 로그인 모달이 뜨면 확인 클릭
    const modalConfirm = page.locator('button:has-text("확인"), button:has-text("계속"), [role="dialog"] button').first();
    await modalConfirm.click({ timeout: 8000 }).catch(() => {});

    // 2) 로그인 후 URL 전환 대기
    await page.waitForURL(/dashboard|admin|home|psych-assessments|\/admin/, { timeout: 20000 });

    // 3) 심리검사 관리 페이지로 이동
    await page.goto('/admin/psych-assessments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 4) "최근 업로드" 블록이 렌더링되었는지 확인
    const block = page.locator('.mg-v2-psych-document-list-block__card, .mg-v2-psych-document-list-block');
    await expect(block.first()).toBeVisible({ timeout: 15000 });

    // 5) API 오류 시 나오는 문구가 없어야 함 (tenantId 미설정 시 목록 로드 실패)
    const loadErrorText = page.locator('text=목록을 불러오지 못했습니다');
    await expect(loadErrorText).not.toBeVisible();
  });
});
