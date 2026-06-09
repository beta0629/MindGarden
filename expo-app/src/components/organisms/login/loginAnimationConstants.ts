/**
 * 로그인 화면 모션·레이아웃 단일 상수 (Login Animation Constants) — V2 B2 Breathing Circle.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md
 *  - §C.1 배경 그라데이션 stops
 *  - §D 모션 (등장 타임라인, Reduce Motion 분기, Press feedback)
 *  - §E.1 로고 사이즈 (96dp / 80dp / 120dp)
 *  - §I.4 SNS 4 provider stagger (카카오/네이버/Google/Apple)
 *  - §M.1 B2 Breathing Circle (280dp Orb, 5s breathing)
 *
 * 본 파일에서만 magic number 를 export 하고 LogoSection / LoginButtonsSection /
 * AnimatedPastelBackground / SocialLoginButton / BreathingCircle 등은 본 상수만 import 한다.
 *
 * Reduce Motion 분기는 §D.2 분기 표를 그대로 따른다 — {@link resolveLoginAnimationConfig}
 * 가 단일 진입점이며 컴포넌트는 이 함수의 결과만 사용한다.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { Easing } from 'react-native';

/* ========================================================================
 *  §D.1 / §M.1.4 Durations & Delays — ms 단위
 * ====================================================================== */

/** 배경 전체 fade-in (정상 모드, §D.1) */
export const BG_FADE_IN_DURATION_MS = 600;
/** Reduce Motion 시 배경 fade-in 단축 (§D.2) */
export const BG_FADE_IN_DURATION_MS_REDUCED = 200;
/** 배경 drift 호흡 1주기 (정상 모드, ∞ 루프, §D.1) */
export const BG_DRIFT_PERIOD_MS = 8000;
/** drift 레이어 opacity 최솟값 */
export const BG_DRIFT_OPACITY_MIN = 0.4;
/** drift 레이어 opacity 최댓값 */
export const BG_DRIFT_OPACITY_MAX = 0.6;

/** 로고 등장 지연 (§M.1.4 — 200ms 시작) */
export const LOGO_FADE_IN_DELAY_MS = 200;
/** 로고 등장 시간 (§M.1.4 — 600ms 길이로 800ms 까지) */
export const LOGO_FADE_IN_DURATION_MS = 600;
/** breathing 시작 지연 (§M.1.4 — fade-in 종료 직후 800ms 부터 ∞) */
export const LOGO_BREATHING_DELAY_MS = 800;
/**
 * Orb breathing 1주기 (§M.1.4 — 5000ms ∞ 루프).
 * "5초 호흡" 은 심리상담 호흡법 기준. 4초 미만은 불안 유발, 6초 초과는 지루.
 */
export const LOGO_BREATHING_PERIOD_MS = 5000;

/** 타이틀("마인드가든") fade-in 지연 (§M.1.4 — 400ms) */
export const TITLE_FADE_IN_DELAY_MS = 400;
/** 타이틀 fade-in 시간 */
export const TITLE_FADE_IN_DURATION_MS = 500;
/** 서브타이틀("마음을 돌보는 시간") fade-in 지연 (§M.1.4 — 600ms) */
export const SUBTITLE_FADE_IN_DELAY_MS = 600;

/**
 * 첫 SNS 버튼(카카오) 등장 시작 시점 (§M.1.4 — 900ms).
 * V1 (800ms) 보다 100ms 늦춰 Orb 호흡 시작과 SNS 등장이 겹치지 않게 한다.
 */
export const BUTTONS_FADE_IN_START_DELAY_MS = 900;
/** 버튼 간 stagger 간격 (§D.1 — 120ms) */
export const BUTTONS_STAGGER_DELAY_MS = 120;
/** Reduce Motion 시 stagger 간격 단축 (§D.2 — 60ms) */
export const BUTTONS_STAGGER_DELAY_MS_REDUCED = 60;
/** 버튼 1개 등장 시간 (§D.1 — 300ms) */
export const BUTTON_FADE_IN_DURATION_MS = 300;

/** Press scale-down 시간 (§D.4) */
export const BUTTON_PRESS_IN_DURATION_MS = 100;
/** Press scale-up 시간 (§D.4) */
export const BUTTON_PRESS_OUT_DURATION_MS = 150;

