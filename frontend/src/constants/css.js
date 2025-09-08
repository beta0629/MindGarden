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