/**
 * 내담자 몰 TO-BE — 목록 담기(토스트·배지) · 빈 상태 · 결제 전 확인 게이트 · 인라인 휴대폰 인증
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

const sessionFor = (userPatch = {}) => ({
  user: { id: 7, name: '김내담', role: 'CLIENT', ...userPatch },
  isLoggedIn: true,
  isLoading: false,
  hasCheckedSession: true,
  checkSession: jest.fn().mockResolvedValue(true),
  logout: jest.fn(),
  setModalOpen: jest.fn()
});

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
});
