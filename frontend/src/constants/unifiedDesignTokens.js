/**
 * Core Solution 통합 디자인 토큰 (JavaScript)
/**
 * 
/**
 * CSS 변수와 연동되는 JavaScript 상수들
/**
 * 
/**
 * 생성일: 2025-11-28T06:10:04.412Z
/**
 * 자동 생성: scripts/create-unified-css-variables.js
/**
 * 
/**
 * ⚠️ 이 파일을 직접 수정하지 마세요.
 */

// CSS 변수 참조 객체
export const MG_DESIGN_TOKENS = {
  // 색상 시스템
  COLORS: {
    // PRIMARY
    __BG_PRIMARY: 'var(--bg-primary)',
    __BUTTON_PRIMARY_BG: 'var(--button-primary-bg)',
    __BUTTON_PRIMARY_HOVER: 'var(--button-primary-hover)',
    __BUTTON_PRIMARY_TEXT: 'var(--button-primary-text)',
    __COLOR_BACKGROUND_PRIMARY: 'var(--color-background-primary)',
    __COLOR_BG_PRIMARY: 'var(--color-bg-primary)',
    __COLOR_PRIMARY: 'var(--color-primary)',
    __COLOR_PRIMARY_DARK: 'var(--color-primary-dark)',
    __COLOR_PRIMARY_LIGHT: 'var(--color-primary-light)',
    __COLOR_PRIMARY_RGB: 'var(--color-primary-rgb)',
    __COLOR_TEXT_PRIMARY: 'var(--color-text-primary)',
    __FONT_FAMILY_PRIMARY: 'var(--font-family-primary)',
    __IOS_BG_PRIMARY: 'var(--ios-bg-primary)',
    __IOS_TEXT_PRIMARY: 'var(--ios-text-primary)',
    __IPAD_BG_PRIMARY: 'var(--ipad-bg-primary)',
    __IPAD_BTN_PRIMARY: 'var(--ipad-btn-primary)',
    __IPAD_TEXT_PRIMARY: 'var(--ipad-text-primary)',
    BG_PRIMARY: 'var(--mg-bg_primary)',
    BORDER_PRIMARY: 'var(--mg-border_primary)',
    BRAND_PRIMARY: 'var(--mg-brand_primary)',
    PRIMARY: 'var(--mg-primary)',
    PRIMARY_COLOR: 'var(--mg-primary_color)',
    PRIMARY_DARK: 'var(--mg-primary_dark)',
    TEXT_PRIMARY: 'var(--mg-text_primary)',
    __SHADOW_HOVER_PRIMARY: 'var(--shadow-hover-primary)',
    __TEXT_PRIMARY: 'var(--text-primary)',

    // SECONDARY
    __BG_SECONDARY: 'var(--bg-secondary)',
    __COLOR_BACKGROUND_SECONDARY: 'var(--color-background-secondary)',
    __COLOR_BG_SECONDARY: 'var(--color-bg-secondary)',
    __COLOR_SECONDARY: 'var(--color-secondary)',
    __COLOR_SECONDARY_DARK: 'var(--color-secondary-dark)',
    __COLOR_SECONDARY_LIGHT: 'var(--color-secondary-light)',
    __COLOR_SECONDARY_RGB: 'var(--color-secondary-rgb)',
    __COLOR_TEXT_SECONDARY: 'var(--color-text-secondary)',
    __IOS_BG_SECONDARY: 'var(--ios-bg-secondary)',
    __IOS_TEXT_SECONDARY: 'var(--ios-text-secondary)',
    __IPAD_BG_SECONDARY: 'var(--ipad-bg-secondary)',
    __IPAD_BTN_SECONDARY: 'var(--ipad-btn-secondary)',
    __IPAD_TEXT_SECONDARY: 'var(--ipad-text-secondary)',
    BG_SECONDARY: 'var(--mg-bg_secondary)',
    BORDER_SECONDARY: 'var(--mg-border_secondary)',
    BRAND_SECONDARY: 'var(--mg-brand_secondary)',
    SECONDARY: 'var(--mg-secondary)',
    SECONDARY_LIGHT: 'var(--mg-secondary_light)',
    TEXT_SECONDARY: 'var(--mg-text_secondary)',
    __TEXT_SECONDARY: 'var(--text-secondary)',

    // SUCCESS
    __COLOR_SUCCESS: 'var(--color-success)',
    __COLOR_SUCCESS_LIGHT: 'var(--color-success-light)',
    __IOS_GREEN: 'var(--ios-green)',
    __IPAD_GREEN: 'var(--ipad-green)',
    SUCCESS: 'var(--mg-success)',
    SUCCESS_COLOR: 'var(--mg-success_color)',
    SUCCESS_DARK: 'var(--mg-success_dark)',
    SUCCESS_LIGHT: 'var(--mg-success_light)',
    __MINT_GREEN: 'var(--mint-green)',
    __OLIVE_GREEN: 'var(--olive-green)',
    __STATUS_SUCCESS: 'var(--status-success)',
    __STATUS_SUCCESS_BG: 'var(--status-success-bg)',
    __STATUS_SUCCESS_BORDER: 'var(--status-success-border)',
    __STATUS_SUCCESS_DARK: 'var(--status-success-dark)',
    __STATUS_SUCCESS_LIGHT: 'var(--status-success-light)',
    __STATUS_SUCCESS_RGB: 'var(--status-success-rgb)',

    // ERROR
    __COLOR_DANGER: 'var(--color-danger)',
    __COLOR_DANGER_LIGHT: 'var(--color-danger-light)',
    __COLOR_ERROR: 'var(--color-error)',
    __IOS_RED: 'var(--ios-red)',
    __IPAD_RED: 'var(--ipad-red)',
    DANGER: 'var(--mg-danger)',
    DANGER_COLOR: 'var(--mg-danger_color)',
    DANGER_DARK: 'var(--mg-danger_dark)',
    DANGER_LIGHT: 'var(--mg-danger_light)',
    ERROR: 'var(--mg-error)',
    ERROR_LIGHT: 'var(--mg-error_light)',
    __STATUS_ERROR: 'var(--status-error)',
    __STATUS_ERROR_BG: 'var(--status-error-bg)',
    __STATUS_ERROR_BORDER: 'var(--status-error-border)',
    __STATUS_ERROR_DARK: 'var(--status-error-dark)',
    __STATUS_ERROR_LIGHT: 'var(--status-error-light)',
    __STATUS_ERROR_RGB: 'var(--status-error-rgb)',

    // WARNING
    __COLOR_ORANGE: 'var(--color-orange)',
    __COLOR_ORANGE_DARK: 'var(--color-orange-dark)',
    __COLOR_ORANGE_LIGHT: 'var(--color-orange-light)',
    __COLOR_WARNING: 'var(--color-warning)',
    __COLOR_WARNING_DARK: 'var(--color-warning-dark)',
    __COLOR_WARNING_LIGHT: 'var(--color-warning-light)',
    __IOS_ORANGE: 'var(--ios-orange)',
    __IOS_YELLOW: 'var(--ios-yellow)',
    __IPAD_ORANGE: 'var(--ipad-orange)',
    __IPAD_YELLOW: 'var(--ipad-yellow)',
    WARNING: 'var(--mg-warning)',
    WARNING_COLOR: 'var(--mg-warning_color)',
    WARNING_DARK: 'var(--mg-warning_dark)',
    WARNING_LIGHT: 'var(--mg-warning_light)',
    __STATUS_WARNING: 'var(--status-warning)',
    __STATUS_WARNING_BG: 'var(--status-warning-bg)',
    __STATUS_WARNING_DARK: 'var(--status-warning-dark)',
    __STATUS_WARNING_LIGHT: 'var(--status-warning-light)',
    __STATUS_WARNING_RGB: 'var(--status-warning-rgb)',

    // INFO
    __COLOR_INFO: 'var(--color-info)',
    __COLOR_INFO_LIGHT: 'var(--color-info-light)',
    __IOS_BLUE: 'var(--ios-blue)',
    __IPAD_BLUE: 'var(--ipad-blue)',
    INFO: 'var(--mg-info)',
    INFO_COLOR: 'var(--mg-info_color)',
    INFO_DARK: 'var(--mg-info_dark)',
    INFO_LIGHT: 'var(--mg-info_light)',
    __STATUS_INFO: 'var(--status-info)',
    __STATUS_INFO_BG: 'var(--status-info-bg)',
    __STATUS_INFO_DARK: 'var(--status-info-dark)',
    __STATUS_INFO_LIGHT: 'var(--status-info-light)',
    __STATUS_INFO_RGB: 'var(--status-info-rgb)',

    // GRAY
    __COLOR_GRAY: 'var(--color-gray)',
    __COLOR_GRAY_DARK: 'var(--color-gray-dark)',
    __COLOR_GRAY_LIGHT: 'var(--color-gray-light)',
    __DARK_GRAY: 'var(--dark-gray)',
    __GRADIENT_GRAY: 'var(--gradient-gray)',
    __GRADIENT_GRAY_END: 'var(--gradient-gray-end)',
    __GRADIENT_GRAY_START: 'var(--gradient-gray-start)',
    __IOS_GRAY: 'var(--ios-gray)',
    __IPAD_GRAY: 'var(--ipad-gray)',
    __MEDIUM_GRAY: 'var(--medium-gray)',
    GRAY_DARK: 'var(--mg-gray_dark)',
    GRAY_LIGHT: 'var(--mg-gray_light)',
    GRAY_MEDIUM: 'var(--mg-gray_medium)',

  },
  
  // CSS 클래스 생성 헬퍼
  CSS_CLASSES: {
    // 색상 클래스 생성
    getBgClass: (color) => `mg-bg-${color}`,
    getTextClass: (color) => `mg-text-${color}`,
    getBorderClass: (color) => `mg-border-${color}`,
  },
  
  // 유틸리티 함수
  UTILS: {
    // CSS 변수 값 가져오기
    getCSSVariable: (name) => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(name).trim();
    },
    
    // CSS 변수 설정
    setCSSVariable: (name, value) => {
      document.documentElement.style.setProperty(name, value);
    }
  }
};

// 호환성을 위한 기존 상수들 (Deprecated)
export const COLORS = {
  PRIMARY: 'var(--mg-primary-500)',
  SECONDARY: 'var(--mg-secondary-500)',
  SUCCESS: 'var(--mg-success-500)',
  ERROR: 'var(--mg-error-500)',
  WARNING: 'var(--mg-warning-500)',
  INFO: 'var(--mg-info-500)'
};

export default MG_DESIGN_TOKENS;
