/**
 * 관리자 햄버거 soft-sheet 셸 · 배정 레일 r3 — 5폭 단언 + 사무원 메뉴 패리티
 * SSOT: /tmp/admin-hamburger-ssot/spec.md
 *
 * API 전부 목. 실데이터 쓰기·문자 발송 없음.
 * 결과: /opt/cursor/artifacts/five-viewport-assertions.json
 *       /opt/cursor/artifacts/staff-menu-diff.json
 * 샷:   /opt/cursor/artifacts/shots/
 */
// @ts-ignore
import fs from 'node:fs';
// @ts-ignore
import path from 'node:path';
// @ts-ignore
import { test, expect, Page } from '@playwright/test';
import { buildSyntheticAdminStorageState } from '../../helpers/syntheticAdminStorageState';
import {
  buildSyntheticStaffStorageState,
  getSyntheticStaffUser
} from '../../helpers/syntheticStaffStorageState';
import {
  E2E_ADMIN_LNB_RAW_TREE,
  installAdminHamburgerShellMocks
} from '../../helpers/adminHamburgerShellMocks';
import {
  expectedStaffDrawerLabelsFromRaw,
  sortedUnique
} from '../../helpers/staffLnbFilterExpected';

const ARTIFACTS = '/opt/cursor/artifacts';
const SHOTS = path.join(ARTIFACTS, 'shots');
const VIEWPORTS = [820, 1024, 1280, 1440, 1920] as const;
const VIEWPORT_H = 900;

const ADMIN_PAGES: Array<{ name: string; path: string }> = [
  { name: '대시보드', path: '/admin/dashboard' },
  { name: '통합스케줄', path: '/admin/integrated-schedule' },
  { name: '사용자관리', path: '/admin/user-management' },
  { name: '배정관리', path: '/admin/mapping-management' },
  { name: '매핑목록', path: '/admin/mapping-management' },
  { name: '결제구독', path: '/admin/billing/subscriptions' },
  { name: '운영재무', path: '/erp/dashboard' },
  { name: '시스템설정', path: '/admin/system-config' }
];

type AssertionRow = {
  id: string;
  viewport?: number;
  path?: string;
  pass: boolean;
  detail?: Record<string, unknown>;
  error?: string;
};

const assertionRows: AssertionRow[] = [];
const calendarWidthRows: Array<{
  viewport: number;
  calendarWidth: number | null;
  bodyWidth: number | null;
  ratio: number | null;
  expected: string;
  pass: boolean;
  error?: string;
}> = [];

function ensureDirs() {
  fs.mkdirSync(SHOTS, { recursive: true });
}

function writeAssertionsJson() {
  ensureDirs();
  const passed = assertionRows.filter((r) => r.pass).length;
  const failed = assertionRows.filter((r) => !r.pass).length;
  const payload = {
    summary: { pass: passed, fail: failed, total: assertionRows.length },
    calendarWidths: calendarWidthRows,
    assertions: assertionRows,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(ARTIFACTS, 'five-viewport-assertions.json'),
    JSON.stringify(payload, null, 2),
    'utf8'
  );
}

function record(row: AssertionRow) {
  assertionRows.push(row);
  writeAssertionsJson();
}

async function gotoWithSettle(page: Page, urlPath: string) {
  // commit: SPA 라우트 전환이 길 때 domcontentloaded 고착을 완화
  await page.goto(urlPath, { waitUntil: 'commit', timeout: 60_000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(500);
}

async function assertShellBasics(page: Page, opts: { id: string; path: string; viewport: number }) {
  const fatal = await page.evaluate(() => {
    const text = (document.body?.innerText || '').trim();
    if (!text) return 'blank-body';
    if (/Something went wrong|Application error|ChunkLoadError/i.test(text.slice(0, 400))) {
      return 'fatal-banner';
    }
    return null;
  });

  const hamburger = await page.locator('.mg-v2-mobile-gnb__menu').count();
  const desktopLnb = await page.locator('.mg-v2-desktop-lnb').count();
  const scroll = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
    bsw: document.body.scrollWidth,
    bcw: document.body.clientWidth
  }));
  const noHScroll =
    scroll.sw <= scroll.cw + 1 && scroll.bsw <= scroll.bcw + 1;

  const pass =
    fatal == null
    && hamburger === 1
    && desktopLnb === 0
    && noHScroll;

  record({
    id: opts.id,
    viewport: opts.viewport,
    path: opts.path,
    pass,
    detail: { hamburger, desktopLnb, scroll, fatal },
    error: pass
      ? undefined
      : `hamburger=${hamburger} desktopLnb=${desktopLnb} hScroll=${!noHScroll} fatal=${fatal}`
  });

  expect(hamburger, `${opts.id} ☰ count`).toBe(1);
  expect(desktopLnb, `${opts.id} desktop LNB`).toBe(0);
  expect(noHScroll, `${opts.id} no horizontal scroll`).toBe(true);
  expect(fatal, `${opts.id} blank/fatal`).toBeNull();
}

