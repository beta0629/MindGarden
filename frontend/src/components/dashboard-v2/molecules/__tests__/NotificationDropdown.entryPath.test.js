/**
 * GNB 「알림 전체 보기」 — 내담자만 내 알림 탭.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CLIENT_NOTIFICATIONS_ENTRY_PATH } from '../../../../constants/notificationTabs';

const sessionState = { user: { id: 3, role: 'CONSULTANT' } };

jest.mock('../../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    unreadSystemCount: 0,
    unreadMessageCount: 0,
    refreshNotifications: jest.fn(),
    loadUnreadCount: jest.fn(() => Promise.resolve()),
    markSystemNotificationAsRead: jest.fn(),
    markAllSystemNotificationsAsRead: jest.fn(() => Promise.resolve()),
    markMessageAsRead: jest.fn(() => Promise.resolve()),
    markAllMessagesAsRead: jest.fn(() => Promise.resolve({ updatedCount: 0 }))
  })
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => sessionState
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

const NotificationDropdown = require('../NotificationDropdown').default;

const openFooter = async() => {
  render(
    <MemoryRouter>
      <NotificationDropdown />
    </MemoryRouter>
  );
  await userEvent.click(screen.getByRole('button', { name: /알림 열기/ }));
  return screen.findByRole('link', { name: '알림 전체 보기' });
};

describe('NotificationDropdown 알림 전체 보기', () => {
  beforeEach(() => {
    sessionState.user = { id: 3, role: 'CONSULTANT' };
  });

  test('상담사는 쿼리 없는 /notifications', async() => {
    const link = await openFooter();
    expect(link).toHaveAttribute('href', '/notifications');
  });

  test('내담자는 /notifications?tab=personal', async() => {
    sessionState.user = { id: 7, role: 'CLIENT' };
    const link = await openFooter();
    await waitFor(() => {
      expect(link).toHaveAttribute('href', CLIENT_NOTIFICATIONS_ENTRY_PATH);
    });
  });
});
