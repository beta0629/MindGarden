/**
 * release/dev(base:3001) vs PR(pr:3000) 사이드바·캘린더 폭 5폭 비교.
 * 결과: /opt/cursor/artifacts/sidebar-calendar-compare.json
 * 샷:   /opt/cursor/artifacts/compare-shots/
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ARTIFACTS = '/opt/cursor/artifacts';
const SHOTS = path.join(ARTIFACTS, 'compare-shots');
const OUT_JSON = path.join(ARTIFACTS, 'sidebar-calendar-compare.json');
const VIEWPORTS = [820, 1024, 1280, 1440, 1920];
const VIEWPORT_H = 900;
const BASE_URL = process.env.COMPARE_BASE_URL || 'http://localhost:3001';
const PR_URL = process.env.COMPARE_PR_URL || 'http://localhost:3000';
const SCHEDULE_PATH = '/admin/integrated-schedule';

const SYNTHETIC_ADMIN = {
  id: 99999001,
  email: 'e2e-erp-redirect-admin@local',
  name: 'E2E ERP Redirect Admin',
  role: 'ADMIN',
  permissionGroupCodes: [],
  tenantId: 'e2e-local'
};

const E2E_ADMIN_LNB_RAW_TREE = [
  { menuName: '대시보드', menuPath: '/admin/dashboard', menuCode: 'ADM_DASHBOARD', children: [] },
  {
    menuName: '통합 스케줄',
    menuPath: '/admin/integrated-schedule',
    menuCode: 'ADM_INTEGRATED_SCHEDULE',
    children: []
  }
];

function log(...args) {
  console.error(new Date().toISOString(), ...args);
}

function corsFor(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  };
}

function jsonOk(data, origin) {
  return {
    status: 200,
    contentType: 'application/json',
    headers: corsFor(origin),
    body: JSON.stringify({ success: true, data })
  };
}

async function installMocks(page, origin) {
  await page.route('**/*fonts.googleapis.com/**', (route) => route.abort());
  await page.route('**/*fonts.gstatic.com/**', (route) => route.abort());
  await page.route('**/*cdn.jsdelivr.net/**', (route) => route.abort());
  await page.route('**/*t1.daumcdn.net/**', (route) => route.abort());
  await page.route('**/*js.tosspayments.com/**', (route) => route.abort());
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsFor(origin) });
      return;
    }
    if (url.includes('/auth/current-user') || url.includes('/auth/session-info')) {
      await route.fulfill(jsonOk(SYNTHETIC_ADMIN, origin));
      return;
    }
    if (url.includes('/menus/lnb')) {
      await route.fulfill(jsonOk(E2E_ADMIN_LNB_RAW_TREE, origin));
      return;
    }
    if (url.includes('/admin/mappings') || url.includes('/schedules')) {
      if (url.includes('/stats')) {
        await route.fulfill(jsonOk({ total: 0, active: 0, pendingPayment: 0 }, origin));
        return;
      }
      await route.fulfill(
        jsonOk(
          {
            mappings: [],
            content: [],
            schedules: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 20,
            last: true
          },
          origin
        )
      );
      return;
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await route.fulfill(jsonOk({}, origin));
      return;
    }
    await route.fulfill(jsonOk([], origin));
  });
}

function buildStorageState(origin) {
  return {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [{ name: 'userInfo', value: JSON.stringify(SYNTHETIC_ADMIN) }]
      }
    ]
  };
}

async function ensureSidebarOpen(page) {
  const collapsed = page.locator('.integrated-schedule__sidebar--collapsed');
  if (await collapsed.count()) {
    const toggle = page.locator('.integrated-schedule__sidebar-toggle').first();
    if (await toggle.count()) {
      await toggle.click({ force: true }).catch(() => {});
      await page.waitForTimeout(350);
    }
  }
  if (await page.locator('.integrated-schedule__sidebar--collapsed').count()) {
    const railBtn = page
      .locator(
        '[data-testid="schedule-sidebar-open"], .integrated-schedule__rail-open, button:has-text("펼치기")'
      )
      .first();
    if (await railBtn.count()) {
      await railBtn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(350);
    }
  }
}

async function setWeekView(page) {
  const btn = page.locator('.fc-timeGridWeek-button').first();
  if (await btn.count()) {
    await btn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

async function measure(page) {
  return page.evaluate(() => {
    const sidebarEl =
      document.querySelector('aside.integrated-schedule__sidebar') ||
      document.querySelector('.integrated-schedule__sidebar');
    const calEl = document.querySelector('.integrated-schedule__calendar-wrapper');
    return {
      sidebar: sidebarEl
        ? Math.round(sidebarEl.getBoundingClientRect().width * 10) / 10
        : null,
      calendar: calEl
        ? Math.round(calEl.getBoundingClientRect().width * 10) / 10
        : null,
      collapsed: !!document.querySelector('.integrated-schedule__sidebar--collapsed'),
      hasRoot: !!document.getElementById('root')?.childElementCount
    };
  });
}

async function shot(page, shotName) {
  // document.fonts 대기 우회: CDP로 캡처
  try {
    await page.evaluate(() => {
      try {
        Object.defineProperty(document, 'fonts', {
          configurable: true,
          get: () => ({ status: 'loaded', ready: Promise.resolve() })
        });
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
  await page
    .screenshot({
      path: path.join(SHOTS, shotName),
      fullPage: false,
      timeout: 8_000,
      animations: 'disabled',
      caret: 'hide'
    })
    .catch((e) => log('screenshot skip', shotName, e.message));
}

async function measureAt(browser, origin, label, width) {
  log('measure start', label, width);
  const context = await browser.newContext({
    viewport: { width, height: VIEWPORT_H },
    storageState: buildStorageState(origin),
    // 외부 리소스 hang 완화
    serviceWorkers: 'block'
  });
  context.setDefaultTimeout(20_000);
  const page = await context.newPage();
  await installMocks(page, origin);
  await page.setExtraHTTPHeaders({ Accept: 'text/html,application/xhtml+xml' });

  await page.goto(`${origin}${SCHEDULE_PATH}`, {
    waitUntil: 'domcontentloaded',
    timeout: 45_000
  });
  // networkidle 금지 — CRA HMR/websocket 때문에 영구 대기 가능
  await page.waitForTimeout(1200);
  await page
    .locator(
      '.integrated-schedule__calendar-wrapper, .integrated-schedule__sidebar, [data-layout-context="integrated-schedule"]'
    )
    .first()
    .waitFor({ state: 'attached', timeout: 25_000 })
    .catch(() => log('schedule selector timeout', label, width));

  await ensureSidebarOpen(page);
  await setWeekView(page);
  await page.waitForTimeout(300);

  const m = await measure(page);
  const shotName = `week-${width}-${label}.png`;
  await shot(page, shotName);
  await context.close();
  log('measure done', label, width, m);
  return { ...m, shot: shotName };
}

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(ARTIFACTS, { recursive: true });

  for (const [label, url] of [
    ['base', BASE_URL],
    ['pr', PR_URL]
  ]) {
    const res = await fetch(url, { headers: { Accept: 'text/html' } }).catch(() => null);
    if (!res || !res.ok) throw new Error(`${label} not ready: ${url}`);
    log('health ok', label, url);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-font-subpixel-positioning']
  });
  const rows = [];
  let sidebarWiderFail = false;

  for (const width of VIEWPORTS) {
    const base = await measureAt(browser, BASE_URL, 'base', width);
    const pr = await measureAt(browser, PR_URL, 'pr', width);
    const prLeBase =
      base.sidebar != null && pr.sidebar != null
        ? pr.sidebar <= base.sidebar + 0.5
        : false;
    const sidebarLe280 = pr.sidebar != null ? pr.sidebar <= 280.5 : false;
    const calGrew =
      base.calendar != null && pr.calendar != null
        ? pr.calendar > base.calendar + 0.5
        : false;
    if (base.sidebar != null && pr.sidebar != null && pr.sidebar > base.sidebar + 0.5) {
      sidebarWiderFail = true;
    }
    rows.push({
      viewport: width,
      sidebar_base: base.sidebar,
      sidebar_pr: pr.sidebar,
      pr_le_base: prLeBase,
      sidebar_le_280: sidebarLe280,
      cal_base: base.calendar,
      cal_pr: pr.calendar,
      cal_grew: calGrew,
      base_collapsed: base.collapsed,
      pr_collapsed: pr.collapsed,
      shots: { base: base.shot, pr: pr.shot }
    });
  }

  await browser.close();

  const payload = {
    headSha: process.env.COMPARE_HEAD_SHA || null,
    baseSha: process.env.COMPARE_BASE_SHA || null,
    baseUrl: BASE_URL,
    prUrl: PR_URL,
    viewports: VIEWPORTS,
    viewportHeight: VIEWPORT_H,
    sidebarWiderFail,
    note:
      '사이드바는 release/dev 380/320 고정 기대. PR이 base보다 넓으면 FAIL(핀 필요). sidebar≤280은 참고 컬럼.',
    rows,
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), 'utf8');
  console.log(JSON.stringify(payload, null, 2));
  if (sidebarWiderFail) {
    console.error('FAIL: PR sidebar wider than release/dev base');
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
