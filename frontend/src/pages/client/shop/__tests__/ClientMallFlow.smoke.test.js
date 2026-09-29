/**
 * 내담자 몰 TO-BE — 목록 담기(토스트·배지) · 빈 상태 · 결제 전 확인 게이트 · 인라인 휴대폰 인증
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ShopCatalogPage from '../ShopCatalogPage';
import ShopCheckoutPage from '../ShopCheckoutPage';
import {
  CLIENT_MALL_CHECKOUT_COPY,
  CLIENT_MALL_COPY,
  CLIENT_MALL_PHONE_COPY,
  CLIENT_MALL_TEST_IDS,
  CLIENT_REFUND_NOTICE,
  buildClientMallProductUsageNotice
} from '../../../../constants/clientMallConstants';
import { CLIENT_SHOP_ROUTES, SHOP_CHECKOUT_MAPPING_COPY } from '../../../../constants/clientShopConstants';
import { buildBuyNowCheckoutPath } from '../../../../utils/clientMallBuyNow';

const mockUseSession = jest.fn();
const mockService = {
  fetchShopCatalog: jest.fn(),
  fetchShopCart: jest.fn(),
  replaceShopCart: jest.fn(),
  mergeGuestShopCartIntoServer: jest.fn(),
  fetchPointBalance: jest.fn(),
  fetchConsultantMappings: jest.fn(),
  postShopCheckout: jest.fn(),
  prepareShopPayment: jest.fn(),
  cancelShopOrder: jest.fn(),
  fetchShopCatalogSku: jest.fn()
};
const mockSendCode = jest.fn();
const mockConfirmCode = jest.fn();

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
    fetchShopCart: (...a) => mockService.fetchShopCart(...a),
    replaceShopCart: (...a) => mockService.replaceShopCart(...a),
    mergeGuestShopCartIntoServer: (...a) => mockService.mergeGuestShopCartIntoServer(...a),
    fetchPointBalance: (...a) => mockService.fetchPointBalance(...a),
    fetchConsultantMappings: (...a) => mockService.fetchConsultantMappings(...a),
    postShopCheckout: (...a) => mockService.postShopCheckout(...a),
    prepareShopPayment: (...a) => mockService.prepareShopPayment(...a),
    cancelShopOrder: (...a) => mockService.cancelShopOrder(...a),
    fetchShopCatalogSku: (...a) => mockService.fetchShopCatalogSku(...a)
  };
});

jest.mock('../../../../utils/shopPortOneCheckout', () => ({
  runShopPortOnePaymentIfReady: jest.fn()
}));

jest.mock('../../../../services/clientPhoneVerifyService', () => ({
  sendPhoneVerificationCode: (...a) => mockSendCode(...a),
  confirmPhoneVerificationCode: (...a) => mockConfirmCode(...a)
}));

jest.mock(
  '../../../../assets/images/auth/deprecated-mindgarden/core-logo-butterfly.png',
  () => 'butterfly-logo.png'
);

const CATALOG = [
  { skuCode: 'PKG10', title: '10회기 패키지', descriptionText: '50분 개인상담 10회', unitPriceMinor: 850000, sessionCount: 10, validityMonths: 3, catalogCategory: 'GOODS' },
  { skuCode: 'ONE', title: '단회기', unitPriceMinor: 90000, sessionCount: 1, catalogCategory: 'GOODS' }
];

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>;
};

const mockMatchMedia = (matches) => {
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn()
  }));
};

const sessionFor = (userPatch = {}) => ({
  user: { id: 7, name: '김내담', role: 'CLIENT', ...userPatch },
  isLoggedIn: true,
  isLoading: false,
  hasCheckedSession: true,
  checkSession: jest.fn().mockResolvedValue(true),
  logout: jest.fn(),
  setModalOpen: jest.fn()
});

const PHONE_TIMER_FIXED_NOW_MS = Date.UTC(2026, 8, 30);

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  window.localStorage.clear();
  mockService.fetchShopCatalog.mockResolvedValue(CATALOG);
  mockService.fetchShopCart.mockResolvedValue({ lines: [], subtotalMinor: 0 });
  mockService.replaceShopCart.mockResolvedValue();
  mockService.mergeGuestShopCartIntoServer.mockResolvedValue({ merged: false, lines: [] });
  mockService.fetchPointBalance.mockResolvedValue({ availableMinor: 0, heldMinor: 0 });
  mockService.fetchConsultantMappings.mockResolvedValue([]);
  delete window.matchMedia;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ShopCatalogPage (TO-BE)', () => {
  test('판매 상품 전부를 관리자 순서로 · N원 · 이용기간은 설정된 상품만', async() => {
    mockUseSession.mockReturnValue(sessionFor());
    render(<MemoryRouter><ShopCatalogPage /></MemoryRouter>);

    const cards = await screen.findAllByTestId(CLIENT_MALL_TEST_IDS.PRODUCT_CARD);
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText('10회기 패키지')).toBeInTheDocument();
    expect(within(cards[0]).getByText('850,000')).toBeInTheDocument();
    expect(within(cards[0]).getByText('결제일부터 3개월')).toBeInTheDocument();
    expect(within(cards[1]).queryByText(CLIENT_MALL_COPY.ROW_VALIDITY)).not.toBeInTheDocument();
    expect(screen.getByText(CLIENT_REFUND_NOTICE)).toBeInTheDocument();
    expect(screen.queryByText(/₩/)).not.toBeInTheDocument();
  });

  test('회기 칩은 「N회기」 · 설명 없으면 「50분 개인상담 N회」 · 회기회기 중복 없음', async() => {
    mockUseSession.mockReturnValue(sessionFor());
    render(<MemoryRouter><ShopCatalogPage /></MemoryRouter>);

    expect(await screen.findByTestId('client-mall-chip-PKG10')).toHaveTextContent(/^10회기$/);
    expect(screen.getByTestId('client-mall-chip-ONE')).toHaveTextContent(/^1회기$/);
    const cards = screen.getAllByTestId(CLIENT_MALL_TEST_IDS.PRODUCT_CARD);
    expect(within(cards[1]).getByText(
      `${CLIENT_MALL_COPY.CARD_DESC_FALLBACK_PREFIX}1${CLIENT_MALL_COPY.CARD_DESC_FALLBACK_SUFFIX}`
    )).toBeInTheDocument();
    cards.forEach((card) => expect(card.textContent).not.toMatch(/회기회기/));
  });

  test('바로 구매 → 장바구니를 건드리지 않고 SKU 한 줄만 결제 전 확인으로', async() => {
    mockUseSession.mockReturnValue(sessionFor());
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
    expect(mockService.replaceShopCart).not.toHaveBeenCalled();
  });

  test('하단 바 — 「장바구니」 줄 + N개 · N원', async() => {
    mockUseSession.mockReturnValue(sessionFor());
    render(<MemoryRouter><ShopCatalogPage /></MemoryRouter>);

    const cards = await screen.findAllByTestId(CLIENT_MALL_TEST_IDS.PRODUCT_CARD);
    await act(async() => {
      fireEvent.click(within(cards[0]).getByRole('button', { name: CLIENT_MALL_COPY.ADD_TO_CART }));
    });
    const bar = screen.getByTestId(CLIENT_MALL_TEST_IDS.CART_BAR);
    expect(within(bar).getByText(CLIENT_MALL_COPY.BAR_LABEL)).toBeInTheDocument();
    expect(bar).toHaveTextContent('1개 · 850,000원');
  });

  test('담기 → 토스트 · 배지 · 합계 즉시 갱신 · 서버 반영', async() => {
    mockUseSession.mockReturnValue(sessionFor());
    render(<MemoryRouter><ShopCatalogPage /></MemoryRouter>);

    const cards = await screen.findAllByTestId(CLIENT_MALL_TEST_IDS.PRODUCT_CARD);
    await act(async() => {
      fireEvent.click(within(cards[0]).getByRole('button', { name: CLIENT_MALL_COPY.ADD_TO_CART }));
    });

    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.TOAST)).toHaveTextContent(CLIENT_MALL_COPY.TOAST_TITLE);
    expect(screen.getByTestId('client-shop-cart-badge')).toHaveTextContent('1');
    const summary = screen.getByTestId(CLIENT_MALL_TEST_IDS.CART_SUMMARY);
    expect(within(summary).getAllByText('850,000원').length).toBeGreaterThan(0);
    expect(within(summary).getByTestId(CLIENT_MALL_TEST_IDS.CART_SUMMARY_CHECKOUT)).not.toBeDisabled();
    await waitFor(() => {
      expect(mockService.replaceShopCart).toHaveBeenCalledWith([{ skuCode: 'PKG10', quantity: 1 }]);
    });
  });

  test('빈 장바구니면 결제하기 비활성 · 상품 0개면 빈 상태 문구', async() => {
    mockUseSession.mockReturnValue(sessionFor());
    mockService.fetchShopCatalog.mockResolvedValue([]);
    render(<MemoryRouter><ShopCatalogPage /></MemoryRouter>);

    expect(await screen.findByText(CLIENT_MALL_COPY.EMPTY_TITLE)).toBeInTheDocument();
    expect(screen.getByText(CLIENT_MALL_COPY.EMPTY_BODY)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.CART_SUMMARY_CHECKOUT)).toBeDisabled();
    expect(screen.getByTestId('client-shop-cart-badge')).toHaveTextContent('0');
  });
});

describe('ShopCheckoutPage (TO-BE)', () => {
  const cartWithPkg = { lines: [{ skuCode: 'PKG10', title: '10회기 패키지', quantity: 1, unitPriceMinor: 850000, lineTotalMinor: 850000, sessionCount: 10 }], subtotalMinor: 850000 };

  test('미인증·미동의 → 결제 버튼 비활성 + §5.8 이유 · 줄마다 §9 안내', async() => {
    mockUseSession.mockReturnValue(sessionFor({ phone: '01012341234', isPhoneVerified: false }));
    mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
    render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

    const pay = await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY);
    expect(pay).toBeDisabled();
    expect(pay).toHaveTextContent('850,000원 결제하기');
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_BLOCK_REASON)).toHaveTextContent(CLIENT_MALL_CHECKOUT_COPY.BLOCK_BOTH);
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_LINE_NOTICE)).toHaveTextContent(buildClientMallProductUsageNotice(3));

    fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_AGREE_ALL));
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_BLOCK_REASON)).toHaveTextContent(CLIENT_MALL_CHECKOUT_COPY.BLOCK_PHONE);
  });

  test('인증 완료 + 전체 동의 → 결제 버튼 활성', async() => {
    mockUseSession.mockReturnValue(sessionFor({ phone: '01012341234', isPhoneVerified: true }));
    mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
    render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

    const pay = await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY);
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_VERIFIED)).toHaveTextContent('010-****-1234');
    expect(pay).toBeDisabled();
    fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_AGREE_ALL));
    expect(pay).not.toBeDisabled();
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_BLOCK_REASON)).toHaveTextContent(CLIENT_MALL_CHECKOUT_COPY.PAY_WINDOW_HINT);
  });

  test('인라인 휴대폰 인증 — 라우트 이동 없이 발송·틀린 번호·확인', async() => {
    mockUseSession.mockReturnValue(sessionFor({ phone: '', isPhoneVerified: false }));
    mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
    mockSendCode.mockResolvedValue({ deliveryChannel: 'SMS', meta: { expiresInSeconds: null, resendCooldownSeconds: null, remainingAttempts: null, retryAfterSeconds: null } });
    const wrong = new Error('인증 코드가 올바르지 않거나 만료되었습니다. 다시 받아 주세요.');
    wrong.status = 400;
    mockConfirmCode.mockRejectedValueOnce(wrong).mockResolvedValueOnce({ phone: '01055551234', phoneVerifiedAt: '2026-09-29T10:00:00' });
    render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

    fireEvent.click(await screen.findByRole('button', { name: CLIENT_MALL_PHONE_COPY.START }));
    fireEvent.change(screen.getByLabelText(CLIENT_MALL_PHONE_COPY.PHONE_INPUT_LABEL), { target: { value: '010-5555-1234' } });
    await act(async() => {
      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_SEND));
    });
    expect(mockSendCode).toHaveBeenCalledWith('01055551234');
    expect(screen.getByText(`010-****-1234${CLIENT_MALL_PHONE_COPY.SENT_SUFFIX}`)).toBeInTheDocument();
    expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PHONE_TIMER)).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CODE), { target: { value: '111111' } });
    await act(async() => {
      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CONFIRM));
    });
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_ERROR)).toHaveTextContent(CLIENT_MALL_PHONE_COPY.WRONG_CODE);

    fireEvent.change(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CODE), { target: { value: '123456' } });
    await act(async() => {
      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CONFIRM));
    });
    expect(mockConfirmCode).toHaveBeenLastCalledWith('01055551234', '123456');
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_VERIFIED)).toHaveTextContent('010-****-1234');
  });

  test('발송 실패 문구', async() => {
    mockUseSession.mockReturnValue(sessionFor({ phone: '', isPhoneVerified: false }));
    mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
    mockSendCode.mockRejectedValue(Object.assign(new Error('x'), { status: 500 }));
    render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

    fireEvent.click(await screen.findByRole('button', { name: CLIENT_MALL_PHONE_COPY.START }));
    fireEvent.change(screen.getByLabelText(CLIENT_MALL_PHONE_COPY.PHONE_INPUT_LABEL), { target: { value: '01055551234' } });
    await act(async() => {
      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_SEND));
    });
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_ERROR)).toHaveTextContent(CLIENT_MALL_PHONE_COPY.SEND_FAILED);
  });

  test('결제 전 확인 — eyebrow · 포인트 0P · 보유 0P · +10회기 · 수량 · 환불 한 문장(예시 없음)', async() => {
    mockUseSession.mockReturnValue(sessionFor({ phone: '01012341234', isPhoneVerified: false }));
    mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
    render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

    await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY);
    expect(screen.getAllByText(CLIENT_MALL_CHECKOUT_COPY.EYEBROW)).toHaveLength(2);
    expect(screen.getByTestId('client-mall-pay-points')).toHaveTextContent('0P · 보유 0P');
    expect(screen.getByTestId('client-mall-pay-sessions')).toHaveTextContent('+10회기');
    expect(screen.getByText(CLIENT_MALL_CHECKOUT_COPY.BUYER_PHONE_CARD_HINT)).toBeInTheDocument();
    expect(screen.getByText(CLIENT_MALL_CHECKOUT_COPY.PHONE_NEEDS_VERIFY)).toBeInTheDocument();
    expect(screen.getByText(CLIENT_MALL_CHECKOUT_COPY.PHONE_NEEDS_VERIFY_HINT)).toBeInTheDocument();
    const refund = screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_REFUND);
    expect(refund).toHaveTextContent(CLIENT_REFUND_NOTICE);
    expect(refund.textContent).not.toMatch(/예시/);
    expect(screen.getByTestId('client-mall-checkout-bar')).toHaveTextContent(CLIENT_MALL_CHECKOUT_COPY.PAY_SECTION);
  });

  test('바로 구매 체크아웃 — 서버 장바구니를 바꾸지 않고 그 SKU 한 줄만 lines 로 결제', async() => {
    mockUseSession.mockReturnValue(sessionFor({ phone: '01012341234', isPhoneVerified: true }));
    mockService.fetchShopCart.mockResolvedValue({
      lines: [{ skuCode: 'ONE', title: '단회기', quantity: 3, unitPriceMinor: 90000, lineTotalMinor: 270000, sessionCount: 1 }],
      subtotalMinor: 270000
    });
    mockService.postShopCheckout.mockResolvedValue({ orderPublicId: 'ord-1', cashDueMinor: 1700000 });
    render(
      <MemoryRouter initialEntries={[buildBuyNowCheckoutPath('PKG10', 2)]}>
        <ShopCheckoutPage />
      </MemoryRouter>
    );

    const pay = await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY);
    expect(pay).toHaveTextContent('1,700,000원 결제하기');
    expect(screen.getByText(CLIENT_MALL_CHECKOUT_COPY.BUY_NOW_CAPTION)).toBeInTheDocument();
    expect(screen.queryByText('단회기')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_AGREE_ALL));
    await act(async() => {
      fireEvent.click(pay);
    });
    await waitFor(() => expect(mockService.postShopCheckout).toHaveBeenCalled());
    const args = mockService.postShopCheckout.mock.calls[0];
    expect(args[3]).toEqual([{ skuCode: 'PKG10', quantity: 2 }]);
    expect(mockService.replaceShopCart).not.toHaveBeenCalled();
  });

  test('상담 상품 + 매핑 없음 → 「담당 상담사 연결 후 구매할 수 있어요」 · 결제창 안내 숨김', async() => {
    mockUseSession.mockReturnValue(sessionFor({ phone: '01012341234', isPhoneVerified: true }));
    mockService.fetchShopCatalog.mockResolvedValue([{ ...CATALOG[0], catalogCategory: 'CONSULTATION' }]);
    mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
    mockService.fetchConsultantMappings.mockResolvedValue([]);
    render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

    const pay = await screen.findByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY);
    await waitFor(() => {
      expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_BLOCK_REASON))
        .toHaveTextContent(SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING);
    });
    expect(SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING).toBe('담당 상담사 연결 후 구매할 수 있어요');
    fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_AGREE_ALL));
    expect(pay).toBeDisabled();
    expect(screen.queryByText(CLIENT_MALL_CHECKOUT_COPY.PAY_WINDOW_HINT)).not.toBeInTheDocument();
  });

  test('좁은 화면 — 「휴대폰 인증」 바텀시트 · 보낸 뒤 「문자가 안 오면…」', async() => {
    jest.useFakeTimers();
    jest.setSystemTime(PHONE_TIMER_FIXED_NOW_MS);
    mockMatchMedia(true);
    mockUseSession.mockReturnValue(sessionFor({ phone: '', isPhoneVerified: false }));
    mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
    mockSendCode.mockResolvedValue({ deliveryChannel: 'SMS', meta: { expiresInSeconds: 300, resendCooldownSeconds: 30, remainingAttempts: 5, retryAfterSeconds: null } });
    render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

    fireEvent.click(await screen.findByTestId(CLIENT_MALL_TEST_IDS.PHONE_OPEN));
    const sheet = await screen.findByTestId(CLIENT_MALL_TEST_IDS.PHONE_SHEET);
    expect(screen.getByText(CLIENT_MALL_PHONE_COPY.SHEET_TITLE)).toBeInTheDocument();
    fireEvent.change(within(sheet).getByLabelText(CLIENT_MALL_PHONE_COPY.PHONE_INPUT_LABEL), { target: { value: '01055551234' } });
    await act(async() => {
      fireEvent.click(within(sheet).getByTestId(CLIENT_MALL_TEST_IDS.PHONE_SEND));
    });
    expect(within(sheet).getByText(CLIENT_MALL_PHONE_COPY.SENT_HELP)).toBeInTheDocument();
    expect(within(sheet).getByTestId(CLIENT_MALL_TEST_IDS.PHONE_TIMER)).toHaveTextContent('5:00');
  });

  test('오답 → (c) 「n회 남았어요」 · 5번째 오답(429 잠김) → (c) 없이 (f) 잠김', async() => {
    mockUseSession.mockReturnValue(sessionFor({ phone: '', isPhoneVerified: false }));
    mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
    mockSendCode.mockResolvedValue({ deliveryChannel: 'SMS', meta: { expiresInSeconds: 300, resendCooldownSeconds: null, remainingAttempts: 5, retryAfterSeconds: null } });
    const wrong = Object.assign(new Error('인증 코드가 올바르지 않거나 만료되었습니다. 다시 받아 주세요.'), {
      status: 400,
      response: { data: { success: false, errorCode: 'SMS_OTP_INVALID', data: { locked: false, remainingAttempts: 4 } } }
    });
    const locked = Object.assign(new Error('인증 시도 횟수를 넘었습니다. 잠시 뒤에 다시 시도해 주세요.'), {
      status: 429,
      response: { data: { success: false, errorCode: 'SMS_OTP_LOCKED', data: { locked: true, remainingAttempts: 0, retryAfterSeconds: 600 } } }
    });
    mockConfirmCode.mockRejectedValueOnce(wrong).mockRejectedValueOnce(locked);
    render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

    fireEvent.click(await screen.findByRole('button', { name: CLIENT_MALL_PHONE_COPY.START }));
    fireEvent.change(screen.getByLabelText(CLIENT_MALL_PHONE_COPY.PHONE_INPUT_LABEL), { target: { value: '01055551234' } });
    await act(async() => {
      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_SEND));
    });

    fireEvent.change(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CODE), { target: { value: '111111' } });
    await act(async() => {
      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CONFIRM));
    });
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_ERROR)).toHaveTextContent('4회 남았어요');

    fireEvent.change(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CODE), { target: { value: '222222' } });
    await act(async() => {
      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CONFIRM));
    });
    expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PHONE_ERROR)).not.toBeInTheDocument();
    expect(screen.getByText(CLIENT_MALL_PHONE_COPY.LOCKED_TITLE)).toBeInTheDocument();
    expect(screen.getByText(`10${CLIENT_MALL_PHONE_COPY.LOCKED_BODY_MINUTES_SUFFIX}`)).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CODE)).toBeDisabled();
  });

  describe('서버 인증 완료자 — 재인증 시트 없음', () => {
    const closeSheet = async() => {
      await act(async() => {
        fireEvent.click(document.querySelector('.mg-modal__close'));
      });
    };

    test('좁은 화면 — 인증 완료·마스킹·「번호 변경」만 · 결제 눌러도 시트 없음', async() => {
      mockMatchMedia(true);
      mockUseSession.mockReturnValue(sessionFor({ phone: '01012341234', isPhoneVerified: true }));
      mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
      render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

      const verified = await screen.findByTestId(CLIENT_MALL_TEST_IDS.PHONE_VERIFIED);
      expect(verified).toHaveTextContent(`${CLIENT_MALL_PHONE_COPY.VERIFIED_PREFIX}010-****-1234`);
      expect(within(verified).getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CHANGE)).toHaveTextContent(CLIENT_MALL_PHONE_COPY.CHANGE_NUMBER);
      expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PHONE_OPEN)).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_AGREE_ALL));
      await act(async() => {
        fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.CHECKOUT_PAY));
      });
      await waitFor(() => expect(mockService.postShopCheckout).toHaveBeenCalled());
      expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PHONE_SHEET)).not.toBeInTheDocument();
      expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_VERIFIED)).toBeInTheDocument();
    });

    test('「번호 변경」 때만 시트 · 닫으면 인증 완료로 복귀(「인증하기」로 떨어지지 않음)', async() => {
      mockMatchMedia(true);
      mockUseSession.mockReturnValue(sessionFor({ phone: '01012341234', isPhoneVerified: true }));
      mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
      render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

      await screen.findByTestId(CLIENT_MALL_TEST_IDS.PHONE_VERIFIED);
      expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PHONE_SHEET)).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CHANGE));
      const sheet = await screen.findByTestId(CLIENT_MALL_TEST_IDS.PHONE_SHEET);
      expect(within(sheet).getByLabelText(CLIENT_MALL_PHONE_COPY.PHONE_INPUT_LABEL)).toBeInTheDocument();

      await closeSheet();
      expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PHONE_SHEET)).not.toBeInTheDocument();
      expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PHONE_OPEN)).not.toBeInTheDocument();
      expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_VERIFIED)).toHaveTextContent('010-****-1234');

      fireEvent.click(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_CHANGE));
      expect(await screen.findByTestId(CLIENT_MALL_TEST_IDS.PHONE_SHEET)).toBeInTheDocument();
    });

    test('미인증자 — 기존대로 「인증하기」 → 시트 · 닫아도 「인증하기」 유지', async() => {
      mockMatchMedia(true);
      mockUseSession.mockReturnValue(sessionFor({ phone: '01012341234', isPhoneVerified: false }));
      mockService.fetchShopCart.mockResolvedValue(cartWithPkg);
      render(<MemoryRouter initialEntries={['/client/shop/checkout']}><ShopCheckoutPage /></MemoryRouter>);

      fireEvent.click(await screen.findByTestId(CLIENT_MALL_TEST_IDS.PHONE_OPEN));
      expect(await screen.findByTestId(CLIENT_MALL_TEST_IDS.PHONE_SHEET)).toBeInTheDocument();
      await closeSheet();
      expect(screen.queryByTestId(CLIENT_MALL_TEST_IDS.PHONE_VERIFIED)).not.toBeInTheDocument();
      expect(screen.getByTestId(CLIENT_MALL_TEST_IDS.PHONE_OPEN)).toBeInTheDocument();
    });
  });
});
