/**
 * 상담 패키지(공통코드 CONSULTATION_PACKAGE) 관련 공용 유틸
 *
 * - 공통코드 row의 `extraData`(JSON {sessions, price, remark}) 파싱·생성을 한 곳으로 통일
 * - 패키지 관리(목록·상세) 페이지와 매칭 수정 모달이 동일 로직을 공유
 *
 * @author MindGarden
 * @since 2026-05-22
 */

export const EXTRA_DATA_KEYS = Object.freeze({
  SESSIONS: 'sessions',
  PRICE: 'price',
  REMARK: 'remark',
  ITEMS: 'items',
  DISCOUNT_RATE: 'discountRate',
  ORIGINAL_PRICE: 'originalPrice'
});

const EMPTY_EXTRA_DATA = Object.freeze({ sessions: null, price: null, remark: '', items: [], discountRate: 0, originalPrice: null });

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

/**
 * 공통코드 extraData(JSON string 또는 object)를 정규화된 객체로 변환
 * @param {string|object|null|undefined} extraData
 * @returns {{ sessions: number|null, price: number|null, remark: string }}
 */
export function parseExtraData(extraData) {
  if (!extraData) return { ...EMPTY_EXTRA_DATA };
  try {
    const parsed = typeof extraData === 'string' ? JSON.parse(extraData) : extraData;
    return {
      sessions: toNumberOrNull(parsed?.[EXTRA_DATA_KEYS.SESSIONS]),
      price: toNumberOrNull(parsed?.[EXTRA_DATA_KEYS.PRICE]),
      remark: parsed?.[EXTRA_DATA_KEYS.REMARK] != null
        ? String(parsed[EXTRA_DATA_KEYS.REMARK])
        : '',
      items: Array.isArray(parsed?.[EXTRA_DATA_KEYS.ITEMS]) ? parsed[EXTRA_DATA_KEYS.ITEMS] : [],
      discountRate: toNumberOrNull(parsed?.[EXTRA_DATA_KEYS.DISCOUNT_RATE]) || 0,
      originalPrice: toNumberOrNull(parsed?.[EXTRA_DATA_KEYS.ORIGINAL_PRICE])
    };
  } catch {
    return { ...EMPTY_EXTRA_DATA };
  }
}

/**
 * extraData JSON 문자열을 생성
 * @param {number|string|null} sessions
 * @param {number|string|null} price
 * @param {string|null} remark
 * @returns {string}
 */
export function buildExtraDataString(sessions, price, remark, items = [], discountRate = 0, originalPrice = null) {
  return JSON.stringify({
    [EXTRA_DATA_KEYS.SESSIONS]: sessions,
    [EXTRA_DATA_KEYS.PRICE]: price,
    [EXTRA_DATA_KEYS.REMARK]: remark || '',
    [EXTRA_DATA_KEYS.ITEMS]: items,
    [EXTRA_DATA_KEYS.DISCOUNT_RATE]: discountRate,
    [EXTRA_DATA_KEYS.ORIGINAL_PRICE]: originalPrice !== null ? originalPrice : price
  });
}

/**
 * 공통코드 row를 패키지 선택 옵션으로 변환
 * - 카드형 UI(매칭 수정 모달 등)에서 사용
 * - sessions/price 가 누락된 row 는 그대로 null 을 유지 (UI 에서 '-' 처리)
 *
 * @param {{
 *   codeValue: string,
 *   codeLabel?: string,
 *   koreanName?: string,
 *   extraData?: string|object|null,
 *   sortOrder?: number
 * }} commonCodeRow
 * @returns {{
 *   value: string,
 *   label: string,
 *   sessions: number|null,
 *   price: number|null,
 *   remark: string,
 *   sortOrder: number|null
 * }}
 */
export function toPackageOption(commonCodeRow) {
  const extra = parseExtraData(commonCodeRow?.extraData);
  return {
    value: commonCodeRow?.codeValue,
    label: commonCodeRow?.koreanName || commonCodeRow?.codeLabel || commonCodeRow?.codeValue || '',
    sessions: extra.sessions,
    price: extra.price,
    remark: extra.remark,
    sortOrder: toNumberOrNull(commonCodeRow?.sortOrder),
    items: extra.items,
    discountRate: extra.discountRate,
    originalPrice: extra.originalPrice
  };
}
