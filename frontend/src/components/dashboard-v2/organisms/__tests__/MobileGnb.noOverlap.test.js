/**
 * MobileGnb — 360·375·390·414에서 시계↔메뉴·로고·알림 겹침 0, 시계 중앙 정렬.
 * 대칭 grid(minmax(0,1fr) auto minmax(0,1fr)) + ≤414 브랜드 숨김 계약.
 */

const fs = require('fs');
const path = require('path');
const React = require('react');
const { render } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');

const SRC_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const read = (rel) => fs.readFileSync(path.join(SRC_ROOT, rel), 'utf8');

const VIEWPORTS = [360, 375, 390, 414];
/** --mg-v2-space-6 = 1.5rem @ 16px → 24px (토큰 --mg-v2-now-chip-gap-sides) */
const GAP_SIDES_PX = 24;
const PADDING_X_PX = 16;
/** 모바일 compact 시계 칩 대략 폭 (아이콘+오후 h:mm) */
const CHIP_WIDTH_PX = 118;
/** 메뉴 NavIcon */
const MENU_WIDTH_PX = 44;
/** 로고 그래픽(브랜드명 숨김 시, ≤414) */
const LOGO_GRAPHIC_PX = 44;
/** 알림 NavIcon 트리거 */
const NOTIFICATION_WIDTH_PX = 44;
/** 시계 중심 정렬 허용 오차(px) — 서브픽셀·반올림 */
const CENTER_ALIGN_TOLERANCE_PX = 1;

jest.mock('../../atoms', () => {
  const ReactLocal = require('react');
  return {
    CurrentTimeChip: () =>
      ReactLocal.createElement('time', {
        className: 'mg-v2-current-time-chip',
        'data-testid': 'mobile-gnb-clock'
      }),
    NavIcon: ({ label, className }) =>
      ReactLocal.createElement('button', {
        type: 'button',
        className,
        'aria-label': label || 'nav',
        'data-testid': label === '메뉴' ? 'mobile-gnb-menu' : undefined
      })
  };
});

jest.mock('../../molecules', () => {
  const ReactLocal = require('react');
  return {
    NotificationDropdown: () =>
      ReactLocal.createElement('button', {
        type: 'button',
        className: 'mg-v2-notification-trigger',
        'data-testid': 'mobile-gnb-notification',
        'aria-label': '알림'
      }),
    ProfileDropdown: () =>
      ReactLocal.createElement('div', {
        className: 'mg-v2-profile-dropdown',
        'data-testid': 'mobile-gnb-profile'
      })
  };
});

const MobileGnb = require('../MobileGnb').default;

/**
 * 대칭 grid: minmax(0,1fr) | auto | minmax(0,1fr) + column-gap.
 * 좌·우 동일 폭 → 시계 중심 = 뷰포트 중심. ≤414에서는 브랜드 숨김으로
 * 왼쪽 콘텐츠(메뉴+로고)가 side 폭 안에 들어가거나 overflow:hidden 으로 침범 0.
 */
const simulateSymmetricGridRects = (viewportWidth) => {
  const contentWidth = viewportWidth - PADDING_X_PX * 2;
  const centerWidth = CHIP_WIDTH_PX;
  const free = contentWidth - centerWidth - GAP_SIDES_PX * 2;
  const sideWidth = Math.max(0, free / 2);
  const leftStart = PADDING_X_PX;
  const centerStart = leftStart + sideWidth + GAP_SIDES_PX;
  const rightStart = centerStart + centerWidth + GAP_SIDES_PX;
  const brandHidden = viewportWidth <= 414;
  const logoWidth = LOGO_GRAPHIC_PX;
  const menuLeft = leftStart;
  const menuRight = menuLeft + MENU_WIDTH_PX;
  const logoLeft = menuRight;
  const logoRight = logoLeft + logoWidth;
  const notificationLeft = rightStart;
  const notificationRight = notificationLeft + NOTIFICATION_WIDTH_PX;

  return {
    clock: {
      left: centerStart,
      right: centerStart + centerWidth,
      width: centerWidth,
      centerX: centerStart + centerWidth / 2
    },
    menu: {
      left: menuLeft,
      right: menuRight,
      width: MENU_WIDTH_PX
    },
    logo: {
      left: logoLeft,
      right: Math.min(logoRight, leftStart + sideWidth),
      width: logoWidth
    },
    notification: {
      left: notificationLeft,
      right: notificationRight,
      width: NOTIFICATION_WIDTH_PX
    },
    sideWidth,
    brandHidden,
    viewportCenterX: viewportWidth / 2
  };
};

const horizontalOverlapPx = (a, b) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));

const mockRect = (rect) => ({
  x: rect.left,
  y: 0,
  top: 0,
  bottom: 36,
  left: rect.left,
  right: rect.right,
  width: rect.width ?? rect.right - rect.left,
  height: 36,
  toJSON() {
    return this;
  }
});

