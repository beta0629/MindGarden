/**
 * 마이페이지 스모크: /mypage 리다이렉트, 탭 순회, 공통코드(GENDER) 로드, 보안 모달
 *
 * 로컬 실행 (프론트·백엔드 기동 후):
 *   cd tests/e2e && BASE_URL=http://localhost:3000 TEST_USERNAME=... TEST_PASSWORD=... \
 *     npx playwright test tests/mypage/mypage-smoke.spec.ts --config=playwright.manual.config.ts
 */
// @ts-ignore
import { test, expect, Page } from '@playwright/test';

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

async function loginWithEnv(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill(
    'input[name="username"], input[type="email"], input[placeholder*="아이디"], input[placeholder*="이메일"]',
    username
  );
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("로그인"), button:has-text("Login")');
  await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });
}

test.describe('마이페이지 스모크', () => {
  const username =
    ((process as any).env.TEST_USERNAME as string) || 'superadmin@mindgarden.com';
  const password =
    ((process as any).env.TEST_PASSWORD as string) || 'admin123';

  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginWithEnv(page, username, password);
  });

  test('/mypage 진입 시 역할별 마이페이지로 리다이렉트되고 탭·프로필·보안 모달이 동작한다', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto('/mypage', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(admin|super_admin|consultant|client)\/mypage(\?|$)/, {
      timeout: 15000,
    });

    await expect(page.getByRole('heading', { name: '마이페이지' }).first()).toBeVisible({
      timeout: 15000,
    });

    const tabs = page.getByRole('tab');
    await tabs.filter({ hasText: '프로필 정보' }).click();
    await expect(page.locator('select[name="gender"]')).toBeVisible({ timeout: 15000 });
    const genderOptionCount = await page.locator('select[name="gender"] option').count();
    expect(
      genderOptionCount,
      '성별 select에 옵션이 없으면 공통코드 파싱 실패 또는 로드 실패 가능'
    ).toBeGreaterThan(1);

    await tabs.filter({ hasText: '설정' }).click();
    await expect(page.getByRole('heading', { name: '설정' })).toBeVisible();

    await tabs.filter({ hasText: '보안' }).click();
    await expect(page.getByRole('heading', { name: '보안' })).toBeVisible();

    await tabs.filter({ hasText: '소셜 계정' }).click();
    await expect(
      page.getByRole('heading', { name: '소셜 계정 관리' })
    ).toBeVisible();

    await tabs.filter({ hasText: '개인정보 동의' }).click();
    await expect(
      page.getByRole('heading', { name: '개인정보 동의 관리' })
    ).toBeVisible({ timeout: 15000 });

    await tabs.filter({ hasText: '프로필 정보' }).click();
    await expect(page.locator('select[name="gender"]')).toBeVisible();

    await tabs.filter({ hasText: '보안' }).click();
    await page
      .locator('.security-item')
      .filter({ hasText: '비밀번호 변경' })
      .getByRole('button', { name: '변경' })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: '비밀번호 변경' })).toBeVisible();
    await page.getByRole('button', { name: '닫기' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });

    await page
      .locator('.security-item')
      .filter({ hasText: '비밀번호 찾기' })
      .getByRole('button', { name: '재설정' })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: '비밀번호 찾기' })).toBeVisible();
    await page.getByRole('button', { name: '닫기' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child:\n${reactHits.join('\n---\n')}\n전체:\n${collectedErrors.join('\n')}`
    ).toEqual([]);

    const severe = collectedErrors.filter((line) => !REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      severe,
      `pageerror / console.error:\n${severe.join('\n---\n')}`
    ).toEqual([]);
  });
});
