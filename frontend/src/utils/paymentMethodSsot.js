/**
 * 결제 수단 SSOT — common_codes PAYMENT_METHOD extra_data 기반 유틸.
 * 백엔드 PaymentMethodSsotUtil / PaymentMethodSsotService 와 동일 규칙.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */

const EXTRA_DATA_KEY_CARD_MERCHANT_FEE_ELIGIBLE = 'cardMerchantFeeEligible';
const EXTRA_DATA_KEY_LEGACY_ALIASES = 'legacyAliases';

/**
 * @param {string|null|undefined} extraData
 * @returns {boolean}
 */
export const parseCardMerchantFeeEligible = (extraData) => {
  if (!extraData || typeof extraData !== 'string') {
    return false;
  }
  try {
    const parsed = JSON.parse(extraData);
    return parsed?.[EXTRA_DATA_KEY_CARD_MERCHANT_FEE_ELIGIBLE] === true;
  } catch {
    return false;
  }
};

/**
 * @param {string|null|undefined} extraData
 * @returns {string[]}
 */
export const parseLegacyAliases = (extraData) => {
  if (!extraData || typeof extraData !== 'string') {
    return [];
  }
  try {
    const parsed = JSON.parse(extraData);
    const aliases = parsed?.[EXTRA_DATA_KEY_LEGACY_ALIASES];
    if (!Array.isArray(aliases)) {
      return [];
    }
    return aliases.filter((item) => typeof item === 'string' && item.trim() !== '');
  } catch {
    return [];
  }
};

/**
 * @param {string|null|undefined} rawValue
 * @param {Array<{codeValue?: string, extraData?: string}>|null|undefined} codes
 * @returns {{codeValue: string, extraData?: string}|null}
 */
export const resolvePaymentMethodCode = (rawValue, codes) => {
  if (!rawValue || typeof rawValue !== 'string' || !Array.isArray(codes) || codes.length === 0) {
    return null;
  }
  const trimmed = rawValue.trim();
  const upper = trimmed.toUpperCase();

  const exact = codes.find(
    (row) => row?.codeValue && String(row.codeValue).toUpperCase() === upper
  );
  if (exact) {
    return exact;
  }

  for (let i = 0; i < codes.length; i += 1) {
    const row = codes[i];
    const aliases = parseLegacyAliases(row?.extraData);
    if (aliases.some((alias) => alias.toUpperCase() === upper || alias === trimmed)) {
      return row;
    }
  }
  return null;
};

/**
 * @param {string|null|undefined} rawValue
 * @param {Array<{codeValue?: string, extraData?: string}>|null|undefined} codes
 * @returns {string|null}
 */
export const normalizePaymentMethodCodeValue = (rawValue, codes) => {
  const resolved = resolvePaymentMethodCode(rawValue, codes);
  if (resolved?.codeValue) {
    return String(resolved.codeValue);
  }
  return rawValue == null ? null : String(rawValue).trim();
};

/**
 * @param {string|null|undefined} paymentMethod
 * @param {Array<{codeValue?: string, extraData?: string}>|null|undefined} codes
 * @returns {boolean}
 */
export const isCardMerchantFeeEligibleFromCodes = (paymentMethod, codes) => {
  const resolved = resolvePaymentMethodCode(paymentMethod, codes);
  if (!resolved) {
    return false;
  }
  return parseCardMerchantFeeEligible(resolved.extraData);
};

/**
 * @param {Array<{codeValue?: string, codeLabel?: string, koreanName?: string}>|null|undefined} codes
 * @returns {Record<string, string>}
 */
export const buildPaymentMethodLabelMap = (codes) => {
  const map = {};
  if (!Array.isArray(codes)) {
    return map;
  }
  codes.forEach((row) => {
    if (!row?.codeValue) {
      return;
    }
    map[row.codeValue] = row.codeLabel || row.koreanName || row.codeValue;
  });
  return map;
};

/**
 * @param {Array<{codeValue?: string, codeLabel?: string, koreanName?: string, isActive?: boolean}>|null|undefined} codes
 * @returns {Array<{value: string, label: string}>}
 */
export const mapPaymentMethodCodesToOptions = (codes) => {
  if (!Array.isArray(codes)) {
    return [];
  }
  return codes
    .filter((row) => row?.codeValue && row.isActive !== false)
    .map((row) => ({
      value: String(row.codeValue),
      label: row.codeLabel || row.koreanName || row.codeValue
    }));
};

/** common_codes PAYMENT_METHOD — SSOT code_value (백엔드 PaymentMethodSsotConstants 와 동일) */
export const PAYMENT_METHOD_CODE_OTHER = 'OTHER';
export const PAYMENT_METHOD_CODE_BANK_TRANSFER = 'BANK_TRANSFER';

/**
 * 당일 결제(CheckoutSameDay) 모달에서 카드 eligible 외에도 항상 노출할 코드.
 * 카드 가맹점 수수료 경로에는 포함하지 않음 (extra_data cardMerchantFeeEligible:false 유지).
 */
export const CHECKOUT_SAME_DAY_ALWAYS_INCLUDE_CODES = [
  PAYMENT_METHOD_CODE_OTHER,
  PAYMENT_METHOD_CODE_BANK_TRANSFER
];

/**
 * 당일 결제 모달 「결제 방식」 옵션 포함 여부.
 * 카드 가맹점 수수료 eligible 이거나 OTHER / BANK_TRANSFER 이면 true.
 *
 * @param {string|null|undefined} codeValue
 * @param {Array<{codeValue?: string, extraData?: string}>|null|undefined} codes
 * @returns {boolean}
 */
export const isCheckoutSameDayPaymentMethodOption = (codeValue, codes) => {
  if (!codeValue || typeof codeValue !== 'string') {
    return false;
  }
  const upper = codeValue.trim().toUpperCase();
  if (CHECKOUT_SAME_DAY_ALWAYS_INCLUDE_CODES.some((code) => code === upper)) {
    return true;
  }
  return isCardMerchantFeeEligibleFromCodes(codeValue, codes);
};

/**
 * 당일 결제 모달용 PAYMENT_METHOD 코드 행 필터.
 *
 * @param {Array<{codeValue?: string, extraData?: string, isActive?: boolean}>|null|undefined} codes
 * @returns {Array<{codeValue?: string, extraData?: string, isActive?: boolean}>}
 */
export const filterCheckoutSameDayPaymentMethodCodes = (codes) => {
  if (!Array.isArray(codes)) {
    return [];
  }
  return codes.filter((row) => {
    if (!row?.codeValue || row.isActive === false) {
      return false;
    }
    return isCheckoutSameDayPaymentMethodOption(row.codeValue, codes);
  });
};
