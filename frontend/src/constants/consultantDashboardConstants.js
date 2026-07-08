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
export const CONSULTANT_DASHBOARD_VIEW_ALL_MESSAGES_LABEL = '전체 메시지 보기';

export const CONSULTANT_DASHBOARD_ROUTES = {
  SCHEDULE: '/consultant/schedule',
  NOTIFICATIONS: '/notifications',
  CONSULTATION_RECORDS: '/consultant/consultation-records',
  CLIENTS: '/consultant/clients',
  MESSAGES: '/consultant/messages'
};

export const CONSULTANT_DASHBOARD_QUERY = {
  SCHEDULE_CREATE: 'action=new',
  MESSAGE_COMPOSE: 'action=compose',
  CLIENT_ADD: 'action=add',
  RECORDS_INCOMPLETE_FILTER: 'filter=incomplete',
  CLIENTS_URGENT_FILTER: 'filter=urgent'
};

export const CONSULTANT_DASHBOARD_QUICK_ACTIONS = {
  SCHEDULE_CREATE: {
    id: 'schedule-create',
    label: '일정 등록',
    ariaLabel: '일정 등록'
  },
  MESSAGE_COMPOSE: {
    id: 'message-compose',
    label: '메시지 작성',
    ariaLabel: '메시지 작성'
  },
  CLIENT_ADD: {
    id: 'client-add',
    label: '내담자 추가',
    ariaLabel: '내담자 추가'
  }
};

export const CONSULTANT_DASHBOARD_KPI_LOADING_LABEL = '로딩 중...';
export const CONSULTANT_DASHBOARD_KPI_ERROR_VALUE = '-';

export const CONSULTANT_DASHBOARD_SECTION_EMPTY = {
  URGENT_CLIENTS: '주의가 필요한 내담자가 없습니다',
  RECENT_SCHEDULES: '예정된 일정이 없습니다',
  UPCOMING_SCHEDULES: '다가오는 상담이 없습니다',
  NOTIFICATIONS: '새로운 알림이 없습니다',
  MESSAGES: '최근 메시지가 없습니다',
  CHART: '이번 달 통계 데이터가 없습니다'
};

export const CONSULTANT_DASHBOARD_SECTION_ERROR = {
  URGENT_CLIENTS: '데이터 로드 실패',
  SCHEDULES: '일정을 불러오지 못했습니다',
  NOTIFICATIONS: '알림 로드 실패',
  MESSAGES: '메시지를 불러오지 못했습니다',
  CHART: '통계를 불러올 수 없습니다'
};

export const CONSULTANT_DASHBOARD_SECTION_RETRY_LABEL = '재시도';

export const CONSULTANT_SCHEDULE_STATUS_LABELS = {
  CONFIRMED: '확정',
  PENDING: '대기',
  NO_SHOW: '노쇼',
  COMPLETED: '완료'
};

export const CONSULTANT_DASHBOARD_LIST_LOADING_LABEL = '목록을 불러오는 중...';
export const CONSULTANT_DASHBOARD_LIST_ERROR_LABEL = '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
