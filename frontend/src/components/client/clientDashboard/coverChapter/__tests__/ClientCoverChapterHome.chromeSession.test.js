/**
 * ClientCoverChapterHome — 세션 로그인 시 TopChrome에 isLoggedIn/userName/onLogout 전달
 *
 * @author CoreSolution
 * @since 2026-10-29
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ClientCoverChapterHome from '../ClientCoverChapterHome';
import { CLIENT_LOBBY_HERO_PRIORITY } from '../../constants';
import { CLIENT_WEB_LOGIN } from '../../../../../constants/clientWebChromeConstants';

const mockUseSession = jest.fn();

jest.mock('../../../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('../../../../../hooks/useBranding', () => ({
  useBranding: () => ({ brandingInfo: null })
}));

jest.mock('../../../../../hooks/useClientWebLogoutConfirm', () => ({
  useClientWebLogoutConfirm: () => ({
    logoutLabel: '로그아웃',
    openConfirm: jest.fn(),
    confirmProps: { isOpen: false, onConfirm: jest.fn(), onCancel: jest.fn() }
  })
}));

jest.mock('../../../../../contexts/NotificationContext', () => ({
  useNotification: () => ({ unreadMessageCount: 0, unreadSystemCount: 0 })
}));

jest.mock('../CoverPanel', () => () => <div data-testid="cover-panel-stub" />);
jest.mock('../NextSheet', () => () => null);
jest.mock('../SessionChapter', () => () => null);
jest.mock('../GuideChapter', () => () => null);
jest.mock('../ClientMinimalDock', () => () => null);
jest.mock('../CoverMenuDrawer', () => () => null);
jest.mock('../../../../common/ConfirmModal', () => () => null);

describe('ClientCoverChapterHome chrome session bridge', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      user: { name: '김내담', nickname: '내담닉' },
      isLoggedIn: true
    });
  });

  test('로그인 세션 → 헤더에 「로그인」없음', () => {
    render(
      <MemoryRouter>
        <ClientCoverChapterHome
          user={{ name: '김내담' }}
          heroPriority={CLIENT_LOBBY_HERO_PRIORITY.QUIET_DAY}
          nextSchedule={null}
          remainingSessions={0}
          sessionMeta={{ rows: [] }}
          paymentSummary={{}}
          mappings={[]}
          consultationData={{}}
          isLoading={false}
          hasError={false}
          onRetry={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: CLIENT_WEB_LOGIN })).not.toBeInTheDocument();
    expect(screen.getByText('김내담')).toBeInTheDocument();
  });

  test('user prop 없고 session만 있어도 로그인 CTA 숨김', () => {
    mockUseSession.mockReturnValue({
      user: { nickname: '세션닉' },
      isLoggedIn: true
    });

    render(
      <MemoryRouter>
        <ClientCoverChapterHome
          user={null}
          heroPriority={CLIENT_LOBBY_HERO_PRIORITY.QUIET_DAY}
          nextSchedule={null}
          remainingSessions={0}
          sessionMeta={{ rows: [] }}
          paymentSummary={{}}
          mappings={[]}
          consultationData={{}}
          isLoading={false}
          hasError={false}
          onRetry={jest.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.queryByRole('link', { name: CLIENT_WEB_LOGIN })).not.toBeInTheDocument();
  });
});
