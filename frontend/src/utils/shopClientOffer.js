/**
 * 내담자별 할인 미리보기 계산.
 * 화면 표시용일 뿐이며 결제 금액은 서버가 확정한다 (BE ShopClientOfferPricing 과 같은 규칙: 율은 내림).
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import {
  SHOP_CLIENT_OFFER_DISCOUNT_TYPE,
  SHOP_CLIENT_OFFER_RATE_MAX_PERCENT,
  CLIENT_SEARCH_PHONE_TAIL_LENGTH
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

const digitsOf = (text) => String(text ?? '').replace(/\D/g, '');

/**
 * with-mapping-info 응답 → 콤보박스 옵션 (이름 + 연락처 뒷자리). 내부 id 는 value 로만 쓰고 화면에 보이지 않는다.
 *
 * @param {Array<object>} clients
 * @param {(name: string, phoneTail: string) => string} formatLabel 연락처가 있을 때의 표시 문구
 * @returns {{ value: string, label: string, searchText: string, phoneDigits: string, name: string }[]}
 */
export const buildClientOptions = (clients, formatLabel) => (Array.isArray(clients) ? clients : [])
  .filter((c) => c && c.id != null)
  .map((c) => {
    const name = String(c.name || c.clientName || '').trim();
    const phoneDigits = digitsOf(c.phone || c.phoneNumber);
    const tail = phoneDigits.slice(-CLIENT_SEARCH_PHONE_TAIL_LENGTH);
    return {
      value: String(c.id),
      name,
      phoneDigits,
      label: tail ? formatLabel(name, tail) : name,
      searchText: name.toLowerCase()
    };
  });

/**
 * 이름 부분 일치 또는 연락처 뒷자리(숫자) 일치.
 *
 * @param {Array<{ searchText?: string, phoneDigits?: string }>} options
 * @param {string} query
 */
export const filterClientOptions = (options, query) => {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) {
    return options;
  }
  const qDigits = digitsOf(q);
  return options.filter((o) => (o.searchText || '').includes(q)
    || (qDigits.length > 0 && qDigits === q.replace(/[\s-]/g, '') && (o.phoneDigits || '').endsWith(qDigits)));
};
