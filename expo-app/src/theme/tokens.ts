/**
 * MindGarden 디자인 토큰 정의
 * CSS Custom Properties(var(--mg-*))의 JS 변환 — 단일 소스
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/design-system/v2/CONSULTANT_CLIENT_DESIGN_TOKENS.md
 * @see docs/project-management/CONSULTANT_CLIENT_APP_PLAN.md §3.10
 */

/** 내담자 테마: 따뜻한 코랄·크림 톤 (8색) */
const CLIENT_COLORS = {
  primary: '#E07A5F',
  primaryLight: '#F2CC8F',
  primaryDark: '#C06A50',
  bgMain: '#FAF9F7',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF8F0',
  accent: '#81B29A',
  accentSoft: '#F0EDE8',
} as const;

/** 상담사 테마: 차분한 그린·민트 톤 (8색) */
const CONSULTANT_COLORS = {
  primary: '#3D5246',
  primaryLight: '#6B7F72',
  primaryDark: '#2A3A31',
  bgMain: '#FAF9F7',
  surface: '#F5F3EF',
  surfaceAlt: '#EDE9E1',
  accent: '#A4B494',
  accentSoft: '#F0EDE8',
} as const;

/** 공통 색상: 역할 무관하게 동일 적용 */
const COMMON_COLORS = {
  textMain: '#2C2C2C',
  textSecondary: '#5C6B61',
  textTertiary: '#9E9E9E',
  textOnPrimary: '#FFFFFF',
  border: '#D4CFC8',
  divider: '#E8E4DE',
  error: '#E57373',
  success: '#81C784',
  warning: '#FFB74D',
  info: '#64B5F6',
} as const;

/** 그레이 스케일 (토큰화) */
const GRAY_COLORS = {
  900: '#2C2C2C',
  700: '#4A4A4A',
  500: '#7A7A7A',
  400: '#9E9E9E',
  300: '#D4CFC8',
  200: '#E8E4DE',
  100: '#F0EDE8',
  50: '#FAF9F7',
} as const;

export const colors = {
  client: CLIENT_COLORS,
  consultant: CONSULTANT_COLORS,
  common: COMMON_COLORS,
  gray: GRAY_COLORS,
} as const;

export const spacing = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;
