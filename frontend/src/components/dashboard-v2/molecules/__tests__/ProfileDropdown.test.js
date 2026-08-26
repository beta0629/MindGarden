/**
 * ProfileDropdown 단위 테스트 - GNB 테넌트 헤더 클러스터 + 드롭다운
 * - identity(비버튼) + chevron 아이콘 트리거 분리
 * - 트리거 클릭 시 패널 열림, Portal·useDropdownPosition·Escape 유지
 * - 세션 잔여: 클러스터 텍스트 + 드롭다운 프로필 영역
 * - 화면 테마 세그먼트(useDarkMode) 전환
 * @see docs/standards/TESTING_STANDARD.md
 * @see docs/project-management/GNB_DROPDOWN_VERIFICATION_CHECKLIST.md
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileDropdown from '../ProfileDropdown';
import { SESSION_REMAINING_DISPLAY } from '../../../../constants/session';
import {
  DarkModeProvider,
  DARK_MODE_STORAGE_KEY,
  DARK_MODE_VALUES
} from '../../../../contexts/DarkModeContext';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/admin/dashboard' })
}));

const sessionState = { user: null, sessionInfo: null };
jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: sessionState.user,
    sessionInfo: sessionState.sessionInfo
  })
}));

jest.mock('../../../../hooks/useBranding', () => ({
  useBranding: () => ({ brandingInfo: null })
}));

const PROFILE_MENU_TRIGGER_ARIA_LABEL = '프로필 메뉴';

const getProfileMenuTrigger = () =>
  screen.getByRole('button', { name: PROFILE_MENU_TRIGGER_ARIA_LABEL });

const renderWithProviders = (ui) =>
  render(<DarkModeProvider>{ui}</DarkModeProvider>);

describe('ProfileDropdown', () => {
  const defaultUser = {
    name: '테스트 사용자',
    username: 'testuser',
    email: 'test@example.com',
    role: 'ADMIN'
  };

  const sessionInfoWithRemaining = {
    isAuthenticated: true,
    maxInactiveInterval: 3600,
    lastAccessedTime: Date.now(),
    serverNow: Date.now()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionState.user = defaultUser;
    sessionState.sessionInfo = sessionInfoWithRemaining;
    window.localStorage.removeItem(DARK_MODE_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
  });

  describe('렌더링 · 클러스터 구조', () => {
    it('user가 있으면 identity 이름과 chevron 트리거가 렌더된다', () => {
      renderWithProviders(<ProfileDropdown />);
      expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
      expect(getProfileMenuTrigger()).toBeInTheDocument();
    });

    it('user가 null이면 아무것도 렌더하지 않는다', () => {
      sessionState.user = null;
      const { container } = renderWithProviders(<ProfileDropdown />);
      expect(container.firstChild).toBeNull();
    });

    it('테넌트명 텍스트는 버튼이 아니다', () => {
      renderWithProviders(<ProfileDropdown />);
      expect(
        screen.queryByRole('button', { name: /테스트 사용자/ })
      ).not.toBeInTheDocument();
      const nameEl = screen.getByText('테스트 사용자');
      expect(nameEl.closest('button')).toBeNull();
    });

    it('클러스터 identity와 actions가 분리되고 공유 border wrapper가 없다', () => {
      const { container } = renderWithProviders(<ProfileDropdown />);
      const cluster = container.querySelector('.mg-v2-tenant-header-cluster');
      const identity = container.querySelector('.mg-v2-tenant-header-cluster__identity');
      const actions = container.querySelector('.mg-v2-tenant-header-cluster__actions');
      expect(cluster).toBeTruthy();
      expect(identity).toBeTruthy();
      expect(actions).toBeTruthy();
      expect(identity.contains(actions)).toBe(false);
      expect(container.querySelector('.mg-v2-profile-trigger')).toBeNull();
      expect(container.querySelector('.mg-v2-profile-trigger-outer')).toBeNull();
    });

    it('트리거 버튼에 mg-button / ActionBarButton 클래스가 없다', () => {
      renderWithProviders(<ProfileDropdown />);
      const trigger = getProfileMenuTrigger();
      expect(trigger.className).not.toMatch(/mg-button/);
      expect(trigger.className).not.toMatch(/ActionBarButton/);
      expect(trigger.classList.contains('mg-v2-nav-icon')).toBe(true);
      expect(trigger.classList.contains('mg-v2-tenant-header-icon-btn')).toBe(true);
    });

    it('클러스터 텍스트 아래에 세션 잔여가 표시된다', () => {
      renderWithProviders(<ProfileDropdown />);
      const labels = screen.getAllByLabelText(SESSION_REMAINING_DISPLAY.ARIA_LABEL);
      expect(labels.length).toBeGreaterThanOrEqual(1);
      expect(labels[0]).toHaveTextContent(/세션 잔여/);
      expect(labels[0].className).toContain('mg-header__session-remaining--gnb-trigger');
    });
  });

  describe('트리거 클릭 시 패널 열림', () => {
    it('chevron 트리거 클릭 시 패널(role=menu)이 열린다', async() => {
      renderWithProviders(<ProfileDropdown />);
      const trigger = getProfileMenuTrigger();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      await userEvent.click(trigger);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('트리거 다시 클릭 시 패널이 닫힌다', async() => {
      renderWithProviders(<ProfileDropdown />);
      const trigger = getProfileMenuTrigger();
      await userEvent.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await userEvent.click(trigger);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    it('열린 드롭다운 프로필 영역에 세션 잔여가 표시된다', async() => {
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());

      const labels = screen.getAllByLabelText(SESSION_REMAINING_DISPLAY.ARIA_LABEL);
      const inDropdown = labels.find((el) =>
        el.className.includes('mg-header__session-remaining--gnb-dropdown')
      );
      expect(inDropdown).toBeTruthy();
      expect(inDropdown).toHaveTextContent(/세션 잔여/);
    });
  });

  describe('Portal 렌더링', () => {
    it('패널이 열리면 document.body 직계 자식에 패널이 존재한다', async() => {
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());

      const panel = screen.getByRole('menu');
      expect(panel.parentElement).toBe(document.body);
    });

    it('패널이 닫히면 overlay/portal이 없다', async() => {
      renderWithProviders(<ProfileDropdown />);
      const trigger = getProfileMenuTrigger();
      await userEvent.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await userEvent.click(trigger);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(document.querySelector('.mg-v2-profile-dropdown__panel')).toBeNull();
    });
  });

  describe('useDropdownPosition 스타일 적용', () => {
    it('열린 패널에 position: fixed 및 zIndex가 적용된다', async() => {
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());

      const panel = screen.getByRole('menu');
      expect(panel).toHaveStyle({ position: 'fixed' });
      expect(panel.style.zIndex).toBeDefined();
      expect(panel.style.zIndex).not.toBe('');
    });
  });

  describe('Escape 키로 닫힘', () => {
    it('패널이 열린 상태에서 Escape 키를 누르면 패널이 닫힌다', async() => {
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('화면 테마 전환', () => {
    it('패널에 화면 테마 행과 라이트/다크 스위치가 있다', async() => {
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());

      expect(screen.getByText('화면 테마')).toBeInTheDocument();
      expect(document.querySelector('.mg-v2-profile-theme-row')).toBeTruthy();
      expect(document.querySelector('.mg-v2-theme-switch')).toBeTruthy();
      expect(screen.getByRole('button', { name: '라이트' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '다크' })).toBeInTheDocument();
    });

    it('다크 클릭 시 data-theme=dark 및 localStorage 가 갱신된다', async() => {
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());
      await userEvent.click(screen.getByRole('button', { name: '다크' }));

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe(DARK_MODE_VALUES.DARK);
      });
      expect(window.localStorage.getItem(DARK_MODE_STORAGE_KEY)).toBe(DARK_MODE_VALUES.DARK);
      expect(screen.getByRole('button', { name: '다크' })).toHaveAttribute('aria-pressed', 'true');
    });

    it('라이트 클릭 시 data-theme=light 로 복귀한다', async() => {
      window.localStorage.setItem(DARK_MODE_STORAGE_KEY, DARK_MODE_VALUES.DARK);
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());
      await userEvent.click(screen.getByRole('button', { name: '라이트' }));

      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe(DARK_MODE_VALUES.LIGHT);
      });
      expect(window.localStorage.getItem(DARK_MODE_STORAGE_KEY)).toBe(DARK_MODE_VALUES.LIGHT);
    });
  });

  describe('메뉴 클릭', () => {
    it('내 정보 클릭 시 navigate 호출 후 패널이 닫힌다', async() => {
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());
      await userEvent.click(screen.getByText('내 정보'));

      expect(mockNavigate).toHaveBeenCalledWith('/admin/mypage');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('로그아웃 클릭 시 onLogout이 있으면 호출된다', async() => {
      const onLogout = jest.fn();
      renderWithProviders(<ProfileDropdown onLogout={onLogout} />);
      await userEvent.click(getProfileMenuTrigger());
      await userEvent.click(screen.getByText('로그아웃'));

      expect(onLogout).toHaveBeenCalled();
    });

    it('상담사는 설정 메뉴가 보이지 않는다', async() => {
      sessionState.user = { ...defaultUser, role: 'CONSULTANT' };
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());
      expect(screen.getByText('내 정보')).toBeInTheDocument();
      expect(screen.queryByText('설정')).not.toBeInTheDocument();
    });

    it('내담자는 설정 메뉴가 보이지 않는다', async() => {
      sessionState.user = { ...defaultUser, role: 'CLIENT' };
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());
      expect(screen.getByText('내 정보')).toBeInTheDocument();
      expect(screen.queryByText('설정')).not.toBeInTheDocument();
    });

    it('메뉴 행에 HeaderMenuRow 가 있고 mg-button 클래스가 없다', async() => {
      renderWithProviders(<ProfileDropdown />);
      await userEvent.click(getProfileMenuTrigger());
      const mypage = screen.getByText('내 정보').closest('button');
      expect(mypage.classList.contains('mg-v2-header-menu-row')).toBe(true);
      expect(mypage.className).not.toMatch(/mg-button/);
    });
  });
});
