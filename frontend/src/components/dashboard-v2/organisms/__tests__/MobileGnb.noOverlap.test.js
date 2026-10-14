/**
 * MobileGnb — 360·375·390·414에서 시계 칩과 알림 버튼 겹침 0.
 * absolute 중앙 배치 제거 후 grid가 자리를 잡는다는 CSS·레이아웃 계약.
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
/** 알림 NavIcon 트리거 */
const NOTIFICATION_WIDTH_PX = 44;
/** 메뉴 + 로고 그래픽(브랜드명 숨김 시) */
const LEFT_COMPACT_PX = 88;
/** 프로필 아바타(+chevron), 이름 숨김 시 */
const PROFILE_COMPACT_PX = 56;
const ACTIONS_MIN_PX = NOTIFICATION_WIDTH_PX + PROFILE_COMPACT_PX;

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
        'aria-label': label || 'nav'
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
 * grid: minmax(0,1fr) | auto | minmax(min-content,1fr) + column-gap.
 * 오른쪽은 actions min-content 미만으로 줄지 않아 시계와의 갭을 지킨다.
 */
const simulateGridRects = (viewportWidth) => {
  const contentWidth = viewportWidth - PADDING_X_PX * 2;
  const centerWidth = CHIP_WIDTH_PX;
  const free = contentWidth - centerWidth - GAP_SIDES_PX * 2;
  const idealSide = free / 2;
  const rightWidth = Math.max(ACTIONS_MIN_PX, idealSide);
  const leftWidth = Math.max(0, free - rightWidth);
  const leftStart = PADDING_X_PX;
  const centerStart = leftStart + leftWidth + GAP_SIDES_PX;
  const rightStart = centerStart + centerWidth + GAP_SIDES_PX;

  return {
    clock: {
      left: centerStart,
      right: centerStart + centerWidth,
      width: centerWidth
    },
    notification: {
      left: rightStart,
      right: rightStart + NOTIFICATION_WIDTH_PX,
      width: NOTIFICATION_WIDTH_PX
    },
    leftWidth,
    rightWidth
  };
};

const horizontalOverlapPx = (a, b) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));

describe('MobileGnb noOverlap (clock × notification)', () => {
  const gnbCss = read('components/dashboard-v2/organisms/MobileGnb.css');
  const gnbJs = read('components/dashboard-v2/organisms/MobileGnb.js');

  test('absolute 중앙 배치를 쓰지 않고 grid로 자리를 잡는다', () => {
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb\s*\{[^}]*display:\s*grid/s);
    expect(gnbCss).toMatch(
      /\.mg-v2-mobile-gnb\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+minmax\(min-content,\s*1fr\)/s
    );
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb\s*\{[^}]*column-gap:\s*var\(--mg-v2-now-chip-gap-sides\)/s);
    expect(gnbCss).not.toMatch(/\.mg-v2-mobile-gnb__center\s*\{[^}]*position:\s*absolute/s);
    expect(gnbCss).not.toMatch(/\.mg-v2-mobile-gnb__center\s*\{[^}]*left:\s*50%/s);
    expect(gnbCss).not.toMatch(/\.mg-v2-mobile-gnb__center\s*\{[^}]*transform:\s*translate/s);
  });

  test('시계는 flex-shrink:0, 양옆 갭 토큰, 왼쪽·액션 래퍼가 있다', () => {
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb__center\s*\{[^}]*flex-shrink:\s*0/s);
    expect(gnbCss).toMatch(/--mg-v2-now-chip-gap-sides/);
    expect(gnbJs).toMatch(/mg-v2-mobile-gnb__left/);
    expect(gnbJs).toMatch(/mg-v2-mobile-gnb__center/);
    expect(gnbJs).toMatch(/mg-v2-mobile-gnb__actions/);
    expect(gnbCss).toMatch(/\.mg-v2-mobile-gnb__actions\s*\{[^}]*min-width:\s*min-content/s);
  });

  test('브랜드명은 좁은 폭에서 우선 축소·숨김 (시계 유지)', () => {
    expect(gnbCss).toMatch(/@media\s*\(max-width:\s*390px\)/);
    expect(gnbCss).toMatch(
      /@media\s*\(max-width:\s*390px\)\s*\{[^}]*\.mg-v2-mobile-gnb__brand-name[^}]*display:\s*none/s
    );
  });

  test.each(VIEWPORTS)(
    'viewport %ipx: grid 모델에서 시계·알림 겹침 0, 갭≥24',
    (vw) => {
      const { clock, notification, leftWidth, rightWidth } = simulateGridRects(vw);
      expect(leftWidth + CHIP_WIDTH_PX + GAP_SIDES_PX * 2 + rightWidth).toBeLessThanOrEqual(
        vw - PADDING_X_PX * 2 + 0.01
      );
      expect(rightWidth).toBeGreaterThanOrEqual(ACTIONS_MIN_PX);
      expect(leftWidth).toBeGreaterThanOrEqual(0);
      expect(LEFT_COMPACT_PX).toBeGreaterThan(0);
      expect(horizontalOverlapPx(clock, notification)).toBe(0);
      expect(notification.left - clock.right).toBeGreaterThanOrEqual(GAP_SIDES_PX);
    }
  );

  test.each(VIEWPORTS)('viewport %ipx: DOM rect mock — 시계·알림 겹침 0', (vw) => {
    const { clock, notification } = simulateGridRects(vw);
    const { container, unmount } = render(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(MobileGnb, { logoLabel: '센터' })
      )
    );

    const chip = container.querySelector('[data-testid="mobile-gnb-clock"]');
    const bell = container.querySelector('[data-testid="mobile-gnb-notification"]');
    expect(chip).toBeTruthy();
    expect(bell).toBeTruthy();

    chip.getBoundingClientRect = () => ({
      x: clock.left,
      y: 0,
      top: 0,
      bottom: 36,
      left: clock.left,
      right: clock.right,
      width: clock.width,
      height: 36,
      toJSON() {
        return this;
      }
    });
    bell.getBoundingClientRect = () => ({
      x: notification.left,
      y: 0,
      top: 0,
      bottom: 36,
      left: notification.left,
      right: notification.right,
      width: notification.width,
      height: 36,
      toJSON() {
        return this;
      }
    });

    const chipRect = chip.getBoundingClientRect();
    const bellRect = bell.getBoundingClientRect();
    expect(horizontalOverlapPx(chipRect, bellRect)).toBe(0);
    expect(bellRect.left - chipRect.right).toBeGreaterThanOrEqual(GAP_SIDES_PX);

    unmount();
  });
});
