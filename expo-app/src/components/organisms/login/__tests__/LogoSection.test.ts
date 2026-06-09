/**
 * V2 BreathingCircle — Reduce Motion 분기 + 반응형 Orb/나비 크기 단위 테스트.
 *
 * 컴포넌트 전체 렌더는 react-native 환경이 필요하므로 본 테스트는
 * `resolveLoginAnimationConfig`, `resolveLogoSizeForWidth`, `resolveOrbSizeForWidth`,
 * 호흡 토큰 무결성만 검증한다.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md §E.1 / §G.4 / §M.1.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import {
  LOGO_SIZE_BASE,
  LOGO_SIZE_MAX,
  LOGO_SIZE_MIN,
  LAYOUT_SMALL_DEVICE_WIDTH,
  LAYOUT_TABLET_DEVICE_WIDTH,
  LOGO_BREATHING_MAX_SCALE,
  LOGO_BREATHING_MIN_SCALE,
  LOGO_BREATHING_OPACITY_MAX,
  LOGO_BREATHING_OPACITY_MIN,
  LOGO_BREATHING_PERIOD_MS,
  LOGO_FINAL_SCALE,
  LOGO_INITIAL_SCALE,
  ORB_SIZE_BASE,
  ORB_SIZE_MAX,
  ORB_SIZE_MIN,
  resolveLoginAnimationConfig,
  resolveLogoSizeForWidth,
  resolveOrbSizeForWidth,
} from '@/components/organisms/login/loginAnimationConstants';

jest.mock('react-native', () => ({
  Easing: {
    out: jest.fn((curve: unknown) => curve),
    inOut: jest.fn((curve: unknown) => curve),
    cubic: 'cubic',
    ease: 'ease',
    sin: 'sin',
  },
}));

describe('resolveLogoSizeForWidth — V2 §E.1 나비 사이즈 (80dp / 72dp / 96dp)', () => {
  test('iPhone SE (320pt) → LOGO_SIZE_MIN(72)', () => {
    expect(resolveLogoSizeForWidth(320)).toBe(LOGO_SIZE_MIN);
    expect(LOGO_SIZE_MIN).toBe(72);
  });

  test('iPhone SE 3rd (374pt: 임계 직전) → LOGO_SIZE_MIN(72)', () => {
    expect(resolveLogoSizeForWidth(LAYOUT_SMALL_DEVICE_WIDTH - 1)).toBe(LOGO_SIZE_MIN);
  });

  test('iPhone SE 3rd (375pt: 임계점) → LOGO_SIZE_BASE(80)', () => {
    expect(resolveLogoSizeForWidth(LAYOUT_SMALL_DEVICE_WIDTH)).toBe(LOGO_SIZE_BASE);
    expect(LOGO_SIZE_BASE).toBe(80);
  });

  test('iPhone 14 Pro (393pt) → LOGO_SIZE_BASE(80)', () => {
    expect(resolveLogoSizeForWidth(393)).toBe(LOGO_SIZE_BASE);
  });

  test('iPhone 14 Pro Max (430pt) → LOGO_SIZE_BASE(80)', () => {
    expect(resolveLogoSizeForWidth(430)).toBe(LOGO_SIZE_BASE);
  });

  test('iPad mini (744pt: 임계점) → LOGO_SIZE_MAX(96)', () => {
    expect(resolveLogoSizeForWidth(LAYOUT_TABLET_DEVICE_WIDTH)).toBe(LOGO_SIZE_MAX);
    expect(LOGO_SIZE_MAX).toBe(96);
  });

  test('iPad Pro 12.9 (1024pt) → LOGO_SIZE_MAX(96)', () => {
    expect(resolveLogoSizeForWidth(1024)).toBe(LOGO_SIZE_MAX);
  });

  test('비정상 입력(0/음수/NaN/Infinity) → LOGO_SIZE_BASE 안전 폴백', () => {
    expect(resolveLogoSizeForWidth(0)).toBe(LOGO_SIZE_BASE);
    expect(resolveLogoSizeForWidth(-100)).toBe(LOGO_SIZE_BASE);
    expect(resolveLogoSizeForWidth(Number.NaN)).toBe(LOGO_SIZE_BASE);
    expect(resolveLogoSizeForWidth(Number.POSITIVE_INFINITY)).toBe(LOGO_SIZE_BASE);
  });
});

describe('resolveOrbSizeForWidth — V2 §M.1.2 Breathing Circle 사이즈 (280dp / 240dp / 320dp)', () => {
  test('iPhone SE (320pt) → ORB_SIZE_MIN(240)', () => {
    expect(resolveOrbSizeForWidth(320)).toBe(ORB_SIZE_MIN);
    expect(ORB_SIZE_MIN).toBe(240);
  });

  test('iPhone 14 Pro (393pt) → ORB_SIZE_BASE(280)', () => {
    expect(resolveOrbSizeForWidth(393)).toBe(ORB_SIZE_BASE);
    expect(ORB_SIZE_BASE).toBe(280);
  });

  test('iPad mini (744pt) → ORB_SIZE_MAX(320)', () => {
    expect(resolveOrbSizeForWidth(LAYOUT_TABLET_DEVICE_WIDTH)).toBe(ORB_SIZE_MAX);
    expect(ORB_SIZE_MAX).toBe(320);
  });

  test('비정상 입력(0/음수/NaN) → ORB_SIZE_BASE 안전 폴백', () => {
    expect(resolveOrbSizeForWidth(0)).toBe(ORB_SIZE_BASE);
    expect(resolveOrbSizeForWidth(-1)).toBe(ORB_SIZE_BASE);
    expect(resolveOrbSizeForWidth(Number.NaN)).toBe(ORB_SIZE_BASE);
  });
});

describe('resolveLoginAnimationConfig(reduceMotion=true) — V2 §G.4 분기 (BreathingCircle 관점)', () => {
  test('reduceMotion=true → 로고 scale 변화 비활성 (logoScaleOnFadeIn=false)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.logoScaleOnFadeIn).toBe(false);
  });

  test('reduceMotion=true → Orb breathing 정지 (logoBreathingEnabled=false)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.logoBreathingEnabled).toBe(false);
  });

  test('reduceMotion=true → 타이틀 translateY 변화 비활성', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.titleTranslateOnFadeIn).toBe(false);
  });

  test('reduceMotion=true → 인터랙션 활성 시점 단축 (1560 → 1100)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.interactionEnableAtMs).toBe(1100);
  });

  test('reduceMotion=false → Orb scale·breathing·translate 모두 활성', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(cfg.logoScaleOnFadeIn).toBe(true);
    expect(cfg.logoBreathingEnabled).toBe(true);
    expect(cfg.titleTranslateOnFadeIn).toBe(true);
    expect(cfg.interactionEnableAtMs).toBe(1560);
  });
});

describe('V2 §M.1.4 — Orb breathing/scale 토큰 값 무결성', () => {
  test('LOGO_BREATHING_MAX_SCALE 가 정확히 1.04 (V2 — 280dp Orb 비율 보강)', () => {
    expect(LOGO_BREATHING_MAX_SCALE).toBe(1.04);
  });

  test('LOGO_BREATHING_MIN_SCALE 가 1.00', () => {
    expect(LOGO_BREATHING_MIN_SCALE).toBe(1.0);
  });

  test('LOGO_INITIAL_SCALE 0.92 → LOGO_FINAL_SCALE 1.00 (등장 시 살짝 커짐)', () => {
    expect(LOGO_INITIAL_SCALE).toBeLessThan(LOGO_FINAL_SCALE);
    expect(LOGO_INITIAL_SCALE).toBe(0.92);
    expect(LOGO_FINAL_SCALE).toBe(1.0);
  });

  test('Orb breathing opacity 1.00 ↔ 0.96 (§M.1.4)', () => {
    expect(LOGO_BREATHING_OPACITY_MAX).toBe(1.0);
    expect(LOGO_BREATHING_OPACITY_MIN).toBe(0.96);
  });

  test('LOGO_BREATHING_PERIOD_MS 가 정확히 5000ms (5초 호흡)', () => {
    expect(LOGO_BREATHING_PERIOD_MS).toBe(5000);
  });
});
