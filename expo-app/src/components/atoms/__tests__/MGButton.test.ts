/**
 * MGButton — variant 상수 회귀 (컴포넌트 렌더는 RN 환경 필요)
 *
 * @author MindGarden
 * @since 2026-10-28
 */
import { ADMIN_MIN_TOUCH_TARGET } from '@/theme/tokens';

describe('MGButton touch target SSOT', () => {
  it('shares ADMIN_MIN_TOUCH_TARGET ≥ 44 with primary/ghost CTAs', () => {
    expect(ADMIN_MIN_TOUCH_TARGET).toBeGreaterThanOrEqual(44);
  });
});
