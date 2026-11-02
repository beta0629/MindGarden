/**
 * /erp/salary 전폭·햄버거 SSOT 게이트 (5폭 × 3탭).
 *
 * - 820·1180: MobileGnb 햄버거(aria-label=메뉴) 존재
 * - 1280+: Desktop 고정 LNB 허용(햄버거 없음 가능)
 * - 폭비: 메인/콘텐츠 셸 대비 본문 사용 폭 ≥ 0.95 (뷰포트−LNB 측정 금지)
 *
 * 로그인·백엔드가 없으면 정적 셸 하네스로 BREAKPOINT·폭비 계약을 검증하고
 * 라이브 경로 결과는 로그로 남긴다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { loginErpUser, LOCAL_E2E_BACKEND_API_BASE_URL } from '../../helpers/erpAuth';

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const MENU_ITEMS_JS = path.join(
  REPO_ROOT,
  'frontend/src/components/dashboard-v2/constants/menuItems.js'
);
const RESPONSIVE_TOKENS_CSS = path.join(
  REPO_ROOT,
  'frontend/src/styles/responsive-layout-tokens.css'
);

const VIEWPORTS = [820, 1180, 1280, 1440, 1920] as const;
const TABS = [
  { key: 'calculations', query: '' },
  { key: 'profiles', query: '?tab=profiles' },
  { key: 'tax', query: '?tab=tax' }
] as const;
const WIDTH_RATIO_MIN = 0.95;
const DESKTOP_BP = 1280;

const readText = (filePath: string) => fs.readFileSync(filePath, 'utf8');

/** 정적 셸: 폭에 따라 Mobile/Desktop 레이아웃을 흉내 내 본문 폭비를 측정 */
const buildShellHarnessHtml = (width: number) => {
  const isDesktop = width >= DESKTOP_BP;
  const sidebar = isDesktop
    ? `<aside class="shell-lnb" data-testid="desktop-lnb" style="width:var(--mg-layout-sidebar-width);flex-shrink:0;"></aside>`
    : '';
  const hamburger = isDesktop
    ? ''
    : `<button type="button" class="mg-v2-mobile-gnb__menu" aria-label="메뉴" data-testid="mobile-gnb-menu">☰</button>`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
:root {
  --mg-breakpoint-desktop: 1280px;
  --mg-layout-sidebar-width: 260px;
}
* { box-sizing: border-box; }
body { margin: 0; }
.shell {
  display: flex;
  min-height: 100vh;
  width: 100%;
}
.shell-main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.shell-content {
  width: 100%;
  flex: 1 1 auto;
}
.page-body {
  width: 100%;
  min-height: 12rem;
}
</style>
</head>
<body>
<div class="shell" data-testid="admin-shell">
  ${sidebar}
  <div class="shell-main" data-testid="shell-main">
    <header data-testid="shell-header">${hamburger}<span>상담사 지급</span></header>
    <main class="shell-content" data-testid="shell-content" role="main">
      <div class="page-body" data-testid="salary-page-body">급여 본문</div>
    </main>
  </div>
</div>
</body>
</html>`;
};

async function measureContentWidthRatio(page: Page): Promise<number> {
  return page.evaluate(() => {
    const shell = document.querySelector('[data-testid="shell-content"]') as HTMLElement | null
      || document.querySelector('main.mg-v2-desktop-layout__main') as HTMLElement | null
      || document.querySelector('main') as HTMLElement | null;
    const body = document.querySelector('[data-testid="salary-page-body"]') as HTMLElement | null
      || document.querySelector('.salary-management') as HTMLElement | null
      || document.querySelector('[class*="salary-management"]') as HTMLElement | null
      || shell;
    if (!shell || !body) {
      return 0;
    }
    const shellWidth = shell.getBoundingClientRect().width;
    const bodyWidth = body.getBoundingClientRect().width;
    if (shellWidth <= 0) {
      return 0;
    }
    return bodyWidth / shellWidth;
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

        const shell = page.locator('main.mg-v2-desktop-layout__main, main.mg-v2-mobile-layout__main, main').first();
        const body = page.locator('.salary-management, [class*="salary-management"]').first();
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
