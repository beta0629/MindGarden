/**
 * MindGarden 테마 시스템 — 통합 re-export
 *
 * @author MindGarden
 * @since 2026-05-12
 *
 * @example
 * import { useTheme, ThemeProvider, colors, spacing } from '@/theme';
 */

export { colors, spacing, borderRadius } from './tokens';
export { fontFamily, fontSize, lineHeight, textStyles, loadFonts } from './typography';
export { shadows } from './shadows';
export { clientTheme } from './client-theme';
export type { AppTheme, AppThemeColors } from './client-theme';
export { consultantTheme } from './consultant-theme';
export { ThemeProvider, useTheme } from './ThemeProvider';
