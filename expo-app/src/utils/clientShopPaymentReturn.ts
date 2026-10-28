/**
 * PortOne redirect 복귀 → BE verify 금액·쿼리 해석 (fail-closed).
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import { SHOP_CHECKOUT_ERROR_COPY } from '@/constants/clientShopConstants';
import { readShopPendingPaymentVerify } from '@/utils/shopPendingPaymentVerify';

const nonBlankTrimmed = (value: unknown): string | null => {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed || null;
};

export type ShopPaymentReturnQuery = {
  paymentId: string | null;
  orderPublicId: string | null;
  code: string | null;
  message: string | null;
};

/**
 * 복귀 쿼리 paymentId가 없으면 stash(orderPublicId 일치)에서 폴백.
 *
 * @param query return 쿼리
 */
export const resolveShopPaymentReturnPaymentId = (
  query: { paymentId?: string | null; orderPublicId?: string | null } = {},
): string | null => {
  const fromQuery = nonBlankTrimmed(query.paymentId);
  if (fromQuery) {
    return fromQuery;
  }
  const stash = readShopPendingPaymentVerify();
  if (!stash || !stash.paymentId) {
    return null;
  }
  const oid = nonBlankTrimmed(query.orderPublicId);
  if (oid && stash.orderPublicId && stash.orderPublicId === oid) {
    return stash.paymentId;
  }
  return null;
};

/**
 * URLSearchParams / query 유사 객체에서 복귀 쿼리를 파싱.
 *
 * @param searchParams get(key) 가능한 객체 또는 Record
 */
export const parseShopPaymentReturnQuery = (
  searchParams:
    | URLSearchParams
    | { get?: (key: string) => string | null | undefined }
    | Record<string, string | string[] | undefined>
    | null
    | undefined,
): ShopPaymentReturnQuery => {
  const getFromRecord = (key: string): string | null => {
    if (!searchParams || typeof searchParams !== 'object') {
      return null;
    }
    if ('get' in searchParams && typeof searchParams.get === 'function') {
      return nonBlankTrimmed(searchParams.get(key));
    }
    const rec = searchParams as Record<string, string | string[] | undefined>;
    const raw = rec[key];
    if (Array.isArray(raw)) {
      return nonBlankTrimmed(raw[0]);
    }
    return nonBlankTrimmed(raw);
  };
  return {
    paymentId: getFromRecord('paymentId'),
    orderPublicId: getFromRecord('orderPublicId'),
    code: getFromRecord('code'),
    message: getFromRecord('message'),
  };
};

/**
 * 주문 객체에서 현금 결제 금액을 꺼낸다 (invent 금지).
 *
 * @param order 주문
 */
export const resolveCashAmountFromOrder = (
  order: { cashDueMinor?: unknown; cashDue?: unknown } | null | undefined,
): number | null => {
  if (!order || typeof order !== 'object') {
    return null;
  }
  const raw = order.cashDueMinor ?? order.cashDue;
  if (raw != null && typeof raw === 'object') {
    return null;
  }
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  return amount;
};

/**
 * stash 또는 주문 조회로 verify 금액을 확정.
 *
 * @param params paymentId / orderPublicId / fetchOrder
 */
export const resolveShopPaymentVerifyAmount = async ({
  paymentId,
  orderPublicId,
  fetchOrder,
}: {
  paymentId?: string | null;
  orderPublicId?: string | null;
  fetchOrder?: (orderPublicId: string) => Promise<{
    cashDueMinor?: unknown;
    cashDue?: unknown;
  } | null>;
} = {}): Promise<number> => {
  const stash = readShopPendingPaymentVerify();
  if (stash) {
    const matchesPayment =
      paymentId && stash.paymentId === String(paymentId).trim();
    const matchesOrder =
      orderPublicId &&
      stash.orderPublicId &&
      stash.orderPublicId === String(orderPublicId).trim();
    if (matchesPayment || matchesOrder) {
      return stash.cashAmount;
    }
  }

  const oid = nonBlankTrimmed(orderPublicId);
  if (!oid || typeof fetchOrder !== 'function') {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }
  const order = await fetchOrder(oid);
  const fromOrder = resolveCashAmountFromOrder(order);
  if (fromOrder == null) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }
  return fromOrder;
};
