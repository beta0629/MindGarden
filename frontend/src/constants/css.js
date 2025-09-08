/**
 * CSS 클래스 상수 정의
 * 컴포넌트별 CSS 클래스명을 중앙에서 관리
 */

// 공통 CSS 클래스
export const COMMON_CSS_CLASSES = {
  // 레이아웃
  CONTAINER: 'container',
  HEADER: 'header',
  CONTENT: 'content',
  FOOTER: 'footer',
  
  // 버튼
  BUTTON: 'btn',
  BUTTON_PRIMARY: 'btn-primary',
  BUTTON_SECONDARY: 'btn-secondary',
  BUTTON_WARNING: 'btn-warning',
  BUTTON_INFO: 'btn-info',
  BUTTON_DANGER: 'btn-danger',
  BUTTON_SUCCESS: 'btn-success',
  BUTTON_SMALL: 'btn-sm',
  BUTTON_LARGE: 'btn-lg',
  
  // 폼
  FORM_GROUP: 'form-group',
  FORM_INPUT: 'form-input',
  FORM_LABEL: 'form-label',
  FORM_ACTIONS: 'form-actions',
  CHECKBOX_GROUP: 'checkbox-group',
  
  // 테이블
  TABLE: 'table',
  TABLE_HEADER: 'table-header',
  TABLE_ROW: 'table-row',
  TABLE_CELL: 'table-cell',
  
  // 상태
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  
  // 모달
  MODAL_OVERLAY: 'modal-overlay',
  MODAL_CONTENT: 'modal-content',
  MODAL_HEADER: 'modal-header',
  MODAL_BODY: 'modal-body',
  MODAL_FOOTER: 'modal-footer',
  
  // 배지
  BADGE: 'badge',
  BADGE_PRIMARY: 'badge-primary',
  BADGE_SECONDARY: 'badge-secondary',
  BADGE_SUCCESS: 'badge-success',
  BADGE_WARNING: 'badge-warning',
  BADGE_DANGER: 'badge-danger',
  
  // 액션
  ACTION_BUTTONS: 'action-buttons',
  PRIMARY_BADGE: 'primary-badge',
  
  // 반응형
  RESPONSIVE: 'responsive',
  MOBILE_HIDDEN: 'mobile-hidden',
  DESKTOP_HIDDEN: 'desktop-hidden'
};

// 계좌 관리 전용 CSS 클래스
export const ACCOUNT_CSS_CLASSES = {
  // 메인 컨테이너
  ACCOUNT_MANAGEMENT: 'account-management',
  ACCOUNT_HEADER: 'account-header',
  ACCOUNT_LIST: 'account-list',
  
  // 폼
  ACCOUNT_FORM_OVERLAY: 'account-form-overlay',
  ACCOUNT_FORM: 'account-form',
  
  // 테이블
  ACCOUNT_TABLE: 'account-table',
  
  // 상태
  STATUS_ACTIVE: 'status active',
  STATUS_INACTIVE: 'status inactive',
  
  // 액션
  ACTION_BUTTONS: 'action-buttons',
  PRIMARY_BADGE: 'primary-badge'
};

// 결제 테스트 전용 CSS 클래스
export const PAYMENT_TEST_CSS_CLASSES = {
  PAYMENT_TEST: 'payment-test',
  TEST_CONFIG: 'test-config',
  TEST_RESULTS: 'test-results',
  TEST_BUTTONS: 'test-buttons',
  RESULT_ITEM: 'result-item'
};

// 통계 전용 CSS 클래스
export const STATISTICS_CSS_CLASSES = {
  TODAY_STATISTICS: 'today-statistics',
  STAT_CARD: 'stat-card',
  STAT_CARD_TOTAL: 'stat-card total',
  STAT_CARD_COMPLETED: 'stat-card completed',
  STAT_CARD_IN_PROGRESS: 'stat-card in-progress',
  STAT_CARD_CANCELLED: 'stat-card cancelled',
  STAT_NUMBER: 'stat-number',
  STAT_LABEL: 'stat-label'
};

// 상세 통계 카드 CSS 클래스
export const DETAILED_STATS_CARD_CSS = {
  CONTAINER: 'detailed-stats-card',
  HEADER: 'detailed-stats-card-header',
  ICON: 'detailed-stats-card-icon',
  TITLE: 'detailed-stats-card-title',
  CONTENT: 'detailed-stats-card-content',
  MAIN: 'detailed-stats-card-main',
  NUMBER: 'detailed-stats-card-number',
  LABEL: 'detailed-stats-card-label',
  SUB: 'detailed-stats-card-sub',
  DETAIL: 'detailed-stats-card-detail',
  RATE: 'detailed-stats-card-rate',
  DESC: 'detailed-stats-card-desc',
  CHANGE: 'detailed-stats-card-change',
  CHANGE_POSITIVE: 'detailed-stats-card-change positive',
  CHANGE_NEGATIVE: 'detailed-stats-card-change negative'
};

