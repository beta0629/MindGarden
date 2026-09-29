/**
 * ClientSettings — editable profile form (PortOne P0 gate) · KR mobile fail-closed
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../../constants/clientWebSuiteConstants';
import { API_ERROR_MESSAGES, API_STATUS, CLIENT_SETTINGS_API, MYPAGE_API } from '../../../constants/api';
import { SHOP_PAYMENT_LAUNCH_COPY } from '../../../constants/clientShopConstants';
import ClientSettings from '../ClientSettings';

const mockCheckSession = jest.fn().mockResolvedValue(true);
const mockUseSession = jest.fn();
const mockNotifyListeners = jest.fn();
const mockLogout = jest.fn().mockResolvedValue(undefined);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => ({
    unreadCount: 0,
    unreadMessageCount: 0,
    unreadSystemCount: 0
  })
}));

jest.mock('../../../hooks/useBranding', () => ({
  useBranding: () => ({
    brandingInfo: { companyName: '햇살상담센터' },
    isLoading: false
  })
}));

jest.mock('../../../hooks/useClientWebLogoutConfirm', () => ({
  useClientWebLogoutConfirm: () => ({
    isOpen: false,
    openConfirm: jest.fn(),
    closeConfirm: jest.fn(),
    confirmLogout: jest.fn()
  })
}));

jest.mock('../../../services/clientShopService', () => ({
  fetchShopCart: jest.fn().mockResolvedValue({ lines: [], subtotalMinor: 0 }),
  mergeGuestShopCartIntoServer: jest.fn().mockResolvedValue({ merged: false, lines: [] })
}));

jest.mock(
  '../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../common/ConfirmModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="unified-loading">loading</div>
}));

jest.mock('../../mypage/components/EmailChangeModal', () => ({
  __esModule: true,
  default: ({ isOpen }) => (isOpen ? <div data-testid="email-change-modal-open" /> : null)
}));

jest.mock('../../mypage/components/PhoneChangeModal', () => ({
  __esModule: true,
  default: ({ isOpen, onSuccess }) =>
    (isOpen ? (
      <div data-testid="phone-change-modal-open">
        <button
          type="button"
          data-testid="phone-change-modal-success"
          onClick={() =>
            onSuccess?.({
              phone: '01055556666',
              isPhoneVerified: true,
              phoneVerifiedAt: '2026-09-18T00:00:00'
            })
          }
        >
          otp-success
        </button>
      </div>
    ) : null)
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock('../../../utils/sessionManager', () => {
  const state = {
    user: null
  };
  const notify = jest.fn((...args) => mockNotifyListeners(...args));
  const api = {
    get user() {
      return state.user;
    },
    set user(value) {
      state.user = value;
    },
    setUser: jest.fn((user) => {
      state.user = user;
      notify();
    }),
    getUser: jest.fn(() => state.user),
    notifyListeners: notify,
    logout: jest.fn((...args) => mockLogout(...args)),
    checkSession: jest.fn()
  };
  return {
    __esModule: true,
    default: api,
    sessionManager: api
  };
});

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    error: jest.fn()
  }
}));

import StandardizedApi from '../../../utils/standardizedApi';
import sessionManager from '../../../utils/sessionManager';
import notificationManager from '../../../utils/notification';

const SESSION_USER = {
  id: 101,
  name: '이재학',
  email: 'lee@example.com',
  phone: '01011112222',
  role: 'CLIENT',
  tenant: { tenantId: 'tenant-sunshine', name: '햇살상담센터' }
};

describe('ClientSettings — profile form · PortOne session fields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // clearAllMocks 가 setUser 구현을 지우므로 재바인딩
    sessionManager.setUser.mockImplementation((user) => {
      sessionManager.user = user;
      mockNotifyListeners();
    });
    sessionManager.getUser.mockImplementation(() => sessionManager.user);
    sessionManager.user = { ...SESSION_USER };
    mockCheckSession.mockResolvedValue(true);
    mockUseSession.mockReturnValue({
      user: { ...SESSION_USER },
      isLoggedIn: true,
      isLoading: false,
      hasCheckedSession: true,
      checkSession: mockCheckSession,
      logout: jest.fn(),
      setModalOpen: jest.fn()
    });
    StandardizedApi.get.mockImplementation((url) => {
      if (url === MYPAGE_API.GET_INFO) {
        return Promise.resolve({
          name: '이재학',
          email: 'lee@example.com',
          phone: '01011112222'
        });
      }
      if (url === CLIENT_SETTINGS_API.GET) {
        return Promise.resolve({
          notifications: { email: true, sms: false, push: true }
        });
      }
      return Promise.resolve({});
    });
    StandardizedApi.put.mockResolvedValue({
      name: '김민수',
      email: 'lee@example.com',
      phone: '01098765432'
    });
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ClientSettings />
      </MemoryRouter>
    );

  test('renders profile form fields with testids', async() => {
    renderPage();

    expect(await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PAGE)).toBeInTheDocument();
    expect(
      await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PROFILE_FORM)
    ).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_FULL_NAME)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_EMAIL)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_SAVE)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_EMAIL_CHANGE)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_FULL_NAME)).toHaveValue('이재학');
    });
    expect(StandardizedApi.get).toHaveBeenCalledWith(MYPAGE_API.GET_INFO);
    expect(StandardizedApi.get).toHaveBeenCalledWith(CLIENT_SETTINGS_API.GET);
  });

  test('invalid KR mobile blocks save (fail-closed) — no PUT', async() => {
    renderPage();
    await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE);

    const phoneInput = screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE);
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '021234567');

    await userEvent.click(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_SAVE));

    expect(
      await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PROFILE_ERROR)
    ).toHaveTextContent(CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_INVALID);
    expect(StandardizedApi.put).not.toHaveBeenCalled();
    expect(mockNotifyListeners).not.toHaveBeenCalled();
    expect(mockCheckSession).not.toHaveBeenCalled();
  });

  test('valid save PUTs profile and refreshes session name/phone/phoneNumber', async() => {
    renderPage();
    await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_FULL_NAME);

    const nameInput = screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_FULL_NAME);
    const phoneInput = screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '김민수');
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '010-9876-5432');

    await userEvent.click(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_SAVE));

    await waitFor(() => {
      expect(StandardizedApi.put).toHaveBeenCalledWith(MYPAGE_API.UPDATE_INFO, {
        name: '김민수',
        phone: '01098765432'
      });
    });

    expect(sessionManager.user.name).toBe('김민수');
    expect(sessionManager.user.phone).toBe('01098765432');
    expect(sessionManager.user.phoneNumber).toBe('01098765432');
    expect(sessionManager.user.mobile).toBe('01098765432');
    expect(sessionManager.user.isPhoneVerified).toBe(false);
    expect(sessionManager.setUser).toHaveBeenCalled();
    expect(mockNotifyListeners).toHaveBeenCalled();
    expect(mockCheckSession).toHaveBeenCalledWith(true, { silent: true });
    expect(notificationManager.show).toHaveBeenCalledWith(
      CLIENT_WEB_SUITE_COPY.SETTINGS_SAVE_SUCCESS,
      'success'
    );
  });

  test('OTP success: checkSession 이 verified 를 빼도 setUser 재병합으로 유지한다', async() => {
    let checkCount = 0;
    mockCheckSession.mockImplementation(async() => {
      checkCount += 1;
      if (checkCount === 1 && sessionManager.user) {
        sessionManager.user = {
          id: sessionManager.user.id,
          name: sessionManager.user.name,
          email: sessionManager.user.email,
          phone: sessionManager.user.phone,
          phoneNumber: sessionManager.user.phoneNumber,
          mobile: sessionManager.user.mobile,
          role: sessionManager.user.role
        };
      }
      return true;
    });

    renderPage();
    await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE_VERIFY);
    await userEvent.click(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE_VERIFY));
    await userEvent.click(screen.getByTestId('phone-change-modal-success'));

    await waitFor(() => {
      expect(sessionManager.user.isPhoneVerified).toBe(true);
    });
    expect(sessionManager.user.phone).toBe('01055556666');
    expect(sessionManager.user.phoneNumber).toBe('01055556666');
    expect(sessionManager.user.mobile).toBe('01055556666');
    expect(sessionManager.user.phoneVerified).toBe(true);
    expect(sessionManager.setUser).toHaveBeenCalled();
    expect(mockCheckSession.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  test('phone verify CTA opens PhoneChangeModal; OTP success refreshes verified session', async() => {
    renderPage();
    await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE_VERIFY);

    expect(
      screen.getByText(CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_UNVERIFIED_HINT)
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE_VERIFY));
    expect(screen.getByTestId('phone-change-modal-open')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('phone-change-modal-success'));

    await waitFor(() => {
      expect(sessionManager.user.isPhoneVerified).toBe(true);
    });
    expect(sessionManager.user.phone).toBe('01055556666');
    expect(sessionManager.user.phoneNumber).toBe('01055556666');
    expect(sessionManager.user.phoneVerified).toBe(true);
    expect(mockNotifyListeners).toHaveBeenCalled();
    expect(mockCheckSession).toHaveBeenCalledWith(true, { silent: true });
    expect(
      await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE_VERIFIED_STATUS)
    ).toHaveTextContent(CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_VERIFIED_BADGE);
  });

  test('changing phone digits clears local verified badge until OTP', async() => {
    StandardizedApi.get.mockImplementation((url) => {
      if (url === MYPAGE_API.GET_INFO) {
        return Promise.resolve({
          name: '이재학',
          email: 'lee@example.com',
          phone: '01011112222',
          isPhoneVerified: true
        });
      }
      if (url === CLIENT_SETTINGS_API.GET) {
        return Promise.resolve({
          notifications: { email: true, sms: false, push: true }
        });
      }
      return Promise.resolve({});
    });

    renderPage();
    expect(
      await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE_VERIFIED_STATUS)
    ).toBeInTheDocument();

    const phoneInput = screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE);
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '01099998888');

    await waitFor(() => {
      expect(
        screen.queryByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_PHONE_VERIFIED_STATUS)
      ).not.toBeInTheDocument();
    });
    expect(
      screen.getByText(CLIENT_WEB_SUITE_COPY.SETTINGS_PHONE_UNVERIFIED_HINT)
    ).toBeInTheDocument();
  });

  test('5xx settings load shows loadError once, not spinner or login', async() => {
    const serverErr = new Error(API_ERROR_MESSAGES.SERVER_ERROR);
    serverErr.status = API_STATUS.INTERNAL_SERVER_ERROR;
    StandardizedApi.get.mockImplementation((url) => {
      if (url === MYPAGE_API.GET_INFO) {
        return Promise.resolve({
          name: '이재학',
          email: 'lee@example.com',
          phone: '01011112222'
        });
      }
      if (url === CLIENT_SETTINGS_API.GET) {
        return Promise.reject(serverErr);
      }
      return Promise.resolve({});
    });

    renderPage();

    expect(
      await screen.findByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_LOAD_ERROR)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('unified-loading')).not.toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.SETTINGS_RETRY)).toBeInTheDocument();
    expect(StandardizedApi.get).toHaveBeenCalledWith(CLIENT_SETTINGS_API.GET);
    const settingsGets = StandardizedApi.get.mock.calls.filter(
      (call) => call[0] === CLIENT_SETTINGS_API.GET
    );
    expect(settingsGets).toHaveLength(1);
  });

  test('PortOne customer copy points to /client/settings; email copy is not a checkout gate', () => {
    expect(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED).toContain('/client/settings');
    expect(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_FULL_NAME_REQUIRED).toContain('/client/settings');
    expect(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED).toContain('/client/settings');
    expect(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_UNVERIFIED).toContain('/client/settings');
    expect(SHOP_PAYMENT_LAUNCH_COPY.ORPHAN_ORDER_CANCELLED).toContain('/client/settings');
    expect(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_EMAIL_REQUIRED).toContain('결제는 휴대폰 인증만');
    expect(SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_FULL_NAME_REQUIRED).toContain('결제는 휴대폰 인증만');
    expect(SHOP_PAYMENT_LAUNCH_COPY.ORPHAN_ORDER_CANCELLED).toContain('휴대폰 인증');
    expect(SHOP_PAYMENT_LAUNCH_COPY.ORPHAN_ORDER_CANCELLED).not.toContain('이메일·이름');
  });
});
