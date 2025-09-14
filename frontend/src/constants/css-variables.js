/**
 * CSS 변수 및 디자인 시스템 상수 (동적 처리)
 * 
 * @deprecated 하드코딩된 색상 값들은 getDynamicCSSVariables() 함수 사용 권장
 * @see getDynamicCSSVariables() in cssThemeHelper.js
 */
import { getDynamicCSSVariables } from '../utils/cssThemeHelper';

// 하드코딩된 CSS 변수 (fallback용)
export const CSS_VARIABLES = {
  // 색상 시스템 (동적 처리로 변경됨)
  COLORS: {
    // Primary Colors (fallback)
    PRIMARY: '#667eea',
    PRIMARY_DARK: '#764ba2',
    PRIMARY_GRADIENT: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    
    // Secondary Colors (fallback)
    SECONDARY: '#6c757d',
    SECONDARY_LIGHT: '#e9ecef',
    
    // Success Colors (fallback)
    SUCCESS: '#00b894',
    SUCCESS_LIGHT: '#d4edda',
    SUCCESS_DARK: '#00a085',
    SUCCESS_GRADIENT: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    
    // Danger Colors (fallback)
    DANGER: '#ff6b6b',
    DANGER_LIGHT: '#f8d7da',
    DANGER_DARK: '#ee5a24',
    DANGER_GRADIENT: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    
    // Info Colors (fallback)
    INFO: '#74b9ff',
    INFO_LIGHT: '#d1ecf1',
    INFO_DARK: '#0984e3',
    INFO_GRADIENT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    
    // Warning Colors (fallback)
    WARNING: '#f093fb',
    WARNING_LIGHT: '#fff3cd',
    WARNING_DARK: '#f5576c',
    WARNING_GRADIENT: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    
    // Consultant Colors (fallback)
    CONSULTANT: '#a29bfe',
    CONSULTANT_DARK: '#6c5ce7',
    CONSULTANT_GRADIENT: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
    
    // Client Colors (fallback)
    CLIENT: '#00b894',
    CLIENT_DARK: '#00a085',
    CLIENT_GRADIENT: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
    
    // Finance Colors (fallback)
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
    { value: 'unavailable', label: '휴무', color: '#dc3545' }
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

// 태블릿 로그인 상수
export const TABLET_LOGIN_CONSTANTS = {
  // SMS 인증 설정
  SMS: {
    PHONE_LENGTH: 11,
    CODE_LENGTH: 6,
    COUNTDOWN_DURATION: 180, // 3분
    RESEND_DELAY: 60 // 1분
  },
  
  // 폼 유효성 검사
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^01[0-9]{8,9}$/,
    PASSWORD_MIN_LENGTH: 6
  },
  
  // 로그인 모드
  LOGIN_MODES: {
    EMAIL: 'email',
    SMS: 'sms'
  },
  
  // API 엔드포인트
  API_ENDPOINTS: {
    LOGIN: '/api/auth/login',
    SMS_SEND: '/api/auth/sms/send',
    SMS_VERIFY: '/api/auth/sms/verify',
    OAUTH_CONFIG: '/api/auth/oauth2/config',
    OAUTH_CALLBACK: '/api/auth/oauth2/callback'
  },
  
  // 메시지
  MESSAGES: {
    LOGIN_SUCCESS: '로그인되었습니다.',
    LOGIN_FAILED: '아이디 또는 비밀번호 틀림',
    SMS_SENT: '인증 코드가 전송되었습니다.',
    SMS_SEND_FAILED: '인증 코드 전송에 실패했습니다.',
    SMS_VERIFY_SUCCESS: '인증이 완료되었습니다.',
    SMS_VERIFY_FAILED: '인증 코드가 올바르지 않습니다.',
    PHONE_INVALID: '올바른 휴대폰 번호를 입력해주세요.',
    CODE_INVALID: '6자리 인증 코드를 입력해주세요.',
    EMAIL_INVALID: '올바른 이메일을 입력해주세요.',
    PASSWORD_INVALID: '비밀번호를 입력해주세요.',
    LOADING: '처리 중...',
    RETRY: '다시 시도',
    RESEND: '재전송'
  },
  
  // 소셜 로그인
  SOCIAL: {
    PROVIDERS: {
      KAKAO: 'kakao',
      NAVER: 'naver'
    },
    BUTTONS: {
      KAKAO: {
        TEXT: '카카오로 로그인',
        COLOR: '#FEE500',
        TEXT_COLOR: '#000000'
      },
      NAVER: {
        TEXT: '네이버로 로그인',
        COLOR: '#03C75A',
        TEXT_COLOR: '#FFFFFF'
      }
    }
  },
  
  // UI 설정
  UI: {
    ANIMATION_DURATION: 300,
    LOADING_DELAY: 1000,
    TOAST_DURATION: 3000
  }
};

// 재무 대시보드 상수
export const FINANCE_DASHBOARD_CONSTANTS = {
  // API 엔드포인트
  API_ENDPOINTS: {
    DASHBOARD: '/api/super-admin/finance/dashboard',
    STATISTICS: '/api/super-admin/finance/statistics',
    PAYMENTS: '/api/super-admin/finance/payments',
    REVENUE: '/api/super-admin/finance/revenue',
    EXPENSES: '/api/super-admin/finance/expenses'
  },
  
  // 통계 타입
  STAT_TYPES: {
    REVENUE: 'revenue',
    EXPENSE: 'expense',
    PROFIT: 'profit',
    PAYMENT: 'payment'
  },
  
  // 결제 상태
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },
  
  // 차트 설정
  CHART: {
    COLORS: {
      REVENUE: '#28a745',
      EXPENSE: '#dc3545',
      PROFIT: '#007bff',
      PENDING: '#ffc107',
      COMPLETED: '#28a745',
      FAILED: '#dc3545'
    },
    MONTHS: [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ]
  },
  
  // 메시지
  MESSAGES: {
    LOADING: '재무 데이터를 불러오는 중...',
    LOAD_SUCCESS: '재무 데이터를 성공적으로 불러왔습니다.',
    LOAD_ERROR: '재무 데이터를 불러오는데 실패했습니다.',
    REFRESH_SUCCESS: '데이터가 새로고침되었습니다.',
    REFRESH_ERROR: '데이터 새로고침에 실패했습니다.'
  },
  
  // 포맷팅
  FORMAT: {
    CURRENCY: {
      STYLE: 'currency',
      CURRENCY: 'KRW',
      LOCALE: 'ko-KR'
    },
    PERCENTAGE: {
      MINIMUM_FRACTION_DIGITS: 1,
      MAXIMUM_FRACTION_DIGITS: 1
    }
  },
  
  // 새로고침 간격 (밀리초)
  REFRESH_INTERVAL: 30000, // 30초
  
  // 로딩 지연 시간 (밀리초)
  LOADING_DELAY: 500
};

