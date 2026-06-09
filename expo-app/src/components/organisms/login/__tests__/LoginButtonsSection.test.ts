/**
 * LoginButtonsSection — stagger 계산 + pointerEvents 가드 + Reduce Motion 분기 단위 테스트.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §3.1 / §4.1 / §6.
 *
 * 본 테스트는 컴포넌트 렌더 없이 stagger 수치·인터랙션 활성 시점만 검증한다.
 * `pointerEvents` 가드는 setTimeout 으로 활성되며, 본 테스트는 활성 시점(ms) 의 정합성만 확인한다.
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

describe('computeButtonFadeInDelayMs — §3.1 단계 9~11 stagger', () => {
  test('정상 모드: 카카오(index=0) → 시작 delay (800ms)', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(computeButtonFadeInDelayMs(0, cfg)).toBe(BUTTONS_FADE_IN_START_DELAY_MS);
    expect(computeButtonFadeInDelayMs(0, cfg)).toBe(800);
  });

  test('정상 모드: 네이버(index=1) → 800 + 120 = 920ms', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(computeButtonFadeInDelayMs(1, cfg)).toBe(
      BUTTONS_FADE_IN_START_DELAY_MS + BUTTONS_STAGGER_DELAY_MS,
    );
    expect(computeButtonFadeInDelayMs(1, cfg)).toBe(920);
  });

  test('정상 모드: Apple(index=2) → 800 + 240 = 1040ms', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(computeButtonFadeInDelayMs(2, cfg)).toBe(
      BUTTONS_FADE_IN_START_DELAY_MS + 2 * BUTTONS_STAGGER_DELAY_MS,
    );
    expect(computeButtonFadeInDelayMs(2, cfg)).toBe(1040);
  });

  test('Reduce Motion: stagger 간격 120 → 60 으로 단축', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.buttonStaggerDelayMs).toBe(BUTTONS_STAGGER_DELAY_MS_REDUCED);
    expect(cfg.buttonStaggerDelayMs).toBe(60);
    expect(computeButtonFadeInDelayMs(2, cfg)).toBe(800 + 2 * 60);
  });

  test('비정상 index(음수) → 시작 delay 안전 폴백', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(computeButtonFadeInDelayMs(-1, cfg)).toBe(BUTTONS_FADE_IN_START_DELAY_MS);
  });
});

describe('pointerEvents 가드 — 인터랙션 활성 시점', () => {
  test('정상 모드: 마지막(Apple) 등장 완료 = 1040 + 300 = 1340ms', () => {
    const cfg = resolveLoginAnimationConfig(false);
    const appleStartDelay = computeButtonFadeInDelayMs(2, cfg);
    expect(appleStartDelay + BUTTON_FADE_IN_DURATION_MS).toBe(INTERACTION_ENABLE_AT_MS);
    expect(cfg.interactionEnableAtMs).toBe(1340);
  });

  test('Reduce Motion: 인터랙션 활성 시점 단축 (800ms)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.interactionEnableAtMs).toBe(INTERACTION_ENABLE_AT_MS_REDUCED);
    expect(cfg.interactionEnableAtMs).toBe(800);
  });

  test('정상 모드의 인터랙션 시점이 항상 stagger 마지막 시점 이상 (안전 마진 보장)', () => {
    const cfg = resolveLoginAnimationConfig(false);
    const lastStaggerEnd = computeButtonFadeInDelayMs(2, cfg) + BUTTON_FADE_IN_DURATION_MS;
    expect(cfg.interactionEnableAtMs).toBeGreaterThanOrEqual(lastStaggerEnd);
  });
});

describe('§3.2 + §6 — Press feedback 분기', () => {
  test('정상 모드: pressScaleEnabled=true → scale 0.98 사용', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(cfg.pressScaleEnabled).toBe(true);
  });

  test('Reduce Motion: pressScaleEnabled=false → opacity 0.85 사용 (§6 분기)', () => {
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

describe('§4.1 stagger 토큰 값 무결성', () => {
  test('BUTTONS_STAGGER_DELAY_MS 가 80~120 범위 (스펙 §4.1: 가독성·집중도 우선 120)', () => {
    expect(BUTTONS_STAGGER_DELAY_MS).toBeGreaterThanOrEqual(80);
    expect(BUTTONS_STAGGER_DELAY_MS).toBeLessThanOrEqual(120);
    expect(BUTTONS_STAGGER_DELAY_MS).toBe(120);
  });

  test('BUTTON_FADE_IN_DURATION_MS 가 정확히 300 (스펙 §4.1)', () => {
    expect(BUTTON_FADE_IN_DURATION_MS).toBe(300);
  });
});
