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
