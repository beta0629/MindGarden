/**
 * API 엔드포인트 상수
/**
 * 백엔드와 프론트엔드 간 일관성 유지
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */

import ENV from './environment';

// 기본 API 경로 (런타임에 동적 생성)
// getter를 사용하여 런타임에 window.location을 확인
export const getApiBaseUrl = () => ENV.API_BASE_URL;
export const { API_BASE_URL } = ENV; // 하위 호환성을 위해 유지 (getter로 동작)

// 인증 관련 API (표준 경로: /api/v1/auth)
export const AUTH_API = {
  // 일반 로그인/회원가입
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH_TOKEN: '/api/v1/auth/refresh',
  GET_CURRENT_USER: '/api/v1/auth/current-user',

  /**
   * 일반 로그인(전화 + 비밀번호) 다중 매치 시 계정 선택 완료 — P1 silent first 차단(2026-06-11).
   *
   * <p>BE `AuthController#selectAccount`. {@code POST /api/v1/auth/login} 응답이
   * {@code multipleAccounts: true} 일 때, 응답으로 받은 5분 TTL {@code selectionToken} 과 사용자가
   * 선택한 {@code selectedUserId} 를 함께 전송한다. 1회 사용 정책.</p>
   */
  SELECT_ACCOUNT: '/api/v1/auth/select-account',
  
  // 소셜 로그인
  KAKAO_OAUTH: '/api/v1/auth/oauth2/kakao',
  NAVER_OAUTH: '/api/v1/auth/oauth2/naver',
  GOOGLE_OAUTH: '/api/v1/auth/oauth2/google',
  FACEBOOK_OAUTH: '/api/v1/auth/oauth2/facebook',

  /**
   * 네이티브 SDK 소셜 로그인 (`OAuth2Controller#socialLoginWithAccessToken`).
   *
   * <p>BE 가 `accessToken` (필수, 단 GOOGLE 만 `idToken` 폴백 허용) 으로 OAuth provider
   * userinfo 를 직접 조회·검증한 뒤 JWT 를 발급한다. 모바일 앱(expo-app) 에서 사용하던
   * 엔드포인트를 웹의 `@react-oauth/google` 흐름에서도 재사용한다.</p>
   */
  SOCIAL_LOGIN: '/api/v1/auth/social-login',
  
  // 소셜 간편 회원가입
  SOCIAL_SIGNUP: '/api/v1/auth/social/signup',
  SOCIAL_STATUS: '/api/v1/auth/social/status',
  SOCIAL_UNLINK: '/api/v1/auth/social/unlink',
  
  // OAuth2 콜백
  OAUTH2_CALLBACK: '/api/v1/auth/oauth2/callback',
  
  // OAuth2 설정
  GET_OAUTH2_CONFIG: '/api/v1/auth/config/oauth2',
  
  // OAuth2 인증 URL 생성
  KAKAO_AUTHORIZE: '/api/v1/auth/oauth2/kakao/authorize',
  NAVER_AUTHORIZE: '/api/v1/auth/oauth2/naver/authorize',
  /**
   * Google OAuth2 server-side auth-code 흐름 — `OAuth2Controller#googleAuthorize`.
   * BE 가 apex 콜백(`/api/v1/auth/google/callback`) 과 state(base64url(tenantId)+nonce) 를
   * 포함한 authorize URL 을 반환한다. 카카오/네이버와 동일 패턴(2026-06-10 A-2 마이그레이션).
   */
  GOOGLE_AUTHORIZE: '/api/v1/auth/oauth2/google/authorize',

  /**
   * Apple Sign in with Apple (SIWA) server-side auth-code 흐름 — `OAuth2Controller#appleAuthorize`.
   * BE 가 apex 콜백(`/api/v1/auth/apple/callback`) 과 state(base64url(tenantId)+nonce) 를
   * 포함한 authorize URL 을 반환한다. Google PR #204 패턴 100% 정합 (2026-06-11).
   *
   * <p>멀티테넌트 와일드카드(`*.core-solution.co.kr`) 환경에서 Apple JS SDK
   * `usePopup=true` 가 강제하는 `response_mode=web_message` 가 popup parent origin 과
   * redirect_uri origin 동일성 강제로 거절(빨간 배너)되어, 카카오/네이버/구글과 동일한
   * server-side 흐름으로 통합한다.</p>
   */
  APPLE_AUTHORIZE: '/api/v1/auth/oauth2/apple/authorize',
  
  // 중복 로그인 확인
  CONFIRM_DUPLICATE_LOGIN: '/api/v1/auth/confirm-duplicate-login',

  /** 회원가입·프로필 등 휴대폰 중복 조회 (쿼리: phone) */
  DUPLICATE_CHECK_PHONE: '/api/v1/auth/duplicate-check/phone',
  /** 회원가입 등 이메일 중복 조회 (쿼리: email) */
  DUPLICATE_CHECK_EMAIL: '/api/v1/auth/duplicate-check/email',

  /** PasswordManagementController — 세션 사용자 비밀번호 변경 */
  PASSWORD_CHANGE: '/api/v1/auth/password/change',
  /** PasswordManagementController — 재설정 이메일 요청 */
  PASSWORD_RESET_REQUEST: '/api/v1/auth/password/reset/request',

  /**
   * provider-agnostic OAuth 휴대폰 매칭(OTP) — Phase 3A `OAuthPhoneController`.
   * 본인 인증용 OTP 발송 (oauthProvider + phoneVerificationToken + phone).
   */
  OAUTH_PHONE_SEND: '/api/v1/auth/oauth/phone/send',
  /**
   * provider-agnostic OAuth 휴대폰 매칭(OTP) — OTP 검증 + 매칭/로그인.
   * (oauthProvider + phoneVerificationToken + challengeToken + otpCode).
   */
  OAUTH_PHONE_VERIFY: '/api/v1/auth/oauth/phone/verify',

  /**
   * 휴대폰 SMS 인증 코드 전송 — AuthController#sendSmsCode (5분 TTL · 단일 사용 OTP).
   * 마이페이지 휴대전화 변경(Phase A) 흐름에서 본 엔드포인트로 OTP 를 발송한 뒤
   * {@code MYPAGE_API.CHANGE_PHONE} 에 동일 번호+코드로 검증·교체 요청을 보낸다.
   */
  SMS_SEND: '/api/v1/auth/sms/send',
  /** 휴대폰 SMS 인증 코드 검증 — AuthController#verifySmsCode (일반 로그인·테블릿 흐름에서 사용). */
  SMS_VERIFY: '/api/v1/auth/sms/verify'
};