// 상세 통계 상수
export const DETAILED_STATS = {
  CHANGE_TYPES: {
    POSITIVE: 'positive',
    NEGATIVE: 'negative',
    NEUTRAL: 'neutral'
  }
};

// 상세 통계 그리드 CSS 클래스
export const DETAILED_STATS_GRID_CSS = {
  CONTAINER: 'detailed-stats-grid',
  GRID: 'detailed-stats-grid-container',
  CARD: 'detailed-stats-grid-card',
  HEADER: 'detailed-stats-grid-header',
  TITLE: 'detailed-stats-grid-title',
  CONTENT: 'detailed-stats-grid-content',
  ITEM: 'detailed-stats-grid-item',
  LABEL: 'detailed-stats-grid-label',
  VALUE: 'detailed-stats-grid-value',
  CHANGE: 'detailed-stats-grid-change',
  ICON: 'detailed-stats-grid-icon'
};

// 통계 카드 CSS 클래스
export const STATS_CARD_CSS = {
  CONTAINER: 'stats-card',
  HEADER: 'stats-card-header',
  TITLE: 'stats-card-title',
  CONTENT: 'stats-card-content',
  NUMBER: 'stats-card-number',
  LABEL: 'stats-card-label',
  ICON: 'stats-card-icon',
  CHANGE: 'stats-card-change',
  TREND: 'stats-card-trend'
};

// 통계 카드 그리드 CSS 클래스
export const STATS_CARD_GRID_CSS = {
  CONTAINER: 'stats-card-grid',
  GRID: 'stats-card-grid-container',
  CARD: 'stats-card-grid-card',
  HEADER: 'stats-card-grid-header',
  TITLE: 'stats-card-grid-title',
  CONTENT: 'stats-card-grid-content',
  ITEM: 'stats-card-grid-item',
  LABEL: 'stats-card-grid-label',
  VALUE: 'stats-card-grid-value',
  ICON: 'stats-card-grid-icon',
  CHANGE: 'stats-card-grid-change',
  TREND: 'stats-card-grid-trend'
};

// 공통 대시보드 CSS 클래스
export const COMMON_DASHBOARD_CSS = {
  CONTAINER: 'common-dashboard',
  HEADER: 'common-dashboard-header',
  TITLE: 'common-dashboard-title',
  CONTENT: 'common-dashboard-content',
  SECTION: 'common-dashboard-section',
  CARD: 'common-dashboard-card',
  GRID: 'common-dashboard-grid',
  STATS: 'common-dashboard-stats',
  ACTIONS: 'common-dashboard-actions',
  FOOTER: 'common-dashboard-footer'
};

// 빠른 액션 CSS 클래스
export const QUICK_ACTIONS_CSS = {
  CONTAINER: 'quick-actions',
  SECTION_TITLE: 'section-title',
  ACTION_GRID: 'quick-actions-action-grid',
  ACTION_BUTTON: 'quick-actions-action-button',
  ACTION_ICON: 'quick-actions-action-icon',
  ACTION_LABEL: 'quick-actions-action-label'
};

// 최근 활동 CSS 클래스
export const RECENT_ACTIVITIES_CSS = {
  CONTAINER: 'recent-activities',
  SECTION_TITLE: 'section-title',
  ACTIVITY_LIST: 'recent-activities-activity-list',
  ACTIVITY_ITEM: 'recent-activities-activity-item',
  ACTIVITY_ICON: 'recent-activities-activity-icon',
  ACTIVITY_CONTENT: 'recent-activities-activity-content',
  ACTIVITY_TITLE: 'recent-activities-activity-title',
  ACTIVITY_TIME: 'recent-activities-activity-time',
  NO_ACTIVITIES: 'no-activities'
};

// 환영 섹션 CSS 클래스
export const WELCOME_SECTION_CSS = {
  CONTAINER: 'welcome-section',
  HEADER: 'welcome-section-header',
  TITLE: 'welcome-section-title',
  SUBTITLE: 'welcome-section-subtitle',
  CONTENT: 'welcome-section-content',
  MESSAGE: 'welcome-section-message',
  ICON: 'welcome-section-icon'
};

