/**
 * API 엔드포인트 상수
 * 모든 경로는 /api/v1/ 프리픽스를 사용한다
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see mobile/src/api/endpoints.js (원본 참조)
 */

export const AUTH_API = {
  LOGIN: '/api/v1/auth/login',
  BRANCH_LOGIN: '/api/auth/branch-login',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  GET_CURRENT_USER: '/api/v1/auth/current-user',
  SOCIAL_LOGIN: '/api/v1/auth/social-login',
  /** Spring `SocialAuthController` — 쿼리 `tenantId` 권장 */
  SOCIAL_SIGNUP: '/api/v1/auth/social/signup',
  OAUTH_ACCOUNT_SELECTION_PREVIEW: '/api/v1/auth/oauth2/account-selection-preview',
  OAUTH_ACCOUNT_SELECTION_COMPLETE: '/api/v1/auth/oauth2/complete-account-selection',
  KAKAO_AUTHORIZE: '/api/auth/oauth2/kakao/authorize',
  NAVER_AUTHORIZE: '/api/auth/oauth2/naver/authorize',
  SMS_SEND: '/api/auth/sms/send',
  SMS_VERIFY: '/api/auth/sms/verify',
  SMS_LOGIN: '/api/auth/sms-login',
} as const;

export const TENANT_API = {
  LIST_ACTIVE: '/api/v1/auth/tenant/list-active',
  BY_SUBDOMAIN: '/api/v1/auth/tenant/by-subdomain',
} as const;

export const USER_API = {
  GET_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  UPLOAD_PROFILE_IMAGE: '/api/users/profile/image',
} as const;

/** 웹 mypageProfilePayload와 동일 — 내담자 마이페이지·상담사 사용자 프로필 */
export const PROFILE_API = {
  CLIENT_PROFILE: '/api/v1/clients/profile',
  userProfile: (userId: string | number) => `/api/v1/users/profile/${userId}`,
} as const;

export const DASHBOARD_API = {
  CLIENT: '/api/v1/dashboard/client',
  CONSULTANT: '/api/v1/dashboard/consultant',
} as const;

export const SCHEDULE_API = {
  SCHEDULES: '/api/v1/schedules',
  SCHEDULES_BY_DATE: '/api/v1/schedules/date',
  SCHEDULES_BY_CONSULTANT: '/api/v1/schedules/consultant',
  SCHEDULES_BY_CLIENT: '/api/v1/schedules/client',
  /** 내담자 본인 예약 — 어드민 일정 등록과 혼동 금지 */
  SCHEDULE_CREATE: '/api/v1/schedules',
  /** 웹 ScheduleModal SSOT — ADMIN/STAFF 상담 일정 등록 */
  SCHEDULE_CREATE_CONSULTANT: '/api/v1/schedules/consultant',
  scheduleDetail: (id: string | number) => `/api/v1/schedules/${id}`,
} as const;

/** 공통코드 — ScheduleModal 상담유형·시간(분) 피커 */
export const COMMON_CODE_API = {
  group: (codeGroup: string) =>
    `/api/v1/common-codes/groups/${encodeURIComponent(codeGroup)}`,
} as const;

export const MESSAGE_API = {
  SEND_MESSAGE: '/api/v1/consultation-messages',
  /** 내담자 본인 메시지 목록 (Spring Pageable) */
  clientMessages: (clientId: string | number) => `/api/v1/consultation-messages/client/${clientId}`,
  /** 상담사 본인 메시지 목록 */
  consultantMessages: (consultantId: string | number) =>
    `/api/v1/consultation-messages/consultant/${consultantId}`,
  markAsRead: (messageId: string | number) => `/api/v1/consultation-messages/${messageId}/read`,
  reply: (messageId: string | number) => `/api/v1/consultation-messages/${messageId}/reply`,
  unreadCount: (userId: string | number, userType: string) =>
    `/api/v1/consultation-messages/unread-count?userId=${userId}&userType=${encodeURIComponent(userType)}`,
} as const;

