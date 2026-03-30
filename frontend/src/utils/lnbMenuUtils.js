/**
 * LNB 메뉴 트리 정규화 (API MenuDTO → LNB 렌더용)
 * 역할별 대시보드 경로 적용: 상담사/내담자/관리자 격리
 * @author Core Solution
 * @since 2026-02-25
 */

import { getLnbIcon } from '../components/dashboard-v2/constants/lnbIconMap';
import { getDashboardPathByRole } from '../constants/session';

/**
 * API 메뉴 노드 → LNB 아이템 형태로 변환 (재귀)
 * @param {Array<{ menuPath?: string, menuName?: string, icon?: string, children?: Array }>} apiMenus
 * @param {{ userRole?: string }} options userRole이 있으면 '대시보드' 링크를 해당 역할 대시보드로 설정
 * @returns {Array<{ to: string, label: string, icon: import('react').ComponentType, end: boolean, children?: Array }>}
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
