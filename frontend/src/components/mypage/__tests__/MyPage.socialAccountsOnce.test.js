/**
 * MyPage — 진입 시 소셜 계정 API 1회.
 * silent checkSession 이 같은 사용자를 새 객체로 바꿔도(세션 ping·current-user 재조회)
 * 프로필·소셜 계정 로드가 다시 돌지 않는다. userId 가 바뀔 때만 다시 로드한다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MyPage from '../MyPage';

const mockSession = { user: null, setModalOpen: () => {} };

jest.mock('../../../contexts/SessionContext', () => {
  const { createContext } = jest.requireActual('react');
  const SessionContext = createContext(null);
  return {
    __esModule: true,
    SessionContext,
    default: SessionContext,
    useSession: () => mockSession
  };
});

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="mock-admin-layout">{children}</div>
}));

jest.mock('../../client/ClientWebPageShell', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="mock-client-shell">
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

jest.mock('../../../services/clientShopService', () => ({
  fetchShopCart: jest.fn(() => Promise.resolve({ lines: [{ skuCode: 'A', quantity: 2 }] }))
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    user: null,
    getUser: jest.fn(() => null),
    checkSession: jest.fn(() => Promise.resolve()),
    notifyListeners: jest.fn(),
    startProfileEditing: jest.fn(),
    endProfileEditing: jest.fn()
  }
}));

jest.mock('../../../utils/mypageApi', () => ({
  __esModule: true,
  default: {
    getProfileInfo: jest.fn(),
    updateProfileInfo: jest.fn(),
    getSocialAccounts: jest.fn(() => Promise.resolve([])),
    getWithdrawalStatus: jest.fn(() => Promise.resolve({ lifecycleState: 'ACTIVE' })),
    getOAuth2Url: jest.fn(),
    unlinkSocialAccount: jest.fn()
  }
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (String(url).includes('privacy-consent')) {
        return Promise.resolve({
          privacyConsent: true,
          termsConsent: true,
          marketingConsent: false,
          consentDate: '2026-09-01T00:00:00'
        });
      }
      if (String(url).includes('clients/settings')) {
        return Promise.resolve({ notifications: { email: true, sms: false, push: true } });
      }
      return Promise.resolve([]);
    }),
    post: jest.fn(() => Promise.resolve({})),
    put: jest.fn(() => Promise.resolve({}))
  }
}));

const mypageApi = require('../../../utils/mypageApi').default;

const CLIENT_USER = { id: 4, role: 'CLIENT', name: '최내담', email: 'cl@example.test' };
const CLIENT_PROFILE = { name: '최내담', email: 'cl@example.test', phone: '01055556666' };

const renderPage = () => render(
  <MemoryRouter initialEntries={['/client/mypage']}>
    <MyPage />
  </MemoryRouter>
);

const flush = () => act(async() => {
  await Promise.resolve();
});

describe('MyPage 소셜 계정 진입 로드 1회', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockSession.user = { ...CLIENT_USER };
    localStorage.setItem('userInfo', JSON.stringify(CLIENT_USER));
    mypageApi.getProfileInfo.mockResolvedValue(CLIENT_PROFILE);
    mypageApi.getSocialAccounts.mockResolvedValue([]);
  });

  it('진입 시 getSocialAccounts·getProfileInfo 를 각각 1번만 호출한다', async() => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('mypage-layout')).toBeInTheDocument());
    await waitFor(() => expect(mypageApi.getSocialAccounts).toHaveBeenCalled());
    await flush();
    expect(mypageApi.getSocialAccounts).toHaveBeenCalledTimes(1);
    expect(mypageApi.getProfileInfo).toHaveBeenCalledTimes(1);
  });

  it('세션 재확인으로 같은 사용자가 새 객체가 되어도 다시 부르지 않는다', async() => {
    const { rerender } = renderPage();
    await waitFor(() => expect(mypageApi.getSocialAccounts).toHaveBeenCalledTimes(1));

    for (let i = 0; i < 3; i += 1) {
      mockSession.user = { ...CLIENT_USER, lastCheckedAt: i };
      rerender(
        <MemoryRouter initialEntries={['/client/mypage']}>
          <MyPage />
        </MemoryRouter>
      );
      // eslint-disable-next-line no-await-in-loop
      await flush();
    }

    expect(mypageApi.getSocialAccounts).toHaveBeenCalledTimes(1);
    expect(mypageApi.getProfileInfo).toHaveBeenCalledTimes(1);
  });

  it('다른 사용자(userId 변경)로 바뀌면 다시 로드한다', async() => {
    const { rerender } = renderPage();
    await waitFor(() => expect(mypageApi.getSocialAccounts).toHaveBeenCalledTimes(1));

    mockSession.user = { ...CLIENT_USER, id: 99, name: '다른 사용자' };
    rerender(
      <MemoryRouter initialEntries={['/client/mypage']}>
        <MyPage />
      </MemoryRouter>
    );
    await waitFor(() => expect(mypageApi.getSocialAccounts).toHaveBeenCalledTimes(2));
  });
});
