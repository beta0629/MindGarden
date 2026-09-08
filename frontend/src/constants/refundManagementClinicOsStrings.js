/**
 * 환불 관리(`/erp/refund-management`) Clinic-OS chrome 한글 UI 문자열
 * SSOT: docs/design-system/REFUND_MANAGEMENT_CLINIC_OS_HANDOFF.md §4
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

export const RM_PAGE_TITLE = '환불 관리';
export const RM_PAGE_TITLE_ID = 'refund-management-page-title';
export const RM_MAIN_ARIA_LABEL = '환불 관리 콘텐츠';

export const RM_HEADER_TOOLS_ARIA = '환불 관리 도구';
export const RM_REFRESH_CTA = '목록 새로고침';
export const RM_REFRESH_ARIA = '목록 새로고침';

export const RM_SUMMARY = {
  BAND_ARIA: '환불 관리 요약',
  COUNT_LABEL: '환불 건수',
  AMOUNT_LABEL: '환불 금액',
  PENDING_ERP_LABEL: 'ERP 미반영',
  UNIT_COUNT: '건',
  UNIT_WON: '원'
};

/**
 * 환불 레일 — pending 0 · 팩트 없으면 섹션 미렌더
 * @param {number} count
 * @returns {string}
 */
export function buildRefundRailTitle(count) {
  return `ERP 미반영 ${Number(count) || 0}건 · 합계`;
}

export const RM_RAIL_ARIA = 'ERP 미반영 환불';
export const RM_RAIL_VIEW_IN_LIST = '목록에서 보기';

export const RM_HUB = {
  FINANCIAL: '일상 거래',
  REFUND: '환불·정산',
  ARIA: '재무·환불 허브'
};

export const RM_ROW = {
  CTA_REFLECT: 'ERP 반영',
  CTA_REFLECT_ARIA: '해당 건 ERP 환불 반영',
  CTA_OPEN: '열기',
  CTA_OPEN_ARIA: '환불 행 상세 열기',
  MENU_ARIA: '환불 행 작업',
  DETAIL_TITLE: '환불 상세'
};

export const RM_COLLAPSE = {
  REASON: '사유 통계',
  ERP: 'ERP 상세',
  ACCOUNTING: '회계'
};

export const RM_LOADING = {
  PAGE: '환불 데이터를 불러오는 중…',
  INLINE: '불러오는 중…'
};

export const RM_EMPTY_LIST = '선택한 기간에 환불 이력이 없습니다.';

export const RM_CHIPS = {
  PERIOD_ARIA: '조회 기간',
  STATUS_ARIA: '환불 상태',
  FILTER_ARIA: '환불 조회 필터'
};

export const RM_TOOLBAR = {
  EXPORT_EXCEL: '엑셀 내보내기',
  BATCH_REFLECT: '선택 건 ERP 환불 반영',
  BATCH_REFLECT_ARIA: '선택 건 ERP 환불 반영'
};

export const RM_PERIOD_CHIP_ITEMS = [
  { key: 'today', label: '오늘' },
  { key: 'week', label: '최근 7일' },
  { key: 'month', label: '최근 1개월' },
  { key: 'quarter', label: '최근 3개월' },
  { key: 'year', label: '최근 1년' }
];

export const RM_STATUS_CHIP_ITEMS = [
  { key: 'all', label: '전체' },
  { key: 'completed', label: '완료' },
  { key: 'pending', label: '대기' },
  { key: 'failed', label: '실패' }
];

/**
 * FE 휴리스틱 — ERP 반영 여부 (API erpStatus 실데이터 신뢰 불가)
 * reflected: erpReference truthy OR erpStatus ∈ SENT/REFLECTED/SYNCED (대소문자 정규화)
 * 그 외 → unreflected
 *
 * @param {object|null|undefined} refund
 * @returns {boolean}
 */
export function isRefundErpReflected(refund) {
  if (!refund || typeof refund !== 'object') {
    return false;
  }
  if (refund.erpReference) {
    return true;
  }
  const status = String(refund.erpStatus || '')
    .trim()
    .toUpperCase();
  return status === 'SENT' || status === 'REFLECTED' || status === 'SYNCED';
}
