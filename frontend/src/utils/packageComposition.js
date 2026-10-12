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

/** 구성 후보 상태 — 후보 없음(카탈로그 비어 있음)과 검색 결과 없음을 구분한다. */
export const COMPOSITION_CANDIDATE_STATE = Object.freeze({
  READY: 'READY',
  NO_CANDIDATES: 'NO_CANDIDATES',
  NO_RESULTS: 'NO_RESULTS'
});

/**
 * 후보 API 응답 규약 `{items, totalActive}` 과 같은 판정.
 * totalActive 0 → 후보 없음, items 0 이고 totalActive > 0 → 검색 결과 없음.
 *
 * @param {{ totalActive: number, matchedCount: number }} args
 * @returns {string} COMPOSITION_CANDIDATE_STATE 값
 */
export function resolveCompositionCandidateState({ totalActive, matchedCount }) {
  if (!totalActive || totalActive <= 0) {
    return COMPOSITION_CANDIDATE_STATE.NO_CANDIDATES;
  }
  if (!matchedCount || matchedCount <= 0) {
    return COMPOSITION_CANDIDATE_STATE.NO_RESULTS;
  }
  return COMPOSITION_CANDIDATE_STATE.READY;
}

/**
 * 상품명 일부로 후보를 거른다(대소문자·앞뒤 공백 무시).
 *
 * @param {Array<{label?: string}>} options
 * @param {string} query
 * @returns {Array}
 */
export function filterCompositionOptions(options, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) {
    return options;
  }
  return options.filter((o) => String(o.label || '').toLowerCase().includes(q));
}

/* ------------------------------------------------------------------
 * 몰 SKU 기반 구성 (#1578 composition-candidates · package-compositions)
 * 항목 모양: { skuId, label, catalogCategory, unitPrice, sessions, quantity,
 *             priceChanged, currentUnitPrice, available }
 * ------------------------------------------------------------------ */

/** 구성 항목 최소 수량 (서버 ShopPackageCompositionConstants.MIN_QUANTITY 와 같음) */
export const COMPOSITION_MIN_QUANTITY = 1;

/** 상담(회기) 상품 카테고리 — 서버 ShopCatalogCategory.CONSULTATION */
export const COMPOSITION_SESSION_CATEGORY = 'CONSULTATION';