// 권한 관련 API (표준 경로: /api/v1/permissions)
export const PERMISSIONS_API = {
  MY_PERMISSIONS: '/api/v1/permissions/my-permissions',
  MY_GROUPS: '/api/v1/permissions/groups/my',
  CHECK_PERMISSION: '/api/v1/permissions/check-permission',
  ROLE_PERMISSIONS: '/api/v1/permissions/role',
  PERMISSION_ROLES: '/api/v1/permissions/permission',
  ALL_PERMISSION_CODES: '/api/v1/permissions/codes'
};

// 사용자 관련 API (표준 경로: /api/v1/users)
export const USER_API = {
  // 프로필 관련
  GET_PROFILE: '/api/v1/users/profile',
  UPDATE_PROFILE: '/api/v1/users/profile',
  DELETE_ACCOUNT: '/api/v1/users/account',
  UPLOAD_PROFILE_IMAGE: '/api/v1/users/profile/image',
  
  // 사용자 정보
  GET_USER_INFO: '/api/v1/users',
  UPDATE_USER_INFO: '/api/v1/users',
  DELETE_USER: '/api/v1/users',
  
  // 최근 활동
  GET_RECENT_ACTIVITIES: '/api/v1/users/recent-activities',
  
  // 소셜 계정 관리
  GET_SOCIAL_ACCOUNTS: '/api/v1/users/social-accounts',
  LINK_SOCIAL_ACCOUNT: '/api/v1/users/social-accounts/link',
  UNLINK_SOCIAL_ACCOUNT: '/api/v1/users/social-accounts/unlink'
};

