/**
 * 마이페이지 스모크: /mypage 리다이렉트, 섹션 앵커(탭 없음)·?tab= 스크롤, 편집, 보안 모달
 * (역할 공통 레이아웃: `mypageRoleLayout.js` 섹션 제목·보안 버튼 구조 반영)
 *
 * 로컬 실행 (프론트·백엔드 기동 후):
 *   cd tests/e2e && BASE_URL=http://localhost:3000 TEST_USERNAME=... TEST_PASSWORD=... \
 *     npx playwright test mypage/mypage-smoke.spec.ts --config=playwright.manual.config.ts
 */
// @ts-ignore
import { test, expect, Page } from '@playwright/test';
import { getMindGardenWebLogin } from '../helpers/erpAuth';

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
  const { username, password } = getMindGardenWebLogin();

  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }: { page: Page }) => {
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginWithEnv(page, username, password);
  });

  test('/mypage 진입 시 역할별 마이페이지로 리다이렉트되고 섹션·편집·보안 모달이 동작한다', async ({
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

    // 탭 없음 — 섹션이 한 화면에 앵커로 쌓인다
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: '기본 정보', level: 2 })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('heading', { name: '로그인·보안', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '연결된 계정', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: '개인정보·동의', level: 2 })).toBeVisible({
      timeout: 15000,
    });

    // ?tab= 딥링크는 해당 섹션으로 스크롤
    await page.goto(`${new URL(page.url()).pathname}?tab=security`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#security')).toBeInViewport({ timeout: 15000 });

    await page.getByTestId('mypage-section-basic-edit').click();
    await expect(page.getByRole('button', { name: '사진 선택' })).toBeVisible();
    await expect(page.locator('input[type="file"][accept="image/*"]')).toHaveCount(1);
    await page.getByTestId('mypage-section-basic-cancel').click();

    await page.getByRole('button', { name: '비밀번호 변경' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: '비밀번호 변경' })).toBeVisible();
    await page.getByRole('button', { name: '닫기' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });

    await page.getByRole('button', { name: '비밀번호 찾기' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: '비밀번호 찾기' })).toBeVisible();
    await page.getByRole('button', { name: '닫기' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5000 });

    const unlinkBtn = page.getByRole('button', { name: '연결 해제' });
    if ((await unlinkBtn.count()) > 0) {
      await unlinkBtn.first().click();
      const confirmDialog = page.getByRole('dialog').filter({ hasText: '연결 해제' });
      await expect(confirmDialog).toBeVisible();
      await expect(confirmDialog.getByRole('heading', { name: '연결 해제' })).toBeVisible();
      await confirmDialog.getByRole('button', { name: '취소' }).click();
      await expect(confirmDialog).toHaveCount(0, { timeout: 5000 });
    }

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
