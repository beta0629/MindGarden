/**
 * 통합 스케줄 — 레이아웃 마운트 + React #130·invalid child 콘솔 게이트 스모크.
 * 외부(사이드바)→캘린더 드롭 가드는 Jest `scheduleExternalDropGuards`에서 단위 검증한다.
 * FullCalendar+Draggable 실제 드래그는 뷰포트·타이밍에 따라 불안정하여 본 스펙에서는 자동화하지 않는다.
 */
// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect, Page } from '@playwright/test';
import {
  loginErpUser,
  skipWhenCiMissingE2eCredentials,
  skipWhenLocalBackend8080Down
} from '../../helpers/erpAuth';
import {
  REACT_130_OR_INVALID_CHILD,
  attachRuntimeErrorCollectors
} from '../../helpers/react130ConsoleGate';

async function assertIntegratedScheduleShell(page: Page): Promise<void> {
  const calendarHost = page.locator('[data-layout-context="integrated-schedule"]');
  await expect(calendarHost).toBeVisible({ timeout: 20_000 });
  const sidebar = page.locator('aside.integrated-schedule__sidebar');
  await expect(sidebar).toBeVisible({ timeout: 15_000 });
}

test.describe('관리자 - 통합 스케줄 외부 드롭 가드 연관 스모크 (마운트·콘솔)', () => {
  let collectedErrors: string[] = [];

  test.beforeEach(async ({ page }, testInfo) => {
    skipWhenCiMissingE2eCredentials();
    await skipWhenLocalBackend8080Down();
    collectedErrors = [];
    attachRuntimeErrorCollectors(page, collectedErrors);
    await loginErpUser(page, testInfo, { timeoutMs: 25_000 });
  });

  test('/admin/integrated-schedule 진입 시 사이드바·캘린더 호스트가 보이고 React #130이 없다', async ({
    page
  }) => {
    await page.goto('/admin/integrated-schedule', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    await assertIntegratedScheduleShell(page);

    const reactHits = collectedErrors.filter((line) => REACT_130_OR_INVALID_CHILD.test(line));
    expect(
      reactHits,
      `React #130 또는 invalid child 패턴:\n${reactHits.join('\n---\n')}`
    ).toEqual([]);
  });
});