// 결제 확인 모달 상수
export const PAYMENT_CONFIRMATION_MODAL_CONSTANTS = {
  // API 엔드포인트
  API_ENDPOINTS: {
    CONFIRM_PAYMENT: '/api/admin/mapping/payment/confirm',
    CANCEL_PAYMENT: '/api/admin/mapping/payment/cancel',
    GET_PAYMENT_DETAILS: '/api/admin/mapping/payment/details'
  },
  
  // 결제 상태
  PAYMENT_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
  },
  
  // 결제 방법
  PAYMENT_METHODS: {
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    CASH: 'cash',
    OTHER: 'other'
  },
  
  // 메시지
  MESSAGES: {
    LOADING: '결제 정보를 불러오는 중...',
    CONFIRM_SUCCESS: '결제가 성공적으로 확인되었습니다.',
    CONFIRM_ERROR: '결제 확인에 실패했습니다.',
    CANCEL_SUCCESS: '결제가 성공적으로 취소되었습니다.',
    CANCEL_ERROR: '결제 취소에 실패했습니다.',
    LOAD_ERROR: '결제 정보를 불러오는데 실패했습니다.',
    INVALID_AMOUNT: '올바른 결제 금액을 입력해주세요.',
    REQUIRED_FIELDS: '필수 입력 항목을 모두 입력해주세요.'
  },
  
  // 포맷팅
  FORMAT: {
    CURRENCY: {
      STYLE: 'currency',
      CURRENCY: 'KRW',
      LOCALE: 'ko-KR'
    }
  },
  
  // 유효성 검사
  VALIDATION: {
    MIN_AMOUNT: 1000,
    MAX_AMOUNT: 10000000,
    MAX_NOTE_LENGTH: 500
  },
  
  // UI 설정
  UI: {
    MODAL_WIDTH: '800px',
    MODAL_MAX_HEIGHT: '90vh',
    ANIMATION_DURATION: 300
  }
};

