/**
 * 옵트인 관리자 E2E 스캐폴드.
 *
 * 환경 변수 (문서: docs/project-management/2026-04-23/PHONE_VERIFICATION_ADMIN_E2E_SCENARIOS.md)
 * - `ADMIN_E2E=1` — 스캐폴드 케이스 활성화(로그인 폼 스모크 등).
 * - 선택: `ADMIN_E2E_EMAIL`, `ADMIN_E2E_PASSWORD` — 셋(ADMIN_E2E + 이 둘)이 모두 있을 때만
 *   로그인 후 URL(대시보드/어드민) 검증. 비밀번호는 로그·리포트에 남기지 말 것.
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect } from '@playwright/test';

const enabled = !!process.env.ADMIN_E2E;

function envTrim(key: string): string | undefined {
  const v = process.env[key];
  if (v == null || String(v).trim() === '') {
    return undefined;
  }
  return String(v).trim();
}

test.describe('Admin E2E scaffold', () => {
  test('로그인 페이지 — 로그인 폼 스모크', async ({ page }) => {
    test.skip(
      !enabled,
      'Set ADMIN_E2E=1 to run admin E2E scaffold (see PHONE_VERIFICATION_ADMIN_E2E_SCENARIOS.md)',
    );
    await page.goto('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('로그인 후 내비 — 대시보드/어드민 URL', async ({ page }) => {
    const email = envTrim('ADMIN_E2E_EMAIL');
    const password = envTrim('ADMIN_E2E_PASSWORD');
    if (!enabled || !email || !password) {
      test.skip(
        true,
        'Set ADMIN_E2E=1 and ADMIN_E2E_EMAIL, ADMIN_E2E_PASSWORD for post-login navigation (see PHONE_VERIFICATION_ADMIN_E2E_SCENARIOS.md)',
      );
      return;
    }

    await page.goto('/login');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);

    const loginResponsePromise = page
      .waitForResponse(
        (r) =>
          (r.url().includes('/auth/') || r.url().includes('/login')) && r.request().method() === 'POST',
        { timeout: 20_000 },
      )
      .catch(() => null);

    await page.locator('button[type="submit"], button:has-text("로그인")').first().click();
    const loginResponse = await loginResponsePromise;
    if (loginResponse && loginResponse.status() === 401) {
      const body = await loginResponse.text().catch(() => '');
      throw new Error(
        `로그인 API 401. ADMIN_E2E_EMAIL/ADMIN_E2E_PASSWORD(비밀번호는 로그에 남기지 말 것)를 확인하세요. (${body.slice(0, 120)})`,
      );
    }

    const dup = page.locator('button:has-text("확인"), button:has-text("계속")').first();
    if (await dup.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dup.click();
    }

    await page.waitForURL(
      /\/(admin|dashboard|client|consultant|academy|home|super_admin)/,
      { timeout: 45_000 },
    );
  });

  test('향후: user-management + 모달에서 #consultant-phone', async () => {
    test.skip(
      !enabled,
      'Set ADMIN_E2E=1 to run admin E2E scaffold (see PHONE_VERIFICATION_ADMIN_E2E_SCENARIOS.md)',
    );
    // TODO(Wave 이후): `/admin/user-management?type=consultant` 진입 → 상담사 생성/수정 모달 오픈 → `#consultant-phone` DOM 가시성.
    // 현재는 경로·세션·권한이 복잡해 스캐폴드에서 생략.
    test.skip(
      true,
      'Scaffold: deferred until user-management + modal open flow is stable',
    );
  });
});
