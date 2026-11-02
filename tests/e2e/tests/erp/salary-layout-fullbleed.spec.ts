/**
 * /erp/salary 전폭·햄버거 SSOT 게이트 (5폭 × 3탭).
 *
 * - 820·1180: MobileGnb 햄버거(aria-label=메뉴) 존재
 * - 1280+: Desktop 고정 LNB 허용(햄버거 없음 가능)
 * - 폭비: layout main 대비 [data-testid=salary-management] ≥ 0.95
 *   (main 패딩 + ContentArea 이중 인셋 회귀 방지)
 *
 * 정적 셸은 실제 Desktop/MobileLayout + ContentArea CSS를 로드해
 * 공용 레이아웃 수정이 반영되도록 한다. 로그인·백엔드가 없으면
 * 정적 셸만 단언하고 라이브는 skip 로그.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { loginErpUser, LOCAL_E2E_BACKEND_API_BASE_URL } from '../../helpers/erpAuth';

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const FRONTEND_SRC = path.join(REPO_ROOT, 'frontend/src');
const MENU_ITEMS_JS = path.join(
  FRONTEND_SRC,
  'components/dashboard-v2/constants/menuItems.js'
);
const RESPONSIVE_TOKENS_CSS = path.join(
  FRONTEND_SRC,
  'styles/responsive-layout-tokens.css'
);

const VIEWPORTS = [820, 1180, 1280, 1440, 1920] as const;
const TABS = [
  { key: 'calculations', query: '' },
  { key: 'profiles', query: '?tab=profiles' },
  { key: 'tax', query: '?tab=tax' }
] as const;
const WIDTH_RATIO_MIN = 0.95;
const DESKTOP_BP = 1280;
const LAYOUT_MAIN_SELECTOR =
  'main.mg-v2-desktop-layout__main, main.mg-v2-mobile-layout__main';
const SALARY_BODY_SELECTOR = '[data-testid="salary-management"]';

const readText = (filePath: string) => fs.readFileSync(filePath, 'utf8');
const readCss = (...rel: string[]) =>
  readText(path.join(FRONTEND_SRC, ...rel));

/** 정적 셸: 실제 layout + ContentArea CSS로 이중 인셋 계약을 검증 */
const buildShellHarnessHtml = (width: number) => {
  const isDesktop = width >= DESKTOP_BP;
  const tokens = readCss('styles/tokens/design-v2-tokens.css');
  const responsive = readCss('styles/responsive-layout-tokens.css');
  const desktopLayout = readCss('components/dashboard-v2/templates/DesktopLayout.css');
  const mobileLayout = readCss('components/dashboard-v2/templates/MobileLayout.css');
  const contentArea = readCss('components/dashboard-v2/content/ContentArea.css');

  const harnessExtras = `
* { box-sizing: border-box; }
body { margin: 0; }
.salary-management {
  width: 100%;
  min-width: 0;
  min-height: 12rem;
}
`;

  if (isDesktop) {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
${tokens}
${responsive}
${desktopLayout}
${contentArea}
${harnessExtras}
</style>
</head>
<body>
<div class="mg-v2-desktop-layout" data-testid="admin-shell">
  <div class="mg-v2-desktop-layout__body">
    <aside class="shell-lnb" data-testid="desktop-lnb" style="width:var(--mg-layout-sidebar-width);flex-shrink:0;"></aside>
    <main class="mg-v2-desktop-layout__main" role="main">
      <div class="mg-v2-content-area" role="region" aria-label="대시보드 콘텐츠">
        <div class="salary-management-shell salary-management--clinic-os">
          <div class="salary-management" data-testid="salary-management">급여 본문</div>
        </div>
      </div>
    </main>
  </div>
</div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
${tokens}
${responsive}
${mobileLayout}
${contentArea}
${harnessExtras}
</style>
</head>
<body>
<div class="mg-v2-mobile-layout" data-testid="admin-shell">
  <header data-testid="shell-header">
    <button type="button" class="mg-v2-mobile-gnb__menu" aria-label="메뉴" data-testid="mobile-gnb-menu">☰</button>
    <span>상담사 지급</span>
  </header>
  <main class="mg-v2-mobile-layout__main" role="main">
    <div class="mg-v2-mobile-layout__stage">
      <div class="mg-v2-content-area" role="region" aria-label="대시보드 콘텐츠">
        <div class="salary-management-shell salary-management--clinic-os">
          <div class="salary-management" data-testid="salary-management">급여 본문</div>
        </div>
      </div>
    </div>
  </main>
</div>
</body>
</html>`;
};

async function measureContentWidthRatio(page: Page): Promise<number> {
  return page.evaluate(({ layoutMainSelector, salaryBodySelector }) => {
    const shell = document.querySelector(layoutMainSelector) as HTMLElement | null;
    const body = document.querySelector(salaryBodySelector) as HTMLElement | null;
    if (!shell || !body) {
      return 0;
    }
    const shellWidth = shell.getBoundingClientRect().width;
    const bodyWidth = body.getBoundingClientRect().width;
    if (shellWidth <= 0) {
      return 0;
    }
    return bodyWidth / shellWidth;
  }, {
    layoutMainSelector: LAYOUT_MAIN_SELECTOR,
    salaryBodySelector: SALARY_BODY_SELECTOR
  });
}

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
}

test.describe('급여 /erp/salary 레이아웃 SSOT (정적 셸)', () => {
  test('BREAKPOINT_DESKTOP 는 --mg-breakpoint-desktop(1280) 과 일치', () => {
    const menu = readText(MENU_ITEMS_JS);
    const tokens = readText(RESPONSIVE_TOKENS_CSS);
    expect(tokens).toMatch(/--mg-breakpoint-desktop:\s*1280px/);
    expect(menu).toMatch(/const BREAKPOINT_DESKTOP\s*=\s*1280/);
  });

  test('ContentArea.css 는 layout main 하위 padding:0 계약을 포함한다', () => {
    const contentArea = readCss('components/dashboard-v2/content/ContentArea.css');
    expect(contentArea).toMatch(
      /\.mg-v2-desktop-layout__main\s+\.mg-v2-content-area/s
    );
    expect(contentArea).toMatch(
      /\.mg-v2-mobile-layout__main\s+\.mg-v2-content-area/s
    );
    expect(contentArea).toMatch(/padding:\s*0/);
  });

  for (const width of VIEWPORTS) {
    test(`정적 셸 ${width}px: 햄버거·폭비·가로넘침`, async({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.setContent(buildShellHarnessHtml(width), { waitUntil: 'domcontentloaded' });

      if (width < DESKTOP_BP) {
        await expect(page.getByRole('button', { name: '메뉴' })).toBeVisible();
      } else {
        await expect(page.getByTestId('desktop-lnb')).toBeVisible();
      }

      const ratio = await measureContentWidthRatio(page);
      expect(ratio).toBeGreaterThanOrEqual(WIDTH_RATIO_MIN);
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }
});

test.describe('급여 /erp/salary 라이브 5폭×3탭', () => {
  test.setTimeout(180_000);

  test('LIVE: 5폭×3탭 햄버거·폭비 요약', async({ page }, testInfo) => {
    const summary: string[] = [];
    let backendOk = false;
    try {
      const probe = await page.request.get(`${LOCAL_E2E_BACKEND_API_BASE_URL}/actuator/health`, {
        timeout: 2500
      });
      backendOk = probe.ok();
    } catch {
      backendOk = false;
    }

    if (!backendOk) {
      const msg = 'LOCAL_RESULT Playwright: backend unavailable — static shell PASS; live /erp/salary skipped';
      summary.push(msg);
      console.log(msg);
      testInfo.annotations.push({ type: 'LOCAL_RESULT', description: msg });
      test.skip(true, msg);
      return;
    }

    try {
      await loginErpUser(page, testInfo);
    } catch (err) {
      const msg = `LOCAL_RESULT Playwright: login failed — ${(err as Error).message}`;
      console.log(msg);
      testInfo.annotations.push({ type: 'LOCAL_RESULT', description: msg });
      test.skip(true, msg);
      return;
    }

    for (const width of VIEWPORTS) {
      for (const tab of TABS) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/erp/salary${tab.query}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        const menuBtn = page.getByRole('button', { name: '메뉴' });
        const menuCount = await menuBtn.count();
        if (width < DESKTOP_BP) {
          expect(menuCount).toBeGreaterThan(0);
        }

        const shell = page.locator(LAYOUT_MAIN_SELECTOR).first();
        const body = page.locator(SALARY_BODY_SELECTOR).first();
        const shellBox = await shell.boundingBox();
        const bodyBox = await body.boundingBox().catch(() => null);
        const ratio = shellBox && bodyBox && shellBox.width > 0
          ? bodyBox.width / shellBox.width
          : 0;
        const overflow = await hasHorizontalOverflow(page);
        const line = `${width}x${tab.key}: menu=${menuCount > 0 ? 'Y' : 'N'} ratio=${ratio.toFixed(3)} overflow=${overflow ? 'Y' : 'N'}`;
        summary.push(line);
        expect(ratio).toBeGreaterThanOrEqual(WIDTH_RATIO_MIN);
        expect(overflow).toBe(false);
      }
    }

    const oneLine = `LOCAL_RESULT Playwright: ${summary.join(' | ')}`;
    console.log(oneLine);
    testInfo.annotations.push({ type: 'LOCAL_RESULT', description: oneLine });
  });
});
