 * 공통 CSS 스타일 상수
 * @description 프로젝트 전반에서 사용되는 공통 CSS 스타일 상수들
 * @author MindGarden Team
 * @version 1.0.0
 */

export const COMMON_COLORS = {
  PRIMARY: 'var(--mg-consultant-dark)',
  PRIMARY_LIGHT: 'var(--cs-brand-primary-light)',
  PRIMARY_HOVER: 'var(--cs-brand-primary-hover-bg)',
  PRIMARY_DARK: 'var(--cs-brand-primary-hover)',
  
  WHITE: 'var(--mg-white)',
  BLACK: 'var(--mg-black)',
  TRANSPARENT: 'transparent',
  
  GRAY_50: 'var(--cs-gray-50)',
  GRAY_100: 'var(--cs-gray-100)',
  GRAY_200: 'var(--cs-gray-200)',
  GRAY_300: 'var(--cs-gray-300)',
  GRAY_400: 'var(--cs-gray-400)',
  GRAY_500: 'var(--cs-gray-500)',
  GRAY_600: 'var(--cs-gray-600)',
  GRAY_700: 'var(--cs-gray-700)',
  GRAY_800: 'var(--cs-gray-800)',
  GRAY_900: 'var(--cs-gray-900)',
  
  TEXT_PRIMARY: 'var(--mg-gray-800)',
  TEXT_SECONDARY: 'var(--mg-gray-600)',
  TEXT_MUTED: 'var(--mg-gray-500)',
  TEXT_LIGHT: 'var(--mg-white)',
  TEXT_DARK: 'var(--mg-black)',
  
  BG_PRIMARY: 'var(--mg-white)',
  BG_SECONDARY: 'var(--mg-gray-100)',
  BG_LIGHT: 'var(--mg-gray-100)',
  BG_DARK: 'var(--cs-bg-dark)',
  BG_HOVER: 'var(--cs-bg-hover)',
  BG_OVERLAY: 'var(--mg-overlay)',
  
  BORDER_PRIMARY: 'var(--mg-gray-300)',
  BORDER_SECONDARY: 'var(--cs-border-secondary)',
  BORDER_LIGHT: 'var(--cs-border-light)',
  BORDER_DARK: 'var(--cs-gray-300)',
  
  SUCCESS: 'var(--mg-success-500)',
  SUCCESS_LIGHT: 'var(--cs-success-100)',
  WARNING: 'var(--mg-warning-500)',
  WARNING_LIGHT: 'var(--cs-warning-100)',
  ERROR: 'var(--mg-error-500)',
  ERROR_LIGHT: 'var(--cs-error-100)',
  INFO: 'var(--mg-info-500)',
  INFO_LIGHT: 'var(--cs-blue-100)',
  
  BRAND_PRIMARY: 'var(--mg-consultant-dark)',
  BRAND_SECONDARY: 'var(--mg-consultant-primary)',
  BRAND_ACCENT: 'var(--cs-brand-accent)',
};

export const COMMON_SIZES = {
  SPACING_XS: '4px',
  SPACING_SM: '8px',
  SPACING_MD: '12px',
  SPACING_LG: '16px',
  SPACING_XL: '20px',
  SPACING_XXL: '24px',
  SPACING_XXXL: '32px',
  
  FONT_XS: '10px',
  FONT_SM: '12px',
  FONT_MD: '14px',
  FONT_LG: '16px',
  FONT_XL: '18px',
  FONT_XXL: '20px',
  FONT_XXXL: '24px',
  FONT_HUGE: '32px',
  
  ICON_XS: '12px',
  ICON_SM: '14px',
  ICON_MD: '16px',
  ICON_LG: '18px',
  ICON_XL: '20px',
  ICON_XXL: '24px',
  ICON_XXXL: '32px',
  
  BUTTON_SM: '32px',
  BUTTON_MD: '40px',
  BUTTON_LG: '48px',
  BUTTON_XL: '56px',
  
  RADIUS_SM: '4px',
  RADIUS_MD: '6px',
  RADIUS_LG: '8px',
  RADIUS_XL: '12px',
  RADIUS_XXL: '16px',
  RADIUS_ROUND: '50%',
  RADIUS_PILL: '9999px',
  
  CONTAINER_SM: '576px',
  CONTAINER_MD: '768px',
  CONTAINER_LG: '992px',
  CONTAINER_XL: '1200px',
  CONTAINER_XXL: '1400px',
};

export const COMMON_SHADOWS = {
  NONE: 'none',
  XS: 'var(--cs-shadow-xs)',
  SM: 'var(--cs-shadow-sm-multi)',
  MD: 'var(--cs-shadow-md-multi)',
  LG: 'var(--cs-shadow-lg-multi)',
  XL: 'var(--cs-shadow-xl-multi)',
  XXL: 'var(--cs-shadow-xxl)',
  INNER: 'var(--cs-shadow-inner)',
  OUTLINE: 'var(--cs-shadow-outline)',
};

