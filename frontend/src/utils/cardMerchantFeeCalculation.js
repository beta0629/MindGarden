/**
 * 카드 가맹점 수수료 계산 (클라이언트 미리보기용).
 * 백엔드 {@link com.coresolution.consultation.util.CardMerchantFeeCalculationUtil} 와 동일 규칙.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */

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
  if (trimmed.toUpperCase() === 'CARD') {
    return true;
  }
  return trimmed === '카드';
};

/**
 * 설정에서 적용 요율(%)을 해석한다.
 * @param {Object|null|undefined} settings
 * @param {string|null|undefined} cardIssuer
 * @returns {number|null}
 */
export const resolveCardMerchantFeeRate = (settings, cardIssuer) => {
  if (!settings) {
    return null;
  }
  const issuerTrim = (cardIssuer || '').trim();
  if (issuerTrim && Array.isArray(settings.issuerRates)) {
    const match = settings.issuerRates.find(
      (row) => row?.issuerLabel === issuerTrim && row?.ratePercent != null && Number(row.ratePercent) > 0
    );
    if (match) {
      return Number(match.ratePercent);
    }
  }
  const average = settings.averageRatePercent;
  if (average != null && Number(average) > 0) {
    return Number(average);
  }
  return null;
};
