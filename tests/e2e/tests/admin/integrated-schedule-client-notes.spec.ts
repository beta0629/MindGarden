// @ts-ignore - Playwright 패키지 설치 후 타입 오류 해결됨
import { test, expect } from '@playwright/test';
import { loginErpUser } from '../../helpers/erpAuth';

/**
 * 통합 스케줄 — 내담자 특이사항 (S1·S2·S5 일부 자동화).
 * 캘린더 데이터가 없으면 기존 스펙과 동일하게 skip.
 * 전체 CRUD·새로고침 지속성(S1-6)은 DB 부작용 방지로 `E2E_INTEGRATED_SCHEDULE_NOTES_CRUD=1` 일 때만 시도.
 *
 * 로그인: `loginErpUser` + UNIFIED_LOGIN_IDENTIFIER_SELECTOR (`frontend/src/components/auth/UnifiedLogin.js` name=email 대응).
 */

test.describe('관리자 - 통합 스케줄 내담자 특이사항', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await loginErpUser(page, testInfo, { timeoutMs: 20_000 });
  });

  test('통합 스케줄에서 일정 클릭 시 일정 상세 모달이 열린다', async ({ page }) => {
    await page.goto('/admin/integrated-schedule');
    const calendarHost = page.locator('[data-layout-context="integrated-schedule"]');
    await expect(calendarHost).toBeVisible({ timeout: 20000 });

    const firstEvent = calendarHost.locator('.fc .fc-event').first();
    await firstEvent.waitFor({ state: 'visible', timeout: 25000 }).catch(() => undefined);
    if ((await firstEvent.count()) === 0) {
      test.skip(true, '캘린더에 표시된 일정(.fc-event)이 없어 검증을 건너뜁니다.');
    }

    await firstEvent.click();
    const detailModal = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: '일정 상세' }) });
    await expect(detailModal).toBeVisible({ timeout: 10000 });
  });

  test('특이사항 탭이 있으면 탭 전환 후 등록 폼(제목 필드)이 보인다 — S1 UI 일부', async ({
    page,
  }) => {
    await page.goto('/admin/integrated-schedule');
    const calendarHost = page.locator('[data-layout-context="integrated-schedule"]');
    await expect(calendarHost).toBeVisible({ timeout: 20000 });

    const firstEvent = calendarHost.locator('.fc .fc-event').first();
    await firstEvent.waitFor({ state: 'visible', timeout: 25000 }).catch(() => undefined);
    if ((await firstEvent.count()) === 0) {
      test.skip(true, '캘린더에 표시된 일정이 없어 검증을 건너뜁니다.');
    }

    await firstEvent.click();
    const detailModal = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: '일정 상세' }) });
    await expect(detailModal).toBeVisible({ timeout: 10000 });

    const notesTab = detailModal.getByRole('tab', { name: '특이사항' });
    if ((await notesTab.count()) === 0) {
      test.skip(
        true,
        '첫 일정이 휴가이거나 특이사항 탭 미노출(9절 P2 등) — 다른 일정으로 수동 확인하세요.'
      );
    }

    await notesTab.click();
    await expect(detailModal.locator('#schedule-note-title')).toBeVisible({ timeout: 8000 });
    await expect(detailModal.getByRole('button', { name: '등록' })).toBeVisible();
  });

  test('모달 오픈 직후 브라우저 콘솔 error 타입이 누적되지 않는다 — S5 일부', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/admin/integrated-schedule');
    const calendarHost = page.locator('[data-layout-context="integrated-schedule"]');
    await expect(calendarHost).toBeVisible({ timeout: 20000 });

    const firstEvent = calendarHost.locator('.fc .fc-event').first();
    await firstEvent.waitFor({ state: 'visible', timeout: 25000 }).catch(() => undefined);
    if ((await firstEvent.count()) === 0) {
      test.skip(true, '캘린더에 표시된 일정이 없어 검증을 건너뜁니다.');
    }

    await firstEvent.click();
    const detailModal = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: '일정 상세' }) });
    await expect(detailModal).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);

    expect(
      consoleErrors,
      `콘솔 error: ${consoleErrors.slice(0, 3).join(' | ')}`
    ).toHaveLength(0);
  });

  test('옵션: E2E_INTEGRATED_SCHEDULE_NOTES_CRUD=1 일 때 특이사항 1건 등록 시도', async ({
    page,
  }) => {
    if (process.env.E2E_INTEGRATED_SCHEDULE_NOTES_CRUD !== '1') {
      test.skip(true, 'DB 기록을 남기지 않으려면 E2E_INTEGRATED_SCHEDULE_NOTES_CRUD=1 일 때만 실행.');
    }

    await page.goto('/admin/integrated-schedule');
    const calendarHost = page.locator('[data-layout-context="integrated-schedule"]');
    await expect(calendarHost).toBeVisible({ timeout: 20000 });

    const firstEvent = calendarHost.locator('.fc .fc-event').first();
    await firstEvent.waitFor({ state: 'visible', timeout: 25000 }).catch(() => undefined);
    if ((await firstEvent.count()) === 0) {
      test.skip(true, '캘린더에 표시된 일정이 없습니다.');
    }

    await firstEvent.click();
    const detailModal = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: '일정 상세' }) });
    await expect(detailModal).toBeVisible({ timeout: 10000 });

    const notesTab = detailModal.getByRole('tab', { name: '특이사항' });
    if ((await notesTab.count()) === 0) {
      test.skip(true, '특이사항 탭 없음');
    }
    await notesTab.click();

    const title = `e2e-note-${Date.now()}`;
    await detailModal.locator('#schedule-note-title').fill(title);
    await detailModal.getByRole('button', { name: '등록' }).click();
    await expect(detailModal.getByText(title, { exact: false }).first()).toBeVisible({
      timeout: 15000,
    });
  });
});
