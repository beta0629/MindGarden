// CSS 변수 및 디자인 시스템 상수
export const CSS_VARIABLES = {
  // 색상 시스템
  COLORS: {
    // Primary Colors
    PRIMARY: '#667eea',
    PRIMARY_DARK: '#764ba2',
    PRIMARY_GRADIENT: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    
    // Secondary Colors
    SECONDARY: '#6c757d',
    SECONDARY_LIGHT: '#e9ecef',
    
    // Success Colors
    SUCCESS: '#00b894',
    SUCCESS_LIGHT: '#d4edda',
    SUCCESS_DARK: '#00a085',
    SUCCESS_GRADIENT: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    
    // Danger Colors
    DANGER: '#ff6b6b',
    DANGER_LIGHT: '#f8d7da',
    DANGER_DARK: '#ee5a24',
    DANGER_GRADIENT: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    
    // Info Colors
    INFO: '#74b9ff',
    INFO_LIGHT: '#d1ecf1',
    INFO_DARK: '#0984e3',
    INFO_GRADIENT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    
    // Warning Colors
    WARNING: '#f093fb',
    WARNING_LIGHT: '#fff3cd',
    WARNING_DARK: '#f5576c',
    WARNING_GRADIENT: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    
    // Consultant Colors
    CONSULTANT: '#a29bfe',
    CONSULTANT_DARK: '#6c5ce7',
    CONSULTANT_GRADIENT: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
    
    // Client Colors
    CLIENT: '#00b894',
    CLIENT_DARK: '#00a085',
    CLIENT_GRADIENT: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
    
    // Finance Colors
    FINANCE: '#f39c12',
    FINANCE_DARK: '#e67e22',
    FINANCE_GRADIENT: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
    
    // Revenue Colors
    REVENUE: '#27ae60',
    REVENUE_DARK: '#229954',
    REVENUE_GRADIENT: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
    
    // Expense Colors
    EXPENSE: '#e74c3c',
    EXPENSE_DARK: '#c0392b',
    EXPENSE_GRADIENT: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    
    // Payment Colors
    PAYMENT: '#9b59b6',
    PAYMENT_DARK: '#8e44ad',
    PAYMENT_GRADIENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
    
    // Report Colors
    REPORT: '#34495e',
    REPORT_DARK: '#2c3e50',
    REPORT_GRADIENT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
    
    // Settings Colors
    SETTINGS: '#95a5a6',
    SETTINGS_DARK: '#7f8c8d',
    SETTINGS_GRADIENT: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
    
    // Neutral Colors
    WHITE: '#ffffff',
    BLACK: '#2c3e50',
    GRAY_LIGHT: '#f8f9fa',
    GRAY_MEDIUM: '#6c757d',
    GRAY_DARK: '#495057',
    BORDER: '#e9ecef',
    TEXT_PRIMARY: '#2c3e50',
    TEXT_SECONDARY: '#6c757d',
    TEXT_MUTED: '#6c757d'
  },
  
  // 간격 시스템
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '12px',
    LG: '16px',
    XL: '20px',
    XXL: '24px',
    XXXL: '32px',
    HUGE: '48px'
  },
  
  // 폰트 크기
  FONT_SIZES: {
    XS: '0.75rem',
    SM: '0.875rem',
    MD: '1rem',
    LG: '1.1rem',
    XL: '1.2rem',
    XXL: '1.3rem',
    XXXL: '1.5rem',
    HUGE: '1.8rem',
    GIANT: '2rem'
  },
  
  // 폰트 두께
  FONT_WEIGHTS: {
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700'
  },
  
  // 보더 반경
  BORDER_RADIUS: {
    SM: '6px',
    MD: '8px',
    LG: '12px',
    XL: '16px',
    ROUND: '50%'
  },
  
  // 그림자
  SHADOWS: {
    SM: '0 2px 4px rgba(0, 0, 0, 0.1)',
    MD: '0 4px 12px rgba(0, 0, 0, 0.1)',
    LG: '0 4px 20px rgba(0, 0, 0, 0.08)',
    XL: '0 8px 30px rgba(0, 0, 0, 0.12)',
    XXL: '0 8px 32px rgba(0, 0, 0, 0.15)',
    MODAL: '0 10px 30px rgba(0, 0, 0, 0.2)'
  },
  
  // 전환 효과
  TRANSITIONS: {
    FAST: '0.2s ease',
    NORMAL: '0.3s ease',
    SLOW: '0.5s ease'
  },
  
  // Z-Index
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1020,
    FIXED: 1030,
    MODAL_BACKDROP: 1040,
    MODAL: 1050,
    POPOVER: 1060,
    TOOLTIP: 1070,
    TOAST: 9999
  },
  
  // 브레이크포인트
  BREAKPOINTS: {
    XS: '480px',
    SM: '576px',
    MD: '768px',
    LG: '992px',
    XL: '1200px',
    XXL: '1400px'
  }
};

