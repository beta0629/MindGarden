/**
 * 카드 가맹점 수수료 계산 (클라이언트 미리보기용).
 * 백엔드 {@link com.coresolution.consultation.util.CardMerchantFeeCalculationUtil} 와 동일 규칙.
 * 요율은 averageRatePercent만 사용(issuer override 무시).
 * 적용일 전(transactionDate < 2026-09-01)이면 수수료 0.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */

/** BE CardMerchantFeeConstants.FEE_EFFECTIVE_FROM 과 동일 (요율 하드코딩 아님 · 정책 적용일) */
export const CARD_MERCHANT_FEE_EFFECTIVE_FROM = '2026-09-01';

/**
 * BE CardMerchantFeeConstants.MAPPING_CARD_PAYMENT_METHOD_CODES 와 동일 SSOT.
 * billing.js MAPPING_PAYMENT_METHOD_LABELS · CheckoutSameDayModal 등과 동기화.
 */
export const MAPPING_CARD_PAYMENT_METHOD_CODES = [
  'CARD',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'CARD_TERMINAL',
  '카드'
];

/**
 * @param {number|string|null|undefined} amount
 * @param {number|string|null|undefined} ratePercent
 * @returns {number}
 */
export const calculateCardMerchantFee = (amount, ratePercent) => {
  const amountNum = Number(amount);
  const rateNum = Number(ratePercent);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return 0;
  }
  if (!Number.isFinite(rateNum) || rateNum <= 0) {
    return 0;
  }
  return Math.round((amountNum * rateNum) / 100);
};

/**
 * 카드 결제 수단 여부.
 * @param {string|null|undefined} paymentMethod
 * @returns {boolean}
 */
export const isCardPaymentMethod = (paymentMethod) => {
  if (!paymentMethod || typeof paymentMethod !== 'string') {
    return false;
  }
  const trimmed = paymentMethod.trim();
  if (trimmed === '카드') {
    return true;
  }
  const upper = trimmed.toUpperCase();
  return MAPPING_CARD_PAYMENT_METHOD_CODES.some(
    (code) => code !== '카드' && code.toUpperCase() === upper
  );
};

/**
 * 거래일이 수수료 적용 시작일(이상)인지.
 * @param {string|Date|null|undefined} transactionDate
 * @returns {boolean}
 */
export const isCardMerchantFeeEffectiveDate = (transactionDate) => {
  if (transactionDate == null || transactionDate === '') {
    return false;
  }
  let ymd;
  if (transactionDate instanceof Date) {
    if (Number.isNaN(transactionDate.getTime())) {
      return false;
    }
    const y = transactionDate.getFullYear();
    const m = String(transactionDate.getMonth() + 1).padStart(2, '0');
    const d = String(transactionDate.getDate()).padStart(2, '0');
    ymd = `${y}-${m}-${d}`;
  } else {
    ymd = String(transactionDate).trim().slice(0, 10);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return false;
  }
  return ymd >= CARD_MERCHANT_FEE_EFFECTIVE_FROM;
};

/**
 * 설정에서 적용 요율(%)을 해석한다. issuer는 무시하고 averageRatePercent만 사용.
 * @param {Object|null|undefined} settings
 * @param {string|null|undefined} _cardIssuer 시그니처 호환용(미사용)
 * @returns {number|null}
 */
export const resolveCardMerchantFeeRate = (settings, _cardIssuer) => {
  if (!settings) {
    return null;
  }
  const average = settings.averageRatePercent;
  if (average != null && Number(average) > 0) {
    return Number(average);
  }
  return null;
};

/**
 * 미리보기·payload용 수수료 금액. 적용일 전이면 0.
 * @param {Object|null|undefined} settings
 * @param {number|string|null|undefined} amount
 * @param {string|null|undefined} paymentMethod
 * @param {string|null|undefined} cardIssuer
 * @param {string|Date|null|undefined} transactionDate
 * @returns {number}
 */
export const resolveCardMerchantFeeAmount = (
  settings,
  amount,
  paymentMethod,
  cardIssuer,
  transactionDate
) => {
  if (!isCardPaymentMethod(paymentMethod)) {
    return 0;
  }
  if (!isCardMerchantFeeEffectiveDate(transactionDate)) {
    return 0;
  }
  const rate = resolveCardMerchantFeeRate(settings, cardIssuer);
  if (rate == null) {
    return 0;
  }
  return calculateCardMerchantFee(amount, rate);
};