// 요약 패널 CSS 클래스
export const SUMMARY_PANELS_CSS = {
  CONTAINER: 'summary-panels',
  GRID: 'summary-panels-grid',
  PANEL: 'summary-panels-panel',
  PANEL_HEADER: 'summary-panels-panel-header',
  PANEL_TITLE: 'summary-panels-panel-title',
  PANEL_ICON: 'summary-panels-panel-icon',
  PANEL_CONTENT: 'summary-panels-panel-content',
  SUMMARY_ITEM: 'summary-panels-summary-item',
  SUMMARY_ICON: 'summary-panels-summary-icon',
  SUMMARY_INFO: 'summary-panels-summary-info',
  SUMMARY_LABEL: 'summary-panels-summary-label',
  SUMMARY_VALUE: 'summary-panels-summary-value',
  CONSULTANT_PROFILE: 'summary-panels-consultant-profile',
  CONSULTANT_AVATAR: 'summary-panels-consultant-avatar',
  CONSULTANT_DETAILS: 'summary-panels-consultant-details',
  CONSULTANT_NAME: 'summary-panels-consultant-name',
  CONSULTANT_SPECIALTY: 'summary-panels-consultant-specialty',
  CONSULTANT_INTRO: 'summary-panels-consultant-intro',
  MAPPING_ACTIONS: 'summary-panels-mapping-actions'
};

// 결제 테스트 CSS 클래스
export const PAYMENT_TEST_CSS = {
  CONTAINER: 'payment-test',
  HEADER: 'payment-test-header',
  TITLE: 'payment-test-title',
  CONTENT: 'payment-test-content',
  CONFIG: 'payment-test-config',
  FORM: 'payment-test-form',
  FORM_GROUP: 'payment-test-form-group',
  LABEL: 'payment-test-label',
  INPUT: 'payment-test-input',
  SELECT: 'payment-test-select',
  BUTTON: 'payment-test-button',
  BUTTON_PRIMARY: 'payment-test-button-primary',
  BUTTON_SECONDARY: 'payment-test-button-secondary',
  BUTTON_SUCCESS: 'payment-test-button-success',
  BUTTON_DANGER: 'payment-test-button-danger',
  BUTTON_GROUP: 'payment-test-button-group',
  RESULTS: 'payment-test-results',
  RESULT_ITEM: 'payment-test-result-item',
  RESULT_HEADER: 'payment-test-result-header',
  RESULT_TITLE: 'payment-test-result-title',
  RESULT_TIMESTAMP: 'payment-test-result-timestamp',
  RESULT_STATUS: 'payment-test-result-status',
  RESULT_DATA: 'payment-test-result-data',
  RESULT_ERROR: 'payment-test-result-error',
  STATUS_SUCCESS: 'payment-test-status-success',
  STATUS_ERROR: 'payment-test-status-error',
  LOADING: 'payment-test-loading',
  CLEAR_BUTTON: 'payment-test-clear-button'
};

// 태블릿 로그인 CSS 클래스
export const TABLET_LOGIN_CSS = {
  CONTAINER: 'tablet-login',
  HEADER: 'tablet-login-header',
  TITLE: 'tablet-login-title',
  SUBTITLE: 'login-subtitle',
  CONTENT: 'tablet-login-content',
  FORM: 'tablet-login-form',
  FORM_GROUP: 'tablet-login-form-group',
  LABEL: 'tablet-login-label',
  INPUT: 'tablet-login-input',
  INPUT_GROUP: 'tablet-login-input-group',
  PASSWORD_TOGGLE: 'tablet-login-password-toggle',
  BUTTON: 'tablet-login-button',
  BUTTON_PRIMARY: 'tablet-login-button-primary',
  BUTTON_SECONDARY: 'tablet-login-button-secondary',
  BUTTON_SOCIAL: 'tablet-login-button-social',
  BUTTON_SMS: 'tablet-login-button-sms',
  BUTTON_GROUP: 'tablet-login-button-group',
  SOCIAL_BUTTONS: 'social-login-buttons',
  SOCIAL_BUTTON: 'social-login-button',
  SMS_SECTION: 'tablet-login-sms-section',
  SMS_FORM: 'tablet-login-sms-form',
  SMS_INPUT: 'tablet-login-sms-input',
  SMS_BUTTON: 'tablet-login-sms-button',
  SMS_COUNTDOWN: 'tablet-login-sms-countdown',
  SMS_VERIFICATION: 'tablet-login-sms-verification',
  VERIFICATION_INPUT: 'tablet-login-verification-input',
  VERIFICATION_BUTTON: 'tablet-login-verification-button',
  VERIFICATION_COUNTDOWN: 'tablet-login-verification-countdown',
  MODE_SWITCH: 'tablet-login-mode-switch',
  MODE_BUTTON: 'tablet-login-mode-button',
  MODE_ACTIVE: 'tablet-login-mode-button-active',
  LOADING: 'tablet-login-loading',
  ERROR: 'tablet-login-error',
  SUCCESS: 'tablet-login-success',
  DIVIDER: 'login-divider',
  FOOTER: 'login-footer',
  FOOTER_LINK: 'link-button',
  TEST_BUTTON: 'test-button'
};