/**
 * 달력·본문 폭을 분리 측정.
 * calendar-wrapper 와 stage/data-layout-context 를 동일 요소로 취급하지 않음.
 * 본문 = `.mg-v2-mobile-layout__main` content box, 없으면 viewport−2×clamp.
 */
async function measureCalendar(page: Page) {
  return page.evaluate(() => {
    const cal = document.querySelector(
      '.integrated-schedule__calendar-wrapper'
    ) as HTMLElement | null;

    const main = document.querySelector(
      '.mg-v2-mobile-layout__main'
    ) as HTMLElement | null;

    let bodyWidth: number | null = null;
    if (main) {
      const cs = window.getComputedStyle(main);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      bodyWidth = Math.round((main.clientWidth - padL - padR) * 10) / 10;
    } else {
      const vw = window.innerWidth;
      const padX = Math.min(32, Math.max(16, vw * (1.6667 / 100)));
      bodyWidth = Math.round((vw - 2 * padX) * 10) / 10;
    }

    const calendarWidth = cal
      ? Math.round(cal.getBoundingClientRect().width * 10) / 10
      : null;

    return { calendarWidth, bodyWidth };
  });
}

async function ensureRailCollapsedIfNarrow(page: Page, viewport: number) {
  if (viewport >= 1110) {
    return;
  }
  // <1110 기본 접힘 — 열려 있으면 스크림/ESC로 닫기
  const openBtn = page.locator('.integrated-schedule__rail-open-btn');
  const sidebarDialog = page.locator(
    '.integrated-schedule__sidebar[role="dialog"], aside[role="dialog"]'
  );
  if (await sidebarDialog.count()) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
  // 접힘 상태면 열기 버튼이 보여야 함
  if (await openBtn.count()) {
    // already collapsed path — ok
  }
}

async function setCalendarView(
  page: Page,
  view: 'month' | 'week' | 'day'
) {
  const map = {
    month: '.fc-dayGridMonth-button',
    week: '.fc-timeGridWeek-button',
    day: '.fc-timeGridDay-button'
  } as const;
  const btn = page.locator(map[view]).first();
  if (await btn.count()) {
    await btn.click({ force: true });
    await page.waitForTimeout(600);
  }
}

