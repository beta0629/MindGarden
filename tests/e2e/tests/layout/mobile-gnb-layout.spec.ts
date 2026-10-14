/**
 * MobileGnb 4폭 레이아웃 게이트 (로그인 불필요).
 * page.setContent + 빌드된 토큰/컴포넌트 CSS로 실제 Chromium getBoundingClientRect·elementFromPoint 검사.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const FRONTEND_SRC = path.join(REPO_ROOT, 'frontend/src');

const VIEWPORTS = [360, 375, 390, 414] as const;
const EDGE_PAD_MIN_PX = 12;
const CENTER_TOLERANCE_PX = 2;

const readCss = (...rel: string[]) =>
  fs.readFileSync(path.join(FRONTEND_SRC, ...rel), 'utf8');

/** 프로덕션 클래스·토큰만 쓰는 정적 하네스 (React/로그인 불필요) */
const buildHarnessHtml = () => {
  const tokens = readCss('styles/tokens/design-v2-tokens.css');
  const gnb = readCss('components/dashboard-v2/organisms/MobileGnb.css');
  const chip = readCss('components/dashboard-v2/atoms/CurrentTimeChip.css');
  const navIcon = readCss('components/dashboard-v2/atoms/NavIcon.css');
  const profileAvatar = readCss('components/dashboard-v2/atoms/ProfileAvatar.css');
  const tenantCluster = readCss('components/dashboard-v2/molecules/TenantHeaderCluster.css');
  const harnessExtras = `
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Noto Sans KR', sans-serif; }
    .mg-v2-mobile-gnb__logo-img {
      width: 2.75rem;
      height: 2.75rem;
      background: var(--mg-v2-color-neutral-300);
    }
    .mg-v2-notification-trigger-wrapper { display: inline-flex; flex-shrink: 0; }
  `;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
${tokens}
${navIcon}
${profileAvatar}
${tenantCluster}
${chip}
${gnb}
${harnessExtras}
</style>
</head>
<body>
<header class="mg-v2-mobile-gnb" role="banner" data-testid="mobile-gnb">
  <div class="mg-v2-mobile-gnb__left">
    <button type="button" class="mg-v2-nav-icon mg-v2-mobile-gnb__menu" aria-label="메뉴" data-testid="mobile-gnb-menu">
      <span class="mg-v2-nav-icon__lucide" aria-hidden="true">☰</span>
    </button>
    <a href="/" class="mg-v2-mobile-gnb__logo" data-testid="mobile-gnb-logo">
      <span class="mg-v2-mobile-gnb__logo-img" aria-hidden="true"></span>
      <span class="mg-v2-mobile-gnb__brand-name">센터브랜드</span>
    </a>
  </div>
  <div class="mg-v2-mobile-gnb__center">
    <time class="mg-v2-current-time-chip" data-testid="mobile-gnb-clock" aria-label="3월 14일 (토) 오후 12:42" title="KST">
      <span class="mg-v2-current-time-chip__icon" aria-hidden="true">
        <svg class="mg-v2-current-time-chip__lucide" viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      </span>
      <span class="mg-v2-current-time-chip__text">
        <span class="mg-v2-current-time-chip__label mg-v2-current-time-chip__label--full">3월 14일 (토) 오후 12:42</span>
        <span class="mg-v2-current-time-chip__label mg-v2-current-time-chip__label--medium">3/14 (토) 오후 12:42</span>
        <span class="mg-v2-current-time-chip__label mg-v2-current-time-chip__label--compact">오후 12:42</span>
      </span>
    </time>
  </div>
  <div class="mg-v2-mobile-gnb__actions">
    <div class="mg-v2-notification-trigger-wrapper">
      <button type="button" class="mg-v2-nav-icon mg-v2-notification-trigger" aria-label="알림" data-testid="mobile-gnb-notification">
        <span class="mg-v2-nav-icon__lucide" aria-hidden="true">🔔</span>
      </button>
    </div>
    <div class="mg-v2-profile-dropdown" data-testid="mobile-gnb-profile">
      <div class="mg-v2-tenant-header-cluster">
        <div class="mg-v2-tenant-header-cluster__identity">
          <div class="mg-v2-profile-avatar mg-v2-profile-avatar--small" aria-hidden="true">
            <span class="mg-v2-profile-avatar__initial">관</span>
          </div>
          <div class="mg-v2-tenant-header-cluster__text">
            <span class="mg-v2-tenant-header-cluster__name">관리자</span>
          </div>
        </div>
        <span
          role="button"
          tabindex="0"
          class="mg-v2-tenant-header-cluster__menu-trigger"
          data-gnb-chrome-free="true"
          aria-label="프로필 메뉴"
          data-testid="mobile-gnb-profile-trigger"
        >▾</span>
      </div>
    </div>
  </div>
</header>
</body>
</html>`;
};

type Rect = { left: number; right: number; top: number; bottom: number; width: number; height: number };

const overlapX = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));

async function measure(page: Page, testId: string): Promise<Rect> {
  const loc = page.getByTestId(testId);
  await expect(loc).toBeVisible();
  const box = await loc.boundingBox();
  if (!box) {
    throw new Error(`missing box for ${testId}`);
  }
  return {
    left: box.x,
    right: box.x + box.width,
    top: box.y,
    bottom: box.y + box.height,
    width: box.width,
    height: box.height
  };
}

async function assertCenterClickable(page: Page, testId: string) {
  const handle = await page.getByTestId(testId).elementHandle();
  if (!handle) {
    throw new Error(`missing element ${testId}`);
  }
  const ok = await page.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return Boolean(top && (top === el || el.contains(top)));
  }, handle);
  expect(ok, `${testId} center must be clickable via elementFromPoint`).toBe(true);
}

test.describe('MobileGnb layout harness (no login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent(buildHarnessHtml(), { waitUntil: 'load' });
  });

  for (const width of VIEWPORTS) {
    test(`viewport ${width}px: no overlap, edge pad, center clock, clickable actions`, async ({
      page
    }) => {
      await page.setViewportSize({ width, height: 800 });

      const clock = await measure(page, 'mobile-gnb-clock');
      const menu = await measure(page, 'mobile-gnb-menu');
      const logo = await measure(page, 'mobile-gnb-logo');
      const notification = await measure(page, 'mobile-gnb-notification');
      const profile = await measure(page, 'mobile-gnb-profile');

      expect(overlapX(clock, menu), 'clock×menu').toBe(0);
      expect(overlapX(clock, logo), 'clock×logo').toBe(0);
      expect(overlapX(clock, notification), 'clock×notification').toBe(0);
      expect(overlapX(clock, profile), 'clock×profile').toBe(0);
      expect(overlapX(notification, profile), 'notification×profile').toBe(0);
      expect(overlapX(menu, logo), 'menu×logo').toBe(0);

      const viewportRight = width;
      expect(viewportRight - profile.right).toBeGreaterThanOrEqual(EDGE_PAD_MIN_PX - 0.5);
      expect(menu.left).toBeGreaterThanOrEqual(EDGE_PAD_MIN_PX - 0.5);

      const clockCenterX = (clock.left + clock.right) / 2;
      expect(Math.abs(clockCenterX - width / 2)).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);

      // 시계 숨김·줄바꿈 금지: compact 라벨이 한 줄로 보여야 함
      const compactVisible = await page.locator('.mg-v2-current-time-chip__label--compact').evaluate(
        (el) => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }
      );
      expect(compactVisible).toBe(true);
      expect(clock.height).toBeLessThanOrEqual(48);

      await assertCenterClickable(page, 'mobile-gnb-menu');
      await assertCenterClickable(page, 'mobile-gnb-notification');
      await assertCenterClickable(page, 'mobile-gnb-profile-trigger');
    });
  }
});
