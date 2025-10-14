/**
 * MindGarden 기본 테마
 * 
 * 이 파일은 MindGarden의 기본 테마 토큰을 정의합니다.
 * CSS Variables와 매핑되어 동적 테마 전환을 지원합니다.
 */

export const defaultTheme = {
  name: 'default',
  displayName: 'MindGarden 기본 테마',
  
  colors: {
    // Primary Colors
    primary: {
      main: '#98FB98',      // Mint Green
      hover: '#808000',     // Olive Green
      active: '#6B6B00',
      light: '#B6E5D8',     // Soft Mint
    },
    
    // Background Colors
    background: {
      primary: '#F5F5DC',   // Cream
      secondary: '#FDF5E6', // Light Beige
      surface: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    // Text Colors
    text: {
      primary: '#2F2F2F',   // Dark Gray
      secondary: '#6B6B6B', // Medium Gray
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
      link: '#808000',      // Olive Green
    },
    
    // Border Colors
    border: {
      light: '#E5E5E7',
      medium: '#D1D5DB',
      dark: '#9CA3AF',
      focus: '#808000',
    },
    
    // Status Colors
    status: {
      success: '#10b981',
      successBg: '#d1fae5',
      warning: '#f59e0b',
      warningBg: '#fef3c7',
      error: '#ef4444',
      errorBg: '#fee2e2',
      info: '#3b82f6',
      infoBg: '#dbeafe',
    },
    
    // Interactive States
    interactive: {
      hover: 'rgba(0, 0, 0, 0.05)',
      active: 'rgba(0, 0, 0, 0.1)',
      disabled: '#E5E5E7',
      disabledText: '#9CA3AF',
    },
    
    // Glass Effect
    glass: {
      background: 'rgba(255, 255, 255, 0.6)',
      border: 'rgba(255, 255, 255, 0.5)',
      blur: '20px',
    },
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    xxl: '3rem',      // 48px
    xxxl: '4rem',     // 64px
  },
  
  typography: {
    fontFamily: {
      base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '2rem',      // 32px
      '4xl': '2.5rem',    // 40px
      '5xl': '3rem',      // 48px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '50%',
  },
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    base: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
  
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 100,
    fixed: 500,
    modal: 9999,
    popover: 10000,
    tooltip: 10001,
  },
  
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
    wide: '1536px',
  },
};

export default defaultTheme;

