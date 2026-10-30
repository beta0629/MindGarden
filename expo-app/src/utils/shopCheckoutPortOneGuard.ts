/**
 * Clinic-OS 샵 체크아웃 ↔ PortOne 기동 가드.
 * create 전에 customer fail-closed. create 이후 PortOne 미기동 시 CREATED 주문 cancel.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import {
  SHOP_PAYMENT_LAUNCH_COPY,
  SHOP_USER_CANCEL_OUTCOME,
} from '@/constants/clientShopConstants';
import {
  assertPortOneCustomerReadyBeforeCheckout,
  type PortOneCustomer,
  type PortOneCustomerSessionUser,
} from '@/utils/clientShopPaymentCustomer';
import { isPortOneUserCancel } from '@/utils/shopPaymentCancel';
import type { RunShopPortOnePaymentResult } from '@/utils/shopPortOneCheckout';

export type ShopCheckoutPortOneStatus =
  | 'BLOCKED_CUSTOMER'
  | 'NON_PAYMENT'
  | 'PORTONE_READY'
  | 'ORPHAN_CANCELLED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_LAUNCHED'
  | 'USER_CANCELLED'
  | 'PAID_AFTER_CANCEL';

export type ShopCheckoutPortOneGuardResult = {
  status: ShopCheckoutPortOneStatus;
  message: string;
  posted: boolean;
  checkoutResult?: { orderPublicId?: string; nextStep?: string } | null;
  cancelled?: boolean;
  customer?: PortOneCustomer | null;
  portoneFlow?: RunShopPortOnePaymentResult;
  cancelOutcome?: string | null;
  paymentId?: string;
};

/**
 * prepare 응답으로 PortOne SDK를 열 수 있는지.
 *
 * @param prepared prepare 응답
 */
export const isShopPrepareReadyForPortOne = (
  prepared: {
    paymentId?: string | null;
    storeId?: string | null;
    channelKey?: string | null;
  } | null | undefined,
): boolean => {
  if (!prepared || typeof prepared !== 'object') {
    return false;
  }
  const paymentId = prepared.paymentId != null ? String(prepared.paymentId).trim() : '';
  const storeId = prepared.storeId != null ? String(prepared.storeId).trim() : '';
  const channelKey = prepared.channelKey != null ? String(prepared.channelKey).trim() : '';
  return Boolean(paymentId && storeId && channelKey);
};

/**
 * 고아 방지용 주문 취소 (실패해도 throw하지 않음).
 *
 * @param cancelShopOrderFn cancel API
 * @param orderPublicId 주문 ID
 */
export const cancelOrphanShopOrderQuietly = async (
  cancelShopOrderFn: ((orderPublicId: string) => Promise<unknown>) | undefined,
  orderPublicId: string,
): Promise<boolean> => {
  if (!orderPublicId || typeof cancelShopOrderFn !== 'function') {
    return false;
  }
  try {
    await cancelShopOrderFn(orderPublicId);
    return true;
  } catch (e) {
    console.warn('쇼핑 고아 주문 취소 실패:', orderPublicId, e);
    return false;
  }
};

const settleUserCancel = async ({
  cancelShopPaymentByUser,
  orderPublicId,
  checkoutResult,
  customer,
}: {
  cancelShopPaymentByUser?: (
    orderPublicId: string,
  ) => Promise<{ outcome: string; paymentId?: string }>;
  orderPublicId: string;
  checkoutResult: { orderPublicId?: string; nextStep?: string };
  customer: PortOneCustomer | null;
}): Promise<ShopCheckoutPortOneGuardResult> => {
  let cancelResult: { outcome: string; paymentId?: string } | null = null;
  if (typeof cancelShopPaymentByUser === 'function') {
    try {
      cancelResult = await cancelShopPaymentByUser(orderPublicId);
    } catch (e) {
      console.warn('결제창 취소 후 주문 정리 실패:', orderPublicId, e);
    }
  }
  if (cancelResult?.outcome === SHOP_USER_CANCEL_OUTCOME.PAID && cancelResult.paymentId) {
    return {
      status: 'PAID_AFTER_CANCEL',
      message: '',
      posted: true,
      checkoutResult,
      customer,
      paymentId: String(cancelResult.paymentId),
    };
  }
  return {
    status: 'USER_CANCELLED',
    message: '',
    posted: true,
    checkoutResult,
    customer,
    cancelOutcome: cancelResult?.outcome ?? null,
  };
};

/**
 * 체크아웃 → prepare → PortOne. incomplete customer면 post 호출 없이 차단.
 *
 * @param deps 주입 의존성
 */
