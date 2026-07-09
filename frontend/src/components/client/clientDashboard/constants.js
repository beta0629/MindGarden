/**
 * Client Dashboard v1.1 Freeze — 상수 SSOT
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

export const CLIENT_DASHBOARD_TITLE_ID = 'client-dashboard-page-title';
export const CLIENT_DASHBOARD_PAGE_TITLE = '내 대시보드';
export const CLIENT_DASHBOARD_ARIA_LABEL = '내담자 대시보드';
export const CLIENT_DASHBOARD_MAIN_ID = 'client-dashboard-main';

export const CLIENT_DASHBOARD_QUICK_MENU_TEST_ID = 'client-dashboard-quick-menu';
export const CLIENT_DASHBOARD_QUICK_MENU_SECTION_TEST_ID = 'client-dashboard-quick-menu-section';
export const CLIENT_DASHBOARD_UPCOMING_SCHEDULE_TEST_ID = 'client-dashboard-upcoming-schedule';
export const CLIENT_DASHBOARD_KPI_SECTION_TEST_ID = 'client-dashboard-kpi-section';

export const CLIENT_EYEBROW_TEXT = '내담자 홈';
export const CLIENT_WELCOME_LEDE =
  '오늘의 상담과 일정을 한눈에 확인하고, 다음 할 일로 바로 이동하세요.';

export const CLIENT_NEXT_SECTION_TITLE = '다음 액션 · 일정';
export const CLIENT_NEXT_SECTION_DESC = '우선 처리할 일과 가까운 일정만 요약합니다.';
export const CLIENT_SCHEDULE_EMPTY_BODY = '예정된 일정이 없습니다';
export const CLIENT_SCHEDULE_VIEW_ALL_LABEL = '전체 일정 보기';
export const CLIENT_SCHEDULE_LOAD_ERROR_LABEL = '데이터 로드 실패';

export const CLIENT_KPI_SECTION_TITLE = '나의 현황';
export const CLIENT_KPI_SECTION_DESC = '회기·일정·메시지·완료 상담을 한눈에 확인합니다.';
export const CLIENT_KPI_COMPLETED_LABEL = '완료 상담';

export const CLIENT_DASHBOARD_LIST_MAX_ROWS = 3;
export const CLIENT_DASHBOARD_LIST_SKELETON_ROW_COUNT = 3;
export const CLIENT_DASHBOARD_LIST_ERROR_LABEL = '데이터 로드 실패';
export const CLIENT_DASHBOARD_LIST_RETRY_LABEL = '다시 시도';

export const CLIENT_DASHBOARD_UPCOMING_COLUMNS = [
  { key: 'datetimeLabel', label: '일시' },
  { key: 'titleLabel', label: '제목' },
  { key: 'statusLabel', label: '상태', hideOnMobile: true }
];

export const CLIENT_DASHBOARD_CORE_COLUMNS = [
  { key: 'titleLabel', label: '영역' },
  { key: 'summaryLabel', label: '요약' },
  { key: 'statusLabel', label: '상태', hideOnMobile: true }
];

export const CLIENT_CORE_SECTION_TITLE = '핵심 블록';
export const CLIENT_CORE_SECTION_DESC = '상담 진행·기록·메시지 등 주요 영역 요약';
export const CLIENT_CORE_ACTIVE_TITLE = '진행 중인 상담';
export const CLIENT_CORE_RECORDS_TITLE = '최근 기록 · 과제';
export const CLIENT_CORE_RECORDS_BODY = '상담 후 안내와 메시지는 메시지함에서 한번에 볼 수 있어요.';

export const CLIENT_UPCOMING_CTA_LABEL = '보기';

export const CLIENT_DEFAULT_CONSULTANT_LABEL = '담당 상담사';
export const CLIENT_DEFAULT_CONSULTATION_TYPE = '상담';
export const CLIENT_DEFAULT_PACKAGE_LABEL = '상담 패키지';

/** 표시 전용 상태 라벨 — 값 판정은 백엔드 코드 그대로 사용 */
export const CLIENT_SCHEDULE_STATUS_LABELS = {
  CONFIRMED: '확정',
  BOOKED: '예약',
  COMPLETED: '완료',
  PENDING: '대기',
  CANCELLED: '취소',
  NO_SHOW: '불참'
};

export const CLIENT_PAYMENT_STATUS_LABELS = {
  CONFIRMED: '완료',
  PAY: '결제완료',
  DEP: '입금완료',
  APPROVED: '승인',
  PENDING: '확인중',
  REJECTED: '거절',
  REFUNDED: '환불',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소'
};

export const CLIENT_STATUS_FALLBACK_LABEL = '—';
export const CLIENT_MAX_LIST_ROWS = 5;

export const CLIENT_PAYMENT_SECTION_TITLE = '결제 요약';
export const CLIENT_PAYMENT_SECTION_DESC = '최근 청구·납부 상태를 한눈에';

export const CLIENT_QUICK_SECTION_TITLE = '빠른 메뉴';
export const CLIENT_QUICK_SECTION_DESC = '자주 찾는 기능으로 이동';

export const CUSTOMER_SUPPORT_TOAST =
  '고객센터 문의는 앱 내 메시지 또는 설정의 안내를 이용해 주세요.';

export const API_CLIENT_MAPPINGS = (clientId) =>
  `/api/v1/admin/mappings/client?clientId=${clientId}`;

export const API_CONSULTATION_MESSAGES_UNREAD_COUNT =
  '/api/v1/consultation-messages/unread-count';

export const EMPTY_CONSULTATION_DATA = {
  todaySchedules: [],
  weeklySchedules: [],
  upcomingSchedules: [],
  upcomingConsultations: [],
  completedConsultations: [],
  completedCount: 0,
  totalSessions: 0,
  usedSessions: 0,
  remainingSessions: 0,
  thisMonthScheduleCount: 0,
  completedCount: 0
};
