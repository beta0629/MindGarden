// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page, Locator } from '@playwright/test';
import { getMindGardenWebLogin } from '../../helpers/erpAuth';

/**
 * 통합 스케줄(/admin/integrated-schedule) — 캘린더 일정 클릭 시 일정 상세 UnifiedModal 배경이
 * 투명(var 순환 참조 등)으로 깨지지 않는지 검증 (design token 회귀).
 */

const { username: TEST_USERNAME, password: TEST_PASSWORD } = getMindGardenWebLogin();

/** computed background-color가 완전 투명이 아닌지 */
function backgroundHasVisibleFill(cssColor: string): boolean {
  const t = cssColor.trim().toLowerCase();
  if (t === 'transparent') return false;
  if (t === 'rgba(0, 0, 0, 0)' || t === 'rgba(0,0,0,0)') return false;
  const m = /^rgba\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)\s*\)$/.exec(
    t
  );
  if (m) return Number.parseFloat(m[1]) > 0;
  return true;
}

async function adminLogin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="username"], input[type="email"]', TEST_USERNAME);
  await page.fill('input[name="password"], input[type="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"], button:has-text("로그인")');
  await page.waitForURL(/dashboard|admin|home/, { timeout: 15000 });
}

async function assertModalBodyNotTransparent(modal: Locator): Promise<void> {
  const panel = modal.locator('.mg-modal.mg-v2-ad-b0kla').first();
  const body = panel.locator('.mg-modal__body').first();
  await expect(panel).toBeVisible();
  const panelBg = await panel.evaluate(
    (el) => globalThis.getComputedStyle(el).backgroundColor
  );
  const bodyBg = await body.evaluate(
    (el) => globalThis.getComputedStyle(el).backgroundColor
  );
  expect(
    backgroundHasVisibleFill(panelBg) || backgroundHasVisibleFill(bodyBg),
    `모달 루트·바디 배경이 모두 투명입니다 (panel=${panelBg}, body=${bodyBg})`
  ).toBe(true);
}

test.describe('관리자 - 통합 스케줄 일정 상세 모달 배경', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('캘린더 일정 클릭 시 일정 상세 UnifiedModal 바디 배경이 투명이 아니다', async ({
    page,
  }) => {
    await page.goto('/admin/integrated-schedule');
    const calendarHost = page.locator(
      '[data-layout-context="integrated-schedule"]'
    );
    await expect(calendarHost).toBeVisible({ timeout: 20000 });

    const firstEvent = calendarHost.locator('.fc .fc-event').first();
    await firstEvent.waitFor({ state: 'visible', timeout: 25000 }).catch(() => {
      /* handled below */
    });
    if ((await firstEvent.count()) === 0) {
      test.skip(true, '캘린더에 표시된 일정(.fc-event)이 없어 검증을 건너뜁니다.');
    }

    await firstEvent.click();

    const detailModal = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: '일정 상세' }) });
    await expect(detailModal).toBeVisible({ timeout: 10000 });

    await assertModalBodyNotTransparent(detailModal);
  });
});
