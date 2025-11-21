// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';

/**
 * 인증 테스트
 * 자동으로 로그인하고 세션을 유지합니다
 */
test.describe('인증 테스트', () => {
  const TEST_USERNAME = ((process as any).env.TEST_USERNAME as string) || 'superadmin@mindgarden.com';
  const TEST_PASSWORD = ((process as any).env.TEST_PASSWORD as string) || 'admin123';

  test('관리자 로그인 성공', async ({ page }: { page: Page }) => {
    // 로그인 페이지로 이동
    await page.goto('/login');
    
    // 로그인 폼 자동 입력
    await page.fill('input[name="username"], input[type="email"], input[placeholder*="아이디"], input[placeholder*="이메일"]', TEST_USERNAME);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"], button:has-text("로그인"), button:has-text("Login")');
    
    // 로그인 성공 확인 (대시보드로 리다이렉트 또는 성공 메시지)
    await page.waitForURL(/dashboard|admin|home/, { timeout: 10000 });
    
    // 세션이 유지되는지 확인
    const cookies = await page.context().cookies();
    expect(cookies.length).toBeGreaterThan(0);
  });

  test('로그인 후 사용자 정보 조회', async ({ page }: { page: Page }) => {
    // 로그인
    await page.goto('/login');
    await page.fill('input[name="username"], input[type="email"]', TEST_USERNAME);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"], button:has-text("로그인")');
    await page.waitForURL(/dashboard|admin|home/, { timeout: 10000 });
    
    // 사용자 정보가 표시되는지 확인
    const userInfo = page.locator('text=/관리자|Admin|사용자|User/i').first();
    await expect(userInfo).toBeVisible({ timeout: 5000 });
  });
});