export const NOTIFICATION_API = {
  GET_NOTIFICATIONS: '/api/v1/system-notifications',
  GET_UNREAD_COUNT: '/api/v1/system-notifications/unread-count',
  MARK_ALL_READ: '/api/v1/system-notifications/read-all',
  detail: (id: string | number) => `/api/v1/system-notifications/${id}`,
  markAsRead: (id: string | number) => `/api/v1/system-notifications/${id}/read`,
} as const;

/** 인증 불필요 — `GET ?platform=android|ios&version={semver}&versionCode={int?}` */
export const MOBILE_APP_VERSION_CHECK = '/api/v1/mobile/app-version/check';

export const PUSH_API = {
  /** POST 바디: userId, tenantId, token, platform, deviceInfo — Spring 구현 시 `MobilePushTokenController` 등과 정합 */
  REGISTER_TOKEN: '/api/v1/mobile/push-token/register',
  UNREGISTER_TOKEN: '/api/v1/mobile/push-token/unregister',
  /**
   * GET/PUT `/api/v1/mobile/push-settings` — 응답·요청 바디: `{ schedule, payment, message, wellness, system }` 불리언.
   * 저장소(2026-05) 기준 Spring 컨트롤러 미부착 시 404/501 예상 → expo는 로컬(MMKV)로 폴백.
   */
  GET_SETTINGS: '/api/v1/mobile/push-settings',
  UPDATE_SETTINGS: '/api/v1/mobile/push-settings',
} as const;

export const CONSULTANT_API = {
  consultantClients: (consultantId: string | number) =>
    `/api/v1/consultants/${consultantId}/clients`,
  consultantClientDetail: (consultantId: string | number, clientId: string | number) =>
    `/api/v1/consultants/${encodeURIComponent(String(consultantId))}/clients/${encodeURIComponent(String(clientId))}`,
  consultantDashboard: (consultantId: string | number) =>
    `/api/v1/consultants/${consultantId}/dashboard`,
  consultantAvailability: (consultantId: string | number) =>
    `/api/v1/consultants/${consultantId}/availability`,
  /** 단일 근무 슬롯 삭제 */
  consultantAvailabilitySlot: (slotId: string | number) =>
    `/api/v1/consultants/availability/${slotId}`,
  GET_ALL: '/api/v1/consultants',
  /** 본인 급여 정산(관리자 확정·승인·지급 건만) — Spring `ConsultantSalarySelfController` */
  MY_SALARY_CALCULATIONS: '/api/v1/consultants/me/salary-calculations',
  /**
   * 본인 완료 회기 KPI — `GET ?startDate&endDate&granularity=DAY|WEEK|MONTH`
   * (Spring 경로가 다르면 본 상수만 교체)
   */
  MY_SESSION_STATISTICS: '/api/v1/consultants/me/session-statistics',
} as const;

/**
 * 상담사 휴무 — 백엔드 ConsultantAvailabilityController 단수 경로와 일치
 * GET/POST `/{consultantId}/vacation`, DELETE `/{consultantId}/vacation/{date}`
 */
export const VACATION_API = {
  vacations: (consultantId: string | number) => `/api/v1/consultants/${consultantId}/vacation`,
  vacationByDate: (consultantId: string | number, date: string) =>
    `/api/v1/consultants/${consultantId}/vacation/${encodeURIComponent(date)}`,
} as const;

export const INCOME_API = {
  report: (consultantId: string | number) => `/api/v1/consultants/${consultantId}/income/report`,
  details: (consultantId: string | number) => `/api/v1/consultants/${consultantId}/income/details`,
} as const;

/**
 * 상담일지 — Spring `ConsultantRecordsController`, `ScheduleController` 경로와 정합.
 * 관리 목록 GET은 `HttpSession` 기반일 수 있어, 모바일 JWT는 `listEntitiesByConsultant` 우선.
 */