export const runShopCheckoutWithPortOneGuard = async ({
  user,
  pointsRedeemMinor,
  mappingIdForCheckout,
  createIdempotencyKey,
  postShopCheckout,
  prepareShopPayment,
  runShopPortOnePaymentIfReady,
  cancelShopOrder,
  cancelShopPaymentByUser,
}: {
  user: PortOneCustomerSessionUser | null | undefined;
  pointsRedeemMinor: number;
  mappingIdForCheckout: string | number | null | undefined;
  createIdempotencyKey: () => string;
  postShopCheckout: (
    key: string,
    points: number,
    mappingId: string | number | null | undefined,
  ) => Promise<{ orderPublicId?: string; nextStep?: string }>;
  prepareShopPayment: (orderPublicId: string) => Promise<{
    paymentId?: string | null;
    storeId?: string | null;
    channelKey?: string | null;
    cashAmount?: number | null;
    orderPublicId?: string | null;
    paymentProvider?: string | null;
    pgReady?: boolean | null;
    customerEmail?: string | null;
    customerName?: string | null;
    paymentUrl?: string | null;
  }>;
  runShopPortOnePaymentIfReady: (
    prepared: object,
    options: object,
  ) => Promise<RunShopPortOnePaymentResult>;
  cancelShopOrder: (orderPublicId: string) => Promise<unknown>;
  cancelShopPaymentByUser?: (
    orderPublicId: string,
  ) => Promise<{ outcome: string; paymentId?: string }>;
}): Promise<ShopCheckoutPortOneGuardResult> => {
  const gate = assertPortOneCustomerReadyBeforeCheckout(user);
  if (!gate.ready) {
    return {
      status: 'BLOCKED_CUSTOMER',
      message: gate.message || SHOP_PAYMENT_LAUNCH_COPY.CUSTOMER_PHONE_REQUIRED,
      posted: false,
      checkoutResult: null,
    };
  }

  const checkoutResult = await postShopCheckout(
    createIdempotencyKey(),
    pointsRedeemMinor,
    mappingIdForCheckout,
  );

  if (checkoutResult?.nextStep !== 'PAYMENT' || !checkoutResult.orderPublicId) {
    return {
      status: 'NON_PAYMENT',
      message: SHOP_PAYMENT_LAUNCH_COPY.ORDER_ACCEPTED_FOLLOW_GUIDE,
      posted: true,
      checkoutResult,
      customer: gate.customer,
    };
  }

  const orderPublicId = checkoutResult.orderPublicId;

  const raceGate = assertPortOneCustomerReadyBeforeCheckout(user);
  if (!raceGate.ready) {
    const cancelled = await cancelOrphanShopOrderQuietly(cancelShopOrder, orderPublicId);
    return {
      status: 'ORPHAN_CANCELLED',
      message: raceGate.message || SHOP_PAYMENT_LAUNCH_COPY.ORPHAN_ORDER_CANCELLED,
      posted: true,
      checkoutResult,
      cancelled,
      customer: null,
    };
  }

  let prepared;
  try {
    prepared = await prepareShopPayment(orderPublicId);
  } catch (prepareError) {
    await cancelOrphanShopOrderQuietly(cancelShopOrder, orderPublicId);
    throw prepareError;
  }

  if (!isShopPrepareReadyForPortOne(prepared)) {
    const cancelled = await cancelOrphanShopOrderQuietly(cancelShopOrder, orderPublicId);
    return {
      status: 'ORPHAN_CANCELLED',
      message: SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE,
      posted: true,
      checkoutResult,
      cancelled,
      customer: raceGate.customer,
    };
  }

  let portoneFlow: RunShopPortOnePaymentResult;
  try {
    portoneFlow = await runShopPortOnePaymentIfReady(prepared, {
      orderName: `주문 ${orderPublicId}`,
      customer: raceGate.customer,
    });
  } catch (portoneError: unknown) {
    const err = portoneError as { portoneResult?: unknown };
    if (isPortOneUserCancel(err?.portoneResult as { code?: string } | null)) {
      return settleUserCancel({
        cancelShopPaymentByUser,
        orderPublicId,
        checkoutResult,
        customer: raceGate.customer,
      });
    }
    throw portoneError;
  }

  if (portoneFlow?.skipped) {
    const cancelled = await cancelOrphanShopOrderQuietly(cancelShopOrder, orderPublicId);
    return {
      status: 'ORPHAN_CANCELLED',
      message: SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE,
      posted: true,
      checkoutResult,
      cancelled,
      customer: raceGate.customer,
      portoneFlow,
    };
  }

  if (portoneFlow?.verified) {
    return {
      status: 'PAYMENT_VERIFIED',
      message: SHOP_PAYMENT_LAUNCH_COPY.PAYMENT_COMPLETED,
      posted: true,
      checkoutResult,
      customer: raceGate.customer,
      portoneFlow,
    };
  }

  return {
    status: 'PAYMENT_LAUNCHED',
    message: SHOP_PAYMENT_LAUNCH_COPY.PAYMENT_MODULE_CALLED,
    posted: true,
    checkoutResult,
    customer: raceGate.customer,
    portoneFlow,
  };
};
