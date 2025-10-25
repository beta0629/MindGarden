/**
 * 반응형 브레이크포인트 상수
 * 모바일 우선 접근법 사용
 */

/**
 * 브레이크포인트 정의
 */
export const BREAKPOINTS = {MOBILE: COLOR_CONSTANTS.ALPHA_TRANSPARENT,
  TABLET: UI_CONSTANTS.MOBILE_BREAKPOINT,
  DESKTOP: UI_CONSTANTS.TABLET_BREAKPOINT,
  LARGE: 1280,
  XLARGE: 1536};

/**
 * 브레이크포인트 값 (px)
 */
export const BREAKPOINT_VALUES = {MOBILE: '0px',
  TABLET: '768px',
  DESKTOP: '1024px',
  LARGE: '1280px',
  XLARGE: '1536px'};

/**
 * 디바이스 타입
 */
export const DEVICE_TYPES = {MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop',
  LARGE: 'large',
  XLARGE: 'xlarge'};

/**
 * 미디어 쿼리 문자열
 */
export const MEDIA_QUERIES = {MOBILE_ONLY: `(max-width: ${BREAKPOINTS.TABLET - DEFAULT_VALUES.CURRENT_PAGE}px)`,
  TABLET_ONLY: `(min-width: ${BREAKPOINTS.TABLET}px) and (max-width: ${BREAKPOINTS.DESKTOP - DEFAULT_VALUES.CURRENT_PAGE}px)`,
  DESKTOP_ONLY: `(min-width: ${BREAKPOINTS.DESKTOP}px) and (max-width: ${BREAKPOINTS.LARGE - DEFAULT_VALUES.CURRENT_PAGE}px)`,
  LARGE_ONLY: `(min-width: ${BREAKPOINTS.LARGE}px) and (max-width: ${BREAKPOINTS.XLARGE - DEFAULT_VALUES.CURRENT_PAGE}px)`,
  XLARGE_ONLY: `(min-width: ${BREAKPOINTS.XLARGE}px)`,
  
  TABLET_UP: `(min-width: ${BREAKPOINTS.TABLET}px)`,
  DESKTOP_UP: `(min-width: ${BREAKPOINTS.DESKTOP}px)`,
  LARGE_UP: `(min-width: ${BREAKPOINTS.LARGE}px)`,
  XLARGE_UP: `(min-width: ${BREAKPOINTS.XLARGE}px)`,
  
  TABLET_DOWN: `(max-width: ${BREAKPOINTS.DESKTOP - DEFAULT_VALUES.CURRENT_PAGE}px)`,
  DESKTOP_DOWN: `(max-width: ${BREAKPOINTS.LARGE - DEFAULT_VALUES.CURRENT_PAGE}px)`,
  LARGE_DOWN: `(max-width: ${BREAKPOINTS.XLARGE - DEFAULT_VALUES.CURRENT_PAGE}px)`};

/**
 * 반응형 간격
 */
export const RESPONSIVE_SPACING = {MOBILE: {CARD_PADDING: '12px',
    CARD_GAP: '12px',
    SECTION_PADDING: '16px',
    GRID_GAP: '8px',
    BUTTON_PADDING: '8px 16px',
    INPUT_PADDING: '8px 12px'},
  TABLET: {CARD_PADDING: '16px',
    CARD_GAP: '16px',
    SECTION_PADDING: '20px',
    GRID_GAP: '12px',
    BUTTON_PADDING: '10px 20px',
    INPUT_PADDING: '10px 14px'},
  DESKTOP: {CARD_PADDING: '20px',
    CARD_GAP: '20px',
    SECTION_PADDING: '24px',
    GRID_GAP: '16px',
    BUTTON_PADDING: '12px 24px',
    INPUT_PADDING: '12px 16px'},
  LARGE: {CARD_PADDING: '24px',
    CARD_GAP: '24px',
    SECTION_PADDING: '32px',
    GRID_GAP: '20px',
    BUTTON_PADDING: '14px 28px',
    INPUT_PADDING: '14px 18px'}};

/**
 * 반응형 타이포그래피
 */
