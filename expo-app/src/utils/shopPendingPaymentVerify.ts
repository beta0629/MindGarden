/**
 * 쇼핑 PortOne pending verify stash (MMKV) + redirectUrl deep link.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import * as Linking from 'expo-linking';
import { getMmkv } from '@/lib/getMmkv';
import {
  CLIENT_SHOP_PENDING_VERIFY_STORAGE,
  type ShopPendingPaymentVerify,
} from '@/constants/clientShopConstants';

/**
 * PortOne redirectUrl용 Expo deep link (`scheme: mindgarden`).
 *
 * @param orderPublicId 주문 공개 ID
 */
export const buildShopPaymentReturnUrl = (orderPublicId: string): string => {
  const id =
    orderPublicId != null && String(orderPublicId).trim()
      ? String(orderPublicId).trim()
      : '';
  const queryParams = id ? { orderPublicId: id } : undefined;
  return Linking.createURL('payment-return', {
    scheme: 'mindgarden',
    queryParams,
  });
};

/**
 * @param payload pending verify stash
 */
export const stashShopPendingPaymentVerify = (payload: {
  paymentId: string;
  orderPublicId?: string | null;
  cashAmount: number;
}): void => {
  if (!payload) {
    return;
  }
  const paymentId =
    payload.paymentId != null && String(payload.paymentId).trim()
      ? String(payload.paymentId).trim()
      : '';
  const cashAmount = Number(payload.cashAmount);
  if (!paymentId || !Number.isFinite(cashAmount) || cashAmount <= 0) {
    return;
  }
  const orderPublicId =
    payload.orderPublicId != null && String(payload.orderPublicId).trim()
      ? String(payload.orderPublicId).trim()
      : null;
  const { KEY, FIELD_PAYMENT_ID, FIELD_ORDER_PUBLIC_ID, FIELD_CASH_AMOUNT, MMKV_ID } =
    CLIENT_SHOP_PENDING_VERIFY_STORAGE;
  try {
    getMmkv(MMKV_ID).set(
      KEY,
      JSON.stringify({
        [FIELD_PAYMENT_ID]: paymentId,
        [FIELD_ORDER_PUBLIC_ID]: orderPublicId,
        [FIELD_CASH_AMOUNT]: cashAmount,
      }),
    );
  } catch {
    // MMKV 불가 — redirect verify는 주문 조회로 폴백
  }
};

/**
 * @returns pending verify 또는 null
 */
export const readShopPendingPaymentVerify = (): ShopPendingPaymentVerify | null => {
  const { KEY, FIELD_PAYMENT_ID, FIELD_ORDER_PUBLIC_ID, FIELD_CASH_AMOUNT, MMKV_ID } =
    CLIENT_SHOP_PENDING_VERIFY_STORAGE;
  try {
    const raw = getMmkv(MMKV_ID).getString(KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const paymentId =
      parsed[FIELD_PAYMENT_ID] != null && String(parsed[FIELD_PAYMENT_ID]).trim()
        ? String(parsed[FIELD_PAYMENT_ID]).trim()
        : '';
    const cashAmount = Number(parsed[FIELD_CASH_AMOUNT]);
    if (!paymentId || !Number.isFinite(cashAmount) || cashAmount <= 0) {
      return null;
    }
    const orderPublicId =
      parsed[FIELD_ORDER_PUBLIC_ID] != null &&
      String(parsed[FIELD_ORDER_PUBLIC_ID]).trim()
        ? String(parsed[FIELD_ORDER_PUBLIC_ID]).trim()
        : null;
    return { paymentId, orderPublicId, cashAmount };
  } catch {
    return null;
  }
};

/** pending verify stash 제거 */
export const clearShopPendingPaymentVerify = (): void => {
  try {
    getMmkv(CLIENT_SHOP_PENDING_VERIFY_STORAGE.MMKV_ID).remove(
      CLIENT_SHOP_PENDING_VERIFY_STORAGE.KEY,
    );
  } catch {
    // ignore
  }
};