// 재무 대시보드 CSS 클래스
export const FINANCE_DASHBOARD_CSS = {
  CONTAINER: 'finance-dashboard',
  HEADER: 'finance-header',
  TITLE: 'finance-title',
  SUBTITLE: 'finance-subtitle',
  CONTENT: 'finance-content',
  STATS_GRID: 'finance-stats-grid',
  STAT_CARD: 'finance-stat-card',
  STAT_CARD_REVENUE: 'finance-stat-card-revenue',
  STAT_CARD_EXPENSE: 'finance-stat-card-expense',
  STAT_CARD_PROFIT: 'finance-stat-card-profit',
  STAT_ICON: 'finance-stat-icon',
  STAT_VALUE: 'finance-stat-value',
  STAT_LABEL: 'finance-stat-label',
  STAT_CHANGE: 'finance-stat-change',
  CHART_SECTION: 'finance-chart-section',
  CHART_HEADER: 'finance-chart-header',
  CHART_TITLE: 'finance-chart-title',
  CHART_CONTENT: 'finance-chart-content',
  CHART_CONTAINER: 'finance-chart-container',
  PAYMENT_SECTION: 'finance-payment-section',
  PAYMENT_HEADER: 'finance-payment-header',
  PAYMENT_TITLE: 'finance-payment-title',
  PAYMENT_GRID: 'finance-payment-grid',
  PAYMENT_CARD: 'finance-payment-card',
  PAYMENT_CARD_TOTAL: 'finance-payment-card-total',
  PAYMENT_CARD_PENDING: 'finance-payment-card-pending',
  PAYMENT_CARD_COMPLETED: 'finance-payment-card-completed',
  PAYMENT_CARD_FAILED: 'finance-payment-card-failed',
  PAYMENT_ICON: 'finance-payment-icon',
  PAYMENT_VALUE: 'finance-payment-value',
  PAYMENT_LABEL: 'finance-payment-label',
  LOADING: 'finance-loading',
  ERROR: 'finance-error',
  REFRESH_BUTTON: 'finance-refresh-button'
};

// 결제 확인 모달 CSS 클래스
export const PAYMENT_CONFIRMATION_MODAL_CSS = {
  OVERLAY: 'payment-confirmation-modal-overlay',
  MODAL: 'payment-confirmation-modal',
  HEADER: 'payment-confirmation-modal-header',
  TITLE: 'payment-confirmation-modal-title',
  CLOSE_BUTTON: 'payment-confirmation-modal-close',
  BODY: 'payment-confirmation-modal-body',
  CONTENT: 'payment-confirmation-modal-content',
  MAPPING_LIST: 'payment-confirmation-mapping-list',
  MAPPING_ITEM: 'payment-confirmation-mapping-item',
  MAPPING_HEADER: 'payment-confirmation-mapping-header',
  MAPPING_INFO: 'payment-confirmation-mapping-info',
  MAPPING_CLIENT: 'payment-confirmation-mapping-client',
  MAPPING_CONSULTANT: 'payment-confirmation-mapping-consultant',
  MAPPING_AMOUNT: 'payment-confirmation-mapping-amount',
  MAPPING_STATUS: 'payment-confirmation-mapping-status',
  PAYMENT_SECTION: 'payment-confirmation-payment-section',
  PAYMENT_METHOD: 'payment-confirmation-payment-method',
  PAYMENT_AMOUNT: 'payment-confirmation-payment-amount',
  PAYMENT_NOTE: 'payment-confirmation-payment-note',
  FOOTER: 'payment-confirmation-modal-footer',
  BUTTON_GROUP: 'payment-confirmation-button-group',
  BUTTON: 'payment-confirmation-button',
  BUTTON_PRIMARY: 'payment-confirmation-button-primary',
  BUTTON_SECONDARY: 'payment-confirmation-button-secondary',
  BUTTON_SUCCESS: 'payment-confirmation-button-success',
  BUTTON_DANGER: 'payment-confirmation-button-danger',
  LOADING: 'payment-confirmation-loading',
  ERROR: 'payment-confirmation-error',
  SUCCESS: 'payment-confirmation-success'
};