export const RESPONSIVE_TYPOGRAPHY = {MOBILE: {H1: 'DEFAULT_VALUES.CURRENT_PAGE.5rem',    // 24px
    H2: 'DEFAULT_VALUES.CURRENT_PAGE.25rem',   // 20px
    H3: 'DEFAULT_VALUES.CURRENT_PAGE.125rem',  // 18px
    H4: '1rem',      // 16px
    H5: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT.875rem',  // 14px
    H6: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT.75rem',   // 12px
    BODY: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT.875rem', // 14px
    SMALL: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT.75rem'  // 12px},
  TABLET: {H1: '2rem',      // 32px
    H2: 'DEFAULT_VALUES.CURRENT_PAGE.5rem',    // 24px
    H3: 'DEFAULT_VALUES.CURRENT_PAGE.25rem',   // 20px
    H4: 'DEFAULT_VALUES.CURRENT_PAGE.125rem',  // 18px
    H5: '1rem',      // 16px
    H6: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT.875rem',  // 14px
    BODY: '1rem',    // 16px
    SMALL: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT.875rem' // 14px},
  DESKTOP: {H1: 'FORM_CONSTANTS.MIN_INPUT_LENGTH.5rem',    // 40px
    H2: '2rem',      // 32px
    H3: 'DEFAULT_VALUES.CURRENT_PAGE.5rem',    // 24px
    H4: 'DEFAULT_VALUES.CURRENT_PAGE.25rem',   // 20px
    H5: 'DEFAULT_VALUES.CURRENT_PAGE.125rem',  // 18px
    H6: '1rem',      // 16px
    BODY: '1rem',    // 16px
    SMALL: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT.875rem' // 14px}};

/**
 * 반응형 그리드
 */
export const RESPONSIVE_GRID = {MOBILE: {COLUMNS: DEFAULT_VALUES.CURRENT_PAGE,
    GAP: '12px',
    CARD_MIN_WIDTH: '280px'},
  TABLET: {COLUMNS: FORM_CONSTANTS.MIN_INPUT_LENGTH,
    GAP: '16px',
    CARD_MIN_WIDTH: '300px'},
  DESKTOP: {COLUMNS: BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS,
    GAP: '20px',
    CARD_MIN_WIDTH: '320px'},
  LARGE: {COLUMNS: DATE_CONSTANTS.WEEKS_IN_MONTH,
    GAP: '24px',
    CARD_MIN_WIDTH: '300px'}};

/**
 * 터치 타겟 크기
 */
export const TOUCH_TARGETS = {MINIMUM: '44px',     // Apple HIG 권장
  COMFORTABLE: '48px', // 더 편안한 터치
  LARGE: '56px'        // 접근성 강화};

/**
 * 디바이스 감지 헬퍼 함수
 */
export const getDeviceType = () => {const width = window.innerWidth;
  
  if (width < BREAKPOINTS.TABLET) return DEVICE_TYPES.MOBILE;
  if (width < BREAKPOINTS.DESKTOP) return DEVICE_TYPES.TABLET;
  if (width < BREAKPOINTS.LARGE) return DEVICE_TYPES.DESKTOP;
  if (width < BREAKPOINTS.XLARGE) return DEVICE_TYPES.LARGE;
  return DEVICE_TYPES.XLARGE;};

export const isMobile = () => {return window.innerWidth < BREAKPOINTS.TABLET;};

export const isTablet = () => {const width = window.innerWidth;
  return width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.DESKTOP;};

export const isDesktop = () => {return window.innerWidth >= BREAKPOINTS.DESKTOP;};

export const isTouchDevice = () => {return 'ontouchstart' in window || navigator.maxTouchPoints > COLOR_CONSTANTS.ALPHA_TRANSPARENT;};

/**
 * 반응형 값 가져오기
 */
export const getResponsiveValue = (values, deviceType = null) => {const device = deviceType || getDeviceType();
  return values[device.toUpperCase()] || values.MOBILE;};

export const getResponsiveSpacing = (type, deviceType = null) => {return getResponsiveValue(RESPONSIVE_SPACING, deviceType)[type];};

export const getResponsiveTypography = (element, deviceType = null) => {return getResponsiveValue(RESPONSIVE_TYPOGRAPHY, deviceType)[element];};

export const getResponsiveGrid = (property, deviceType = null) => {return getResponsiveValue(RESPONSIVE_GRID, deviceType)[property];};

/**
 * CSS 미디어 쿼리 생성
 */
export const createMediaQuery = (breakpoint, direction = 'up') => {if (direction === 'up') {return `@media (min-width: ${BREAKPOINTS[breakpoint]}px)`;} else {return `@media (max-width: ${BREAKPOINTS[breakpoint] - DEFAULT_VALUES.CURRENT_PAGE}px)`;}};

/**
 * 반응형 CSS 클래스 생성
 */
export const createResponsiveClass = (baseClass, breakpoint, direction = 'up') => {const mediaQuery = createMediaQuery(breakpoint, direction);
  return `${mediaQuery} {.${baseClass} {/* styles */}}`;};

/**
 * 브레이크포인트 검증
 */
export const validateBreakpoint = (breakpoint) => {return Object.keys(BREAKPOINTS).includes(breakpoint);};

/**
 * 디바이스별 최적화 설정
 */
export const DEVICE_OPTIMIZATIONS = {MOBILE: {enableTouchGestures: true,
    optimizeImages: true,
    lazyLoadImages: true,
    minimizeAnimations: false,
    enableHapticFeedback: true},
  TABLET: {enableTouchGestures: true,
    optimizeImages: true,
    lazyLoadImages: true,
    minimizeAnimations: false,
    enableHapticFeedback: false},
  DESKTOP: {enableTouchGestures: false,
    optimizeImages: false,
    lazyLoadImages: false,
    minimizeAnimations: false,
    enableHapticFeedback: false}};

export const getDeviceOptimizations = (deviceType = null) => {const device = deviceType || getDeviceType();
  return DEVICE_OPTIMIZATIONS[device.toUpperCase()] || DEVICE_OPTIMIZATIONS.MOBILE;};

export default {BREAKPOINTS,
  BREAKPOINT_VALUES,
  DEVICE_TYPES,
  MEDIA_QUERIES,
  RESPONSIVE_SPACING,
  RESPONSIVE_TYPOGRAPHY,
  RESPONSIVE_GRID,
  TOUCH_TARGETS,
  DEVICE_OPTIMIZATIONS};
