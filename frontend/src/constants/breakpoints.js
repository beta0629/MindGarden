/**
 * 반응형 브레이크포인트 상수
 * 모바일 우선 접근법 사용
 */

import { UI_CONSTANTS } from './magicNumbers';

/** max-width 계열에서 1px 겹침 방지 */
const MEDIA_EDGE_PX = 1;

/**
 * 브레이크포인트 정의
 */
export const BREAKPOINTS = {
  MOBILE: 0,
  TABLET: UI_CONSTANTS.MAX_MOBILE_WIDTH,
  DESKTOP: UI_CONSTANTS.MAX_TABLET_WIDTH,
  LARGE: 1280,
  XLARGE: 1536
};

/**
 * 브레이크포인트 값 (px)
 */
export const BREAKPOINT_VALUES = {
  MOBILE: '0px',
  TABLET: '768px',
  DESKTOP: '1024px',
  LARGE: '1280px',
  XLARGE: '1536px'
};

/**
 * 디바이스 타입
 */
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
  LARGE: 'large',
  XLARGE: 'xlarge'
};

/**
 * 미디어 쿼리 문자열
 */
export const MEDIA_QUERIES = {
  MOBILE_ONLY: `(max-width: ${BREAKPOINTS.TABLET - MEDIA_EDGE_PX}px)`,
  TABLET_ONLY: `(min-width: ${BREAKPOINTS.TABLET}px) and (max-width: ${BREAKPOINTS.DESKTOP - MEDIA_EDGE_PX}px)`,
  DESKTOP_ONLY: `(min-width: ${BREAKPOINTS.DESKTOP}px) and (max-width: ${BREAKPOINTS.LARGE - MEDIA_EDGE_PX}px)`,
  LARGE_ONLY: `(min-width: ${BREAKPOINTS.LARGE}px) and (max-width: ${BREAKPOINTS.XLARGE - MEDIA_EDGE_PX}px)`,
  XLARGE_ONLY: `(min-width: ${BREAKPOINTS.XLARGE}px)`,

  TABLET_UP: `(min-width: ${BREAKPOINTS.TABLET}px)`,
  DESKTOP_UP: `(min-width: ${BREAKPOINTS.DESKTOP}px)`,
  LARGE_UP: `(min-width: ${BREAKPOINTS.LARGE}px)`,
  XLARGE_UP: `(min-width: ${BREAKPOINTS.XLARGE}px)`,

  TABLET_DOWN: `(max-width: ${BREAKPOINTS.DESKTOP - MEDIA_EDGE_PX}px)`,
  DESKTOP_DOWN: `(max-width: ${BREAKPOINTS.LARGE - MEDIA_EDGE_PX}px)`,
  LARGE_DOWN: `(max-width: ${BREAKPOINTS.XLARGE - MEDIA_EDGE_PX}px)`
};

/**
 * 반응형 간격
 */
export const RESPONSIVE_SPACING = {
  MOBILE: {
    CARD_PADDING: '12px',
    CARD_GAP: '12px',
    SECTION_PADDING: '16px',
    GRID_GAP: '8px',
    BUTTON_PADDING: '8px 16px',
    INPUT_PADDING: '8px 12px'
  },
  TABLET: {
    CARD_PADDING: '16px',
    CARD_GAP: '16px',
    SECTION_PADDING: '20px',
    GRID_GAP: '12px',
    BUTTON_PADDING: '10px 20px',
    INPUT_PADDING: '10px 14px'
  },
  DESKTOP: {
    CARD_PADDING: '20px',
    CARD_GAP: '20px',
    SECTION_PADDING: '24px',
    GRID_GAP: '16px',
    BUTTON_PADDING: '12px 24px',
    INPUT_PADDING: '12px 16px'
  },
  LARGE: {
    CARD_PADDING: '24px',
    CARD_GAP: '24px',
    SECTION_PADDING: '32px',
    GRID_GAP: '20px',
    BUTTON_PADDING: '14px 28px',
    INPUT_PADDING: '14px 18px'
  }
};

/**
 * 반응형 타이포그래피
 */
export const RESPONSIVE_TYPOGRAPHY = {
  MOBILE: {
    H1: '1.5rem',
    H2: '1.25rem',
    H3: '1.125rem',
    H4: '1rem',
    H5: '0.875rem',
    H6: '0.75rem',
    BODY: '0.875rem',
    SMALL: '0.75rem'
  },
  TABLET: {
    H1: '2rem',
    H2: '1.5rem',
    H3: '1.25rem',
    H4: '1.125rem',
    H5: '1rem',
    H6: '0.875rem',
    BODY: '1rem',
    SMALL: '0.875rem'
  },
  DESKTOP: {
    H1: '2.5rem',
    H2: '2rem',
    H3: '1.5rem',
    H4: '1.25rem',
    H5: '1.125rem',
    H6: '1rem',
    BODY: '1rem',
    SMALL: '0.875rem'
  }
};

