/**
 * PurchaseManagement / 센터 경비 (`/erp/purchase`) 사용자 노출 한글 UI 문자열
 * Operator Finance — Clinic-OS 경비 언어
 *
 * @author CoreSolution
 * @since 2026-09-01
 */

export const PM_PAGE_TITLE = '센터 경비';
export const PM_PAGE_TITLE_ID = 'purchase-management-page-title';
export const PM_MAIN_ARIA_LABEL = '센터 경비 목록 및 본문';

export const PM_SESSION = {
  SUBTITLE_CHECKING: '세션 정보를 확인하는 중입니다.',
  LOADING: '세션 정보를 불러오는 중...'
};

export const PM_LOGIN = {
  HEADING: '로그인이 필요합니다.',
  BODY: '센터 경비 기능을 사용하려면 로그인해주세요.'
};

export const PM_REFRESH_CTA = '목록 새로고침';
export const PM_REFRESH_ARIA = '목록 새로고침';

export const PM_TAB_ARIA_LABEL = '센터 경비 보기';

export const PM_TABS = {
  ITEMS: 'items',
  REQUESTS: 'requests',
  ORDERS: 'orders'
};

export const PM_TAB_LABELS = {
  [PM_TABS.ITEMS]: '비품 목록',
  [PM_TABS.REQUESTS]: '구매 요청',
  [PM_TABS.ORDERS]: '구매 주문'
};

export const PM_TAB_ITEMS = [
  { key: PM_TABS.ITEMS, label: PM_TAB_LABELS[PM_TABS.ITEMS] },
  { key: PM_TABS.REQUESTS, label: PM_TAB_LABELS[PM_TABS.REQUESTS] },
  { key: PM_TABS.ORDERS, label: PM_TAB_LABELS[PM_TABS.ORDERS] }
];

/** Summary strip — count KPIs (money color contract does not apply) */
export const PM_SUMMARY = {
  ITEMS_LABEL: '비품 품목',
  REQUESTS_LABEL: '구매 요청',
  ORDERS_LABEL: '구매 주문',
  BAND_ARIA: '센터 경비 요약',
  UNIT_COUNT: '건'
};

export const PM_EMPTY = {
  ITEMS: '등록된 비품이 없습니다.',
  REQUESTS: '구매 요청이 없습니다.',
  ORDERS: '구매 주문이 없습니다.'
};

export const PM_LOADING = {
  INLINE: '데이터를 불러오는 중...',
  LIST: '로딩 중...'
};

export const PM_ERRORS = {
  LOAD_FAILED: '데이터를 불러오는 중 오류가 발생했습니다.'
};

export const PM_RETRY = {
  LABEL: '다시 시도',
  ARIA_LABEL: '다시 시도'
};

export const PM_STOCK = {
  SUFFICIENT: '충분',
  LOW: '부족'
};
