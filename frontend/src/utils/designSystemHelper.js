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

/**
 * 테마별 z-index 설정 관리
 */
export const ZIndexManager = {
  // 기본 z-index 값들
  defaultValues: {
    // 기본 레이어
    'z-base': 0,
    'z-hidden': -1,
    
    // 개별부 (페이지 콘텐츠)
    'z-content': 1,
    'z-content-hover': 2,
    'z-content-active': 3,
    'z-page': 10,
    'z-component': 5,
    
    // 드롭다운
    'z-dropdown': 100,
    'z-dropdown-fixed': 101,
    'z-dropdown-menu': 102,
    'z-dropdown-overlay': 103,
    
    // 공통부 (헤더)
    'z-header': 1000,
    'z-header-sticky': 1000,
    'z-header-menu': 1000,
    'z-header-dropdown': 1001,
    'z-header-user': 1002,
    
    // 모달
    'z-modal': 10000,
    'z-modal-backdrop': 10001,
    'z-modal-content': 10002,
    'z-modal-header': 10003,
    'z-modal-overlay': 10000,
    
    // 특수 모달들
    'z-modal-confirm': 10010,
    'z-modal-schedule': 10020,
    'z-modal-performance': 10030,
    'z-modal-report': 10040,
    'z-modal-specialty': 10050,
    
    // 알림
    'z-notification': 20000,
    'z-toast': 20001,
    'z-alert': 20002,
    
    // 기타 UI 요소들
    'z-tooltip': 5000,
    'z-popover': 5001,
    'z-fab': 6000,
    'z-overlay': 7000
  },

  // 테마별 z-index 오프셋 설정
  themeOffsets: {
    light: 0,
    dark: 0,
    highContrast: 1000, // 고대비 모드에서는 모든 z-index를 높게
    mobile: -500, // 모바일에서는 z-index를 낮게 (성능 최적화)
    tablet: -200,
    desktop: 0
  },

  /**
   * 테마별 z-index 값 계산
   * @param {string} themeName - 테마명
   * @param {string} deviceType - 디바이스 타입
   * @param {Object} customOffsets - 커스텀 오프셋
   * @returns {Object} 계산된 z-index 값들
   */
  calculateZIndexValues(themeName = 'light', deviceType = 'desktop', customOffsets = {}) {
    const themeOffset = this.themeOffsets[themeName] || 0;
    const deviceOffset = this.themeOffsets[deviceType] || 0;
    const customOffset = customOffsets[themeName] || 0;
    
    const totalOffset = themeOffset + deviceOffset + customOffset;
    
    const calculatedValues = {};
    Object.entries(this.defaultValues).forEach(([key, value]) => {
      calculatedValues[key] = Math.max(0, value + totalOffset);
    });
    
    return calculatedValues;
  },

  /**
   * z-index 값들을 CSS 변수로 설정
   * @param {string} themeName - 테마명
   * @param {string} deviceType - 디바이스 타입
   * @param {Object} customOffsets - 커스텀 오프셋
   */
  applyZIndexValues(themeName = 'light', deviceType = 'desktop', customOffsets = {}) {
    const values = this.calculateZIndexValues(themeName, deviceType, customOffsets);
    const root = document.documentElement;
    
    Object.entries(values).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value.toString());
    });
    
    console.log(`🎨 Z-Index 값 적용 완료 (테마: ${themeName}, 디바이스: ${deviceType})`, values);
  },

  /**
   * 특정 z-index 값 가져오기
   * @param {string} key - z-index 키 (예: 'z-modal')
   * @returns {number} z-index 값
   */
  getZIndexValue(key) {
    const value = getCSSVariable(`--${key}`);
    return value ? parseInt(value, 10) : this.defaultValues[key] || 0;
  },

  /**
   * 동적 z-index 업데이트 (테마 변경 시)
   * @param {string} newTheme - 새로운 테마
   */
  updateForTheme(newTheme) {
    const deviceType = getDeviceType();
    this.applyZIndexValues(newTheme, deviceType);
  },

  /**
   * 동적 z-index 업데이트 (디바이스 변경 시)
   * @param {string} newDeviceType - 새로운 디바이스 타입
   */
  updateForDevice(newDeviceType) {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    this.applyZIndexValues(currentTheme, newDeviceType);
  }
};

/**
 * 동적 테마 시스템 초기화
 * @param {Object} config - 초기화 설정
 */
export const initializeDynamicThemeSystem = async (config = {}) => {
  try {
    console.log('🎨 동적 테마 시스템 초기화 시작');
    
    // 기본 디자인 시스템 초기화
    await initializeDesignSystem(config);
    
    // z-index 값들 적용
    const theme = config.theme || 'light';
    const deviceType = getDeviceType();
    ZIndexManager.applyZIndexValues(theme, deviceType, config.zIndexOffsets);
    
    // 테마 변경 감지기 설정
    if (config.enableThemeWatcher !== false) {
      const themeWatcher = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
            const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
            ZIndexManager.updateForTheme(newTheme);
          }
        });
      });
      
      themeWatcher.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }
    
    // 화면 크기 변경 감지기 설정
    if (config.enableDeviceWatcher !== false) {
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const newDeviceType = getDeviceType();
          ZIndexManager.updateForDevice(newDeviceType);
        }, 250);
      });
    }
    
    console.log('🎨 동적 테마 시스템 초기화 완료');
  } catch (error) {
    console.error('🎨 동적 테마 시스템 초기화 오류:', error);
  }
};

export default {
  setConsultantColors,
  setTheme,
  getCSSVariable,
  setCSSVariable,
  getConsultantColor,
  initializeDesignSystem,
  initializeDynamicThemeSystem,
  ZIndexManager,
  isBreakpoint,
  getDeviceType,
  getAccessibilitySettings
};