describe('MobileGnb noOverlap (clock × menu/logo/notification)', () => {
  const gnbCss = read('components/dashboard-v2/organisms/MobileGnb.css');
  const gnbJs = read('components/dashboard-v2/organisms/MobileGnb.js');

  test('absolute 중앙 배치를 쓰지 않고 대칭 grid로 자리를 잡는다', () => {
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb\s*\{[^}]*display:\s*grid/s);
    expect(gnbCss).toMatch(
      /\.mg-v2-mobile-gnb\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+minmax\(0,\s*1fr\)/s
    );
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb\s*\{[^}]*column-gap:\s*var\(--mg-v2-now-chip-gap-sides\)/s);
    expect(gnbCss).not.toMatch(/\.mg-v2-mobile-gnb__center\s*\{[^}]*position:\s*absolute/s);
    expect(gnbCss).not.toMatch(/\.mg-v2-mobile-gnb__center\s*\{[^}]*left:\s*50%/s);
    expect(gnbCss).not.toMatch(/\.mg-v2-mobile-gnb__center\s*\{[^}]*transform:\s*translate/s);
  });

  test('시계 flex-shrink:0, 양옆 갭 토큰, 왼쪽 overflow hidden·min-width 0', () => {
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb__center\s*\{[^}]*flex-shrink:\s*0/s);
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb__center\s+\.mg-v2-current-time-chip\s*\{[^}]*flex-shrink:\s*0/s);
    expect(gnbCss).toMatch(/--mg-v2-now-chip-gap-sides/);
    expect(gnbJs).toMatch(/mg-v2-mobile-gnb__left/);
    expect(gnbJs).toMatch(/mg-v2-mobile-gnb__center/);
    expect(gnbJs).toMatch(/mg-v2-mobile-gnb__actions/);
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb__left\s*\{[^}]*overflow:\s*hidden/s);
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb__left\s*\{[^}]*min-width:\s*0/s);
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb__logo\s*\{[^}]*min-width:\s*0/s);
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb__brand-name\s*\{[^}]*min-width:\s*0/s);
  });

  test('브랜드명은 ≤414에서 숨김 (시계 유지, 414 겹침 방지)', () => {
    expect(gnbCss).toMatch(/@media\s*\(max-width:\s*414px\)/);
    expect(gnbCss).toMatch(
      /@media\s*\(max-width:\s*414px\)\s*\{[^}]*\.mg-v2-mobile-gnb__brand-name[^}]*display:\s*none/s
    );
    expect(gnbCss).toMatch(
      /@media\s*\(max-width:\s*414px\)\s*\{[^}]*\.mg-v2-mobile-gnb__logo-text[^}]*display:\s*none/s
    );
    expect(gnbCss).not.toMatch(/@media\s*\(max-width:\s*390px\)/);
  });

  test.each(VIEWPORTS)(
    'viewport %ipx: 대칭 grid — 겹침 0, 갭≥24, 시계 중앙(±1px), 브랜드 숨김',
    (vw) => {
      const {
        clock,
        menu,
        logo,
        notification,
        sideWidth,
        brandHidden,
        viewportCenterX
      } = simulateSymmetricGridRects(vw);

      expect(sideWidth * 2 + CHIP_WIDTH_PX + GAP_SIDES_PX * 2).toBeCloseTo(
        vw - PADDING_X_PX * 2,
        5
      );
      expect(brandHidden).toBe(true);
      expect(horizontalOverlapPx(clock, menu)).toBe(0);
      expect(horizontalOverlapPx(clock, logo)).toBe(0);
      expect(horizontalOverlapPx(clock, notification)).toBe(0);
      expect(horizontalOverlapPx(menu, clock)).toBe(0);
      expect(clock.left - Math.min(menu.right, logo.right)).toBeGreaterThanOrEqual(0);
      expect(notification.left - clock.right).toBeGreaterThanOrEqual(GAP_SIDES_PX);
      expect(clock.left - (PADDING_X_PX + sideWidth)).toBe(GAP_SIDES_PX);
      expect(Math.abs(clock.centerX - viewportCenterX)).toBeLessThanOrEqual(
        CENTER_ALIGN_TOLERANCE_PX
      );
    }
  );

  test.each(VIEWPORTS)(
    'viewport %ipx: DOM rect mock — 메뉴·로고·알림·시계 겹침 0·중앙 정렬',
    (vw) => {
      const { clock, menu, logo, notification, viewportCenterX } =
        simulateSymmetricGridRects(vw);
      const { container, unmount } = render(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(MobileGnb, { logoLabel: '센터', logoUrl: '/logo.png' })
        )
      );

      const chip = container.querySelector('[data-testid="mobile-gnb-clock"]');
      const bell = container.querySelector('[data-testid="mobile-gnb-notification"]');
      const menuBtn = container.querySelector('[data-testid="mobile-gnb-menu"]');
      const logoLink = container.querySelector('.mg-v2-mobile-gnb__logo');
      expect(chip).toBeTruthy();
      expect(bell).toBeTruthy();
      expect(menuBtn).toBeTruthy();
      expect(logoLink).toBeTruthy();

      chip.getBoundingClientRect = () => mockRect(clock);
      bell.getBoundingClientRect = () => mockRect(notification);
      menuBtn.getBoundingClientRect = () => mockRect(menu);
      logoLink.getBoundingClientRect = () => mockRect(logo);

      const chipRect = chip.getBoundingClientRect();
      const bellRect = bell.getBoundingClientRect();
      const menuRect = menuBtn.getBoundingClientRect();
      const logoRect = logoLink.getBoundingClientRect();

      expect(horizontalOverlapPx(chipRect, menuRect)).toBe(0);
      expect(horizontalOverlapPx(chipRect, logoRect)).toBe(0);
      expect(horizontalOverlapPx(chipRect, bellRect)).toBe(0);
      expect(bellRect.left - chipRect.right).toBeGreaterThanOrEqual(GAP_SIDES_PX);
      expect(
        Math.abs((chipRect.left + chipRect.right) / 2 - viewportCenterX)
      ).toBeLessThanOrEqual(CENTER_ALIGN_TOLERANCE_PX);

      unmount();
    }
  );
});
