/**
 * UnifiedLogin — 입력 비밀번호·로그인 응답 토큰이 콘솔에 남지 않는지 잠금.
 *
 * .dev(d0f4882) 측정: 입력 핸들러·formData 갱신 로그가 비밀번호 원문을 console.log 로 출력했다.
 * console 의 모든 레벨(log·debug·info·warn·error) 인자를 문자열로 펼쳐 비밀번호·토큰이 없는지 본다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

import React from 'react';
import { inspect } from 'util';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const PASSWORD = 'pw-secret-L-7f3a!';
const ACCESS_TOKEN = 'access-token-L-91b2';
const REFRESH_TOKEN = 'refresh-token-L-c4d5';
const CONSOLE_LEVELS = ['log', 'debug', 'info', 'warn', 'error'];

const mockCheckSession = jest.fn();
const mockLogin = jest.fn();
const mockRedirectToDynamicDashboard = jest.fn();

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'ko' } }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  SessionContext: jest.requireActual('react').createContext(null),
  useSession: () => ({
    checkSession: mockCheckSession,
    setDuplicateLoginModal: jest.fn(),
    duplicateLoginModal: { isOpen: false },
    user: null
  })
}));

jest.mock('../../../utils/ajax', () => ({
  __esModule: true,
  authAPI: { login: (...args) => mockLogin(...args) }
}));

jest.mock('../../../utils/sessionManager', () => ({
  __esModule: true,
  sessionManager: {
    setUser: jest.fn(),
    getUser: jest.fn(() => null)
  }
}));

jest.mock('../../../utils/sessionAuthPolicy', () => ({
  __esModule: true,
  markJustLoggedIn: jest.fn()
}));

jest.mock('../../../utils/socialLogin', () => ({
  __esModule: true,
  appleLogin: jest.fn(),
  googleLogin: jest.fn(),
  kakaoLogin: jest.fn(),
  naverLogin: jest.fn()
}));

jest.mock('../../../services/oauth2/googleWebOAuth2Service', () => ({
  __esModule: true,
  requestGoogleSocialLogin: jest.fn()
}));

jest.mock('../../../services/clientShopService', () => ({
  __esModule: true,
  mergeGuestShopCartIntoServer: jest.fn().mockResolvedValue({ merged: false, lines: [] })
}));

jest.mock('../../../utils/tenantPublicHomeMeta', () => ({
  __esModule: true,
  fetchTenantPublicHomeMeta: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../../utils/dashboardUtils', () => ({
  __esModule: true,
  redirectToDynamicDashboard: (...args) => mockRedirectToDynamicDashboard(...args)
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

// eslint-disable-next-line import/first
import UnifiedLogin from '../UnifiedLogin';

const LOGIN_SUCCESS = {
  success: true,
  data: {
    user: { id: 101, role: 'CLIENT', tenantId: 'tenant-test' },
    accessToken: ACCESS_TOKEN,
    refreshToken: REFRESH_TOKEN
  }
};


const renderLogin = () => render(
  <MemoryRouter initialEntries={['/login']}>
    <UnifiedLogin />
  </MemoryRouter>
);

const typeAndSubmit = async(container) => {
  const form = container.querySelector('form');
  fireEvent.change(form.querySelector('input[name="email"]'), { target: { value: 'client@example.test' } });
  fireEvent.change(form.querySelector('input[name="password"]'), { target: { value: PASSWORD } });
  await act(async() => {
    fireEvent.submit(form);
  });
};

const collectConsoleOutput = (spies) => spies
  .flatMap((spy) => spy.mock.calls)
  .map((args) => args.map((arg) => (typeof arg === 'string' ? arg : inspect(arg, { depth: 6 }))).join(' '))
  .join('\n');

describe('UnifiedLogin 콘솔 비밀번호 비노출', () => {
  const originalFetch = global.fetch;
  let spies;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async() => ({}) });
    mockRedirectToDynamicDashboard.mockResolvedValue(undefined);
    mockCheckSession.mockResolvedValue(undefined);
    spies = CONSOLE_LEVELS.map((level) => jest.spyOn(console, level).mockImplementation(() => {}));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    spies.forEach((spy) => spy.mockRestore());
  });

  test('입력·제출·성공 응답 처리 중 콘솔에 비밀번호와 토큰이 없다', async() => {
    mockLogin.mockResolvedValue(LOGIN_SUCCESS);
    const { container } = renderLogin();

    await typeAndSubmit(container);
    await waitFor(() => expect(mockRedirectToDynamicDashboard).toHaveBeenCalled());

    expect(mockLogin).toHaveBeenCalledWith(expect.objectContaining({ password: PASSWORD }));
    const output = collectConsoleOutput(spies);
    expect(output).not.toContain(PASSWORD);
    expect(output).not.toContain(ACCESS_TOKEN);
    expect(output).not.toContain(REFRESH_TOKEN);
  });

  test('로그인 실패 응답에서도 콘솔에 비밀번호가 없다', async() => {
    mockLogin.mockResolvedValue({ success: false, message: 'x' });
    const { container } = renderLogin();

    await typeAndSubmit(container);
    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));

    expect(collectConsoleOutput(spies)).not.toContain(PASSWORD);
  });

  test('로그인 요청이 예외로 끝나도 콘솔에 비밀번호가 없다', async() => {
    mockLogin.mockRejectedValue(new Error('network down'));
    const { container } = renderLogin();

    await typeAndSubmit(container);
    await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));

    expect(collectConsoleOutput(spies)).not.toContain(PASSWORD);
  });
});