export const CONSULTATION_RECORD_API = {
  /** Spring `ConsultantRecordsController` — GET `/{consultantId}/consultation-records` (맵 배열 `data`) */
  records: (consultantId: string | number) =>
    `/api/v1/admin/consultant-records/${encodeURIComponent(String(consultantId))}/consultation-records`,
  /**
   * Spring `ScheduleController` — GET `/api/v1/schedules/consultation-records?consultantId=`
   * 엔티티 JSON(`data.records`)에 `consultationId` 등 포함 → 모바일 목록·미작성 탭에 사용.
   */
  listEntitiesByConsultant: (consultantId: string | number) =>
    `/api/v1/schedules/consultation-records?consultantId=${encodeURIComponent(String(consultantId))}`,
  /** Spring `ScheduleController` — GET `?consultationId=` 만으로 해당 스케줄 비페이지 목록 */
  listByConsultationId: (consultationId: string | number) =>
    `/api/v1/schedules/consultation-records?consultationId=${encodeURIComponent(String(consultationId))}`,
  /** Spring `ScheduleController` — POST `/api/v1/schedules/consultation-records` */
  CREATE_RECORD: '/api/v1/schedules/consultation-records',
  /** Spring `ConsultantRecordsController` — GET 상세 */
  detail: (consultantId: string | number, recordId: string | number) =>
    `/api/v1/admin/consultant-records/${encodeURIComponent(String(consultantId))}/consultation-records/${encodeURIComponent(String(recordId))}`,
  /** Spring `ScheduleController` — PUT `/api/v1/schedules/consultation-records/{recordId}` */
  update: (recordId: string | number) =>
    `/api/v1/schedules/consultation-records/${encodeURIComponent(String(recordId))}`,
} as const;

export const RATING_API = {
  consultantStats: (consultantId: string | number) =>
    `/api/v1/ratings/consultant/${consultantId}/stats`,
  clientRatableSchedules: (clientId: string | number) =>
    `/api/v1/ratings/client/${clientId}/ratable-schedules`,
  SUBMIT_RATING: '/api/v1/ratings',
} as const;

/** 내담자 회기·결제는 웹과 동일하게 매칭(ConsultantClientMapping) API를 사용한다 */
export const ADMIN_CLIENT_API = {
  MAPPINGS_BY_CLIENT: '/api/v1/admin/mappings/client',
} as const;

/**
 * 어드민·스태프 모바일 MVP (Task C) — 커뮤니티 검수(Task B)와 분리
 * 오늘 스케줄은 `SCHEDULE_API` + `userRole=ADMIN|STAFF` 재사용
 */
export const ADMIN_MOBILE_API = {
  USER_MANAGEMENT: '/api/v1/admin/user-management',
  CLIENTS_WITH_MAPPING_INFO: '/api/v1/admin/clients/with-mapping-info',
  MAPPINGS: '/api/v1/admin/mappings',
  confirmMappingPayment: (mappingId: string | number) =>
    `/api/v1/admin/mappings/${encodeURIComponent(String(mappingId))}/confirm-payment`,
  confirmMappingDeposit: (mappingId: string | number) =>
    `/api/v1/admin/mappings/${encodeURIComponent(String(mappingId))}/confirm-deposit`,
  approveMapping: (mappingId: string | number) =>
    `/api/v1/admin/mappings/${encodeURIComponent(String(mappingId))}/approve`,
  mappingsByConsultant: (consultantId: string | number) =>
    `/api/v1/admin/mappings/consultant/${encodeURIComponent(String(consultantId))}/clients`,
  CONSULTANTS_WITH_VACATION: '/api/v1/admin/consultants/with-vacation',
  CREATE_CLIENT: '/api/v1/admin/clients',
  CREATE_CONSULTANT: '/api/v1/admin/consultants',
  CREATE_STAFF: '/api/v1/admin/staff',
  DUPLICATE_CHECK_EMAIL: '/api/v1/admin/duplicate-check/email',
  DUPLICATE_CHECK_PHONE: '/api/v1/admin/duplicate-check/phone',
  CONSULTANT_RECORDS_ROOT: '/api/v1/admin/consultant-records',
  /** Spring `ConsultantRecordsController` — 상담사별 상담일지 목록 */
  consultantConsultationRecords: (consultantId: string | number) =>
    `/api/v1/admin/consultant-records/${encodeURIComponent(String(consultantId))}/consultation-records`,
  /** Spring `ConsultantRecordsController` — 상담일지 상세(읽기 전용) */
  consultantConsultationRecordDetail: (
    consultantId: string | number,
    recordId: string | number,
  ) =>
    `/api/v1/admin/consultant-records/${encodeURIComponent(String(consultantId))}/consultation-records/${encodeURIComponent(String(recordId))}`,
  MIND_WEATHER_CARDS: '/api/v1/admin/wellness/mind-weather/cards',
  MIND_WEATHER_SUMMARY: '/api/v1/admin/wellness/mind-weather/summary',
  COMMUNITY_MODERATION_QUEUE: '/api/v1/admin/community/moderation-queue',
} as const;

