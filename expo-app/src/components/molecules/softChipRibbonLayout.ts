/**
 * SoftChipRibbon — 레이아웃·톤 pure helpers (테스트·화면 공용)
 * wrap/flow 비대칭 — equal 2×2 / KPI 3-col 금지.
 *
 * @author MindGarden
 * @since 2026-10-28
 */

export type SoftChipTone = 'peach' | 'mint' | 'lavender' | 'cream' | 'unpaid';

export interface SoftChipItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly tone: SoftChipTone;
  readonly sub?: string;
  readonly badge?: string;
}

/** flexWrap ribbon — 칩은 콘텐츠 폭(auto), equal width grid 아님 */
export const SOFT_CHIP_RIBBON_LAYOUT = {
  flexDirection: 'row' as const,
  flexWrap: 'wrap' as const,
  alignItems: 'flex-start' as const,
  gap: 8,
};

/** 칩 자체: 콘텐츠 크기 · maxWidth 100% · equal flex 금지 */
export const SOFT_CHIP_ITEM_LAYOUT = {
  flexGrow: 0,
  flexShrink: 1,
  flexBasis: 'auto' as const,
  maxWidth: '100%' as const,
  alignSelf: 'flex-start' as const,
};

/**
 * 결제 칩 톤: 남은 회기 0 → unpaid(amber), 그 외 cream.
 * API 계약 변경 없음 — 클라이언트 표현만.
 */
export function resolvePaymentChipTone(remainingSessions: number): SoftChipTone {
  return remainingSessions === 0 ? 'unpaid' : 'cream';
}

export function resolvePaymentChipValue(remainingSessions: number): string {
  return remainingSessions === 0 ? '미결제' : '최근 완료';
}
