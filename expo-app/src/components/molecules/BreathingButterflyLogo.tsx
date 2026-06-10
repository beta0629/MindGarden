/**
 * 마인드가든 나비 로고 — fade-in + 호흡(breathing) 애니메이션 단일 구현.
 *
 * 로그인 페이지(LogoSection)와 테넌트 선택 페이지(TenantSelect)에서 공통 사용된다.
 * `loginAnimationConstants` 의 단일 토큰을 그대로 사용해 두 화면이 한 사람이 작업한
 * 것처럼 동일한 모션 톤을 유지한다.
 *
 * 모션:
 *  - fade-in: scale 0.96→1.0, opacity 0→1 (500ms, delay 200ms)
 *  - breathing: 1.00↔1.02, 5s, ∞ 루프 (Reduce Motion 시 정지)
 *
 * Reduce Motion 분기는 `LoginAnimationConfig.logoScaleOnFadeIn` /
 * `logoBreathingEnabled` 만 본다 — 단일 진입점(`resolveLoginAnimationConfig`)이 SSOT.
 *
 * 가시성 보장 (2026-06-10 P0 정정):
 *  - 초기 `opacity` = 1, `scale` = `LOGO_FINAL_SCALE` 로 시작해 mount 즉시 가시.
 *  - 페이드인 분기에서만 0 으로 리셋 후 애니메이션. 애니메이션이 어떤 이유로든
 *    완료되지 않아도(콜백 미호출 / Fabric 신아키텍처 race / 잘못된 cleanup 순서)
 *    fallback 타이머가 최종 가시 상태로 스냅. 어제 V2 베타 검증에서 발견한 사례 재발 방지.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  type ImageErrorEventData,
  type ImageSourcePropType,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  LOGIN_EASING,
  LOGO_BREATHING_DELAY_MS,
  LOGO_BREATHING_MAX_SCALE,
  LOGO_BREATHING_MIN_SCALE,
  LOGO_BREATHING_PERIOD_MS,
  LOGO_FADE_IN_DELAY_MS,
  LOGO_FADE_IN_DURATION_MS,
  LOGO_FINAL_SCALE,
  LOGO_INITIAL_SCALE,
  type LoginAnimationConfig,
} from '@/components/organisms/login/loginAnimationConstants';

const BUTTERFLY_LOGO_SOURCE: ImageSourcePropType = require('../../../assets/brand/mindgarden-butterfly-logo.png');

/**
 * Fade-in 애니메이션이 어떤 이유로든 미완료 됐을 때(콜백 누락 / 신아키텍처 race) 최종 가시 상태를
 * 보장하기 위한 안전 마진(ms). delay + duration 합보다 충분히 크게 잡아 정상 종료를 방해하지 않는다.
 */
const FADE_IN_SAFETY_MARGIN_MS = 500;

export interface BreathingButterflyLogoProps {
  readonly config: LoginAnimationConfig;
  /** 로고 변(square) 픽셀 크기 — 호출자가 화면별로 결정 */
  readonly size: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function BreathingButterflyLogo({
  config,
  size,
  style,
  testID,
}: BreathingButterflyLogoProps) {
  /**
   * 초기값 = 최종 가시 상태(opacity 1, scale 1).
   * - useEffect 가 어떤 이유로 실행되지 않거나(이론상 거의 없음), 첫 프레임이 그려지기 전에
   *   사용자가 캡처 / 렌더해도 나비가 보이도록.
   * - logoScaleOnFadeIn 분기일 때만 useEffect 내부에서 0 으로 리셋 후 페이드인.
   */
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(LOGO_FINAL_SCALE)).current;
  const breathing = useRef(new Animated.Value(LOGO_BREATHING_MIN_SCALE)).current;

  useEffect(() => {
    if (!config.logoScaleOnFadeIn) {
      // Reduce Motion — 애니메이션 없이 최종 가시 상태 유지
      opacity.setValue(1);
      scale.setValue(LOGO_FINAL_SCALE);
      return undefined;
    }

    // 페이드인 시작 상태로 리셋 후 애니메이션
    opacity.setValue(0);
    scale.setValue(LOGO_INITIAL_SCALE);

    const fadeIn: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, {
        toValue: 1,
        duration: LOGO_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: LOGO_FADE_IN_DELAY_MS,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: LOGO_FINAL_SCALE,
        duration: LOGO_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: LOGO_FADE_IN_DELAY_MS,
        useNativeDriver: true,
      }),
    ];
    const composite = Animated.parallel(fadeIn);
    composite.start(({ finished }) => {
      // 정상 종료가 아니면 최종 상태로 스냅 (가시성 게이트)
      if (!finished) {
        opacity.setValue(1);
        scale.setValue(LOGO_FINAL_SCALE);
      }
    });

    // 콜백 누락 / 네이티브 드라이버 race 대비 안전 타이머
    const fallbackTimer = setTimeout(
      () => {
        opacity.setValue(1);
        scale.setValue(LOGO_FINAL_SCALE);
      },
      LOGO_FADE_IN_DELAY_MS + LOGO_FADE_IN_DURATION_MS + FADE_IN_SAFETY_MARGIN_MS,
    );

    return () => {
      composite.stop();
      clearTimeout(fallbackTimer);
    };
  }, [config.logoScaleOnFadeIn, opacity, scale]);

  useEffect(() => {
    if (!config.logoBreathingEnabled) {
      breathing.setValue(LOGO_BREATHING_MIN_SCALE);
      return undefined;
    }
    const halfPeriod = LOGO_BREATHING_PERIOD_MS / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathing, {
          toValue: LOGO_BREATHING_MAX_SCALE,
          duration: halfPeriod,
          easing: LOGIN_EASING.breathing,
          delay: LOGO_BREATHING_DELAY_MS,
          useNativeDriver: true,
        }),
        Animated.timing(breathing, {
          toValue: LOGO_BREATHING_MIN_SCALE,
          duration: halfPeriod,
          easing: LOGIN_EASING.breathing,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      breathing.setValue(LOGO_BREATHING_MIN_SCALE);
    };
  }, [breathing, config.logoBreathingEnabled]);

  const combinedScale = Animated.multiply(scale, breathing);

  const handleImageError = (event: NativeSyntheticEvent<ImageErrorEventData>): void => {
    // 자산 로드 실패 시 진단 로그 (release/dev 공통). 운영 반영 후 모니터링 채널에서 추적.

    console.warn('[BreathingButterflyLogo] butterfly logo asset failed to load', event.nativeEvent);
  };

  return (
    <Animated.View
      style={[{ opacity, transform: [{ scale: combinedScale }] }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID ?? 'breathing-butterfly-logo'}
    >
      <Image
        source={BUTTERFLY_LOGO_SOURCE}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={handleImageError}
      />
    </Animated.View>
  );
}