// 마이페이지 관련 API (표준화 2025-12-05: /api/v1/ 경로 적용)
export const MYPAGE_API = {
  // 마이페이지 정보 (백엔드 실제 엔드포인트와 일치)
  GET_INFO: '/api/v1/clients/profile',
  UPDATE_INFO: '/api/v1/clients/profile',
  
  // 비밀번호 관리 (PasswordManagementController — AUTH_API와 동일 경로)
  CHANGE_PASSWORD: '/api/v1/auth/password/change',
  RESET_PASSWORD: '/api/v1/auth/password/reset/request',
  
  // 프로필 이미지
  UPLOAD_IMAGE: '/api/v1/clients/profile/image',
  
  // 소셜 계정 (ClientProfileController 하위 조회 / ClientSocialAccountController 연동 해제)
  GET_SOCIAL_ACCOUNTS: '/api/v1/clients/profile/social-accounts',
  MANAGE_SOCIAL_ACCOUNT: '/api/v1/clients/social-accounts/social-account',

  // 자발 회원 탈퇴 — USER_LIFECYCLE_TERMINATION_POLICY §2.3 자발 경로
  WITHDRAWAL_REQUEST: '/api/v1/mypage/withdrawal/request',
  WITHDRAWAL_CANCEL: '/api/v1/mypage/withdrawal/cancel',
  WITHDRAWAL_STATUS: '/api/v1/mypage/withdrawal/status',

  /**
   * 휴대전화 변경(Phase A) — SMS OTP 검증 + tenant 내 unique + AuditLog 적재.
   * 본 엔드포인트 호출 전 {@code AUTH_API.SMS_SEND} 로 새 번호에 OTP 를 발송해 둔다.
   * 본문: {@code { newPhoneNumber, verificationCode }}.
   */
  CHANGE_PHONE: '/api/v1/clients/profile/phone/change'
};

// 역할별 프로필 API (표준화 2025-12-05: /api/v1/ 경로 적용)
export const PROFILE_API = {
  // 클라이언트용
  CLIENT: {
    GET_INFO: '/api/v1/clients/profile',
    UPDATE_INFO: '/api/v1/clients/profile',
    CHANGE_PASSWORD: '/api/v1/auth/password/change',
    UPLOAD_IMAGE: '/api/v1/clients/profile/image',
    GET_SOCIAL_ACCOUNTS: '/api/v1/clients/profile/social-accounts',
    MANAGE_SOCIAL_ACCOUNT: '/api/v1/clients/social-accounts/social-account'
  },

  // 상담사용 (표준화 2025-12-05: /api/v1/ 경로 적용)
  CONSULTANT: {
    GET_INFO: (userId) => `/api/v1/users/profile/${userId}`,
    UPDATE_INFO: (userId) => `/api/v1/users/profile/${userId}`,
    CHANGE_PASSWORD: '/api/v1/auth/password/change',
    UPLOAD_IMAGE: (userId) => `/api/v1/clients/profile/image`,
    GET_SOCIAL_ACCOUNTS: '/api/v1/clients/profile/social-accounts',
    MANAGE_SOCIAL_ACCOUNT: '/api/v1/clients/social-accounts/social-account'
  },

  // 관리자·스태프·레거시 최고관리자 등: 세션 기반 ClientProfile + 동일 소셜 경로
  ADMIN: {
    GET_INFO: () => '/api/v1/clients/profile',
    UPDATE_INFO: () => '/api/v1/clients/profile',
    CHANGE_PASSWORD: '/api/v1/auth/password/change',
    UPLOAD_IMAGE: () => '/api/v1/clients/profile/image',
    GET_SOCIAL_ACCOUNTS: '/api/v1/clients/profile/social-accounts',
    MANAGE_SOCIAL_ACCOUNT: '/api/v1/clients/social-accounts/social-account'
  }
};

// 메시지 관련 API (표준 경로: /api/v1/consultation-messages)
export const MESSAGE_API = {
  // 메시지 전송
  SEND_MESSAGE: '/api/v1/consultation-messages',
  
  // 상담사 메시지 조회
  GET_CONSULTANT_MESSAGES: (consultantId) => `/api/v1/consultation-messages/consultant/${consultantId}`,
  
  // 내담자 메시지 조회
  GET_CLIENT_MESSAGES: (clientId) => `/api/v1/consultation-messages/client/${clientId}`,
  
  // 메시지 읽음 처리
  MARK_AS_READ: (messageId) => `/api/v1/consultation-messages/${messageId}/read`,
  
  // 메시지 상세 조회
  GET_MESSAGE_DETAIL: (messageId) => `/api/v1/consultation-messages/${messageId}`
};

