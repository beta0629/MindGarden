/**
 * 결제창 취소 흐름 — 장바구니 경유 취소 → 장바구니 + amber 안내 · 바로 구매 취소 → 상품 상세(장바구니 불변)
 * · 카드 거절 → 결제 화면 잔류 + 빨간 「결제가 완료되지 않았어요」 · redirect 복귀 취소 → 들어온 화면.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ShopCheckoutPage from '../ShopCheckoutPage';
import ShopCartPage from '../ShopCartPage';
import ShopSkuDetailPage from '../ShopSkuDetailPage';
import ShopPaymentReturnPage from '../ShopPaymentReturnPage';
import {
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_PAY_CANCEL_COPY,
  CLIENT_MALL_TEST_IDS,
  CLIENT_MALL_TIMING
} from '../../../../constants/clientMallConstants';
import {
  buildShopSkuDetailPath,
  CLIENT_SHOP_ROUTES,
  PORTONE_USER_CANCEL_CODE,
  SHOP_USER_CANCEL_OUTCOME
} from '../../../../constants/clientShopConstants';
import { buildBuyNowCheckoutPath } from '../../../../utils/clientMallBuyNow';
import { runShopPortOnePaymentIfReady } from '../../../../utils/shopPortOneCheckout';

const mockUseSession = jest.fn();
const mockService = {
  fetchShopCatalog: jest.fn(),
  fetchShopCatalogSku: jest.fn(),
  fetchShopCart: jest.fn(),
  replaceShopCart: jest.fn(),
  mergeGuestShopCartIntoServer: jest.fn(),
  fetchPointBalance: jest.fn(),
  fetchConsultantMappings: jest.fn(),
  postShopCheckout: jest.fn(),
  prepareShopPayment: jest.fn(),
  cancelShopOrder: jest.fn(),
  cancelShopPaymentByUser: jest.fn(),
  fetchShopOrder: jest.fn()
};

jest.mock('../../../../components/common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('../../../../components/common/ConfirmModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../../../../hooks/useAlert', () => ({
  useAlert: () => [jest.fn(), () => null]
}));

jest.mock('../../../../contexts/SessionContext', () => ({
  SessionContext: jest.requireActual('react').createContext(null),
  useSession: () => mockUseSession()
}));

jest.mock('../../../../contexts/NotificationContext', () => ({
  useNotification: () => ({ unreadCount: 0, unreadMessageCount: 0, unreadSystemCount: 0 })
}));

jest.mock('../../../../hooks/useBranding', () => ({
  useBranding: () => ({ brandingInfo: {}, isLoading: false })
}));

jest.mock('../../../../services/clientShopService', () => {
  const actual = jest.requireActual('../../../../services/clientShopService');
  return {
    ...actual,
    fetchShopCatalog: (...a) => mockService.fetchShopCatalog(...a),
    fetchShopCatalogSku: (...a) => mockService.fetchShopCatalogSku(...a),
    fetchShopCart: (...a) => mockService.fetchShopCart(...a),
    replaceShopCart: (...a) => mockService.replaceShopCart(...a),
    mergeGuestShopCartIntoServer: (...a) => mockService.mergeGuestShopCartIntoServer(...a),
    fetchPointBalance: (...a) => mockService.fetchPointBalance(...a),
    fetchConsultantMappings: (...a) => mockService.fetchConsultantMappings(...a),
    postShopCheckout: (...a) => mockService.postShopCheckout(...a),
    prepareShopPayment: (...a) => mockService.prepareShopPayment(...a),
    cancelShopOrder: (...a) => mockService.cancelShopOrder(...a),
    cancelShopPaymentByUser: (...a) => mockService.cancelShopPaymentByUser(...a),
    fetchShopOrder: (...a) => mockService.fetchShopOrder(...a)
  };
});

jest.mock('../../../../utils/shopPortOneCheckout', () => ({
  runShopPortOnePaymentIfReady: jest.fn()
}));

jest.mock(
  '../../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

const CATALOG = [
  { skuCode: 'PKG10', title: '10회기 패키지', unitPriceMinor: 850000, sessionCount: 10, validityMonths: 3, catalogCategory: 'GOODS' }
];
const CART_WITH_PKG = {
  lines: [{ skuCode: 'PKG10', title: '10회기 패키지', quantity: 1, unitPriceMinor: 850000, lineTotalMinor: 850000, sessionCount: 10 }],
  subtotalMinor: 850000
};

/** MGButton preventDoubleClick 기본 clickDelay(1s) 경과 후 재클릭 */
const MG_BUTTON_DOUBLE_CLICK_GUARD_MS = 1100;

const portoneError = (result) => {
  const err = new Error(result.message || result.code);
  err.portoneResult = result;
  return err;
};

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname}</div>;
};

const renderMall = (initialEntry) => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <Routes>
      <Route path={CLIENT_SHOP_ROUTES.CHECKOUT} element={<ShopCheckoutPage />} />
      <Route path={CLIENT_SHOP_ROUTES.CART} element={<ShopCartPage />} />
      <Route path={`${CLIENT_SHOP_ROUTES.SKU_DETAIL}/:skuCode`} element={<ShopSkuDetailPage />} />
      <Route path={CLIENT_SHOP_ROUTES.PAYMENT_RETURN} element={<ShopPaymentReturnPage />} />
    </Routes>
    <LocationProbe />
  </MemoryRouter>
);

