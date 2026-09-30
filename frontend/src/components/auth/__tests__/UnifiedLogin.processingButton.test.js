/**
 * UnifiedLogin 로그인 버튼 「처리중」 상태 회귀 잠금
 *
 * fa093106c (PR 번호 미확인 — release/prod 직접 반영 후 #1283 sync 로 release/dev 반영):
 * 로그인 POST 성공 뒤 checkSession(current-user)이 끝나지 않아도 버튼이 「처리중...」에 고정되지 않는다.
 * 기존 sessionManager.callerCap.test.js 는 세션 매니저 상한만 보므로, 여기서는 화면 버튼 상태를 잠근다.
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

const LOGIN_BUTTON_KEY = 'auth:unifiedLogin.loginButton';

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
    accessToken: 'access-test',
    refreshToken: 'refresh-test'
  }
};

const createDeferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const renderLogin = () => render(
  <MemoryRouter initialEntries={['/login']}>
    <UnifiedLogin />
  </MemoryRouter>
);

const fillAndSubmit = async(container) => {
  const form = container.querySelector('form');
  fireEvent.change(form.querySelector('input[name="email"]'), { target: { value: 'client@example.test' } });
  fireEvent.change(form.querySelector('input[name="password"]'), { target: { value: 'pw-test-1!' } });
  await act(async() => {
    fireEvent.submit(form);
  });
};

const getSubmitButton = (container) => container.querySelector('form button[type="submit"]');

describe('UnifiedLogin 로그인 버튼 처리중 상태', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async() => ({}) });
    mockRedirectToDynamicDashboard.mockResolvedValue(undefined);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('fa093106c login 처리중 — 로그인 요청이 도는 동안 버튼은 「처리중...」 + 비활성', async() => {
    const pending = createDeferred();
    mockLogin.mockReturnValue(pending.promise);
    const { container } = renderLogin();

    await fillAndSubmit(container);

    const button = getSubmitButton(container);
    expect(button).toHaveTextContent(ERP_MG_BUTTON_LOADING_TEXT);
    expect(button).toBeDisabled();
    expect(mockLogin).toHaveBeenCalledTimes(1);

    await act(async() => {
      pending.resolve({ success: false, message: 'x' });
    });
  });

  test('fa093106c login 처리중 — 로그인 성공 후 세션 확인(checkSession)이 끝나지 않아도 버튼이 「처리중...」에 고정되지 않음', async() => {
    mockLogin.mockResolvedValue(LOGIN_SUCCESS);
    mockCheckSession.mockReturnValue(new Promise(() => {}));
    const { container } = renderLogin();

    await fillAndSubmit(container);

    await waitFor(() => expect(mockRedirectToDynamicDashboard).toHaveBeenCalled());
    await waitFor(() => {
      expect(getSubmitButton(container)).toHaveTextContent(LOGIN_BUTTON_KEY);
    });
    expect(getSubmitButton(container)).not.toHaveTextContent(ERP_MG_BUTTON_LOADING_TEXT);
    expect(getSubmitButton(container)).not.toBeDisabled();
    expect(mockCheckSession).toHaveBeenCalledWith(true, { background: true });
  });

  test('fa093106c login 처리중 — 로그인 실패 응답이면 버튼이 즉시 원래 문구로 돌아옴', async() => {
    mockLogin.mockResolvedValue({ success: false, message: 'x' });
    const { container } = renderLogin();

    await fillAndSubmit(container);

    await waitFor(() => {
      expect(getSubmitButton(container)).toHaveTextContent(LOGIN_BUTTON_KEY);
    });
    expect(getSubmitButton(container)).not.toBeDisabled();
    expect(mockCheckSession).not.toHaveBeenCalled();
  });
});