export const COMMON_ANIMATIONS = {
  DURATION_FAST: '0.15s',
  DURATION_NORMAL: '0.2s',
  DURATION_SLOW: '0.3s',
  DURATION_SLOWER: '0.5s',
  
  EASE_LINEAR: 'linear',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  EASE_BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  TRANSITION_ALL: 'all 0.2s ease',
  TRANSITION_COLORS: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
  TRANSITION_TRANSFORM: 'transform 0.2s ease',
  TRANSITION_OPACITY: 'opacity 0.2s ease',
};

export const COMMON_Z_INDEX = {
  BEHIND: -1,
  NORMAL: 1,
  TOOLTIP: 10,
  FIXED: 100,
  STICKY: 200,
  OVERLAY: 1000,
  MODAL: 1050,
  POPOVER: 1060,
  TOAST: 9999,
  EMERGENCY: 99999,
};

export const COMMON_BREAKPOINTS = {
  XS: '0px',
  SM: '576px',
  MD: '768px',
  LG: '992px',
  XL: '1200px',
  XXL: '1400px',
};

export const COMMON_FONTS = {
  FAMILY_PRIMARY: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  FAMILY_SECONDARY: "'Noto Sans KR', sans-serif",
  FAMILY_MONO: "'JetBrains Mono', 'Fira Code', monospace",
  
  WEIGHT_THIN: 100,
  WEIGHT_LIGHT: 300,
  WEIGHT_NORMAL: 400,
  WEIGHT_MEDIUM: 500,
  WEIGHT_SEMIBOLD: 600,
  WEIGHT_BOLD: 700,
  WEIGHT_EXTRABOLD: 800,
  WEIGHT_BLACK: 900,
  
  LINE_HEIGHT_TIGHT: 1.2,
  LINE_HEIGHT_NORMAL: 1.4,
  LINE_HEIGHT_RELAXED: 1.6,
  LINE_HEIGHT_LOOSE: 1.8,
};

export const COMMON_LAYOUTS = {
  FLEX_CENTER: 'display: flex; align-items: center; justify-content: center;',
  FLEX_START: 'display: flex; align-items: center; justify-content: flex-start;',
  FLEX_END: 'display: flex; align-items: center; justify-content: flex-end;',
  FLEX_BETWEEN: 'display: flex; align-items: center; justify-content: space-between;',
  FLEX_AROUND: 'display: flex; align-items: center; justify-content: space-around;',
  FLEX_COLUMN: 'display: flex; flex-direction: column;',
  FLEX_COLUMN_CENTER: 'display: flex; flex-direction: column; align-items: center; justify-content: center;',
  
  GRID_AUTO: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));',
  GRID_2_COL: 'display: grid; grid-template-columns: repeat(2, 1fr);',
  GRID_3_COL: 'display: grid; grid-template-columns: repeat(3, 1fr);',
  GRID_4_COL: 'display: grid; grid-template-columns: repeat(4, 1fr);',
  
  ABSOLUTE_CENTER: 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);',
  FIXED_TOP: 'position: fixed; top: 0; left: 0; right: 0;',
  FIXED_BOTTOM: 'position: fixed; bottom: 0; left: 0; right: 0;',
  STICKY_TOP: 'position: sticky; top: 0;',
};

export const COMMON_UTILITIES = {
  HIDDEN: 'display: none;',
  VISIBLE: 'display: block;',
  INVISIBLE: 'visibility: hidden;',
  
  TEXT_CENTER: 'text-align: center;',
  TEXT_LEFT: 'text-align: left;',
  TEXT_RIGHT: 'text-align: right;',
  TEXT_TRUNCATE: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
  TEXT_UPPERCASE: 'text-transform: uppercase;',
  TEXT_LOWERCASE: 'text-transform: lowercase;',
  TEXT_CAPITALIZE: 'text-transform: capitalize;',
  
  OVERFLOW_HIDDEN: 'overflow: hidden;',
  OVERFLOW_AUTO: 'overflow: auto;',
  OVERFLOW_SCROLL: 'overflow: scroll;',
  OVERFLOW_X_AUTO: 'overflow-x: auto;',
  OVERFLOW_Y_AUTO: 'overflow-y: auto;',
  
  CURSOR_POINTER: 'cursor: pointer;',
  CURSOR_NOT_ALLOWED: 'cursor: not-allowed;',
  CURSOR_GRAB: 'cursor: grab;',
  CURSOR_GRABBING: 'cursor: grabbing;',
  
  USER_SELECT_NONE: 'user-select: none;',
  USER_SELECT_ALL: 'user-select: all;',
  USER_SELECT_TEXT: 'user-select: text;',
};

export const COMMON_STATES = {
  LOADING: {
    opacity: '0.7',
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  DISABLED: {
    opacity: '0.6',
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  HOVER: {
    transform: 'translateY(-1px)',
    boxShadow: COMMON_SHADOWS.MD,
  },
  // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
  ACTIVE: {
    transform: 'scale(0.98)',
  },
  FOCUS: {
    outline: 'none',
    boxShadow: COMMON_SHADOWS.OUTLINE,
  },
};
