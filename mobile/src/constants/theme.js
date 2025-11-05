/**
 * 테마 상수 통합 파일
 * 모든 디자인 시스템 상수를 한 곳에서 관리
 */

import COLORS from './colors';
import SPACING from './spacing';
import TYPOGRAPHY from './typography';
import SIZES from './sizes';

export const BORDER_RADIUS = {
  // 모바일 최적화 둥글기 (iOS/Android 디자인 가이드라인 기반)
  none: 0,
  xs: 4,          // 작은 요소 (배지, 칩 등)
  sm: 8,          // 중간 요소 (버튼, 입력 필드)
  md: 12,         // 표준 카드, 모달
  lg: 16,         // 큰 컨테이너, 팝업
  xl: 20,         // 특수 요소
  '2xl': 24,      // 매우 큰 요소
  full: 9999,     // 원형 요소 (프로필 이미지 등)
};

export const SHADOWS = {
  // 모바일 최적화 그림자 (iOS/Android 디자인 시스템 기반)
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // 아주 미묘한 그림자
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2, // 카드 기본 그림자
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4, // 강조된 카드
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 6, // 모달, 팝업 등
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 8, // 특수 강조 요소
  },
};

export const THEME = {
  colors: COLORS,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  sizes: SIZES,
};

export default THEME;

// Re-export individual modules for convenient named imports
export { default as COLORS } from './colors';
export { default as SPACING } from './spacing';
export { default as TYPOGRAPHY } from './typography';
// Re-export both the named and default SIZES to be compatible with all imports
export { default as SIZES } from './sizes';
export { SIZES as SIZES_NAMED } from './sizes';

