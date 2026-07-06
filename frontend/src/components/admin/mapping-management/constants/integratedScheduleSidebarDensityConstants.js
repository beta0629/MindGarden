/**
 * 통합 스케줄 사이드바 밀도(Comfortable / Compact) SSOT
 *
 * @author CoreSolution
 * @since 2026-07-06
 */

/** 기본 밀도 — 여유 카드 레이아웃 */
export const SIDEBAR_DENSITY_COMFORTABLE = 'comfortable';

/** Compact Row — DensityToggle ON 시에만 */
export const SIDEBAR_DENSITY_COMPACT = 'compact';

export const SIDEBAR_DENSITY_MODES = [
  SIDEBAR_DENSITY_COMFORTABLE,
  SIDEBAR_DENSITY_COMPACT
];

/** `useViewModePreference` pageId */
export const SIDEBAR_DENSITY_PAGE_ID = 'admin.integrated-schedule.sidebar-density';
