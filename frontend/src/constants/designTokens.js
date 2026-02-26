/**
 * Core Solution 디자인 토큰
/**
 * 
/**
 * CSS 변수와 연동되는 디자인 시스템 토큰
/**
 * 모든 색상, 크기, 간격 등을 중앙에서 관리
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2025-11-28
 */

// 🎨 색상 토큰 (CSS 변수와 연동)
export const MG_DESIGN_TOKENS = {
  // 색상 시스템
  COLORS: {
    // 주요 색상
    PRIMARY: 'var(--mg-primary-500)',
    PRIMARY_LIGHT: 'var(--mg-primary-300)',
    PRIMARY_DARK: 'var(--mg-primary-700)',
    
    // 보조 색상
    SECONDARY: 'var(--mg-secondary-500)',
    SECONDARY_LIGHT: 'var(--mg-secondary-300)',
    SECONDARY_DARK: 'var(--mg-secondary-700)',
    
    // 상태 색상
    SUCCESS: 'var(--mg-success-500)',
    SUCCESS_LIGHT: 'var(--mg-success-300)',
    SUCCESS_DARK: 'var(--mg-success-700)',
    
    WARNING: 'var(--mg-warning-500)',
    WARNING_LIGHT: 'var(--mg-warning-300)',
    WARNING_DARK: 'var(--mg-warning-700)',
    
    ERROR: 'var(--mg-error-500)',
    ERROR_LIGHT: 'var(--mg-error-300)',
    ERROR_DARK: 'var(--mg-error-700)',
    
    INFO: 'var(--mg-info-500)',
    INFO_LIGHT: 'var(--mg-info-300)',
    INFO_DARK: 'var(--mg-info-700)',
    
    // 중성 색상
    WHITE: 'var(--mg-white)',
    BLACK: 'var(--mg-black)',
    
    GRAY_50: 'var(--mg-gray-50)',
    GRAY_100: 'var(--mg-gray-100)',
    GRAY_200: 'var(--mg-gray-200)',
    GRAY_300: 'var(--mg-gray-300)',
    GRAY_400: 'var(--mg-gray-400)',
    GRAY_500: 'var(--mg-gray-500)',
    GRAY_600: 'var(--mg-gray-600)',
    GRAY_700: 'var(--mg-gray-700)',
    GRAY_800: 'var(--mg-gray-800)',
    GRAY_900: 'var(--mg-gray-900)',
    
    // 배경 색상
    BACKGROUND: 'var(--mg-background)',
    SURFACE: 'var(--mg-surface)',
    SURFACE_VARIANT: 'var(--mg-surface-variant)'
  },
  
  // 타이포그래피
  TYPOGRAPHY: {
    // 폰트 크기
    FONT_SIZE_XS: 'var(--mg-font-size-xs)',
    FONT_SIZE_SM: 'var(--mg-font-size-sm)',
    FONT_SIZE_BASE: 'var(--mg-font-size-base)',
    FONT_SIZE_LG: 'var(--mg-font-size-lg)',
    FONT_SIZE_XL: 'var(--mg-font-size-xl)',
    FONT_SIZE_2XL: 'var(--mg-font-size-2xl)',
    FONT_SIZE_3XL: 'var(--mg-font-size-3xl)',
    
    // 폰트 굵기
    FONT_WEIGHT_LIGHT: 'var(--mg-font-weight-light)',
    FONT_WEIGHT_NORMAL: 'var(--mg-font-weight-normal)',
    FONT_WEIGHT_MEDIUM: 'var(--mg-font-weight-medium)',
    FONT_WEIGHT_SEMIBOLD: 'var(--mg-font-weight-semibold)',
    FONT_WEIGHT_BOLD: 'var(--mg-font-weight-bold)',
    
    // 라인 높이
    LINE_HEIGHT_TIGHT: 'var(--mg-line-height-tight)',
    LINE_HEIGHT_NORMAL: 'var(--mg-line-height-normal)',
    LINE_HEIGHT_RELAXED: 'var(--mg-line-height-relaxed)'
  },
  
  // 간격 시스템
  SPACING: {
    XS: 'var(--mg-spacing-xs)',
    SM: 'var(--mg-spacing-sm)',
    MD: 'var(--mg-spacing-md)',
    LG: 'var(--mg-spacing-lg)',
    XL: 'var(--mg-spacing-xl)',
    XXL: 'var(--mg-spacing-2xl)',
    XXXL: 'var(--mg-spacing-3xl)'
  },
  
  // 테두리 반지름
  BORDER_RADIUS: {
    NONE: 'var(--mg-border-radius-none)',
    SM: 'var(--mg-border-radius-sm)',
    MD: 'var(--mg-border-radius-md)',
    LG: 'var(--mg-border-radius-lg)',
    XL: 'var(--mg-border-radius-xl)',
    FULL: 'var(--mg-border-radius-full)'
  },
  
  // 그림자
  SHADOW: {
    NONE: 'var(--mg-shadow-none)',
    SM: 'var(--mg-shadow-sm)',
    MD: 'var(--mg-shadow-md)',
    LG: 'var(--mg-shadow-lg)',
    XL: 'var(--mg-shadow-xl)',
    INNER: 'var(--mg-shadow-inner)'
  },
  
  // 애니메이션 지속시간
  DURATION: {
    FAST: 'var(--mg-duration-fast)',
    NORMAL: 'var(--mg-duration-normal)',
    SLOW: 'var(--mg-duration-slow)'
  },
  
  // 이징 함수
  EASING: {
    EASE_IN: 'var(--mg-easing-ease-in)',
    EASE_OUT: 'var(--mg-easing-ease-out)',
    EASE_IN_OUT: 'var(--mg-easing-ease-in-out)'
  },
  
  // Z-Index 레이어
  Z_INDEX: {
    DROPDOWN: 'var(--mg-z-dropdown)',
    STICKY: 'var(--mg-z-sticky)',
    FIXED: 'var(--mg-z-fixed)',
    MODAL_BACKDROP: 'var(--mg-z-modal-backdrop)',
    MODAL: 'var(--mg-z-modal)',
    POPOVER: 'var(--mg-z-popover)',
    TOOLTIP: 'var(--mg-z-tooltip)'
  },
  
  // 버튼 변형
  BUTTON_VARIANTS: {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info',
    GHOST: 'ghost',
    OUTLINE: 'outline'
  },
  
  // 버튼 크기
  BUTTON_SIZES: {
    SMALL: 'sm',
    MEDIUM: 'md',
    LARGE: 'lg'
  },
  
  // 카드 변형
  CARD_VARIANTS: {
    DEFAULT: 'default',
    ELEVATED: 'elevated',
    OUTLINED: 'outlined',
    FILLED: 'filled'
  },
  
  // 알림 타입
  ALERT_TYPES: {
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    INFO: 'info'
  }
};

