/**
 * 소셜 로그인 버튼 (Atom 역할 — molecules 디렉토리 배치).
 *
 * 카카오 / 네이버 / Google / Apple(fallback) 공용 컴포넌트.
 * Apple 네이티브 `AppleAuthenticationButton` 은 본 컴포넌트 외부에서 별도 렌더링한다
 * (네이티브 SDK 가 자체 자산·다국어·다크모드를 책임지므로 fallback 일 때만 본 컴포넌트 사용).
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md
 *  - §F.1 묶음 중앙 정렬 (V1 분할 정렬 폐기)
 *  - §C.4 / §E.2 정품 브랜드 색·자산
 *  - §D.4 Press feedback (scale 0.98 / opacity 0.85 — Reduce Motion)
 *  - §I.5 카피
 *  - §E.2.3 Google Light Theme 1px stroke
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors as themeColors } from '@/theme/tokens';
import { textStyles } from '@/theme/typography';
import {
  BUTTON_BORDER_RADIUS,
  BUTTON_BRAND_ICON_SIZE,
  BUTTON_HEIGHT,
  BUTTON_HORIZONTAL_PADDING,
  BUTTON_LOGO_TEXT_GAP,
  BUTTON_PRESSED_OPACITY_REDUCED,
  BUTTON_PRESSED_SCALE,
  BUTTON_PRESS_IN_DURATION_MS,
  BUTTON_PRESS_OUT_DURATION_MS,
  LOGIN_EASING,
} from '@/components/organisms/login/loginAnimationConstants';
import {
  getSocialLoginVariantConfig,
  type SocialLoginVariant,
} from '@/components/molecules/socialLoginVariant';
import {
  AppleBrandIcon,
  GoogleBrandIcon,
  KakaoBrandIcon,
  NaverBrandIcon,
} from '@/components/atoms/SocialBrandIcon';

export type { SocialLoginVariant };
export { getSocialLoginVariantConfig };

/** Dynamic Type 대응 — 폰트 확대 시 너무 커져 버튼이 깨지지 않도록 1.6 cap (V2 §G.5) */
const SOCIAL_LOGIN_MAX_FONT_SIZE_MULTIPLIER = 1.6;

export interface SocialLoginButtonProps {
  readonly variant: SocialLoginVariant;
  readonly onPress: (event: GestureResponderEvent) => void;
  /** 로딩 인디케이터 표시 (provider 별로 분리 — 다른 버튼은 disabled 만) */
  readonly loading?: boolean;
  /** 외부에서 disable (다른 provider 로그인 진행 중, Expo Go 환경 등) */
  readonly disabled?: boolean;
  /** Reduce Motion 분기 — true 면 press scale 대신 opacity 변경 (§D.4) */
  readonly reduceMotion?: boolean;
  /** Expo Go 등에서 SDK 미지원으로 시각적으로 흐리게 보여야 할 때 */
  readonly visuallyMuted?: boolean;
  /** 등장 애니메이션 전 차단용 — 외부에서 pointerEvents 제어 */
  readonly pointerEventsDisabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  /** 단위 테스트 hook — onPress 호출 전 햅틱 실행 여부 */
  readonly enableHaptics?: boolean;
  /** 그림자(elevation) 적용 여부 — Apple 검정/Google 흰 배경에서는 과한 그림자 자제 */
  readonly elevated?: boolean;
  /**
   * 접근성 보조 설명 — 비활성 상태/임시 안내(예: "Google 로그인은 곧 사용 가능합니다") 등
   * VoiceOver / TalkBack 에 추가 컨텍스트를 제공한다.
   */
  readonly accessibilityHint?: string;
}

/**
 * 카카오·네이버·Google·Apple(fallback) SNS 로그인 버튼 — 묶음 중앙 정렬 (V2 §F.1).
 *
 * Apple 정식 UI 는 호출자가 `expo-apple-authentication` 의 `AppleAuthenticationButton`
 * 을 직접 렌더링한다. 본 컴포넌트의 `variant="apple"` 는 SIWA 가 비활성/미지원일 때만 사용.
 */
