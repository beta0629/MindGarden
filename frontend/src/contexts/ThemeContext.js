/**
 * MindGarden Theme Provider
 * 
 * CSS Variables 기반 동적 테마 전환을 지원하는 Context Provider
 * 
 * @reference /docs/design-system-v2/IMPLEMENTATION_PLAN.md (Phase 1.1)
 * @reference /docs/design-system-v2/DESIGN_SYSTEM_ARCHITECTURE.md (Theme System)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { defaultTheme } from '../themes/defaultTheme';

const ThemeContext = createContext();

/**
 * Theme Context Hook
 * 
 * @returns {Object} theme, themeName, switchTheme
 * @throws {Error} useTheme must be used within ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * Theme Provider Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [themeName, setThemeName] = useState('default');

  /**
   * CSS Variables를 document.documentElement에 적용
   */
  const applyThemeVariables = useCallback((themeConfig) => {
    const root = document.documentElement;

    // Primary Colors
    Object.entries(themeConfig.colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value);
    });

    // Background Colors
    Object.entries(themeConfig.colors.background).forEach(([key, value]) => {
      root.style.setProperty(`--color-bg-${key}`, value);
    });

    // Text Colors
    Object.entries(themeConfig.colors.text).forEach(([key, value]) => {
      root.style.setProperty(`--color-text-${key}`, value);
    });

    // Border Colors
    Object.entries(themeConfig.colors.border).forEach(([key, value]) => {
      root.style.setProperty(`--color-border-${key}`, value);
    });

    // Status Colors
    Object.entries(themeConfig.colors.status).forEach(([key, value]) => {
      root.style.setProperty(`--color-status-${key}`, value);
    });

    // Interactive Colors
    Object.entries(themeConfig.colors.interactive).forEach(([key, value]) => {
      root.style.setProperty(`--color-interactive-${key}`, value);
    });

    // Glass Effect
    Object.entries(themeConfig.colors.glass).forEach(([key, value]) => {
      root.style.setProperty(`--glass-${key}`, value);
    });

    // Spacing
    Object.entries(themeConfig.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Typography - Font Family
    Object.entries(themeConfig.typography.fontFamily).forEach(([key, value]) => {
      root.style.setProperty(`--font-${key}`, value);
    });

    // Typography - Font Size
    Object.entries(themeConfig.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    // Typography - Font Weight
    Object.entries(themeConfig.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value);
    });

    // Typography - Line Height
    Object.entries(themeConfig.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value);
    });

    // Border Radius
    Object.entries(themeConfig.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // Shadows
    Object.entries(themeConfig.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });

    // Transitions
    Object.entries(themeConfig.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });

    // Z-Index
    Object.entries(themeConfig.zIndex).forEach(([key, value]) => {
      root.style.setProperty(`--z-index-${key}`, value);
    });

    // Breakpoints
    Object.entries(themeConfig.breakpoints).forEach(([key, value]) => {
      root.style.setProperty(`--breakpoint-${key}`, value);
    });
  }, []);

  /**
   * 테마 전환 함수
   * 
   * @param {string} newThemeName - 새로운 테마 이름
   */
  const switchTheme = useCallback((newThemeName) => {
    // 현재는 defaultTheme만 지원
    // 추후 다크 테마, 고대비 테마 추가 가능
    if (newThemeName === 'default') {
      setTheme(defaultTheme);
      setThemeName(newThemeName);
      
      // localStorage에 저장
      localStorage.setItem('mindgarden-theme', newThemeName);
    } else {
      console.warn(`Theme "${newThemeName}" is not supported yet. Using default theme.`);
    }
  }, []);

  // 초기 로드 시 localStorage에서 테마 복원
  useEffect(() => {
    const savedTheme = localStorage.getItem('mindgarden-theme');
    if (savedTheme && savedTheme !== 'default') {
      switchTheme(savedTheme);
    }
  }, [switchTheme]);

  // 테마 변경 시 CSS Variables 적용
  useEffect(() => {
    applyThemeVariables(theme);
  }, [theme, applyThemeVariables]);

  const value = {
    theme,
    themeName,
    switchTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

