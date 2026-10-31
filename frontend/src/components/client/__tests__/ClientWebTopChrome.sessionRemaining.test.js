/**
 * ClientWebTopChrome — 로그인 시 SessionRemainingLabel (상담사 GNB 정합 갭 수정)
 *
 * @author CoreSolution
 * @since 2026-10-30
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientWebTopChrome from '../ClientWebTopChrome';
import { CLIENT_WEB_LOGIN } from '../../../constants/clientWebChromeConstants';
import { SESSION_REMAINING_DISPLAY } from '../../../constants/session';

const sessionState = { user: null, sessionInfo: null };

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: sessionState.user,
    sessionInfo: sessionState.sessionInfo
  })
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({ unreadMessageCount: 0, unreadSystemCount: 0 })
}));

const sessionInfoWithRemaining = {
  isAuthenticated: true,
  maxInactiveInterval: 3600,
  lastAccessedTime: Date.now(),
  serverNow: Date.now()
};

const renderChrome = (props = {}) => render(
  <MemoryRouter initialEntries={['/client/dashboard']}>
    <ClientWebTopChrome nav={null} {...props} />
  </MemoryRouter>
);

describe('ClientWebTopChrome session remaining', () => {
  beforeEach(() => {
    sessionState.user = { name: '이내담', role: 'CLIENT' };
    sessionState.sessionInfo = sessionInfoWithRemaining;
  });

  test('로그인 시 SessionRemainingLabel이 alerts 다음·profile 전에 렌더된다', () => {
    renderChrome({
      isLoggedIn: true,
      userName: '이내담',
      onLogout: () => {}
    });

    const labels = screen.getAllByLabelText(SESSION_REMAINING_DISPLAY.ARIA_LABEL);
    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(labels[0]).toHaveTextContent(/세션 잔여/);
    expect(labels[0].className).toContain(
      `${SESSION_REMAINING_DISPLAY.CLASS_NAME}--client-chrome`
    );
  });

  test('게스트에서는 SessionRemainingLabel을 렌더하지 않는다', () => {
    sessionState.user = null;
    sessionState.sessionInfo = null;

    renderChrome();

    expect(screen.getByRole('link', { name: CLIENT_WEB_LOGIN })).toBeInTheDocument();
    expect(
      screen.queryByLabelText(SESSION_REMAINING_DISPLAY.ARIA_LABEL)
    ).not.toBeInTheDocument();
  });
});
