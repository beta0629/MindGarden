/**
 * QuickActionsDropdown 단위 테스트
 * - native HeaderMenuRow flush rows
 * - MGButton / buildErpMgButtonClassName 미사용
 *
 * @author CoreSolution
 * @since 2026-08-26
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('../../../../utils/sessionManager', () => ({
  sessionManager: {
    getUser: () => ({ id: 1, role: 'CONSULTANT', name: '상담사' })
  }
}));

jest.mock('../../../../constants/gnbQuickActions', () => ({
  getQuickActionsForRole: () => [
    {
      id: 'schedule',
      icon: 'CALENDAR',
      label: '일정 관리',
      action: '/consultant/schedule',
      type: 'navigate'
    },
    {
      id: 'record',
      icon: 'FILE_EDIT',
      label: '상담일지 작성',
      action: 'openRecordModal',
      type: 'modal'
    }
  ]
}));

import QuickActionsDropdown from '../QuickActionsDropdown';

describe('QuickActionsDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const openPanel = async() => {
    await userEvent.click(screen.getByRole('button', { name: '빠른 액션' }));
    await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument());
  };

  it('패널에 native HeaderMenuRow 메뉴 행이 렌더된다', async() => {
    render(<QuickActionsDropdown />);
    await openPanel();

    const rows = document.querySelectorAll('.mg-v2-quick-action-item');
    expect(rows.length).toBe(2);
    rows.forEach((row) => {
      expect(row.tagName).toBe('BUTTON');
      expect(row.classList.contains('mg-v2-header-menu-row')).toBe(true);
      expect(row.className).not.toMatch(/mg-button/);
      expect(row).toHaveAttribute('role', 'menuitem');
    });
    expect(screen.getByText('일정 관리')).toBeInTheDocument();
    expect(screen.getByText('상담일지 작성')).toBeInTheDocument();
  });

  it('navigate 행 클릭 시 navigate 후 패널이 닫힌다', async() => {
    render(<QuickActionsDropdown />);
    await openPanel();
    await userEvent.click(screen.getByText('일정 관리'));

    expect(mockNavigate).toHaveBeenCalledWith('/consultant/schedule');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('modal 행 클릭 시 onModalAction 이 호출된다', async() => {
    const onModalAction = jest.fn();
    render(<QuickActionsDropdown onModalAction={onModalAction} />);
    await openPanel();
    await userEvent.click(screen.getByText('상담일지 작성'));

    expect(onModalAction).toHaveBeenCalledWith('openRecordModal');
  });
});
