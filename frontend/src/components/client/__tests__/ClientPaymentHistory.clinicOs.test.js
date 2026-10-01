/**
 * ClientPaymentHistory — Clinic-OS 개편 화면 테스트
 * 칩 URL 쿼리 · 배지 매핑(APPROVED 포함) · 결제수단 「카드」만 · 환불 「-1」 폴백 · 빈/에러/일부 실패
 * 스펙: docs/design/clinic-os-client-payments.md
 *
 * @author CoreSolution
 * @since 2026-09-30
 */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import StandardizedApi from '../../../utils/standardizedApi';
import { fetchShopOrder, fetchShopOrders } from '../../../services/clientShopService';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { CLIENT_PAYMENT_TEST_IDS } from '../../../constants/clientPaymentHistoryConstants';
import ClientPaymentHistory from '../ClientPaymentHistory';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../../../services/clientShopService', () => ({
  fetchShopOrders: jest.fn(),
  fetchShopOrder: jest.fn()
}));

jest.mock('../../../hooks/useMediaQuery', () => ({
  useMediaQuery: jest.fn(() => false)
}));

jest.mock('../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>
}));

jest.mock('../ClientWebPageShell', () => ({
  __esModule: true,
  default: ({ title, meta, main, aside, testId }) => (
    <div data-testid={testId} data-has-aside={aside ? 'true' : 'false'}>
      <h1>{title}</h1>
      {meta}
      <main>{main}</main>
    </div>
  )
}));

const LocationProbe = () => {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
};

const renderScreen = (initialEntry = '/client/payment-history') => render(
  <MemoryRouter initialEntries={[initialEntry]}>
    <ClientPaymentHistory />
    <LocationProbe />
  </MemoryRouter>
);

const USER = { id: 77 };

const MAPPINGS = [
  {
    id: 930,
    packageName: '-1',
    productTitle: null,
    paymentAmount: 90000,
    paymentStatus: 'REFUNDED',
    effectivePaymentStatus: 'REFUNDED',
    paymentMethod: 'CREDIT_CARD',
    paymentSource: 'MANUAL',
    paymentProvider: 'IAMPORT',
    totalSessions: 10,
    paymentDate: '2026-09-30T10:00:00'
  },
  {
    id: 929,
    packageName: '기본 10회기',
    paymentAmount: 100000,
    paymentStatus: 'APPROVED',
    paymentMethod: 'CARD_TERMINAL',
    paymentSource: 'MANUAL',
    totalSessions: 10,
    paymentDate: '2026-09-29T10:00:00'
  },
  {
    id: 928,
    packageName: '검사',
    paymentAmount: 30000,
    paymentStatus: 'PENDING',
    paymentMethod: 'BANK_TRANSFER',
    paymentSource: 'MANUAL',
    totalSessions: 0,
    paymentDate: '2026-09-28T10:00:00'
  }
];

const SHOP_ORDERS = [
  { orderPublicId: 'pub-1', status: 'PAID', cashDueMinor: 50000, createdAt: '2026-09-27T10:00:00' }
];

const mockApi = ({ mappings = MAPPINGS, mappingsFail = false } = {}) => {
  StandardizedApi.get.mockImplementation((url) => {
    if (url === '/api/v1/auth/current-user') {
      return Promise.resolve(USER);
    }
    if (mappingsFail) {
      return Promise.resolve(null);
    }
    return Promise.resolve({ mappings, count: mappings.length });
  });
};

const rowsByProduct = () => screen.getAllByTestId(CLIENT_PAYMENT_TEST_IDS.ROW);
const waitForRows = () => screen.findAllByTestId(CLIENT_PAYMENT_TEST_IDS.ROW);

beforeEach(() => {
  jest.clearAllMocks();
  useMediaQuery.mockReturnValue(false);
  fetchShopOrders.mockResolvedValue(SHOP_ORDERS);
  fetchShopOrder.mockResolvedValue({ lines: [{ title: '온라인 5회기', sessionCount: 5 }] });
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  console.warn.mockRestore();
});

describe('ClientPaymentHistory — layout', () => {
  test('aside 없음 · 칩 바 · ≥768 시맨틱 표 · 헤더 aria-hidden 없음', async() => {
    mockApi();
    renderScreen();
    await waitForRows();
    const table = screen.getByTestId(CLIENT_PAYMENT_TEST_IDS.TABLE);
    expect(screen.getByTestId('client-payment-history-page')).toHaveAttribute('data-has-aside', 'false');
    expect(screen.getByTestId(CLIENT_PAYMENT_TEST_IDS.FILTER_BAR)).toBeInTheDocument();
    expect(within(table).getAllByRole('columnheader').map((th) => th.textContent))
      .toEqual(['결제일', '상품', '금액', '결제수단', '상태']);
    expect(table.querySelector('thead[aria-hidden]')).toBeNull();
    expect(table.querySelector('caption').textContent).toBe('결제 내역 · 전체 기간 · 전체 · 4건');
    expect(screen.getByRole('link', { name: '구매 목록 보기 ›' })).toBeInTheDocument();
  });

  test('<768 카드 리스트', async() => {
    useMediaQuery.mockReturnValue(true);
    mockApi();
    renderScreen();
    await waitForRows();
    expect(screen.getByTestId(CLIENT_PAYMENT_TEST_IDS.CARDS)).toBeInTheDocument();
    expect(screen.queryByTestId(CLIENT_PAYMENT_TEST_IDS.TABLE)).toBeNull();
  });
});