test.describe('관리자 햄버거 셸 5폭 단언 (ADMIN)', () => {
  test.use({ storageState: buildSyntheticAdminStorageState() });
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(() => {
    ensureDirs();
  });

  test.beforeEach(async ({ page }) => {
    await installAdminHamburgerShellMocks(page, {
      id: 99999001,
      email: 'e2e-erp-redirect-admin@local',
      name: 'E2E ERP Redirect Admin',
      role: 'ADMIN',
      permissionGroupCodes: [],
      tenantId: 'e2e-local'
    });
  });

  for (const width of VIEWPORTS) {
    test(`ADMIN 셸 주요 화면 @${width}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height: VIEWPORT_H });

      // 매핑목록=배정관리 동일 경로 — 중복 방문 제거
      const uniquePages = ADMIN_PAGES.filter(
        (s, idx, arr) => arr.findIndex((x) => x.path === s.path) === idx
      );

      for (const screen of uniquePages) {
        const id = `admin-shell/${screen.name}/${width}`;
        await gotoWithSettle(page, screen.path);
        await assertShellBasics(page, { id, path: screen.path, viewport: width });
      }

      // 통합스케줄 월/주/일 샷
      await gotoWithSettle(page, '/admin/integrated-schedule');
      await page
        .locator('[data-layout-context="integrated-schedule"], .integrated-schedule__calendar-wrapper')
        .first()
        .waitFor({ state: 'visible', timeout: 20_000 })
        .catch(() => {});

      for (const view of ['month', 'week', 'day'] as const) {
        await setCalendarView(page, view);
        await page.screenshot({
          path: path.join(SHOTS, `${view}-${width}.png`),
          fullPage: false
        });
      }

      // 드로어 열림 샷 (관리자) — 대표 폭
      if (width === 1440 || width === 1024 || width === 820) {
        await page.locator('.mg-v2-mobile-gnb__menu').click();
        await page.waitForTimeout(350);
        await expect(page.getByTestId('admin-menu-drawer')).toBeVisible();
        await page.screenshot({
          path: path.join(SHOTS, `drawer-admin-${width}.png`),
          fullPage: false
        });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(250);
      }

      // 레일 닫힘/열림 820·1024
      if (width === 820 || width === 1024) {
        await gotoWithSettle(page, '/admin/integrated-schedule');
        await setCalendarView(page, 'week');
        await ensureRailCollapsedIfNarrow(page, width);
        await page.screenshot({
          path: path.join(SHOTS, `rail-closed-${width}.png`),
          fullPage: false
        });
        const openBtn = page.locator('.integrated-schedule__rail-open-btn');
        if (await openBtn.count()) {
          await openBtn.click();
          await page.waitForTimeout(350);
          await page.screenshot({
            path: path.join(SHOTS, `rail-open-${width}.png`),
            fullPage: false
          });
          await page.keyboard.press('Escape');
        }
      }
    });
  }

  test('통합스케줄 달력 폭 실측 (레일 닫힘 또는 in-flow)', async ({ page }) => {
    /* SSOT r3 달력 폭 ±2px. 본문 폭은 main content box 별도 측정. */
    const expectations: Record<
      number,
      {
        calendar: number;
        body?: number;
        tol: number;
        minRatioWhenClosed?: number;
      }
    > = {
      820: { calendar: 788, body: 788, tol: 2, minRatioWhenClosed: 0.9 },
      1024: { calendar: 989.9, body: 989.9, tol: 2, minRatioWhenClosed: 0.9 },
      1280: { calendar: 965.3, body: 1237.3, tol: 2 },
      1440: { calendar: 1110, body: 1392, tol: 2 },
      1920: { calendar: 1564, body: 1856, tol: 2 }
    };

    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: VIEWPORT_H });
      await gotoWithSettle(page, '/admin/integrated-schedule');
      await page
        .locator('.integrated-schedule__calendar-wrapper')
        .first()
        .waitFor({ state: 'visible', timeout: 20_000 })
        .catch(() => {});
      await ensureRailCollapsedIfNarrow(page, width);
      await page.waitForTimeout(500);

      const measured = await measureCalendar(page);
      const exp = expectations[width];
      let pass = false;
      let error: string | undefined;
      let ratio: number | null = null;
      const railClosed = width < 1110;

      if (measured.calendarWidth == null) {
        error = 'calendar not found';
      } else {
        const calOk =
          Math.abs(measured.calendarWidth - exp.calendar) <= exp.tol;
        if (!calOk) {
          error = `calendar got=${measured.calendarWidth} expected≈${exp.calendar}±${exp.tol}`;
        }

        if (exp.body != null && measured.bodyWidth != null) {
          const bodyOk = Math.abs(measured.bodyWidth - exp.body) <= exp.tol;
          if (!bodyOk) {
            error = [
              error,
              `body got=${measured.bodyWidth} expected≈${exp.body}±${exp.tol}`
            ]
              .filter(Boolean)
              .join('; ');
          }
        }

        if (
          railClosed
          && exp.minRatioWhenClosed != null
          && measured.bodyWidth
          && measured.bodyWidth > 0
        ) {
          ratio = measured.calendarWidth / measured.bodyWidth;
          if (ratio < exp.minRatioWhenClosed) {
            error = [
              error,
              `ratio=${ratio.toFixed(3)} < ${exp.minRatioWhenClosed}`
            ]
              .filter(Boolean)
              .join('; ');
          }
        }

        pass = error == null;
      }

      calendarWidthRows.push({
        viewport: width,
        calendarWidth: measured.calendarWidth,
        bodyWidth: measured.bodyWidth,
        ratio,
        expected: railClosed
          ? `cal≈${exp.calendar}±${exp.tol}, body≈${exp.body}±${exp.tol}, ≥${((exp.minRatioWhenClosed || 0.9) * 100).toFixed(0)}%`
          : `cal≈${exp.calendar}±${exp.tol}, body≈${exp.body}±${exp.tol}`,
        pass,
        error
      });

      record({
        id: `calendar-width/${width}`,
        viewport: width,
        path: '/admin/integrated-schedule',
        pass,
        detail: { ...measured, ratio, expected: exp, railClosed },
        error
      });

      expect(pass, `calendar width @${width}: ${error || 'ok'}`).toBe(true);
    }
  });
});

test.describe('사무원 드로어 메뉴 패리티 (STAFF)', () => {
  test.use({ storageState: buildSyntheticStaffStorageState() });

  test.beforeEach(async ({ page }) => {
    await installAdminHamburgerShellMocks(page, getSyntheticStaffUser());
  });

  test('드로어 항목 vs filterStaffRestrictedLnbItems diff 0', async ({ page }) => {
    ensureDirs();
    await page.setViewportSize({ width: 1440, height: VIEWPORT_H });
    await gotoWithSettle(page, '/admin/dashboard');
    await assertShellBasics(page, {
      id: 'staff-shell/dashboard/1440',
      path: '/admin/dashboard',
      viewport: 1440
    });

    await page.locator('.mg-v2-mobile-gnb__menu').click();
    const drawer = page.getByTestId('admin-menu-drawer');
    await expect(drawer).toBeVisible({ timeout: 10_000 });

    // 그룹 전부 펼침
    const chevrons = drawer.locator('.mg-v2-mobile-lnb-drawer__group-chevron');
    const chevronCount = await chevrons.count();
    for (let i = 0; i < chevronCount; i += 1) {
      const chevron = chevrons.nth(i);
      const expanded = await chevron.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await chevron.click();
        await page.waitForTimeout(150);
      }
    }

    const drawerLabels = sortedUnique(
      await drawer.locator('.mg-v2-nav-link__text, .mg-v2-mobile-lnb-drawer__group-head').evaluateAll(
        (nodes) =>
          nodes
            .map((n) => (n.textContent || '').replace(/\s+/g, ' ').trim())
            .filter(Boolean)
      )
    );

    // SafeText 라벨만 — nav link 텍스트가 더 정확
    const linkLabels = sortedUnique(
      await drawer.locator('.mg-v2-nav-link__text').evaluateAll((nodes) =>
        nodes.map((n) => (n.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean)
      )
    );

    // 동일 입력: RAW LNB → (앱과 같이 shop merge) → filterStaffRestrictedLnbItems
    const expectedLabels = expectedStaffDrawerLabelsFromRaw(E2E_ADMIN_LNB_RAW_TREE as any);

    const actual = linkLabels.length ? linkLabels : drawerLabels;
    const onlyInDrawer = actual.filter((l) => !expectedLabels.includes(l));
    const onlyInExpected = expectedLabels.filter((l) => !actual.includes(l));
    const diffCount = onlyInDrawer.length + onlyInExpected.length;

    const diffPayload = {
      diffCount,
      onlyInDrawer,
      onlyInExpected,
      drawerLabels: actual,
      expectedLabels,
      pass: diffCount === 0
    };
    fs.writeFileSync(
      path.join(ARTIFACTS, 'staff-menu-diff.json'),
      JSON.stringify(diffPayload, null, 2),
      'utf8'
    );

    record({
      id: 'staff-menu-diff',
      viewport: 1440,
      pass: diffCount === 0,
      detail: diffPayload,
      error: diffCount === 0 ? undefined : `diff=${diffCount}`
    });

    await page.screenshot({
      path: path.join(SHOTS, 'drawer-staff-1440.png'),
      fullPage: false
    });

    expect(diffCount, `staff menu diff: ${JSON.stringify(diffPayload)}`).toBe(0);
  });
});
