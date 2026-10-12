/**
 * 상품 구성(조합 패키지) 공통 계산 — 상품 편집 폼·패키지 요금 상세 페이지 공용.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */

import { parseExtraData } from './packagePricing';
import { toDisplayString } from './safeDisplay';

const PERCENT_FULL = 100;

/** 할인율(%) 입력 상한 (100% 무료 상품 방지) */
export const COMPOSITION_DISCOUNT_MAX = PERCENT_FULL - 1;

/**
 * 할인율 입력값 → 0~99 정수 범위로 보정.
 *
 * @param {string|number|null|undefined} raw
 * @returns {number}
 */
export function clampDiscountRate(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(COMPOSITION_DISCOUNT_MAX, value));
}

/**
 * 구성 항목 합산: 총 회기·총 원가·할인 적용 판매가(원 단위 버림).
 *
 * @param {Array<{ sessions: number, price: number }>} items
 * @param {string|number} discountRate 퍼센트
 * @returns {{ sessions: number, originalPrice: number, price: number }}
 */
export function calculateComposition(items, discountRate) {
  const list = Array.isArray(items) ? items : [];
  const sessions = list.reduce((acc, item) => acc + (Number(item?.sessions) || 0), 0);
  const originalPrice = list.reduce((acc, item) => acc + (Number(item?.price) || 0), 0);
  const rate = clampDiscountRate(discountRate);
  const price = Math.floor((originalPrice * (PERCENT_FULL - rate)) / PERCENT_FULL);
  return { sessions, originalPrice, price };
}

/**
 * @param {Array<object>} items
 * @param {object} item
 * @returns {Array<object>}
 */
export function addCompositionItem(items, item) {
  return [...(Array.isArray(items) ? items : []), item];
}

/**
 * @param {Array<object>} items
 * @param {number} index
 * @returns {Array<object>}
 */
export function removeCompositionItem(items, index) {
  return (Array.isArray(items) ? items : []).filter((_, i) => i !== index);
}

/**
 * 공통코드 행(패키지) → 구성 선택 옵션.
 *
 * @param {Array<object>} codes
 * @param {string} [excludeValue] 자기 자신 코드
 * @returns {Array<{ value: string, label: string, sessions: number, price: number }>}
 */
export function mapPackageCodesToCompositionOptions(codes, excludeValue = '') {
  return (Array.isArray(codes) ? codes : [])
    .filter((row) => row && row.codeValue && row.codeValue !== excludeValue)
    .map((row) => {
      const extra = parseExtraData(row.extraData);
      return {
        value: row.codeValue,
        label: toDisplayString(row.koreanName || row.codeLabel || row.codeValue, ''),
        sessions: extra.sessions || 0,
        price: extra.price || 0
      };
    });
}

/**
 * 병합 상품 행(mergeAdminShopProducts) → 구성 선택 옵션.
 * 판매 중인 몰 상품만, 자기 자신과 이미 구성을 가진 상품(중첩)은 제외한다.
 *
 * @param {Array<object>} products
 * @param {string} [excludeCode] 자기 자신 코드
 * @returns {Array<{ value: string, label: string, sessions: number, price: number }>}
 */
export function mapShopProductsToCompositionOptions(products, excludeCode = '') {
  return (Array.isArray(products) ? products : [])
    .filter((p) => p && p.code && p.codeRow && p.active !== false && p.code !== excludeCode)
    .filter((p) => !(parseExtraData(p.codeRow.extraData).items || []).length)
    .map((p) => ({
      value: p.code,
      label: toDisplayString(p.name, p.code),
      sessions: Number(p.sessions) || 0,
      price: Number(p.price) || 0
    }));
}

/**
 * 저장할 원가·할인율 결정.
 * - 구성이 있으면 구성 합산값.
 * - 구성이 있다가 모두 비워졌으면 판매가=원가, 할인율 0 (이전 구성값이 남지 않게).
 * - 처음부터 구성이 없던 상품은 기존 저장값을 보존.
 *
 * @param {{ items: Array, discountRate: (string|number), originalPrice: (number|null) }} form
 * @param {{ items?: Array, originalPrice?: (number|null) }} prevExtra 저장돼 있던 extraData(parse 결과)
 * @param {number} price 저장할 판매가
 * @returns {{ originalPrice: number, discountRate: number }}
 */
export function resolveCompositionPricingForSave(form, prevExtra, price) {
  const hasItems = Array.isArray(form?.items) && form.items.length > 0;
  if (hasItems) {
    return {
      originalPrice: Number(form.originalPrice) || 0,
      discountRate: clampDiscountRate(form.discountRate)
    };
  }
  const hadItems = Array.isArray(prevExtra?.items) && prevExtra.items.length > 0;
  if (hadItems) {
    return { originalPrice: price, discountRate: 0 };
  }
  return {
    originalPrice: prevExtra?.originalPrice ?? price,
    discountRate: clampDiscountRate(form?.discountRate)
  };
}