describe('ClientPaymentHistory — 행 표기', () => {
  test('배지 6종 매핑 (APPROVED → 완료 · REFUNDED → 환불 · PENDING → 대기)', async() => {
    mockApi();
    renderScreen();
    await waitForRows();
    const badges = screen.getAllByTestId(CLIENT_PAYMENT_TEST_IDS.BADGE).map((b) => b.textContent);
    expect(badges).toEqual(['환불', '완료', '대기', '완료']);
    expect(screen.queryByText('미결제')).toBeNull();
    expect(screen.queryByText('환불완료')).toBeNull();
  });

  test('환불 「-1」 행: 상품 폴백 · 절댓값 · 전액 환불 보조줄 · 음수·₩·PortOne 없음', async() => {
    mockApi();
    renderScreen();
    await waitForRows();
    const [refundRow] = rowsByProduct();
    expect(within(refundRow).getByText('상품 정보 없음')).toBeInTheDocument();
    expect(within(refundRow).getByText('90,000원')).toBeInTheDocument();
    expect(within(refundRow).getByText('전액 환불')).toBeInTheDocument();
    expect(within(refundRow).getByText('10회기')).toBeInTheDocument();
    expect(refundRow.textContent).not.toMatch(/-1|₩|PortOne/);
    expect(document.body.textContent).not.toMatch(/₩|PortOne/);
  });

  test('할부 정보 없음 → 「카드」만 (「일시불」 없음) · 채널 회색 텍스트', async() => {
    mockApi();
    renderScreen();
    await waitForRows();
    const rows = rowsByProduct();
    expect(within(rows[1]).getByText('카드')).toBeInTheDocument();
    expect(within(rows[1]).getByText('센터 결제')).toBeInTheDocument();
    expect(within(rows[3]).getByText('카드')).toBeInTheDocument();
    expect(within(rows[3]).getByText('온라인')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/일시불/);
  });

  test('온라인 주문: 상세 라인으로 상품명 복원 · 링크', async() => {
    mockApi();
    renderScreen();
    const link = await screen.findByRole('link', { name: '온라인 5회기' });
    expect(link).toHaveAttribute('href', '/client/shop/orders/pub-1');
    expect(fetchShopOrder).toHaveBeenCalledWith('pub-1');
  });

  test('결과 요약 (필터된 전체 기준)', async() => {
    mockApi();
    renderScreen();
    await waitForRows();
    const summary = screen.getByTestId(CLIENT_PAYMENT_TEST_IDS.SUMMARY);
    await waitFor(() => expect(summary.textContent).toBe('4건 · 결제 240,000원 · 환불 90,000원'));
    expect(summary).toHaveAttribute('aria-live', 'polite');
  });
});

