/**
 * 내담자별 할인 미리보기 계산.
 * 화면 표시용일 뿐이며 결제 금액은 서버가 확정한다 (BE ShopClientOfferPricing 과 같은 규칙: 율은 내림).
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import {
  SHOP_CLIENT_OFFER_DISCOUNT_TYPE,
  SHOP_CLIENT_OFFER_RATE_MAX_PERCENT
} from '../constants/shopClientOfferConstants';
import { MIN_PAYMENT_AMOUNT } from '../constants/paymentAmountConstants';

/**
 * @param {number} originalMinor 원가(원)
 * @param {string} type AMOUNT | RATE
 * @param {number|string} rawValue 입력 값
 * @returns {number|null} 최종가. 잘못된 입력이면 null
 */
export const previewOfferFinalPrice = (originalMinor, type, rawValue) => {
  const original = Number(originalMinor);
  const value = Number(rawValue);
  if (!Number.isInteger(original) || original <= 0 || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  let discount;
  if (type === SHOP_CLIENT_OFFER_DISCOUNT_TYPE.AMOUNT) {
    if (value >= original) {
      return null;
    }
    discount = value;
  } else if (type === SHOP_CLIENT_OFFER_DISCOUNT_TYPE.RATE) {
    if (value > SHOP_CLIENT_OFFER_RATE_MAX_PERCENT) {
      return null;
    }
    discount = Math.floor((original * value) / 100);
  } else {
    return null;
  }
  const result = original - discount;
  return result >= MIN_PAYMENT_AMOUNT ? result : null;
};
