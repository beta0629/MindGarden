/**
 * 게스트(비로그인) 쇼핑 장바구니 — localStorage
 * 로그인 후 mergeGuestShopCartIntoServer 로 서버 카트에 합친다.
 *
 * @author MindGarden
 * @since 2026-09-18
 */

export const GUEST_SHOP_CART_STORAGE_KEY = 'mg_guest_shop_cart_v1';

const MAX_QTY = 99;

/**
 * @param {*} value
 * @returns {{ skuCode: string, quantity: number }[]}
 */
const normalizeLines = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }
  const bySku = new Map();
  value.forEach((row) => {
    if (!row || typeof row !== 'object') {
      return;
    }
    const skuCode = typeof row.skuCode === 'string' ? row.skuCode.trim() : '';
    if (!skuCode) {
      return;
    }
    const qty = Number(row.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return;
    }
    const nextQty = Math.min(MAX_QTY, Math.floor(qty));
    const prev = bySku.get(skuCode) || 0;
    bySku.set(skuCode, Math.min(MAX_QTY, prev + nextQty));
  });
  return Array.from(bySku.entries()).map(([skuCode, quantity]) => ({ skuCode, quantity }));
};

/**
 * @returns {{ skuCode: string, quantity: number }[]}
 */
export const getGuestShopCartLines = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(GUEST_SHOP_CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return normalizeLines(JSON.parse(raw));
  } catch {
    return [];
  }
};

/**
 * @param {{ skuCode: string, quantity: number }[]} lines
 */
export const setGuestShopCartLines = (lines) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  const normalized = normalizeLines(lines);
  if (normalized.length === 0) {
    window.localStorage.removeItem(GUEST_SHOP_CART_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(GUEST_SHOP_CART_STORAGE_KEY, JSON.stringify(normalized));
};

export const clearGuestShopCart = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.removeItem(GUEST_SHOP_CART_STORAGE_KEY);
};

/**
 * mergeCartLine 과 동일한 수량 규칙(0–99).
 *
 * @param {string} skuCode
 * @param {number} delta
 * @returns {{ skuCode: string, quantity: number }[]}
 */
export const mergeGuestCartLine = (skuCode, delta) => {
  const code = typeof skuCode === 'string' ? skuCode.trim() : '';
  if (!code || !Number.isFinite(delta) || delta === 0) {
    return getGuestShopCartLines();
  }
  const next = getGuestShopCartLines().map((l) => ({
    skuCode: l.skuCode,
    quantity: l.quantity
  }));
  const idx = next.findIndex((l) => l.skuCode === code);
  if (idx >= 0) {
    const qty = Math.max(0, Math.min(MAX_QTY, next[idx].quantity + delta));
    if (qty === 0) {
      next.splice(idx, 1);
    } else {
      next[idx] = { skuCode: code, quantity: qty };
    }
  } else if (delta > 0) {
    next.push({ skuCode: code, quantity: Math.min(MAX_QTY, delta) });
  }
  setGuestShopCartLines(next);
  return next;
};

/**
 * @param {{ skuCode?: string, quantity?: number }[]} lines
 * @returns {number}
 */
export const sumCartLineQuantities = (lines) =>
  (lines || []).reduce((sum, line) => {
    const qty = Number(line?.quantity);
    return sum + (Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0);
  }, 0);