describe('ClientPaymentHistory — 필터 칩 URL 쿼리', () => {
  test('칩 선택 → URL 쿼리 · 페이지 초기화 · 결과 반영', async() => {
    mockApi();
    renderScreen('/client/payment-history?page=2');
    await waitForRows();
    const statusGroup = screen.getByRole('group', { name: '상태' });
    fireEvent.click(within(statusGroup).getByRole('button', { name: '환불' }));
    expect(screen.getByTestId('location-search').textContent).toBe('?status=refunded');
    expect(within(statusGroup).getByRole('button', { name: '환불' })).toHaveAttribute('aria-pressed', 'true');
    expect(rowsByProduct()).toHaveLength(1);

    const periodGroup = screen.getByRole('group', { name: '기간' });
    fireEvent.click(within(periodGroup).getByRole('button', { name: '3개월' }));
    expect(screen.getByTestId('location-search').textContent).toBe('?status=refunded&period=3m');

    fireEvent.click(within(periodGroup).getByRole('button', { name: '전체 기간' }));
    expect(screen.getByTestId('location-search').textContent).toBe('?status=refunded');
  });

  test('URL 쿼리에서 선택값 복원 (새로고침·뒤로가기)', async() => {
    mockApi();
    renderScreen('/client/payment-history?status=pending');
    await waitForRows();
    const statusGroup = screen.getByRole('group', { name: '상태' });
    expect(within(statusGroup).getByRole('button', { name: '대기' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(statusGroup).getByRole('button', { name: '전체' })).toHaveAttribute('aria-pressed', 'false');
    expect(rowsByProduct()).toHaveLength(1);
  });
});

describe('ClientPaymentHistory — 빈·에러·일부 실패 (§7)', () => {
  test('전체 없음: 필터 바 숨김 · 「회기 고르기」 primary', async() => {
    mockApi({ mappings: [] });
    fetchShopOrders.mockResolvedValue([]);
    renderScreen();
    expect(await screen.findByText('아직 결제 내역이 없어요')).toBeInTheDocument();
    expect(screen.queryByTestId(CLIENT_PAYMENT_TEST_IDS.FILTER_BAR)).toBeNull();
    expect(screen.getByRole('link', { name: '회기 고르기' })).toHaveAttribute('href', '/client/shop');
  });

  test('필터 결과 없음: 필터 바·요약 유지 · 「필터 초기화」', async() => {
    mockApi({ mappings: [MAPPINGS[1]] });
    fetchShopOrders.mockResolvedValue([]);
    renderScreen('/client/payment-history?status=refunded');
    expect(await screen.findByText('조건에 맞는 결제 내역이 없어요')).toBeInTheDocument();
    expect(screen.getByTestId(CLIENT_PAYMENT_TEST_IDS.SUMMARY).textContent).toBe('0건 · 결제 0원');
    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }));
    expect(screen.getByTestId('location-search').textContent).toBe('');
    expect(rowsByProduct()).toHaveLength(1);
  });

  test('전체 실패: role=alert · 필터 바 숨김 · 다시 시도', async() => {
    mockApi({ mappingsFail: true });
    renderScreen();
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('결제 내역을 불러오지 못했어요')).toBeInTheDocument();
    expect(screen.queryByTestId(CLIENT_PAYMENT_TEST_IDS.FILTER_BAR)).toBeNull();
    mockApi();
    fireEvent.click(within(alert).getByRole('button', { name: '다시 시도' }));
    expect(await waitForRows()).toHaveLength(4);
  });

  test('일부 실패(온라인): 안내 한 줄 · 나머지 행 표시 · 요약 「(일부)」', async() => {
    mockApi();
    fetchShopOrders.mockRejectedValue(new Error('network'));
    renderScreen();
    expect(await screen.findByTestId(CLIENT_PAYMENT_TEST_IDS.PARTIAL_ERROR)).toBeInTheDocument();
    expect(rowsByProduct()).toHaveLength(3);
    expect(screen.getByTestId(CLIENT_PAYMENT_TEST_IDS.SUMMARY).textContent).toMatch(/\(일부\)$/);
  });

  test('로딩: skeleton 행 · aria-busy', async() => {
    let resolveUser;
    StandardizedApi.get.mockImplementation(() => new Promise((resolve) => {
      resolveUser = resolve;
    }));
    renderScreen();
    expect(screen.getAllByTestId(CLIENT_PAYMENT_TEST_IDS.SKELETON)).toHaveLength(5);
    expect(screen.getByTestId(CLIENT_PAYMENT_TEST_IDS.FILTER_BAR)).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    resolveUser(null);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

describe('ClientPaymentHistory — 페이징 (공통 MGPagination)', () => {
  test('10건 초과 → 페이지네이션 · 페이지 이동 시 URL page', async() => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      packageName: `상품 ${i + 1}`,
      paymentAmount: 1000,
      paymentStatus: 'CONFIRMED',
      paymentMethod: 'CASH',
      paymentSource: 'MANUAL',
      paymentDate: `2026-09-${String(i + 1).padStart(2, '0')}T10:00:00`
    }));
    mockApi({ mappings: many });
    fetchShopOrders.mockResolvedValue([]);
    renderScreen();
    await screen.findByTestId(CLIENT_PAYMENT_TEST_IDS.PAGINATION);
    expect(rowsByProduct()).toHaveLength(10);
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByTestId('location-search').textContent).toBe('?page=2');
    expect(rowsByProduct()).toHaveLength(2);
  });

  test('온라인 주문 끝까지 읽기 (서버 size 50 페이지 반복)', async() => {
    mockApi({ mappings: [] });
    const fullPage = Array.from({ length: 50 }, (_, i) => ({
      orderPublicId: `p-${i}`, status: 'EXPIRED', cashDueMinor: 0, createdAt: '2026-09-01T10:00:00'
    }));
    fetchShopOrders
      .mockResolvedValueOnce(fullPage)
      .mockResolvedValueOnce([{ orderPublicId: 'last', status: 'PAID', cashDueMinor: 7000, createdAt: '2026-01-01T10:00:00' }]);
    renderScreen();
    await waitForRows();
    expect(fetchShopOrders).toHaveBeenNthCalledWith(1, 0, 50);
    expect(fetchShopOrders).toHaveBeenNthCalledWith(2, 1, 50);
    expect(rowsByProduct()).toHaveLength(1);
  });
});
