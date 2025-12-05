 * SessionManagement 컴포넌트 상수 정의
 * 개발 가이드 - 상수화 필수 원칙 준수
 */

export const API_ENDPOINTS = {
  MAPPINGS: '/api/admin/mappings',
  CLIENTS: '/api/admin/clients/with-mapping-info',
  CONFIRM_PAYMENT: '/api/admin/mappings/{id}/confirm-payment',
  EXTEND_SESSIONS: '/api/admin/mappings/{id}/extend-sessions',
  ERP_FINANCIAL: '/api/erp/financial/update-receivable',
  PACKAGE_CODES: '/api/common-codes/PACKAGE'
};

export const PAYMENT_STATUS = {
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  PENDING: 'PENDING',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  COMPLETED: 'COMPLETED',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  ACTIVE: 'ACTIVE'
};

export const MAPPING_STATUS = {
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  PENDING: 'PENDING',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  ACTIVE: 'ACTIVE',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  INACTIVE: 'INACTIVE'
};

export const FILTER_TYPES = {
  ALL: 'all',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  ACTIVE: 'active',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  INACTIVE: 'inactive',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  PENDING: 'pending'
};

export const UI_TEXT = {
  TITLE: '세션 관리',
  SUBTITLE: '상담사와 내담자의 세션 매핑을 관리합니다',
  CONSULTANT_LIST: '상담사 목록',
  CLIENT_LIST: '내담자 목록',
  MAPPING_LIST: '최근 매핑 목록',
  ADD_SESSION: '회기 추가',
  CONFIRM_PAYMENT: '입금확인',
  COMPLETE: '완료',
  FILTER_ALL: '전체',
  FILTER_ACTIVE: '활성',
  FILTER_INACTIVE: '비활성',
  FILTER_PENDING: '대기',
  NO_DATA: '데이터가 없습니다',
  LOADING: '로딩 중...',
  SELECT_CONSULTANT: '상담사를 선택해주세요',
  SELECT_CLIENT: '내담자를 선택해주세요'
};

export const STATUS_DISPLAY = {
  PAYMENT_PENDING: '결제대기',
  PAYMENT_COMPLETED: '입금확인',
  PAYMENT_ACTIVE: '완료',
  MAPPING_ACTIVE: '활성',
  MAPPING_PENDING: '대기',
  MAPPING_INACTIVE: '비활성'
};

export const STATUS_DESCRIPTION = {
  RESERVATION_PENDING: '(예약가능, 입금대기)',
  PAYMENT_CONFIRMED: '(입금확인완료)',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  COMPLETED: '(완료)'
};

export const BUTTON_TEXT = {
  DEPOSIT_CONFIRM: '💳 입금확인',
  COMPLETE: '🎉 완료',
  ADD_SESSION: '➕ 회기 추가',
  APPROVE: '✅ 승인',
  PAYMENT: '💳 결제'
};

export const CSS_CLASSES = {
  CONTAINER: 'session-management-container',
  HEADER: 'session-management-header',
  CONTENT: 'session-management-content',
  
  LAYOUT: 'session-management-layout',
  SIDEBAR: 'session-management-sidebar',
  MAIN_PANEL: 'session-management-main-panel',
  
  LIST_CONTAINER: 'session-management-list-container',
  LIST_ITEM: 'session-management-list-item',
  LIST_HEADER: 'session-management-list-header',
  LIST_CONTENT: 'session-management-list-content',
  
  MAPPING_CARD: 'session-management-mapping-card',
  CARD_HEADER: 'session-management-card-header',
  CARD_CONTENT: 'session-management-card-content',
  CARD_FOOTER: 'session-management-card-footer',
  
  ACTION_BUTTON: 'session-management-action-button',
  FILTER_BUTTON: 'session-management-filter-button',
  PRIMARY_BUTTON: 'session-management-primary-button',
  
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  ACTIVE: 'session-management-active',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  INACTIVE: 'session-management-inactive',
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  PENDING: 'session-management-pending',
  
  MOBILE_LAYOUT: 'session-management-mobile-layout',
  DESKTOP_LAYOUT: 'session-management-desktop-layout'
};

export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1200px'
};

export const ANIMATIONS = {
  FADE_IN: 'fadeIn',
  SLIDE_IN: 'slideIn',
  BOUNCE_IN: 'bounceIn',
  FADE_IN_UP: 'fadeInUp',
  SLIDE_IN_DOWN: 'slideInDown'
};

export const COLORS = {
  PRIMARY: 'var(--ios-blue)',
  SUCCESS: 'var(--ios-green)',
  WARNING: 'var(--ios-orange)',
  DANGER: 'var(--ios-red)',
  SECONDARY: 'var(--ios-gray)',
  TEXT_PRIMARY: 'var(--ios-text-primary)',
  TEXT_SECONDARY: 'var(--ios-text-secondary)',
  BG_PRIMARY: 'var(--ios-bg-primary)',
  BG_SECONDARY: 'var(--ios-bg-secondary)'
};

export const SPACING = {
  XS: 'var(--spacing-xs)',
  SM: 'var(--spacing-sm)',
  MD: 'var(--spacing-md)',
  LG: 'var(--spacing-lg)',
  XL: 'var(--spacing-xl)',
  XXL: 'var(--spacing-xxl)'
};

export const FONT_SIZES = {
  XS: 'var(--font-size-xs)',
  SM: 'var(--font-size-sm)',
  BASE: 'var(--font-size-base)',
  LG: 'var(--font-size-lg)',
  XL: 'var(--font-size-xl)',
  XXL: 'var(--font-size-xxl)',
  XXXL: 'var(--font-size-xxxl)'
};

export const Z_INDEX = {
  BASE: 'var(--z-base)',
  DROPDOWN: 'var(--z-dropdown)',
  MODAL: 'var(--z-modal)',
  TOAST: 'var(--z-toast)'
};

export const MODAL_TYPES = {
  ADD_SESSION: 'addSession',
  CONFIRM_PAYMENT: 'confirmPayment',
  APPROVE: 'approve'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  MAPPING_NOT_FOUND: '해당 내담자와 상담사의 매핑을 찾을 수 없습니다.',
  PAYMENT_FAILED: '결제 처리에 실패했습니다.',
  SESSION_ADD_FAILED: '회기 추가에 실패했습니다.',
  LOAD_DATA_FAILED: '데이터 로딩에 실패했습니다.'
};

export const SUCCESS_MESSAGES = {
  PAYMENT_CONFIRMED: '결제가 완료되었습니다.',
  SESSION_ADDED: '회기가 추가되었습니다.',
  STATUS_UPDATED: '상태가 변경되었습니다.',
  DATA_LOADED: '데이터가 업데이트되었습니다.'
};

export const DEFAULTS = {
  ITEMS_PER_PAGE: 10,
  MAX_RECENT_MAPPINGS: 6,
  SESSION_TIMEOUT: 30000, // 30초
  RETRY_COUNT: 3
};

export const PACKAGE_TYPES = {
  SINGLE: 'SINGLE_',
  BUNDLE: 'BUNDLE_',
  PREMIUM: 'PREMIUM_'
};
