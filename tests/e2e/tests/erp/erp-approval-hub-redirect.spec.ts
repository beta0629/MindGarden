// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';

/**
 * ERP 승인 허브 — 레거시 경로 리다이렉트 및 admin 모드 본문 노출
 * `/erp/super-approvals` → `/erp/approvals?mode=super` (App.js Navigate)
 */
test.describe('ERP 승인 허브 라우트·리다이렉트', () => {
  const TEST_USERNAME = ((process as any).env.TEST_USERNAME as string) || 'superadmin@mindgarden.com';
  const TEST_PASSWORD = ((process as any).env.TEST_PASSWORD as string) || 'admin123';

  async function loginErpUser(page: Page) {
    await page.goto('/login');
    await page.fill('input[name="username"], input[type="email"], input[placeholder*="아이디"], input[placeholder*="이메일"]', TEST_USERNAME);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"], button:has-text("로그인"), button:has-text("Login")');
    await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });
  }

  test('super-approvals 진입 시 approvals로 리다이렉트되고 mode=super', async ({ page }) => {
    await page.goto('/erp/super-approvals');
    await expect(page).toHaveURL(/\/erp\/approvals(\?|#|$)/);
    const u = new URL(page.url());
    expect(u.searchParams.get('mode')).toBe('super');
  });

  test('approvals?mode=admin 로드 시 승인 허브 레이아웃이 보임', async ({ page }) => {
    try {
      await loginErpUser(page);
    } catch {
      test.skip(true, '로그인 실패 또는 타임아웃 — TEST_USERNAME·TEST_PASSWORD·백엔드·baseURL 확인');
    }
    await page.goto('/erp/approvals?mode=admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await expect(page).toHaveURL(/\/erp\/approvals/);
    const u = new URL(page.url());
    expect(u.searchParams.get('mode')).toBe('admin');

    const approvalNav = page.locator('nav[aria-label="승인 구역 전환"]');
    await expect(approvalNav).toBeVisible({ timeout: 15000 });

    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible({ timeout: 10000 });
  });
});
