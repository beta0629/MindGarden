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
 * @author MindGarden
 * @since 2026-06-10
 */
import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  type ImageSourcePropType,
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
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(LOGO_INITIAL_SCALE)).current;
  const breathing = useRef(new Animated.Value(LOGO_BREATHING_MIN_SCALE)).current;

  useEffect(() => {
    const initialScale = config.logoScaleOnFadeIn ? LOGO_INITIAL_SCALE : LOGO_FINAL_SCALE;
    scale.setValue(initialScale);
    opacity.setValue(0);

    const fadeIn: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, {
        toValue: 1,
        duration: LOGO_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: LOGO_FADE_IN_DELAY_MS,
        useNativeDriver: true,
      }),
    ];
    if (config.logoScaleOnFadeIn) {
      fadeIn.push(
        Animated.timing(scale, {
          toValue: LOGO_FINAL_SCALE,
          duration: LOGO_FADE_IN_DURATION_MS,
          easing: LOGIN_EASING.fade,
          delay: LOGO_FADE_IN_DELAY_MS,
          useNativeDriver: true,
        }),
      );
    }
    Animated.parallel(fadeIn).start();
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
      />
    </Animated.View>
  );
}
