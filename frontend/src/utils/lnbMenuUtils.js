/**
 * LNB 메뉴 트리 정규화 (API MenuDTO → LNB 렌더용)
 * 역할별 대시보드 경로 적용: 상담사/내담자/관리자 격리
 * @author Core Solution
 * @since 2026-02-25
 */

import { getLnbIcon } from '../components/dashboard-v2/constants/lnbIconMap';
import { ADMIN_ROUTES } from '../constants/adminRoutes';
import { getDashboardPathByRole } from '../constants/session';

/**
 * DB LNB에 아직 없는 관리자 설정 하위 항목을 보강 (Flyway 선행 배포 전에도 노출)
 * @param {Array<{ to?: string, label?: string, icon?: string, end?: boolean, children?: Array }>} items
 * @returns {typeof items}
 */
export function mergeSupplementalAdminLnbItems(items) {
  if (!Array.isArray(items)) {
    return items;
  }
  const supplemental = [
    { to: ADMIN_ROUTES.KAKAO_ALIMTALK_SETTINGS, icon: 'MESSAGE_CIRCLE', label: '카카오 알림톡', end: true },
    { to: ADMIN_ROUTES.BRANDING, icon: 'IMAGE', label: '브랜딩', end: true }
  ];
  return items.map((item) => {
    if (item.label !== '설정' || !Array.isArray(item.children)) {
      return item;
    }
    const pathSet = new Set(
      item.children.map((c) => (typeof c.to === 'string' ? c.to.split('?')[0] : ''))
    );
    const children = [...item.children];
    for (const sup of supplemental) {
      if (pathSet.has(sup.to)) {
        continue;
      }
      const tenantIdx = children.findIndex((c) => c.to === '/tenant/profile');
      const insertAt = tenantIdx >= 0 ? tenantIdx + 1 : 0;
      children.splice(insertAt, 0, { ...sup });
      pathSet.add(sup.to);
    }
    return { ...item, children };
  });
}

/**
 * LNB 항목 또는 자손 중 첫 `/`로 시작하는 유효 경로 (쿼리 제거)
 * @param {{ to?: string, children?: Array }} menuItem
 * @returns {string|null}
 */
function findFirstAbsoluteMenuPath(menuItem) {
  if (!menuItem || typeof menuItem !== 'object') {
    return null;
  }
  const raw = menuItem.to;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed && trimmed !== '#' && trimmed.startsWith('/')) {
      return trimmed.split('?')[0];
    }
  }
  const { children } = menuItem;
  if (!Array.isArray(children)) {
    return null;
  }
  for (const child of children) {
    const found = findFirstAbsoluteMenuPath(child);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * GNB 퀵 내비 id (라벨·경로 기반 안정 slug)
 * @param {string} label
 * @param {string} path
 * @returns {string}
 */
function buildGnbQuickNavigateId(label, path) {
  const pathSlug = path
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .join('-') || 'home';
  const labelSlug = String(label)
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, '-')
    .replaceAll(/[^a-z0-9\uac00-\ud7a3-]/g, '')
    .slice(0, 48) || 'item';
  return `lnb-quick-${pathSlug}-${labelSlug}`;
}

/**
 * API 메뉴 노드 → LNB 아이템 형태로 변환 (재귀)
 * @param {Array<{ menuPath?: string, menuName?: string, icon?: string, children?: Array }>} apiMenus
 * @param {{ userRole?: string }} options userRole이 있으면 '대시보드' 링크를 해당 역할 대시보드로 설정
 * @returns {Array<{ to: string, label: string, icon: string, end: boolean, children?: Array }>}
 */
export function normalizeLnbTree(apiMenus, options = {}) {
  const dashboardPath = options.userRole ? getDashboardPathByRole(options.userRole) : '/admin/dashboard';
  if (!Array.isArray(apiMenus)) return [];

  function mapNode(m) {
    const children = (m.children || []).map(mapNode);
    const hasChildren = children.length > 0;
    let to = m.menuPath;
    if (to === '#' || !to) {
      to = hasChildren ? children[0].to : '#';
    }
    const label = m.menuName || '';
    if (label === '대시보드' || to === '/dashboard') {
      to = dashboardPath;
    }
    return {
      to,
      label,
      icon: getLnbIcon(m.icon),
      end: !hasChildren,
      children: hasChildren ? children : undefined
    };
  }
  return apiMenus.map(mapNode);
}

/**
 * ApiResponse에서 메뉴 트리 배열 추출
 * @param {{ success?: boolean, data?: Array }} response getLnbMenus() 응답
 * @returns {Array|null} data 배열 또는 null
 */
export function getLnbTreeFromResponse(response) {
  if (!response || !response.data) return null;
  return Array.isArray(response.data) ? response.data : null;
}

/**
 * Desktop LNB `menuItems`와 동일 루트 트리에서 GNB 퀵 내비 액션 파생 (depth 0만, 최대 8건 기본)
 *
 * @param {Array<{ to?: string, label?: string, icon?: import('react').ComponentType, children?: Array }>} menuItems
 * @param {{ maxCount?: number }} [options]
 * @returns {Array<{ id: string, label: string, action: string, type: 'navigate', icon: string }>}
 */
export function deriveGnbQuickNavigateActionsFromLnb(menuItems, options = {}) {
  const maxCount =
    options.maxCount === undefined || options.maxCount === null
      ? 8
      : options.maxCount;
  if (!Array.isArray(menuItems) || menuItems.length === 0 || maxCount <= 0) {
    return [];
  }
  const out = [];
  for (let i = 0; i < menuItems.length && out.length < maxCount; i += 1) {
    const item = menuItems[i];
    const path = findFirstAbsoluteMenuPath(item);
    if (!path) {
      continue;
    }
    const label = item?.label || path;
    const iconKey =
      typeof item?.icon === 'string' && item.icon.trim() !== ''
        ? item.icon
        : 'LAYOUT_DASHBOARD';
    out.push({
      id: buildGnbQuickNavigateId(label, path),
      label,
      action: path,
      type: 'navigate',
      icon: iconKey
    });
  }
  return out;
}
