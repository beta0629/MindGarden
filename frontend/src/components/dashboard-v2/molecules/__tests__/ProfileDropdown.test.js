/**
 * ProfileDropdown 단위 테스트 - GNB 드롭다운 동작 검증
 * - 트리거 클릭 시 패널 열림, Portal이 document.body에 렌더, useDropdownPosition 스타일 적용, 클릭 아웃사이드/Escape 시 닫힘
 * @see docs/standards/TESTING_STANDARD.md
 * @see docs/project-management/GNB_DROPDOWN_VERIFICATION_CHECKLIST.md
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileDropdown from '../ProfileDropdown';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

const sessionState = { user: null };
jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: sessionState.user })
}));

jest.mock('../../../../hooks/useBranding', () => ({
  useBranding: () => ({ brandingInfo: null })
}));

describe('ProfileDropdown', () => {
  const defaultUser = {
    name: '테스트 사용자',
    username: 'testuser',
    email: 'test@example.com',
    role: 'ADMIN'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionState.user = defaultUser;
  });

  describe('렌더링', () => {
    it('user가 있으면 트리거(프로필 영역)가 렌더된다', () => {
      render(<ProfileDropdown />);
      expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /프로필|사용자/ })).toBeInTheDocument();
    });

    it('user가 null이면 아무것도 렌더하지 않는다', () => {
      sessionState.user = null;
      const { container } = render(<ProfileDropdown />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('트리거 클릭 시 패널 열림', () => {
    it('트리거 클릭 시 패널(role=menu)이 열린다', async () => {
      render(<ProfileDropdown />);
      const trigger = screen.getByRole('button', { expanded: false });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      await userEvent.click(trigger);

      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    it('트리거 다시 클릭 시 패널이 닫힌다', async () => {
      render(<ProfileDropdown />);
      const trigger = screen.getByRole('button', { expanded: false });
      await userEvent.click(trigger);
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await userEvent.click(trigger);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('Portal 렌더링', () => {
    it('패널이 열리면 document.body 직계 자식에 패널이 존재한다', async () => {
      render(<ProfileDropdown />);
      await userEvent.click(screen.getByRole('button', { expanded: false }));

      const panel = screen.getByRole('menu');
      expect(panel.parentElement).toBe(document.body);
    });
  });

  describe('useDropdownPosition 스타일 적용', () => {
    it('열린 패널에 position: fixed 및 zIndex가 적용된다', async () => {
      render(<ProfileDropdown />);
      await userEvent.click(screen.getByRole('button', { expanded: false }));

      const panel = screen.getByRole('menu');
      expect(panel).toHaveStyle({ position: 'fixed' });
      expect(panel.style.zIndex).toBeDefined();
      expect(panel.style.zIndex).not.toBe('');
    });
  });

  describe('Escape 키로 닫힘', () => {
    it('패널이 열린 상태에서 Escape 키를 누르면 패널이 닫힌다', async () => {
      render(<ProfileDropdown />);
      await userEvent.click(screen.getByRole('button', { expanded: false }));
      expect(screen.getByRole('menu')).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  describe('메뉴 클릭', () => {
    it('내 정보 클릭 시 navigate 호출 후 패널이 닫힌다', async () => {
      render(<ProfileDropdown />);
      await userEvent.click(screen.getByRole('button', { expanded: false }));
      await userEvent.click(screen.getByText('내 정보'));

      expect(mockNavigate).toHaveBeenCalledWith('/admin/mypage');
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('로그아웃 클릭 시 onLogout이 있으면 호출된다', async () => {
      const onLogout = jest.fn();
      render(<ProfileDropdown onLogout={onLogout} />);
      await userEvent.click(screen.getByRole('button', { expanded: false }));
      await userEvent.click(screen.getByText('로그아웃'));

      expect(onLogout).toHaveBeenCalled();
    });
  });
});