/**
 * 반응형 그리드
 */
export const RESPONSIVE_GRID = {
  MOBILE: {
    COLUMNS: UI_CONSTANTS.GRID_COLUMNS_MOBILE,
    GAP: '12px',
    CARD_MIN_WIDTH: '280px'
  },
  TABLET: {
    COLUMNS: UI_CONSTANTS.GRID_COLUMNS_TABLET,
    GAP: '16px',
    CARD_MIN_WIDTH: '300px'
  },
  DESKTOP: {
    COLUMNS: UI_CONSTANTS.GRID_COLUMNS_DESKTOP,
    GAP: '20px',
    CARD_MIN_WIDTH: '320px'
  },
  LARGE: {
    COLUMNS: UI_CONSTANTS.GRID_COLUMNS_LARGE,
    GAP: '24px',
    CARD_MIN_WIDTH: '300px'
  }
};

/**
 * 터치 타겟 크기
 */
export const TOUCH_TARGETS = {
  MINIMUM: '44px',
  COMFORTABLE: '48px',
  LARGE: '56px'
};

/**
 * 디바이스 감지 헬퍼 함수
 */
export const getDeviceType = () => {
  const width = window.innerWidth;

  if (width < BREAKPOINTS.TABLET) return DEVICE_TYPES.MOBILE;
  if (width < BREAKPOINTS.DESKTOP) return DEVICE_TYPES.TABLET;
  if (width < BREAKPOINTS.LARGE) return DEVICE_TYPES.DESKTOP;
  if (width < BREAKPOINTS.XLARGE) return DEVICE_TYPES.LARGE;
  return DEVICE_TYPES.XLARGE;
};

export const isMobile = () => window.innerWidth < BREAKPOINTS.TABLET;

export const isTablet = () => {
  const width = window.innerWidth;
  return width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.DESKTOP;
};

export const isDesktop = () => window.innerWidth >= BREAKPOINTS.DESKTOP;

export const isTouchDevice = () => (
  'ontouchstart' in window || navigator.maxTouchPoints > 0
);

/**
 * 반응형 값 가져오기
 */
export const getResponsiveValue = (values, deviceType = null) => {
  const device = deviceType || getDeviceType();
  return values[device.toUpperCase()] || values.MOBILE;
};

export const getResponsiveSpacing = (type, deviceType = null) => (
  getResponsiveValue(RESPONSIVE_SPACING, deviceType)[type]
);

export const getResponsiveTypography = (element, deviceType = null) => (
  getResponsiveValue(RESPONSIVE_TYPOGRAPHY, deviceType)[element]
);

export const getResponsiveGrid = (property, deviceType = null) => (
  getResponsiveValue(RESPONSIVE_GRID, deviceType)[property]
);

/**
 * CSS 미디어 쿼리 생성
 */
export const createMediaQuery = (breakpoint, direction = 'up') => {
  if (direction === 'up') {
    return `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`;
  }
  return `@media (max-width: ${BREAKPOINTS[breakpoint] - MEDIA_EDGE_PX}px)`;
};

/**
 * 반응형 CSS 클래스 생성
 */
export const createResponsiveClass = (baseClass, breakpoint, direction = 'up') => {
  const mediaQuery = createMediaQuery(breakpoint, direction);
  return `${mediaQuery} {.${baseClass} {/* styles */}}`;
};

/**
 * 브레이크포인트 검증
 */
export const validateBreakpoint = (breakpoint) => Object.keys(BREAKPOINTS).includes(breakpoint);

/**
 * 디바이스별 최적화 설정
 */
export const DEVICE_OPTIMIZATIONS = {
  MOBILE: {
    enableTouchGestures: true,
    optimizeImages: true,
    lazyLoadImages: true,
    minimizeAnimations: false,
    enableHapticFeedback: true
  },
  TABLET: {
    enableTouchGestures: true,
    optimizeImages: true,
    lazyLoadImages: true,
    minimizeAnimations: false,
    enableHapticFeedback: false
  },
  DESKTOP: {
    enableTouchGestures: false,
    optimizeImages: false,
    lazyLoadImages: false,
    minimizeAnimations: false,
    enableHapticFeedback: false
  }
};

export const getDeviceOptimizations = (deviceType = null) => {
  const device = deviceType || getDeviceType();
  return DEVICE_OPTIMIZATIONS[device.toUpperCase()] || DEVICE_OPTIMIZATIONS.MOBILE;
};

export default {
  BREAKPOINTS,
  BREAKPOINT_VALUES,
  DEVICE_TYPES,
  MEDIA_QUERIES,
  RESPONSIVE_SPACING,
  RESPONSIVE_TYPOGRAPHY,
  RESPONSIVE_GRID,
  TOUCH_TARGETS,
  DEVICE_OPTIMIZATIONS
};
