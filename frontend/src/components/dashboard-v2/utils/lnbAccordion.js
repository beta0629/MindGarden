/**
 * Admin LNB 아코디언·활성 경로 공통 로직 (DesktopLnb / MobileLnbDrawer 공유)
 *
 * - 그룹 활성: 자식·자손 path 매칭 또는 그룹 랜딩 exact 만 (헤더 to 의 prefix 매칭 금지)
 * - 펼침 key: menuCode 우선 (폴백→API hydrate 시 key churn 완화)
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * @param {Object} item
 * @returns {boolean}
 */
export const hasLnbChildren = (item) =>
  Boolean(item?.children && item.children.length > 0);

/**
 * 동일 path 숏컷·그룹 병존 시 React key / 아코디언 key 충돌 방지
 *
 * @param {Object} item
 * @returns {string}
 */
export const getLnbItemKey = (item) => {
  if (item?.menuCode) {
    return String(item.menuCode);
  }
  return `${toDisplayString(item?.label)}::${String(item?.to ?? '')}`;
};

/**
 * 리프/자식 path 매칭 (exact 또는 하위 nested)
 *
 * @param {string} targetPath
 * @param {string} pathname
 * @returns {boolean}
 */
export const isLnbPathMatch = (targetPath, pathname) => {
  if (!targetPath || !pathname) {
    return false;
  }
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
};

/**
 * 현재 경로가 속한 그룹의 key 반환, 없으면 null
 * (그룹 헤더 to 의 prefix 매칭은 하지 않음 — SYSTEM_ADMIN `/admin` false-positive 방지)
 *
 * @param {Array} items
 * @param {string} pathname
 * @returns {string|null}
 */
export const getInitialExpandedKey = (items, pathname) => {
  const group = (items || []).find(
    (item) =>
      hasLnbChildren(item) &&
      (pathname === item.to ||
        item.children.some((sub) => isLnbPathMatch(sub.to, pathname)))
  );
  return group ? getLnbItemKey(group) : null;
};

/**
 * 그룹 활성: 랜딩 exact 또는 하위 자식 경로 매칭.
 * 그룹 헤더 to 에 대한 broad startsWith 금지.
 *
 * @param {Object} item
 * @param {string} pathname
 * @returns {boolean}
 */
export const isGroupPathActive = (item, pathname) => {
  if (!item || !pathname) {
    return false;
  }
  if (pathname === item.to) {
    return true;
  }
  return (item.children || []).some((sub) => isLnbPathMatch(sub.to, pathname));
};

/**
 * @param {string} prefix
 * @param {string} itemKey
 * @returns {string}
 */
export const lnbSublistId = (prefix, itemKey) =>
  `${prefix}-sublist-${String(itemKey).replaceAll('/', '-').replace(/^-/, '')}`;
