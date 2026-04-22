// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import { getMindGardenWebLogin } from '../helpers/erpAuth';

/**
 * 인증 E2E (UnifiedLogin: 단일 식별자 필드 name="email", API body email)
 *
 * 실행 예 (저장소 루트):
 *   cd tests/e2e && npx playwright test tests/auth.spec.ts --project=chromium
 *
 * 환경 변수:
 *   E2E_TEST_EMAIL / E2E_TEST_PASSWORD (권장) 또는 TEST_USERNAME / TEST_PASSWORD — SSOT: `.cursor/skills/core-solution-testing/SKILL.md`
 *   E2E_LOGIN_PHONE / E2E_LOGIN_PASSWORD — 휴대폰 번호 로그인(P0). 미설정 시 스킵(CI 안정).
 *   API가 아직 휴대폰을 거부하면 스펙이 실패할 수 있음 → 코더 API 반영 후 재실행.
 */

const LOGIN_ID_SELECTOR = 'input[name="email"]';
const LOGIN_PASSWORD_SELECTOR = 'input[name="password"]';

function envTrim(key: string): string | undefined {
  const v = process.env[key];
  if (v == null || String(v).trim() === '') return undefined;
  return String(v).trim();
}

async function submitLogin(page: Page): Promise<void> {
  const loginResponsePromise = page.waitForResponse(
    (r) =>
      (r.url().includes('/auth/') || r.url().includes('/login')) &&
      r.request().method() === 'POST',
    { timeout: 20000 }
  ).catch(() => null);

  await page.locator('button[type="submit"], button:has-text("로그인"), button:has-text("Login")').first().click();
  const loginResponse = await loginResponsePromise;
  if (loginResponse?.status() === 401) {
    const body = await loginResponse.text().catch(() => '');
    throw new Error(
      `로그인 API 401. TEST_USERNAME/TEST_PASSWORD 또는 E2E_* 계정을 확인하세요. (${body.slice(0, 120)})`
    );
  }

  // 중복 로그인 확인 모달
  const dup = page.locator('button:has-text("확인"), button:has-text("계속")').first();
  if (await dup.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dup.click();
  }
}

test.describe('인증 테스트', () => {
  const { username: TEST_USERNAME, password: TEST_PASSWORD } = getMindGardenWebLogin();

  test('이메일 로그인 성공 (회귀)', async ({ page }: { page: Page }) => {
    await page.goto('/login');

    await page.locator(LOGIN_ID_SELECTOR).fill(TEST_USERNAME);
    await page.locator(LOGIN_PASSWORD_SELECTOR).fill(TEST_PASSWORD);

    await submitLogin(page);

    await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });

    const cookies = await page.context().cookies();
    expect(cookies.length).toBeGreaterThan(0);
  });

  test('로그인 후 세션·랜딩', async ({ page }: { page: Page }) => {
    await page.goto('/login');
    await page.locator(LOGIN_ID_SELECTOR).fill(TEST_USERNAME);
    await page.locator(LOGIN_PASSWORD_SELECTOR).fill(TEST_PASSWORD);
    await submitLogin(page);
    await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });

    const userInfo = page.locator('text=/관리자|Admin|사용자|User/i').first();
    await expect(userInfo).toBeVisible({ timeout: 8000 });
  });

  test('휴대폰 번호 로그인 (환경 변수 있을 때만)', async ({ page }: { page: Page }) => {
    /**
     * Skip: E2E_LOGIN_PHONE·E2E_LOGIN_PASSWORD 미설정 — 로컬/스테이징 테스트 계정 없음, CI 기본 경로에서 실행 안 함.
     * Skip: 백엔드가 login body의 email 필드에 휴대폰을 아직 허용하지 않으면 4xx → 코더 P0 반영 후 재검증.
     */
    const phone = envTrim('E2E_LOGIN_PHONE');
    const password = envTrim('E2E_LOGIN_PASSWORD');
    if (!phone || !password) {
      test.skip(true, 'E2E_LOGIN_PHONE 및 E2E_LOGIN_PASSWORD 미설정 — 휴대폰 로그인 스모크 생략(CI 안정)');
      return;
    }

    await page.goto('/login');
    await page.locator(LOGIN_ID_SELECTOR).fill(phone);
    await page.locator(LOGIN_PASSWORD_SELECTOR).fill(password);

    await submitLogin(page);

    await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });
  });
});
