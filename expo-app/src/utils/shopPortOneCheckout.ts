/**
 * 쇼핑 결제 준비 후 포트원 V2 requestPayment + 서버 verify 헬퍼.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import {
  PG_PROVIDER_IAMPORT,
  SHOP_CHECKOUT_ERROR_COPY,
  SHOP_PAYMENT_VERIFY_ERROR_PHASE,
} from '@/constants/clientShopConstants';
import {
  mergePortOneCustomerFromPrepare,
  requireCompletePortOneCustomer,
  type PortOneCustomer,
} from '@/utils/clientShopPaymentCustomer';
import { requestPortOnePayment } from '@/utils/portonePayment';
import { verifyShopPaymentWithRetry } from '@/utils/shopPaymentVerifyRetry';
import {
  buildShopPaymentReturnUrl,
  stashShopPendingPaymentVerify,
} from '@/utils/shopPendingPaymentVerify';

export type ShopPreparePaymentLike = {
  storeId?: string | null;
  channelKey?: string | null;
  paymentId?: string | null;
  cashAmount?: number | null;
  orderPublicId?: string | null;
  paymentProvider?: string | null;
  pgReady?: boolean | null;
  payMethod?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  paymentUrl?: string | null;
};

export type RunShopPortOnePaymentResult = {
  prepared: ShopPreparePaymentLike;
  portoneResult?: unknown;
  verified?: boolean;
  skipped?: boolean;
};

export type ShopPaymentVerifyError = Error & {
  shopPaymentPhase?: string;
  orderPublicId?: string;
  portoneResult?: unknown;
};

/**
 * prepare 응답에 storeId+channelKey 가 있으면 포트원 결제 모듈을 호출하고 verify 한다.
 * verify 는 fail-closed: isValid !== true 이면 throw.
 *
 * @param prepareResult prepareShopPayment 응답
 * @param options orderName / redirectUrl / customer
 */
export const runShopPortOnePaymentIfReady = async (
  prepareResult: ShopPreparePaymentLike | null | undefined,
  options: {
    orderName?: string;
    redirectUrl?: string;
    customer?: PortOneCustomer | Record<string, unknown> | null;
  } = {},
): Promise<RunShopPortOnePaymentResult> => {
  if (!prepareResult) {
    throw new Error('결제 준비 결과가 없습니다.');
  }

  const storeId = prepareResult.storeId;
  const channelKey = prepareResult.channelKey;
  const paymentId = prepareResult.paymentId;
  const amount = prepareResult.cashAmount;
  const orderPublicId =
    prepareResult.orderPublicId != null && String(prepareResult.orderPublicId).trim()
      ? String(prepareResult.orderPublicId).trim()
      : null;
  const isIamport =
    prepareResult.paymentProvider === PG_PROVIDER_IAMPORT ||
    prepareResult.pgReady === true ||
    Boolean(storeId && channelKey);

  if (!isIamport || !storeId || !channelKey || !paymentId) {
    return { prepared: prepareResult, skipped: true };
  }

  const customer = requireCompletePortOneCustomer(
    mergePortOneCustomerFromPrepare(options.customer ?? null, prepareResult),
  );

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    throw new Error(SHOP_CHECKOUT_ERROR_COPY.INVALID_CASH_AMOUNT);
  }

  const redirectUrl =
    (options.redirectUrl && String(options.redirectUrl).trim()) ||
    buildShopPaymentReturnUrl(orderPublicId || '');

  stashShopPendingPaymentVerify({
    paymentId: String(paymentId).trim(),
    orderPublicId,
    cashAmount: amountNum,
  });

  const portoneResult = await requestPortOnePayment({
    storeId,
    channelKey,
    paymentId,
    orderName: options.orderName || `주문 ${orderPublicId || ''}`.trim(),
    totalAmount: amountNum,
    currency: 'KRW',
    payMethod: prepareResult.payMethod || 'CARD',
    redirectUrl,
    customer,
    customData: orderPublicId ? { orderPublicId } : undefined,
  });

  if (portoneResult?.code) {
    const err = new Error(
      portoneResult.message || `포트원 결제 실패: ${portoneResult.code}`,
    ) as ShopPaymentVerifyError;
    err.portoneResult = portoneResult;
    throw err;
  }

  try {
    await verifyShopPaymentWithRetry(String(paymentId).trim(), amountNum);
  } catch (verifyError) {
    const err = (
      verifyError instanceof Error
        ? verifyError
        : new Error(SHOP_CHECKOUT_ERROR_COPY.VERIFY_FAILED)
    ) as ShopPaymentVerifyError;
    err.shopPaymentPhase = SHOP_PAYMENT_VERIFY_ERROR_PHASE;
    if (orderPublicId) {
      err.orderPublicId = orderPublicId;
    }
    throw err;
  }

  return { prepared: prepareResult, portoneResult, verified: true, skipped: false };
};