// 상담 관련 API (표준화 2025-12-05: /api/v1/ 경로 적용)
export const CONSULTATION_API = {
  // 상담 목록
  GET_CONSULTATIONS: '/api/v1/consultations',
  GET_CONSULTATION: '/api/v1/consultations',
  CREATE_CONSULTATION: '/api/v1/consultations',
  UPDATE_CONSULTATION: '/api/v1/consultations',
  DELETE_CONSULTATION: '/api/v1/consultations',
  
  // 상담 예약
  BOOK_CONSULTATION: '/api/v1/consultations/book',
  CANCEL_CONSULTATION: '/api/v1/consultations/cancel',
  RESCHEDULE_CONSULTATION: '/api/v1/consultations/reschedule',
  
  // 상담사 관련
  GET_CONSULTANTS: '/api/v1/consultants',
  GET_CONSULTANT_PROFILE: '/api/v1/consultants/profile',
  GET_CONSULTANT_SCHEDULE: '/api/v1/consultants/schedule',
  /**
   * 본인 급여 정산(관리자 산출) 목록.
   * 백엔드 경로는 배치에 따라 조정 가능 — 프론트는 이 상수만 교체하면 된다.
   */
  GET_MY_SALARY_CALCULATIONS: '/api/v1/consultants/me/salary-calculations',

  /**
   * 본인 완료 회기 통계(일·주·월 버킷).
   * 쿼리: startDate, endDate(YYYY-MM-DD), granularity=DAY|WEEK|MONTH
   */
  GET_MY_SESSION_STATISTICS: '/api/v1/consultants/me/session-statistics',
  
  // 상담 세션
  START_SESSION: '/api/v1/consultations/session/start',
  END_SESSION: '/api/v1/consultations/session/end',
  GET_SESSION_INFO: '/api/v1/consultations/session'
};

/**
 * 마음 날씨 API (Expo MIND_WEATHER_API 정합).
 * 상담사 수신함: GET /api/v1/mind-weather/inbox
 */
export const MIND_WEATHER_API = {
  INBOX: '/api/v1/mind-weather/inbox'
};

// 관리자 관련 API (표준 경로: /api/v1/admin)
export const ADMIN_API = {
  // 사용자 관리
  GET_ALL_USERS: '/api/v1/admin/users',
  UPDATE_ROLE: '/api/v1/admin/users/role',
  DEACTIVATE_USER: '/api/v1/admin/users/deactivate',
  
  // 상담사 승인
  GET_CONSULTANT_APPLICATIONS: '/api/v1/admin/consultant-applications',
  APPROVE_CONSULTANT: '/api/v1/admin/consultant-applications/approve',
  REJECT_CONSULTANT: '/api/v1/admin/consultant-applications/reject',
  
  // 시스템 관리
  GET_SYSTEM_STATS: '/api/v1/admin/system/stats',
  GET_SYSTEM_LOGS: '/api/v1/admin/system/logs',

  /** 테넌트 카카오 알림톡 비시크릿 설정 (GET/PUT 동일 경로) */
  KAKAO_ALIMTALK_SETTINGS: '/api/v1/admin/kakao-alimtalk-settings',

  /** 테넌트 SMS 비시크릿 설정 (GET/PUT 동일 경로) */
  TENANT_SMS_SETTINGS: '/api/v1/admin/tenant-sms-settings',

  /** 온라인 카탈로그 SKU (GET/POST, GET/PUT/PATCH `/{id}`) */
  SHOP_CATALOG_SKUS: '/api/v1/admin/shop/catalog-skus',

  /** 포인트·리워드 정책 MVP (GET/PATCH) */
  SHOP_POINT_POLICIES: '/api/v1/admin/shop/point-policies',

  /** 온라인 주문 목록·상세·환불 (GET/POST) */
  SHOP_ORDERS: '/api/v1/admin/shop/orders'
};

/** 페이지·훅에서 `API.KAKAO_ALIMTALK_SETTINGS` 형태로 참조 (ADMIN_API와 동일 경로) */
export const API = {
  KAKAO_ALIMTALK_SETTINGS: ADMIN_API.KAKAO_ALIMTALK_SETTINGS,
  TENANT_SMS_SETTINGS: ADMIN_API.TENANT_SMS_SETTINGS,
  SHOP_CATALOG_SKUS: ADMIN_API.SHOP_CATALOG_SKUS,
  SHOP_POINT_POLICIES: ADMIN_API.SHOP_POINT_POLICIES,
  SHOP_ORDERS: ADMIN_API.SHOP_ORDERS
};