// 컴포넌트별 CSS 클래스 상수
export const COMPONENT_CSS = {
  // 관리자 대시보드
  ADMIN_DASHBOARD: {
    CONTAINER: 'admin-dashboard-content',
    SECTION: 'dashboard-section',
    SECTION_TITLE: 'section-title',
    OVERVIEW_CARDS: 'overview-cards',
    OVERVIEW_CARD: 'overview-card',
    CARD_ICON: 'card-icon',
    CARD_CONTENT: 'card-content',
    CARD_VALUE: 'card-value',
    CARD_DESCRIPTION: 'card-description',
    MANAGEMENT_GRID: 'management-grid',
    MANAGEMENT_CARD: 'management-card',
    MANAGEMENT_ICON: 'management-icon',
    MANAGEMENT_CONTENT: 'management-content',
    TOOL_BUTTONS: 'tool-buttons',
    TOAST: 'toast',
    TOAST_HEADER: 'toast-header',
    TOAST_BODY: 'toast-body'
  },

  // 스케줄 모달
  SCHEDULE_MODAL: {
    OVERLAY: 'schedule-modal-overlay',
    MODAL: 'schedule-modal',
    HEADER: 'schedule-modal-header',
    HEADER_LEFT: 'schedule-modal-header-left',
    HEADER_CENTER: 'schedule-modal-header-center',
    HEADER_RIGHT: 'schedule-modal-header-right',
    TITLE: 'schedule-modal-title',
    SELECTED_DATE: 'selected-date',
    CLOSE_BTN: 'schedule-modal-close-btn',
    CONTENT: 'schedule-modal-content',
    FOOTER: 'modal-footer',
    STEP_HEADER: 'step-header',
    STEP_DESCRIPTION: 'step-description',
    CONSULTANT_GRID: 'consultant-grid',
    CONSULTANT_CARD: 'consultant-card',
    FILTER_SECTION: 'filter-section',
    SEARCH_INPUT: 'search-input',
    SPECIALTY_SELECT: 'specialty-select',
    AVAILABILITY_FILTER: 'availability-filter',
    FILTER_BUTTON: 'filter-button',
    RESET_BUTTON: 'reset-button',
    NO_CONSULTANTS: 'no-consultants',
    SELECTED_INFO: 'selected-consultant-info',
    SELECTION_SUMMARY: 'selection-summary',
    CONSULTANT_SPECIALTY: 'consultant-specialty'
  },
  
  // 오늘의 통계
  TODAY_STATS: {
    CONTAINER: 'today-stats-container',
    HEADER: 'today-stats-header',
    TITLE: 'today-stats-title',
    REFRESH_BTN: 'today-stats-refresh-btn',
    CARDS: 'today-stats-cards',
    CARD: 'today-stats-card',
    CARD_HEADER: 'today-stats-card-header',
    CARD_VALUE: 'today-stats-card-value',
    CARD_LABEL: 'today-stats-card-label',
    LAST_UPDATE: 'today-stats-last-update'
  },
  
  // 웰컴 섹션
  WELCOME_SECTION: {
    CONTAINER: 'welcome-section',
    CARD: 'welcome-card',
    PROFILE: 'welcome-profile',
    AVATAR: 'profile-avatar',
    IMAGE: 'profile-image',
    ICON: 'profile-icon',
    CONTENT: 'welcome-content',
    TITLE: 'welcome-title',
    MESSAGE: 'welcome-message',
    TIME: 'welcome-time',
    INFO_CARDS: 'welcome-info-cards',
    INFO_CARD: 'welcome-info-card',
    INFO_ICON: 'info-icon',
    INFO_TITLE: 'info-title',
    INFO_VALUE: 'info-value'
  }
};

