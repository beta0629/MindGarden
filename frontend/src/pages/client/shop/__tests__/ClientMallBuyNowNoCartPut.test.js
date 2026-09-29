/**
 * 내담자 몰 회귀 잠금 — 바로구매 카트 PUT 없음 · 매핑 문구 · 상세 칩 「N회기」 (PR #1297)
 *
 * ClientMallFlow.smoke.test.js 는 카탈로그·체크아웃에서 service mock(replaceShopCart) 기준으로만 본다.
 * 여기서는 StandardizedApi 레벨의 PUT 부재와 상품 상세(SKU) 화면 경로만 추가로 잠근다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ShopCatalogPage from '../ShopCatalogPage';
import ShopCheckoutPage from '../ShopCheckoutPage';
import ShopSkuDetailPage from '../ShopSkuDetailPage';
import StandardizedApi from '../../../../utils/standardizedApi';
import { CLIENT_MALL_COPY, CLIENT_MALL_TEST_IDS } from '../../../../constants/clientMallConstants';
import { CLIENT_SHOP_API } from '../../../../constants/clientShopApi';
import { CLIENT_SHOP_ROUTES, CLIENT_SHOP_TEST_IDS } from '../../../../constants/clientShopConstants';
import { buildBuyNowCheckoutPath } from '../../../../utils/clientMallBuyNow';

const mockUseSession = jest.fn();
const mockService = {
  fetchShopCatalog: jest.fn(),
  fetchShopCatalogSku: jest.fn(),
  fetchShopCart: jest.fn(),
  fetchPointBalance: jest.fn(),
  fetchConsultantMappings: jest.fn()
};

jest.mock('../../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue(null),
    post: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({}),
    patch: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({})
  }
}));

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
    fetchPointBalance: (...a) => mockService.fetchPointBalance(...a),
    fetchConsultantMappings: (...a) => mockService.fetchConsultantMappings(...a)
  };
});

jest.mock('../../../../utils/shopPortOneCheckout', () => ({
  runShopPortOnePaymentIfReady: jest.fn()
}));

jest.mock('../../../../services/clientPhoneVerifyService', () => ({
  sendPhoneVerificationCode: jest.fn(),
  confirmPhoneVerificationCode: jest.fn()
}));

jest.mock(
  '../../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

const PKG10 = {
  skuCode: 'PKG10',
  title: '10회기 패키지',
  descriptionText: '50분 개인상담 10회',
  unitPriceMinor: 850000,
  sessionCount: 10,
  validityMonths: 3,
  catalogCategory: 'GOODS'
};

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>;
};

const sessionFor = () => ({
  user: { id: 7, name: '김내담', role: 'CLIENT' },
  isLoggedIn: true,
  isLoading: false,
  hasCheckedSession: true,
  checkSession: jest.fn().mockResolvedValue(true),
  logout: jest.fn(),
  setModalOpen: jest.fn()
});

const cartPutCalls = () => StandardizedApi.put.mock.calls.filter(([url]) => url === CLIENT_SHOP_API.CART);

const renderSkuDetail = () => render(
  <MemoryRouter initialEntries={[`${CLIENT_SHOP_ROUTES.SKU_DETAIL}/${PKG10.skuCode}`]}>
    <Routes>
      <Route path={`${CLIENT_SHOP_ROUTES.SKU_DETAIL}/:skuCode`} element={<ShopSkuDetailPage />} />
      <Route path={CLIENT_SHOP_ROUTES.CHECKOUT} element={<LocationProbe />} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  mockUseSession.mockReturnValue(sessionFor());
  mockService.fetchShopCatalog.mockResolvedValue([PKG10]);
  mockService.fetchShopCatalogSku.mockResolvedValue(PKG10);
  mockService.fetchShopCart.mockResolvedValue({ lines: [], subtotalMinor: 0 });
  mockService.fetchPointBalance.mockResolvedValue({ availableMinor: 0, heldMinor: 0 });
  mockService.fetchConsultantMappings.mockResolvedValue([]);
});

describe('내담자 몰 바로구매 — 카트 PUT 없음', () => {
  test('#1297 카탈로그 바로구매 — StandardizedApi 카트 PUT 없이 SKU 한 줄 결제 전 확인으로', async() => {
    render(
      <MemoryRouter initialEntries={[CLIENT_SHOP_ROUTES.CATALOG]}>
        <Routes>
          <Route path={CLIENT_SHOP_ROUTES.CATALOG} element={<ShopCatalogPage />} />
          <Route path={CLIENT_SHOP_ROUTES.CHECKOUT} element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByTestId(CLIENT_MALL_TEST_IDS.CARD_BUY_NOW));
    expect(await screen.findByTestId('location-probe')).toHaveTextContent(buildBuyNowCheckoutPath('PKG10', 1));
    expect(cartPutCalls()).toHaveLength(0);
  });

  test('#1297 상품 상세 바로구매 — StandardizedApi 카트 PUT 없이 선택 수량 그대로 결제 전 확인으로', async() => {
    renderSkuDetail();

    await screen.findByTestId('pdp-session-count-ticket');
    fireEvent.click(screen.getByRole('button', { name: CLIENT_MALL_COPY.QTY_INCREASE }));
    fireEvent.click(screen.getByRole('button', { name: CLIENT_MALL_COPY.BUY_NOW }));

    expect(await screen.findByTestId('location-probe')).toHaveTextContent(buildBuyNowCheckoutPath('PKG10', 2));
    expect(cartPutCalls()).toHaveLength(0);
  });
});

describe('내담자 몰 결제 전 확인 — 매핑 문구', () => {
  test('#1297 매핑 없음 — 상담사 칸 경고(role=alert) 문구가 정확히 「담당 상담사 연결 후 구매할 수 있어요」', async() => {
    mockUseSession.mockReturnValue({
      ...sessionFor(),
      user: { id: 7, name: '김내담', role: 'CLIENT', phone: '01012341234', isPhoneVerified: true }
    });
    mockService.fetchShopCatalog.mockResolvedValue([{ ...PKG10, catalogCategory: 'CONSULTATION' }]);
    mockService.fetchShopCart.mockResolvedValue({
      lines: [{ skuCode: 'PKG10', title: PKG10.title, quantity: 1, unitPriceMinor: 850000, lineTotalMinor: 850000, sessionCount: 10 }],
      subtotalMinor: 850000
    });
    render(
      <MemoryRouter initialEntries={[CLIENT_SHOP_ROUTES.CHECKOUT]}>
        <ShopCheckoutPage />
      </MemoryRouter>
    );

    await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY);
    const alert = await screen.findByText(
      (content, element) => element?.getAttribute('role') === 'alert'
        && element.textContent === '담당 상담사 연결 후 구매할 수 있어요'
    );
    expect(alert).toHaveClass('client-mall-field__error');
    expect(cartPutCalls()).toHaveLength(0);
  });
});

describe('내담자 몰 상품 상세 — 회기 칩', () => {
  test('#1297 상품 상세 칩 「10회기」 · 상세 본문 어떤 문구에도 「회기회기」 없음', async() => {
    renderSkuDetail();

    expect(await screen.findByTestId('pdp-session-count-ticket')).toHaveTextContent(/^10회기$/);
    const article = screen.getByTestId(CLIENT_SHOP_TEST_IDS.PDP);
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) {
      texts.push(walker.currentNode.nodeValue);
    }
    expect(texts.length).toBeGreaterThan(0);
    texts.forEach((text) => expect(text).not.toMatch(/회기회기/));
  });
});
