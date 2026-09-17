/**
 * ClientDashboard — v4 상담실 로비 smoke
 *
 * @author Core Solution
 * @since 2026-09-17
 */

import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StandardizedApi from '../../../utils/standardizedApi';
import {
  CLIENT_LOBBY_CTA_DETAILS,
  CLIENT_LOBBY_CTA_PAYMENT,
  CLIENT_LOBBY_CTA_PICK_SESSION,
  CLIENT_LOBBY_FOOTER,
  CLIENT_LOBBY_HERO_TEST_ID,
  CLIENT_LOBBY_LOGOUT,
  CLIENT_LOBBY_LOGOUT_CANCEL,
  CLIENT_LOBBY_LOGOUT_CONFIRM,
  CLIENT_LOBBY_STATUS_TEST_ID,
  CLIENT_LOBBY_TEST_ID
} from '../clientDashboard/constants';
import ClientDashboard from '../ClientDashboard';

const MOCK_TENANT_CENTER = '햇살상담센터';
const MOCK_BRAND_WORD = 'Sunshine Counseling';

const mockUseSession = jest.fn();
const mockUseBranding = jest.fn();
const mockSessionGetUser = jest.fn();
const mockLogout = jest.fn();

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../common/ConfirmModal', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onClose, title, message, confirmText, cancelText }) => (
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>{confirmText}</button>
        <button type="button" onClick={onClose}>{cancelText}</button>
      </div>
    ) : null
  )
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => mockUseSession()
}));

jest.mock('../../../hooks/useBranding', () => ({
  useBranding: (...args) => mockUseBranding(...args)
}));

jest.mock('../../../utils/sessionManager', () => ({
  sessionManager: {
    getUser: () => mockSessionGetUser(),
    isLoggedIn: () => true,
    setUser: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn()
  }
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}));

