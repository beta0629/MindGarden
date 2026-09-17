/**
 * 샵 카탈로그 회기수·단회기/패키지 구분 (BE ShopSessionCountConstants 와 정렬)
 *
 * @author MindGarden
 * @since 2026-09-17
 */

/** @type {number} */
export const SHOP_SESSION_COUNT_MIN = 1;

/** 단회기 판정 임계값 (회기수 === 1 → 단회기) */
export const SHOP_SINGLE_SESSION_COUNT = 1;

/** @type {Readonly<{ SINGLE: string, PACKAGE: string }>} */
export const SHOP_PACKAGE_TYPE = Object.freeze({
  SINGLE: 'SINGLE',
  PACKAGE: 'PACKAGE'
});

/**
 * @param {number|string|null|undefined} sessionCount
 * @returns {typeof SHOP_PACKAGE_TYPE[keyof typeof SHOP_PACKAGE_TYPE]}
 */
export function resolveShopPackageType(sessionCount) {
  const n = Number(sessionCount);
  if (!Number.isFinite(n) || n <= SHOP_SINGLE_SESSION_COUNT) {
    return SHOP_PACKAGE_TYPE.SINGLE;
  }
  return SHOP_PACKAGE_TYPE.PACKAGE;
}

/**
 * @param {number|string|null|undefined} sessionCount
 * @returns {boolean}
 */
export function isShopSingleSession(sessionCount) {
  return Number(sessionCount) === SHOP_SINGLE_SESSION_COUNT;
}

/**
 * @param {number|string|null|undefined} sessionCount
 * @returns {number}
 */
export function normalizeShopSessionCount(sessionCount) {
  const n = Number.parseInt(String(sessionCount ?? ''), 10);
  if (!Number.isFinite(n) || n < SHOP_SESSION_COUNT_MIN) {
    return SHOP_SESSION_COUNT_MIN;
  }
  return n;
}
