/**
 * PendingDeletionList 단위 테스트.
 *
 * 검증 시나리오:
 *  - GET /api/v1/admin/users/pending-deletion 호출 및 목록 렌더
 *  - 남은 일 색상 분기 — 1일=danger / 4일=warning / 7일=info (variantForDaysRemaining)
 *  - 빈 상태(EmptyState) 렌더
 *  - "되돌리기" 클릭 → RestoreUserModal 오픈
 *
 * @author Core Solution
 * @since 2026-06-06
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn()
}));

jest.mock('../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle }) => (
    <header data-testid="content-header">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  )
}));

jest.mock('../../dashboard-v2/content/ContentSection', () => ({
  __esModule: true,
  default: ({ children }) => <section data-testid="content-section">{children}</section>
}));

jest.mock('../../common/StatusBadge', () => ({
  __esModule: true,
  default: ({ variant, children }) => (
    <span data-testid="status-badge" data-variant={variant}>
      {children}
    </span>
  )
}));

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children == null ? '-' : String(children)}</span>
}));

jest.mock('../../common/UnifiedLoading', () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loading">{text}</div>
}));

jest.mock('../../common/EmptyState', () => ({
  __esModule: true,
  default: ({ title, action }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      {action}
    </div>
  )
}));

jest.mock('../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, type = 'button', ...rest }) => (
    // eslint-disable-next-line react/button-has-type
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-loading={loading ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </button>
  )
}));

jest.mock('../RestoreUserModal', () => ({
  __esModule: true,
  default: ({ isOpen, user }) =>
    isOpen ? (
      <div data-testid="restore-modal-mock" data-user-id={user?.userId}>
        restore-{user?.userId}
      </div>
    ) : null
}));

jest.mock('react-i18next', () => {
  const KEY_MAP = {
    'userManagement.pendingDeletion.pageTitle': '삭제 대기 사용자',
    'userManagement.pendingDeletion.subtitle': '7일 윈도우 내 되돌릴 수 있습니다',
    'userManagement.pendingDeletion.empty': '삭제 대기 사용자가 없습니다',
    'userManagement.pendingDeletion.loading': '로딩 중',
    'userManagement.pendingDeletion.loadError': '목록을 불러오지 못했습니다',
    'userManagement.pendingDeletion.column.name': '이름',
    'userManagement.pendingDeletion.column.email': '이메일',
    'userManagement.pendingDeletion.column.role': '역할',
    'userManagement.pendingDeletion.column.deletedAt': '삭제 일자',
    'userManagement.pendingDeletion.column.daysRemaining': '남은 일',
    'userManagement.pendingDeletion.column.reason': '사유',
    'userManagement.pendingDeletion.column.deletedByAdmin': '삭제 어드민',
    'userManagement.pendingDeletion.column.actions': '액션',
    'userManagement.pendingDeletion.action.restore': '되돌리기',
    'userManagement.pendingDeletion.daysRemainingValue': '{count}일 남음',
    'userManagement.pendingDeletion.daysRemainingExpired': '만료',
    'actions.refresh': '새로고침'
  };
  const mockT = (key, options) => {
    const base = KEY_MAP[key] || key;
    if (options && typeof base === 'string') {
      return Object.keys(options).reduce(
        (acc, k) => acc.replace(`{${k}}`, String(options[k])),
        base
      );
    }
    return base;
  };
  const mockTranslation = { t: mockT };
  return {
    __esModule: true,
    useTranslation: () => mockTranslation
  };
});

import StandardizedApi from '../../../utils/standardizedApi';
import PendingDeletionList from '../PendingDeletionList';

const SAMPLE_ITEMS = [
  {
    userId: 101,
    name: '이내담',
    emailMasked: 'l***@example.com',
    role: 'CLIENT',
    deletedAt: '2026-05-22T10:00:00',
    daysRemaining: 1,
    reason: '운영 위반',
    deletedByAdminId: 999,
    deletedByAdminName: '관리자A'
  },
  {
    userId: 102,
    name: '박상담',
    emailMasked: 'p***@example.com',
    role: 'CONSULTANT',
    deletedAt: '2026-05-23T10:00:00',
    daysRemaining: 4,
    reason: '계약 종료',
    deletedByAdminId: 999,
    deletedByAdminName: '관리자A'
  },
  {
    userId: 103,
    name: '김신규',
    emailMasked: 'k***@example.com',
    role: 'CLIENT',
    deletedAt: '2026-05-28T10:00:00',
    daysRemaining: 7,
    reason: '정책 위반',
    deletedByAdminId: 999,
    deletedByAdminName: '관리자A'
  }
];

describe('PendingDeletionList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('목록을 불러와 행을 렌더하고 남은 일 색상 분기를 적용한다', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: { content: SAMPLE_ITEMS, totalElements: SAMPLE_ITEMS.length }
    });

    render(<PendingDeletionList />);

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(1));
    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/users/pending-deletion',
      { page: 0, size: 20, role: 'ALL' }
    );

    await waitFor(() => {
      expect(screen.getByTestId('pending-deletion-table')).toBeInTheDocument();
    });
    expect(screen.getByTestId('pending-deletion-row-101')).toBeInTheDocument();
    expect(screen.getByTestId('pending-deletion-row-102')).toBeInTheDocument();
    expect(screen.getByTestId('pending-deletion-row-103')).toBeInTheDocument();

    const badges = screen.getAllByTestId('status-badge');
    expect(badges).toHaveLength(3);
    expect(badges[0]).toHaveAttribute('data-variant', 'danger');
    expect(badges[1]).toHaveAttribute('data-variant', 'warning');
    expect(badges[2]).toHaveAttribute('data-variant', 'info');
  });

  it('빈 응답일 때 EmptyState 를 표시한다', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: { content: [], totalElements: 0 }
    });

    render(<PendingDeletionList />);

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
    expect(screen.getByTestId('empty-state')).toHaveTextContent('삭제 대기 사용자가 없습니다');
  });

  it('되돌리기 버튼 클릭 시 RestoreUserModal 이 열린다', async() => {
    StandardizedApi.get.mockResolvedValue({
      success: true,
      data: { content: SAMPLE_ITEMS, totalElements: SAMPLE_ITEMS.length }
    });

    render(<PendingDeletionList />);
    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());

    fireEvent.click(await screen.findByTestId('pending-deletion-restore-btn-101'));

    await waitFor(() => {
      const modal = screen.getByTestId('restore-modal-mock');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('data-user-id', '101');
    });
  });
});