/* ========================================================================
 *  §M.1.4 / §E.1 Scale & Transform
 * ====================================================================== */

/** Orb 등장 시작 scale (§M.1.4 — 0.92) */
export const LOGO_INITIAL_SCALE = 0.92;
/** Orb 등장 완료 scale */
export const LOGO_FINAL_SCALE = 1.0;
/** Orb breathing 최솟값 (§M.1.4) */
export const LOGO_BREATHING_MIN_SCALE = 1.0;
/**
 * Orb breathing 최댓값 (§M.1.4 — 1.04).
 * V1 의 1.02 (작은 나비 로고용) 대비 크게 — 280dp Orb 는 같은 비율이라도 시각 변화가 미세하므로 1.04 채택.
 */
export const LOGO_BREATHING_MAX_SCALE = 1.04;
/** Orb 외곽 halo 호흡 시 opacity 변화폭 (1.0 ↔ 0.96, §M.1.4) */
export const LOGO_BREATHING_OPACITY_MIN = 0.96;
export const LOGO_BREATHING_OPACITY_MAX = 1.0;

/** 버튼 등장 시 초기 translateY (§D.1 — 8dp) */
export const BUTTON_INITIAL_TRANSLATE_Y = 8;
/** 버튼 등장 완료 translateY */
export const BUTTON_FINAL_TRANSLATE_Y = 0;
/** Press 시 scale (§D.4 — 0.98) */
export const BUTTON_PRESSED_SCALE = 0.98;
/** 타이틀류 초기 translateY (§D.1 — 6dp) */
export const TITLE_INITIAL_TRANSLATE_Y = 6;
/** Reduce Motion 시 Press feedback opacity (§D.4) */
export const BUTTON_PRESSED_OPACITY_REDUCED = 0.85;

/* ========================================================================
 *  §D.1 Easing — react-native Easing 매핑
 * ====================================================================== */

/**
 * Easing 매핑.
 *
 * - `fade` : 일반 등장 (cubic-bezier 효과). 배경·Orb·타이틀·버튼 모두 동상.
 * - `breathing` : Orb 호흡 — sine in/out (자연 호흡 곡선)
 * - `drift` : 배경 두 번째 레이어 oscillation — sine
 * - `press` : 누름 피드백
 */
export const LOGIN_EASING = {
  fade: Easing.out(Easing.cubic),
  breathing: Easing.inOut(Easing.sin),
  drift: Easing.inOut(Easing.sin),
  press: Easing.out(Easing.ease),
} as const;

/* ========================================================================
 *  §E.1 / §M.1.2 Layout & Sizing
 * ====================================================================== */

/**
 * 마인드가든 나비 로고 사이즈 (V2 §E.1) — 280dp Orb 안에 80dp 나비.
 *  - 베이스 80dp (V1 140dp → V2 80dp, "비대 해소").
 *  - Orb 안에 들어가므로 작아도 시각 무게 충분.
 */
export const LOGO_SIZE_BASE = 80;
/** 로고 최소 크기 (iPhone SE 등 좁은 화면) */
export const LOGO_SIZE_MIN = 72;
/** 로고 최대 크기 (iPad 등) */
export const LOGO_SIZE_MAX = 96;

/**
 * V2 §M.1.2 Breathing Circle Orb 사이즈.
 *  - 베이스 280dp (393 폭의 71%).
 *  - SE 240dp / 태블릿 320dp.
 */
export const ORB_SIZE_BASE = 280;
export const ORB_SIZE_MIN = 240;
export const ORB_SIZE_MAX = 320;

/** 화면 폭 임계 — iPhone SE 3rd 가로(375pt) 미만이면 LOGO_SIZE_MIN / ORB_SIZE_MIN */
export const LAYOUT_SMALL_DEVICE_WIDTH = 375;
/** 화면 폭 임계 — 태블릿(744pt) 이상이면 LOGO_SIZE_MAX / ORB_SIZE_MAX */
export const LAYOUT_TABLET_DEVICE_WIDTH = 744;

/** Orb 안에서 나비 → 타이틀 gap (§M.1.2 묶음 내부 시각 비율) */
export const LOGO_TO_TITLE_GAP = 12;
/** 타이틀 → 서브타이틀 gap (§M.1.2) */
export const TITLE_TO_SUBTITLE_GAP = 4;
/** 헤더(Orb 묶음) → 버튼 그룹 gap (§M.1.2) */
export const HEADER_TO_BUTTONS_GAP = 32;

