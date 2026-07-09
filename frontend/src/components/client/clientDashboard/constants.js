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
export const CLIENT_SCHEDULE_EMPTY_BODY =
  '예정된 상담·일정이 없을 때는 여기에 표시됩니다. 일정을 확인하려면 아래 버튼을 눌러 주세요.';
export const CLIENT_SCHEDULE_VIEW_LABEL = '일정 보기';
export const CLIENT_SCHEDULE_DETAIL_HINT = '장소·링크 정보는 일정 화면에서 확인할 수 있어요.';

export const CLIENT_KPI_SECTION_TITLE = '핵심 지표';
export const CLIENT_KPI_SECTION_DESC = '회기·이번 달 일정·새 메시지를 요약합니다.';

export const CLIENT_CORE_SECTION_TITLE = '핵심 블록';
export const CLIENT_CORE_SECTION_DESC = '상담 진행·기록·메시지 등 주요 영역 요약';
export const CLIENT_CORE_ACTIVE_TITLE = '진행 중인 상담';
export const CLIENT_CORE_RECORDS_TITLE = '최근 기록 · 과제';
export const CLIENT_CORE_RECORDS_BODY = '상담 후 안내와 메시지는 메시지함에서 한번에 볼 수 있어요.';

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
  thisMonthScheduleCount: 0
};
