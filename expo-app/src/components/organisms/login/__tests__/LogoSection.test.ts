/**
 * LogoSection — Reduce Motion 분기 + 반응형 로고 크기 단위 테스트.
 *
 * 컴포넌트 전체 렌더는 react-native 환경이 필요하므로 본 테스트는
 * {@link resolveLoginAnimationConfig}, {@link resolveLogoSizeForWidth} 만 검증한다.
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §6 / §7.
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
  LOGO_FINAL_SCALE,
  LOGO_INITIAL_SCALE,
  resolveLogoSizeForWidth,
  resolveLoginAnimationConfig,
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

describe('resolveLogoSizeForWidth — §7 반응형 로고 크기', () => {
  test('iPhone SE (320pt) → LOGO_SIZE_MIN(120)', () => {
    expect(resolveLogoSizeForWidth(320)).toBe(LOGO_SIZE_MIN);
  });

  test('iPhone SE 3rd (374pt: 임계 직전) → LOGO_SIZE_MIN(120)', () => {
    expect(resolveLogoSizeForWidth(LAYOUT_SMALL_DEVICE_WIDTH - 1)).toBe(LOGO_SIZE_MIN);
  });

  test('iPhone SE 3rd (375pt: 임계점) → LOGO_SIZE_BASE(140)', () => {
    expect(resolveLogoSizeForWidth(LAYOUT_SMALL_DEVICE_WIDTH)).toBe(LOGO_SIZE_BASE);
  });

  test('iPhone 14 Pro (393pt) → LOGO_SIZE_BASE(140)', () => {
    expect(resolveLogoSizeForWidth(393)).toBe(LOGO_SIZE_BASE);
  });

  test('iPhone 14 Pro Max (430pt) → LOGO_SIZE_BASE(140)', () => {
    expect(resolveLogoSizeForWidth(430)).toBe(LOGO_SIZE_BASE);
  });

  test('iPad mini (744pt: 임계점) → LOGO_SIZE_MAX(160)', () => {
    expect(resolveLogoSizeForWidth(LAYOUT_TABLET_DEVICE_WIDTH)).toBe(LOGO_SIZE_MAX);
  });

  test('iPad Pro 12.9 (1024pt) → LOGO_SIZE_MAX(160)', () => {
    expect(resolveLogoSizeForWidth(1024)).toBe(LOGO_SIZE_MAX);
  });

  test('비정상 입력(0/음수/NaN/Infinity) → LOGO_SIZE_BASE 안전 폴백', () => {
    expect(resolveLogoSizeForWidth(0)).toBe(LOGO_SIZE_BASE);
    expect(resolveLogoSizeForWidth(-100)).toBe(LOGO_SIZE_BASE);
    expect(resolveLogoSizeForWidth(Number.NaN)).toBe(LOGO_SIZE_BASE);
    expect(resolveLogoSizeForWidth(Number.POSITIVE_INFINITY)).toBe(LOGO_SIZE_BASE);
  });
});

describe('resolveLoginAnimationConfig(reduceMotion=true) — §6 분기 (LogoSection 관점)', () => {
  test('reduceMotion=true → 로고 scale 변화 비활성 (logoScaleOnFadeIn=false)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.logoScaleOnFadeIn).toBe(false);
  });

  test('reduceMotion=true → 로고 breathing 정지 (logoBreathingEnabled=false)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.logoBreathingEnabled).toBe(false);
  });

  test('reduceMotion=true → 타이틀 translateY 변화 비활성 (titleTranslateOnFadeIn=false)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.titleTranslateOnFadeIn).toBe(false);
  });

  test('reduceMotion=true → 인터랙션 활성 시점 단축 (1340 → 800)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.interactionEnableAtMs).toBe(800);
  });

  test('reduceMotion=false → 로고 scale·breathing·translate 모두 활성', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(cfg.logoScaleOnFadeIn).toBe(true);
    expect(cfg.logoBreathingEnabled).toBe(true);
    expect(cfg.titleTranslateOnFadeIn).toBe(true);
    expect(cfg.interactionEnableAtMs).toBe(1340);
  });
});

describe('LogoSection — breathing/scale 토큰 값 무결성', () => {
  test('LOGO_BREATHING_MAX_SCALE 가 정확히 1.02 (사용자 명시 — 절대 과장 금지)', () => {
    expect(LOGO_BREATHING_MAX_SCALE).toBe(1.02);
  });

  test('LOGO_BREATHING_MIN_SCALE 가 1.00 (호흡 시작점)', () => {
    expect(LOGO_BREATHING_MIN_SCALE).toBe(1.0);
  });

  test('LOGO_INITIAL_SCALE 0.96 → LOGO_FINAL_SCALE 1.00 (등장 시 살짝 커짐)', () => {
    expect(LOGO_INITIAL_SCALE).toBeLessThan(LOGO_FINAL_SCALE);
    expect(LOGO_INITIAL_SCALE).toBe(0.96);
    expect(LOGO_FINAL_SCALE).toBe(1.0);
  });
});
