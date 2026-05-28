/**
 * AdminPendingPaymentCleanupPage — 옵션 B R4 디러티 PENDING_PAYMENT 매칭 페이지 단위 테스트.
 *
 * 합의서: docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md.
 *
 * 검증 (5 시나리오):
 *  - 빈 목록 (EmptyState) 표시
 *  - 데이터 표시 (목록 row 렌더링)
 *  - 필터 변경 — ageHours 파라미터 전달
 *  - 단건 정리 클릭 → 단건 모달 오픈
 *  - 일괄 선택 → 일괄 정리 모달 오픈
 *
 * @author MindGarden
 * @since 2026-05-28
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key, opts) => {
    if (opts && typeof opts === 'object') {
      return `${key}:${Object.values(opts).join(',')}`;
    }
    return key;
  } }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../../utils/standardizedApi', () => {
  const mockData = {
    items: [],
    totalElements: 0,
    totalPages: 0,
    page: 0,
    size: 20,
    ageHours: 24
  };
  return {
    __esModule: true,
    default: {
      get: jest.fn().mockResolvedValue({ data: mockData }),
      post: jest.fn().mockResolvedValue({ success: true }),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    }
  };
});

jest.mock('../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-common-layout">{children}</div>
}));

jest.mock('../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, subtitle }) => (
    <div data-testid="content-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}));

jest.mock('../../../dashboard-v2/content/ContentSection', () => ({
  __esModule: true,
  default: ({ title, children }) => (
    <div data-testid="content-section">
      {title ? <h2>{title}</h2> : null}
      {children}
    </div>
  )
}));

jest.mock('../../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ options, value, onChange, 'aria-label': ariaLabel }) => (
    <select
      aria-label={ariaLabel}
      data-testid="badge-select"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}));

jest.mock('../../../common', () => ({
  __esModule: true,
  ListTableView: ({ columns, data, renderCell }) => (
    <table data-testid="list-table">
      <thead><tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={row.__rowKey || i} data-testid={`row-${row.__rowKey || i}`}>
            {columns.map((c) => <td key={c.key}>{renderCell(c.key, row)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  CardActionGroup: ({ children }) => <div data-testid="card-action-group">{children}</div>
}));

jest.mock('../../../common/EmptyState', () => ({
  __esModule: true,
  default: ({ title, description }) => (
    <div data-testid="empty-state"><span>{title}</span><span>{description}</span></div>
  )
}));

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../../common/SafeErrorDisplay', () => ({
  __esModule: true,
  default: ({ error }) => <div data-testid="error-banner">{String(error?.message || error)}</div>
}));

jest.mock('../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, type = 'button' }) => (
    <button type={type} onClick={onClick} disabled={disabled}>{children}</button>
  )
}));

jest.mock('../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mg-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../CleanupPendingPaymentModal', () => ({
  __esModule: true,
  default: ({ isOpen, mode, target, selectedIds }) => (
    isOpen ? (
      <div data-testid={`modal-${mode}`}>
        target={target?.mappingId ?? 'null'}
        ids={selectedIds.join(',')}
      </div>
    ) : null
  )
}));

import AdminPendingPaymentCleanupPage from '../AdminPendingPaymentCleanupPage';
import StandardizedApi from '../../../../utils/standardizedApi';

const setApiResponse = (data) => {
  StandardizedApi.get.mockResolvedValue({ data });
};

const buildItem = (id, overrides = {}) => ({
  mappingId: id,
  consultantId: 10,
  consultantName: '상담사A',
  clientId: 20,
  clientName: '내담자A',
  packageName: '10회기 패키지',
  packagePrice: 500000,
  totalSessions: 10,
  createdAt: '2026-05-26T08:00:00',
  elapsedHours: 48,
  status: 'PENDING_PAYMENT',
  paymentStatus: 'PENDING',
  ...overrides
});

describe('AdminPendingPaymentCleanupPage — 옵션 B R4 디러티 정리 페이지', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
    setApiResponse({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 20, ageHours: 24 });
  });

  test('빈 목록 — EmptyState 표시', async () => {
    await act(async () => {
      render(<AdminPendingPaymentCleanupPage />);
    });

    await waitFor(() => expect(screen.getByTestId('empty-state')).toBeInTheDocument());
  });

  test('데이터 표시 — items 가 있으면 ListTableView 에 행이 렌더된다', async () => {
    setApiResponse({
      items: [buildItem(101), buildItem(102)],
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 20,
      ageHours: 24
    });

    await act(async () => {
      render(<AdminPendingPaymentCleanupPage />);
    });

    await waitFor(() => expect(screen.getByTestId('list-table')).toBeInTheDocument());
    expect(screen.getByTestId('row-101')).toBeInTheDocument();
    expect(screen.getByTestId('row-102')).toBeInTheDocument();
  });

  test('필터 변경 — ageHours 파라미터가 갱신되어 GET 재호출', async () => {
    setApiResponse({ items: [], totalElements: 0, totalPages: 0, page: 0, size: 20, ageHours: 24 });
    await act(async () => {
      render(<AdminPendingPaymentCleanupPage />);
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(1));

    const select = screen.getByTestId('badge-select');
    await act(async () => {
      fireEvent.change(select, { target: { value: 72 } });
    });

    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalledTimes(2));
    const lastCall = StandardizedApi.get.mock.calls[StandardizedApi.get.mock.calls.length - 1];
    expect(lastCall[1]).toMatchObject({ ageHours: 72, page: 0, size: 20 });
  });

  test('단건 정리 클릭 — 모달 single 모드 오픈', async () => {
    setApiResponse({
      items: [buildItem(201)],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 20,
      ageHours: 24
    });

    await act(async () => {
      render(<AdminPendingPaymentCleanupPage />);
    });

    await waitFor(() => expect(screen.getByTestId('row-201')).toBeInTheDocument());

    const cleanupButton = screen.getByText('admin:mappings.pendingPaymentCleanup.actions.cleanup');
    await act(async () => { fireEvent.click(cleanupButton); });

    expect(screen.getByTestId('modal-single')).toBeInTheDocument();
    expect(screen.getByTestId('modal-single').textContent).toContain('target=201');
  });

  test('일괄 선택 — 체크박스 선택 후 bulkCleanup 클릭 시 bulk 모달 오픈', async () => {
    setApiResponse({
      items: [buildItem(301), buildItem(302)],
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 20,
      ageHours: 24
    });

    await act(async () => {
      render(<AdminPendingPaymentCleanupPage />);
    });

    await waitFor(() => expect(screen.getByTestId('row-301')).toBeInTheDocument());

    const checkboxes = screen.getAllByRole('checkbox');
    await act(async () => {
      checkboxes.forEach((cb) => fireEvent.click(cb));
    });

    const bulkButton = screen.getByText(/bulkCleanup/);
    await act(async () => { fireEvent.click(bulkButton); });

    expect(screen.getByTestId('modal-bulk')).toBeInTheDocument();
    expect(screen.getByTestId('modal-bulk').textContent).toContain('ids=301,302');
  });
});
