/**
 * 테넌트 프로필 페이지 E2E 검증
 * TENANT_PROFILE_ACCESS_ERROR_ORCHESTRATION.md §4.3 체크리스트 기반
 *
 * 검증 항목:
 * - ADMIN/STAFF: 테넌트 프로필 접근, 개요·구독 관리·결제 수단 탭 스모크
 * - React #130 / 런타임 오류 수집
 * - billing 연동(SubscriptionManagement, PaymentMethodRegistration) 탭 진입 시 콘솔 오류 없음
 *
 * 실행: cd tests/e2e && BASE_URL=http://localhost:3000 TEST_USERNAME=... TEST_PASSWORD=... \
 *   npx playwright test tests/admin/tenant-profile.spec.ts --project=chromium
 * (ADMIN 계정 권장 — 표시명 변경 E2E는 PUT /api/v1/tenants/{id}/name 및 tenant-profile-rename-* testid 사용)
 * STAFF 비표시 검증: TEST_STAFF_USERNAME·TEST_STAFF_PASSWORD 가 둘 다 있을 때만 실행
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import { getMindGardenWebLogin } from '../../helpers/erpAuth';

const REACT_130_OR_INVALID_CHILD =
  /Minified React error #130|Objects are not valid as a React child|invariant=130/i;

function attachRuntimeErrorCollectors(page: Page, bucket: string[]) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      bucket.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    const stack = err.stack ? '\n' + err.stack : '';
    bucket.push('[pageerror] ' + err.message + stack);
  });
}

async function adminLogin(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="username"], input[type="email"]', username);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("로그인")');
  await page.waitForURL(/dashboard|admin|home/, { timeout: 10000 });
}

async function assertNotBlankScreen(page: Page) {
  const contentRoot = page.locator('main, .mg-v2-ad-b0kla, .mg-admin-layout, .tenant-profile').first();
  await expect(contentRoot).toBeVisible({ timeout: 15000 });
  await expect(page.locator('body')).not.toHaveText(/^\s*$/);
}

test.describe('테넌트 프로필 페이지 — ADMIN/STAFF 접근·탭 스모크', () => {
  const { username: TEST_USERNAME, password: TEST_PASSWORD } = getMindGardenWebLogin();

  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await adminLogin(page, TEST_USERNAME, TEST_PASSWORD);
  });

  test('ADMIN: /tenant/profile 접근 시 페이지 로드 및 개요 탭 렌더링', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/tenant/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 에러 화면이 아닌지 확인 (테넌트 정보를 찾을 수 없습니다 등)
    const errorDiv = page.locator('.tenant-profile-error');
    await expect(errorDiv).toHaveCount(0);

    await assertNotBlankScreen(page);

    // 개요 탭 기본 컨텐츠
    const header = page.locator('.tenant-profile-header, h1').first();
    await expect(header).toBeVisible({ timeout: 5000 });

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child 패턴이 감지됨:\n${reactHits.join('\n---\n')}`
    ).toEqual([]);
  });

  test('ADMIN: 개요·구독 관리·결제 수단 탭 전환 스모크', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/tenant/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const errorDiv = page.locator('.tenant-profile-error');
    await expect(errorDiv).toHaveCount(0);

    // 개요 탭 (기본)
    await expect(page.locator('.tenant-profile-overview, .tenant-profile-content')).toBeVisible({
      timeout: 5000,
    });

    // 구독 관리 탭 클릭
    await page.click('button:has-text("구독 관리")');
    await page.waitForTimeout(1000);
    const subSection = page.locator('.tenant-profile-subscription, [class*="subscription"]').first();
    await expect(subSection).toBeVisible({ timeout: 5000 });

    // 결제 수단 탭 클릭
    await page.click('button:has-text("결제 수단")');
    await page.waitForTimeout(1000);
    const paymentSection = page.locator('.tenant-profile-payment, [class*="payment"]').first();
    await expect(paymentSection).toBeVisible({ timeout: 5000 });

    // billing 연동 영역 노출 확인 (SubscriptionManagement, PaymentMethodRegistration)
    const paymentHeader = page.locator('text=/결제 수단|구독|등록된/i').first();
    await expect(paymentHeader).toBeVisible({ timeout: 3000 });

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `탭 전환 후 React #130 또는 invalid child 패턴이 감지됨:\n${reactHits.join('\n---\n')}`
    ).toEqual([]);
  });

  test('ADMIN: 테넌트 표시명 변경 모달 → PUT name 200', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/tenant/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const errorDiv = page.locator('.tenant-profile-error');
    await expect(errorDiv).toHaveCount(0);

    const openBtn = page.getByTestId('tenant-profile-rename-open');
    await expect(openBtn).toBeVisible({ timeout: 15000 });
    await openBtn.click();

    const uniqueName = `E2E Rename ${Date.now()}`;
    const input = page.getByTestId('tenant-profile-rename-input');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill(uniqueName);

    const renameResponse = page.waitForResponse(
      (res) =>
        res.request().method() === 'PUT' &&
        res.url().includes('/api/v1/tenants/') &&
        res.url().includes('/name') &&
        res.status() === 200
    );
    await page.getByTestId('tenant-profile-rename-save').click();
    await renameResponse;

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `표시명 저장 후 React #130 또는 invalid child 패턴이 감지됨:\n${reactHits.join('\n---\n')}`
    ).toEqual([]);
  });
});

test.describe('테넌트 프로필 — STAFF (이름 변경 UI 비표시)', () => {
  test('STAFF: /tenant/profile 에서 표시명 변경 진입 버튼 미노출', async ({
    page,
  }: {
    page: Page;
  }) => {
    const staffUser = ((process as any).env.TEST_STAFF_USERNAME as string) || '';
    const staffPass = ((process as any).env.TEST_STAFF_PASSWORD as string) || '';
    test.skip(
      !staffUser || !staffPass,
      'TEST_STAFF_USERNAME·TEST_STAFF_PASSWORD가 모두 설정된 경우에만 실행'
    );

    const staffErrors: string[] = [];
    attachRuntimeErrorCollectors(page, staffErrors);

    await adminLogin(page, staffUser, staffPass);
    await page.goto('/tenant/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const renameOpen = page.getByTestId('tenant-profile-rename-open');
    await expect(renameOpen).not.toBeVisible({ timeout: 10000 });

    const reactHits = staffErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `STAFF 프로필에서 React #130 또는 invalid child 패턴이 감지됨:\n${reactHits.join('\n---\n')}`
    ).toEqual([]);
  });
});