// 스케줄 관련 API (중앙화) (표준화 2025-12-05: /api/v1/ 경로 적용)
export const SCHEDULE_API = {
  // 기본 스케줄 조회
  SCHEDULES: '/api/v1/schedules',
  SCHEDULES_BY_DATE: '/api/v1/schedules/date',
  SCHEDULES_BY_DATE_RANGE: '/api/v1/schedules/date-range',
  SCHEDULES_BY_CONSULTANT: '/api/v1/schedules/consultant',
  SCHEDULES_BY_CLIENT: '/api/v1/schedules/client',
  
  // 관리자용 스케줄 조회 (통합)
  ADMIN_SCHEDULES: '/api/v1/schedules/admin',
  
  // 스케줄 관리
  SCHEDULE_DETAIL: '/api/v1/schedules',
  SCHEDULE_CREATE: '/api/v1/schedules/consultant',
  SCHEDULE_UPDATE: '/api/v1/schedules',
  SCHEDULE_DELETE: '/api/v1/schedules',
  SCHEDULE_CONFIRM: '/api/v1/schedules',
  SCHEDULE_CANCEL: '/api/v1/schedules',
  SCHEDULE_COMPLETE: '/api/v1/schedules',
  
  // 자동 완료 처리 (통합)
  AUTO_COMPLETE: '/api/v1/schedules/auto-complete',
  
  // 통계
  STATISTICS: '/api/v1/admin/schedules/statistics',
  TODAY_STATISTICS: '/api/v1/admin/schedules/today/statistics',
  
  // 페이지네이션
  PAGED_SCHEDULES: '/api/v1/schedules/paged',
  
  // 한글 변환
  STATUS_KOREAN: '/api/v1/schedules/status-korean',
  TYPE_KOREAN: '/api/v1/schedules/type-korean',
  CONSULTATION_TYPE_KOREAN: '/api/v1/schedules/consultation-type-korean'
};

// 대시보드 관련 API (표준화 2025-12-05: /api/v1/ 경로 적용)
export const DASHBOARD_API = {
  // 내담자 대시보드
  CLIENT_SCHEDULES: '/api/v1/schedules',
  CLIENT_CONSULTANT_INFO: '/api/v1/admin/mappings/client',
  
  // 상담사 대시보드
  CONSULTANT_SCHEDULES: '/api/v1/schedules',
  CONSULTANT_STATS: '/api/v1/schedules/today/statistics',
  CONSULTANT_UPCOMING_SCHEDULES: '/api/v1/schedules/upcoming',
  CONSULTANT_INCOMPLETE_RECORDS: (consultantId) => `/api/v1/schedules/consultants/${consultantId}/incomplete-records`,
  CONSULTANT_HIGH_PRIORITY_CLIENTS: (consultantId) => `/api/v1/schedules/consultants/${consultantId}/high-priority-clients`,
  CONSULTANT_UPCOMING_PREPARATION: (consultantId) => `/api/v1/schedules/consultants/${consultantId}/upcoming-preparation`,
  
  // 관리자 대시보드
  ADMIN_STATS: '/api/v1/schedules/admin/statistics',
  ADMIN_SYSTEM_INFO: '/api/v1/admin/system/stats',
  
  // 세션 정보
  SESSION_INFO: '/api/v1/auth/session-info'
};

// 파일 업로드 관련 API (표준화 2025-12-05: /api/v1/ 경로 적용)
export const FILE_API = {
  UPLOAD_IMAGE: '/api/v1/files/upload/image',
  UPLOAD_DOCUMENT: '/api/v1/files/upload/document',
  DELETE_FILE: '/api/v1/files/delete',
  GET_FILE_INFO: '/api/v1/files/info'
};

// 알림 관련 API (표준화 2025-12-05: /api/v1/ 경로 적용)
export const NOTIFICATION_API = {
  GET_NOTIFICATIONS: '/api/v1/notifications',
  MARK_AS_READ: '/api/v1/notifications/read',
  DELETE_NOTIFICATION: '/api/v1/notifications/delete',
  UPDATE_PREFERENCES: '/api/v1/notifications/preferences'
};

