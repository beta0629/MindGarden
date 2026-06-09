/**
 * 로그인 화면 모션·레이아웃 단일 상수 (Login Animation Constants)
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §4 수치 표.
 *
 * 본 파일에서만 magic number 를 export 하고 LogoSection / LoginButtonsSection /
 * AnimatedPastelBackground / SocialLoginButton 은 본 상수만 import 한다.
 * 새 값이 필요하면 먼저 스펙 §4 에 합의된 토큰을 추가한 뒤 여기에만 반영한다.
 *
 * Reduce Motion 분기는 §6 분기 표를 그대로 따른다 — {@link resolveLoginAnimationConfig}
 * 가 단일 진입점이며 컴포넌트는 이 함수의 결과만 사용한다.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { Easing } from 'react-native';

/* ========================================================================
 *  §4.1 Durations & Delays — ms 단위
 * ====================================================================== */

/** 배경 전체 fade-in (스펙 §3.1 단계 1) */
export const BG_FADE_IN_DURATION_MS = 600;
/** Reduce Motion 시 배경 fade-in 단축 (스펙 §6) */
export const BG_FADE_IN_DURATION_MS_REDUCED = 200;
/** 배경 drift 호흡 1주기 (정상 모드, ∞ 루프) */
export const BG_DRIFT_PERIOD_MS = 8000;
/** drift 레이어 opacity 최솟값 (warm 레이어가 cool 위로 옅게 흐르는 상한) */
export const BG_DRIFT_OPACITY_MIN = 0.4;
/** drift 레이어 opacity 최댓값 */
export const BG_DRIFT_OPACITY_MAX = 0.6;

/** 로고 등장 지연 */
export const LOGO_FADE_IN_DELAY_MS = 200;
/** 로고 등장 시간 */
export const LOGO_FADE_IN_DURATION_MS = 500;
/** breathing 시작 지연 (fade-in 완료 직후) */
export const LOGO_BREATHING_DELAY_MS = 700;
/** breathing 1주기 */
export const LOGO_BREATHING_PERIOD_MS = 5000;

/** 타이틀("마인드가든") fade-in 지연 */
export const TITLE_FADE_IN_DELAY_MS = 400;
/** 타이틀 fade-in 시간 */
export const TITLE_FADE_IN_DURATION_MS = 500;
/** 서브타이틀("심리상담센터") fade-in 지연 */
export const SUBTITLE_FADE_IN_DELAY_MS = 500;

/** 첫 SNS 버튼(카카오) 등장 시작 시점 */
export const BUTTONS_FADE_IN_START_DELAY_MS = 800;
/** 버튼 간 stagger 간격 — 80~120ms 권장 범위 중 120ms (가독성·집중도 우선) */
export const BUTTONS_STAGGER_DELAY_MS = 120;
/** Reduce Motion 시 stagger 간격 단축 */
export const BUTTONS_STAGGER_DELAY_MS_REDUCED = 60;
/** 버튼 1개 등장 시간 */
export const BUTTON_FADE_IN_DURATION_MS = 300;

/** Press scale-down 시간 */
export const BUTTON_PRESS_IN_DURATION_MS = 100;
/** Press scale-up 시간 */
export const BUTTON_PRESS_OUT_DURATION_MS = 150;

/* ========================================================================
 *  §4.2 Scale & Transform
 * ====================================================================== */

/** 로고 등장 시작 scale */
export const LOGO_INITIAL_SCALE = 0.96;
/** 로고 등장 완료 scale */
export const LOGO_FINAL_SCALE = 1.0;
/** breathing 최솟값 */
export const LOGO_BREATHING_MIN_SCALE = 1.0;
/** breathing 최댓값 (1.02 = 사용자 명시 미세 호흡, 절대 과장 금지) */
export const LOGO_BREATHING_MAX_SCALE = 1.02;
/** 버튼 등장 시 초기 translateY (px, 아래에서 위로) */
export const BUTTON_INITIAL_TRANSLATE_Y = 8;
/** 버튼 등장 완료 translateY */
export const BUTTON_FINAL_TRANSLATE_Y = 0;
/** Press 시 scale */
export const BUTTON_PRESSED_SCALE = 0.98;
/** 타이틀류 초기 translateY (px) */
export const TITLE_INITIAL_TRANSLATE_Y = 6;
/** Reduce Motion 시 Press feedback opacity (scale 대신) */
export const BUTTON_PRESSED_OPACITY_REDUCED = 0.85;

/* ========================================================================
 *  §4.3 Easing — react-native Easing 매핑
 * ====================================================================== */

/**
 * Easing 매핑.
 *
 * - `fade` : 일반 등장 (cubic-bezier 효과). 배경·로고·타이틀·버튼 모두 동상.
 * - `breathing` : 로고 호흡 — 자연 호흡선
 * - `drift` : 배경 두 번째 레이어 oscillation — 사인 곡선
 * - `press` : 누름 피드백
 */
