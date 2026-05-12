/**
 * API 엔드포인트 상수
 * 모든 경로는 /api/v1/ 프리픽스를 사용한다
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see mobile/src/api/endpoints.js (원본 참조)
 */

export const AUTH_API = {
  LOGIN: '/api/auth/login',
  BRANCH_LOGIN: '/api/auth/branch-login',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  GET_CURRENT_USER: '/api/auth/current-user',
  SOCIAL_LOGIN: '/api/auth/social-login',
  KAKAO_AUTHORIZE: '/api/auth/oauth2/kakao/authorize',
  NAVER_AUTHORIZE: '/api/auth/oauth2/naver/authorize',
  SMS_SEND: '/api/auth/sms/send',
  SMS_VERIFY: '/api/auth/sms/verify',
  SMS_LOGIN: '/api/auth/sms-login',
} as const;

export const TENANT_API = {
  VERIFY: '/api/v1/tenants/verify',
} as const;

export const USER_API = {
  GET_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  UPLOAD_PROFILE_IMAGE: '/api/users/profile/image',
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
  SCHEDULE_CREATE: '/api/v1/schedules',
  scheduleDetail: (id: string | number) => `/api/v1/schedules/${id}`,
} as const;

export const MESSAGE_API = {
  SEND_MESSAGE: '/api/v1/consultation-messages',
  conversations: (userId: string | number) =>
    `/api/v1/consultation-messages/conversations/${userId}`,
  messages: (conversationId: string | number) =>
    `/api/v1/consultation-messages/${conversationId}`,
  markAsRead: (messageId: string | number) =>
    `/api/v1/consultation-messages/${messageId}/read`,
  reply: (messageId: string | number) =>
    `/api/v1/consultation-messages/${messageId}/reply`,
  unreadCount: (userId: string | number, userType: string) =>
    `/api/v1/consultation-messages/unread-count?userId=${userId}&userType=${userType}`,
} as const;

export const NOTIFICATION_API = {
  GET_NOTIFICATIONS: '/api/v1/system-notifications',
  GET_UNREAD_COUNT: '/api/v1/system-notifications/unread-count',
  detail: (id: string | number) => `/api/v1/system-notifications/${id}`,
  markAsRead: (id: string | number) => `/api/v1/system-notifications/${id}/read`,
} as const;

export const PUSH_API = {
  REGISTER_TOKEN: '/api/v1/mobile/push-token/register',
  UNREGISTER_TOKEN: '/api/v1/mobile/push-token/unregister',
  GET_SETTINGS: '/api/v1/mobile/push-settings',
  UPDATE_SETTINGS: '/api/v1/mobile/push-settings',
} as const;

export const CONSULTANT_API = {
  consultantClients: (consultantId: string | number) =>
    `/api/v1/consultants/${consultantId}/clients`,
  consultantDashboard: (consultantId: string | number) =>
    `/api/v1/consultants/${consultantId}/dashboard`,
  consultantAvailability: (consultantId: string | number) =>
    `/api/v1/consultants/${consultantId}/availability`,
  GET_ALL: '/api/v1/consultants',
} as const;

export const VACATION_API = {
  vacations: (consultantId: string | number) =>
    `/api/v1/consultants/${consultantId}/vacations`,
  vacationDetail: (consultantId: string | number, vacationId: string | number) =>
    `/api/v1/consultants/${consultantId}/vacations/${vacationId}`,
} as const;

export const INCOME_API = {
  report: (consultantId: string | number) =>
    `/api/v1/consultants/${consultantId}/income/report`,
  details: (consultantId: string | number) =>
    `/api/v1/consultants/${consultantId}/income/details`,
} as const;

export const CONSULTATION_RECORD_API = {
  records: (consultantId: string | number) =>
    `/api/v1/consultant/${consultantId}/consultation-records`,
  CREATE_RECORD: '/api/v1/consultation-records',
  detail: (recordId: string | number) => `/api/v1/consultation-records/${recordId}`,
} as const;

export const RATING_API = {
  consultantStats: (consultantId: string | number) =>
    `/api/v1/ratings/consultant/${consultantId}/stats`,
  clientRatableSchedules: (clientId: string | number) =>
    `/api/v1/ratings/client/${clientId}/ratable-schedules`,
  SUBMIT_RATING: '/api/v1/ratings',
} as const;

export const PAYMENT_API = {
  GET_PAYMENTS: '/api/v1/payments',
  CREATE_PAYMENT: '/api/v1/payments/create',
  SESSION_EXTENSIONS: '/api/v1/admin/session-extensions',
  paymentDetail: (id: string | number) => `/api/v1/payments/${id}`,
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

export const API_ENDPOINTS = {
  AUTH: AUTH_API,
  TENANT: TENANT_API,
  USER: USER_API,
  DASHBOARD: DASHBOARD_API,
  SCHEDULE: SCHEDULE_API,
  MESSAGE: MESSAGE_API,
  NOTIFICATION: NOTIFICATION_API,
  PUSH: PUSH_API,
  CONSULTANT: CONSULTANT_API,
  CONSULTATION_RECORD: CONSULTATION_RECORD_API,
  RATING: RATING_API,
  PAYMENT: PAYMENT_API,
  HEALING_CONTENT: HEALING_CONTENT_API,
  VACATION: VACATION_API,
  INCOME: INCOME_API,
  MOOD_JOURNAL: MOOD_JOURNAL_API,
  SELF_ASSESSMENT: SELF_ASSESSMENT_API,
} as const;
