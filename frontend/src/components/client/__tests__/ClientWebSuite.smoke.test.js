/**
 * Client web suite smoke — ALL faces under ClientWebTopChrome · zero LNB · nav 5
 *
 * @author CoreSolution
 * @since 2026-09-18
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  CLIENT_WEB_NAV,
  CLIENT_WEB_NAV_LABELS,
  CLIENT_WEB_PAGE_SHELL_TEST_ID,
  CLIENT_WEB_PROFILE_LINK_TEST_ID,
  CLIENT_WEB_TOP_CHROME_TEST_ID,
  CLIENT_WEB_TOP_NAV_TEST_ID
} from '../../../constants/clientWebChromeConstants';
import {
  CLIENT_WEB_SUITE_COPY,
  CLIENT_WEB_SUITE_TEST_IDS
} from '../../../constants/clientWebSuiteConstants';
import ClientWebPageShell from '../ClientWebPageShell';

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

jest.mock('../../../hooks/useBranding', () => ({
  useBranding: (...args) => mockUseBranding(...args)
}));

jest.mock(
  '../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

const SUITE_FACES = [
  { activeNavId: 'home', label: '홈', title: '홈 본문' },
  { activeNavId: 'schedule', label: '예정', title: CLIENT_WEB_SUITE_COPY.SCHEDULE_TITLE },
  { activeNavId: 'sessions', label: '회기', title: CLIENT_WEB_SUITE_COPY.SESSIONS_TITLE },
  { activeNavId: 'shop', label: '회기 고르기', title: CLIENT_WEB_SUITE_COPY.SHOP_CATALOG_TITLE },
  { activeNavId: 'payment', label: '결제', title: CLIENT_WEB_SUITE_COPY.PAYMENT_TITLE },
  { activeNavId: undefined, label: null, title: CLIENT_WEB_SUITE_COPY.SETTINGS_TITLE },
  { activeNavId: undefined, label: null, title: CLIENT_WEB_SUITE_COPY.COMMUNITY_TITLE }
];

describe('ClientWeb suite — TopChrome · nav 5 · zero LNB', () => {
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
      hasCheckedSession: true,
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

  test('CLIENT_WEB_NAV labels are exact SSOT five', () => {
    expect(CLIENT_WEB_NAV).toHaveLength(5);
    expect(CLIENT_WEB_NAV_LABELS).toEqual(['홈', '예정', '회기', '회기 고르기', '결제']);
  });

  test.each(SUITE_FACES)(
    'face title=$title — chrome · stage · no LNB · profile→settings',
    ({ activeNavId, label, title }) => {
      const { container } = render(
        <MemoryRouter>
          <ClientWebPageShell activeNavId={activeNavId} title={title} aside={<p>aside</p>}>
            <p>{title}-main</p>
          </ClientWebPageShell>
        </MemoryRouter>
      );

      expect(screen.getByTestId(CLIENT_WEB_PAGE_SHELL_TEST_ID)).toBeInTheDocument();
      expect(screen.getByTestId(CLIENT_WEB_TOP_CHROME_TEST_ID)).toBeInTheDocument();
      expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.STAGE)).toBeInTheDocument();
      expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.MAIN)).toBeInTheDocument();
      expect(screen.getByTestId(CLIENT_WEB_SUITE_TEST_IDS.ASIDE)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();

      const nav = screen.getByTestId(CLIENT_WEB_TOP_NAV_TEST_ID);
      CLIENT_WEB_NAV.forEach((item) => {
        expect(within(nav).getByRole('link', { name: item.label }))
          .toHaveAttribute('href', item.path);
      });
      if (label) {
        expect(within(nav).getByRole('link', { name: label }))
          .toHaveAttribute('aria-current', 'page');
      }

      const profile = screen.getByTestId(CLIENT_WEB_PROFILE_LINK_TEST_ID);
      expect(profile).toHaveAttribute('href', '/client/settings');

      expect(container.querySelector('.mg-v2-desktop-lnb')).toBeNull();
      expect(container.querySelector('.mg-app-shell__sidebar')).toBeNull();
      expect(container.querySelector('.mg-v2-ad-b0kla')).toBeNull();
      expect(screen.queryByText('MindGarden')).not.toBeInTheDocument();
    }
  );

  test('single-column when aside omitted', () => {
    const { container } = render(
      <MemoryRouter>
        <ClientWebPageShell title={CLIENT_WEB_SUITE_COPY.SETTINGS_TITLE}>
          <p>settings-main</p>
        </ClientWebPageShell>
      </MemoryRouter>
    );
    expect(container.querySelector('.client-web-page-shell__grid--single')).toBeTruthy();
    expect(screen.queryByTestId(CLIENT_WEB_SUITE_TEST_IDS.ASIDE)).not.toBeInTheDocument();
  });

  // ShopClientLayout v4 셸 정렬은 suite 전면 포트 범위 밖 — 로비 랜딩 PASS만 검증

  test('schedule face copy forbids booking CTA strings', () => {
    expect(CLIENT_WEB_SUITE_COPY.SCHEDULE_TITLE).toBe('다가오는 상담');
    expect(JSON.stringify(CLIENT_WEB_SUITE_COPY)).not.toMatch(/예약하기|새 예약|일정에 담기/);
  });
});
