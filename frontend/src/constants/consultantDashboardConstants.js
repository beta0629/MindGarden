/**
 * Consultant Dashboard V2 상수 (ROLE-C-02 / PR-C2 · v2.1 SSOT)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

export const CONSULTANT_DASHBOARD_TITLE_ID = 'consultant-dashboard-v2-page-title';
export const CONSULTANT_DASHBOARD_PAGE_TEST_ID = 'consultant-dashboard-v2-page';
export const CONSULTANT_DASHBOARD_KPI_SECTION_TEST_ID = 'consultant-dashboard-kpi-section';
export const CONSULTANT_DASHBOARD_URGENT_SECTION_TEST_ID = 'consultant-dashboard-urgent-clients';

export const CONSULTANT_DASHBOARD_LIST_MAX_ROWS = 5;
export const CONSULTANT_DASHBOARD_LIST_SKELETON_ROWS = 3;

export const CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL = '전체 일정 보기';
export const CONSULTANT_DASHBOARD_VIEW_ALL_UPCOMING_LABEL = '전체 스케줄 보기';
export const CONSULTANT_DASHBOARD_VIEW_ALL_NOTIFICATIONS_LABEL = '전체 보기';
export const CONSULTANT_DASHBOARD_VIEW_ALL_URGENT_CLIENTS_LABEL = '전체보기';

export const CONSULTANT_DASHBOARD_URGENT_SECTION_TITLE = '긴급 확인 필요 내담자';

export const CONSULTANT_DASHBOARD_ROUTES = {
  SCHEDULE: '/consultant/schedule',
  NOTIFICATIONS: '/notifications',
  CONSULTATION_RECORDS: '/consultant/consultation-records',
  CLIENTS: '/consultant/clients',
  MESSAGES: '/consultant/messages',
  SALARY_SETTLEMENT: '/consultant/salary-settlement'
};

export const CONSULTANT_SCHEDULE_STATUS_LABELS = {
  CONFIRMED: '확정',
  PENDING: '대기',
  NO_SHOW: '노쇼',
  COMPLETED: '완료'
};

export const CONSULTANT_URGENT_CLIENT_RISK_LABELS = {
  CRITICAL: '위험',
  HIGH: '높음',
  MEDIUM: '보통'
};

export const CONSULTANT_URGENT_CLIENT_RISK_VARIANTS = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'neutral'
};

export const CONSULTANT_URGENT_CLIENT_COLUMNS = [
  { key: 'clientName', label: '내담자' },
  { key: 'sessionLabel', label: '회기', hideOnMobile: true },
  { key: 'lastDateLabel', label: '최근 상담', hideOnMobile: true },
  { key: 'riskLabel', label: '위험도' },
  { key: 'mainIssue', label: '주요 이슈', hideOnMobile: true }
];

/** v2.1 QuickAction 5 — 단일 진실 (Web ConsultantDashboardV2) */
export const CONSULTANT_DASHBOARD_QUICK_ACTIONS = [
  {
    id: 'create-schedule',
    label: '일정 등록',
    path: `${CONSULTANT_DASHBOARD_ROUTES.SCHEDULE}?action=create`,
    variant: 'outline'
  },
  {
    id: 'view-schedule',
    label: '일정 확인',
    path: CONSULTANT_DASHBOARD_ROUTES.SCHEDULE,
    variant: 'outline'
  },
  {
    id: 'check-messages',
    label: '내담자 메시지',
    path: CONSULTANT_DASHBOARD_ROUTES.MESSAGES,
    variant: 'outline'
  },
  {
    id: 'create-record',
    label: '일지 작성',
    path: `${CONSULTANT_DASHBOARD_ROUTES.CONSULTATION_RECORDS}?action=create`,
    variant: 'primary'
  },
  {
    id: 'salary-settlement',
    label: '정산 확인',
    path: CONSULTANT_DASHBOARD_ROUTES.SALARY_SETTLEMENT,
    variant: 'outline'
  }
];

export const CONSULTANT_DASHBOARD_LIST_LOADING_LABEL = '목록을 불러오는 중...';
export const CONSULTANT_DASHBOARD_LIST_ERROR_LABEL = '데이터를 불러오지 못했습니다.';
export const CONSULTANT_DASHBOARD_LIST_RETRY_LABEL = '다시 시도';
export const CONSULTANT_DASHBOARD_KPI_RETRY_ARIA_LABEL = '핵심 지표 다시 불러오기';