function toWhole(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/**
 * 후보 API item → 화면 후보.
 *
 * @param {object} raw ShopCompositionCandidateItem
 * @returns {{ skuId: number, label: string, catalogCategory: string, unitPrice: number,
 *   sessions: number, composed: boolean }}
 */
export function mapCompositionCandidate(raw) {
  return {
    skuId: raw?.skuId,
    label: toDisplayString(raw?.title, toDisplayString(raw?.skuCode, '')),
    catalogCategory: toDisplayString(raw?.catalogCategory, ''),
    unitPrice: toWhole(raw?.unitPriceMinor),
    sessions: toWhole(raw?.sessionCount),
    composed: raw?.composed === true
  };
}

/**
 * 저장된 구성 응답 item → 담은 항목. 단가는 저장 시점 스냅샷.
 *
 * @param {object} raw ShopPackageCompositionItemView
 * @returns {object}
 */
export function mapSavedCompositionItem(raw) {
  return {
    skuId: raw?.skuId,
    label: toDisplayString(raw?.title, toDisplayString(raw?.skuCode, '')),
    catalogCategory: toDisplayString(raw?.catalogCategory, ''),
    unitPrice: toWhole(raw?.unitPriceSnapshot),
    sessions: toWhole(raw?.sessionCountSnapshot),
    quantity: Math.max(COMPOSITION_MIN_QUANTITY, toWhole(raw?.quantity)),
    priceChanged: raw?.priceChanged === true,
    currentUnitPrice: raw?.currentUnitPrice != null ? toWhole(raw.currentUnitPrice) : null,
    available: raw?.available !== false
  };
}

/**
 * 후보를 담는다(같은 SKU 는 두 번 담지 않음 — 수량으로 조정).
 *
 * @param {Array<object>} items
 * @param {object} candidate mapCompositionCandidate 결과
 * @returns {Array<object>}
 */
export function addMallCompositionItem(items, candidate) {
  const list = Array.isArray(items) ? items : [];
  if (!candidate || candidate.skuId == null || list.some((i) => i.skuId === candidate.skuId)) {
    return list;
  }
  return [...list, {
    skuId: candidate.skuId,
    label: candidate.label,
    catalogCategory: candidate.catalogCategory,
    unitPrice: toWhole(candidate.unitPrice),
    sessions: toWhole(candidate.sessions),
    quantity: COMPOSITION_MIN_QUANTITY,
    priceChanged: false,
    currentUnitPrice: toWhole(candidate.unitPrice),
    available: true
  }];
}

/**
 * @param {Array<object>} items
 * @param {number} skuId
 * @param {number} quantity 1 미만은 1로 보정
 * @returns {Array<object>}
 */
export function setMallCompositionQuantity(items, skuId, quantity) {
  const qty = Math.max(COMPOSITION_MIN_QUANTITY, toWhole(quantity));
  return (Array.isArray(items) ? items : []).map((i) => (i.skuId === skuId ? { ...i, quantity: qty } : i));
}

/**
 * @param {Array<object>} items
 * @param {number} skuId
 * @returns {Array<object>}
 */
export function removeMallCompositionItem(items, skuId) {
  return (Array.isArray(items) ? items : []).filter((i) => i.skuId !== skuId);
}

/**
 * 「다시 계산」 — 가격이 바뀐 항목의 단가를 현재 몰 판매가로 맞춘다.
 *
 * @param {Array<object>} items
 * @returns {Array<object>}
 */
export function recalcMallCompositionPrices(items) {
  return (Array.isArray(items) ? items : []).map((i) => (
    i.priceChanged && i.currentUnitPrice != null
      ? { ...i, unitPrice: i.currentUnitPrice, priceChanged: false }
      : i
  ));
}

/**
 * @param {Array<object>} items
 * @returns {boolean}
 */
export function hasMallCompositionPriceChange(items) {
  return (Array.isArray(items) ? items : []).some((i) => i.priceChanged === true);
}

/**
 * 몰 판매가 × 수량 합계 → 할인 → 최종 판매가(원 단위 버림).
 *
 * @param {Array<{ unitPrice: number, sessions: number, quantity: number }>} items
 * @param {string|number} discountRate 퍼센트 (0~99)
 * @returns {{ subtotal: number, sessions: number, discountAmount: number, finalPrice: number }}
 */
export function computeMallComposition(items, discountRate) {
  const list = Array.isArray(items) ? items : [];
  let subtotal = 0;
  let sessions = 0;
  list.forEach((i) => {
    const qty = Math.max(COMPOSITION_MIN_QUANTITY, toWhole(i?.quantity));
    subtotal += toWhole(i?.unitPrice) * qty;
    sessions += toWhole(i?.sessions) * qty;
  });
  const rate = clampDiscountRate(discountRate);
  const finalPrice = Math.floor((subtotal * (PERCENT_FULL - rate)) / PERCENT_FULL);
  return { subtotal, sessions, discountAmount: subtotal - finalPrice, finalPrice };
}

/**
 * PUT 본문 — 서버 ShopPackageCompositionSaveRequest `{ items: [{ skuId, quantity }] }`.
 *
 * @param {Array<object>} items
 * @returns {{ items: Array<{ skuId: number, quantity: number }> }}
 */
export function buildCompositionSaveBody(items) {
  return {
    items: (Array.isArray(items) ? items : []).map((i) => ({
      skuId: i.skuId,
      quantity: Math.max(COMPOSITION_MIN_QUANTITY, toWhole(i.quantity))
    }))
  };
}

/**
 * 구성 항목 저장 필요 여부 — 담은 SKU·수량이 처음과 다를 때.
 *
 * @param {Array<object>} items
 * @param {Array<object>} initialItems
 * @returns {boolean}
 */
export function isMallCompositionChanged(items, initialItems) {
  return JSON.stringify(buildCompositionSaveBody(items)) !== JSON.stringify(buildCompositionSaveBody(initialItems));
}