const payFromCheckout = async() => {
  const pay = await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY);
  fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_AGREE_ALL));
  await act(async() => {
    fireEvent.click(pay);
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  delete window.matchMedia;
  window.scrollTo = jest.fn();
  mockUseSession.mockReturnValue({
    user: { id: 7, name: '김내담', role: 'CLIENT', email: 'client@example.test', phone: '01012341234', isPhoneVerified: true },
    isLoggedIn: true,
    isLoading: false,
    hasCheckedSession: true,
    checkSession: jest.fn().mockResolvedValue(true),
    logout: jest.fn(),
    setModalOpen: jest.fn()
  });
  mockService.fetchShopCatalog.mockResolvedValue(CATALOG);
  mockService.fetchShopCatalogSku.mockResolvedValue(CATALOG[0]);
  mockService.fetchShopCart.mockResolvedValue(CART_WITH_PKG);
  mockService.replaceShopCart.mockResolvedValue();
  mockService.mergeGuestShopCartIntoServer.mockResolvedValue({ merged: false, lines: [] });
  mockService.fetchPointBalance.mockResolvedValue({ availableMinor: 0, heldMinor: 0 });
  mockService.fetchConsultantMappings.mockResolvedValue([]);
  mockService.postShopCheckout.mockResolvedValue({ orderPublicId: 'ord-1', nextStep: 'PAYMENT', cashDueMinor: 850000 });
  mockService.prepareShopPayment.mockResolvedValue({ paymentId: 'pay-1', storeId: 'store-test', channelKey: 'channel-test' });
});

describe('결제창 사용자 취소 (PAY_PROCESS_CANCELED)', () => {
  test('장바구니 경유 → 장바구니로 복귀 · amber 안내 · 담긴 상품 유지 · 주문 정리 API 호출', async() => {
    runShopPortOnePaymentIfReady.mockRejectedValue(
      portoneError({ code: PORTONE_USER_CANCEL_CODE, message: '사용자가 결제를 취소했습니다' })
    );
    mockService.cancelShopPaymentByUser.mockResolvedValue({
      orderPublicId: 'ord-1', outcome: SHOP_USER_CANCEL_OUTCOME.CANCELLED, checkoutSource: 'CART', skuCodes: ['PKG10']
    });
    renderMall(CLIENT_SHOP_ROUTES.CHECKOUT);

    await payFromCheckout();

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent(CLIENT_SHOP_ROUTES.CART));
    expect(mockService.cancelShopPaymentByUser).toHaveBeenCalledWith('ord-1');
    expect(mockService.cancelShopOrder).not.toHaveBeenCalled();
    expect(await screen.findByTestId(CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE)).toHaveTextContent(CLIENT_MALL_PAY_CANCEL_COPY.NOTICE);
    expect((await screen.findAllByText('10회기 패키지')).length).toBeGreaterThan(0);
    expect(mockService.replaceShopCart).not.toHaveBeenCalled();
    expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY_FAILED)).not.toBeInTheDocument();
  });

  test('바로 구매 → 그 상품 상세로 복귀 · amber 안내 · 장바구니 PUT 없음', async() => {
    runShopPortOnePaymentIfReady.mockRejectedValue(portoneError({ code: PORTONE_USER_CANCEL_CODE }));
    mockService.cancelShopPaymentByUser.mockResolvedValue({
      orderPublicId: 'ord-1', outcome: SHOP_USER_CANCEL_OUTCOME.CANCELLED, checkoutSource: 'BUY_NOW', skuCodes: ['PKG10']
    });
    renderMall(buildBuyNowCheckoutPath('PKG10', 1));

    await payFromCheckout();

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent(buildShopSkuDetailPath('PKG10')));
    expect(await screen.findByTestId(CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE)).toHaveTextContent(CLIENT_MALL_PAY_CANCEL_COPY.NOTICE);
    expect(mockService.replaceShopCart).not.toHaveBeenCalled();
  });

  test('안내는 닫기 버튼 또는 몇 초 뒤 자동으로 사라짐', async() => {
    runShopPortOnePaymentIfReady.mockRejectedValue(portoneError({ code: PORTONE_USER_CANCEL_CODE }));
    mockService.cancelShopPaymentByUser.mockResolvedValue({ outcome: SHOP_USER_CANCEL_OUTCOME.CANCELLED });
    renderMall(CLIENT_SHOP_ROUTES.CHECKOUT);
    await payFromCheckout();
    fireEvent.click(await screen.findByTestId(CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE_CLOSE));
    expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE)).not.toBeInTheDocument();
  });

  test('PortOne 이 이미 PAID 면 취소하지 않고 정상 결제 확인 경로로', async() => {
    runShopPortOnePaymentIfReady.mockRejectedValue(portoneError({ code: PORTONE_USER_CANCEL_CODE }));
    mockService.cancelShopPaymentByUser.mockResolvedValue({ outcome: SHOP_USER_CANCEL_OUTCOME.PAID, paymentId: 'pay-1' });
    renderMall(CLIENT_SHOP_ROUTES.CHECKOUT);

    await payFromCheckout();

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent(CLIENT_SHOP_ROUTES.PAYMENT_RETURN));
  });
});

