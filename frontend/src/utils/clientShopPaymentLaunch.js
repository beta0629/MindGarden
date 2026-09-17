/**
 * 내담자 샵 prepare 응답 → PortOne SDK 또는 paymentUrl 결제 진입.
 *
 * @author MindGarden
 * @since 2026-09-17
 */

import { SHOP_PAYMENT_LAUNCH_COPY } from '../constants/clientShopConstants';
import { requestPortOnePayment } from './portonePayment';

/**
 * prepare DTO로 결제 UI를 연다.
 *
 * @param {object|null|undefined} prepareResult prepareShopPayment 언랩 결과
 * @param {{ orderName?: string }} [options]
 * @returns {Promise<{ mode: 'portone'|'url', paymentUrl?: string }>}
 */
export const launchShopPaymentFromPrepare = async(prepareResult, options = {}) => {
  const orderName =
    (options.orderName && String(options.orderName).trim()) ||
    SHOP_PAYMENT_LAUNCH_COPY.ORDER_NAME;

  const cashAmount = Number(prepareResult?.cashAmount);
  const canUsePortOne =
    prepareResult?.pgReady === true &&
    prepareResult?.storeId &&
    prepareResult?.channelKey &&
    prepareResult?.paymentId &&
    Number.isFinite(cashAmount) &&
    cashAmount > 0;

  if (canUsePortOne) {
    const portOneResult = await requestPortOnePayment({
      storeId: prepareResult.storeId,
      channelKey: prepareResult.channelKey,
      paymentId: prepareResult.paymentId,
      orderName,
      totalAmount: cashAmount,
      currency: 'KRW'
    });
    if (portOneResult?.code) {
      throw new Error(
        portOneResult.message || `결제 모듈 오류: ${portOneResult.code}`
      );
    }
    return { mode: 'portone' };
  }

  if (prepareResult?.paymentUrl) {
    window.open(
      prepareResult.paymentUrl,
      '_blank',
      SHOP_PAYMENT_LAUNCH_COPY.WINDOW_FEATURES
    );
    return { mode: 'url', paymentUrl: prepareResult.paymentUrl };
  }

  throw new Error(SHOP_PAYMENT_LAUNCH_COPY.MODULE_UNAVAILABLE);
};
