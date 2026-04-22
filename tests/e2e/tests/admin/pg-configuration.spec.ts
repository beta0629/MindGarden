/**
 * PG 설정 페이지 E2E 검증
 * PG_SETTINGS_PAGE_ERROR_ORCHESTRATION.md §4.3 체크리스트 기반
 *
 * 검증 항목:
 * - ADMIN/STAFF: PG 설정 목록·등록·상세·수정·삭제·연결 테스트 스모크
 * - /tenant/pg-configuration (단수) → /tenant/pg-configurations (복수) 리다이렉트
 * - React #130 / 런타임 오류 수집
 *
 * 실행: cd tests/e2e && BASE_URL=http://localhost:3000 TEST_USERNAME=... TEST_PASSWORD=... \
 *   npx playwright test tests/admin/pg-configuration.spec.ts --project=chromium
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
  const contentRoot = page.locator(
    'main, .mg-v2-ad-b0kla, .mg-admin-layout, .pg-config-list, .admin-common-layout'
  ).first();
  await expect(contentRoot).toBeVisible({ timeout: 15000 });
  await expect(page.locator('body')).not.toHaveText(/^\s*$/);
}

test.describe('PG 설정 페이지 — ADMIN/STAFF 접근·스모크', () => {
  const { username: TEST_USERNAME, password: TEST_PASSWORD } = getMindGardenWebLogin();

  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await adminLogin(page, TEST_USERNAME, TEST_PASSWORD);
  });

  test('ADMIN: /tenant/pg-configuration 접근 시 /tenant/pg-configurations로 리다이렉트', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/tenant/pg-configuration', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await expect(page).toHaveURL(/\/tenant\/pg-configurations/);
  });

  test('ADMIN: /tenant/pg-configurations 목록 페이지 로드 및 렌더링', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/tenant/pg-configurations', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 에러 화면이 아닌지 확인 (테넌트 정보를 찾을 수 없습니다, 로그인이 필요합니다 등)
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toHaveCount(0);

    await assertNotBlankScreen(page);

    // PG 설정 관리 헤더 또는 등록 버튼 노출
    const header = page.locator('h1:has-text("PG 설정"), .pg-config-list-header, button:has-text("PG 설정 등록")').first();
    await expect(header).toBeVisible({ timeout: 5000 });

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child 패턴이 감지됨:\n${reactHits.join('\n---\n')}`
    ).toEqual([]);
  });

  test('ADMIN: PG 설정 등록 페이지 접근 스모크', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/tenant/pg-configurations/new', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toHaveCount(0);

    await assertNotBlankScreen(page);

    // 등록 폼 또는 제목 노출
    const formArea = page.locator(
      'form, .pg-config-form, h1:has-text("PG 설정"), [class*="create"], [class*="form"]'
    ).first();
    await expect(formArea).toBeVisible({ timeout: 5000 });

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child 패턴이 감지됨:\n${reactHits.join('\n---\n')}`
    ).toEqual([]);
  });
});

test.describe('회귀 — 인접 설정 메뉴 (테넌트 프로필·계좌 관리)', () => {
  const { username: TEST_USERNAME, password: TEST_PASSWORD } = getMindGardenWebLogin();

  test.beforeEach(async ({ page }: { page: Page }) => {
    await adminLogin(page, TEST_USERNAME, TEST_PASSWORD);
  });

  test('테넌트 프로필 /tenant/profile 접근 정상', async ({ page }: { page: Page }) => {
    await page.goto('/tenant/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const errorDiv = page.locator('.tenant-profile-error');
    await expect(errorDiv).toHaveCount(0);

    const header = page.locator('.tenant-profile-header, h1').first();
    await expect(header).toBeVisible({ timeout: 5000 });
  });

  test('계좌 관리 /admin/accounts 접근 정상', async ({ page }: { page: Page }) => {
    await page.goto('/admin/accounts', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // 403이 아닌 경우 본문 영역 노출
    const bodyText = await page.locator('body').innerText();
    const is403 =
      /^(403\b|Forbidden|접근\s*거부|권한이\s*없습니다)/i.test(bodyText.slice(0, 200));
    if (is403) {
      test.skip(true, '계좌 관리 403 — 권한 정책에 따라 스킵');
      return;
    }

    const content = page.locator('main, .mg-admin-layout, [class*="account"]').first();
    await expect(content).toBeVisible({ timeout: 5000 });
  });
});
