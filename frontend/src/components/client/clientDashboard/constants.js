/**
 * Client Dashboard — 상수 SSOT (v4 상담실 로비 + 레거시 섹션)
 *
 * @author CoreSolution
 * @since 2026-07-07
 */

export const CLIENT_DASHBOARD_TITLE_ID = 'client-dashboard-page-title';
export const CLIENT_DASHBOARD_PAGE_TITLE = '상담실 로비';
export const CLIENT_DASHBOARD_ARIA_LABEL = '내담자 상담실 로비';
export const CLIENT_DASHBOARD_MAIN_ID = 'client-dashboard-main';

/** v4 상담실 로비 */
export const CLIENT_LOBBY_TEST_ID = 'client-lobby';
export const CLIENT_LOBBY_HERO_TEST_ID = 'client-lobby-hero';
export const CLIENT_LOBBY_STATUS_TEST_ID = 'client-lobby-status-line';
export const CLIENT_LOBBY_FOOTER = '웹 멤버 포털 · 예약은 센터에서 안내합니다';
export const CLIENT_LOBBY_HERO_NOTE =
  '센터에서 준비한 일정입니다. 변경이 필요하시면 센터로 문의해 주세요.';
/** SSOT 「다음 한 장」라벨 — 히어로 상단 kicker (우선순위별 타이틀과 분리) */
export const CLIENT_LOBBY_HERO_KICKER = '다음 한 장';
export const CLIENT_LOBBY_CTA_DETAILS = '자세히 보기';
export const CLIENT_LOBBY_CTA_PICK_SESSION = '회기 고르기';
export const CLIENT_LOBBY_CTA_PAYMENT = '결제 요약';
export const CLIENT_LOBBY_CTA_VIEW_ALL = '전체 보기';
export const CLIENT_LOBBY_CTA_BALANCE_DETAIL = '자세히';
export const CLIENT_LOBBY_PANEL_UPCOMING = '예정 목록';
export const CLIENT_LOBBY_PANEL_BALANCE = '회기 잔량';
export const CLIENT_LOBBY_CHIP_PACKAGE = '패키지';
export const CLIENT_LOBBY_CHIP_SINGLE = '단회기';
export const CLIENT_LOBBY_SINGLE_LABEL = '단회기';
export const CLIENT_LOBBY_PACKAGE_FALLBACK = '상담 패키지';
export const CLIENT_LOBBY_REMAIN_PREFIX = '남은 회기';
export const CLIENT_LOBBY_SESSION_UNIT = '회기';
export const CLIENT_LOBBY_LIST_MAX = 3;
export const CLIENT_LOBBY_DEFAULT_DURATION_MIN = 50;
export const CLIENT_LOBBY_FALLBACK_METHOD = '대면';
export const CLIENT_LOBBY_EMPTY_UPCOMING = '예정된 일정이 없습니다';
export const CLIENT_LOBBY_LOAD_ERROR = '데이터를 불러오지 못했습니다';
export const CLIENT_LOBBY_RETRY = '다시 시도';

export const CLIENT_COMMUNITY_TEST_ID = 'client-community-page';
export const CLIENT_COMMUNITY_MAIN_ID = 'client-community-main';
export const CLIENT_COMMUNITY_ARIA_LABEL = '내담자 커뮤니티';

export const CLIENT_LOBBY_NAV = Object.freeze([
  { id: 'home', label: '홈', routeKey: 'DASHBOARD' },
  { id: 'schedule', label: '예정', routeKey: 'SCHEDULE' },
  { id: 'sessions', label: '회기', routeKey: 'SESSION_MANAGEMENT' },
  { id: 'payment', label: '결제', routeKey: 'PAYMENT_HISTORY' },
  { id: 'community', label: '커뮤니티', routeKey: 'COMMUNITY' }
]);

/** v4 top chrome — 로그아웃 (SSOT) */
export const CLIENT_LOBBY_LOGOUT = '로그아웃';
export const CLIENT_LOBBY_LOGOUT_CONFIRM = '로그아웃 하시겠습니까?';
export const CLIENT_LOBBY_LOGOUT_CANCEL = '취소';

export const CLIENT_LOBBY_HERO_PRIORITY = Object.freeze({
  NEXT_APPOINTMENT: 'NEXT_APPOINTMENT',
  ZERO_SESSIONS: 'ZERO_SESSIONS',
  CONSULTANT_UNASSIGNED: 'CONSULTANT_UNASSIGNED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  QUIET_DAY: 'QUIET_DAY'
});

export const CLIENT_LOBBY_HERO_COPY = Object.freeze({
  NEXT_APPOINTMENT: {
    title: '다가오는 상담',
    cta: CLIENT_LOBBY_CTA_DETAILS,
    ctaRouteKey: 'SCHEDULE'
  },
  ZERO_SESSIONS: {
    title: '회기 고르기',
    body: '이용 가능한 회기가 없습니다. 회기를 확인해 주세요.',
    cta: CLIENT_LOBBY_CTA_PICK_SESSION,
    ctaRouteKey: 'SESSION_MANAGEMENT'
  },
  CONSULTANT_UNASSIGNED: {
    title: '담당 확인 중',
    body: '담당 상담사 배정을 확인 중입니다. 센터 안내를 기다려 주세요.',
    cta: CLIENT_LOBBY_CTA_DETAILS,
    ctaRouteKey: 'SCHEDULE'
  },
  PENDING_PAYMENT: {
    title: '결제 확인',
    body: '확인이 필요한 결제가 있습니다.',
    cta: CLIENT_LOBBY_CTA_PAYMENT,
    ctaRouteKey: 'PAYMENT_HISTORY',
    amber: true
  },
  QUIET_DAY: {
    title: '오늘은 여유로운 날',
    body: '예정된 다음 상담이 없습니다. 남은 회기를 확인해 보세요.',
    cta: CLIENT_LOBBY_CTA_PICK_SESSION,
    ctaRouteKey: 'SESSION_MANAGEMENT'
  }
});

export const CLIENT_LOBBY_METHOD_LABELS = Object.freeze({
  FACE: '대면',
  FACE_TO_FACE: '대면',
  IN_PERSON: '대면',
  OFFLINE: '대면',
  VIDEO: '화상',
  ONLINE: '화상',
  REMOTE: '화상',
  PHONE: '전화',
  PHONE_CONSULTATION: '전화'
});

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
