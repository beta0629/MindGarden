/**
 * GnbRight 단위 테스트 — GNB 우측 검색바 + 아이콘 + 프로필 클러스터
 *
 * @see docs/standards/TESTING_STANDARD.md
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import GnbRight from '../GnbRight';
import { DarkModeProvider } from '../../../../contexts/DarkModeContext';

const sessionState = { user: null, sessionInfo: null };

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/admin/dashboard' }),
  Link: ({ children, ...rest }) => <a {...rest}>{children}</a>
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: sessionState.user,
    sessionInfo: sessionState.sessionInfo
  })
}));

jest.mock('../../../../hooks/useBranding', () => ({
  useBranding: () => ({ brandingInfo: null })
}));

jest.mock('../../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    unreadSystemCount: 0,
    unreadMessageCount: 0,
    refreshNotifications: jest.fn(),
    loadUnreadCount: jest.fn(() => Promise.resolve()),
    markSystemNotificationAsRead: jest.fn(),
    markAllSystemNotificationsAsRead: jest.fn(() => Promise.resolve()),
    markMessageAsRead: jest.fn(() => Promise.resolve()),
    markAllMessagesAsRead: jest.fn(() => Promise.resolve())
  })
}));

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { messages: [], notifications: [] } }))
  }
}));

jest.mock('../../../../utils/consultationMessagesApi', () => ({
  getConsultationMessagesListPath: () => '/api/v1/consultation-messages/consultant/1'
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, def) => def || key })
}));

const PROFILE_MENU_TRIGGER_ARIA_LABEL = '프로필 메뉴';

describe('GnbRight', () => {
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
    sessionState.user = defaultUser;
    sessionState.sessionInfo = sessionInfoWithRemaining;
  });

  it('SearchInput과 ProfileDropdown이 렌더된다', () => {
    render(
      <DarkModeProvider>
        <GnbRight searchValue="" onSearchChange={jest.fn()} />
      </DarkModeProvider>
    );
    expect(screen.getByLabelText('통합 검색')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('통합 검색...')).toBeInTheDocument();
    expect(screen.getByText('테스트 사용자')).toBeInTheDocument();
  });

  it('.mg-v2-gnb-right 안에 tenant cluster가 있고 EntityRowActions는 없다', () => {
    const { container } = render(
      <DarkModeProvider>
        <GnbRight searchValue="" onSearchChange={jest.fn()} />
      </DarkModeProvider>
    );
    const gnbRight = container.querySelector('.mg-v2-gnb-right');
    expect(gnbRight).toBeTruthy();
    expect(gnbRight.querySelector('.mg-v2-tenant-header-cluster')).toBeTruthy();
    expect(gnbRight.querySelector('.mg-v2-entity-row-actions')).toBeNull();
  });

  it('프로필 메뉴 aria-label 트리거가 정확히 하나다', () => {
    render(
      <DarkModeProvider>
        <GnbRight searchValue="" onSearchChange={jest.fn()} />
      </DarkModeProvider>
    );
    expect(
      screen.getAllByRole('button', { name: PROFILE_MENU_TRIGGER_ARIA_LABEL })
    ).toHaveLength(1);
  });
});
