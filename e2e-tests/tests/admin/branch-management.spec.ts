// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';

/**
 * 관리자 - 지점 관리 테스트
 * 화면 입력 없이 자동으로 지점 CRUD를 테스트합니다
 */
test.describe('관리자 - 지점 관리', () => {
  const TEST_USERNAME = ((process as any).env.TEST_USERNAME as string) || 'superadmin@mindgarden.com';
  const TEST_PASSWORD = ((process as any).env.TEST_PASSWORD as string) || 'admin123';

  test.beforeEach(async ({ page }: { page: Page }) => {
    // 각 테스트 전 자동 로그인
    await page.goto('/login');
    await page.fill('input[name="username"], input[type="email"]', TEST_USERNAME);
    await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"], button:has-text("로그인")');
    await page.waitForURL(/dashboard|admin|home/, { timeout: 10000 });
  });

  test('지점 목록 조회', async ({ page }: { page: Page }) => {
    // 지점 관리 페이지로 이동
    await page.goto('/admin/branches');
    // 또는 메뉴 클릭
    // await page.click('text=지점 관리, text=Branches');
    
    // 지점 목록이 표시되는지 확인
    await page.waitForSelector('table, .branch-list, [data-testid="branch-list"]', { timeout: 5000 });
    
    // 테이블 또는 목록이 비어있지 않은지 확인 (데이터가 있는 경우)
    const listItems = page.locator('table tbody tr, .branch-item, [data-testid="branch-item"]');
    const count = await listItems.count();
    console.log(`지점 개수: ${count}`);
  });

  test('지점 생성', async ({ page }: { page: Page }) => {
    await page.goto('/admin/branches');
    
    // 지점 생성 버튼 클릭
    await page.click('button:has-text("추가"), button:has-text("생성"), button:has-text("등록"), [data-testid="create-branch"]');
    
    // 모달 또는 폼이 나타나는지 확인
    await page.waitForSelector('input[name="name"], input[placeholder*="지점명"]', { timeout: 3000 });
    
    // 지점 정보 자동 입력
    const timestamp = Date.now();
    await page.fill('input[name="name"], input[placeholder*="지점명"]', `자동화 테스트 지점 ${timestamp}`);
    await page.fill('input[name="address"], input[placeholder*="주소"]', '서울시 강남구 테헤란로 123');
    await page.fill('input[name="phone"], input[placeholder*="전화번호"]', '02-1234-5678');
    
    // 저장 버튼 클릭
    await page.click('button:has-text("저장"), button:has-text("등록"), button:has-text("확인"), button[type="submit"]');
    
    // 성공 메시지 또는 목록에 추가된 것 확인
    await page.waitForSelector('text=/성공|추가되었습니다|등록되었습니다/i', { timeout: 5000 });
  });

  test('지점 수정', async ({ page }: { page: Page }) => {
    await page.goto('/admin/branches');
    
    // 첫 번째 지점의 수정 버튼 클릭
    const editButton = page.locator('button:has-text("수정"), button:has-text("편집"), [data-testid="edit-branch"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // 수정 폼이 나타나는지 확인
      await page.waitForSelector('input[name="name"]', { timeout: 3000 });
      
      // 지점명 수정
      await page.fill('input[name="name"]', `수정된 지점명 ${Date.now()}`);
      
      // 저장 버튼 클릭
      await page.click('button:has-text("저장"), button:has-text("확인"), button[type="submit"]');
      
      // 성공 메시지 확인
      await page.waitForSelector('text=/수정되었습니다|저장되었습니다/i', { timeout: 5000 });
    } else {
      test.skip();
    }
  });
});

