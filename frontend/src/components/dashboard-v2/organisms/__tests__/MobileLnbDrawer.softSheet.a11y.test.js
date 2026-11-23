/**
 * soft-sheet 드로어 a11y — 열릴 때만 dialog attrs, ESC/스크림 닫기
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobileLnbDrawer, {
  ADMIN_MENU_DRAWER_TEST_ID,
  COUNSELOR_MENU_DRAWER_TEST_ID
} from '../MobileLnbDrawer';

const ITEMS = [
  { to: '/admin/dashboard', icon: 'HOME', label: '대시보드', end: true, menuCode: 'ADM_DASHBOARD' },
  { to: '/admin/schedules', icon: 'CALENDAR', label: '통합 스케줄', end: true, menuCode: 'ADM_SCHEDULE' }
];

describe('MobileLnbDrawer soft-sheet a11y', () => {
  test('열림: role=dialog aria-modal aria-labelledby · 닫힘: dialog attrs 제거 + aria-hidden', () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <MemoryRouter>
        <MobileLnbDrawer
          isOpen
          onClose={onClose}
          menuItems={ITEMS}
          variant="soft-sheet"
          activeTone="slate"
          headerTitle="메뉴"
        />
      </MemoryRouter>
    );

    const openDrawer = screen.getByTestId(ADMIN_MENU_DRAWER_TEST_ID);
    expect(openDrawer).toHaveAttribute('role', 'dialog');
    expect(openDrawer).toHaveAttribute('aria-modal', 'true');
    expect(openDrawer).toHaveAttribute('aria-labelledby');
    expect(openDrawer).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText('메뉴')).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <MobileLnbDrawer
          isOpen={false}
          onClose={onClose}
          menuItems={ITEMS}
          variant="soft-sheet"
          activeTone="slate"
          headerTitle="메뉴"
        />
      </MemoryRouter>
    );

    const closed = screen.getByTestId(ADMIN_MENU_DRAWER_TEST_ID);
    expect(closed).not.toHaveAttribute('role', 'dialog');
    expect(closed).not.toHaveAttribute('aria-modal');
    expect(closed).not.toHaveAttribute('aria-labelledby');
    expect(closed).toHaveAttribute('aria-hidden', 'true');
  });

  test('스크림 클릭·Escape 로 닫힌다 (soft-sheet useCoverDrawerFocus)', () => {
    const onClose = jest.fn();
    render(
      <MemoryRouter>
        <button type="button" className="mg-v2-mobile-gnb__menu" aria-label="메뉴">☰</button>
        <MobileLnbDrawer
          isOpen
          onClose={onClose}
          menuItems={ITEMS}
          variant="soft-sheet"
          activeTone="primary"
        />
      </MemoryRouter>
    );

    expect(screen.getByTestId(COUNSELOR_MENU_DRAWER_TEST_ID)).toBeInTheDocument();
    const closeTargets = screen.getAllByLabelText('메뉴 닫기');
    fireEvent.click(closeTargets[0]);
    expect(onClose).toHaveBeenCalled();

    onClose.mockClear();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
