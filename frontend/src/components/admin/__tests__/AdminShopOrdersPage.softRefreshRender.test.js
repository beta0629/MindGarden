/**
 * 온라인 주문 soft-refresh 렌더 회귀 잠금 (PR #1157)
 *
 * 기존 AdminShopOrdersPage.softRefresh.test.js 는 소스 정적 검사만 한다.
 * 여기서는 실제 렌더로 「새로고침 중 스켈레톤·레이아웃 로딩 없음」「같은 userId ping 재조회 없음」을 잠근다.
 *
 * @author CoreSolution
 * @since 2026-09-29
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  ADMIN_SHOP_ORDERS_COPY,
  ADMIN_SHOP_SUITE_TEST_IDS
} from '../../../constants/adminShopSuite';

const mockUseSession = jest.fn();
const mockListOrders = jest.fn();
const mockLayoutRender = jest.fn();

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({ t: (key) => key }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

jest.mock('../../../contexts/SessionContext', () => ({
  __esModule: true,
  SessionContext: jest.requireActual('react').createContext(null),
  useSession: () => mockUseSession()
}));

jest.mock('../../../utils/notification', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue([]),
    post: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({})
  }
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: (props) => {
    mockLayoutRender(props);
    return <div data-testid="admin-common-layout">{props.children}</div>;
  }
}));

jest.mock('../../dashboard-v2/content', () => ({
  __esModule: true,
  ContentArea: ({ children }) => <div data-testid="content-area">{children}</div>,
  ContentHeader: ({ actions }) => <div data-testid="content-header">{actions}</div>
}));

jest.mock('../../../services/adminShopOrderService', () => ({
  __esModule: true,
  listAdminShopOrders: (...args) => mockListOrders(...args),
  deleteAdminShopOrder: jest.fn(),
  extendAdminShopOrderExpiry: jest.fn(),
  getAdminShopOrder: jest.fn(),
  listAdminShopOrderExpiryExtensions: jest.fn(),
  refundAdminShopOrder: jest.fn(),
  reconcileShopOrderRefund: jest.fn(),
  retryAdminShopOrderFulfillment: jest.fn()
}));

// eslint-disable-next-line import/first
import AdminShopOrdersPage from '../AdminShopOrdersPage';

const EMPTY_RESULT = { orders: [], totalElements: 0, counts: {}, summary: null };

const buildAdminSession = () => ({
  user: { id: 1, name: 'Admin', role: 'ADMIN' },
  isLoggedIn: true,
  isLoading: false
});

const createDeferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const renderLoaded = async() => {
  const utils = render(
    <MemoryRouter>
      <AdminShopOrdersPage />
    </MemoryRouter>
  );
  expect(await screen.findByText(ADMIN_SHOP_ORDERS_COPY.EMPTY_TITLE_PERIOD)).toBeInTheDocument();
  expect(screen.queryByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_SKELETON)).not.toBeInTheDocument();
  return utils;
};

describe('AdminShopOrdersPage soft refresh render', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSession.mockReturnValue(buildAdminSession());
    mockListOrders.mockResolvedValue(EMPTY_RESULT);
  });

  test('#1157 soft-refresh 새로고침 — 재조회 중 스켈레톤 없이 표·빈 상태 유지 · 끝나면 「목록을 다시 불러왔어요」', async() => {
    await renderLoaded();
    const tableNode = screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_TABLE);
    const callsBefore = mockListOrders.mock.calls.length;
    const deferred = createDeferred();
    mockListOrders.mockReturnValueOnce(deferred.promise);

    await act(async() => {
      fireEvent.click(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_RELOAD));
    });

    expect(mockListOrders.mock.calls.length).toBe(callsBefore + 1);
    expect(screen.queryByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_SKELETON)).not.toBeInTheDocument();
    expect(screen.getByText(ADMIN_SHOP_ORDERS_COPY.EMPTY_TITLE_PERIOD)).toBeInTheDocument();
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_TABLE)).toBe(tableNode);
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_RELOAD)).toBeDisabled();

    await act(async() => {
      deferred.resolve(EMPTY_RESULT);
    });

    expect(await screen.findByText(ADMIN_SHOP_ORDERS_COPY.RELOADED_TOAST)).toBeInTheDocument();
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_RELOAD)).not.toBeDisabled();
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_TABLE)).toBe(tableNode);
  });

  test('#1157 soft-refresh — AdminCommonLayout 에 loading 을 넘기지 않아 레이아웃이 화면을 가리지 않음', async() => {
    await renderLoaded();
    await act(async() => {
      fireEvent.click(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_RELOAD));
    });
    await waitFor(() => expect(mockListOrders.mock.calls.length).toBeGreaterThan(1));
    mockLayoutRender.mock.calls.forEach(([props]) => {
      expect(props.loading).toBeUndefined();
    });
  });

  test('#1157 soft-refresh — 같은 userId 새 user 객체(silent SET_USER)면 목록을 다시 부르지 않고 표 유지', async() => {
    const { rerender } = await renderLoaded();
    const tableNode = screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_TABLE);
    const callsBefore = mockListOrders.mock.calls.length;

    mockUseSession.mockReturnValue(buildAdminSession());
    await act(async() => {
      rerender(
        <MemoryRouter>
          <AdminShopOrdersPage />
        </MemoryRouter>
      );
    });

    expect(mockListOrders.mock.calls.length).toBe(callsBefore);
    expect(screen.getByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_TABLE)).toBe(tableNode);
    expect(screen.queryByTestId(ADMIN_SHOP_SUITE_TEST_IDS.ORDERS_SKELETON)).not.toBeInTheDocument();
  });
});