// 검색 관련 API (표준화 2025-12-05: /api/v1/ 경로 적용)
export const SEARCH_API = {
  SEARCH_CONSULTANTS: '/api/v1/search/consultants',
  SEARCH_CONSULTATIONS: '/api/v1/search/consultations',
  SEARCH_USERS: '/api/v1/search/users'
};

// ERP 및 재무 관련 API (표준 경로: /api/v1/erp)
export const ERP_API = {
  // ERP 고도화 API (표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md)
  // 분개 관리
  JOURNAL_ENTRIES: '/api/v1/erp/accounting/entries',
  ACCOUNT_TYPES: '/api/v1/erp/accounting/account-types',
  JOURNAL_ENTRY_DETAIL: (id) => `/api/v1/erp/accounting/entries/${id}`,
  JOURNAL_ENTRY_UPDATE: (id) => `/api/v1/erp/accounting/entries/${id}`,
  JOURNAL_ENTRY_APPROVE: (id) => `/api/v1/erp/accounting/entries/${id}/approve`,
  JOURNAL_ENTRY_POST: (id) => `/api/v1/erp/accounting/entries/${id}/post`,
  
  // 원장 조회
  LEDGERS_ACCOUNT: (accountId) => `/api/v1/erp/accounting/ledgers/account/${accountId}`,
  LEDGERS_PERIOD: '/api/v1/erp/accounting/ledgers/period',
  LEDGERS_BALANCE: (accountId) => `/api/v1/erp/accounting/ledgers/balance/${accountId}`,
  
  // 재무제표
  FINANCIAL_STATEMENT_INCOME: '/api/v1/erp/accounting/statements/income',
  FINANCIAL_STATEMENT_BALANCE: '/api/v1/erp/accounting/statements/balance',
  FINANCIAL_STATEMENT_CASHFLOW: '/api/v1/erp/accounting/statements/cash-flow',
  
  // 정산 관리
  SETTLEMENT_RULES: '/api/v1/erp/settlement/rules',
  SETTLEMENT_CALCULATE: '/api/v1/erp/settlement/calculate',
  SETTLEMENT_RESULTS: '/api/v1/erp/settlement/results',
  SETTLEMENT_APPROVE: (id) => `/api/v1/erp/settlement/results/${id}/approve`,
  
  // 기존 ERP API
  // 통합 재무 대시보드
  FINANCE_DASHBOARD: '/api/v1/erp/finance/dashboard',
  FINANCE_BALANCE_SHEET: '/api/v1/erp/finance/balance-sheet',
  FINANCE_INCOME_STATEMENT: '/api/v1/erp/finance/income-statement',
  FINANCE_DAILY_REPORT: '/api/v1/erp/finance/daily-report',
  FINANCE_MONTHLY_REPORT: '/api/v1/erp/finance/monthly-report',
  /** 연도별 1~12월 부가세·원천·지출 세액 필드 집계 */
  FINANCE_TAX_MONTHLY_SERIES: '/api/v1/erp/finance/tax-monthly-series',
  FINANCE_YEARLY_REPORT: '/api/v1/erp/finance/yearly-report',

  /** 재무 거래 (수입/지출 직접 등록·조회·수정·삭제 — ErpController) */
  FINANCE_TRANSACTIONS: '/api/v1/erp/finance/transactions',
  FINANCE_TRANSACTION_BY_ID: (id) => `/api/v1/erp/finance/transactions/${id}`,

  /** 예산 관리 (CRUD — 프론트 표준 경로, 백엔드와 동일 유지) */
  BUDGETS: '/api/v1/erp/budgets',
  BUDGET_BY_ID: (id) => `/api/v1/erp/budgets/${id}`,

  /** 비품·조달 (품목 / 구매 요청 / 주문 — ErpController) */
  ITEMS: '/api/v1/erp/items',
  ITEM_BY_ID: (id) => `/api/v1/erp/items/${id}`,
  PURCHASE_REQUESTS: '/api/v1/erp/purchase-requests',
  PURCHASE_ORDERS: '/api/v1/erp/purchase-orders',

  /** 구매 요청 승인 허브 (ErpController — pending GET, approve/reject POST는 쿼리스트링 파라미터) */
  PURCHASE_REQUESTS_PENDING_ADMIN: '/api/v1/erp/purchase-requests/pending-admin',
  PURCHASE_REQUESTS_PENDING_SUPER_ADMIN: '/api/v1/erp/purchase-requests/pending-super-admin',
  PURCHASE_REQUEST_APPROVE_ADMIN: (id) => `/api/v1/erp/purchase-requests/${id}/approve-admin`,
  PURCHASE_REQUEST_REJECT_ADMIN: (id) => `/api/v1/erp/purchase-requests/${id}/reject-admin`,
  PURCHASE_REQUEST_APPROVE_SUPER_ADMIN: (id) => `/api/v1/erp/purchase-requests/${id}/approve-super-admin`,
  PURCHASE_REQUEST_REJECT_SUPER_ADMIN: (id) => `/api/v1/erp/purchase-requests/${id}/reject-super-admin`,

  /** 운영 리포트 Excel 다운로드 (바이너리 응답 — StandardizedApi 외 fetch + 테넌트 헤더) */
  REPORTS_DOWNLOAD: '/api/v1/erp/reports/download'
};