describe('카드 거절 등 결제 실패', () => {
  test('결제 화면에 머물며 빨간 「결제가 완료되지 않았어요」 + 사유 · 취소 API 호출 없음', async() => {
    runShopPortOnePaymentIfReady.mockRejectedValue(
      portoneError({ code: 'FAILURE_TYPE_PG', message: '[PG_DECLINED] 카드 한도가 초과되었어요' })
    );
    renderMall(CLIENT_SHOP_ROUTES.CHECKOUT);

    await payFromCheckout();

    const alert = await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY_FAILED);
    expect(alert).toHaveTextContent(CLIENT_MALL_CHECKOUT_COPY.PAY_FAILED_TITLE);
    expect(alert).toHaveTextContent('카드 한도가 초과되었어요');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    expect(screen.getByTestId('location-probe')).toHaveTextContent(CLIENT_SHOP_ROUTES.CHECKOUT);
    expect(mockService.cancelShopPaymentByUser).not.toHaveBeenCalled();
    expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE)).not.toBeInTheDocument();
  });

  test('같은 내용으로 재결제하면 같은 멱등 키 (주문 1건 재사용)', async() => {
    runShopPortOnePaymentIfReady.mockRejectedValue(portoneError({ code: 'FAILURE_TYPE_PG', message: 'declined' }));
    renderMall(CLIENT_SHOP_ROUTES.CHECKOUT);

    await payFromCheckout();
    await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY_FAILED);
    await act(() => new Promise((resolve) => setTimeout(resolve, MG_BUTTON_DOUBLE_CLICK_GUARD_MS)));
    await act(async() => {
      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY));
    });

    await waitFor(() => expect(mockService.postShopCheckout).toHaveBeenCalledTimes(2));
    const [first, second] = mockService.postShopCheckout.mock.calls;
    expect(second[0]).toBe(first[0]);
  });
});

describe('redirect 복귀 (ShopPaymentReturnPage)', () => {
  test('code=PAY_PROCESS_CANCELED → 빨간 오류 대신 들어온 화면(장바구니)으로', async() => {
    mockService.cancelShopPaymentByUser.mockResolvedValue({
      outcome: SHOP_USER_CANCEL_OUTCOME.CANCELLED, checkoutSource: 'CART', skuCodes: ['PKG10']
    });
    renderMall(`${CLIENT_SHOP_ROUTES.PAYMENT_RETURN}?orderPublicId=ord-1&paymentId=pay-1&code=${PORTONE_USER_CANCEL_CODE}`);

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent(CLIENT_SHOP_ROUTES.CART));
    expect(mockService.cancelShopPaymentByUser).toHaveBeenCalledWith('ord-1');
    expect(await screen.findByTestId(CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE)).toBeInTheDocument();
  });

  test('바로 구매 주문 취소 → 상품 상세로', async() => {
    mockService.cancelShopPaymentByUser.mockResolvedValue({
      outcome: SHOP_USER_CANCEL_OUTCOME.CANCELLED, checkoutSource: 'BUY_NOW', skuCodes: ['PKG10']
    });
    renderMall(`${CLIENT_SHOP_ROUTES.PAYMENT_RETURN}?orderPublicId=ord-1&code=${PORTONE_USER_CANCEL_CODE}`);

    await waitFor(() => expect(screen.getByTestId('location-probe')).toHaveTextContent(buildShopSkuDetailPath('PKG10')));
  });

  test('카드 거절 code → 복귀 화면에 빨간 「결제가 완료되지 않았어요」 + 사유', async() => {
    renderMall(`${CLIENT_SHOP_ROUTES.PAYMENT_RETURN}?orderPublicId=ord-1&code=FAILURE_TYPE_PG&message=%5BPG%5D%20카드%20거절`);

    const alert = await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY_FAILED);
    expect(alert).toHaveTextContent(CLIENT_MALL_CHECKOUT_COPY.PAY_FAILED_TITLE);
    expect(alert).toHaveTextContent('카드 거절');
    expect(mockService.cancelShopPaymentByUser).not.toHaveBeenCalled();
  });
});

describe('안내 자동 닫힘', () => {
  test(`${CLIENT_MALL_TIMING.PAY_CANCEL_NOTICE_MS}ms 뒤 사라짐`, async() => {
    jest.useFakeTimers();
    try {
      render(
        <MemoryRouter initialEntries={[{ pathname: CLIENT_SHOP_ROUTES.CART, state: { shopPaymentCancelled: true } }]}>
          <Routes>
            <Route path={CLIENT_SHOP_ROUTES.CART} element={<ShopCartPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByTestId(CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE)).toBeInTheDocument();
      act(() => {
        jest.advanceTimersByTime(CLIENT_MALL_TIMING.PAY_CANCEL_NOTICE_MS + 10);
      });
      expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PAY_CANCEL_NOTICE)).not.toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