// 🎯 컴포넌트별 디자인 토큰
export const MG_COMPONENT_TOKENS = {
  // 위젯 컴포넌트
  WIDGET: {
    BACKGROUND: MG_DESIGN_TOKENS.COLORS.WHITE,
    BORDER: MG_DESIGN_TOKENS.COLORS.GRAY_200,
    BORDER_RADIUS: MG_DESIGN_TOKENS.BORDER_RADIUS.MD,
    SHADOW: MG_DESIGN_TOKENS.SHADOW.SM,
    PADDING: MG_DESIGN_TOKENS.SPACING.MD,
    
    HEADER: {
      BACKGROUND: MG_DESIGN_TOKENS.COLORS.GRAY_50,
      BORDER_BOTTOM: MG_DESIGN_TOKENS.COLORS.GRAY_200,
      PADDING: MG_DESIGN_TOKENS.SPACING.MD
    },
    
    TITLE: {
      COLOR: MG_DESIGN_TOKENS.COLORS.GRAY_900,
      FONT_SIZE: MG_DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE_LG,
      FONT_WEIGHT: MG_DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT_SEMIBOLD
    },
    
    SUBTITLE: {
      COLOR: MG_DESIGN_TOKENS.COLORS.GRAY_600,
      FONT_SIZE: MG_DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE_SM,
      FONT_WEIGHT: MG_DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT_NORMAL
    }
  },
  
  // StatCard 컴포넌트
  STAT_CARD: {
    BACKGROUND: MG_DESIGN_TOKENS.COLORS.WHITE,
    BORDER: MG_DESIGN_TOKENS.COLORS.GRAY_200,
    BORDER_RADIUS: MG_DESIGN_TOKENS.BORDER_RADIUS.MD,
    SHADOW: MG_DESIGN_TOKENS.SHADOW.SM,
    PADDING: MG_DESIGN_TOKENS.SPACING.MD,
    
    HOVER: {
      SHADOW: MG_DESIGN_TOKENS.SHADOW.MD,
      TRANSFORM: 'translateY(-2px)'
    },
    
    VALUE: {
      COLOR: MG_DESIGN_TOKENS.COLORS.GRAY_900,
      FONT_SIZE: MG_DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE_2XL,
      FONT_WEIGHT: MG_DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT_BOLD
    },
    
    LABEL: {
      COLOR: MG_DESIGN_TOKENS.COLORS.GRAY_600,
      FONT_SIZE: MG_DESIGN_TOKENS.TYPOGRAPHY.FONT_SIZE_SM,
      FONT_WEIGHT: MG_DESIGN_TOKENS.TYPOGRAPHY.FONT_WEIGHT_MEDIUM
    }
  },
  
  // 로딩 스피너
  LOADING_SPINNER: {
    SIZE: '24px',
    COLOR: MG_DESIGN_TOKENS.COLORS.PRIMARY,
    ANIMATION_DURATION: MG_DESIGN_TOKENS.DURATION.NORMAL
  },
  
  // 알림 컴포넌트
  ALERT: {
    BORDER_RADIUS: MG_DESIGN_TOKENS.BORDER_RADIUS.MD,
    PADDING: MG_DESIGN_TOKENS.SPACING.MD,
    
    SUCCESS: {
      BACKGROUND: MG_DESIGN_TOKENS.COLORS.SUCCESS_LIGHT,
      BORDER: MG_DESIGN_TOKENS.COLORS.SUCCESS,
      COLOR: MG_DESIGN_TOKENS.COLORS.SUCCESS_DARK
    },
    
    WARNING: {
      BACKGROUND: MG_DESIGN_TOKENS.COLORS.WARNING_LIGHT,
      BORDER: MG_DESIGN_TOKENS.COLORS.WARNING,
      COLOR: MG_DESIGN_TOKENS.COLORS.WARNING_DARK
    },
    
    ERROR: {
      BACKGROUND: MG_DESIGN_TOKENS.COLORS.ERROR_LIGHT,
      BORDER: MG_DESIGN_TOKENS.COLORS.ERROR,
      COLOR: MG_DESIGN_TOKENS.COLORS.ERROR_DARK
    },
    
    INFO: {
      BACKGROUND: MG_DESIGN_TOKENS.COLORS.INFO_LIGHT,
      BORDER: MG_DESIGN_TOKENS.COLORS.INFO,
      COLOR: MG_DESIGN_TOKENS.COLORS.INFO_DARK
    }
  }
};

