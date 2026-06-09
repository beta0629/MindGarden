/**
 * V2 §M.1 B2 Breathing Circle — 호흡하는 거대 원 (organism).
 *
 * <p>화면 중앙에 직경 280dp 의 호흡 원 (radial gradient orb) 을 배치하고, 그 안에
 * 마인드가든 나비 로고(80dp) + "마인드가든" + "마음을 돌보는 시간" 을 묶음 중앙에 둔다.
 * Orb 는 5초 주기로 scale 1.00 ↔ 1.04 + opacity 1.00 ↔ 0.96 호흡 (∞ 루프).</p>
 *
 * <p>SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md
 *  - §M.1.2 풀 화면 시각 묘사 (Orb 280dp / 화면 폭 71%)
 *  - §M.1.3 색 팔레트 (loginOrbCore / loginOrbMid / loginOrbEdge — alpha 페이드아웃)
 *  - §M.1.4 모션 타임라인 (5000ms breathing, sine in/out)
 *  - §M.1.6 Reduce Motion 시 정지 (시각 구조는 유지)
 *  - §G.4 단일 진입점 `resolveLoginAnimationConfig`</p>
 *
 * <p>구현 메모 — `expo-radial-gradient` 가 별도 패키지로 RN 에서 안정적이지 않으므로
 * `react-native-svg` 의 `RadialGradient` 를 직접 사용한다. 본 자산은 코드 렌더 (외부 자산 0).</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '@/theme';
import { BreathingButterflyLogo } from '@/components/molecules/BreathingButterflyLogo';
import { BrandTitleBlock } from '@/components/molecules/BrandTitleBlock';
import {
  LOGIN_EASING,
  LOGO_BREATHING_DELAY_MS,
  LOGO_BREATHING_MAX_SCALE,
  LOGO_BREATHING_MIN_SCALE,
  LOGO_BREATHING_OPACITY_MAX,
  LOGO_BREATHING_OPACITY_MIN,
  LOGO_BREATHING_PERIOD_MS,
  LOGO_FADE_IN_DELAY_MS,
  LOGO_FADE_IN_DURATION_MS,
  LOGO_FINAL_SCALE,
  LOGO_INITIAL_SCALE,
  LOGO_TO_TITLE_GAP,
  type LoginAnimationConfig,
} from '@/components/organisms/login/loginAnimationConstants';

/** Orb 외곽 stroke 알파 (§M.1.3 — `border` × 0.35) */
const ORB_BORDER_ALPHA = 0.35;
/** Orb 중심 (radial 0%) 알파 — V2 §M.1.3 (`#FFFFFF` 0.85) */
const ORB_CORE_ALPHA = 0.85;
/** Orb 중간 (radial 50%) 알파 (`#F5F0E8` 0.55) */
const ORB_MID_ALPHA = 0.55;

export interface BreathingCircleProps {
  readonly config: LoginAnimationConfig;
  /** Orb 변(square) 픽셀 크기 — 호출자가 화면별로 결정 (`resolveOrbSizeForWidth`). */
  readonly size: number;
  /** Orb 안 나비 로고 크기 (`resolveLogoSizeForWidth`). */
  readonly butterflySize: number;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

/** 6자리 hex (`#RRGGBB`) → `#RRGGBBAA` 알파 부착. 알파는 0~1 범위. */
function hexWithAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const aa = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) {
    return `${hex}${aa}`;
  }
  return hex;
}

/** SVG `RadialGradient` stops — 토큰 색을 그대로 받아 알파만 부착. */
interface OrbStop {
  offset: string;
  color: string;
  opacity: number;
}

