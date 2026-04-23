// @ts-ignore - @playwright/test types from devDependency
import { test, expect } from '@playwright/test';

/**
 * 비로그인 `/login`·`/register` — 브랜딩(히어로) 및 Primary 제출 버튼 가시성 스모크
 *
 * landing-home-header.spec.ts와 동일: storage·쿠키 초기화 후 진입.
 *
 * 실행 예:
 *   cd tests/e2e && npx playwright test tests/auth/login-register-visibility-smoke.spec.ts --project=chromium
 *
 * baseURL·webServer: playwright.config.ts (BASE_URL)
 */

test.describe('로그인·회원가입 페이지 버튼 가시성 (비로그인)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

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

  test('/login: 히어로·Primary 로그인 버튼 가시', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('.mg-v2-login-hero-logo').first()).toBeVisible();
    const loginForm = page.locator('form.mg-v2-login-form');
    await expect(loginForm).toBeVisible();
    await expect(
      loginForm.getByRole('button', { name: '로그인' })
    ).toBeVisible();
  });

  test('/register: 히어로·Primary 회원가입 버튼 가시', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('.mg-v2-auth-hero-logo').first()).toBeVisible();
    const regForm = page.locator('form.mg-v2-auth-form');
    await expect(regForm).toBeVisible();
    await expect(
      regForm.getByRole('button', { name: '회원가입' })
    ).toBeVisible();
  });
});
