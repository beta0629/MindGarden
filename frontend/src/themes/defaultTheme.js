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
      main: 'var(--mg-mint-green)',      // Mint Green
      hover: 'var(--mg-olive-green)',     // Olive Green
      active: 'var(--cs-yellow-700)',
      light: 'var(--mg-soft-mint)',     // Soft Mint
    },
    
    // Background Colors
    background: {
      primary: 'var(--mg-white)',   // White
      secondary: 'var(--cs-gray-50)', // Light Gray
      surface: 'var(--mg-white)',
      overlay: 'var(--mg-overlay)',
    },
    
    // Text Colors
    text: {
      primary: 'var(--cs-gray-800)',   // Dark Gray
      secondary: 'var(--cs-gray-600)', // Medium Gray
      tertiary: 'var(--cs-gray-400)',
      inverse: 'var(--mg-white)',
      link: 'var(--mg-olive-green)',      // Olive Green
    },
    
    // Border Colors
    border: {
      light: 'var(--cs-gray-200)',
      medium: 'var(--cs-gray-300)',
      dark: 'var(--cs-gray-400)',
      focus: 'var(--mg-olive-green)',
    },
    
    // Status Colors
    status: {
      success: 'var(--mg-success-500)',
      successBg: 'var(--cs-success-100)',
      warning: 'var(--mg-warning-500)',
      warningBg: '#fef3c7',
      error: 'var(--mg-error-500)',
      errorBg: '#fee2e2',
      info: 'var(--mg-primary-500)',
      infoBg: '#dbeafe',
    },
    
    // Interactive States
    interactive: {
      hover: 'rgba(0, 0, 0, 0.05)',
      active: 'var(--mg-shadow-light)',
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
    md: '0 4px 6px var(--mg-shadow-light)',
    lg: '0 10px 15px var(--mg-shadow-light)',
    xl: '0 20px 25px var(--mg-shadow-medium)',
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

