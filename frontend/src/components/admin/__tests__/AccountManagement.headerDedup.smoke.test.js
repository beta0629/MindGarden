/**
 * AccountManagement — G-14 P2 header dedup 스모크 테스트.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title ?? ''}>
      {children}
    </div>
  )
}));

jest.mock('../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle, actions }) => (
    <header data-testid="content-header" data-has-title={String(Boolean(title))}>
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </header>
  )
}));

jest.mock('../../../hooks/useConfirm', () => ({
  useConfirm: () => [jest.fn(), () => null]
}));

jest.mock('../../../services/accountManagementService', () => ({
  listActiveAccounts: jest.fn(() => Promise.resolve([])),
  listAccountBanks: jest.fn(() => Promise.resolve([])),
  createAccount: jest.fn(),
  updateAccount: jest.fn(),
  deleteAccount: jest.fn(),
  toggleAccountStatus: jest.fn(),
  setPrimaryAccount: jest.fn()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../components/AccountForm', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../components/AccountTable', () => ({
  __esModule: true,
  default: () => <div data-testid="account-table" />
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  )
}));

import AccountManagement from '../AccountManagement';
import { ACCOUNT_PAGE_TITLES } from '../../../constants/account';

describe('AccountManagement (G-14 P2 header dedup)', () => {
  test('ACL·ContentHeader title SSOT 통일, ContentHeader title 생략', async() => {
    render(<AccountManagement />);

    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute(
      'data-title',
      ACCOUNT_PAGE_TITLES.MAIN
    );

    const header = screen.getByTestId('content-header');
    expect(header).toHaveAttribute('data-has-title', 'false');
    expect(screen.queryByRole('heading', { name: ACCOUNT_PAGE_TITLES.MAIN })).not.toBeInTheDocument();
    expect(screen.getByText('정산·입금 안내에 사용할 계좌를 등록·관리합니다.')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('account-table')).toBeInTheDocument();
    });
  });
});