jest.mock(
  '../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

const buildSessionUser = (overrides = {}) => ({
  id: 101,
  name: '이재학',
  role: 'CLIENT',
  tenant: { tenantId: 'tenant-sunshine', name: MOCK_TENANT_CENTER },
  ...overrides
});

const defaultApiImpl = (endpoint) => {
  if (String(endpoint).includes('schedules')) {
    return Promise.resolve([
      {
        id: 1,
        date: '2099-09-20',
        startTime: '14:00',
        endTime: '14:50',
        status: 'CONFIRMED',
        consultantName: '김선희',
        consultationMethod: 'FACE',
        notes: '대기실 10분 전 도착'
      }
    ]);
  }
  if (String(endpoint).includes('mappings/client')) {
    return Promise.resolve([
      {
        id: 10,
        status: 'ACTIVE',
        totalSessions: 10,
        usedSessions: 6,
        remainingSessions: 4,
        packageName: '마음돌봄 패키지',
        paymentDate: '2099-09-12',
        paymentStatus: 'CONFIRMED',
        consultantName: '김선희'
      },
      {
        id: 11,
        status: 'ACTIVE',
        totalSessions: 1,
        usedSessions: 0,
        remainingSessions: 2,
        packageName: '단회기',
        paymentDate: '2099-09-12',
        paymentStatus: 'CONFIRMED'
      }
    ]);
  }
  if (String(endpoint).includes('unread-count')) {
    return Promise.resolve({ unreadCount: 0 });
  }
  return Promise.resolve(null);
};

describe('ClientDashboard v4 상담실 로비', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    StandardizedApi.get.mockImplementation(defaultApiImpl);
    mockLogout.mockReset();
    mockLogout.mockResolvedValue(true);
    const sessionUser = buildSessionUser();
    mockUseSession.mockReturnValue({
      user: sessionUser,
      isLoggedIn: true,
      isLoading: false,
      checkSession: jest.fn(),
      logout: mockLogout,
      setModalOpen: jest.fn()
    });
    mockSessionGetUser.mockReturnValue(sessionUser);
    mockUseBranding.mockReturnValue({
      brandingInfo: {
        companyName: MOCK_TENANT_CENTER,
        companyNameEn: MOCK_BRAND_WORD
      },
      isLoading: false
    });
  });

  test('로비 셸 · ink 이름 · 히어로 · 예약 CTA 없음 · Admin LNB 없음', async() => {
    const { container } = render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>
    );

    expect(screen.getByTestId(CLIENT_LOBBY_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByTestId('admin-common-layout')).not.toBeInTheDocument();
    expect(container.querySelector('.mg-v2-ad-b0kla')).toBeNull();
    expect(container.querySelector('.client-dashboard__kpi-row')).toBeNull();

    expect(screen.getByText(MOCK_BRAND_WORD)).toBeInTheDocument();
    expect(screen.getByText(MOCK_TENANT_CENTER)).toBeInTheDocument();
    expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    expect(screen.queryByText('마인드가든')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('href', '/client/dashboard');
    expect(screen.getByRole('link', { name: '예정' })).toHaveAttribute('href', '/client/schedule');
    expect(screen.getByRole('link', { name: '회기' })).toHaveAttribute('href', '/client/session-management');
    expect(screen.getByRole('link', { name: '결제' })).toHaveAttribute('href', '/client/payment-history');
    expect(screen.getByRole('button', { name: CLIENT_LOBBY_LOGOUT })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId(CLIENT_LOBBY_HERO_TEST_ID)).toBeInTheDocument();
    });

    expect(screen.getByTestId(CLIENT_LOBBY_HERO_TEST_ID)).toHaveAttribute(
      'data-priority',
      'NEXT_APPOINTMENT'
    );
    expect(screen.getByText('다음 한 장')).toBeInTheDocument();
    expect(screen.getByText('다가오는 상담')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CLIENT_LOBBY_CTA_DETAILS })).toHaveAttribute(
      'href',
      '/client/schedule'
    );

    const hi = container.querySelector('.client-lobby__hi-name');
    expect(hi).toBeTruthy();
    expect(hi.textContent).toContain('이재학');

    expect(screen.getByTestId(CLIENT_LOBBY_STATUS_TEST_ID)).toBeInTheDocument();
    expect(screen.getByText(/남은 회기/)).toBeInTheDocument();
    expect(screen.getByText('예정 목록')).toBeInTheDocument();
    expect(screen.getByText('회기 잔량')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: CLIENT_LOBBY_CTA_PICK_SESSION })).toHaveAttribute(
      'href',
      '/client/session-management'
    );
    expect(screen.getByRole('link', { name: CLIENT_LOBBY_CTA_PAYMENT })).toHaveAttribute(
      'href',
      '/client/payment-history'
    );

    expect(screen.getByText(CLIENT_LOBBY_FOOTER)).toBeInTheDocument();

    const bodyText = container.textContent || '';
    expect(bodyText).not.toMatch(/새 예약/);
    expect(bodyText).not.toMatch(/예약하기/);
    expect(bodyText).not.toMatch(/일정에 담기/);
    expect(bodyText).not.toMatch(/\/client\/booking/);
  });

  test('top chrome 로그아웃 → ConfirmModal → useSession.logout', async() => {
    render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>
    );

    const logoutButton = screen.getByRole('button', { name: CLIENT_LOBBY_LOGOUT });
    expect(logoutButton).toHaveClass('client-lobby__logout');
    fireEvent.click(logoutButton);

    const dialog = await screen.findByRole('dialog', { name: CLIENT_LOBBY_LOGOUT });
    expect(within(dialog).getByText(CLIENT_LOBBY_LOGOUT_CONFIRM)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: CLIENT_LOBBY_LOGOUT_CANCEL }))
      .toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: CLIENT_LOBBY_LOGOUT }));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  test('브랜딩 없으면 top chrome에 MindGarden/마인드가든·플랫폼 기본 라벨 없음', () => {
    const sessionUser = buildSessionUser({
      tenant: { tenantId: 'tenant-empty', name: '' },
      tenantName: '',
      branchName: ''
    });
    mockUseSession.mockReturnValue({
      user: sessionUser,
      isLoggedIn: true,
      isLoading: false,
      checkSession: jest.fn(),
      logout: mockLogout,
      setModalOpen: jest.fn()
    });
    mockSessionGetUser.mockReturnValue(sessionUser);
    mockUseBranding.mockReturnValue({
      brandingInfo: {
        companyName: 'CoreSolution',
        companyNameEn: 'Core Solution'
      },
      isLoading: false
    });

    const { container } = render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>
    );

    expect(container.querySelector('.client-lobby__brand-word')).toBeNull();
    expect(container.querySelector('.client-lobby__brand-center')).toBeNull();
    expect(container.querySelector('.client-lobby__brand-sep')).toBeNull();
    expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    expect(screen.queryByText('마인드가든')).not.toBeInTheDocument();
    expect(screen.queryByText('CoreSolution')).not.toBeInTheDocument();
    expect(screen.queryByText('Core Solution')).not.toBeInTheDocument();
    expect(container.querySelector('.client-lobby__brand-mark')).toBeTruthy();
  });

  test('회기 0이면 히어로 우선순위 ZERO_SESSIONS', async() => {
    StandardizedApi.get.mockImplementation((endpoint) => {
      if (String(endpoint).includes('schedules')) {
        return Promise.resolve([]);
      }
      if (String(endpoint).includes('mappings/client')) {
        return Promise.resolve([
          {
            id: 10,
            status: 'ACTIVE',
            totalSessions: 4,
            usedSessions: 4,
            remainingSessions: 0,
            packageName: '패키지',
            consultantName: '김선희'
          }
        ]);
      }
      if (String(endpoint).includes('unread-count')) {
        return Promise.resolve({ unreadCount: 0 });
      }
      return Promise.resolve(null);
    });

    render(
      <MemoryRouter>
        <ClientDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId(CLIENT_LOBBY_HERO_TEST_ID)).toHaveAttribute(
        'data-priority',
        'ZERO_SESSIONS'
      );
    });

    const hero = screen.getByTestId(CLIENT_LOBBY_HERO_TEST_ID);
    expect(within(hero).getByRole('link', { name: CLIENT_LOBBY_CTA_PICK_SESSION }))
      .toHaveAttribute('href', '/client/session-management');
    expect(within(hero).getByText(CLIENT_LOBBY_CTA_PICK_SESSION, { selector: '.client-lobby__hero-title' }))
      .toBeInTheDocument();
  });
});
