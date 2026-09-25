/**
 * Client web CLIENT_WEB_NAV destinations — no LNB / no AppShell sidebar
 * schedule · sessions · payment · settings · messages · wellness shells
 * ClientAppShell — ClientWebPageShell only (no AppTopBar / BottomNav)
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  CLIENT_WEB_TOP_CHROME_TEST_ID,
  CLIENT_WEB_TOP_NAV_TEST_ID,
  CLIENT_WEB_PAGE_SHELL_TEST_ID,
  CLIENT_WEB_NAV_LABELS,
  CLIENT_WEB_PROFILE_LINK_TEST_ID
} from '../../../constants/clientWebChromeConstants';
import ClientWebPageShell from '../ClientWebPageShell';
import ClientAppShell from '../../layout/ClientAppShell';

const mockUseSession = jest.fn();
const mockUseBranding = jest.fn();

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../common/ConfirmModal', () => ({
  __esModule: true,
  default: () => null
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
  useBranding: (...args) => mockUseBranding(...args)
}));

jest.mock(
  '../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

const NAV_SHELLS = [
  { activeNavId: 'schedule', label: '예정' },
  { activeNavId: 'sessions', label: '회기' },
  { activeNavId: 'payment', label: '결제' },
  { activeNavId: 'home', label: '홈' },
  { activeNavId: 'shop', label: '회기 고르기' }
];

describe('ClientWebNavNoLnb — client page shells', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      user: {
        id: 101,
        name: '이재학',
        role: 'CLIENT',
        tenant: { tenantId: 'tenant-sunshine', name: '햇살상담센터' }
      },
      isLoggedIn: true,
      isLoading: false,
      logout: jest.fn(),
      setModalOpen: jest.fn()
    });
    mockUseBranding.mockReturnValue({
      brandingInfo: {
        companyName: '햇살상담센터',
        companyNameEn: 'Sunshine Counseling'
      },
      isLoading: false
    });
  });

  test.each(NAV_SHELLS)(
    'ClientWebPageShell activeNavId=$activeNavId — chrome present · no LNB · no AppShell sidebar',
    ({ activeNavId, label }) => {
      const { container } = render(
        <MemoryRouter>
          <ClientWebPageShell activeNavId={activeNavId}>
            <p>{activeNavId}-body</p>
          </ClientWebPageShell>
        </MemoryRouter>
      );

      expect(screen.getByTestId(CLIENT_WEB_PAGE_SHELL_TEST_ID)).toBeInTheDocument();
      expect(screen.getByTestId(CLIENT_WEB_TOP_CHROME_TEST_ID)).toBeInTheDocument();
      expect(screen.getByTestId(CLIENT_WEB_TOP_NAV_TEST_ID)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
      expect(CLIENT_WEB_NAV_LABELS).toEqual(['홈', '예정', '회기', '회기 고르기', '결제']);
      expect(screen.getByTestId(CLIENT_WEB_PROFILE_LINK_TEST_ID)).toHaveAttribute(
        'href',
        '/client/settings'
      );

      expect(container.querySelector('.mg-v2-desktop-lnb')).toBeNull();
      expect(container.querySelector('.mg-app-shell__sidebar')).toBeNull();
      expect(screen.queryByTestId('admin-common-layout')).not.toBeInTheDocument();
      expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    }
  );

  test('ClientWebPageShell without activeNavId — chrome present · no LNB', () => {
    const { container } = render(
      <MemoryRouter>
        <ClientWebPageShell>
          <p>settings-body</p>
        </ClientWebPageShell>
      </MemoryRouter>
    );

    expect(screen.getByTestId(CLIENT_WEB_PAGE_SHELL_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_TOP_CHROME_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_TOP_NAV_TEST_ID)).toBeInTheDocument();
    expect(container.querySelector('.mg-v2-desktop-lnb')).toBeNull();
    expect(container.querySelector('.mg-app-shell__sidebar')).toBeNull();
    expect(screen.queryByRole('link', { name: '홈' })).not.toHaveAttribute('aria-current');
  });
});

describe('ClientAppShell — ClientWebPageShell only (client web SSOT)', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      user: {
        id: 101,
        name: '이재학',
        role: 'CLIENT',
        tenant: { tenantId: 'tenant-sunshine', name: '햇살상담센터' }
      },
      isLoggedIn: true,
      isLoading: false,
      logout: jest.fn(),
      setModalOpen: jest.fn()
    });
    mockUseBranding.mockReturnValue({
      brandingInfo: {
        companyName: '햇살상담센터',
        companyNameEn: 'Sunshine Counseling'
      },
      isLoading: false
    });
  });

  test('mounts ClientWebTopChrome · no LNB · no AppTopBar · no BottomNav', () => {
    const { container } = render(
      <MemoryRouter>
        <ClientAppShell title="내담자">
          <p>shell-body</p>
        </ClientAppShell>
      </MemoryRouter>
    );

    expect(screen.getByTestId(CLIENT_WEB_PAGE_SHELL_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_WEB_TOP_CHROME_TEST_ID)).toBeInTheDocument();
    expect(container.querySelector('.mg-app-shell__sidebar')).toBeNull();
    expect(container.querySelector('.mg-v2-desktop-lnb')).toBeNull();
    expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-top-bar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bottom-navigation')).not.toBeInTheDocument();
    expect(screen.getByText('shell-body')).toBeInTheDocument();
  });
});
