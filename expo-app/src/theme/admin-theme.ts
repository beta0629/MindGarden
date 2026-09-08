/**
 * 어드민·스태프(Admin) 테마 객체
 * colors.admin + colors.common + colors.gray + 전체 토큰 조합
 * Clinic-OS cs.* 정렬 (Layout phase2 — Expo ops/admin mobile skin)
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { colors, spacing, borderRadius } from './tokens';
import { fontFamily, fontSize, textStyles } from './typography';
import { shadows } from './shadows';
import type { AppTheme } from './client-theme';

export const adminTheme: AppTheme = {
  colors: {
    primary: colors.admin.primary,
    primaryLight: colors.admin.primaryLight,
    primaryDark: colors.admin.primaryDark,
    primaryHover: colors.admin.primaryHover,
    primaryPress: colors.admin.primaryPress,
    bgMain: colors.admin.bgMain,
    bgSub: colors.admin.bgSub,
    surface: colors.admin.surface,
    surfaceAlt: colors.admin.surfaceAlt,
    accent: colors.admin.accent,
    accentSoft: colors.admin.accentSoft,
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
