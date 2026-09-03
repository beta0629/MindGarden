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
export const CONSULTANT_DASHBOARD_ACTION_STRIP_TEST_ID = 'consultant-dashboard-action-strip';
export const CONSULTANT_DASHBOARD_SNAPSHOT_TEST_ID = 'consultant-dashboard-snapshot';
export const CONSULTANT_DASHBOARD_SESSION_CHART_TEST_ID = 'consultant-dashboard-session-chart';
export const CONSULTANT_DASHBOARD_TODAY_SCHEDULE_TEST_ID = 'consultant-dashboard-today-schedules';

export const CONSULTANT_DASHBOARD_LIST_MAX_ROWS = 5;
export const CONSULTANT_DASHBOARD_LIST_SKELETON_ROWS = 3;

export const CONSULTANT_DASHBOARD_VIEW_ALL_SCHEDULE_LABEL = '전체 일정 보기';
export const CONSULTANT_DASHBOARD_VIEW_ALL_UPCOMING_LABEL = '전체 스케줄 보기';
export const CONSULTANT_DASHBOARD_VIEW_ALL_NOTIFICATIONS_LABEL = '전체 보기';
export const CONSULTANT_DASHBOARD_VIEW_ALL_URGENT_CLIENTS_LABEL = '전체보기';

export const CONSULTANT_DASHBOARD_URGENT_SECTION_TITLE = '긴급 확인 필요 내담자';

/** Expo 홈 패리티 카피 (상담사 웹 대시보드) */
export const CONSULTANT_DASHBOARD_HOME_COPY = {
  ACTION_STRIP_TITLE: '지금 손볼 일',
  TODAY_SUMMARY_ZERO: '오늘 예정된 상담이 없어요.',
  TODAY_SUMMARY: (count) => `오늘 상담 ${count}건`,
  KPI_TODAY_SESSIONS: '오늘 상담',
  KPI_UNREAD_MESSAGES: '안읽은 메시지',
  KPI_NEW_CLIENTS: '신규 내담',
  TODAY_SCHEDULE_TITLE: '오늘의 스케줄',
  TODAY_SCHEDULE_EMPTY: '오늘 예정된 일정이 없습니다.',
  SNAPSHOT_MESSAGE_TITLE: '최근 메시지',
  SNAPSHOT_MESSAGE_EMPTY: '최근 메시지가 없습니다.',
  SNAPSHOT_SALARY_TITLE: '급여 정산',
  SNAPSHOT_SALARY_EMPTY: '정산 내역 없음',
  SESSION_CHART_TITLE: '완료 회기 추이',
  SESSION_CHART_EMPTY: '최근 완료 회기 추이 데이터가 없습니다.',
  SESSION_CHART_UNIT: '건'
};

export {
  CONSULTANT_DASHBOARD_ROUTES,
  CONSULTANT_DASHBOARD_KPI_ROUTES,
  CONSULTANT_DASHBOARD_QUICK_ACTIONS,
  buildConsultantClientDetailRoute,
  buildConsultantConsultationRecordRoute,
  buildConsultantConsultationRecordsRoute,
  buildConsultantClientsRoute
} from './consultantDashboardRoutes';

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

export const CONSULTANT_DASHBOARD_LIST_LOADING_LABEL = '목록을 불러오는 중...';
export const CONSULTANT_DASHBOARD_LIST_ERROR_LABEL = '데이터를 불러오지 못했습니다.';
export const CONSULTANT_DASHBOARD_LIST_RETRY_LABEL = '다시 시도';
export const CONSULTANT_DASHBOARD_KPI_RETRY_ARIA_LABEL = '핵심 지표 다시 불러오기';
