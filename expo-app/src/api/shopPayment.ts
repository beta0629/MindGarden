/**
 * 쇼핑 PortOne 결제 verify·cancel API (웹 CLIENT_SHOP_API 와 동일 경로).
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import { apiGet, apiPost } from '@/api/client';
import { SHOP_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import {
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_USER_CANCEL_OUTCOME,
} from '@/constants/clientShopConstants';

export type ShopPaymentVerifyResult = {
  isValid: boolean;
  message?: string;
};

export type ShopUserCancelResult = {
  outcome: string;
  paymentId?: string;
};

/**
 * PortOne SDK 성공 후 BE 결제 검증 (fail-closed: isValid !== true → throw).
 *
 * @param paymentId PortOne paymentId
 * @param amount prepare cashAmount
 */
export async function verifyShopPayment(
  paymentId: string,
  amount: number,
): Promise<ShopPaymentVerifyResult> {
  if (!paymentId || !String(paymentId).trim()) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED);
  }
  if (amount == null || typeof amount === 'object' || !Number.isFinite(Number(amount))) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }
  const raw = await apiPost<unknown>(
    SHOP_API.verifyPayment(String(paymentId).trim(), Number(amount)),
    {},
  );
  if (raw == null) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.SESSION_EXPIRED);
  }
  if (typeof raw === 'object' && (raw as { success?: boolean }).success === false) {
    throw new Error(
      (raw as { message?: string }).message || SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED,
    );
  }
  const data = unwrapApiResponse<ShopPaymentVerifyResult>(raw);
  if (!data || data.isValid !== true) {
    const msg =
      data && typeof data.message === 'string' && data.message.trim()
        ? data.message.trim()
        : SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED;
    throw new Error(msg);
  }
  return data;
}

/**
 * 결제 전 고아 주문 취소 (CREATED / PENDING_PAYMENT).
 *
 * @param orderPublicId 주문 공개 ID
 */
export async function cancelShopOrder(orderPublicId: string): Promise<void> {
  const id = orderPublicId != null ? String(orderPublicId).trim() : '';
  if (!id) {
    return;
  }
  const raw = await apiPost<unknown>(SHOP_API.cancelOrder(id), {});
  if (raw != null && typeof raw === 'object' && (raw as { success?: boolean }).success === false) {
    throw new Error((raw as { message?: string }).message || '주문 취소에 실패했습니다.');
  }
}

/**
 * 결제창 사용자 취소 후 서버 정리.
 *
 * @param orderPublicId 주문 공개 ID
 */
export async function cancelShopPaymentByUser(
  orderPublicId: string,
): Promise<ShopUserCancelResult> {
  const id = orderPublicId != null ? String(orderPublicId).trim() : '';
  if (!id) {
    return { outcome: SHOP_USER_CANCEL_OUTCOME.NOT_CANCELLABLE };
  }
  const raw = await apiPost<unknown>(SHOP_API.userCancelPayment(id), {});
  if (raw != null && typeof raw === 'object' && (raw as { success?: boolean }).success === false) {
    throw new Error((raw as { message?: string }).message || '결제 취소 정리에 실패했습니다.');
  }
  const data = unwrapApiResponse<ShopUserCancelResult>(raw);
  return data ?? { outcome: SHOP_USER_CANCEL_OUTCOME.UNVERIFIED };
}

/**
 * 주문 상세 조회 (verify 금액 폴백용).
 *
 * @param orderPublicId 주문 공개 ID
 */
export async function fetchShopOrderForPayment(
  orderPublicId: string,
): Promise<{ cashDueMinor?: number; status?: string; orderPublicId?: string } | null> {
  const id = orderPublicId != null ? String(orderPublicId).trim() : '';
  if (!id) {
    return null;
  }
  const raw = await apiGet<unknown>(SHOP_API.orderDetail(id));
  const data = unwrapApiResponse<{
    cashDueMinor?: number;
    status?: string;
    orderPublicId?: string;
  }>(raw);
  return data && typeof data === 'object' ? data : null;
}
