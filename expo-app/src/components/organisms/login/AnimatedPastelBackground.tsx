/**
 * 흐르는 파스텔 그라데이션 배경 (LoginScreen 전용)
 *
 * 두 레이어 구조:
 *  1) base — bgMain → warm → bridge → cool 의 정적 LinearGradient (좌상 → 우하)
 *  2) drift — warm → bridge → cool 의 보조 그라데이션 (우상 → 좌하)
 *     Animated.Value 로 opacity 0.4 ↔ 0.6 사인 곡선 호흡 (8s 주기 ∞ 루프)
 *
 * 진입 시 전체 wrapper opacity 0 → 1 (cubic-bezier `Easing.out(Easing.cubic)`).
 * Reduce Motion 시 drift 정지 + fade-in 단축. 본 컴포넌트가 §6 분기를 가지지 않고
 * {@link resolveLoginAnimationConfig} 결과만 받아 동작한다.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import {
  BG_DRIFT_END,
  BG_DRIFT_LOCATIONS,
  BG_DRIFT_OPACITY_MAX,
  BG_DRIFT_OPACITY_MIN,
  BG_DRIFT_PERIOD_MS,
  BG_DRIFT_START,
  BG_DRIFT_STOPS_COLORS_TOKEN_KEYS,
  BG_GRADIENT_END,
  BG_GRADIENT_LOCATIONS,
  BG_GRADIENT_START,
  BG_GRADIENT_STOPS_COLORS_TOKEN_KEYS,
  LOGIN_EASING,
  resolveGradientStopsFromTokens,
  type LoginAnimationConfig,
  type LoginGradientTokenKey,
} from './loginAnimationConstants';

export interface AnimatedPastelBackgroundProps {
  readonly config: LoginAnimationConfig;
  readonly testID?: string;
}

export function AnimatedPastelBackground({ config, testID }: AnimatedPastelBackgroundProps) {
  const theme = useTheme();
  const fade = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(BG_DRIFT_OPACITY_MIN)).current;
  const driftLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: config.bgFadeInDurationMs,
      easing: LOGIN_EASING.fade,
      useNativeDriver: true,
    }).start();
  }, [config.bgFadeInDurationMs, fade]);

  useEffect(() => {
    if (!config.bgDriftEnabled) {
      drift.setValue(BG_DRIFT_OPACITY_MIN);
      return undefined;
    }
    const halfPeriod = BG_DRIFT_PERIOD_MS / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: BG_DRIFT_OPACITY_MAX,
          duration: halfPeriod,
          easing: LOGIN_EASING.drift,
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: BG_DRIFT_OPACITY_MIN,
          duration: halfPeriod,
          easing: LOGIN_EASING.drift,
          useNativeDriver: true,
        }),
      ]),
    );
    driftLoopRef.current = loop;
    loop.start();
    return () => {
      loop.stop();
      driftLoopRef.current = null;
    };
  }, [config.bgDriftEnabled, drift]);

  const colorTable: Record<LoginGradientTokenKey, string> = {
    bgMain: theme.colors.bgMain,
    loginBgWarm: theme.colors.loginBgWarm,
    loginBgBridge: theme.colors.loginBgBridge,
    loginBgCool: theme.colors.loginBgCool,
  };
  const baseColors = resolveGradientStopsFromTokens(
    BG_GRADIENT_STOPS_COLORS_TOKEN_KEYS,
    colorTable,
  );
  const driftColors = resolveGradientStopsFromTokens(BG_DRIFT_STOPS_COLORS_TOKEN_KEYS, colorTable);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity: fade }]}
      pointerEvents="none"
      testID={testID ?? 'login-animated-bg'}
    >
      <LinearGradient
        colors={baseColors as unknown as readonly [string, string, ...string[]]}
        locations={BG_GRADIENT_LOCATIONS}
        start={BG_GRADIENT_START}
        end={BG_GRADIENT_END}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: drift }]} pointerEvents="none">
        <LinearGradient
          colors={driftColors as unknown as readonly [string, string, ...string[]]}
          locations={BG_DRIFT_LOCATIONS}
          start={BG_DRIFT_START}
          end={BG_DRIFT_END}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/*
        SafeArea 무시 풀블리드는 부모 View 가 absoluteFill 로 잡고, 내용물은 별도 View 에서 인셋 적용.
        본 컴포넌트는 시각 레이어만 책임지므로 내용물은 외부에서 렌더.
      */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none" />
    </Animated.View>
  );
}
