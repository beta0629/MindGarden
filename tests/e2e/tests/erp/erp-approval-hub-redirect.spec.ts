// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect } from '@playwright/test';
import { loginErpUser } from '../../helpers/erp-login';

/**
 * ERP 승인 허브 — 레거시 경로 리다이렉트 및 admin 모드 본문 노출
 * `/erp/super-approvals` → `/erp/approvals?mode=super` (App.js Navigate)
 */
test.describe('ERP 승인 허브 라우트·리다이렉트', () => {

  test('super-approvals 진입 시 approvals로 리다이렉트되고 mode=super', async ({ page }) => {
    await page.goto('/erp/super-approvals');
    await expect(page).toHaveURL(/\/erp\/approvals(\?|#|$)/);
    const u = new URL(page.url());
    expect(u.searchParams.get('mode')).toBe('super');
  });

  test('approvals?mode=admin 로드 시 승인 허브 레이아웃이 보임', async ({ page }) => {
    await loginErpUser(page);
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
