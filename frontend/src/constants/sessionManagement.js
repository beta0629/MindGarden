/**
 * SessionManagement 컴포넌트 상수 정의
 * 개발 가이드 - 상수화 필수 원칙 준수
 */

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  MAPPINGS: '/api/admin/mappings',
  CLIENTS: '/api/admin/clients/with-mapping-info',
  CONFIRM_PAYMENT: '/api/admin/mappings/{id}/confirm-payment',
  EXTEND_SESSIONS: '/api/admin/mappings/{id}/extend-sessions',
  ERP_FINANCIAL: '/api/erp/financial/update-receivable',
  PACKAGE_CODES: '/api/common-codes/PACKAGE'
};

// 상태 상수
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  ACTIVE: 'ACTIVE'
};

export const MAPPING_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
};

// 필터 상수
export const FILTER_TYPES = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending'
};

// UI 텍스트 상수
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

// 상태별 표시 텍스트
export const STATUS_DISPLAY = {
  PAYMENT_PENDING: '결제대기',
  PAYMENT_COMPLETED: '입금확인',
  PAYMENT_ACTIVE: '완료',
  MAPPING_ACTIVE: '활성',
  MAPPING_PENDING: '대기',
  MAPPING_INACTIVE: '비활성'
};

// 상태별 설명 텍스트
export const STATUS_DESCRIPTION = {
  RESERVATION_PENDING: '(예약가능, 입금대기)',
  PAYMENT_CONFIRMED: '(입금확인완료)',
  COMPLETED: '(완료)'
};

// 버튼 텍스트
export const BUTTON_TEXT = {
  DEPOSIT_CONFIRM: '💳 입금확인',
  COMPLETE: '🎉 완료',
  ADD_SESSION: '➕ 회기 추가',
  APPROVE: '✅ 승인',
  PAYMENT: '💳 결제'
};

// CSS 클래스 상수
export const CSS_CLASSES = {
  // 메인 컨테이너
  CONTAINER: 'session-management-container',
  HEADER: 'session-management-header',
  CONTENT: 'session-management-content',
  
  // 레이아웃
  LAYOUT: 'session-management-layout',
  SIDEBAR: 'session-management-sidebar',
  MAIN_PANEL: 'session-management-main-panel',
  
  // 리스트
  LIST_CONTAINER: 'session-management-list-container',
  LIST_ITEM: 'session-management-list-item',
  LIST_HEADER: 'session-management-list-header',
  LIST_CONTENT: 'session-management-list-content',
  
  // 카드
  MAPPING_CARD: 'session-management-mapping-card',
  CARD_HEADER: 'session-management-card-header',
  CARD_CONTENT: 'session-management-card-content',
  CARD_FOOTER: 'session-management-card-footer',
  
  // 버튼
  ACTION_BUTTON: 'session-management-action-button',
  FILTER_BUTTON: 'session-management-filter-button',
  PRIMARY_BUTTON: 'session-management-primary-button',
  
  // 상태
  ACTIVE: 'session-management-active',
  INACTIVE: 'session-management-inactive',
  PENDING: 'session-management-pending',
  
  // 반응형
  MOBILE_LAYOUT: 'session-management-mobile-layout',
  DESKTOP_LAYOUT: 'session-management-desktop-layout'
};

// 반응형 브레이크포인트
export const BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
  DESKTOP: '1200px'
};

// 애니메이션 상수
export const ANIMATIONS = {
  FADE_IN: 'fadeIn',
  SLIDE_IN: 'slideIn',
  BOUNCE_IN: 'bounceIn',
  FADE_IN_UP: 'fadeInUp',
  SLIDE_IN_DOWN: 'slideInDown'
};

// 색상 상수 (CSS 변수 참조)
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

// 간격 상수 (CSS 변수 참조)
export const SPACING = {
  XS: 'var(--spacing-xs)',
  SM: 'var(--spacing-sm)',
  MD: 'var(--spacing-md)',
  LG: 'var(--spacing-lg)',
  XL: 'var(--spacing-xl)',
  XXL: 'var(--spacing-xxl)'
};

// 폰트 크기 상수 (CSS 변수 참조)
export const FONT_SIZES = {
  XS: 'var(--font-size-xs)',
  SM: 'var(--font-size-sm)',
  BASE: 'var(--font-size-base)',
  LG: 'var(--font-size-lg)',
  XL: 'var(--font-size-xl)',
  XXL: 'var(--font-size-xxl)',
  XXXL: 'var(--font-size-xxxl)'
};

// Z-Index 상수 (CSS 변수 참조)
export const Z_INDEX = {
  BASE: 'var(--z-base)',
  DROPDOWN: 'var(--z-dropdown)',
  MODAL: 'var(--z-modal)',
  TOAST: 'var(--z-toast)'
};

// 모달 상수
export const MODAL_TYPES = {
  ADD_SESSION: 'addSession',
  CONFIRM_PAYMENT: 'confirmPayment',
  APPROVE: 'approve'
};

// 에러 메시지 상수
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  MAPPING_NOT_FOUND: '해당 내담자와 상담사의 매핑을 찾을 수 없습니다.',
  PAYMENT_FAILED: '결제 처리에 실패했습니다.',
  SESSION_ADD_FAILED: '회기 추가에 실패했습니다.',
  LOAD_DATA_FAILED: '데이터 로딩에 실패했습니다.'
};

// 성공 메시지 상수
export const SUCCESS_MESSAGES = {
  PAYMENT_CONFIRMED: '결제가 완료되었습니다.',
  SESSION_ADDED: '회기가 추가되었습니다.',
  STATUS_UPDATED: '상태가 변경되었습니다.',
  DATA_LOADED: '데이터가 업데이트되었습니다.'
};

// 기본값 상수
export const DEFAULTS = {
  ITEMS_PER_PAGE: 10,
  MAX_RECENT_MAPPINGS: 6,
  SESSION_TIMEOUT: 30000, // 30초
  RETRY_COUNT: 3
};

// 패키지 타입 상수
export const PACKAGE_TYPES = {
  SINGLE: 'SINGLE_',
  BUNDLE: 'BUNDLE_',
  PREMIUM: 'PREMIUM_'
};
