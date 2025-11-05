/**
 * 색상 상수 정의
 * 웹의 CSS 변수를 JavaScript 상수로 변환
 * 
 * 참조: frontend/src/styles/mindgarden-design-system.css
 */

export const COLORS = {
  // Primary Colors (민트그린 - MindGarden 디자인 시스템)
  primary: '#98FB98',      // Mint Green
  primaryLight: '#B6E5D8', // Soft Mint
  primaryDark: '#808000',  // Olive Green (hover)
  // Primary Colors with Transparency
  primaryLight10: '#B6E5D81A', // Soft Mint 10% opacity
  primaryLight20: '#B6E5D833', // Soft Mint 20% opacity
  primary10: '#98FB981A',      // Mint Green 10% opacity
  primary20: '#98FB9833',      // Mint Green 20% opacity
  primary30: '#98FB984D',      // Mint Green 30% opacity
  
  // Success Colors with Transparency
  success10: '#28a7451A',      // Success 10% opacity
  success20: '#28a74533',      // Success 20% opacity
  success30: '#28a7454D',       // Success 30% opacity
  
  // Error Colors with Transparency
  error10: '#dc35451A',        // Error 10% opacity
  error20: '#dc354533',        // Error 20% opacity
  error30: '#dc35454D',        // Error 30% opacity
  
  // Secondary Colors
  secondary: '#6c757d',
  secondaryLight: '#9ca3af',
  secondaryDark: '#495057',
  
  // Status Colors
  success: '#28a745',
  successLight: '#6cbb6d',
  successDark: '#1e7e34',
  successBg: '#d1fae5',
  
  error: '#dc3545',
  errorLight: '#f56565',
  errorDark: '#c82333',
  errorBg: '#fee2e2',
  errorBorder: '#fecaca',
  
  warning: '#ffc107',
  warningLight: '#ffeaa7',
  warningDark: '#e0a800',
  warningBg: '#fef3c7',
  
  info: '#17a2b8',
  infoLight: '#bbdefb',
  infoDark: '#138496',
  infoBg: '#dbeafe',
  
  pending: '#fd7e14',
  pendingLight: '#ffa94d',
  pendingDark: '#e55a00',
  
  // Text Colors
  white: '#ffffff',
  black: '#000000',
  dark: '#212529',
  darkGray: '#2F2F2F',
  mediumGray: '#6B6B6B',
  
  // Grays
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Border Colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  
  // Overlay Colors (모달 배경 등)
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(255, 255, 255, 0.9)',
  overlayDark: 'rgba(0, 0, 0, 0.3)',
  overlayWhite: 'rgba(255, 255, 255, 0.8)',
  
  // Additional Colors
  accent: '#e91e63',
  brown: '#795548',
  brownDark: '#6d3410',
  purple: '#7b1fa2',
  purpleLight: '#f3e5f5',
  orange: '#e65100',
  orangeLight: '#fff3e0',
  orangeDark: '#e67e22',
  pink: '#c2185b',
  pinkLight: '#fce4ec',
  
  // Social brand colors
  kakao: '#FEE500',
  naver: '#03C75A',
  
  // Light colors
  cream: '#F5F5DC',
  lightBeige: '#FDF5E6',
  lightCream: '#FFFEF7',
};

// 역할별 색상
export const ROLE_COLORS = {
  CLIENT: COLORS.success,
  CONSULTANT: COLORS.primary,
  ADMIN: COLORS.secondary,
  HQ: COLORS.purple,
};

export default COLORS;

