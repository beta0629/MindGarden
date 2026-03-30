// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';

/**
 * 상담사 대시보드 테스트
 */
test.describe('상담사 대시보드', () => {
  test('상담사 로그인 및 대시보드 접근', async ({ page }: { page: Page }) => {
    // 상담사 로그인 (실제 상담사 계정 필요)
    const CONSULTANT_USERNAME = ((process as any).env.CONSULTANT_USERNAME as string) || 'consultant@example.com';
    const CONSULTANT_PASSWORD = ((process as any).env.CONSULTANT_PASSWORD as string) || 'password';
    
    await page.goto('/login');
    await page.fill('input[name="username"], input[type="email"]', CONSULTANT_USERNAME);
    await page.fill('input[name="password"], input[type="password"]', CONSULTANT_PASSWORD);
    await page.click('button[type="submit"], button:has-text("로그인")');
    
    // 상담사 대시보드로 이동 확인
    await page.waitForURL(/consultant|dashboard/, { timeout: 10000 });
    
    // 대시보드 요소 확인
    await expect(page.locator('text=/상담|Consultation|대시보드|Dashboard/i').first()).toBeVisible({ timeout: 5000 });
  });
});

