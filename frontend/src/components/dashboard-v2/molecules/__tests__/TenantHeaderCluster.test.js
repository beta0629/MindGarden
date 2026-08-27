/**
 * TenantHeaderCluster 단위 테스트 — GNB 테넌트 헤더 클러스터
 * identity(비버튼) + chevron-only menu trigger (span[role=button]), NavIcon/EntityRowActions 미사용
 *
 * @see docs/standards/TESTING_STANDARD.md
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TenantHeaderCluster from '../TenantHeaderCluster';
import { SESSION_REMAINING_DISPLAY } from '../../../../constants/session';

const sessionState = { user: null, sessionInfo: null };
jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: sessionState.user,
    sessionInfo: sessionState.sessionInfo
  })
}));

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/admin/dashboard' })
}));

const PROFILE_MENU_TRIGGER_ARIA_LABEL = '프로필 메뉴';
const PANEL_ID = 'mg-v2-profile-dropdown-panel';

const defaultProps = {
  userName: '테스트 사용자',
  avatarImageUrl: undefined,
  isOpen: false,
  onToggle: jest.fn(),
  triggerRef: { current: null },
  panelId: PANEL_ID
};

describe('TenantHeaderCluster', () => {
  const sessionInfoWithRemaining = {
    isAuthenticated: true,
    maxInactiveInterval: 3600,
    lastAccessedTime: Date.now(),
    serverNow: Date.now()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionState.user = { name: '테스트 사용자', role: 'ADMIN' };
    sessionState.sessionInfo = sessionInfoWithRemaining;
  });

  it('identity 이름이 렌더되고 버튼 안에 있지 않다', () => {
    render(<TenantHeaderCluster {...defaultProps} />);
    const nameEl = screen.getByText('테스트 사용자');
    expect(nameEl).toBeInTheDocument();
    expect(nameEl.closest('button')).toBeNull();
    expect(nameEl.closest('[role="button"]')).toBeNull();
  });

  it('정확히 하나의 메뉴 트리거([role=button])만 있고 native button은 없다', () => {
    const { container } = render(<TenantHeaderCluster {...defaultProps} />);
    const cluster = container.querySelector('.mg-v2-tenant-header-cluster');
    expect(cluster.querySelectorAll('button').length).toBe(0);
    expect(cluster.querySelectorAll('[aria-label="프로필 메뉴"]').length).toBe(1);
    expect(
      screen.getByRole('button', { name: PROFILE_MENU_TRIGGER_ARIA_LABEL })
    ).toBeInTheDocument();
  });

  it('메뉴 트리거는 span[role=button]이며 data-gnb-chrome-free가 있다', () => {
    render(<TenantHeaderCluster {...defaultProps} />);
    const trigger = screen.getByRole('button', { name: PROFILE_MENU_TRIGGER_ARIA_LABEL });
    expect(trigger.tagName).toBe('SPAN');
    expect(trigger).toHaveAttribute('data-gnb-chrome-free', 'true');
    expect(trigger).toHaveAttribute('tabIndex', '0');
  });

  it('NavIcon/EntityRowActions/MGButton/bordered trigger wrapper가 없다', () => {
    const { container } = render(<TenantHeaderCluster {...defaultProps} />);
    expect(container.querySelector('.mg-v2-entity-row-actions')).toBeNull();
    expect(container.querySelector('.mg-v2-nav-icon')).toBeNull();
    expect(container.querySelector('.mg-button')).toBeNull();
    expect(container.querySelector('.mg-v2-tenant-header-cluster__actions')).toBeNull();
    expect(container.querySelector('.mg-v2-tenant-header-cluster__trigger-wrap')).toBeNull();
    expect(container.querySelector('.mg-v2-tenant-header-icon-btn')).toBeNull();
  });

  it('트리거에 mg-v2-tenant-header-cluster__menu-trigger 클래스가 있다', () => {
    render(<TenantHeaderCluster {...defaultProps} />);
    const trigger = screen.getByRole('button', { name: PROFILE_MENU_TRIGGER_ARIA_LABEL });
    expect(trigger.classList.contains('mg-v2-tenant-header-cluster__menu-trigger')).toBe(true);
    expect(trigger.classList.contains('mg-v2-nav-icon')).toBe(false);
  });

  it('클러스터 텍스트 아래에 세션 잔여가 표시된다', () => {
    render(<TenantHeaderCluster {...defaultProps} />);
    const labels = screen.getAllByLabelText(SESSION_REMAINING_DISPLAY.ARIA_LABEL);
    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(labels[0]).toHaveTextContent(/세션 잔여/);
    expect(labels[0].className).toContain('mg-header__session-remaining--gnb-trigger');
  });

  it('트리거 클릭 시 onToggle이 호출된다', async() => {
    const onToggle = jest.fn();
    render(<TenantHeaderCluster {...defaultProps} onToggle={onToggle} />);
    await userEvent.click(
      screen.getByRole('button', { name: PROFILE_MENU_TRIGGER_ARIA_LABEL })
    );
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('트리거 Enter/Space 키로 onToggle이 호출된다', async() => {
    const onToggle = jest.fn();
    render(<TenantHeaderCluster {...defaultProps} onToggle={onToggle} />);
    const trigger = screen.getByRole('button', { name: PROFILE_MENU_TRIGGER_ARIA_LABEL });
    trigger.focus();
    await userEvent.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(' ');
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('isOpen에 따라 aria-expanded가 갱신된다', () => {
    const { rerender } = render(<TenantHeaderCluster {...defaultProps} isOpen={false} />);
    const trigger = screen.getByRole('button', { name: PROFILE_MENU_TRIGGER_ARIA_LABEL });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    rerender(<TenantHeaderCluster {...defaultProps} isOpen />);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
