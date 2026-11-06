/**
 * 커버+챕터 v4 레이아웃 수치 (pt, 8pt 그리드). 색은 `colors.clinicOs` 만 사용한다.
 * 시안 1170px(@3x) 기준 값을 논리 pt 로 환산했다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { StyleSheet } from 'react-native';
import { ADMIN_MIN_TOUCH_TARGET, colors, spacing } from '@/theme/tokens';

export const CLINIC_OS = colors.clinicOs;

export const COVER_METRICS = {
  /** 최소 터치 타깃 (HIG 44pt) */
  touchTarget: ADMIN_MIN_TOUCH_TARGET,
  brandHeaderHeight: 48,
  ctaHeight: 56,
  bannerMinHeight: 60,
  notificationRowMinHeight: 44,
  listRowMinHeight: 64,
  listDateColumnWidth: 88,
  avatarSize: 32,
  unreadDotSize: 6,
  dockDotSize: 4,
  progressTrackHeight: 3,
  heroClockFontSize: 52,
  heroClockFontSizeTablet: 64,
  heroClockLineHeightRatio: 1.1,
  bangBarWidth: 3,
  bangBarHeight: 9,
  bangDotSize: 3,
  hairline: StyleSheet.hairlineWidth,
  pressedOpacity: 0.85,
  /** 가로 태블릿 좌측 커버 : 우측 시트 = 4 : 6 */
  splitCoverFlex: 4,
  splitSheetFlex: 6,
  phoneGutter: spacing.xl,
  tabletGutter: spacing['3xl'],
  sectionGap: spacing['2xl'],
} as const;