/**
 * 어드민 커뮤니티 검수 — `AdminCommunityModerationController` `/api/v1/admin/community`
 * - GET `MODERATION_QUEUE` — 검수 대기 목록
 * - PATCH `moderation(postId)` — 본문 `{ decision: 'APPROVE'|'REJECT', reasonCode?, note? }`
 */
export const ADMIN_COMMUNITY_API = {
  MODERATION_QUEUE: '/api/v1/admin/community/moderation-queue',
  moderation: (postId: string | number) =>
    `/api/v1/admin/community/posts/${encodeURIComponent(String(postId))}/moderation`,
} as const;

export const PAYMENT_API = {
  /** PG 결제 건별 목록(결제자 ID). 매칭 기반 회기와 별개일 수 있음 */
  PAYMENTS_BY_PAYER: (payerId: string | number) => `/api/v1/payments/payer/${payerId}`,
  GET_PAYMENTS: '/api/v1/payments',
  CREATE_PAYMENT: '/api/v1/payments/create',
  SESSION_EXTENSIONS: '/api/v1/admin/session-extensions',
  paymentDetail: (id: string | number) => `/api/v1/payments/${id}`,
  /** PG 결제 환불 — PaymentController `POST /{paymentId}/refund` */
  refund: (paymentId: string | number) =>
    `/api/v1/payments/${encodeURIComponent(String(paymentId))}/refund`,
  SESSION_BALANCE: '/api/v1/payments/session-balance',
  SESSION_USAGE_HISTORY: '/api/v1/payments/session-usage',
  CONFIRM_PAYMENT: '/api/v1/payments/confirm',
} as const;

export const HEALING_CONTENT_API = {
  GET_ALL: '/api/v1/healing-contents',
  detail: (id: string | number) => `/api/v1/healing-contents/${id}`,
} as const;

export const MOOD_JOURNAL_API = {
  GET_MONTHLY: '/api/v1/mood-journals',
  detail: (date: string) => `/api/v1/mood-journals/${date}`,
  CREATE: '/api/v1/mood-journals',
  delete: (date: string) => `/api/v1/mood-journals/${date}`,
  STATS: '/api/v1/mood-journals/stats',
} as const;

export const SELF_ASSESSMENT_API = {
  GET_ALL: '/api/v1/self-assessments',
  detail: (id: string | number) => `/api/v1/self-assessments/${id}`,
  SUBMIT: '/api/v1/self-assessments',
} as const;

/** Phase 3-C §13 EXPO_NATIVE_APP_PLAN — 목록·카테고리·즐겨찾기·수련이력(백엔드 예정) */
export const MEDITATION_API = {
  LIST: '/api/v1/meditations',
} as const;

/** Phase 3-C §13 — 목록·상세·북마크·읽기완료(백엔드 예정) */
export const PSYCHO_EDUCATION_API = {
  LIST: '/api/v1/psycho-education',
  detail: (id: string | number) => `/api/v1/psycho-education/${id}`,
} as const;

/**
 * Phase 3-C §13 — `CommunityController` `/api/v1/community`
 * - GET `LIST` — optional `tab`: `reviews` | `columns` (Spring `Pageable` 기본 size 50)
 * - Path builders: `postId`·`commentId`는 `encodeURIComponent(String(id))` 로 이스케이프
 */
