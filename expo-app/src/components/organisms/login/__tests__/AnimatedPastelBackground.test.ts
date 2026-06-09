/**
 * AnimatedPastelBackground — Reduce Motion 분기 + 토큰→색 매핑 단위 테스트.
 *
 * 컴포넌트 전체 렌더(LinearGradient + useTheme) 는 react-native 환경이 필요하므로
 * 본 테스트는 {@link resolveLoginAnimationConfig} 와 {@link resolveGradientStopsFromTokens} 만 검증한다.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §1.3 / §4.5 / §6.
 *
 * 본 파일의 HEX 리터럴은 토큰 매핑 정확도 검증용 fixture (실제 토큰값 #FAF9F7 / #FFF6E8 / #F4F1EA /
 * #EFF3F0 가 표준이 변경되어도 본 테스트가 깨지면 즉시 발견되도록 의도).
 *
 * @author MindGarden
 * @since 2026-06-10
 */
/* eslint-disable no-restricted-syntax */
import {
  BG_DRIFT_LOCATIONS,
  BG_DRIFT_OPACITY_MAX,
  BG_DRIFT_OPACITY_MIN,
  BG_DRIFT_PERIOD_MS,
  BG_DRIFT_STOPS_COLORS_TOKEN_KEYS,
  BG_FADE_IN_DURATION_MS,
  BG_FADE_IN_DURATION_MS_REDUCED,
  BG_GRADIENT_LOCATIONS,
  BG_GRADIENT_STOPS_COLORS_TOKEN_KEYS,
  resolveGradientStopsFromTokens,
  resolveLoginAnimationConfig,
  type LoginGradientTokenKey,
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

const SAMPLE_COLOR_TABLE: Readonly<Record<LoginGradientTokenKey, string>> = {
  bgMain: '#FAF9F7',
  loginBgWarm: '#FFF6E8',
  loginBgBridge: '#F4F1EA',
  loginBgCool: '#EFF3F0',
};

describe('resolveGradientStopsFromTokens — §1.3 / §4.5 토큰 매핑', () => {
  test('base 4 stops: bgMain → warm → bridge → cool 순서 보장', () => {
    const stops = resolveGradientStopsFromTokens(
      BG_GRADIENT_STOPS_COLORS_TOKEN_KEYS,
      SAMPLE_COLOR_TABLE,
    );
    expect(stops).toEqual(['#FAF9F7', '#FFF6E8', '#F4F1EA', '#EFF3F0']);
  });

  test('drift 3 stops: warm → bridge → cool (gradient ribbon)', () => {
    const stops = resolveGradientStopsFromTokens(
      BG_DRIFT_STOPS_COLORS_TOKEN_KEYS,
      SAMPLE_COLOR_TABLE,
    );
    expect(stops).toEqual(['#FFF6E8', '#F4F1EA', '#EFF3F0']);
  });

  test('일부 토큰이 비어 있어도(undefined) invalid 색은 결과에서 제외 (LinearGradient 안전)', () => {
    const partial: Readonly<Record<LoginGradientTokenKey, string | undefined>> = {
      bgMain: '#FAF9F7',
      loginBgWarm: undefined,
      loginBgBridge: '#F4F1EA',
      loginBgCool: '#EFF3F0',
    };
    const stops = resolveGradientStopsFromTokens(BG_GRADIENT_STOPS_COLORS_TOKEN_KEYS, partial);
    expect(stops).toEqual(['#FAF9F7', '#F4F1EA', '#EFF3F0']);
  });

  test('빈 문자열도 invalid → 결과에서 제외', () => {
    const partial: Readonly<Record<LoginGradientTokenKey, string>> = {
      ...SAMPLE_COLOR_TABLE,
      loginBgBridge: '',
    };
    const stops = resolveGradientStopsFromTokens(BG_GRADIENT_STOPS_COLORS_TOKEN_KEYS, partial);
    expect(stops).toEqual(['#FAF9F7', '#FFF6E8', '#EFF3F0']);
  });

  test('locations 배열의 길이가 base/drift stops 길이와 일치 (LinearGradient 요구)', () => {
    expect(BG_GRADIENT_LOCATIONS.length).toBe(BG_GRADIENT_STOPS_COLORS_TOKEN_KEYS.length);
    expect(BG_DRIFT_LOCATIONS.length).toBe(BG_DRIFT_STOPS_COLORS_TOKEN_KEYS.length);
  });
});

describe('resolveLoginAnimationConfig — §6 배경 fade·drift Reduce Motion 분기', () => {
  test('정상 모드: bgFadeInDurationMs = 600ms, bgDriftEnabled = true', () => {
    const cfg = resolveLoginAnimationConfig(false);
    expect(cfg.bgFadeInDurationMs).toBe(BG_FADE_IN_DURATION_MS);
    expect(cfg.bgFadeInDurationMs).toBe(600);
    expect(cfg.bgDriftEnabled).toBe(true);
  });

  test('Reduce Motion: bgFadeInDurationMs = 200ms (단축), bgDriftEnabled = false (정지)', () => {
    const cfg = resolveLoginAnimationConfig(true);
    expect(cfg.bgFadeInDurationMs).toBe(BG_FADE_IN_DURATION_MS_REDUCED);
    expect(cfg.bgFadeInDurationMs).toBe(200);
    expect(cfg.bgDriftEnabled).toBe(false);
  });

  test('정상 모드 fade-in 이 Reduce Motion fade-in 보다 길어야 (cubic-bezier 인식 유지)', () => {
    const normal = resolveLoginAnimationConfig(false);
    const reduced = resolveLoginAnimationConfig(true);
    expect(normal.bgFadeInDurationMs).toBeGreaterThan(reduced.bgFadeInDurationMs);
  });
});

describe('§4.1 drift 토큰 값 무결성', () => {
  test('BG_DRIFT_PERIOD_MS 가 8초 (스펙 §3.1 단계 2)', () => {
    expect(BG_DRIFT_PERIOD_MS).toBe(8000);
  });

  test('drift opacity 범위 0.4 ↔ 0.6 (스펙 §3.1 단계 2)', () => {
    expect(BG_DRIFT_OPACITY_MIN).toBe(0.4);
    expect(BG_DRIFT_OPACITY_MAX).toBe(0.6);
    expect(BG_DRIFT_OPACITY_MIN).toBeLessThan(BG_DRIFT_OPACITY_MAX);
  });
});
