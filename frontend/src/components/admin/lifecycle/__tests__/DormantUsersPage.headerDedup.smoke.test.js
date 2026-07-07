/**
 * DormantUsersPage — G-14 P2 header dedup 스모크 테스트.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

const PAGE_TITLE = '휴면 사용자 관리';
const PAGE_SUBTITLE =
  '1년 비활성 사용자(DORMANT)의 4년 안정 보관 진행 상태를 확인하고 강제 복귀 또는 즉시 익명화할 수 있습니다.';

jest.mock('react-i18next', () => {
  const stableT = (key, fallback) => fallback || key;
  return {
    useTranslation: () => ({
      t: stableT,
      i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
    }),
    Trans: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: () => {} }
  };
});

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title ?? ''}>
      {children}
    </div>
  )
}));

jest.mock('../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle }) => (
    <header data-testid="content-header" data-has-title={String(Boolean(title))}>
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  )
}));

jest.mock('../DormantUsersList', () => ({
  __esModule: true,
  default: () => <div data-testid="dormant-users-list-stub" />
}));

jest.mock('../DormantUserDetail', () => () => null);
jest.mock('../ReactivateUserModal', () => () => null);
jest.mock('../ForceAnonymizeUserModal', () => () => null);

jest.mock('../dormantUsersApi', () => ({
  __esModule: true,
  fetchDormantUsers: jest.fn(() => Promise.resolve({
    data: { content: [], number: 0, size: 20, totalPages: 0, totalElements: 0 }
  })),
  fetchDormantUserDetail: jest.fn(),
  reactivateDormantUser: jest.fn(),
  forceAnonymizeDormantUser: jest.fn()
}));

jest.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() })
}));

import DormantUsersPage from '../DormantUsersPage';

describe('DormantUsersPage (G-14 P2 header dedup)', () => {
  test('ACL title SSOT 유지, ContentHeader title={null} prop 주입, 부제 유지', async() => {
    render(<DormantUsersPage />);

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-title', PAGE_TITLE);

    const header = screen.getByTestId('content-header');
    expect(header).toHaveAttribute('data-has-title', 'false');
    expect(screen.queryByRole('heading', { name: PAGE_TITLE })).not.toBeInTheDocument();
    expect(screen.getByText(PAGE_SUBTITLE)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('dormant-users-list-stub')).toBeInTheDocument();
    });
  });
});
