import { NavLink } from 'react-router-dom';
import '../../../styles/unified-design-tokens.css';
import '../ErpCommon.css';

/** 조달 허브 — 기존 라우트(`/erp/purchase`, `/erp/items`, `/erp/purchase-requests`)와 동일 경로 */
export const PURCHASE_HUB_PATHS = {
  PROCUREMENT: '/erp/purchase',
  ITEMS: '/erp/items',
  REQUEST: '/erp/purchase-requests'
};

const HUB_TABS = [
  { path: PURCHASE_HUB_PATHS.PROCUREMENT, label: '조달' },
  { path: PURCHASE_HUB_PATHS.ITEMS, label: '품목' },
  { path: PURCHASE_HUB_PATHS.REQUEST, label: '구매 요청' }
];

function hubTabClassName({ isActive }) {
  return `erp-tab${isActive ? ' active' : ''}`;
}

/**
 * StandardizedApi GET 응답을 목록 배열로 정규화 (래퍼·페이지 형태 모두 처리)
 * @param {*} value apiGet/StandardizedApi.get 결과
 * @returns {Array}
 */
export function normalizeErpListResponse(value) {
  if (value == null) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  const listRaw = value.data ?? value.content ?? value.items ?? [];
  return Array.isArray(listRaw) ? listRaw : [];
}

/**
 * 조달·품목·구매 요청을 한 mental model로 묶는 서브네비 (라우트 전환만 담당)
 */
export function PurchaseHubSubNav() {
  return (
    <nav
      className="erp-system mg-v2-purchase-hub-subnav"
      aria-label="조달 허브"
    >
      <div className="erp-tabs mg-v2-purchase-hub-tabs">
        {HUB_TABS.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === PURCHASE_HUB_PATHS.PROCUREMENT}
            className={hubTabClassName}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default PurchaseHubSubNav;
