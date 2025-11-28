/**
 * CSS 상수 관리 시스템
 * 모든 CSS 관련 상수를 중앙 집중식으로 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */

// ===== 색상 시스템 =====
export const COLORS = {
  // 기본 색상
  PRIMARY: '#2196F3',
  SECONDARY: '#1976D2',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  
  // 배경 색상
  BACKGROUND: {
    PRIMARY: '#ffffff',
    SECONDARY: '#f8f9fa',
    TERTIARY: '#f5f5f5',
    DARK: '#343a40',
    LIGHT: '#ffffff'
  },
  
  // 텍스트 색상
  TEXT: {
    PRIMARY: '#333333',
    SECONDARY: '#666666',
    MUTED: '#999999',
    LIGHT: '#ffffff',
    DARK: '#000000'
  },
  
  // 테두리 색상
  BORDER: {
    DEFAULT: '#e0e0e0',
    LIGHT: '#f0f0f0',
    DARK: '#cccccc',
    FOCUS: '#2196F3'
  },
  
  // 상태별 색상
  STATUS: {
    ACTIVE: '#4CAF50',
    INACTIVE: '#9E9E9E',
    PENDING: '#FF9800',
    COMPLETED: '#4CAF50',
    CANCELLED: '#F44336'
  },
  
  // 성능 지표 색상
  PERFORMANCE: {
    EXCELLENT: '#4CAF50',
    GOOD: '#8BC34A',
    AVERAGE: '#FF9800',
    POOR: '#F44336',
    CRITICAL: '#D32F2F'
  }
};

// ===== 간격 시스템 =====
export const SPACING = {
  XS: '4px',
  SM: '8px',
  MD: '16px',
  LG: '24px',
  XL: '32px',
  XXL: '48px',
  XXXL: '64px'
};

// ===== 폰트 시스템 =====
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

// ===== 레이아웃 시스템 =====
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
    SM: '0 1px 3px rgba(0, 0, 0, 0.1)',
    DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.1)',
    LG: '0 4px 12px rgba(0, 0, 0, 0.1)',
    XL: '0 8px 24px rgba(0, 0, 0, 0.15)',
    INNER: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
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

// ===== 애니메이션 시스템 =====
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

// ===== 컴포넌트별 상수 =====
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

// ===== 상태별 스타일 =====
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

// ===== CSS 변수 생성 함수 =====
export const generateCSSVariables = () => {
  const cssVars = {};
  
  // 색상 변수
  Object.entries(COLORS).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        cssVars[`--color-${key.toLowerCase()}-${subKey.toLowerCase()}`] = subValue;
      });
    } else {
      cssVars[`--color-${key.toLowerCase()}`] = value;
    }
  });
  
  // 간격 변수
  Object.entries(SPACING).forEach(([key, value]) => {
    cssVars[`--spacing-${key.toLowerCase()}`] = value;
  });
  
  // 타이포그래피 변수
  Object.entries(TYPOGRAPHY.FONT_SIZE).forEach(([key, value]) => {
    cssVars[`--font-size-${key.toLowerCase()}`] = value;
  });
  
  Object.entries(TYPOGRAPHY.FONT_WEIGHT).forEach(([key, value]) => {
    cssVars[`--font-weight-${key.toLowerCase()}`] = value;
  });
  
  // 레이아웃 변수
  Object.entries(LAYOUT.BORDER_RADIUS).forEach(([key, value]) => {
    cssVars[`--border-radius-${key.toLowerCase()}`] = value;
  });
  
  Object.entries(LAYOUT.SHADOW).forEach(([key, value]) => {
    cssVars[`--shadow-${key.toLowerCase()}`] = value;
  });
  
  return cssVars;
};

// ===== 유틸리티 함수 =====
export const CSS_UTILS = {
  // 반응형 브레이크포인트 생성
  mediaQuery: (breakpoint) => `@media (min-width: ${LAYOUT.BREAKPOINTS[breakpoint]})`,
  
  // 그리드 시스템
  gridColumns: (columns) => `repeat(${columns}, 1fr)`,
  
  // Flexbox 유틸리티
  flexCenter: 'display: flex; align-items: center; justify-content: center;',
  flexBetween: 'display: flex; align-items: center; justify-content: space-between;',
  
  // 텍스트 유틸리티
  textEllipsis: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;',
  
  // 시각적 숨김
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