// 온보딩 관련 API
export const ONBOARDING_API = {
  CREATE_REQUEST: '/api/v1/onboarding/requests',
  GET_REQUEST: '/api/v1/onboarding/requests',
  GET_REQUEST_BY_ID: '/api/v1/onboarding/requests',
  GET_PENDING_REQUESTS: '/api/v1/onboarding/requests/pending',
  GET_REQUEST_COUNT: '/api/v1/onboarding/requests/count',
  DECISION: '/api/v1/onboarding/requests',
  RETRY: '/api/v1/onboarding/requests'
};

// 업종 카테고리 관련 API (표준화 2025-12-05: /api/v1/ 경로 적용)
export const BUSINESS_CATEGORY_API = {
  ROOT: '/api/v1/business-categories/root',
  ALL: '/api/v1/business-categories',
  ITEMS: '/api/v1/business-categories/items',
  ITEM_BY_BUSINESS_TYPE: '/api/v1/business-categories/items/by-business-type',
  VALIDATE: '/api/v1/business-categories/validate',
  TREE: '/api/v1/business-categories/tree'
};

// 공통 코드 관련 API (표준 경로: /api/v1/common-codes)
export const COMMON_CODE_API = {
  BASE: '/api/v1/common-codes',
  BY_GROUP: '/api/v1/common-codes',
  GROUPS: '/api/v1/common-codes/groups',
  GROUP_ACTIVE: '/api/v1/common-codes/group',
  CORE_GROUPS: '/api/v1/common-codes/core/groups',
  TENANT_GROUPS: '/api/v1/common-codes/tenant/groups'
};

// 평가(Rating) 관련 API (표준 경로: /api/v1/ratings)
export const RATING_API = {
  CREATE: '/api/v1/ratings/create',
  CONSULTANT_STATS: (consultantId) => `/api/v1/ratings/consultant/${consultantId}/stats`,
  CONSULTANT_RATINGS: (consultantId) => `/api/v1/ratings/consultant/${consultantId}`,
  CLIENT_RATABLE: (clientId) => `/api/v1/ratings/client/${clientId}/ratable-schedules`,
  POPULAR_TAGS: (consultantId) => `/api/v1/ratings/consultant/${consultantId}/popular-tags`,
  RANKING: '/api/v1/ratings/ranking',
  ADMIN_STATS: '/api/v1/ratings/admin/statistics'
};

// 전체 API 엔드포인트 객체
export const API_ENDPOINTS = {
  AUTH: AUTH_API,
  USER: USER_API,
  PERMISSIONS: PERMISSIONS_API,
  CONSULTATION: CONSULTATION_API,
  ADMIN: ADMIN_API,
  SCHEDULE: SCHEDULE_API,
  DASHBOARD: DASHBOARD_API,
  FILE: FILE_API,
  NOTIFICATION: NOTIFICATION_API,
  SEARCH: SEARCH_API,
  ERP: ERP_API,
  ONBOARDING: ONBOARDING_API,
  BUSINESS_CATEGORY: BUSINESS_CATEGORY_API,
  COMMON_CODE: COMMON_CODE_API,
  RATING: RATING_API
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
  SESSION_VERIFY_NETWORK_TRANSIENT: '연결이 잠시 불안정합니다. 로그인 상태는 유지됩니다. 잠시 후 다시 시도해주세요.',
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
