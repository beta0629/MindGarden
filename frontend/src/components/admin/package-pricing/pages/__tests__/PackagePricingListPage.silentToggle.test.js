/**
 * PackagePricingListPage — public/active 토글 후 silent refetch 회귀 가드.
 *
 * 토글 성공 후 fetchList({ silent: true }) 는 AdminCommonLayout loading 을
 * true 로 올리지 않아 Passthrough 전체 스피너(체감 reload)를 막는다.
 *
 * @author Core Solution
 * @since 2026-09-10
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LABELS } from '../../../../../constants/packagePricingConstants';
import { withPublicVisible } from '../../../../../utils/packagePricing';

jest.mock('../../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('../../../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => jest.fn()
}));

const layoutLoadingHistory = [];

jest.mock('../../../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children, loading }) => {
    layoutLoadingHistory.push(Boolean(loading));
    return (
      <div data-testid="admin-common-layout" data-loading={String(Boolean(loading))}>
        {loading ? <div data-testid="page-loading" /> : children}
      </div>
    );
  }
}));

jest.mock('../../../../dashboard-v2/content/ContentArea', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="content-area">{children}</div>
}));

jest.mock('../../../../dashboard-v2/content/ContentHeader', () => ({
  __esModule: true,
  default: ({ title, actions }) => (
    <header data-testid="content-header">
      {title ? <h1>{title}</h1> : null}
      {actions}
    </header>
  )
}));

jest.mock('../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, loading, 'aria-label': ariaLabel }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      data-loading={String(Boolean(loading))}
    >
      {children}
    </button>
  )
}));

jest.mock('../../../../erp/common/erpMgButtonProps', () => ({
  __esModule: true,
  buildErpMgButtonClassName: () => 'mg-btn',
  ERP_MG_BUTTON_LOADING_TEXT: '처리 중...'
}));

jest.mock('../../../../../../styles/unified-design-tokens.css', () => ({}), { virtual: true });
jest.mock('../../../AdminDashboard/AdminDashboardB0KlA.css', () => ({}), { virtual: true });
jest.mock('../../PackagePricingPage.css', () => ({}), { virtual: true });

import PackagePricingListPage from '../PackagePricingListPage';
import StandardizedApi from '../../../../../utils/standardizedApi';

const SAMPLE_ROW = {
  id: 42,
  codeValue: 'BASIC',
  codeLabel: '기본 패키지',
  koreanName: '기본 패키지',
  codeDescription: null,
  isActive: true,
  extraData: JSON.stringify({
    sessions: 10,
    price: 100000,
    remark: '',
    publicVisible: true
  })
};

describe('PackagePricingListPage — silent toggle refetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    layoutLoadingHistory.length = 0;
    StandardizedApi.get.mockResolvedValue({ codes: [{ ...SAMPLE_ROW }] });
    StandardizedApi.put.mockResolvedValue({ success: true });
  });

  it('공개 토글 성공 후 페이지 loading 을 true 로 올리지 않고 UI 를 갱신한다', async() => {
    const nextExtra = withPublicVisible(SAMPLE_ROW.extraData, false);
    StandardizedApi.put.mockImplementation(async(_url, body) => {
      StandardizedApi.get.mockResolvedValue({
        codes: [{ ...SAMPLE_ROW, extraData: body.extraData }]
      });
      return { success: true };
    });

    render(<PackagePricingListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'false');
    });
    const loadingAfterInitial = layoutLoadingHistory.length;
    expect(screen.getAllByText(LABELS.PUBLIC_YES).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: LABELS.COL_PUBLIC_VISIBLE }));

    await waitFor(() => {
      expect(StandardizedApi.put).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(StandardizedApi.get.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    const loadingDuringSilentRefetch = layoutLoadingHistory.slice(loadingAfterInitial);
    expect(loadingDuringSilentRefetch.every((v) => v === false)).toBe(true);
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'false');
    expect(screen.queryByTestId('page-loading')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText(LABELS.PUBLIC_NO).length).toBeGreaterThan(0);
    });

    expect(StandardizedApi.put.mock.calls[0][1].extraData).toBe(nextExtra);
  });

  it('활성 토글 성공 후에도 페이지 loading 을 true 로 올리지 않는다', async() => {
    StandardizedApi.put.mockImplementation(async(_url, body) => {
      StandardizedApi.get.mockResolvedValue({
        codes: [{ ...SAMPLE_ROW, isActive: body.isActive }]
      });
      return { success: true };
    });

    render(<PackagePricingListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'false');
    });
    const loadingAfterInitial = layoutLoadingHistory.length;

    fireEvent.click(screen.getByRole('button', { name: LABELS.DEACTIVATE }));

    await waitFor(() => {
      expect(StandardizedApi.put).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(StandardizedApi.get.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    const loadingDuringSilentRefetch = layoutLoadingHistory.slice(loadingAfterInitial);
    expect(loadingDuringSilentRefetch.every((v) => v === false)).toBe(true);
    expect(screen.getByTestId('admin-common-layout')).toHaveAttribute('data-loading', 'false');
    expect(screen.queryByTestId('page-loading')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(LABELS.ACTIVE_NO)).toBeInTheDocument();
    });
  });
});
