/**
 * 최적화된 스타일 관리 훅
 * @description 동적 스타일 적용과 성능 최적화를 위한 커스텀 훅
 * @author MindGarden Team
 * @version 1.0.0
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { COMMON_COLORS, COMMON_SIZES, COMMON_ANIMATIONS } from '../constants/css/commonStyles';

/**
 * 동적 스타일 생성 훅
 * @param {Object} styleConfig - 스타일 설정 객체
 * @param {Array} dependencies - 의존성 배열
 * @returns {Object} 최적화된 스타일 객체
 */
export const useDynamicStyles = (styleConfig, dependencies = []) => {
  return useMemo(() => {
    if (!styleConfig) return {};
    
    const processedStyles = {};
    
    Object.entries(styleConfig).forEach(([key, value]) => {
      if (typeof value === 'function') {
        processedStyles[key] = value();
      } else if (typeof value === 'object' && value !== null) {
        processedStyles[key] = { ...value };
      } else {
        processedStyles[key] = value;
      }
    });
    
    return processedStyles;
  }, dependencies);
};

/**
 * 테마 기반 스타일 훅
 * @param {string} theme - 테마 타입 ('light' | 'dark')
 * @returns {Object} 테마별 스타일 객체
 */
export const useThemeStyles = (theme = 'light') => {
  return useMemo(() => {
    const baseStyles = {
      light: {
        backgroundColor: COMMON_COLORS.BG_PRIMARY,
        color: COMMON_COLORS.TEXT_PRIMARY,
        borderColor: COMMON_COLORS.BORDER_PRIMARY,
      },
      dark: {
        backgroundColor: COMMON_COLORS.BG_DARK,
        color: COMMON_COLORS.TEXT_LIGHT,
        borderColor: COMMON_COLORS.BORDER_DARK,
      },
    };
    
    return baseStyles[theme] || baseStyles.light;
  }, [theme]);
};

/**
 * 반응형 스타일 훅
 * @param {Object} breakpointStyles - 브레이크포인트별 스타일
 * @returns {Object} 현재 화면 크기에 맞는 스타일
 */
export const useResponsiveStyles = (breakpointStyles) => {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return useMemo(() => {
    const breakpoints = {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
    };
    
    let activeBreakpoint = 'xs';
    Object.entries(breakpoints).forEach(([breakpoint, minWidth]) => {
      if (windowWidth >= minWidth) {
        activeBreakpoint = breakpoint;
      }
    });
    
    return breakpointStyles[activeBreakpoint] || breakpointStyles.xs || {};
  }, [windowWidth, breakpointStyles]);
};

/**
 * 애니메이션 상태 훅
 * @param {boolean} isAnimating - 애니메이션 실행 여부
 * @param {Object} animationConfig - 애니메이션 설정
 * @returns {Object} 애니메이션 스타일과 제어 함수
 */
export const useAnimationStyles = (isAnimating = false, animationConfig = {}) => {
  const [animationState, setAnimationState] = useState('idle');
  
  const defaultConfig = {
    duration: COMMON_ANIMATIONS.DURATION_NORMAL,
    easing: COMMON_ANIMATIONS.EASE_IN_OUT,
    delay: '0s',
  };
  
  const config = { ...defaultConfig, ...animationConfig };
  
  const animationStyles = useMemo(() => {
    const baseStyles = {
      transition: `all ${config.duration} ${config.easing}`,
      transitionDelay: config.delay,
    };
    
    const stateStyles = {
      idle: {},
      enter: {
        opacity: 1,
        transform: 'translateY(0)',
      },
      exit: {
        opacity: 0,
        transform: 'translateY(-10px)',
      },
    };
    
    return {
      ...baseStyles,
      ...stateStyles[animationState],
    };
  }, [animationState, config]);
  
  const startAnimation = useCallback(() => {
    setAnimationState('enter');
  }, []);
  
  const stopAnimation = useCallback(() => {
    setAnimationState('exit');
  }, []);
  
  const resetAnimation = useCallback(() => {
    setAnimationState('idle');
  }, []);
  
  useEffect(() => {
    if (isAnimating) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [isAnimating, startAnimation, stopAnimation]);
  
  return {
    styles: animationStyles,
    state: animationState,
    start: startAnimation,
    stop: stopAnimation,
    reset: resetAnimation,
  };
};

/**
 * CSS 변수 동적 설정 훅
 * @param {Object} cssVariables - CSS 변수 객체
 * @param {HTMLElement} target - 대상 요소 (기본: document.documentElement)
 */
export const useCSSVariables = (cssVariables, target = null) => {
  useEffect(() => {
    if (!cssVariables) return;
    
    const element = target || (typeof document !== 'undefined' ? document.documentElement : null);
    if (!element) return;
    
    Object.entries(cssVariables).forEach(([property, value]) => {
      const cssProperty = property.startsWith('--') ? property : `--${property}`;
      element.style.setProperty(cssProperty, value);
    });
    
    return () => {
      Object.keys(cssVariables).forEach((property) => {
        const cssProperty = property.startsWith('--') ? property : `--${property}`;
        element.style.removeProperty(cssProperty);
      });
    };
  }, [cssVariables, target]);
};

/**
 * 조건부 스타일 훅
 * @param {Object} conditions - 조건별 스타일 매핑
 * @param {Array} dependencies - 의존성 배열
 * @returns {Object} 조건에 맞는 스타일
 */
export const useConditionalStyles = (conditions, dependencies = []) => {
  return useMemo(() => {
    let mergedStyles = {};
    
    Object.entries(conditions).forEach(([condition, styles]) => {
      if (condition === 'default' || condition === true || condition === 'true') {
        mergedStyles = { ...mergedStyles, ...styles };
      }
    });
    
    return mergedStyles;
  }, dependencies);
};

/**
 * 성능 최적화된 스타일 캐싱 훅
 * @param {Function} styleGenerator - 스타일 생성 함수
 * @param {Array} dependencies - 의존성 배열
 * @returns {Object} 캐시된 스타일
 */
export const useCachedStyles = (styleGenerator, dependencies = []) => {
  return useMemo(() => {
    if (typeof styleGenerator !== 'function') {
      return {};
    }
    
    return styleGenerator();
  }, dependencies);
};

/**
 * 호버 상태 스타일 훅
 * @param {Object} normalStyles - 기본 스타일
 * @param {Object} hoverStyles - 호버 스타일
 * @returns {Object} 호버 상태 관리 객체
 */
export const useHoverStyles = (normalStyles = {}, hoverStyles = {}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const currentStyles = useMemo(() => {
    return isHovered ? { ...normalStyles, ...hoverStyles } : normalStyles;
  }, [isHovered, normalStyles, hoverStyles]);
  
  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };
  
  return {
    styles: currentStyles,
    isHovered,
    hoverProps,
  };
};

/**
 * 포커스 상태 스타일 훅
 * @param {Object} normalStyles - 기본 스타일
 * @param {Object} focusStyles - 포커스 스타일
 * @returns {Object} 포커스 상태 관리 객체
 */
export const useFocusStyles = (normalStyles = {}, focusStyles = {}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const currentStyles = useMemo(() => {
    return isFocused ? { ...normalStyles, ...focusStyles } : normalStyles;
  }, [isFocused, normalStyles, focusStyles]);
  
  const focusProps = {
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };
  
  return {
    styles: currentStyles,
    isFocused,
    focusProps,
  };
};
