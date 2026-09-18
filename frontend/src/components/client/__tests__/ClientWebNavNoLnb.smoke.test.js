/**
 * Client web CLIENT_WEB_NAV destinations — no LNB / no AppShell sidebar
 * schedule · sessions · payment shells must use ClientWebTopChrome only
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
  CLIENT_WEB_PAGE_SHELL_TEST_ID
} from '../../../constants/clientWebChromeConstants';
import ClientWebPageShell from '../ClientWebPageShell';
import ClientAppShell from '../../layout/ClientAppShell';

const mockUseSession = jest.fn();
const mockUseBranding = jest.fn();
const mockUseNotification = jest.fn();

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

jest.mock('../../../hooks/useBranding', () => ({
  useBranding: (...args) => mockUseBranding(...args)
}));

jest.mock('../../../contexts/NotificationContext', () => ({
  useNotification: () => mockUseNotification()
}));

jest.mock('../../layout/AppTopBar', () => ({
  __esModule: true,
  default: ({ title }) => <div data-testid="app-top-bar">{title}</div>
}));

jest.mock('../../layout/BottomNavigation', () => ({
  __esModule: true,
  default: () => <nav data-testid="bottom-navigation" />
}));

jest.mock(
  '../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

const NAV_SHELLS = [
  { activeNavId: 'schedule', label: '예정' },
  { activeNavId: 'sessions', label: '회기' },
  { activeNavId: 'payment', label: '결제' }
];

describe('ClientWebNavNoLnb — schedule/sessions/payment shells', () => {
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

      expect(container.querySelector('.mg-v2-desktop-lnb')).toBeNull();
      expect(container.querySelector('.mg-app-shell__sidebar')).toBeNull();
      expect(screen.queryByTestId('admin-common-layout')).not.toBeInTheDocument();
      expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    }
  );
});

describe('ClientAppShell — no desktop sidebar (client web SSOT)', () => {
  beforeEach(() => {
    mockUseNotification.mockReturnValue({ unreadCount: 0 });
  });

  test('does not mount mg-app-shell__sidebar or MindGarden logo text', () => {
    const { container } = render(
      <MemoryRouter>
        <ClientAppShell title="내담자">
          <p>shell-body</p>
        </ClientAppShell>
      </MemoryRouter>
    );

    expect(container.querySelector('.mg-app-shell__sidebar')).toBeNull();
    expect(container.querySelector('.mg-v2-desktop-lnb')).toBeNull();
    expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    expect(screen.getByTestId('app-top-bar')).toBeInTheDocument();
    expect(screen.getByText('shell-body')).toBeInTheDocument();
  });
});
