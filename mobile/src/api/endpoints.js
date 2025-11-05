/**
 * API 엔드포인트 상수
 * 백엔드와 프론트엔드 간 일관성 유지
 * 
 * 웹의 frontend/src/constants/api.js를 참고하여 작성
 */

// 인증 관련 API
export const AUTH_API = {
  LOGIN: '/api/auth/login',
  BRANCH_LOGIN: '/api/auth/branch-login', // 웹과 동일한 엔드포인트
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  GET_CURRENT_USER: '/api/auth/current-user',
  OAUTH2_CALLBACK: '/api/auth/oauth2/callback',
  SOCIAL_LOGIN: '/api/auth/social-login', // 소셜 로그인 엔드포인트 (레거시)
  // OAuth2 인증 URL 생성 (웹과 동일)
  KAKAO_AUTHORIZE: '/api/auth/oauth2/kakao/authorize',
  NAVER_AUTHORIZE: '/api/auth/oauth2/naver/authorize',
  SMS_SEND: '/api/auth/sms/send', // SMS 인증번호 전송 엔드포인트
  SMS_VERIFY: '/api/auth/sms/verify', // SMS 인증번호 확인 엔드포인트
  SMS_LOGIN: '/api/auth/sms-login', // SMS 로그인 엔드포인트
};

// 사용자 관련 API
export const USER_API = {
  GET_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  UPLOAD_PROFILE_IMAGE: '/api/users/profile/image',
  GET_USER_INFO: '/api/users',
  UPDATE_USER_INFO: '/api/users',
};

// 프로필 API (역할별)
export const PROFILE_API = {
  CLIENT: {
    GET_INFO: '/api/client/profile',
    UPDATE_INFO: '/api/client/profile',
    CHANGE_PASSWORD: '/api/client/profile/password',
    UPLOAD_IMAGE: '/api/client/profile/image',
  },
  CONSULTANT: {
    GET_INFO: (userId) => `/api/user/profile/${userId}`,
    UPDATE_INFO: (userId) => `/api/user/profile/${userId}`,
    UPLOAD_IMAGE: (userId) => `/api/user/profile/${userId}/image`,
  },
  ADMIN: {
    GET_INFO: (userId) => `/api/client/profile`,
    UPDATE_INFO: (userId) => `/api/client/profile`,
  },
};

// 대시보드 관련 API
export const DASHBOARD_API = {
  CLIENT: '/api/dashboard/client',
  CONSULTANT: '/api/dashboard/consultant',
  ADMIN: '/api/admin/dashboard',
  HQ: '/api/hq/dashboard',
};

// 스케줄 관련 API
export const SCHEDULE_API = {
  SCHEDULES: '/api/schedules',
  SCHEDULES_ADMIN: '/api/schedules/admin', // 관리자용 전체 스케줄 조회
  SCHEDULES_BY_DATE: '/api/schedules/date',
  SCHEDULES_BY_CONSULTANT: '/api/schedules/consultant',
  SCHEDULES_BY_CLIENT: '/api/schedules/client',
  SCHEDULE_CREATE: '/api/schedules',
  SCHEDULE_UPDATE: (id) => `/api/schedules/${id}`,
  SCHEDULE_DELETE: (id) => `/api/schedules/${id}`,
};

// 메시지 관련 API
export const MESSAGE_API = {
  SEND_MESSAGE: '/api/consultation-messages',
  GET_CONVERSATIONS: (userId) => `/api/consultation-messages/conversations/${userId}`,
  GET_MESSAGES: (conversationId) => `/api/consultation-messages/${conversationId}`,
  GET_MESSAGES_BY_CLIENT: (clientId) => `/api/consultation-messages/client/${clientId}`,
  GET_MESSAGES_BY_CONSULTANT: (consultantId) => `/api/consultation-messages/consultant/${consultantId}`,
  GET_MESSAGE_DETAIL: (messageId) => `/api/consultation-messages/${messageId}`,
  MARK_AS_READ: (messageId) => `/api/consultation-messages/${messageId}/read`,
  SEND_REPLY: (messageId) => `/api/consultation-messages/${messageId}/reply`,
  REPLY_MESSAGE: (messageId) => `/api/consultation-messages/${messageId}/reply`,
  GET_UNREAD_COUNT: (userId, userType) => `/api/consultation-messages/unread-count?userId=${userId}&userType=${userType}`,
};

// 시스템 알림 관련 API
export const SYSTEM_NOTIFICATION_API = {
  GET_NOTIFICATIONS: '/api/system-notifications',
  GET_UNREAD_COUNT: '/api/system-notifications/unread-count',
  GET_NOTIFICATION: (notificationId) => `/api/system-notifications/${notificationId}`,
  MARK_AS_READ: (notificationId) => `/api/system-notifications/${notificationId}/read`,
};

// 공통코드 관련 API
export const COMMON_CODE_API = {
  GET_COMMON_CODES: (codeGroup) => `/api/common-codes/${codeGroup}`,
  GET_PAYMENT_METHODS: '/api/common-codes/PAYMENT_METHOD',
  GET_PACKAGE_OPTIONS: '/api/common-codes/CONSULTATION_PACKAGE',
  GET_RESPONSIBILITY_OPTIONS: '/api/common-codes/RESPONSIBILITY',
  GET_STATUS_OPTIONS: '/api/common-codes/STATUS',
};

