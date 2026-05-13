/**
 * 상담사(Consultant) 테마 객체
 * colors.consultant + colors.common + colors.gray + 전체 토큰 조합
 * 구조는 clientTheme과 동일, 색상만 consultant 팔레트 적용
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { colors, spacing, borderRadius } from './tokens';
import { fontFamily, fontSize, textStyles } from './typography';
import { shadows } from './shadows';
import type { AppTheme } from './client-theme';

export const consultantTheme: AppTheme = {
  colors: {
    primary: colors.consultant.primary,
    primaryLight: colors.consultant.primaryLight,
    primaryDark: colors.consultant.primaryDark,
    bgMain: colors.consultant.bgMain,
    bgSub: colors.consultant.bgSub,
    surface: colors.consultant.surface,
    surfaceAlt: colors.consultant.surfaceAlt,
    accent: colors.consultant.accent,
    accentSoft: colors.consultant.accentSoft,
    ...colors.common,
    gray: colors.gray,
  },
  spacing,
  borderRadius,
  shadows,
  fontFamily,
  fontSize,
  textStyles,
};