export const COMMUNITY_API = {
  LIST: '/api/v1/community',
  detail: (postId: string | number) => `/api/v1/community/${encodeURIComponent(String(postId))}`,
  comments: (postId: string | number) =>
    `/api/v1/community/${encodeURIComponent(String(postId))}/comments`,
  /** DELETE 본인 댓글 — `CommunityController` `DELETE .../comments/{commentId}` */
  commentById: (commentId: string | number) =>
    `/api/v1/community/comments/${encodeURIComponent(String(commentId))}`,
  likes: (postId: string | number) =>
    `/api/v1/community/${encodeURIComponent(String(postId))}/likes`,
  reports: (postId: string | number) =>
    `/api/v1/community/${encodeURIComponent(String(postId))}/reports`,
} as const;

/**
 * Phase 4-B 「마음 정원」— 서버 권위 상태·이벤트 적재 (Spring 미부착 시 404 예상, 클라이언트 MMKV 우선)
 */
export const GARDEN_API = {
  STATE: '/api/v1/clients/me/mind-garden',
  APPLY_EVENT: '/api/v1/clients/me/mind-garden/events',
} as const;

/**
 * Phase 4-A 「마음 날씨」 — `CONSULTANT_CLIENT_APP_PLAN.md` Phase 4 A절.
 * - 텍스트(또는 후속 음성/STT) → 감정 키워드·한 줄 요약 분석 (참고용·진단 아님)
 * - 상담사 옵트인 공유는 카드별 토글 엔드포인트로 분리
 * - 상담사 수신함은 공유 동의된 카드만 노출
 *
 * **백엔드 구현 전(Spring 미부착)**: 본 expo-app은 mock 분석 + MMKV 캐시로 폴백한다.
 * 백엔드 부착 시 본 상수를 그대로 사용해 바인딩만 교체하면 된다.
 */
export const MIND_WEATHER_API = {
  /** POST 바디: `{ text, source: 'mood-journal' | 'memo' | 'voice', sourceRefId? }` → 분석 카드 */
  ANALYZE: '/api/v1/mind-weather/analyze',
  /** GET — 본인(내담자) 분석 카드 목록 (Pageable 가능) */
  LIST: '/api/v1/mind-weather',
  /** GET — 카드 상세 */
  detail: (id: string | number) => `/api/v1/mind-weather/${id}`,
  /**
   * POST — 옵트인 토글
   * 바디: `{ shareSummary: boolean, shareOriginal: boolean, consultantId? }`
   */
  share: (id: string | number) => `/api/v1/mind-weather/${id}/share`,
  /** DELETE — 공유 철회(옵트아웃) */
  unshare: (id: string | number) => `/api/v1/mind-weather/${id}/share`,
  /** GET — 상담사 수신함(공유 동의된 내담자 카드만) */
  CONSULTANT_INBOX: '/api/v1/mind-weather/inbox',
} as const;

export const API_ENDPOINTS = {
  AUTH: AUTH_API,
  TENANT: TENANT_API,
  USER: USER_API,
  PROFILE: PROFILE_API,
  DASHBOARD: DASHBOARD_API,
  SCHEDULE: SCHEDULE_API,
  MESSAGE: MESSAGE_API,
  NOTIFICATION: NOTIFICATION_API,
  PUSH: PUSH_API,
  CONSULTANT: CONSULTANT_API,
  ADMIN_COMMUNITY: ADMIN_COMMUNITY_API,
  CONSULTATION_RECORD: CONSULTATION_RECORD_API,
  RATING: RATING_API,
  PAYMENT: PAYMENT_API,
  HEALING_CONTENT: HEALING_CONTENT_API,
  VACATION: VACATION_API,
  INCOME: INCOME_API,
  MOOD_JOURNAL: MOOD_JOURNAL_API,
  SELF_ASSESSMENT: SELF_ASSESSMENT_API,
  MEDITATION: MEDITATION_API,
  PSYCHO_EDUCATION: PSYCHO_EDUCATION_API,
  COMMUNITY: COMMUNITY_API,
  GARDEN: GARDEN_API,
  MIND_WEATHER: MIND_WEATHER_API,
  ADMIN_MOBILE: ADMIN_MOBILE_API,
} as const;
