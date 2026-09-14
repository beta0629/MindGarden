/**
 * InstitutionLinkAdminPage — 별 페이지 스모크. 회기 잔여·바우처 필드가 없다.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { INSTITUTION_LINK_LABELS } from '../../../constants/institutionLinkAdmin';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

jest.mock('../../../contexts/SessionContext', () => ({
  useSession: () => ({
    user: { id: 1, role: 'ADMIN' },
    isLoggedIn: true,
    isLoading: false
  })
}));

jest.mock('../../../constants/roles', () => ({
  RoleUtils: {
    isAdmin: () => true,
    isStaff: () => false
  }
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="admin-common-layout" data-title={title}>{children}</div>
  )
}));

jest.mock('../../dashboard-v2/content', () => ({
  ContentArea: ({ children }) => <div>{children}</div>,
  ContentHeader: ({ title, subtitle, titleId }) => (
    <header data-testid="content-header">
      <h1 id={titleId}>{title}</h1>
      <p>{subtitle}</p>
    </header>
  ),
  ContentSection: ({ title, children }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  )
}));

jest.mock('../../common', () => ({
  ListTableView: () => <div data-testid="list-table" />
}));

jest.mock('../../common/EmptyState', () => ({
  __esModule: true,
  default: ({ title }) => <div>{title}</div>
}));

jest.mock('../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children }) => (isOpen ? (
    <div data-testid="unified-modal">
      <h2>{title}</h2>
      {children}
    </div>
  ) : null)
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick }) => (
    <button type="button" onClick={onClick}>{children}</button>
  )
}));

jest.mock('../../common/FormInput', () => ({
  __esModule: true,
  default: ({ label }) => <label>{label}</label>
}));

jest.mock('../../common/CustomSelect', () => ({
  __esModule: true,
  default: () => <div />
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: () => <div data-testid="loading" />
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(async() => []),
    post: jest.fn(),
    put: jest.fn()
  }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    show: jest.fn()
  }
}));

import InstitutionLinkAdminPage from '../InstitutionLinkAdminPage';

describe('InstitutionLinkAdminPage', () => {
  test('타기관 연계 헤더와 기관·등록 섹션이 있고 회기 잔여 문구가 없다', async() => {
    render(<InstitutionLinkAdminPage />);

    await waitFor(() => {
      expect(screen.getByTestId('institution-link-admin-page')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: INSTITUTION_LINK_LABELS.PAGE_TITLE })).toBeInTheDocument();
    expect(screen.getByText(INSTITUTION_LINK_LABELS.INSTITUTION_SECTION)).toBeInTheDocument();
    expect(screen.getByText(INSTITUTION_LINK_LABELS.ENROLL_SECTION)).toBeInTheDocument();
    expect(screen.queryByText(/회기 잔여/)).not.toBeInTheDocument();
    expect(screen.queryByText(/바우처/)).not.toBeInTheDocument();
    expect(screen.queryByText(/remainingSessions/i)).not.toBeInTheDocument();
  });
});
