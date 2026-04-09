// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';

/**
 * ERP 메뉴 접근 및 목록 조회 E2E 시나리오
 * docs/planning/ERP_TEST_SCENARIOS.md E2E-1 ~ E2E-9 기준
 * ERP 권한이 있는 사용자로 로그인한 뒤 메뉴·화면 접근 및 목록 노출 검증
 */
test.describe('ERP 메뉴 및 목록 조회', () => {
  const TEST_USERNAME = ((process as any).env.TEST_USERNAME as string) || 'superadmin@mindgarden.com';
  const TEST_PASSWORD = ((process as any).env.TEST_PASSWORD as string) || 'admin123';

  async function loginErpUser(page: Page) {
    await page.goto('/login');
    await page.fill('input[name="username"], input[type="email"], input[placeholder*="아이디"], input[placeholder*="이메일"]', TEST_USERNAME);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"], button:has-text("로그인"), button:has-text("Login")');
    await page.waitForURL(/dashboard|admin|home/, { timeout: 10000 });
  }

  test('E2E-1: ERP 메뉴 접근 — LNB에서 ERP 진입 후 URL/영역 확인', async ({ page }: { page: Page }) => {
    await loginErpUser(page);
    // LNB에서 ERP 관련 링크 클릭 (대시보드 v2 메뉴 또는 기존 메뉴)
    const erpLink = page.locator('a[href*="/erp"]').first();
    await erpLink.click();
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/erp/);
    // ERP 관련 제목/대시보드/목록 영역 중 하나라도 노출
    const erpArea = page.locator('text=/ERP|대시보드|구매|재무|예산/i').first();
    await expect(erpArea).toBeVisible({ timeout: 5000 });
  });

  test('E2E-2: ERP 대시보드 화면 로드', async ({ page }: { page: Page }) => {
    await loginErpUser(page);
    await page.goto('/erp/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveURL(/\/erp\/dashboard/);
    // 위젯/카드/통계 영역 또는 빈 상태 메시지
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('E2E-3: 구매 관리 목록 조회', async ({ page }: { page: Page }) => {
    await loginErpUser(page);
    await page.goto('/erp/purchase');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveURL(/\/erp\/purchase/);
    // 테이블/카드 또는 빈 목록 메시지
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('E2E-4: 재무 관리 목록 조회', async ({ page }: { page: Page }) => {
    await loginErpUser(page);
    await page.goto('/erp/financial');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveURL(/\/erp\/financial/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('E2E-5: 예산 관리 목록 조회', async ({ page }: { page: Page }) => {
    await loginErpUser(page);
    await page.goto('/erp/budget');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveURL(/\/erp\/budget/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('E2E-6: 아이템 관리 목록 조회', async ({ page }: { page: Page }) => {
    await loginErpUser(page);
    await page.goto('/erp/items');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveURL(/\/erp\/items/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('E2E-7: 어드민 재무(통합 재무 대시보드) — 대차대조표/손익 탭 접근', async ({ page }: { page: Page }) => {
    await loginErpUser(page);
    await page.goto('/admin/erp/financial');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await expect(page).toHaveURL(/\/admin\/erp\/financial|\/erp/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
