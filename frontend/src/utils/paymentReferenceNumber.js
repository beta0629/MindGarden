/**
 * 결제 참조번호 자동 생성 — 배정 생성(MappingCreationModal)·당일 결제(CheckoutSameDayModal) 공용 규칙.
 * 형식: `{접두어}_{YYYYMMDD}_{HHmmss}` (CASH → CASH, CARD → CARD, BANK_TRANSFER → BANK, 그 외 code_value 그대로).
 *
 * @author CoreSolution
 * @since 2026-10-02
 */

const REFERENCE_PREFIX_BY_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK'
};

export const DEFAULT_REFERENCE_PAYMENT_METHOD = 'BANK_TRANSFER';

const pad2 = (value) => String(value).padStart(2, '0');

/**
 * @param {Date} now
 * @returns {string} YYYYMMDD_HHmmss (로컬 시각)
 */
export const formatPaymentReferenceTimestamp = (now) => (
  `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`
  + `_${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`
);

/**
 * @param {string} [method] PAYMENT_METHOD code_value
 * @param {Date} [now]
 * @returns {string}
 */
export const generatePaymentReferenceNumber = (
  method = DEFAULT_REFERENCE_PAYMENT_METHOD,
  now = new Date()
) => {
  const prefix = REFERENCE_PREFIX_BY_METHOD[method] || method;
  return `${prefix}_${formatPaymentReferenceTimestamp(now)}`;
};