/** 버튼 높이 (§F.1 — 56dp) */
export const BUTTON_HEIGHT = 56;
/** 버튼 border radius (§F.1) */
export const BUTTON_BORDER_RADIUS = 14;
/** 버튼 그룹 간격 (§F.1) */
export const BUTTON_GAP = 12;
/**
 * 브랜드 심볼 크기 (§F.1 — 20dp 묶음 중앙).
 * Google 가이드(§E.2.3) 의 다색 G 도 동일 사이즈로 노출 — 정렬 통일.
 */
export const BUTTON_BRAND_ICON_SIZE = 20;
/** SocialLoginButton 좌우 내부 안전 여백 (§F.1) */
export const BUTTON_HORIZONTAL_PADDING = 16;
/** 묶음 내부 로고↔텍스트 gap (§F.1 — 12dp) */
export const BUTTON_LOGO_TEXT_GAP = 12;

/** 콘텐츠 좌우 padding — 모바일 (§F.3) */
export const CONTENT_HORIZONTAL_PADDING_MOBILE = 24;
/** 콘텐츠 좌우 padding — 태블릿 (§F.3) */
export const CONTENT_HORIZONTAL_PADDING_TABLET = 32;
/** 콘텐츠 상하 padding */
export const CONTENT_VERTICAL_PADDING = 32;
/** iPad 콘텐츠 max width (§F.3) */
export const CONTENT_MAX_WIDTH_TABLET = 440;

/* ========================================================================
 *  §C.1 Background Gradient (LinearGradient stops)
 * ====================================================================== */

/**
 * LinearGradient `colors` — 베이스 레이어 (§C.1).
 * 토큰 매핑: theme.colors.bgMain / loginBgWarm / loginBgBridge / loginBgCool.
 */
export const BG_GRADIENT_STOPS_COLORS_TOKEN_KEYS = [
  'bgMain',
  'loginBgWarm',
  'loginBgBridge',
  'loginBgCool',
] as const;
export const BG_GRADIENT_LOCATIONS: readonly [number, number, number, number] = [0, 0.35, 0.7, 1];
export const BG_GRADIENT_START = { x: 0, y: 0 } as const;
export const BG_GRADIENT_END = { x: 1, y: 1 } as const;

export const BG_DRIFT_STOPS_COLORS_TOKEN_KEYS = [
  'loginBgWarm',
  'loginBgBridge',
  'loginBgCool',
] as const;
export const BG_DRIFT_LOCATIONS: readonly [number, number, number] = [0, 0.5, 1];
export const BG_DRIFT_START = { x: 1, y: 0 } as const;
export const BG_DRIFT_END = { x: 0, y: 1 } as const;

/* ========================================================================
 *  §M.1.4 인터랙션 활성화 — 4 provider stagger 마지막 끝 + 안전 마진
 * ====================================================================== */

/**
 * 모든 SNS 버튼 등장 완료 시점 — Apple(index 3) 마지막 stagger 끝 + Trigger 페이드.
 * 정상 모드: 900(시작) + 120*3(stagger) + 300(fade) = **1560ms**
 * Reduce Motion: 900 + 60*3 + 200 ≈ 1280ms (안전 마진 포함 1100ms 권장)
 */
export const INTERACTION_ENABLE_AT_MS = 1560;
export const INTERACTION_ENABLE_AT_MS_REDUCED = 1100;

/* ========================================================================
 *  Reduce Motion 단일 진입점 (Resolver, §G.4)
 * ====================================================================== */

export interface LoginAnimationConfig {
  readonly reduceMotion: boolean;
  readonly bgFadeInDurationMs: number;
  readonly bgDriftEnabled: boolean;
  readonly logoScaleOnFadeIn: boolean;
  readonly logoBreathingEnabled: boolean;
  readonly titleTranslateOnFadeIn: boolean;
  readonly buttonStaggerDelayMs: number;
  readonly buttonTranslateOnFadeIn: boolean;
  readonly pressScaleEnabled: boolean;
  readonly interactionEnableAtMs: number;
}

