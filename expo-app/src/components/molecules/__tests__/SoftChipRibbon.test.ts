/**
 * SoftChipRibbon — 비대칭 wrap 레이아웃 · unpaid 톤 pure 검증
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import {
  SOFT_CHIP_ITEM_LAYOUT,
  SOFT_CHIP_RIBBON_LAYOUT,
  resolvePaymentChipTone,
  resolvePaymentChipValue,
} from '@/components/molecules/softChipRibbonLayout';

describe('SoftChipRibbon layout (asymmetric wrap)', () => {
  it('uses flexWrap wrap/flow — not equal 2×2 or 3-col KPI', () => {
    expect(SOFT_CHIP_RIBBON_LAYOUT.flexDirection).toBe('row');
    expect(SOFT_CHIP_RIBBON_LAYOUT.flexWrap).toBe('wrap');
    expect(SOFT_CHIP_RIBBON_LAYOUT.alignItems).toBe('flex-start');
    expect(SOFT_CHIP_ITEM_LAYOUT.flexGrow).toBe(0);
    expect(SOFT_CHIP_ITEM_LAYOUT.flexBasis).toBe('auto');
    expect(SOFT_CHIP_ITEM_LAYOUT.maxWidth).toBe('100%');
  });
});

describe('resolvePaymentChipTone / value', () => {
  it('uses amber unpaid only when remainingSessions === 0', () => {
    expect(resolvePaymentChipTone(0)).toBe('unpaid');
    expect(resolvePaymentChipValue(0)).toBe('미결제');
  });

  it('uses cream 「최근 완료」 when sessions remain', () => {
    expect(resolvePaymentChipTone(1)).toBe('cream');
    expect(resolvePaymentChipTone(6)).toBe('cream');
    expect(resolvePaymentChipValue(3)).toBe('최근 완료');
  });
});
