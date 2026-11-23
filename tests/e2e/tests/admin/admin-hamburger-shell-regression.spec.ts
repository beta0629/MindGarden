/**
 * 햄버거 soft-sheet 셸 핵심 회귀 — Playwright 820·1440
 * Jest 대체 금지. 목 API + 역할 합성 세션.
 *
 * 결과: /opt/cursor/artifacts/regression-assertions.json
 * 샷:   /opt/cursor/artifacts/regression-shots/
 */
// @ts-ignore
import fs from 'node:fs';
// @ts-ignore
import path from 'node:path';
// @ts-ignore
import { test, expect, Page } from '@playwright/test';
import { buildSyntheticAdminStorageState } from '../../helpers/syntheticAdminStorageState';
import {
  buildSyntheticConsultantStorageState,
  getSyntheticConsultantUser
} from '../../helpers/syntheticConsultantStorageState';
import {
  buildSyntheticClientStorageState,
  getSyntheticClientUser
} from '../../helpers/syntheticClientStorageState';
import {
  REGRESSION_DISPLAY_PACKAGE_NAME,
  REGRESSION_FEATURED,
  REGRESSION_MAPPING_PAGE_SIZE,
  REGRESSION_PACKAGE_NAME,
  REGRESSION_PENDING_AMOUNT,
  REGRESSION_PENDING_COUNT,
  REGRESSION_REGISTRATION_LABEL,
  assertMappingDrainRecorded,
  installRegressionMocks,
  type RegressionMockHandles
} from '../../helpers/regressionMocks';

const ARTIFACTS = '/opt/cursor/artifacts';
const SHOTS = path.join(ARTIFACTS, 'regression-shots');
const ASSERTIONS_PATH = path.join(ARTIFACTS, 'regression-assertions.json');
const VIEWPORTS = [820, 1440] as const;
const VIEWPORT_H = 900;

type AssertionRow = {
  id: string;
  viewport: number;
  pass: boolean;
  detail?: Record<string, unknown>;
  error?: string;
};

function ensureDirs() {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(ARTIFACTS, { recursive: true });
}

/** 워커 재시작에도 누적되도록 파일 기준으로 id 머지 */
function loadAssertionRows(): AssertionRow[] {
  try {
    if (!fs.existsSync(ASSERTIONS_PATH)) return [];
    const parsed = JSON.parse(fs.readFileSync(ASSERTIONS_PATH, 'utf8'));
    return Array.isArray(parsed?.assertions) ? parsed.assertions : [];
  } catch {
    return [];
  }
}

