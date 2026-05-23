/**
 * NotificationDropdown.handleMarkAllRead 단위 테스트.
 * 운영 핫픽스 (2026-05-23) — GNB "모두 읽음" 클릭 시 메시지 일괄 API 단일 호출 보장.
 *
 * @see docs/project-management/2026-05-23/CONSULTANT_UNREAD_MESSAGE_DEBUG_REPORT.md
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockCtx = {
  unreadSystemCount: 0,
  unreadMessageCount: 5,
  refreshNotifications: jest.fn(),
  loadUnreadCount: jest.fn(() => Promise.resolve()),
  markSystemNotificationAsRead: jest.fn(),
  markAllSystemNotificationsAsRead: jest.fn(() => Promise.resolve()),
  markMessageAsRead: jest.fn(() => Promise.resolve()),
  markAllMessagesAsRead: jest.fn(() => Promise.resolve({ updatedCount: 263 }))
};

jest.mock('../../../../contexts/NotificationContext', () => ({
  useNotification: () => mockCtx
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: { id: 3, role: 'CONSULTANT' } })
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { messages: [], notifications: [] } }))
  }
}));

jest.mock('../../../../utils/consultationMessagesApi', () => ({
  getConsultationMessagesListPath: () => '/api/v1/consultation-messages/consultant/3'
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, def) => def || key })
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children, ...rest }) => <a {...rest}>{children}</a>
}));

const NotificationDropdown = require('../NotificationDropdown').default;

const openPanel = async() => {
  const trigger = screen.getByRole('button', { name: /알림 열기/ });
  await userEvent.click(trigger);
  await waitFor(() => expect(screen.getByText('모두 읽음')).toBeInTheDocument());
};

describe('NotificationDropdown.handleMarkAllRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCtx.unreadSystemCount = 0;
    mockCtx.unreadMessageCount = 5;
  });

  it('"모두 읽음" 클릭 시 markAllMessagesAsRead 가 단일 호출됨 (기존 for-loop 패턴 제거 확인)', async() => {
    render(<NotificationDropdown />);
    await openPanel();
    await userEvent.click(screen.getByText('모두 읽음'));

    await waitFor(() => {
      expect(mockCtx.markAllMessagesAsRead).toHaveBeenCalledTimes(1);
    });
    expect(mockCtx.markAllMessagesAsRead).toHaveBeenCalledWith();
    expect(mockCtx.markMessageAsRead).not.toHaveBeenCalled();
  });

  it('"모두 읽음" 클릭 후 refreshNotifications + loadUnreadCount 호출', async() => {
    render(<NotificationDropdown />);
    await openPanel();
    await userEvent.click(screen.getByText('모두 읽음'));

    await waitFor(() => {
      expect(mockCtx.refreshNotifications).toHaveBeenCalled();
      expect(mockCtx.loadUnreadCount).toHaveBeenCalled();
    });
  });

  it('unreadSystemCount > 0 인 경우 system 일괄 + 메시지 일괄 모두 1회 호출', async() => {
    mockCtx.unreadSystemCount = 3;
    render(<NotificationDropdown />);
    await openPanel();
    await userEvent.click(screen.getByText('모두 읽음'));

    await waitFor(() => {
      expect(mockCtx.markAllSystemNotificationsAsRead).toHaveBeenCalledTimes(1);
      expect(mockCtx.markAllMessagesAsRead).toHaveBeenCalledTimes(1);
    });
  });

  it('unreadSystemCount === 0 이면 system 일괄 호출은 스킵', async() => {
    mockCtx.unreadSystemCount = 0;
    mockCtx.unreadMessageCount = 5;
    render(<NotificationDropdown />);
    await openPanel();
    await userEvent.click(screen.getByText('모두 읽음'));

    await waitFor(() => {
      expect(mockCtx.markAllMessagesAsRead).toHaveBeenCalledTimes(1);
    });
    expect(mockCtx.markAllSystemNotificationsAsRead).not.toHaveBeenCalled();
  });

  it('메시지 일괄 API 실패 시에도 refreshNotifications + loadUnreadCount 는 호출 (silent error 흡수)', async() => {
    mockCtx.markAllMessagesAsRead.mockRejectedValueOnce(new Error('server down'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<NotificationDropdown />);
    await openPanel();
    await userEvent.click(screen.getByText('모두 읽음'));

    await waitFor(() => {
      expect(mockCtx.refreshNotifications).toHaveBeenCalled();
      expect(mockCtx.loadUnreadCount).toHaveBeenCalled();
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