export const LOGIN_EASING = {
  fade: Easing.out(Easing.cubic),
  breathing: Easing.inOut(Easing.ease),
  drift: Easing.inOut(Easing.sin),
  press: Easing.out(Easing.ease),
} as const;

/* ========================================================================
 *  §4.4 Layout & Sizing
 * ====================================================================== */

/** 로고 크기 (393pt 기준) */
export const LOGO_SIZE_BASE = 140;
/** 로고 최소 크기 (320pt 화면 — iPhone SE 가로폭) */
export const LOGO_SIZE_MIN = 120;
/** 로고 최대 크기 (iPad 등) */
export const LOGO_SIZE_MAX = 160;

/** 화면 폭 임계 — iPhone SE 3rd 가로(375pt) 이하면 LOGO_SIZE_MIN */
export const LAYOUT_SMALL_DEVICE_WIDTH = 375;
/** 화면 폭 임계 — 태블릿(744pt) 이상이면 LOGO_SIZE_MAX */
export const LAYOUT_TABLET_DEVICE_WIDTH = 744;

/** 로고 → 타이틀 gap */
export const LOGO_TO_TITLE_GAP = 20;
/** 타이틀 → 서브타이틀 gap */
export const TITLE_TO_SUBTITLE_GAP = 6;
/** 헤더(로고/타이틀) → 버튼 그룹 gap */
export const HEADER_TO_BUTTONS_GAP = 40;

/** 버튼 높이 (스펙 §H: 56dp — 모든 provider 통일) */
export const BUTTON_HEIGHT = 56;
/** 버튼 border radius */
export const BUTTON_BORDER_RADIUS = 12;
/** 버튼 그룹 간격 */
export const BUTTON_GAP = 12;
/**
 * 브랜드 심볼 크기 (사용자 결정 2026-06-10 §AU — 웹 정합 18dp).
 * 웹 `frontend/src/components/auth/UnifiedLogin.js` 의 SNS SVG (`width="18" height="18"`) 와
 * 정확히 동일 사이즈. Apple 네이티브 버튼의 시각 무게에 맞춤. 카카오톡 워드마크는
 * 단순 말풍선(`KakaoBrandIcon`)으로 교체해 18dp 에서 인지성 유지.
 */
export const BUTTON_BRAND_ICON_SIZE = 18;
/**
 * SocialLoginButton 좌우 내부 패딩 (사용자 결정 2026-06-10 §AQ-1).
 * 로고가 버튼 좌측 끝에 너무 가까이 붙는 문제 해소. 좌측 20dp 안쪽에 로고 시작.
 */
export const BUTTON_HORIZONTAL_PADDING = 20;
/**
 * 로고↔텍스트 간격 (사용자 결정 2026-06-10 §AA 분할 정렬용).
 * 텍스트는 `paddingLeft: BUTTON_LOGO_TEXT_GAP` 으로 로고와 간격을 두고 시작하며,
 * 우측은 `paddingRight: BUTTON_BRAND_ICON_SIZE + BUTTON_LOGO_TEXT_GAP` 로 시각 중심 정렬.
 */
export const BUTTON_LOGO_TEXT_GAP = 12;

/** 콘텐츠 좌우 padding — 모바일 */
export const CONTENT_HORIZONTAL_PADDING_MOBILE = 24;
/** 콘텐츠 좌우 padding — 태블릿 */
export const CONTENT_HORIZONTAL_PADDING_TABLET = 32;
/** 콘텐츠 상하 padding */
export const CONTENT_VERTICAL_PADDING = 40;
/** iPad 콘텐츠 max width (가로 늘어남 방지) */
export const CONTENT_MAX_WIDTH_TABLET = 440;

/* ========================================================================
 *  §4.5 Background Gradient (LinearGradient stops)
 * ====================================================================== */

/**
 * LinearGradient `colors` — 베이스 레이어 (정적).
 * SSOT: 스펙 §1.3. 토큰 매핑: theme.colors.bgMain / loginBgWarm / loginBgBridge / loginBgCool.
 */
export const BG_GRADIENT_STOPS_COLORS_TOKEN_KEYS = [
  'bgMain',
  'loginBgWarm',
  'loginBgBridge',
  'loginBgCool',
] as const;
/**
 * Stop 위치 — LinearGradient 의 `locations` 는 `readonly [number, number, ...]` 튜플을 요구하므로
 * mutable number[] 로 캐스팅하여 호환.
 */
export const BG_GRADIENT_LOCATIONS: readonly [number, number, number, number] = [0, 0.35, 0.7, 1];
/** 정적 베이스 그라데이션 방향 — 좌상 → 우하 */
export const BG_GRADIENT_START = { x: 0, y: 0 } as const;
export const BG_GRADIENT_END = { x: 1, y: 1 } as const;
/**
 * Drift 레이어(warm 호흡) — bgMain + loginBgWarm + bgMain 의 부드러운 가로 ribbon.
 * 정적 베이스 위에 opacity 0.4↔0.6 으로 oscillate.
 */
