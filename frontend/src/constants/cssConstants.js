/**
 * CSS 상수 관리 시스템
/**
 * 모든 CSS 관련 상수를 중앙 집중식으로 관리
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

export const COLORS = {
  PRIMARY: 'var(--mg-primary-500)',
  SECONDARY: 'var(--mg-secondary-600)',
  SUCCESS: 'var(--mg-success-500)',
  WARNING: 'var(--mg-warning-500)',
  ERROR: 'var(--mg-error-500)',
  INFO: 'var(--mg-primary-500)',
  
  BACKGROUND: {
    PRIMARY: 'var(--mg-white)',
    SECONDARY: 'var(--mg-gray-100)',
    TERTIARY: 'var(--mg-gray-100)',
    DARK: 'var(--cs-gray-800)',
    LIGHT: 'var(--mg-white)'
  },
  
  TEXT: {
    PRIMARY: 'var(--mg-gray-800)',
    SECONDARY: 'var(--mg-gray-600)',
    MUTED: 'var(--mg-gray-500)',
    LIGHT: 'var(--mg-white)',
    DARK: 'var(--mg-black)'
  },
  
  BORDER: {
    DEFAULT: 'var(--mg-gray-300)',
    LIGHT: 'var(--cs-gray-100)',
    DARK: 'var(--cs-gray-300)',
    FOCUS: 'var(--mg-primary-500)'
  },
  
  STATUS: {
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    ACTIVE: 'var(--mg-success-500)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    INACTIVE: 'var(--cs-gray-500)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    PENDING: 'var(--mg-warning-500)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    COMPLETED: 'var(--mg-success-500)',
    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
    CANCELLED: 'var(--mg-error-500)'
  },
  
  PERFORMANCE: {
    EXCELLENT: 'var(--mg-success-500)',
    GOOD: 'var(--mg-success-400)',
    AVERAGE: 'var(--mg-warning-500)',
    POOR: 'var(--mg-error-500)',
    CRITICAL: 'var(--mg-error-700)'
  }
};

export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '16px',
  LG: '24px',
  XL: '32px',
  XXL: '48px',
  XXXL: '64px'
};

export const TYPOGRAPHY = {
  FONT_FAMILY: {
    PRIMARY: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    MONOSPACE: '"Fira Code", "Monaco", "Consolas", monospace'
  },
  
  FONT_SIZE: {
    XS: '0.75rem',    // 12px
    SM: '0.875rem',   // 14px
    BASE: '1rem',     // 16px
    LG: '1.125rem',   // 18px
    XL: '1.25rem',    // 20px
    XXL: '1.5rem',    // 24px
    XXXL: '2rem',     // 32px
    DISPLAY: '3rem'   // 48px
  },
  
  FONT_WEIGHT: {
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
    EXTRABOLD: 800
  },
  
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.8
  }
};

export const LAYOUT = {
  BORDER_RADIUS: {
    NONE: '0',
    SM: '4px',
    DEFAULT: '8px',
    LG: '12px',
    XL: '16px',
    FULL: '9999px'
  },
  
  SHADOW: {
    NONE: 'none',
    SM: '0 1px 3px var(--mg-shadow-light)',
    DEFAULT: '0 2px 8px var(--mg-shadow-light)',
    LG: '0 4px 12px var(--mg-shadow-light)',
    XL: '0 8px 24px var(--mg-shadow-medium)',
    INNER: 'inset 0 2px 4px var(--mg-shadow-light)'
  },
  
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1010,
    FIXED: 1020,
    MODAL_BACKDROP: 1030,
    MODAL: 1040,
    POPOVER: 1050,
    TOOLTIP: 1060,
    NOTIFICATION: 1070
  },
  
  BREAKPOINTS: {
    SM: '576px',
    MD: '768px',
    LG: '992px',
    XL: '1200px',
    XXL: '1400px'
  },
  
  CONTAINER: {
    MAX_WIDTH: '1200px',
    PADDING: '16px'
  }
};

export const ANIMATION = {
  DURATION: {
    FAST: '0.15s',
    DEFAULT: '0.3s',
    SLOW: '0.5s'
  },
  
  EASING: {
    DEFAULT: 'ease',
    IN: 'ease-in',
    OUT: 'ease-out',
    IN_OUT: 'ease-in-out',
    BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  TRANSFORM: {
    SCALE_UP: 'scale(1.05)',
    SCALE_DOWN: 'scale(0.95)',
    TRANSLATE_UP: 'translateY(-2px)',
    TRANSLATE_DOWN: 'translateY(2px)'
  }
};

export const COMPONENT_STYLES = {
  BUTTON: {
    HEIGHT: {
      SM: '32px',
      DEFAULT: '40px',
      LG: '48px'
    },
    PADDING: {
      SM: '8px 16px',
      DEFAULT: '12px 24px',
      LG: '16px 32px'
    }
  },
  
  INPUT: {
    HEIGHT: {
      SM: '32px',
      DEFAULT: '40px',
      LG: '48px'
    },
    PADDING: '12px 16px'
  },
  
  CARD: {
    PADDING: SPACING.LG,
    BORDER_RADIUS: LAYOUT.BORDER_RADIUS.LG,
    SHADOW: LAYOUT.SHADOW.DEFAULT
  },
  
  MODAL: {
    MAX_WIDTH: '600px',
    PADDING: SPACING.XL,
    BORDER_RADIUS: LAYOUT.BORDER_RADIUS.LG
  },
  
  WIDGET: {
    MIN_HEIGHT: '200px',
    PADDING: SPACING.LG,
    BORDER_RADIUS: LAYOUT.BORDER_RADIUS.LG,
    SHADOW: LAYOUT.SHADOW.DEFAULT
  }
};

export const STATE_STYLES = {
  HOVER: {
    TRANSFORM: ANIMATION.TRANSFORM.TRANSLATE_UP,
    SHADOW: LAYOUT.SHADOW.LG,
    TRANSITION: `all ${ANIMATION.DURATION.DEFAULT} ${ANIMATION.EASING.DEFAULT}`
  },
  
  FOCUS: {
    OUTLINE: `2px solid ${COLORS.PRIMARY}`,
    OUTLINE_OFFSET: '2px'
  },
  
  DISABLED: {
    OPACITY: '0.6',
    CURSOR: 'not-allowed'
  },
  
  LOADING: {
    OPACITY: '0.7',
    CURSOR: 'wait'
  }
};

export const generateCSSVariables = () => {
  const cssVars = {};
  
  Object.entries(COLORS).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        cssVars[`--color-${key.toLowerCase()}-${subKey.toLowerCase()}`] = subValue;
      });
    } else {
      cssVars[`--color-${key.toLowerCase()}`] = value;
    }
  });
  
  Object.entries(SPACING).forEach(([key, value]) => {
    cssVars[`--spacing-${key.toLowerCase()}`] = value;
  });
  
  Object.entries(TYPOGRAPHY.FONT_SIZE).forEach(([key, value]) => {
    cssVars[`--font-size-${key.toLowerCase()}`] = value;
  });
  
  Object.entries(TYPOGRAPHY.FONT_WEIGHT).forEach(([key, value]) => {
    cssVars[`--font-weight-${key.toLowerCase()}`] = value;
  });
  
  Object.entries(LAYOUT.BORDER_RADIUS).forEach(([key, value]) => {
    cssVars[`--border-radius-${key.toLowerCase()}`] = value;
  });
  
  Object.entries(LAYOUT.SHADOW).forEach(([key, value]) => {
    cssVars[`--shadow-${key.toLowerCase()}`] = value;
  });
  
  return cssVars;
};

export const CSS_UTILS = {
  mediaQuery: (breakpoint) => `@media (min-width: ${LAYOUT.BREAKPOINTS[breakpoint]})`,
  
  gridColumns: (columns) => `repeat(${columns}, 1fr)`,
  
  flexCenter: 'display: flex; align-items: center; justify-content: center;',
  flexBetween: 'display: flex; align-items: center; justify-content: space-between;',
  
  textEllipsis: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
  
  visuallyHidden: 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;'
};

export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  LAYOUT,
  ANIMATION,
  COMPONENT_STYLES,
  STATE_STYLES,
  generateCSSVariables,
  CSS_UTILS
};
