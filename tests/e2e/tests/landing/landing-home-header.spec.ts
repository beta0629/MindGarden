// @ts-ignore - @playwright/test types from devDependency
import { test, expect } from '@playwright/test';

/**
 * 비로그인 랜딩 `/` — GNB(회원가입·로그인) 가시성 및 투명→불투명 헤더 전환 회귀
 *
 * 실행 예 (chromium만, 시간 절약):
 *   cd tests/e2e && npx playwright test tests/landing/landing-home-header.spec.ts --project=chromium
 *
 * baseURL·webServer: playwright.config.ts (BASE_URL, 로컬 시 npm start)
 * 시각 스냅샷 기준선 없을 때(최초·신규 OS): --update-snapshots
 */

test.describe('비로그인 랜딩 (/) GNB', () => {
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

  test('스크롤 0/80: 로그인·회원가입 버튼 가시, 헤더 variant 전환', async ({ page, browserName }) => {
    await page.goto('/');

    const header = page.locator('header.mg-header').first();
    await expect(header).toBeVisible();

    // scrollY = 0 → Homepage.js: isScrolled = scrollY > 50 → transparent
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(0);
    await expect(header).toHaveClass(/mg-header--transparent/);
    const gnbNav = page.locator('nav.mg-v2-homepage-nav');
    await expect(gnbNav.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(gnbNav.getByRole('button', { name: '회원가입' })).toBeVisible();

    if (browserName === 'chromium') {
      await expect(header).toHaveScreenshot('header-scroll-y0.png', { maxDiffPixelRatio: 0.04 });
    }

    await page.evaluate(() => window.scrollTo(0, 80));
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBe(80);
    await expect(header).toHaveClass(/mg-header--default/);
    await expect(header).not.toHaveClass(/mg-header--transparent/);
    await expect(gnbNav.getByRole('button', { name: '로그인' })).toBeVisible();
    await expect(gnbNav.getByRole('button', { name: '회원가입' })).toBeVisible();

    if (browserName === 'chromium') {
      await expect(header).toHaveScreenshot('header-scroll-y80.png', { maxDiffPixelRatio: 0.04 });
    }
  });
});
