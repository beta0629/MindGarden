// @ts-ignore - @playwright/test types from devDependency
import { test, expect } from '@playwright/test';

/**
 * 비로그인 `/landing` (CounselingCenterLanding) — 히어로 Primary·문의 섹션 submit 가시성 스모크
 *
 * storage 초기화: login-register-visibility-smoke.spec.ts / landing-home-header.spec.ts 와 동일.
 *
 * 실행 예:
 *   cd tests/e2e && npx playwright test tests/landing/counseling-landing-buttons.spec.ts --project=chromium
 *
 * baseURL·webServer: playwright.config.ts (BASE_URL)
 */

test.describe('상담센터 랜딩 (/landing) CTA', () => {
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

  test('히어로·문의: Primary·submit 버튼 가시', async ({ page }) => {
    await page.goto('/landing');

    const hero = page.locator('section.counseling-hero');
    await expect(hero).toBeVisible();
    await expect(
      hero.getByRole('button', { name: /상담 예약하기/ })
    ).toBeVisible();

    const contact = page.locator('section.counseling-contact');
    await contact.scrollIntoViewIfNeeded();
    await expect(contact).toBeVisible();
    const inquiryForm = contact.locator('form.counseling-contact__form');
    await expect(inquiryForm).toBeVisible();
    await expect(
      inquiryForm.getByRole('button', { name: '문의하기' })
    ).toBeVisible();
  });
});