export function BreathingCircle({
  config,
  size,
  butterflySize,
  style,
  testID,
}: BreathingCircleProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const enterScale = useRef(new Animated.Value(LOGO_INITIAL_SCALE)).current;
  const breathingScale = useRef(new Animated.Value(LOGO_BREATHING_MIN_SCALE)).current;
  const breathingOpacity = useRef(new Animated.Value(LOGO_BREATHING_OPACITY_MAX)).current;

  useEffect(() => {
    const initialScale = config.logoScaleOnFadeIn ? LOGO_INITIAL_SCALE : LOGO_FINAL_SCALE;
    enterScale.setValue(initialScale);
    opacity.setValue(0);

    const fadeInAnims: Animated.CompositeAnimation[] = [
      Animated.timing(opacity, {
        toValue: 1,
        duration: LOGO_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: LOGO_FADE_IN_DELAY_MS,
        useNativeDriver: true,
      }),
    ];
    if (config.logoScaleOnFadeIn) {
      fadeInAnims.push(
        Animated.timing(enterScale, {
          toValue: LOGO_FINAL_SCALE,
          duration: LOGO_FADE_IN_DURATION_MS,
          easing: LOGIN_EASING.fade,
          delay: LOGO_FADE_IN_DELAY_MS,
          useNativeDriver: true,
        }),
      );
    }
    const composite = Animated.parallel(fadeInAnims);
    composite.start();
    return () => {
      composite.stop();
    };
  }, [config.logoScaleOnFadeIn, enterScale, opacity]);

  useEffect(() => {
    if (!config.logoBreathingEnabled) {
      breathingScale.setValue(LOGO_BREATHING_MIN_SCALE);
      breathingOpacity.setValue(LOGO_BREATHING_OPACITY_MAX);
      return undefined;
    }
    const halfPeriod = LOGO_BREATHING_PERIOD_MS / 2;
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingScale, {
          toValue: LOGO_BREATHING_MAX_SCALE,
          duration: halfPeriod,
          easing: LOGIN_EASING.breathing,
          delay: LOGO_BREATHING_DELAY_MS,
          useNativeDriver: true,
        }),
        Animated.timing(breathingScale, {
          toValue: LOGO_BREATHING_MIN_SCALE,
          duration: halfPeriod,
          easing: LOGIN_EASING.breathing,
          useNativeDriver: true,
        }),
      ]),
    );
    const opacityLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathingOpacity, {
          toValue: LOGO_BREATHING_OPACITY_MIN,
          duration: halfPeriod,
          easing: LOGIN_EASING.breathing,
          delay: LOGO_BREATHING_DELAY_MS,
          useNativeDriver: true,
        }),
        Animated.timing(breathingOpacity, {
          toValue: LOGO_BREATHING_OPACITY_MAX,
          duration: halfPeriod,
          easing: LOGIN_EASING.breathing,
          useNativeDriver: true,
        }),
      ]),
    );
    scaleLoop.start();
    opacityLoop.start();
    return () => {
      scaleLoop.stop();
      opacityLoop.stop();
      breathingScale.setValue(LOGO_BREATHING_MIN_SCALE);
      breathingOpacity.setValue(LOGO_BREATHING_OPACITY_MAX);
    };
  }, [breathingOpacity, breathingScale, config.logoBreathingEnabled]);

  const orbStops = useMemo<OrbStop[]>(
    () => [
      { offset: '0%', color: theme.colors.loginOrbCore, opacity: ORB_CORE_ALPHA },
      { offset: '50%', color: theme.colors.loginOrbMid, opacity: ORB_MID_ALPHA },
      { offset: '100%', color: theme.colors.loginOrbEdge, opacity: 0 },
    ],
    [theme.colors.loginOrbCore, theme.colors.loginOrbEdge, theme.colors.loginOrbMid],
  );

  const combinedScale = Animated.multiply(enterScale, breathingScale);
  const orbBorderColor = hexWithAlpha(theme.colors.border, ORB_BORDER_ALPHA);

  return (
    <Animated.View
      style={[
        styles.root,
        {
          width: size,
          height: size,
          opacity,
          transform: [{ scale: combinedScale }],
        },
        style,
      ]}
      accessibilityElementsHidden={false}
      testID={testID ?? 'breathing-circle'}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: breathingOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <RadialGradient
              id="orbGradient"
              cx={size / 2}
              cy={size / 2}
              r={size / 2}
              gradientUnits="userSpaceOnUse"
            >
              {orbStops.map((stop) => (
                <Stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity}
                />
              ))}
            </RadialGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 1}
            fill="url(#orbGradient)"
            stroke={orbBorderColor}
            strokeWidth={1}
          />
        </Svg>
      </Animated.View>

      <View style={styles.contentColumn} pointerEvents="none">
        <BreathingButterflyLogo
          config={{ ...config, logoBreathingEnabled: false }}
          size={butterflySize}
          style={{ marginBottom: LOGO_TO_TITLE_GAP }}
          testID="login-butterfly-logo"
        />
        <BrandTitleBlock config={config} testID="login-brand-title-block" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
