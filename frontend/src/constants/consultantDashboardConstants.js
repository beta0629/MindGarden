/**
 * Consultant Dashboard V2 상수 (ROLE-C-02 / PR-C2)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

export const CONSULTANT_DASHBOARD_TITLE_ID = 'consultant-dashboard-v2-page-title';
export const CONSULTANT_DASHBOARD_PAGE_TEST_ID = 'consultant-dashboard-v2-page';
export const CONSULTANT_DASHBOARD_KPI_SECTION_TEST_ID = 'consultant-dashboard-kpi-section';

export const CONSULTANT_DASHBOARD_LIST_MAX_ROWS = 5;

export const CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL = '전체 일정 보기';
export const CONSULTANT_DASHBOARD_VIEW_ALL_UPCOMING_LABEL = '전체 스케줄 보기';
export const CONSULTANT_DASHBOARD_VIEW_ALL_NOTIFICATIONS_LABEL = '전체 보기';

export const CONSULTANT_DASHBOARD_ROUTES = {
  SCHEDULE: '/consultant/schedule',
  NOTIFICATIONS: '/notifications',
  CONSULTATION_RECORDS: '/consultant/consultation-records',
  CLIENTS: '/consultant/clients',
  MESSAGES: '/consultant/messages'
};

export const CONSULTANT_SCHEDULE_STATUS_LABELS = {
  CONFIRMED: '확정',
  PENDING: '대기',
  NO_SHOW: '노쇼',
  COMPLETED: '완료'
};

export const CONSULTANT_DASHBOARD_LIST_LOADING_LABEL = '목록을 불러오는 중...';
export const CONSULTANT_DASHBOARD_LIST_ERROR_LABEL = '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
