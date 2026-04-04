// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';

/**
 * 회원가입 E2E (TabletRegister: /register, apiGet ApiResponse unwrap과 동일한 모킹)
 *
 * 실행 예 (저장소 루트):
 *   cd tests/e2e && npx playwright test tests/register.spec.ts --project=chromium
 *
 * 환경 변수:
 *   BASE_URL — 프론트 기본 URL(미설정 시 playwright.config 기본값, localhost:3000)
 *   휴대폰 중복확인 시나리오는 api/v1/auth/duplicate-check/phone 경로 GET만 page.route로 모킹하여 백엔드 없이 검증합니다.
 */

async function mockPhoneDuplicateCheck(
  page: Page,
  body: { success: boolean; data: { isDuplicate: boolean } }
): Promise<void> {
  await page.route('**/api/v1/auth/duplicate-check/phone**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

test.describe('회원가입 테스트', () => {
  test('/register 로드 스모크', async ({ page }: { page: Page }) => {
    await page.goto('/register');

    await expect(page.locator('h2.mg-v2-auth-title')).toContainText('회원가입');
    await expect(page.locator('form.mg-v2-auth-form')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.locator('#agreeTerms')).toBeVisible();
  });

  test('휴대폰 중복확인 UI (API 모킹, 중복)', async ({ page }: { page: Page }) => {
    await mockPhoneDuplicateCheck(page, {
      success: true,
      data: { isDuplicate: true },
    });

    await page.goto('/register');
    await page.locator('#phone').fill('01012345678');

    const phoneGroup = page.locator('.mg-v2-form-group').filter({ has: page.locator('#phone') });
    await phoneGroup.locator('button', { hasText: '중복확인' }).click();

    await expect(phoneGroup.locator('small.mg-v2-form-help--error')).toContainText(
      /이미 사용 중인 휴대폰|PHONE_EXISTS/
    );
  });

  test('휴대폰 중복확인 UI (API 모킹, 사용 가능)', async ({ page }: { page: Page }) => {
    await mockPhoneDuplicateCheck(page, {
      success: true,
      data: { isDuplicate: false },
    });

    await page.goto('/register');
    await page.locator('#phone').fill('01012345678');

    const phoneGroup = page.locator('.mg-v2-form-group').filter({ has: page.locator('#phone') });
    await phoneGroup.locator('button', { hasText: '중복확인' }).click();

    await expect(phoneGroup.locator('small.mg-v2-form-help--success')).toContainText(
      /사용 가능한 휴대폰|PHONE_AVAILABLE/
    );
  });
});
