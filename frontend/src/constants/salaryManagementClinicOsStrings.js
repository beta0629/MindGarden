/**
 * 상담사 지급(`/erp/salary`) Clinic-OS chrome 한글 UI 문자열
 * SSOT: docs/design-system/SALARY_MANAGEMENT_CLINIC_OS_HANDOFF.md §4
 *
 * @author CoreSolution
 * @since 2026-09-06
 */

import { OFD_WORKBENCH } from './operatorFinanceDashboardStrings';

export const SM_PAGE_TITLE = '상담사 지급';
export const SM_PAGE_TITLE_ID = 'salary-management-page-title';
export const SM_MAIN_ARIA_LABEL = '상담사 지급 콘텐츠';

export const SM_CONFIG_CTA = '기산일/급여 설정';
export const SM_CONFIG_ARIA = '기산일 및 급여 설정 열기';

export const SM_REFRESH_CTA = '목록 새로고침';
export const SM_REFRESH_ARIA = '목록 새로고침';

export const SM_HEADER_TOOLS_ARIA = '상담사 지급 도구';

/** 할 일 strip 제목 — 페이지 단일 상수 (장부 OFD와 별도 짧은 운영 카피) */
export const SM_TODO_TITLE = '할 일';
export const SM_TODO_ARIA = '할 일';

/** OFD twin 참조 (MoneyTodoList 기본값과 정합 확인용) */
export const SM_TODO_TITLE_OFD = OFD_WORKBENCH.TODO_TITLE;

export const SM_SUMMARY = {
  BAND_ARIA: '상담사 지급 요약',
  OWED_LABEL: '지급 예정',
  DEDUCTION_LABEL: '공제',
  PENDING_APPROVAL_LABEL: '승인대기',
  UNIT_COUNT: '건',
  UNIT_WON: '원'
};

export const SM_LOADING = {
  INLINE: '불러오는 중…'
};

export const SM_EMPTY_LIST = '지급할 내역이 없습니다.';

export const SM_TOOLBAR = {
  CALC_CTA: '계산',
  CALC_ARIA: '급여 계산 열기',
  PROFILES_CTA: '프로필',
  PROFILES_ARIA: '급여 프로필 열기',
  TAX_CTA: '세금',
  TAX_ARIA: '세금 통계 열기',
  LIST_CTA: '지급 목록',
  LIST_ARIA: '지급 목록으로 돌아가기',
  FILTER_ARIA: '지급 목록 필터'
};

export const SM_TABLE = {
  COL_CONSULTANT: '상담사',
  COL_PERIOD: '기간',
  COL_NET: '실지급',
  COL_STATUS: '상태',
  COL_ACTIONS: '작업',
  ROW_MENU_ARIA: '지급 행 작업'
};

export const SM_CALC_STAGE = {
  TITLE: '급여 계산',
  ARIA: '급여 계산',
  CLOSE: '닫기'
};

export const SM_ROW_MENU = {
  CALC: '계산',
  TAX_DETAILS: '세금 상세',
  EXPORT: '내보내기',
  PRINT: '인쇄',
  RECALC: '다시 계산',
  ADJUSTMENT: '빠진 회기 추가 정산'
};

/** 「계산하기」 비활성 사유 (선택·프로필) — 로딩 중에는 표시하지 않음 */
export const SM_CALC_DISABLED = {
  HINT_ID: 'salary-calc-disabled-hint',
  NO_PROFILES: '급여 프로필을 먼저 작성해 주세요.',
  NEED_CONSULTANT_AND_PERIOD: '상담사와 기간을 선택해 주세요.',
  NEED_CONSULTANT: '상담사를 선택하면 계산할 수 있습니다.',
  NEED_PERIOD: '기간을 선택하면 계산할 수 있습니다.'
};

/**
 * 「계산하기」 버튼 비활성 시 노출할 한글 힌트 (로딩 중이면 null)
 *
 * @param {object} params
 * @param {boolean} params.loading
 * @param {boolean} params.silentListRefreshing
 * @param {number} params.salaryProfilesLength
 * @param {object|null|undefined} params.selectedConsultant
 * @param {string|null|undefined} params.selectedPeriod
 * @returns {string|null}
 */
export function getSalaryCalcDisabledReason({
  loading,
  silentListRefreshing,
  salaryProfilesLength,
  selectedConsultant,
  selectedPeriod
}) {
  if (loading || silentListRefreshing) {
    return null;
  }
  if (salaryProfilesLength === 0) {
    return SM_CALC_DISABLED.NO_PROFILES;
  }
  if (!selectedConsultant && !selectedPeriod) {
    return SM_CALC_DISABLED.NEED_CONSULTANT_AND_PERIOD;
  }
  if (!selectedConsultant) {
    return SM_CALC_DISABLED.NEED_CONSULTANT;
  }
  if (!selectedPeriod) {
    return SM_CALC_DISABLED.NEED_PERIOD;
  }
  return null;
}