export const BG_DRIFT_STOPS_COLORS_TOKEN_KEYS = [
  'loginBgWarm',
  'loginBgBridge',
  'loginBgCool',
] as const;
export const BG_DRIFT_LOCATIONS: readonly [number, number, number] = [0, 0.5, 1];
/** drift 레이어 방향은 베이스와 살짝 다르게(우상 → 좌하) 두어 "흐름" 인상을 강화 */
export const BG_DRIFT_START = { x: 1, y: 0 } as const;
export const BG_DRIFT_END = { x: 0, y: 1 } as const;

/* ========================================================================
 *  §4.6 인터랙션 활성화
 * ====================================================================== */

/**
 * 모든 SNS 버튼 등장 완료 시점 — Apple 마지막 stagger 끝.
 * 정상 모드: 800(시작) + 120*2(stagger) + 300(fade) = 1340ms
 * Reduce Motion: 800 + 60*2 + 200 ≈ 1120ms (Easier — 안전 마진 포함 800ms 권장)
 */
export const INTERACTION_ENABLE_AT_MS = 1340;
export const INTERACTION_ENABLE_AT_MS_REDUCED = 800;

/* ========================================================================
 *  Reduce Motion 단일 진입점 (Resolver)
 * ====================================================================== */

/**
 * Reduce Motion 분기 적용된 모션 설정.
 * 컴포넌트는 본 인터페이스의 키만 참조하며 분기 로직을 자체적으로 가지지 않는다.
 */
export interface LoginAnimationConfig {
  readonly reduceMotion: boolean;
  /** 배경 fade-in (ms) */
  readonly bgFadeInDurationMs: number;
  /** 배경 drift 루프 활성 여부 (Reduce Motion 시 false) */
  readonly bgDriftEnabled: boolean;
  /** 로고 fade+scale 등장에서 scale 변화를 적용할지 (Reduce Motion 시 false) */
  readonly logoScaleOnFadeIn: boolean;
  /** breathing 루프 활성 여부 */
  readonly logoBreathingEnabled: boolean;
  /** 타이틀류 등장 시 translateY 변화를 적용할지 (Reduce Motion 시 false) */
  readonly titleTranslateOnFadeIn: boolean;
  /** 버튼 stagger 간격 (ms) */
  readonly buttonStaggerDelayMs: number;
  /** 버튼 등장 시 translateY 변화 적용 여부 */
  readonly buttonTranslateOnFadeIn: boolean;
  /** Press 시 scale 변화 적용 여부 (Reduce Motion 시 false → opacity 사용) */
  readonly pressScaleEnabled: boolean;
  /** 인터랙션 활성화 시점 (ms) */
  readonly interactionEnableAtMs: number;
}

/**
 * Reduce Motion 여부에 따라 단일 설정 객체를 반환한다.
 * 본 함수가 §6 분기 표의 단일 진입점이며 다른 곳에서 분기 로직을 작성하지 않는다.
 */
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
 * 이후 stagger 만큼씩 더해진다.
 *
 * @param index 0=카카오, 1=네이버, 2=Apple (iOS 만)
 * @param config {@link resolveLoginAnimationConfig} 결과
 */
export function computeButtonFadeInDelayMs(index: number, config: LoginAnimationConfig): number {
  if (index < 0) {
    return BUTTONS_FADE_IN_START_DELAY_MS;
  }
  return BUTTONS_FADE_IN_START_DELAY_MS + index * config.buttonStaggerDelayMs;
}

/**
 * 화면 폭에서 적정 로고 크기를 계산한다 (§7 반응형 표).
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

/* ========================================================================
 *  Gradient stop 토큰 → 색 HEX 배열 헬퍼
 * ====================================================================== */

/** {@link AnimatedPastelBackground} 가 사용할 수 있는 토큰 키 유니온. */
export type LoginGradientTokenKey = 'bgMain' | 'loginBgWarm' | 'loginBgBridge' | 'loginBgCool';

/**
 * 토큰 키 배열을 실제 색 HEX 배열로 변환.
 * 매핑이 비어 있으면 해당 entry 는 결과에서 제외 (LinearGradient 가 invalid 받지 않게).
 *
 * @param keys 스펙 §4.5 의 토큰 키 배열
 * @param colorTable theme.colors 에서 추출한 키→색 매핑
 */
export function resolveGradientStopsFromTokens(
  keys: readonly LoginGradientTokenKey[],
  colorTable: Readonly<Record<LoginGradientTokenKey, string | undefined>>,
): string[] {
  return keys
    .map((k) => colorTable[k])
    .filter((v): v is string => typeof v === 'string' && v.length > 0);
}
