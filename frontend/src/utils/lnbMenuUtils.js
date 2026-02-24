/**
 * LNB 메뉴 트리 정규화 (API MenuDTO → LNB 렌더용)
 * @author MindGarden
 * @since 2026-02-25
 */

import { getLnbIcon } from '../components/dashboard-v2/constants/lnbIconMap';

/**
 * API 메뉴 노드 → LNB 아이템 형태로 변환 (재귀)
 * @param {Array<{ menuPath?: string, menuName?: string, icon?: string, children?: Array }>} apiMenus
 * @returns {Array<{ to: string, label: string, icon: import('react').ComponentType, end: boolean, children?: Array }>}
 */
export function normalizeLnbTree(apiMenus) {
  if (!Array.isArray(apiMenus)) return [];
  return apiMenus.map((m) => {
    const children = normalizeLnbTree(m.children || []);
    const hasChildren = children.length > 0;
    let to = m.menuPath;
    if (to === '#' || !to) {
      to = hasChildren ? children[0].to : '#';
    }
    return {
      to,
      label: m.menuName || '',
      icon: getLnbIcon(m.icon),
      end: !hasChildren,
      children: hasChildren ? children : undefined
    };
  });
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
