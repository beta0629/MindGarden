import React from 'react';

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
  ORIGINAL_PRICE: 'originalPrice',
  PUBLIC_VISIBLE: 'publicVisible'
});

const EMPTY_EXTRA_DATA = Object.freeze({
  sessions: null,
  price: null,
  remark: '',
  items: [],
  discountRate: 0,
  originalPrice: null,
  publicVisible: null
});

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

/**
 * publicVisible 원시값을 boolean|null 로 정규화 (누락/비불리언 → null)
 * @param {unknown} value
 * @returns {boolean|null}
 */
const toPublicVisibleOrNull = (value) => {
  if (value === false) return false;
  if (value === true) return true;
  return null;
};

/**
 * 공통코드 extraData(JSON string 또는 object)를 정규화된 객체로 변환
 * @param {string|object|null|undefined} extraData
 * @returns {{
 *   sessions: number|null,
 *   price: number|null,
 *   remark: string,
 *   items: array,
 *   discountRate: number,
 *   originalPrice: number|null,
 *   publicVisible: boolean|null
 * }}
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
      originalPrice: toNumberOrNull(parsed?.[EXTRA_DATA_KEYS.ORIGINAL_PRICE]),
      publicVisible: toPublicVisibleOrNull(parsed?.[EXTRA_DATA_KEYS.PUBLIC_VISIBLE])
    };
  } catch {
    return { ...EMPTY_EXTRA_DATA };
  }
}

/**
 * 공개 노출 여부. missing/null/true → true, false → false (하위 호환)
 * @param {string|object|null|undefined} extraData
 * @returns {boolean}
 */
export function isPublicVisible(extraData) {
  const v = parseExtraData(extraData).publicVisible;
  return v !== false;
}

/**
 * extraData JSON 문자열을 생성
 * @param {number|string|null} sessions
 * @param {number|string|null} price
 * @param {string|null} remark
 * @param {array} [items]
 * @param {number} [discountRate]
 * @param {number|null} [originalPrice]
 * @param {boolean} [publicVisible=true]
 * @returns {string}
 */
export function buildExtraDataString(
  sessions,
  price,
  remark,
  items = [],
  discountRate = 0,
  originalPrice = null,
  publicVisible = true
) {
  return JSON.stringify({
    [EXTRA_DATA_KEYS.SESSIONS]: sessions,
    [EXTRA_DATA_KEYS.PRICE]: price,
    [EXTRA_DATA_KEYS.REMARK]: remark || '',
    [EXTRA_DATA_KEYS.ITEMS]: items,
    [EXTRA_DATA_KEYS.DISCOUNT_RATE]: discountRate,
    [EXTRA_DATA_KEYS.ORIGINAL_PRICE]: originalPrice !== null ? originalPrice : price,
    [EXTRA_DATA_KEYS.PUBLIC_VISIBLE]: publicVisible !== false
  });
}

/**
 * 기존 extraData 에 publicVisible 만 병합 (목록 퀵 토글용 — 나머지 키 보존)
 * @param {string|object|null|undefined} extraData
 * @param {boolean} publicVisible
 * @returns {string}
 */
export function withPublicVisible(extraData, publicVisible) {
  const parsed = parseExtraData(extraData);
  return buildExtraDataString(
    parsed.sessions,
    parsed.price,
    parsed.remark,
    parsed.items,
    parsed.discountRate,
    parsed.originalPrice,
    publicVisible
  );
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

/**
 * 다중 패키지 문자열을 배열로 파싱 (Detailed View 용)
 * @param {string} packageName 
 * @returns {string[]}
 */
export function parseCombinedPackageName(packageName) {
  if (!packageName) return [];
  return packageName.split('+').map(p => p.trim()).filter(Boolean);
}

/**
 * 다중 패키지 문자열을 생성
 * @param {string[]} packageNames 
 * @returns {string}
 */
export function buildCombinedPackageName(packageNames) {
  if (!Array.isArray(packageNames) || packageNames.length === 0) return '';
  return packageNames.join(' + ');
}

/**
 * 다중 패키지명을 Compact View (첫 패키지 + N 뱃지) 형태로 렌더링
 * @param {string} packageName 
 * @returns {React.ReactNode|string}
 */
export function renderCompactPackageName(packageName) {
  if (!packageName) return '-';
  const parts = parseCombinedPackageName(packageName);
  if (parts.length <= 1) {
    return parts[0] || '-';
  }
  
  return (
    <span className="mg-v2-package-compact" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)', maxWidth: '100%' }}>
      <span className="mg-v2-package-compact__name" style={{
        display: 'inline-block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        maxWidth: 'var(--grid-min-width-sm, 15ch)' // safeDisplay 원칙
      }} title={packageName}>
        {parts[0]}
      </span>
      <span className="mg-v2-badge mg-v2-badge--neutral" style={{ flexShrink: 0, padding: 'var(--spacing-xxs) var(--spacing-sm)', fontSize: 'var(--font-size-xs)', borderRadius: 'var(--border-radius-full)' }}>
        +{parts.length - 1}
      </span>
    </span>
  );
}
