/**
 * 내담자 쇼핑 장바구니 유틸
 *
 * @author MindGarden
 * @since 2026-05-19
 */

export interface ShopCartLinePayload {
  skuCode: string;
  quantity: number;
}

export function buildCartLinesPayload(
  lines: ReadonlyArray<{ skuCode: string; quantity: number }> | null | undefined,
): ShopCartLinePayload[] {
  return (lines ?? []).map((l) => ({
    skuCode: l.skuCode,
    quantity: l.quantity,
  }));
}

export function mergeCartLine(
  currentLines: ReadonlyArray<{ skuCode: string; quantity: number }> | null | undefined,
  skuCode: string,
  delta: number,
): ShopCartLinePayload[] {
  const next = (currentLines ?? []).map((l) => ({
    skuCode: l.skuCode,
    quantity: l.quantity,
  }));
  const idx = next.findIndex((l) => l.skuCode === skuCode);
  if (idx >= 0) {
    const current = next[idx];
    if (!current) {
      return next;
    }
    const qty = Math.max(0, Math.min(99, current.quantity + delta));
    if (qty === 0) {
      next.splice(idx, 1);
    } else {
      next[idx] = { skuCode, quantity: qty };
    }
  } else if (delta > 0) {
    next.push({ skuCode, quantity: Math.min(99, delta) });
  }
  return next;
}

/**
 * 체크아웃 idempotency key 생성
 */
export function createShopIdempotencyKey(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
