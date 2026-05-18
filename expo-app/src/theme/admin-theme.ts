/**
 * 어드민·스태프(Admin) 테마 객체
 * colors.admin + colors.common + colors.gray + 전체 토큰 조합
 *
 * @author MindGarden
 * @since 2026-05-18
 * @see docs/project-management/ADMIN_MOBILE_COMMERCIALIZATION_DESIGN_HANDOFF.md §2.1
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
