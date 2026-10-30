/**
 * 헤더 종 — 알림 화면에서만 현재 위치.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientWebTopChrome from '../ClientWebTopChrome';
import { CLIENT_DASHBOARD_ROUTES } from '../../../constants/clientDashboardRoutes';
import { CLIENT_WEB_NOTIFICATIONS_LINK_TEST_ID } from '../../../constants/clientWebChromeConstants';
import { CLIENT_NOTIFICATIONS_ENTRY_PATH } from '../../../constants/notificationTabs';

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({ user: null, sessionInfo: null })
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({ unreadMessageCount: 0, unreadSystemCount: 1 })
}));

const renderChrome = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <ClientWebTopChrome userName="이내담" onLogout={() => {}} nav={null} />
  </MemoryRouter>
);

describe('ClientWebTopChrome 알림 현재 위치', () => {
  test('/notifications 에서만 aria-current=page', () => {
    const { unmount } = renderChrome(CLIENT_DASHBOARD_ROUTES.NOTIFICATIONS);
    const bell = screen.getByTestId(CLIENT_WEB_NOTIFICATIONS_LINK_TEST_ID);
    expect(bell).toHaveAttribute('href', CLIENT_NOTIFICATIONS_ENTRY_PATH);
    expect(bell).toHaveAttribute('aria-current', 'page');
    expect(bell.className).toContain('client-web-topchrome__icon-link--current');
    unmount();

    renderChrome(CLIENT_DASHBOARD_ROUTES.DASHBOARD);
    const elsewhere = screen.getByTestId(CLIENT_WEB_NOTIFICATIONS_LINK_TEST_ID);
    expect(elsewhere).not.toHaveAttribute('aria-current');
    expect(elsewhere.className).not.toContain('client-web-topchrome__icon-link--current');
  });
});
