/**
 * 어드민·스태프 모바일 MVP 화면 카피·웹 경로(상대 path)
 *
 * @author MindGarden
 * @since 2026-05-16
 */

/** 웹 어드민 SPA 경로 — `getAdminWebUrl()` 과 조합 */
export const ADMIN_MOBILE_WEB_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  SCHEDULES: '/admin/schedules',
  NOTIFICATIONS: '/admin/notifications',
  SYSTEM_CONFIG: '/admin/system-config',
  USER_MANAGEMENT: '/admin/user-management',
  CONSULTATION_LOGS: '/admin/consultation-logs',
  COMMUNITY_MODERATION: '/admin/community-moderation',
  MIND_WEATHER_OBSERVABILITY: '/admin/wellness/mind-weather-observability',
} as const;

/** Phase 2+ API 경로 주석용 (Spring) */
export const ADMIN_MOBILE_API_PATH_HINTS = {
  TODAY_SCHEDULES: 'GET /api/v1/schedules/date/{yyyy-MM-dd}?userId=&userRole=ADMIN|STAFF',
  USER_MANAGEMENT: 'GET /api/v1/admin/user-management',
  CONSULTATION_RECORDS: 'GET /api/v1/admin/consultant-records/{consultantId}/consultation-records',
  MIND_WEATHER_CARDS: 'GET /api/v1/admin/wellness/mind-weather/cards',
  MIND_WEATHER_SUMMARY: 'GET /api/v1/admin/wellness/mind-weather/summary',
  COMMUNITY_MODERATION: 'GET /api/v1/admin/community/moderation-queue',
} as const;

export const ADMIN_MOBILE_HOME_COPY = {
  TITLE: '관리 홈',
  GREETING: '안녕하세요',
  TENANT_LABEL: '테넌트',
  UNREAD_NOTIFICATIONS: '읽지 않은 알림',
  TODAY_SCHEDULES: '오늘 일정',
  QUICK_LINKS_TITLE: '바로가기',
  LINK_MESSAGES: '메시지',
  LINK_OPERATION: '운영',
  LINK_MORE: '더보기',
  LINK_NOTIFICATIONS: '알림 센터',
} as const;

/** 어드민 모바일 메시지 — Spring `ConsultationMessageController` */
export const ADMIN_MOBILE_MESSAGES_API = {
  ALL: '/api/v1/consultation-messages/all',
  detail: (messageId: number) => `/api/v1/consultation-messages/${messageId}`,
} as const;

export const ADMIN_MOBILE_MESSAGES_COPY = {
  TITLE: '메시지',
  SEARCH_PLACEHOLDER: '제목·내용·발신·수신자 검색',
  EMPTY_TITLE: '메시지가 없습니다',
  EMPTY_BODY: '테넌트 내 상담 메시지가 표시됩니다.',
  ERROR_TITLE: '목록을 불러오지 못했습니다',
  ERROR_BODY: '네트워크·권한을 확인한 뒤 다시 시도해 주세요.',
  RETRY: '다시 시도',
  UNREAD_BADGE: '미읽음',
  DETAIL_MODAL_TITLE: '메시지 상세',
  DETAIL_FROM: '발신',
  DETAIL_TO: '수신',
  DETAIL_CLOSE: '닫기',
  WEB_FALLBACK_TITLE: '웹 어드민에서 메시지 관리',
  WEB_FALLBACK_BODY:
    '모바일 앱에서는 메시지 관리 권한이 없어 목록을 표시할 수 없습니다. 통합 알림·상담 메시지는 데스크톱 웹 어드민에서 확인·응답해 주세요.',
  OPEN_WEB_CTA: '웹 어드민에서 열기',
  WEB_ROUTE: ADMIN_MOBILE_WEB_ROUTES.NOTIFICATIONS,
} as const;

export const ADMIN_MOBILE_MORE_COPY = {
  TITLE: '더보기',
  SECTION_OPERATIONS: '운영',
  COMMUNITY_REVIEW: '커뮤니티 검수',
  COMMUNITY_REVIEW_SUB: '대기 게시물 검수',
  NOTIFICATION_SETTINGS: '알림 설정',
  LOGOUT: '로그아웃',
  LOGOUT_CONFIRM_TITLE: '로그아웃',
  LOGOUT_CONFIRM_BODY: '정말 로그아웃하시겠습니까?',
  CANCEL: '취소',
} as const;

export const ADMIN_MOBILE_OPERATION_COPY = {
  HUB_TITLE: '운영',
  SCHEDULE_LITE: '스케줄 라이트',
  SCHEDULE_LITE_SUB: '오늘 테넌트 일정',
  RECORDS: '상담일지',
  RECORDS_SUB: '상담 기록 조회',
  USERS: '사용자 조회',
  USERS_SUB: '내담자·상담사 목록',
  MIND_WEATHER: '마음날씨 관측',
  MIND_WEATHER_SUB: '웰니스 카드·요약(읽기 전용)',
  PLACEHOLDER_TITLE: '준비 중',
  PLACEHOLDER_BODY:
    '이 기능은 웹 어드민과 동일 API로 연동할 예정입니다. 아래 경로를 참고해 주세요.',
  SCHEDULE_EMPTY: '오늘 등록된 일정이 없습니다.',
  SCHEDULE_ERROR: '일정을 불러오지 못했습니다. 권한·네트워크를 확인해 주세요.',
  SCHEDULE_STAFF_HINT: '사무원 계정은 제한된 일정만 표시될 수 있습니다.',
} as const;