// 아이콘 상수
export const ICONS = {
  // Bootstrap Icons
  BI: {
    SPEEDOMETER: 'bi-speedometer2',
    GEAR: 'bi-gear',
    TOOLS: 'bi-tools',
    PERSON_BADGE: 'bi-person-badge',
    PEOPLE: 'bi-people',
    LINK: 'bi-link-45deg',
    CHECK_CIRCLE: 'bi-check-circle',
    CALENDAR_ALT: 'bi-calendar-alt',
    CALENDAR_CHECK: 'bi-calendar-check',
    PERSON_TIE: 'bi-person-tie',
    CLOCK: 'bi-clock',
    EMOJI_SMILE: 'bi-emoji-smile',
    HEART: 'bi-heart',
    LIGHTBULB: 'bi-lightbulb',
    CALENDAR_CHECK_ALT: 'bi-calendar-check',
    PERSON_CIRCLE: 'bi-person-circle',
    FLOWER: 'bi-flower1',
    LIST: 'bi-list',
    BOX_ARROW_RIGHT: 'bi-box-arrow-right',
    BOX_ARROW_IN_RIGHT: 'bi-box-arrow-in-right',
    CURRENCY_DOLLAR: 'bi-currency-dollar',
    GRAPH_UP_ARROW: 'bi-graph-up-arrow',
    CASH_STACK: 'bi-cash-stack',
    RECEIPT: 'bi-receipt',
    CREDIT_CARD: 'bi-credit-card',
    FILE_EARMARK_BAR_GRAPH: 'bi-file-earmark-bar-graph',
    GEAR_FILL: 'bi-gear-fill'
  },
  
  // Font Awesome Icons
  FA: {
    USERS: 'FaUsers',
    USER_TIE: 'FaUserTie',
    LINK: 'FaLink',
    SYNC: 'FaSync',
    CALENDAR_ALT: 'FaCalendarAlt',
    CALENDAR_CHECK: 'FaCalendarCheck',
    COG: 'FaCog',
    DOLLAR_SIGN: 'FaDollarSign',
    CHART_LINE: 'FaChartLine',
    CASH_STACK: 'FaCashStack',
    RECEIPT: 'FaReceipt',
    CREDIT_CARD: 'FaCreditCard',
    FILE_ALT: 'FaFileAlt',
    COGS: 'FaCogs'
  }
};

// 그라데이션 상수
export const GRADIENTS = {
  PRIMARY: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  SUCCESS: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  DANGER: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
  INFO: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  WARNING: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  CONSULTANT: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
  CLIENT: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
  FINANCE: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
  REVENUE: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)',
  EXPENSE: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
  PAYMENT: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)',
  REPORT: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
  SETTINGS: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
};

// 스케줄 모달 상수
export const SCHEDULE_MODAL_CONSTANTS = {
  // 모달 크기
  MODAL_WIDTH: '1200px',
  MODAL_MAX_HEIGHT: '98vh',
  MODAL_MIN_HEIGHT: '500px',
  
  // 단계별 높이
  STEP_HEADER_HEIGHT: '80px',
  FILTER_SECTION_HEIGHT: '200px',
  CONSULTANT_GRID_HEIGHT: '350px',
  
  // 애니메이션
  ANIMATION_DURATION: '0.3s',
  ANIMATION_EASING: 'ease',
  
  // 색상
  PRIMARY_COLOR: '#667eea',
  SUCCESS_COLOR: '#28a745',
  WARNING_COLOR: '#ffc107',
  DANGER_COLOR: '#dc3545',
  INFO_COLOR: '#17a2b8',
  
  // 가용성 상태
  AVAILABILITY: {
    AVAILABLE: 'available',
    BUSY: 'busy',
    UNAVAILABLE: 'unavailable',
    ALL: 'all'
  },
  
  // 전문분야 옵션
  SPECIALTIES: [
    { value: '', label: '전체' },
    { value: '우울증', label: '우울증' },
    { value: '불안장애', label: '불안장애' },
    { value: '가족상담', label: '가족상담' },
    { value: '부부상담', label: '부부상담' },
    { value: '트라우마', label: '트라우마' },
    { value: 'PTSD', label: 'PTSD' },
    { value: 'ADHD', label: 'ADHD' },
    { value: '자폐스펙트럼', label: '자폐스펙트럼' }
  ],
  
  // 가용성 필터 옵션
  AVAILABILITY_OPTIONS: [
    { value: 'all', label: '전체', color: '#6c757d' },
    { value: 'available', label: '여유', color: '#28a745' },
    { value: 'busy', label: '바쁨', color: '#ffc107' },
    { value: 'unavailable', label: '휴', color: '#dc3545' }
  ],
  
  // 상담사 카드 설정
  CONSULTANT_CARD: {
    MIN_HEIGHT: '120px',
    BORDER_RADIUS: '12px',
    PADDING: '16px',
    MARGIN_BOTTOM: '12px'
  },
  
  // 필터 설정
  FILTER: {
    SEARCH_PLACEHOLDER: '상담사 이름, 직책, 전문분야로 검색...',
    RESET_BUTTON_TEXT: '초기화',
    CONSULTANT_COUNT_TEXT: '명의 상담사'
  }
};
