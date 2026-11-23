/**
 * SCT 관리자 탭·상담사 패널 — 7폭 초안 (API mock 허용)
 *
 * 로그인·실데이터 의존 구간은 annotation 후 셸·라우트만 검증할 수 있다.
 * core-tester가 mock 확장·실행을 이어간다.
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { test, expect, Page } from '@playwright/test';
import { getMindGardenWebLogin } from '../../helpers/erpAuth';
import {
  SCT_VIEWPORTS,
  assertNoHorizontalOverflow,
  mockSctPublicApis
} from './sct-viewport-helper';

async function tryAdminLogin(page: Page): Promise<boolean> {
  const { username, password } = getMindGardenWebLogin();
  if (!username || !password) {
    return false;
  }
  await page.goto('/login');
  await page.fill('input[name="username"], input[name="email"], input[type="email"]', username);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("로그인")');
  try {
    await page.waitForURL(/dashboard|admin|home|consultant/i, { timeout: 20000 });
    return true;
  } catch {
    return false;
  }
}

test.describe('SCT 관리자·상담사 7폭 (초안)', () => {
  for (const vp of SCT_VIEWPORTS) {
    test(`관리자 사용자관리 + SCT mock ${vp.name}`, async({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await mockSctPublicApis(page);
      const loggedIn = await tryAdminLogin(page);
      if (!loggedIn) {
        test.info().annotations.push({
          type: 'note',
          description: '로그인 불가 — 공개 SCT 셸만 overflow 검사'
        });
        await page.goto('/public/sct/e2e-mock-token', { waitUntil: 'domcontentloaded' });
        await expect(page.getByTestId('sct-public-app')).toBeVisible({ timeout: 15000 });
        await assertNoHorizontalOverflow(page);
        return;
      }
      await page.goto('/admin/user-management?type=client', { waitUntil: 'domcontentloaded' });
      await assertNoHorizontalOverflow(page);
    });
  }

  test('상담사 세션 패널 CSS 클래스 계약(페이지 로드 시)', async({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockSctPublicApis(page);
    const loggedIn = await tryAdminLogin(page);
    test.skip(!loggedIn, '로그인 자격 없음 — 상담사 패널 UI는 Jest 스모크로 커버');
    await page.goto('/consultant/dashboard', { waitUntil: 'domcontentloaded' });
    await assertNoHorizontalOverflow(page);
  });
});
