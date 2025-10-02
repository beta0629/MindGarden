/**
 * 디자인 시스템 헬퍼 유틸리티
 * CSS 변수와 테마 관리
 */

/**
 * CSS 변수에 상담사별 색상 설정
 * @param {Array<string>} colors - 상담사별 색상 배열
 */
export const setConsultantColors = (colors) => {
  if (!colors || !Array.isArray(colors)) {
    console.warn('🎨 setConsultantColors: 유효하지 않은 색상 배열');
    return;
  }

  const root = document.documentElement;
  
  colors.forEach((color, index) => {
    const variableName = `--consultant-color-${index + 1}`;
    root.style.setProperty(variableName, color);
  });

  console.log('🎨 상담사별 색상 CSS 변수 설정 완료:', colors);
};

/**
 * 테마 변경
 * @param {string} theme - 'light' 또는 'dark'
 */
export const setTheme = (theme) => {
  const root = document.documentElement;
  
  // 기존 테마 제거
  root.removeAttribute('data-theme');
  
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  }
  
  console.log('🎨 테마 변경:', theme);
};

/**
 * CSS 변수 값 가져오기
 * @param {string} variableName - CSS 변수명 (예: '--color-primary')
 * @returns {string} CSS 변수 값
 */
export const getCSSVariable = (variableName) => {
  const root = document.documentElement;
  return getComputedStyle(root).getPropertyValue(variableName).trim();
};

/**
 * CSS 변수 값 설정하기
 * @param {string} variableName - CSS 변수명
 * @param {string} value - 설정할 값
 */
export const setCSSVariable = (variableName, value) => {
  const root = document.documentElement;
  root.style.setProperty(variableName, value);
};

/**
 * 상담사 ID에 따른 색상 가져오기
 * @param {number} consultantId - 상담사 ID
 * @returns {string} 색상 값
 */
export const getConsultantColor = (consultantId) => {
  const colorIndex = (consultantId % 10) + 1; // 1-10 범위
  return getCSSVariable(`--consultant-color-${colorIndex}`);
};

/**
 * 디자인 시스템 초기화
 * @param {Object} config - 초기화 설정
 */
export const initializeDesignSystem = async (config = {}) => {
  try {
    console.log('🎨 디자인 시스템 초기화 시작');
    
    // 상담사별 색상 로드
    if (config.loadConsultantColors !== false) {
      try {
        const response = await fetch('/api/admin/css-themes/consultant-colors');
        const data = await response.json();
        
        if (data.success && data.colors) {
          setConsultantColors(data.colors);
        } else {
          console.warn('🎨 상담사별 색상 로드 실패, 기본값 사용');
        }
      } catch (error) {
        console.error('🎨 상담사별 색상 로드 오류:', error);
      }
    }
    
    // 테마 설정
    if (config.theme) {
      setTheme(config.theme);
    }
    
    // 사용자 선호도 반영
    if (config.autoDetectTheme !== false) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        setTheme('dark');
      }
    }
    
    console.log('🎨 디자인 시스템 초기화 완료');
  } catch (error) {
    console.error('🎨 디자인 시스템 초기화 오류:', error);
  }
};

/**
 * 반응형 브레이크포인트 확인
 * @param {string} breakpoint - 브레이크포인트명 ('sm', 'md', 'lg', 'xl', '2xl')
 * @returns {boolean} 현재 화면이 해당 브레이크포인트 이상인지
 */
export const isBreakpoint = (breakpoint) => {
  const breakpoints = {
    xs: 320,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  };
  
  const width = breakpoints[breakpoint];
  if (!width) {
    console.warn(`🎨 알 수 없는 브레이크포인트: ${breakpoint}`);
    return false;
  }
  
  return window.innerWidth >= width;
};

/**
 * 디바이스 타입 감지
 * @returns {string} 'mobile', 'tablet', 'desktop'
 */
export const getDeviceType = () => {
  const width = window.innerWidth;
  
  if (width < 768) {
    return 'mobile';
  } else if (width < 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * 접근성 설정 확인
 * @returns {Object} 접근성 설정 정보
 */
export const getAccessibilitySettings = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  
  return {
    prefersReducedMotion,
    prefersHighContrast,
    deviceType: getDeviceType()
  };
};

export default {
  setConsultantColors,
  setTheme,
  getCSSVariable,
  setCSSVariable,
  getConsultantColor,
  initializeDesignSystem,
  isBreakpoint,
  getDeviceType,
  getAccessibilitySettings
};
