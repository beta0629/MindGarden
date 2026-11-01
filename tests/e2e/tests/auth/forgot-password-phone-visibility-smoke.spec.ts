// @ts-ignore - @playwright/test types from devDependency
import { test, expect } from '@playwright/test';

/**
 * 비로그인 `/forgot-password` — 히어로·폼·이메일|휴대폰 탭 가시성 스모크 (SMS 실발송 없음)
 *
 * login-register-visibility-smoke 패턴 참고.
 * viewports: 820 / 1180 / 1280 / 1440 / 1920
 *
 * 실행 예:
 *   cd tests/e2e && npx playwright test tests/auth/forgot-password-phone-visibility-smoke.spec.ts --project=chromium
 */

const VIEWPORTS = [
  { width: 820, height: 900 },
  { width: 1180, height: 900 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1000 }
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`비밀번호 찾기 가시성 (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ context, page }) => {
      await context.clearCookies();
      await page.addInitScript(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore */
        }
      });
    });

    test('/forgot-password: 히어로·폼·탭이 비어 있지 않고 가시', async ({ page }) => {
      await page.goto('/forgot-password');

      const hero = page.locator('.mg-v2-auth-hero-logo').first();
      await expect(hero).toBeVisible();

      const formWrapper = page.locator('.mg-v2-auth-form-wrapper').first();
      await expect(formWrapper).toBeVisible();

      const box = await formWrapper.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThan(80);

      const emailTab = page.getByRole('tab', { name: '이메일' });
      const phoneTab = page.getByRole('tab', { name: '휴대폰' });
      await expect(emailTab).toBeVisible();
      await expect(phoneTab).toBeVisible();

      const emailForm = page.locator('form.mg-v2-auth-form');
      await expect(emailForm).toBeVisible();
      await expect(
        emailForm.getByRole('button', { name: '재설정 링크 전송' })
      ).toBeVisible();

      await phoneTab.click();
      await expect(page.locator('#forgotPhone')).toBeVisible();
      await expect(
        page.getByRole('button', { name: '인증번호 전송' })
      ).toBeVisible();

      const bodyHeight = await page.evaluate(() => {
        const main = document.querySelector('.mg-v2-auth-content');
        return main ? (main as HTMLElement).offsetHeight : 0;
      });
      expect(bodyHeight).toBeGreaterThan(100);
    });
  });
}
