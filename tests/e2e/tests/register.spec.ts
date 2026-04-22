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

    await expect(
      page.locator('button[data-action="register-public-email-duplicate-check"]')
    ).toBeVisible();
    await expect(
      page.locator('button[data-action="register-public-phone-duplicate-check"]')
    ).toBeVisible();
  });

  test('휴대폰 중복확인 UI (API 모킹, 중복)', async ({ page }: { page: Page }) => {
    await mockPhoneDuplicateCheck(page, {
      success: true,
      data: { isDuplicate: true },
    });

    await page.goto('/register');
    await page.locator('#phone').fill('01012345678');

    const phoneGroup = page.locator('.mg-v2-form-group').filter({ has: page.locator('#phone') });
    await page.locator('button[data-action="register-public-phone-duplicate-check"]').click();

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
    await page.locator('button[data-action="register-public-phone-duplicate-check"]').click();

    await expect(phoneGroup.locator('small.mg-v2-form-help--success')).toContainText(
      /사용 가능한 휴대폰|PHONE_AVAILABLE/
    );
  });

  test('휴대폰 무효 번호 — 중복확인 시 duplicate-check API 미호출·중복/가능 안내 미표시', async ({
    page,
  }: {
    page: Page;
  }) => {
    let phoneDupGetCount = 0;
    await page.route('**/api/v1/auth/duplicate-check/phone**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      phoneDupGetCount += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { isDuplicate: false } }),
      });
    });

    await page.goto('/register');
    await page.locator('#phone').fill('12345');

    const phoneGroup = page.locator('.mg-v2-form-group').filter({ has: page.locator('#phone') });
    await page.locator('button[data-action="register-public-phone-duplicate-check"]').click();

    expect(phoneDupGetCount).toBe(0);
    await expect(phoneGroup.locator('small.mg-v2-form-help--error')).toHaveCount(0);
    await expect(phoneGroup.locator('small.mg-v2-form-help--success')).toHaveCount(0);
    await expect(
      page.locator('.mg-notification-message').filter({ hasText: /휴대폰 번호만 입력해 주세요/ })
    ).toBeVisible();
  });

  test('휴대폰 무효 번호 — 제출 시 mg-v2-error-text에 올바른 휴대폰 안내', async ({
    page,
  }: {
    page: Page;
  }) => {
    await mockPhoneDuplicateCheck(page, {
      success: true,
      data: { isDuplicate: false },
    });

    await page.goto('/register');
    await page.locator('#name').fill('E2E회귀');
    await page.locator('#email').fill(`e2e-reg-${Date.now()}@example.test`);
    await page.locator('#password').fill('password12');
    await page.locator('#confirmPassword').fill('password12');
    await page.locator('#rrnFirst6').fill('900101');
    await page.locator('#rrnLast1').fill('1');
    await page.locator('#phone').fill('01012');
    await page.locator('#agreeTerms').check();
    await page.locator('#agreePrivacy').check();

    await page.locator('form.mg-v2-auth-form').getByRole('button', { name: '회원가입' }).click();

    const phoneGroup = page.locator('.mg-v2-form-group').filter({ has: page.locator('#phone') });
    await expect(phoneGroup.locator('span.mg-v2-error-text')).toContainText(
      /휴대폰 번호만 입력해 주세요|010·011·016~019/
    );
  });
});
