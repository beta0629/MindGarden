/**
 * LoginButtonsSection — V2 4 provider stagger + Reduce Motion 분기 단위 테스트.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md
 *  - §A.4 4 provider (kakao=0 / naver=1 / google=2 / apple=3)
 *  - §D.1 stagger 120ms / Reduce Motion 60ms
 *  - §M.1.4 인터랙션 활성 시점 1560ms (정상) / 1100ms (Reduce Motion)
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import {
  BUTTONS_FADE_IN_START_DELAY_MS,
  BUTTONS_STAGGER_DELAY_MS,
  BUTTONS_STAGGER_DELAY_MS_REDUCED,
  BUTTON_FADE_IN_DURATION_MS,
  BUTTON_INITIAL_TRANSLATE_Y,
  INTERACTION_ENABLE_AT_MS,
  INTERACTION_ENABLE_AT_MS_REDUCED,
  computeButtonFadeInDelayMs,
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

describe('computeButtonFadeInDelayMs — V2 §A.4 / §M.1.4 4 provider stagger', () => {
  test('정상 모드: 카카오(index=0) → 시작 delay (900ms, V2 에서 V1 800ms 대비 100ms 늦춤)', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(computeButtonFadeInDelayMs(0, cfg)).toBe(BUTTONS_FADE_IN_START_DELAY_MS);
    expect(computeButtonFadeInDelayMs(0, cfg)).toBe(900);
  });

  test('정상 모드: 네이버(index=1) → 900 + 120 = 1020ms', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(computeButtonFadeInDelayMs(1, cfg)).toBe(
      BUTTONS_FADE_IN_START_DELAY_MS + BUTTONS_STAGGER_DELAY_MS,
    );
    expect(computeButtonFadeInDelayMs(1, cfg)).toBe(1020);
  });

  test('정상 모드: Google(index=2) → 900 + 240 = 1140ms (V2 신규 provider)', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(computeButtonFadeInDelayMs(2, cfg)).toBe(
      BUTTONS_FADE_IN_START_DELAY_MS + 2 * BUTTONS_STAGGER_DELAY_MS,
    );
    expect(computeButtonFadeInDelayMs(2, cfg)).toBe(1140);
  });

  test('정상 모드: Apple(index=3) → 900 + 360 = 1260ms', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(computeButtonFadeInDelayMs(3, cfg)).toBe(
      BUTTONS_FADE_IN_START_DELAY_MS + 3 * BUTTONS_STAGGER_DELAY_MS,
    );
    expect(computeButtonFadeInDelayMs(3, cfg)).toBe(1260);
  });

  test('Reduce Motion: stagger 간격 120 → 60 으로 단축', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.buttonStaggerDelayMs).toBe(BUTTONS_STAGGER_DELAY_MS_REDUCED);
    expect(cfg.buttonStaggerDelayMs).toBe(60);
    expect(computeButtonFadeInDelayMs(3, cfg)).toBe(900 + 3 * 60);
  });

  test('비정상 index(음수) → 시작 delay 안전 폴백', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(computeButtonFadeInDelayMs(-1, cfg)).toBe(BUTTONS_FADE_IN_START_DELAY_MS);
  });
});

describe('pointerEvents 가드 — 인터랙션 활성 시점 (V2 §M.1.4)', () => {
  test('정상 모드: 마지막(Apple index=3) 등장 완료 = 1260 + 300 = 1560ms', () => {
    const cfg = resolveLoginAnimationConfig(false);
    const appleStartDelay = computeButtonFadeInDelayMs(3, cfg);
    expect(appleStartDelay + BUTTON_FADE_IN_DURATION_MS).toBe(INTERACTION_ENABLE_AT_MS);
    expect(cfg.interactionEnableAtMs).toBe(1560);
  });

  test('Reduce Motion: 인터랙션 활성 시점 단축 (1100ms)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.interactionEnableAtMs).toBe(INTERACTION_ENABLE_AT_MS_REDUCED);
    expect(cfg.interactionEnableAtMs).toBe(1100);
  });

  test('정상 모드의 인터랙션 시점이 항상 마지막 stagger 완료 시점 이상', () => {
    const cfg = resolveLoginAnimationConfig(false);
    const lastStaggerEnd = computeButtonFadeInDelayMs(3, cfg) + BUTTON_FADE_IN_DURATION_MS;
    expect(cfg.interactionEnableAtMs).toBeGreaterThanOrEqual(lastStaggerEnd);
  });
});

describe('§D.4 + §G.4 — Press feedback 분기', () => {
  test('정상 모드: pressScaleEnabled=true → scale 0.98 사용', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(cfg.pressScaleEnabled).toBe(true);
  });

  test('Reduce Motion: pressScaleEnabled=false → opacity 0.85 사용', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.pressScaleEnabled).toBe(false);
  });

  test('정상 모드: 버튼 등장 translateY 활성', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(cfg.buttonTranslateOnFadeIn).toBe(true);
    expect(BUTTON_INITIAL_TRANSLATE_Y).toBe(8);
  });

  test('Reduce Motion: 버튼 등장 translateY 비활성', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.buttonTranslateOnFadeIn).toBe(false);
  });
});

describe('§D.1 stagger 토큰 값 무결성 (V2)', () => {
  test('BUTTONS_STAGGER_DELAY_MS 가 정확히 120ms (스펙 §D.1)', () => {
    expect(BUTTONS_STAGGER_DELAY_MS).toBe(120);
  });

  test('BUTTON_FADE_IN_DURATION_MS 가 정확히 300ms (스펙 §D.1)', () => {
    expect(BUTTON_FADE_IN_DURATION_MS).toBe(300);
  });

  test('BUTTONS_FADE_IN_START_DELAY_MS 가 V2 900ms (Orb 호흡과 충돌 방지)', () => {
    expect(BUTTONS_FADE_IN_START_DELAY_MS).toBe(900);
  });
});