// 클라이언트 선택기 상수
export const CLIENT_SELECTOR_CONSTANTS = {
  // API 엔드포인트
  API_ENDPOINTS: {
    CHECK_MAPPING: '/api/schedules/client/mapping/check',
    GET_CLIENT_MAPPINGS: '/api/schedules/client/mappings',
    GET_CLIENT_HISTORY: '/api/schedules/client/history'
  },
  
  // 매핑 상태
  MAPPING_STATUS: {
    ACTIVE: 'ACTIVE',
    PENDING: 'PENDING',
    INACTIVE: 'INACTIVE',
    EXPIRED: 'EXPIRED'
  },
  
  // 세션 상태
  SESSION_STATUS: {
    AVAILABLE: 'available',
    LOW: 'low',
    NONE: 'none'
  },
  
  // 메시지
  MESSAGES: {
    MAPPING_CHECK_SUCCESS: '매핑 정보를 확인했습니다.',
    MAPPING_CHECK_ERROR: '매핑 정보 확인에 실패했습니다.',
    NO_MAPPING: '해당 내담자와 상담사 간의 매핑이 없습니다.',
    NO_SESSIONS: '사용 가능한 세션이 없습니다.',
    LOADING_MAPPING: '매핑 정보를 확인하는 중...',
    LOADING_HISTORY: '상담 이력을 불러오는 중...'
  },
  
  // 유효성 검사
  VALIDATION: {
    MIN_SESSIONS: 1,
    MAX_SESSIONS: 100
  },
  
  // UI 설정
  UI: {
    LOADING_DELAY: 500,
    ANIMATION_DURATION: 300
  }
};

// 홈페이지 상수
export const HOMEPAGE_CONSTANTS = {
  // 메뉴 항목
  MENU_ITEMS: {
    HOME: 'home',
    LOGIN: 'login',
    REGISTER: 'register',
    ABOUT: 'about',
    SERVICES: 'services',
    CONTACT: 'contact'
  },
  
  // 프로필 메뉴 항목
  PROFILE_MENU_ITEMS: {
    DASHBOARD: 'dashboard',
    PROFILE: 'profile',
    SETTINGS: 'settings',
    LOGOUT: 'logout'
  },
  
  // 메시지
  MESSAGES: {
    MENU_OPENED: '메뉴가 열렸습니다.',
    MENU_CLOSED: '메뉴가 닫혔습니다.',
    PROFILE_OPENED: '프로필 메뉴가 열렸습니다.',
    PROFILE_CLOSED: '프로필 메뉴가 닫혔습니다.',
    LOGOUT_SUCCESS: '로그아웃되었습니다.',
    LOGOUT_ERROR: '로그아웃 중 오류가 발생했습니다.'
  },
  
  // UI 설정
  UI: {
    ANIMATION_DURATION: 300,
    MENU_WIDTH: '300px',
    PROFILE_MENU_WIDTH: '200px'
  }
};

/**
 * 동적 CSS 변수 조회 함수
 * @param {string} themeName 테마명 (기본값: 'default')
 * @returns {Promise<Object>} 동적 CSS 변수 객체
 */
export const getDynamicCSSVariablesAsync = getDynamicCSSVariables;

/**
 * 동적 CSS 변수 조회 함수 (동기식 fallback)
 * @param {string} themeName 테마명 (기본값: 'default')
 * @returns {Object} CSS 변수 객체 (fallback 포함)
 */
export const getCSSVariablesSync = (themeName = 'default') => {
  // 동적 조회 실패 시 fallback으로 하드코딩된 값 사용
  return CSS_VARIABLES;
};

/**
 * 특정 색상 값을 동적으로 조회하는 함수
 * @param {string} colorKey 색상 키 (예: 'PRIMARY', 'SUCCESS')
 * @param {string} themeName 테마명 (기본값: 'default')
 * @returns {Promise<string>} 색상 값
 */
export const getDynamicColor = async (colorKey, themeName = 'default') => {
  try {
    const { getThemeColor } = await import('../utils/cssThemeHelper');
    const color = await getThemeColor(themeName, colorKey);
    return color || CSS_VARIABLES.COLORS[colorKey] || '#6b7280';
  } catch (error) {
    console.error(`🎨 동적 색상 조회 실패: ${colorKey}`, error);
    return CSS_VARIABLES.COLORS[colorKey] || '#6b7280';
  }
};

/**
 * 특정 색상 값을 동적으로 조회하는 함수 (동기식 fallback)
 * @param {string} colorKey 색상 키
 * @returns {string} 색상 값 (fallback 포함)
 */
export const getColorSync = (colorKey) => {
  return CSS_VARIABLES.COLORS[colorKey] || '#6b7280';
};
