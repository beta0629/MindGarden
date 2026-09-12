/**
 * 내담자(Client) 테마 객체
 * colors.client + colors.common + colors.gray + 전체 토큰 조합
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { colors, spacing, borderRadius } from './tokens';
import { fontFamily, fontSize, textStyles } from './typography';
import { shadows } from './shadows';

export interface AppThemeColors {
  readonly primary: string;
  readonly primaryLight: string;
  readonly primaryDark: string;
  /** counselor/ops only — Layout phase2 locked; client coral에는 없음 */
  readonly primaryHover?: string;
  /** counselor/ops only — Layout phase2 locked; client coral에는 없음 */
  readonly primaryPress?: string;
  readonly bgMain: string;
  readonly bgSub: string;
  readonly surface: string;
  readonly surfaceAlt: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly textMain: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly textOnPrimary: string;
  readonly border: string;
  readonly divider: string;
  readonly error: string;
  readonly success: string;
  readonly warning: string;
  readonly info: string;
  readonly shadowSource: string;
  readonly modalBackdrop: string;
  readonly modalLoadingOverlay: string;
  readonly scheduleCardInProgressBackground: string;
  /** 로그인 화면 파스텔 배경 — warm stop (#FFF6E8) */
  readonly loginBgWarm: string;
  /** 로그인 화면 파스텔 배경 — cool stop (#EFF3F0) */
  readonly loginBgCool: string;
  /** 로그인 화면 파스텔 배경 — 중간 중성 (#F4F1EA) */
  readonly loginBgBridge: string;
  /** V2 §M.1 B2 Breathing Circle — orb radial gradient 중심 (#FFFFFF) */
  readonly loginOrbCore: string;
  /** V2 §M.1 B2 Breathing Circle — orb radial gradient 중간 (#F5F0E8) */
  readonly loginOrbMid: string;
  /** V2 §M.1 B2 Breathing Circle — orb radial gradient 외곽 (#E0DACF, halo 페이드아웃) */
  readonly loginOrbEdge: string;
  /** iPad letterbox 풀폭 배경 (= bgMain 분리 키) */
  readonly letterboxBg: string;
  /** iPad letterbox 컬럼 보더 (= divider 분리 키) */
  readonly letterboxBorder: string;
  readonly gray: typeof colors.gray;
}

export interface AppTheme {
  readonly colors: AppThemeColors;
  readonly spacing: typeof spacing;
  readonly borderRadius: typeof borderRadius;
  readonly shadows: typeof shadows;
  readonly fontFamily: typeof fontFamily;
  readonly fontSize: typeof fontSize;
  readonly textStyles: typeof textStyles;
}

export const clientTheme: AppTheme = {
  colors: {
    primary: colors.client.primary,
    primaryLight: colors.client.primaryLight,
    primaryDark: colors.client.primaryDark,
    bgMain: colors.client.bgMain,
    bgSub: colors.client.bgSub,
    surface: colors.client.surface,
    surfaceAlt: colors.client.surfaceAlt,
    accent: colors.client.accent,
    accentSoft: colors.client.accentSoft,
    ...colors.common,
    letterboxBg: colors.client.bgMain,
    letterboxBorder: colors.common.divider,
    gray: colors.gray,
  },
  spacing,
  borderRadius,
  shadows,
  fontFamily,
  fontSize,
  textStyles,
};