// 🔧 디자인 토큰 유틸리티
export const MG_TOKEN_UTILS = {
  // CSS 변수 값 가져오기
  getCSSVariable: (variableName) => {
    if (typeof window !== 'undefined') {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(variableName)
        .trim();
    }
    return variableName;
  },
  
  // 색상 변형 생성
  getColorVariant: (baseColor, variant) => {
    const variants = {
      light: baseColor.replace('-500', '-300'),
      dark: baseColor.replace('-500', '-700'),
      lighter: baseColor.replace('-500', '-100'),
      darker: baseColor.replace('-500', '-900')
    };
    
    return variants[variant] || baseColor;
  },
  
  // 반응형 간격 계산
  getResponsiveSpacing: (base, multiplier = 1) => {
    return `calc(${base} * ${multiplier})`;
  },
  
  // 테마별 색상 반환
  getThemedColor: (colorName, theme = 'light') => {
    const themeColors = {
      light: {
        background: MG_DESIGN_TOKENS.COLORS.WHITE,
        surface: MG_DESIGN_TOKENS.COLORS.GRAY_50,
        text: MG_DESIGN_TOKENS.COLORS.GRAY_900,
        textMuted: MG_DESIGN_TOKENS.COLORS.GRAY_600
      },
      dark: {
        background: MG_DESIGN_TOKENS.COLORS.GRAY_900,
        surface: MG_DESIGN_TOKENS.COLORS.GRAY_800,
        text: MG_DESIGN_TOKENS.COLORS.WHITE,
        textMuted: MG_DESIGN_TOKENS.COLORS.GRAY_300
      }
    };
    
    return themeColors[theme]?.[colorName] || MG_DESIGN_TOKENS.COLORS[colorName.toUpperCase()];
  }
};

export default MG_DESIGN_TOKENS;
