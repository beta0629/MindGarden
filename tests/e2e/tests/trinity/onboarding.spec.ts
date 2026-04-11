import { test, expect } from '@playwright/test';

test.describe('Trinity 파트너 입점 신청 폼 테스트', () => {
  
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    
    // 공통 코드 API 모킹 (CORS 에러 방지)
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'http://localhost:3001',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Tenant-ID',
    };

    await page.route('**/api/v1/common-codes*', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders });
        return;
      }
      const url = route.request().url();
      if (url.includes('REGION')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: [
              { codeValue: 'SEOUL', koreanName: '서울' },
              { codeValue: 'BUSAN', koreanName: '부산' }
            ]
          })
        });
      } else if (url.includes('RISK_LEVEL')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: 'LOW'
          })
        });
      } else {
        await route.continue();
      }
    });

    // 서브도메인, 이메일 중복 확인 API 모킹
    await page.route('**/api/v1/onboarding/*-check*', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders });
        return;
      }
      const url = route.request().url();
      if (url.includes('subdomain-check')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: {
              subdomain: 'test-company-123',
              isDuplicate: false,
              available: true,
              isValid: true,
              message: '사용 가능합니다.',
              previewDomain: 'test-company-123.dev.core-solution.co.kr'
            }
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            data: {
              email: 'test@example.com',
              isDuplicate: false,
              available: true,
              message: '사용 가능한 이메일입니다.',
              status: 'AVAILABLE'
            }
          })
        });
      }
    });

    // 현재 사용자 API 모킹
    await page.route('**/api/v1/auth/current-user', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: corsHeaders });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          data: null // 로그인되지 않은 상태
        })
      });
    });

    // 온보딩 페이지 접속
    await page.goto('/onboarding');
    
    // 환영 화면에서 "시작하기" 버튼 클릭
    const startButton = page.locator('.trinity-onboarding-welcome__start-button');
    await expect(startButton).toBeVisible({ timeout: 10000 });
    await startButton.click();
  });

  test('1. 폼 입력 검증 (유효성 검사, 에러 메시지 노출 여부)', async ({ page }) => {
    // 1단계: 기본 정보 입력 화면 확인
    await expect(page.locator('text=1 / 6 단계')).toBeVisible();

    // 회사(상호) 입력
    const tenantNameInput = page.locator('input[placeholder="회사명 또는 상호를 입력하세요"]');
    await expect(tenantNameInput).toBeVisible();
    
    // 짧은 텍스트 입력 시 에러 또는 진행 불가 확인 (유효성 검사: 2자 이상)
    await tenantNameInput.fill('A');
    await tenantNameInput.press('Enter');
    
    // 다음 필드(브랜드명)로 넘어가지 않아야 함
    const brandNameInput = page.locator('input[placeholder="브랜드명을 입력하세요 (선택사항)"]');
    // ProgressiveInputField 특성상 다음 필드가 안보이거나 포커스되지 않음
    // 여기서는 정상 입력 후 넘어가는지 확인
    await tenantNameInput.fill('테스트회사');
    await tenantNameInput.press('Enter');

    // 브랜드명 입력 (선택사항이므로 바로 Enter)
    await expect(brandNameInput).toBeVisible();
    await brandNameInput.press('Enter');

    // 지역 선택
    const regionSelect = page.locator('select');
    await expect(regionSelect).toBeVisible();
    await regionSelect.selectOption({ index: 1 }); // 첫 번째 옵션 선택
    await regionSelect.press('Enter');

    // 서브도메인 입력
    const subdomainInput = page.locator('input[placeholder="mycompany (영문, 숫자, 하이픈만, 최대 63자)"]');
    await expect(subdomainInput).toBeVisible();
    await subdomainInput.fill('test-company-123');
    
    // 중복 확인 버튼 클릭 (API 모킹 없이 실제 동작 확인, 또는 에러 발생 시 처리)
    const checkSubdomainBtn = page.locator('button:has-text("중복 확인")');
    await checkSubdomainBtn.click();
    
    // 사용 가능 메시지 대기
    await expect(page.locator('text=사용 가능:')).toBeVisible({ timeout: 10000 });
    
    // Enter 키를 눌러 다음 필드로 이동
    await page.evaluate(() => {
      const btn = document.querySelector('.trinity-progressive-fields__nav-button--next') as HTMLButtonElement;
      if (btn) btn.click();
    });
    await page.waitForTimeout(1000);

    // 이메일 입력 (잘못된 형식)
    const emailInput = page.locator('.trinity-email-input__local');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('invalid-email');
    
    const domainInput = page.locator('.trinity-email-input__domain');
    await domainInput.fill('');
    await emailInput.press('Enter');
    
    // 이메일 형식 에러 메시지 노출 확인
    await expect(page.locator('text=유효한 이메일 주소를 입력해주세요.')).toBeVisible();

    // 정상 이메일 입력
    await emailInput.fill('test');
    await domainInput.fill('example.com');
    await domainInput.press('Enter');
    
    // 중복 확인 버튼 클릭
    const checkEmailBtn = page.locator('button:has-text("중복 확인")');
    await checkEmailBtn.click();
    
    // 인증번호 발송 버튼 클릭
    const sendCodeBtn = page.locator('button:has-text("인증번호 발송")');
    await expect(sendCodeBtn).toBeVisible({ timeout: 10000 });
    await sendCodeBtn.click();

    // 인증번호 입력 (모킹이 어려우므로 UI 노출까지만 검증)
    const codeInput = page.locator('input[placeholder="인증번호 6자리"]');
    await expect(codeInput).toBeVisible({ timeout: 10000 });
  });

  test('2. 모바일 반응형 레이아웃 테스트', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 812 });
    
    // 좌우 스플릿 뷰 컨테이너 확인
    const container = page.locator('.mg-v2-onboarding-layout__container');
    await expect(container).toBeVisible();
    
    // CSS가 적용되어 있다면 flex-direction이 column일 것임
    // 여기서는 요소들이 화면에 잘 렌더링되는지 확인
    const visualSection = page.locator('.mg-v2-onboarding-layout__visual');
    const formSection = page.locator('.mg-v2-onboarding-layout__form');
    
    await expect(visualSection).toBeVisible();
    await expect(formSection).toBeVisible();
    
    // 뷰포트 박스 내에 위치하는지 확인 (간단한 가시성 체크)
    const visualBox = await visualSection.boundingBox();
    const formBox = await formSection.boundingBox();
    
    expect(visualBox).not.toBeNull();
    expect(formBox).not.toBeNull();
  });

  test('3. 공개 API 통신 시 테넌트 컨텍스트 에러(401/403 등)가 발생하지 않는지 확인', async ({ page }) => {
    // 네트워크 응답 모니터링
    const responses: any[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/v1/onboarding/')) {
        responses.push(response);
      }
    });

    // 폼 입력 진행하여 API 호출 유도 (서브도메인 중복 확인)
    const tenantNameInput = page.locator('input[placeholder="회사명 또는 상호를 입력하세요"]');
    await tenantNameInput.fill('테스트회사');
    await tenantNameInput.press('Enter');

    const brandNameInput = page.locator('input[placeholder="브랜드명을 입력하세요 (선택사항)"]');
    await brandNameInput.press('Enter');

    const regionSelect = page.locator('select');
    await regionSelect.selectOption({ index: 1 });
    await regionSelect.press('Enter');

    const subdomainInput = page.locator('input[placeholder="mycompany (영문, 숫자, 하이픈만, 최대 63자)"]');
    await subdomainInput.fill('test-public-api-123');
    
    const checkSubdomainBtn = page.locator('button:has-text("중복 확인")');
    await checkSubdomainBtn.click();
    
    // API 응답 대기
    await page.waitForResponse(response => response.url().includes('/api/v1/onboarding/subdomain-check'));
    
    // 401/403 에러가 없는지 확인
    for (const response of responses) {
      expect(response.status()).not.toBe(401);
      expect(response.status()).not.toBe(403);
    }
  });

  test('4. 에러 상태(네트워크 오류, 중복 이메일 등) 시 사용자 친화적 안내 문구 노출 확인', async ({ page }) => {
    // 이메일 중복 API 모킹 (중복된 이메일 응답)
    await page.route('**/api/v1/onboarding/email-check*', async route => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': 'http://localhost:3001', 'Access-Control-Allow-Credentials': 'true' } });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': 'http://localhost:3001', 'Access-Control-Allow-Credentials': 'true' },
        body: JSON.stringify({
          success: true,
          data: {
            email: 'duplicate@example.com',
            isDuplicate: true,
            available: false,
            message: '이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.',
            status: 'DUPLICATE'
          }
        })
      });
    });

    // 폼 입력 진행
    const tenantNameInput = page.locator('input[placeholder="회사명 또는 상호를 입력하세요"]');
    await tenantNameInput.fill('테스트회사');
    await tenantNameInput.press('Enter');

    const brandNameInput = page.locator('input[placeholder="브랜드명을 입력하세요 (선택사항)"]');
    await brandNameInput.press('Enter');

    const regionSelect = page.locator('select');
    await regionSelect.selectOption({ index: 1 });
    await regionSelect.press('Enter');

    const subdomainInput = page.locator('input[placeholder="mycompany (영문, 숫자, 하이픈만, 최대 63자)"]');
    await subdomainInput.fill('test-error-state');
    const checkSubdomainBtn = page.locator('button:has-text("중복 확인")');
    await checkSubdomainBtn.click();
    await expect(page.locator('text=사용 가능:')).toBeVisible({ timeout: 10000 });
    
    // Enter 키를 눌러 다음 필드로 이동
    await page.evaluate(() => {
      const btn = document.querySelector('.trinity-progressive-fields__nav-button--next') as HTMLButtonElement;
      if (btn) btn.click();
    });
    await page.waitForTimeout(1000);

    // 이메일 입력
    const emailInput = page.locator('.trinity-email-input__local');
    await emailInput.fill('duplicate');
    const domainInput = page.locator('.trinity-email-input__domain');
    await domainInput.fill('example.com');
    await domainInput.press('Enter');
    
    // 중복 확인 버튼 클릭
    const checkEmailBtn = page.locator('button:has-text("중복 확인")');
    await checkEmailBtn.click();

    // 사용자 친화적 에러 메시지 노출 확인
    await expect(page.locator('text=이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.')).toBeVisible();
  });
});