// 관리자 관련 API
export const ADMIN_API = {
  GET_ALL_USERS: '/api/admin/users',
  GET_USER: (id) => `/api/admin/users/${id}`,
  UPDATE_USER: (id) => `/api/admin/users/${id}`,
  DELETE_USER: (id) => `/api/admin/users/${id}`,
  GET_MAPPINGS: '/api/admin/mappings',
  GET_MAPPINGS_BY_CLIENT: (clientId) => `/api/admin/mappings/client?clientId=${clientId}`,
  GET_CLIENTS_BY_CONSULTANT: (consultantId) => `/api/admin/mappings/consultant/${consultantId}/clients`,
  GET_CONSULTANT_WITH_STATS: (consultantId) => `/api/admin/consultants/with-stats/${consultantId}`, // 상담사 통계 API
  CREATE_MAPPING: '/api/admin/mappings',
  UPDATE_MAPPING: (id) => `/api/admin/mappings/${id}`,
  DELETE_MAPPING: (id) => `/api/admin/mappings/${id}`,
  CONFIRM_MAPPING_PAYMENT: (id) => `/api/admin/mappings/${id}/confirm-payment`,
  CONFIRM_MAPPING_DEPOSIT: (id) => `/api/admin/mappings/${id}/confirm-deposit`,
  APPROVE_MAPPING: (id) => `/api/admin/mappings/${id}/approve`,
  EXTEND_SESSIONS: (mappingId) => `/api/admin/mappings/${mappingId}/extend-sessions`, // 세션 추가 (레거시, 사용 안함)
  // 세션 추가 요청 API
  CREATE_SESSION_EXTENSION_REQUEST: '/api/admin/session-extensions/requests',
  GET_SESSION_EXTENSION_REQUESTS: '/api/admin/session-extensions/requests',
  CONFIRM_SESSION_EXTENSION_PAYMENT: (requestId) => `/api/admin/session-extensions/requests/${requestId}/confirm-payment`,
  APPROVE_SESSION_EXTENSION: (requestId) => `/api/admin/session-extensions/requests/${requestId}/approve`,
  REJECT_SESSION_EXTENSION: (requestId) => `/api/admin/session-extensions/requests/${requestId}/reject`,
  COMPLETE_SESSION_EXTENSION: (requestId) => `/api/admin/session-extensions/requests/${requestId}/complete`,
};

// 지점 관련 API
export const BRANCH_API = {
  BRANCHES: '/api/branches',
  BRANCH_DETAIL: (id) => `/api/branches/${id}`,
  BRANCH_CREATE: '/api/branches',
  BRANCH_UPDATE: (id) => `/api/branches/${id}`,
  BRANCH_DELETE: (id) => `/api/branches/${id}`,
};

// 평가 관련 API
export const RATING_API = {
  GET_CONSULTANT_STATS: (consultantId) => `/api/ratings/consultant/${consultantId}/stats`,
  GET_CLIENT_RATABLE_SCHEDULES: (clientId) => `/api/ratings/client/${clientId}/ratable-schedules`,
  SUBMIT_RATING: '/api/ratings',
  GET_RATING: (ratingId) => `/api/ratings/${ratingId}`,
};

// 상담일지 관련 API
export const CONSULTATION_RECORD_API = {
  GET_RECORDS: (consultantId) => `/api/consultant/${consultantId}/consultation-records`,
  GET_RECORD: (recordId) => `/api/consultation-records/${recordId}`,
  CREATE_RECORD: '/api/consultation-records',
  UPDATE_RECORD: (recordId) => `/api/consultation-records/${recordId}`,
  DELETE_RECORD: (recordId) => `/api/consultation-records/${recordId}`,
};

// 결제/금융 관련 API
export const FINANCIAL_API = {
  GET_ADMIN_TRANSACTIONS: '/api/admin/financial-transactions', // 웹과 동일
  GET_CLIENT_TRANSACTIONS: (clientId) => `/api/financial/transactions/client/${clientId}`,
  GET_CONSULTANT_TRANSACTIONS: (consultantId) => `/api/financial/transactions/consultant/${consultantId}`,
  CREATE_TRANSACTION: '/api/financial/transactions',
  UPDATE_TRANSACTION: (id) => `/api/financial/transactions/${id}`,
  DELETE_TRANSACTION: (id) => `/api/financial/transactions/${id}`,
};

// ERP 관련 API
export const ERP_API = {
  ITEMS: '/api/erp/items',
  PURCHASE_REQUESTS_PENDING_ADMIN: '/api/erp/purchase-requests/pending-admin',
  PURCHASE_ORDERS: '/api/erp/purchase-orders',
  BUDGETS: '/api/erp/budgets',
};

// 푸시 알림 관련 API (모바일 전용)
export const PUSH_API = {
  REGISTER_TOKEN: '/api/mobile/push-token/register',
  UNREGISTER_TOKEN: '/api/mobile/push-token/unregister',
  GET_SETTINGS: '/api/mobile/push-settings',
  UPDATE_SETTINGS: '/api/mobile/push-settings',
};

// 전체 API 엔드포인트 객체
export const API_ENDPOINTS = {
  AUTH: AUTH_API,
  USER: USER_API,
  PROFILE: PROFILE_API,
  DASHBOARD: DASHBOARD_API,
  SCHEDULE: SCHEDULE_API,
  MESSAGE: MESSAGE_API,
  ADMIN: ADMIN_API,
  BRANCH: BRANCH_API,
  RATING: RATING_API,
  CONSULTATION_RECORD: CONSULTATION_RECORD_API,
  FINANCIAL: FINANCIAL_API,
  ERP: ERP_API,
  PUSH: PUSH_API,
};

