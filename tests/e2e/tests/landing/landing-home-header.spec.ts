// @ts-ignore - @playwright/test types from devDependency
import { test, expect } from '@playwright/test';

/**
 * 비로그인 Public Main `/` — GNB(로그인·시작하기) 가시성 및 스크롤 헤더 전환 회귀
 *
 * 실행 예 (chromium만, 시간 절약):
 *   cd tests/e2e && npx playwright test tests/landing/landing-home-header.spec.ts --project=chromium
 */

test.describe('비로그인 Public Main (/) GNB', () => {
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

  test('스크롤 0/80: 로그인·시작하기 버튼 가시, GNB scrolled 전환', async ({ page, browserName }) => {
    await page.goto('/');

    const gnb = page.locator('header.mg-v2-homepage-gnb').first();
    await expect(gnb).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0);
    await expect(gnb).not.toHaveClass(/mg-v2-homepage-gnb--scrolled/);
    const gnbNav = page.locator('nav.mg-v2-homepage-gnb__actions');
    await expect(gnbNav.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(gnbNav.getByRole('link', { name: '시작하기' })).toBeVisible();

    if (browserName === 'chromium') {
      await expect(gnb).toHaveScreenshot('header-scroll-y0.png', { maxDiffPixelRatio: 0.04 });
    }

    await page.evaluate(() => window.scrollTo(0, 80));
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(80);
    await expect(gnb).toHaveClass(/mg-v2-homepage-gnb--scrolled/);
    await expect(gnbNav.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(gnbNav.getByRole('link', { name: '시작하기' })).toBeVisible();

    if (browserName === 'chromium') {
      await expect(gnb).toHaveScreenshot('header-scroll-y80.png', { maxDiffPixelRatio: 0.04 });
    }
  });
});