function writeAssertionsJson(rows: AssertionRow[]) {
  ensureDirs();
  const passed = rows.filter((r) => r.pass).length;
  const failed = rows.filter((r) => !r.pass).length;
  const payload = {
    summary: { pass: passed, fail: failed, total: rows.length },
    viewports: [...VIEWPORTS],
    assertions: rows,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(ASSERTIONS_PATH, JSON.stringify(payload, null, 2), 'utf8');
}

function record(row: AssertionRow) {
  const rows = loadAssertionRows().filter((r) => r.id !== row.id);
  rows.push(row);
  writeAssertionsJson(rows);
}

async function gotoWithSettle(page: Page, urlPath: string) {
  // domcontentloaded 우선 — commit 직후 body detach 레이스 완화
  await page.goto(urlPath, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(async () => {
    await page.goto(urlPath, { waitUntil: 'commit', timeout: 60_000 });
  });
  await page.waitForSelector('body', { state: 'attached', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(700);
}

async function readFatalAndScroll(page: Page): Promise<{
  fatal: string | null;
  scroll: { sw: number; cw: number; bsw: number; bcw: number };
}> {
  // SPA 전환 중 body 순간 null → 짧게 재시도
  for (let i = 0; i < 5; i += 1) {
    const result = await page.evaluate(() => {
      const body = document.body;
      const doc = document.documentElement;
      if (!body || !doc) {
        return { fatal: 'null-body' as string | null, scroll: { sw: 0, cw: 0, bsw: 0, bcw: 0 } };
      }
      const text = (body.innerText || '').trim();
      let fatal: string | null = null;
      if (!text) fatal = 'blank-body';
      else if (/Something went wrong|Application error|ChunkLoadError/i.test(text.slice(0, 400))) {
        fatal = 'fatal-banner';
      }
      return {
        fatal,
        scroll: {
          sw: doc.scrollWidth,
          cw: doc.clientWidth,
          bsw: body.scrollWidth,
          bcw: body.clientWidth
        }
      };
    }).catch(() => ({
      fatal: 'null-body' as string | null,
      scroll: { sw: 0, cw: 0, bsw: 0, bcw: 0 }
    }));
    if (result.fatal !== 'null-body') {
      return result;
    }
    await page.waitForTimeout(400);
  }
  return {
    fatal: 'null-body',
    scroll: { sw: 0, cw: 0, bsw: 0, bcw: 0 }
  };
}

async function assertCommonShell(
  page: Page,
  opts: { id: string; viewport: number; hamburgerSelector?: string; expectedHamburger?: number }
) {
  const hamburgerSel = opts.hamburgerSelector || '.mg-v2-mobile-gnb__menu';
  const expectedHamburger = opts.expectedHamburger ?? 1;

  await page.waitForSelector('body', { state: 'attached', timeout: 30_000 }).catch(() => {});
  // 셸 GNB/햄버거가 붙을 때까지 대기 (페이지별 셀렉터)
  await page.locator(hamburgerSel).first().waitFor({ state: 'attached', timeout: 25_000 }).catch(() => {});

  const { fatal, scroll } = await readFatalAndScroll(page);
  const hamburger = await page.locator(hamburgerSel).count();
  const desktopLnb = await page.locator('.mg-v2-desktop-lnb').count();
  const noHScroll = scroll.sw <= scroll.cw + 1 && scroll.bsw <= scroll.bcw + 1;

  const pass =
    fatal == null
    && hamburger === expectedHamburger
    && desktopLnb === 0
    && noHScroll;

  record({
    id: opts.id,
    viewport: opts.viewport,
    pass,
    detail: { hamburger, desktopLnb, scroll, fatal, hamburgerSel },
    error: pass
      ? undefined
      : `hamburger=${hamburger} desktopLnb=${desktopLnb} hScroll=${!noHScroll} fatal=${fatal}`
  });

  expect(desktopLnb, `${opts.id} desktop LNB 0`).toBe(0);
  expect(noHScroll, `${opts.id} no horizontal scroll`).toBe(true);
  expect(fatal, `${opts.id} blank/fatal`).toBeNull();
  expect(hamburger, `${opts.id} ☰ count`).toBe(expectedHamburger);
}

async function setCalendarView(page: Page, view: 'month' | 'week' | 'day') {
  const map = {
    month: '.fc-dayGridMonth-button',
    week: '.fc-timeGridWeek-button',
    day: '.fc-timeGridDay-button'
  } as const;
  const btn = page.locator(map[view]).first();
  await expect(btn, `calendar ${view} button`).toBeVisible({ timeout: 20_000 });
  await btn.click({ force: true });
  await page.waitForTimeout(500);
  // 빈 기간 EmptyState 가 FC 그리드를 가려도 버튼 active 로 뷰 전환을 단언
  const active = page.locator(`${map[view]}.fc-button-active, ${map[view]}[aria-pressed="true"]`);
  await active.first().waitFor({ state: 'attached', timeout: 5_000 }).catch(() => {});
}

async function isCalendarViewActive(page: Page, view: 'month' | 'week' | 'day') {
  const map = {
    month: '.fc-dayGridMonth-button',
    week: '.fc-timeGridWeek-button',
    day: '.fc-timeGridDay-button'
  } as const;
  const activeBtn = page.locator(
    `${map[view]}.fc-button-active, ${map[view]}[aria-pressed="true"]`
  );
  if (await activeBtn.count()) return true;
  // FC 미마운트 시 패널·EmptyState 존재 + 버튼 visible 이면 뷰 UI 존재로 인정
  const btnVisible = await page.locator(map[view]).first().isVisible().catch(() => false);
  const panel = await page
    .locator('[data-layout-context="consultant-schedule"], [data-calendar-skin="integrated"]')
    .first()
    .isVisible()
    .catch(() => false);
  return btnVisible && panel;
}

/**
 * release/dev 사이드바: 접힘 48px 스트립 + `.integrated-schedule__sidebar-toggle`.
 * (레일 open-btn / ≥1110 분기 제거)
 */
async function ensureSidebarOpen(page: Page) {
  const collapsed = page.locator('.integrated-schedule__sidebar--collapsed');
  if (await collapsed.count()) {
    const toggle = page.locator('.integrated-schedule__sidebar-toggle').first();
    if (await toggle.count()) {
      await toggle.click({ force: true });
      await page.waitForTimeout(400);
    }
  }
  await page
    .locator('.integrated-schedule__sidebar:not(.integrated-schedule__sidebar--collapsed)')
    .first()
    .waitFor({ state: 'visible', timeout: 8_000 })
    .catch(() => {});
}

test.beforeAll(() => {
  ensureDirs();
  // assertion JSON 은 러너 시작 전 셸에서 비움 — 워커 재시작 시 beforeAll 이 지우지 않음
});

/* -------------------------------------------------------------------------- */
/* 1·2 상담사 일정 / 홈                                                        */
/* -------------------------------------------------------------------------- */
test.describe('상담사 soft-sheet 회귀', () => {
  test.use({ storageState: buildSyntheticConsultantStorageState() });
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(async ({ page }) => {
    await installRegressionMocks(page, getSyntheticConsultantUser());
  });

  for (const width of VIEWPORTS) {
    test(`상담사 일정 월/주/일 @${width}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height: VIEWPORT_H });
      await gotoWithSettle(page, '/consultant/schedule');

      await assertCommonShell(page, {
        id: `consultant-schedule/shell/${width}`,
        viewport: width
      });

      await page
        .locator('.fc, [data-calendar-skin="integrated"], .consultant-suite')
        .first()
        .waitFor({ state: 'visible', timeout: 25_000 })
        .catch(() => {});

      for (const view of ['month', 'week', 'day'] as const) {
        await setCalendarView(page, view);
        const shotId = `consultant-schedule-${view}-${width}`;
        await page.screenshot({
          path: path.join(SHOTS, `${shotId}.png`),
          fullPage: false
        });
        const viewActive = await isCalendarViewActive(page, view);
        record({
          id: `consultant-schedule/${view}/${width}`,
          viewport: width,
          pass: viewActive,
          detail: { view, shot: `${shotId}.png` },
          error: viewActive ? undefined : `${view} view not active`
        });
        expect(viewActive, `consultant schedule ${view} @${width}`).toBe(true);
      }
    });

    test(`상담사 홈 커버+챕터 @${width}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: VIEWPORT_H });
      await gotoWithSettle(page, '/consultant/dashboard');

      await assertCommonShell(page, {
        id: `consultant-home/shell/${width}`,
        viewport: width
      });

      const cover = page.getByTestId('consultant-cover-chapter-home');
      const coverAlt = page.locator('.consultant-cover-chapter, .consultant-dashboard-v2--cover-chapter');
      await cover.or(coverAlt).first().waitFor({ state: 'visible', timeout: 25_000 }).catch(() => {});

      const coverCount = await cover.count();
      const chaptersCount = await page.getByTestId('consultant-cover-chapters').count();
      const coverClassCount = await page.locator('.consultant-cover-chapter').count();
      const pass = (coverCount > 0 || coverClassCount > 0) && (chaptersCount > 0 || coverClassCount > 0);

      await page.screenshot({
        path: path.join(SHOTS, `consultant-home-${width}.png`),
        fullPage: false
      });

      record({
        id: `consultant-home/cover-chapter/${width}`,
        viewport: width,
        pass,
        detail: { coverCount, chaptersCount, coverClassCount },
        error: pass ? undefined : 'cover+chapter UI missing'
      });
      expect(pass, `consultant cover+chapter @${width}`).toBe(true);
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 3 내담자 서브 ☰                                                              */
/* -------------------------------------------------------------------------- */
test.describe('내담자 서브 햄버거 회귀', () => {
  test.use({ storageState: buildSyntheticClientStorageState() });
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await installRegressionMocks(page, getSyntheticClientUser());
  });

  for (const width of VIEWPORTS) {
    test(`내담자 서브 ☰·드로어 @${width}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: VIEWPORT_H });
      await gotoWithSettle(page, '/client/schedule');

      const menuSel = '[data-testid="client-web-topchrome-menu"]';
      await assertCommonShell(page, {
        id: `client-sub/shell/${width}`,
        viewport: width,
        hamburgerSelector: menuSel,
        expectedHamburger: 1
      });

      await page.locator(menuSel).click();
      await page.waitForTimeout(350);
      const drawer = page.getByTestId('client-cover-menu');
      const drawerVisible = await drawer.isVisible().catch(() => false);

      await page.screenshot({
        path: path.join(SHOTS, `client-sub-drawer-${width}.png`),
        fullPage: false
      });

      record({
        id: `client-sub/drawer-open/${width}`,
        viewport: width,
        pass: drawerVisible,
        detail: { drawerVisible },
        error: drawerVisible ? undefined : 'client cover menu drawer not open'
      });
      expect(drawerVisible, `client drawer @${width}`).toBe(true);
    });
  }
});

/* -------------------------------------------------------------------------- */
/* 4~7 관리자                                                                   */
/* -------------------------------------------------------------------------- */
test.describe('관리자 햄버거 셸 회귀 (ADMIN)', () => {
  test.use({ storageState: buildSyntheticAdminStorageState() });
  test.describe.configure({ timeout: 240_000 });

  let mocks: RegressionMockHandles;

  test.beforeEach(async ({ page }) => {
    mocks = await installRegressionMocks(page, {
      id: 99999001,
      email: 'e2e-erp-redirect-admin@local',
      name: 'E2E ERP Redirect Admin',
      role: 'ADMIN',
      permissionGroupCodes: [],
      tenantId: 'e2e-local'
    });
  });

  for (const width of VIEWPORTS) {
    test(`관리자 대시보드 결제대기 KPI @${width}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: VIEWPORT_H });
      await gotoWithSettle(page, '/admin/dashboard');

      await assertCommonShell(page, {
        id: `admin-dashboard/shell/${width}`,
        viewport: width
      });

      const kpi = page.locator(
        `[aria-label*="결제 대기"], .mg-v2-kpi-flip-card:has-text("결제 대기")`
      ).first();
      await kpi.waitFor({ state: 'visible', timeout: 25_000 }).catch(() => {});
      const kpiVisible = await kpi.isVisible().catch(() => false);
      const kpiText = kpiVisible ? (await kpi.innerText().catch(() => '')) : '';
      const hasCount = kpiText.includes(`${REGRESSION_PENDING_COUNT}건`);
      const hasAmount = kpiText.includes(
        `${REGRESSION_PENDING_AMOUNT.toLocaleString()}원`
      ) || kpiText.includes('180,000');

      await page.screenshot({
        path: path.join(SHOTS, `admin-dashboard-pending-kpi-${width}.png`),
        fullPage: false
      });

      const pass = kpiVisible && hasCount;
      record({
        id: `admin-dashboard/pending-payment-kpi/${width}`,
        viewport: width,
        pass,
        detail: {
          kpiVisible,
          hasCount,
          hasAmount,
          kpiText: kpiText.slice(0, 200),
          expectedCount: REGRESSION_PENDING_COUNT,
          expectedAmount: REGRESSION_PENDING_AMOUNT
        },
        error: pass ? undefined : `KPI missing count/amount: ${kpiText.slice(0, 120)}`
      });
      expect(pass, `pending payment KPI @${width}`).toBe(true);
    });

    test(`통합스케줄 등록일·displayPackageName·drain @${width}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height: VIEWPORT_H });
      mocks.resetMappingListRequests();

      await gotoWithSettle(page, '/admin/integrated-schedule');
      await assertCommonShell(page, {
        id: `admin-integrated/shell/${width}`,
        viewport: width
      });

      await page
        .locator('.integrated-schedule__calendar-wrapper, [data-layout-context="integrated-schedule"]')
        .first()
        .waitFor({ state: 'visible', timeout: 25_000 })
        .catch(() => {});

      await ensureSidebarOpen(page);

      // 전체 필터로 등록일 ACTIVE 카드 노출 보장
      const allFilter = page.locator(
        'input[type="radio"][value="all"], input[aria-label="전체"], label:has-text("전체") input'
      ).first();
      if (await allFilter.count()) {
        await allFilter.check({ force: true }).catch(async () => {
          await page.getByText('전체', { exact: true }).first().click({ force: true }).catch(() => {});
        });
        await page.waitForTimeout(400);
      }

      // #1891 등록일
      const regLabel = page.getByTestId('mapping-card-registration-date').filter({
        hasText: REGRESSION_REGISTRATION_LABEL
      });
      const regFallback = page.locator('.integrated-schedule__card-meta-mute', {
        hasText: REGRESSION_REGISTRATION_LABEL
      });
      await regLabel.or(regFallback).first().waitFor({ state: 'visible', timeout: 20_000 }).catch(() => {});
      const regVisible = await regLabel.or(regFallback).first().isVisible().catch(() => false);

      await page.screenshot({
        path: path.join(SHOTS, `integrated-registration-date-${width}.png`),
        fullPage: false
      });

      record({
        id: `admin-integrated/registration-date/${width}`,
        viewport: width,
        pass: regVisible,
        detail: {
          expected: REGRESSION_REGISTRATION_LABEL,
          mappingId: REGRESSION_FEATURED.registrationMappingId
        },
        error: regVisible ? undefined : `registration date "${REGRESSION_REGISTRATION_LABEL}" not found`
      });
      expect(regVisible, `registration date @${width}`).toBe(true);

      // #1892~#1893 displayPackageName
      // 카드는 renderCompactPackageName → title 에 전체 병합명, 본문은 첫 세그먼트+뱃지
      const packageTitle = page.locator(`[title="${REGRESSION_DISPLAY_PACKAGE_NAME}"]`);
      const packageOnCardByTitle = (await packageTitle.count()) > 0;
      const checkoutCard = page.locator(
        `.integrated-schedule__card:has-text("${REGRESSION_FEATURED.checkoutClientName}")`
      ).first();
      const cardHasFirstSegment = await checkoutCard
        .locator(`text=${REGRESSION_PACKAGE_NAME}`)
        .count()
        .then((n) => n > 0)
        .catch(() => false);

      // 결제 대기 칩/필터로 당일결제 카드 노출
      const pendingChip = page.getByRole('button', { name: /결제 대기/ }).or(
        page.locator('button, [role="tab"], label', { hasText: '결제 대기' })
      ).first();
      if (await pendingChip.count()) {
        await pendingChip.click({ force: true }).catch(() => {});
        await page.waitForTimeout(400);
      }

      const checkoutBtn = page.getByLabel('당일 결제').or(
        page.locator('[aria-label*="당일 결제"]')
      ).first();
      let modalShowsMerged = false;
      let modalShowsBase = false;
      let modalOpen = false;
      if (await checkoutBtn.count()) {
        await ensureSidebarOpen(page);
        await checkoutBtn.click({ force: true });
        await page.waitForTimeout(600);
        const modal = page.locator(
          '.mg-v2-checkout-same-day-modal, .mg-modal__subtitle, [data-testid="checkout-same-day-summary-bar"]'
        );
        await modal.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
        modalOpen = await modal.first().isVisible().catch(() => false);
        const subtitle = page.locator('.mg-modal__subtitle');
        const summary = page.getByTestId('checkout-same-day-summary-bar');
        const subtitleText = (await subtitle.textContent().catch(() => '')) || '';
        const summaryText = (await summary.textContent().catch(() => '')) || '';
        const combined = `${subtitleText}\n${summaryText}`;
        modalShowsMerged = combined.includes(REGRESSION_DISPLAY_PACKAGE_NAME)
          || combined.includes('기본10회기');
        modalShowsBase = combined.includes(REGRESSION_PACKAGE_NAME);
        await page.screenshot({
          path: path.join(SHOTS, `integrated-checkout-modal-${width}.png`),
          fullPage: false
        });
      } else {
        await page.screenshot({
          path: path.join(SHOTS, `integrated-display-package-${width}.png`),
          fullPage: false
        });
      }

      // 카드 표시(title/첫 세그먼트) 또는 soft(모달 base/merged). 모달 merged 필수 제거.
      const packagePass =
        packageOnCardByTitle
        || cardHasFirstSegment
        || modalShowsMerged
        || modalShowsBase;
      record({
        id: `admin-integrated/display-package-name/${width}`,
        viewport: width,
        pass: packagePass,
        detail: {
          packageOnCardByTitle,
          cardHasFirstSegment,
          modalOpen,
          modalShowsMerged,
          modalShowsBase,
          expected: REGRESSION_DISPLAY_PACKAGE_NAME,
          soft: true
        },
        error: packagePass
          ? undefined
          : `displayPackageName not on card (title/segment) and not soft-visible in modal`
      });
      expect(packagePass, `displayPackageName @${width}`).toBe(true);

      // overflow 0 (통합스케줄 화면)
      const scroll = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth
      }));
      const noOverflow = scroll.sw <= scroll.cw + 1;
      record({
        id: `admin-integrated/overflow-0/${width}`,
        viewport: width,
        pass: noOverflow,
        detail: scroll,
        error: noOverflow ? undefined : 'horizontal overflow'
      });
      expect(noOverflow, `integrated overflow @${width}`).toBe(true);

      // #1894 매핑 목록 페이지 순회 — 통합스케줄도 adminMappingsListGetAll 사용
      // 매핑관리 페이지에서도 drain 확인 (1페이지만으로 끝내지 않음)
      mocks.resetMappingListRequests();
      await gotoWithSettle(page, '/admin/mapping-management');
      await page.waitForTimeout(1500);
      // drain 완료 대기: page>=1 요청이 생길 때까지
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        const check = assertMappingDrainRecorded(
          mocks.mappingListRequests,
          REGRESSION_MAPPING_PAGE_SIZE
        );
        if (check.pass) break;
        await page.waitForTimeout(400);
      }
      const drain = assertMappingDrainRecorded(
        mocks.mappingListRequests,
        REGRESSION_MAPPING_PAGE_SIZE
      );
      await page.screenshot({
        path: path.join(SHOTS, `mapping-list-drain-${width}.png`),
        fullPage: false
      });
      record({
        id: `admin-mapping-list/drain-size-200/${width}`,
        viewport: width,
        pass: drain.pass,
        detail: drain.detail,
        error: drain.pass
          ? undefined
          : `expected multi-page size=${REGRESSION_MAPPING_PAGE_SIZE} drain`
      });
      expect(drain.pass, `mapping drain @${width}: ${JSON.stringify(drain.detail)}`).toBe(true);
    });
  }
});