export function resolveLoginAnimationConfig(reduceMotion: boolean): LoginAnimationConfig {
  if (reduceMotion) {
    return {
      reduceMotion: true,
      bgFadeInDurationMs: BG_FADE_IN_DURATION_MS_REDUCED,
      bgDriftEnabled: false,
      logoScaleOnFadeIn: false,
      logoBreathingEnabled: false,
      titleTranslateOnFadeIn: false,
      buttonStaggerDelayMs: BUTTONS_STAGGER_DELAY_MS_REDUCED,
      buttonTranslateOnFadeIn: false,
      pressScaleEnabled: false,
      interactionEnableAtMs: INTERACTION_ENABLE_AT_MS_REDUCED,
    };
  }
  return {
    reduceMotion: false,
    bgFadeInDurationMs: BG_FADE_IN_DURATION_MS,
    bgDriftEnabled: true,
    logoScaleOnFadeIn: true,
    logoBreathingEnabled: true,
    titleTranslateOnFadeIn: true,
    buttonStaggerDelayMs: BUTTONS_STAGGER_DELAY_MS,
    buttonTranslateOnFadeIn: true,
    pressScaleEnabled: true,
    interactionEnableAtMs: INTERACTION_ENABLE_AT_MS,
  };
}

/**
 * SNS 버튼 stagger delay 계산 — 첫 카카오(index 0) 가 BUTTONS_FADE_IN_START_DELAY_MS,
 * 이후 stagger 만큼씩 더해진다. V2 는 4 provider (kakao=0, naver=1, google=2, apple=3).
 *
 * @param index 0=카카오, 1=네이버, 2=Google, 3=Apple (iOS 만)
 * @param config {@link resolveLoginAnimationConfig} 결과
 */
export function computeButtonFadeInDelayMs(index: number, config: LoginAnimationConfig): number {
  if (index < 0) {
    return BUTTONS_FADE_IN_START_DELAY_MS;
  }
  return BUTTONS_FADE_IN_START_DELAY_MS + index * config.buttonStaggerDelayMs;
}

/**
 * 화면 폭에서 적정 로고 크기를 계산한다.
 *
 * - width < {@link LAYOUT_SMALL_DEVICE_WIDTH} → {@link LOGO_SIZE_MIN}
 * - width ≥ {@link LAYOUT_TABLET_DEVICE_WIDTH} → {@link LOGO_SIZE_MAX}
 * - 그 외 → {@link LOGO_SIZE_BASE}
 */
export function resolveLogoSizeForWidth(width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    return LOGO_SIZE_BASE;
  }
  if (width < LAYOUT_SMALL_DEVICE_WIDTH) {
    return LOGO_SIZE_MIN;
  }
  if (width >= LAYOUT_TABLET_DEVICE_WIDTH) {
    return LOGO_SIZE_MAX;
  }
  return LOGO_SIZE_BASE;
}

/**
 * 화면 폭에서 적정 Orb 크기를 계산한다 (V2 §M.1.2).
 *
 * - width < {@link LAYOUT_SMALL_DEVICE_WIDTH} → {@link ORB_SIZE_MIN}
 * - width ≥ {@link LAYOUT_TABLET_DEVICE_WIDTH} → {@link ORB_SIZE_MAX}
 * - 그 외 → {@link ORB_SIZE_BASE}
 */
export function resolveOrbSizeForWidth(width: number): number {
  if (!Number.isFinite(width) || width <= 0) {
    return ORB_SIZE_BASE;
  }
  if (width < LAYOUT_SMALL_DEVICE_WIDTH) {
    return ORB_SIZE_MIN;
  }
  if (width >= LAYOUT_TABLET_DEVICE_WIDTH) {
    return ORB_SIZE_MAX;
  }
  return ORB_SIZE_BASE;
}

/* ========================================================================
 *  Gradient stop 토큰 → 색 HEX 배열 헬퍼
 * ====================================================================== */

export type LoginGradientTokenKey = 'bgMain' | 'loginBgWarm' | 'loginBgBridge' | 'loginBgCool';

export function resolveGradientStopsFromTokens(
  keys: readonly LoginGradientTokenKey[],
  colorTable: Readonly<Record<LoginGradientTokenKey, string | undefined>>,
): string[] {
  return keys
    .map((k) => colorTable[k])
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
}