export function SocialLoginButton({
  variant,
  onPress,
  loading = false,
  disabled = false,
  reduceMotion = false,
  visuallyMuted = false,
  pointerEventsDisabled = false,
  style,
  enableHaptics = true,
  elevated = true,
  accessibilityHint,
}: SocialLoginButtonProps) {
  const config = getSocialLoginVariantConfig(variant);
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (reduceMotion) {
      Animated.timing(opacity, {
        toValue: BUTTON_PRESSED_OPACITY_REDUCED,
        duration: BUTTON_PRESS_IN_DURATION_MS,
        easing: LOGIN_EASING.press,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(scale, {
      toValue: BUTTON_PRESSED_SCALE,
      duration: BUTTON_PRESS_IN_DURATION_MS,
      easing: LOGIN_EASING.press,
      useNativeDriver: true,
    }).start();
  }, [opacity, reduceMotion, scale]);

  const handlePressOut = useCallback(() => {
    if (reduceMotion) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: BUTTON_PRESS_OUT_DURATION_MS,
        easing: LOGIN_EASING.press,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(scale, {
      toValue: 1,
      duration: BUTTON_PRESS_OUT_DURATION_MS,
      easing: LOGIN_EASING.press,
      useNativeDriver: true,
    }).start();
  }, [opacity, reduceMotion, scale]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (enableHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
          /* 일부 디바이스 햅틱 미지원 — 무시 */
        });
      }
      onPress(event);
    },
    [enableHaptics, onPress],
  );

  useEffect(() => {
    return () => {
      scale.stopAnimation();
      opacity.stopAnimation();
    };
  }, [opacity, scale]);

  const elevationStyle = useMemo<ViewStyle | null>(() => {
    if (!elevated) {
      return null;
    }
    if (Platform.OS === 'android') {
      return { elevation: 2 };
    }
    return {
      shadowColor: themeColors.common.shadowSource,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    };
  }, [elevated]);

  const buttonBackgroundColor = config.backgroundColor;
  const buttonForegroundColor = config.foregroundColor;
  const disabledOpacity = visuallyMuted ? 0.45 : disabled ? 0.6 : 1;

  return (
    <Animated.View
      style={[
        styles.shadowWrap,
        elevationStyle,
        {
          transform: [{ scale }],
          opacity: Animated.multiply(opacity, new Animated.Value(disabledOpacity)),
        },
        style,
      ]}
      pointerEvents={pointerEventsDisabled ? 'none' : 'auto'}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityLabel={config.accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        testID={`social-login-button-${variant}`}
        style={[
          styles.pressable,
          {
            backgroundColor: buttonBackgroundColor,
          },
          config.borderColor ? { borderWidth: 1, borderColor: config.borderColor } : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={buttonForegroundColor} />
        ) : (
          <View style={styles.contentRow}>
            <BrandSymbol variant={variant} color={buttonForegroundColor} />
            <Text
              maxFontSizeMultiplier={SOCIAL_LOGIN_MAX_FONT_SIZE_MULTIPLIER}
              style={[styles.label, { color: buttonForegroundColor }]}
              numberOfLines={1}
              allowFontScaling
            >
              {config.label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * variant 별 브랜드 심볼 렌더.
 *  - kakao  : 어두운 말풍선 (#191919)
 *  - naver  : 흰색 N (#FFFFFF)
 *  - google : 다색 G (Brand Guideline 강제 — `color` 무시)
 *  - apple  : 흰색 사과 (#FFFFFF) — fallback 한정. 정식 SIWA 는 네이티브 컴포넌트.
 *
 * 각 심볼은 브랜드 가이드 색을 유지한다 (foreground 와 우연히 같지만 다크 모드 등 변경 시에도
 * 절대 변하지 않아야 함).
 */
function BrandSymbol({ variant, color }: { variant: SocialLoginVariant; color: string }) {
  if (variant === 'kakao') {
    return <KakaoBrandIcon size={BUTTON_BRAND_ICON_SIZE} color={color} />;
  }
  if (variant === 'naver') {
    return <NaverBrandIcon size={BUTTON_BRAND_ICON_SIZE} color={color} />;
  }
  if (variant === 'google') {
    return <GoogleBrandIcon size={BUTTON_BRAND_ICON_SIZE} color={color} />;
  }
  return <AppleBrandIcon size={BUTTON_BRAND_ICON_SIZE} color={color} />;
}

/**
 * V2 §F.1 묶음 중앙 정렬 — `Pressable` 내부 row 가 `justifyContent: 'center'` 로 집약.
 *  - 좌우 안전 여백 `BUTTON_HORIZONTAL_PADDING` (16dp).
 *  - 묶음 = `[icon 20dp][gap 12dp][text 자동폭]` — flex:1 / paddingRight 균형 모두 폐기.
 *  - 4 provider 가 동일한 시각 무게로 보이도록 stroke(Google) 외 추가 장식 없음.
 *
 * 폰트는 `textStyles.button` 토큰 (fontSize 16 / semibold / lineHeight 22 / letterSpacing -0.2).
 */
const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: BUTTON_BORDER_RADIUS,
  },
  pressable: {
    borderRadius: BUTTON_BORDER_RADIUS,
    height: BUTTON_HEIGHT,
    paddingHorizontal: BUTTON_HORIZONTAL_PADDING,
    overflow: 'hidden',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: BUTTON_LOGO_TEXT_GAP,
  },
  label: {
    ...textStyles.button,
    textAlign: 'center',
  },
});
