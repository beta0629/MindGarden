/**
 * SimpleHeader 컴포넌트 CSS 상수
 * @description SimpleHeader 관련 모든 CSS 클래스명과 스타일 상수들을 관리
 * @author MindGarden Team
 * @version 1.0.0
 */

// Header 관련 CSS 클래스 상수
export const HEADER_CSS_CLASSES = {
  // 메인 컨테이너
  HEADER: 'simple-header',
  HEADER_CONTENT: 'simple-header-content',
  
  // 왼쪽 영역
  HEADER_LEFT: 'simple-header-left',
  BACK_BUTTON: 'simple-back-button',
  HEADER_LOGO: 'simple-header-logo',
  HEADER_LOGO_LINK: 'simple-header-logo-link',
  
  // 오른쪽 영역
  HEADER_RIGHT: 'simple-header-right',
  LOADING: 'simple-loading',
  USER_INFO: 'simple-user-info',
  USER_AVATAR: 'simple-user-avatar',
  PROFILE_IMAGE: 'simple-profile-image',
  USER_DETAILS: 'simple-user-details',
  USER_NAME: 'simple-user-name',
  USER_ROLE: 'simple-user-role',
  USER_ROLE_EN: 'simple-user-role-en',
  USER_BRANCH: 'simple-user-branch',
  
  // 버튼들
  HAMBURGER_TOGGLE: 'simple-hamburger-toggle',
  LOGIN_BUTTON: 'simple-login-button',
  LOGOUT_BUTTON: 'simple-logout-button',
  MENU_TOGGLE: 'simple-menu-toggle',
};

// Header 스타일 상수
export const HEADER_STYLE_CONSTANTS = {
  // 색상
  COLORS: {
    PRIMARY: '#6c5ce7',
    PRIMARY_LIGHT: 'rgba(108, 92, 231, 0.1)',
    PRIMARY_HOVER: 'rgba(108, 92, 231, 0.2)',
    WHITE: '#ffffff',
    BORDER: '#e0e0e0',
    TEXT_PRIMARY: '#333',
    TEXT_SECONDARY: '#666',
    TEXT_MUTED: '#999',
    BACKGROUND_LIGHT: '#f5f5f5',
    BACKGROUND_HOVER: 'rgba(0, 0, 0, 0.05)',
    DANGER: '#dc3545',
    DANGER_HOVER: '#c82333',
    NEUTRAL: '#f8f9fa',
    NEUTRAL_HOVER: '#e9ecef',
    BORDER_LIGHT: '#dee2e6',
  },
  
  // 크기
  SIZES: {
    HEADER_HEIGHT: '60px',
    HEADER_HEIGHT_MOBILE: '56px',
    MAX_WIDTH: '1200px',
    PADDING_HORIZONTAL: '20px',
    PADDING_HORIZONTAL_MOBILE: '15px',
    BUTTON_SIZE: '40px',
    BUTTON_SIZE_MOBILE: '36px',
    AVATAR_SIZE: '36px',
    AVATAR_SIZE_MOBILE: '32px',
    BORDER_RADIUS: '8px',
    BORDER_RADIUS_LARGE: '12px',
    BORDER_RADIUS_ROUND: '50%',
    GAP: '12px',
    GAP_MOBILE: '8px',
  },
  
  // 폰트
  FONTS: {
    LOGO_SIZE: '1.2rem',
    LOGO_SIZE_MOBILE: '1.1rem',
    LOGO_ICON_SIZE: '1.5rem',
    LOGO_ICON_SIZE_MOBILE: '1.3rem',
    USER_NAME_SIZE: '14px',
    USER_NAME_SIZE_MOBILE: '13px',
    USER_ROLE_SIZE: '12px',
    USER_ROLE_SIZE_MOBILE: '11px',
    USER_ROLE_EN_SIZE: '10px',
    USER_ROLE_EN_SIZE_MOBILE: '9px',
    BRANCH_SIZE: '11px',
    BRANCH_SIZE_MOBILE: '10px',
    LOADING_SIZE: '14px',
    BUTTON_SIZE: '14px',
    BUTTON_SIZE_MOBILE: '13px',
    ICON_SIZE: '16px',
    ICON_SIZE_LARGE: '18px',
    ICON_SIZE_MOBILE: '14px',
    AVATAR_ICON_SIZE: '24px',
    AVATAR_ICON_SIZE_MOBILE: '20px',
  },
  
  // 그림자
  SHADOWS: {
    HEADER: '0 2px 4px rgba(0, 0, 0, 0.1)',
    LOGOUT_BUTTON: '0 4px 15px rgba(220, 53, 69, 0.4)',
    LOGOUT_BUTTON_HOVER: '0 6px 20px rgba(220, 53, 69, 0.6)',
  },
  
  // Z-인덱스
  Z_INDEX: {
    HEADER: 1000,
    LOGOUT_BUTTON: 99999,
  },
  
  // 애니메이션
  ANIMATIONS: {
    TRANSITION: '0.2s ease',
    TRANSITION_SLOW: '0.3s ease',
    SPIN_DURATION: '1s',
    PULSE_DURATION: '2s',
  },
};

// 반응형 브레이크포인트
export const HEADER_BREAKPOINTS = {
  MOBILE: '768px',
  TABLET: '1024px',
};

// Header 상태별 스타일
export const HEADER_STATES = {
  LOADING: {
    opacity: '0.7',
    cursor: 'not-allowed',
  },
  HOVER: {
    transform: 'translateY(-1px)',
    scale: '1.05',
  },
  ACTIVE: {
    transform: 'scale(0.95)',
  },
};

// 아이콘 매핑
export const HEADER_ICONS = {
  BACK: 'bi-arrow-left',
  LOGO: 'bi-flower1',
  LOADING: 'bi-hourglass-split',
  USER_DEFAULT: 'bi-person-circle',
  HAMBURGER: 'bi-list',
  LOGIN: 'bi-box-arrow-in-right',
  LOGOUT: 'bi-box-arrow-right',
  CLOSE: 'bi-x',
  CHECK: 'bi-check-circle',
  BRANCH: 'bi-geo-alt',
};

// 텍스트 상수
export const HEADER_TEXTS = {
  LOADING: '로딩 중...',
  LOGIN: '로그인',
  LOGOUT: '로그아웃',
  BACK_TITLE: '뒤로가기',
  MENU_TITLE: '메뉴',
  DEFAULT_USER: '사용자',
  TEST_BUTTON: '테스트',
  BRAND_NAME: 'MindGarden',
};

// 기본 설정
export const HEADER_DEFAULTS = {
  SHOW_BACK_BUTTON_PATHS: ['/', '/login', '/register'],
  MAIN_DASHBOARD_PATHS: [
    '/admin/dashboard',
    '/consultant/dashboard', 
    '/client/dashboard',
    '/super_admin/dashboard'
  ],
};
