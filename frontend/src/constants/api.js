/**
 * API 엔드포인트 상수
 * 백엔드와 프론트엔드 간 일관성 유지
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

import ENV from './environment';

// 기본 API 경로 (백엔드 서버 직접 연결)
export const API_BASE_URL = ENV.API_BASE_URL;

// 인증 관련 API
export const AUTH_API = {
  // 일반 로그인/회원가입
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  GET_CURRENT_USER: '/api/auth/me',
  
  // 소셜 로그인
  KAKAO_OAUTH: '/api/auth/oauth2/kakao',
  NAVER_OAUTH: '/api/auth/oauth2/naver',
  GOOGLE_OAUTH: '/api/auth/oauth2/google',
  FACEBOOK_OAUTH: '/api/auth/oauth2/facebook',
  
  // 소셜 간편 회원가입
  SOCIAL_SIGNUP: '/api/auth/social/signup',
  SOCIAL_STATUS: '/api/auth/social/status',
  SOCIAL_UNLINK: '/api/auth/social/unlink',
  
  // OAuth2 콜백
  OAUTH2_CALLBACK: '/api/auth/oauth2/callback',
  
  // OAuth2 설정
  GET_OAUTH2_CONFIG: '/api/auth/config/oauth2',
  
  // OAuth2 인증 URL 생성
  KAKAO_AUTHORIZE: '/api/auth/oauth2/kakao/authorize',
  NAVER_AUTHORIZE: '/api/auth/oauth2/naver/authorize'
};

// 사용자 관련 API
export const USER_API = {
  // 프로필 관련
  GET_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  DELETE_ACCOUNT: '/api/users/account',
  UPLOAD_PROFILE_IMAGE: '/api/users/profile/image',
  
  // 사용자 정보
  GET_USER_INFO: '/api/users',
  UPDATE_USER_INFO: '/api/users',
  DELETE_USER: '/api/users',
  
  // 최근 활동
  GET_RECENT_ACTIVITIES: '/api/users/recent-activities',
  
  // 소셜 계정 관리
  GET_SOCIAL_ACCOUNTS: '/api/users/social-accounts',
  LINK_SOCIAL_ACCOUNT: '/api/users/social-accounts/link',
  UNLINK_SOCIAL_ACCOUNT: '/api/users/social-accounts/unlink'
};

// 마이페이지 관련 API
export const MYPAGE_API = {
  // 마이페이지 정보 (백엔드 실제 엔드포인트와 일치)
  GET_INFO: '/api/client/profile',
  UPDATE_INFO: '/api/client/profile',
  
  // 비밀번호 관리
  CHANGE_PASSWORD: '/api/client/profile/change-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  
  // 프로필 이미지
  UPLOAD_IMAGE: '/api/client/profile/image',
  
  // 소셜 계정 관리
  GET_SOCIAL_ACCOUNTS: '/api/client/social-accounts',
  MANAGE_SOCIAL_ACCOUNT: '/api/client/social-account'
};

// 역할별 프로필 API
export const PROFILE_API = {
  // 클라이언트용
  CLIENT: {
    GET_INFO: '/api/client/profile',
    UPDATE_INFO: '/api/client/profile',
    CHANGE_PASSWORD: '/api/client/profile/password',
    UPLOAD_IMAGE: '/api/client/profile/image',
    GET_SOCIAL_ACCOUNTS: '/api/client/social-accounts',
    MANAGE_SOCIAL_ACCOUNT: '/api/client/social-account'
  },

  // 상담사용
  CONSULTANT: {
    GET_INFO: (userId) => `/api/user/profile/${userId}`,
    UPDATE_INFO: (userId) => `/api/user/profile/${userId}`,
    CHANGE_PASSWORD: (userId) => `/api/user/profile/${userId}/password`,
    UPLOAD_IMAGE: (userId) => `/api/user/profile/${userId}/image`,
    GET_SOCIAL_ACCOUNTS: (userId) => `/api/user/profile/${userId}/social-accounts`,
    MANAGE_SOCIAL_ACCOUNT: (userId) => `/api/user/profile/${userId}/social-account`
  },

  // 관리자용
  ADMIN: {
    GET_INFO: (userId) => `/api/admin/users/${userId}`,
    UPDATE_INFO: (userId) => `/api/admin/users/${userId}`,
    CHANGE_PASSWORD: (userId) => `/api/admin/users/${userId}/password`,
    UPLOAD_IMAGE: (userId) => `/api/admin/users/${userId}/image`,
    GET_SOCIAL_ACCOUNTS: (userId) => `/api/admin/users/${userId}/social-accounts`,
    MANAGE_SOCIAL_ACCOUNT: (userId) => `/api/admin/users/${userId}/social-account`
  }
};

// 메시지 관련 API
export const MESSAGE_API = {
  // 메시지 전송
  SEND_MESSAGE: '/api/consultation-messages',
  
  // 상담사 메시지 조회
  GET_CONSULTANT_MESSAGES: (consultantId) => `/api/consultation-messages/consultant/${consultantId}`,
  
  // 내담자 메시지 조회
  GET_CLIENT_MESSAGES: (clientId) => `/api/consultation-messages/client/${clientId}`,
  
  // 메시지 읽음 처리
  MARK_AS_READ: (messageId) => `/api/consultation-messages/${messageId}/read`,
  
  // 메시지 상세 조회
  GET_MESSAGE_DETAIL: (messageId) => `/api/consultation-messages/${messageId}`
};

// 상담 관련 API
export const CONSULTATION_API = {
  // 상담 목록
  GET_CONSULTATIONS: '/api/consultations',
  GET_CONSULTATION: '/api/consultations',
  CREATE_CONSULTATION: '/api/consultations',
  UPDATE_CONSULTATION: '/api/consultations',
  DELETE_CONSULTATION: '/api/consultations',
  
  // 상담 예약
  BOOK_CONSULTATION: '/api/consultations/book',
  CANCEL_CONSULTATION: '/api/consultations/cancel',
  RESCHEDULE_CONSULTATION: '/api/consultations/reschedule',
  
  // 상담사 관련
  GET_CONSULTANTS: '/api/consultants',
  GET_CONSULTANT_PROFILE: '/api/consultants/profile',
  GET_CONSULTANT_SCHEDULE: '/api/consultants/schedule',
  
  // 상담 세션
  START_SESSION: '/api/consultations/session/start',
  END_SESSION: '/api/consultations/session/end',
  GET_SESSION_INFO: '/api/consultations/session'
};

// 관리자 관련 API
export const ADMIN_API = {
  // 사용자 관리
  GET_ALL_USERS: '/api/admin/users',
  UPDATE_USER_ROLE: '/api/admin/users/role',
  DEACTIVATE_USER: '/api/admin/users/deactivate',
  
  // 상담사 승인
  GET_CONSULTANT_APPLICATIONS: '/api/admin/consultant-applications',
  APPROVE_CONSULTANT: '/api/admin/consultant-applications/approve',
  REJECT_CONSULTANT: '/api/admin/consultant-applications/reject',
  
  // 시스템 관리
  GET_SYSTEM_STATS: '/api/admin/system/stats',
  GET_SYSTEM_LOGS: '/api/admin/system/logs'
};

// 스케줄 관련 API
export const SCHEDULE_API = {
  // 스케줄 조회
  SCHEDULES: '/api/schedules',
  SCHEDULES_BY_DATE: '/api/schedules/date',
  SCHEDULES_BY_DATE_RANGE: '/api/schedules/date-range',
  SCHEDULES_BY_CONSULTANT: '/api/schedules/consultant',
  SCHEDULES_BY_CLIENT: '/api/schedules/client',
  
  // 스케줄 관리
  SCHEDULE_DETAIL: '/api/schedules',
  SCHEDULE_CREATE: '/api/schedules/consultant',
  SCHEDULE_UPDATE: '/api/schedules',
  SCHEDULE_DELETE: '/api/schedules',
  SCHEDULE_CONFIRM: '/api/schedules',
  SCHEDULE_CANCEL: '/api/schedules',
  SCHEDULE_COMPLETE: '/api/schedules',
  
  // 자동 완료 처리
  AUTO_COMPLETE: '/api/schedules/auto-complete',
  
  // 통계
  STATISTICS: '/api/schedules/admin/statistics',
  TODAY_STATISTICS: '/api/schedules/today/statistics',
  
  // 페이지네이션
  PAGED_SCHEDULES: '/api/schedules/paged',
  
  // 한글 변환
  STATUS_KOREAN: '/api/schedules/status-korean',
  TYPE_KOREAN: '/api/schedules/type-korean',
  CONSULTATION_TYPE_KOREAN: '/api/schedules/consultation-type-korean'
};

// 대시보드 관련 API
export const DASHBOARD_API = {
  // 내담자 대시보드
  CLIENT_SCHEDULES: '/api/schedules',
  CLIENT_CONSULTANT_INFO: '/api/admin/mappings/client',
  
  // 상담사 대시보드
  CONSULTANT_SCHEDULES: '/api/schedules',
  CONSULTANT_STATS: '/api/schedules/today/statistics',
  
  // 관리자 대시보드
  ADMIN_STATS: '/api/schedules/admin/statistics',
  ADMIN_SYSTEM_INFO: '/api/admin/system/stats',
  
  // 세션 정보
  SESSION_INFO: '/api/auth/session-info'
};

// 파일 업로드 관련 API
export const FILE_API = {
  UPLOAD_IMAGE: '/api/files/upload/image',
  UPLOAD_DOCUMENT: '/api/files/upload/document',
  DELETE_FILE: '/api/files/delete',
  GET_FILE_INFO: '/api/files/info'
};

// 알림 관련 API
export const NOTIFICATION_API = {
  GET_NOTIFICATIONS: '/api/notifications',
  MARK_AS_READ: '/api/notifications/read',
  DELETE_NOTIFICATION: '/api/notifications/delete',
  UPDATE_PREFERENCES: '/api/notifications/preferences'
};

// 검색 관련 API
export const SEARCH_API = {
  SEARCH_CONSULTANTS: '/api/search/consultants',
  SEARCH_CONSULTATIONS: '/api/search/consultations',
  SEARCH_USERS: '/api/search/users'
};

// 전체 API 엔드포인트 객체
export const API_ENDPOINTS = {
  AUTH: AUTH_API,
  USER: USER_API,
  CONSULTATION: CONSULTATION_API,
  ADMIN: ADMIN_API,
  SCHEDULE: SCHEDULE_API,
  DASHBOARD: DASHBOARD_API,
  FILE: FILE_API,
  NOTIFICATION: NOTIFICATION_API,
  SEARCH: SEARCH_API
};

// API 응답 상태 코드
export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// API 에러 메시지
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  DUPLICATE_EMAIL: '이미 사용 중인 이메일입니다.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.'
};

export default API_ENDPOINTS;
