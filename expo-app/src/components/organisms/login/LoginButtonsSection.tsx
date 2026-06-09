/**
 * SNS 로그인 버튼 stagger 영역 + 구분선 + 인증 보조 링크.
 *
 * 사용자 결정 2026-06-10 §AQ-3: 이메일/비밀번호 토글 + 자격증명 폼은 본 화면에서 완전 제거.
 * (이메일 로그인이 필요한 사용자는 하단 "회원가입" 링크에서 웹으로 이동해 진행)
 *
 * 본 컴포넌트는 비즈니스 로직(`handleKakaoLogin` 등)을 직접 호출하지 않고 props 로 받는다.
 * UI 분기·등장 모션·pointerEvents 가드만 담당한다.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §3 / §10.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { colors as themeColors } from '@/theme/tokens';
import { fontFamily, fontSize, textStyles } from '@/theme/typography';
import { getWebBaseUrl } from '@/config/webBaseUrl';
import { SocialLoginButton } from '@/components/molecules/SocialLoginButton';
import {
  BUTTON_BORDER_RADIUS,
  BUTTON_FADE_IN_DURATION_MS,
  BUTTON_GAP,
  BUTTON_HEIGHT,
  BUTTON_INITIAL_TRANSLATE_Y,
  LOGIN_EASING,
  computeButtonFadeInDelayMs,
  type LoginAnimationConfig,
} from './loginAnimationConstants';

const LOGIN_BUTTONS_MAX_FONT_SIZE_MULTIPLIER = 1.6;
/**
 * 구분선·링크 라벨 — 웹 frontend (`UnifiedLogin.js` + `auth.json`) 카피와 통일
 * (사용자 결정 2026-06-10 §AE / §AJ).
 */
const DIVIDER_LABEL = '또는 다음으로 로그인';
const SIGNUP_LINK_LABEL = '회원가입';
const FORGOT_PASSWORD_LINK_LABEL = '비밀번호 찾기';
/**
 * 웹 frontend 경로 — `UnifiedLogin.js` 의 `/register`, `/forgot-password` 와 동일.
 * expo-app 에는 일반 회원가입/비밀번호 찾기 화면이 없으므로 외부 브라우저로 웹 페이지를 연다.
 */
const WEB_REGISTER_PATH = '/register';
const WEB_FORGOT_PASSWORD_PATH = '/forgot-password';
const EXTERNAL_LINK_OPEN_ERROR = '웹 페이지를 열 수 없습니다. 잠시 후 다시 시도해주세요.';

/** Apple 네이티브 버튼 css cornerRadius — 다른 버튼과 동일한 12px (스펙 §10.5) */
const APPLE_NATIVE_BUTTON_CORNER_RADIUS = BUTTON_BORDER_RADIUS;

export interface LoginButtonsSectionProps {
  readonly config: LoginAnimationConfig;
  /** Apple 네이티브 버튼 사용 가능 여부 (iOS 13+) */
  readonly showAppleButton: boolean;
  /** SNS 모듈을 사용할 수 없는 환경(Expo Go 등) — 카카오·네이버 시각적으로 흐리게 */
  readonly socialLoginUnavailable: boolean;
  /** Expo Go 환경 등에서 사용자에게 보여줄 안내 배너(있으면 SNS 버튼 위) */
  readonly unavailableBanner?: ReactNode;
  /** 일반 로딩 상태 — 전체 버튼 disabled */
  readonly isLoading: boolean;
  /** 현재 로딩 중인 provider — 해당 버튼만 ActivityIndicator */
  readonly loadingProvider: 'kakao' | 'naver' | 'apple' | null;
  /** 에러 메시지 (null 이면 비표시) */
  readonly errorMessage: string | null;

  readonly onKakaoPress: () => void;
  readonly onNaverPress: () => void;
  readonly onApplePress: () => void;

  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function LoginButtonsSection(props: LoginButtonsSectionProps) {
  const {
    config,
    showAppleButton,
    socialLoginUnavailable,
    unavailableBanner,
    isLoading,
    loadingProvider,
    errorMessage,
    onKakaoPress,
    onNaverPress,
    onApplePress,
    style,
    testID,
  } = props;

  const theme = useTheme();

  const kakaoOpacity = useRef(new Animated.Value(0)).current;
  const kakaoTranslate = useRef(new Animated.Value(BUTTON_INITIAL_TRANSLATE_Y)).current;
  const naverOpacity = useRef(new Animated.Value(0)).current;
  const naverTranslate = useRef(new Animated.Value(BUTTON_INITIAL_TRANSLATE_Y)).current;
  const appleOpacity = useRef(new Animated.Value(0)).current;
  const appleTranslate = useRef(new Animated.Value(BUTTON_INITIAL_TRANSLATE_Y)).current;
  const [pointerEventsEnabled, setPointerEventsEnabled] = useState(false);

  useEffect(() => {
    const initialTranslate = config.buttonTranslateOnFadeIn ? BUTTON_INITIAL_TRANSLATE_Y : 0;
    [kakaoOpacity, naverOpacity, appleOpacity].forEach((v) => v.setValue(0));
    [kakaoTranslate, naverTranslate, appleTranslate].forEach((v) => v.setValue(initialTranslate));
    setPointerEventsEnabled(false);

    const items: { opacity: Animated.Value; translate: Animated.Value; index: number }[] = [
      { opacity: kakaoOpacity, translate: kakaoTranslate, index: 0 },
      { opacity: naverOpacity, translate: naverTranslate, index: 1 },
    ];
    if (showAppleButton) {
      items.push({ opacity: appleOpacity, translate: appleTranslate, index: 2 });
    }

    const anims: Animated.CompositeAnimation[] = [];
    items.forEach(({ opacity, translate, index }) => {
      const delay = computeButtonFadeInDelayMs(index, config);
      anims.push(
        Animated.timing(opacity, {
          toValue: 1,
          duration: BUTTON_FADE_IN_DURATION_MS,
          easing: LOGIN_EASING.fade,
          delay,
          useNativeDriver: true,
        }),
      );
      if (config.buttonTranslateOnFadeIn) {
        anims.push(
          Animated.timing(translate, {
            toValue: 0,
            duration: BUTTON_FADE_IN_DURATION_MS,
            easing: LOGIN_EASING.fade,
            delay,
            useNativeDriver: true,
          }),
        );
      }
    });
    Animated.parallel(anims).start();

    const enableTimer = setTimeout(() => {
      setPointerEventsEnabled(true);
    }, config.interactionEnableAtMs);

    return () => {
      clearTimeout(enableTimer);
      anims.forEach((a) => a.stop());
    };
  }, [
    appleOpacity,
    appleTranslate,
    config,
    kakaoOpacity,
    kakaoTranslate,
    naverOpacity,
    naverTranslate,
    showAppleButton,
  ]);

  const openExternalAuthLink = useCallback((path: string) => {
    const url = `${getWebBaseUrl()}${path}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(EXTERNAL_LINK_OPEN_ERROR);
    });
  }, []);

  const handleSignupPress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      /* noop */
    });
    openExternalAuthLink(WEB_REGISTER_PATH);
  }, [openExternalAuthLink]);

  const handleForgotPasswordPress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {
      /* noop */
    });
    openExternalAuthLink(WEB_FORGOT_PASSWORD_PATH);
  }, [openExternalAuthLink]);

  return (
    <View style={[styles.root, style]} testID={testID ?? 'login-buttons-section'}>
      {unavailableBanner}

      {/*
        구분선 — 웹 frontend (`UnifiedLogin.js` 의 `.mg-v2-divider`) 와 동일하게 SNS 버튼 그룹 위에 배치.
        expo-app 에는 자체 이메일 로그인 폼이 없으므로 사실상 SNS 영역 헤더 역할.
      */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
        <Text
          maxFontSizeMultiplier={LOGIN_BUTTONS_MAX_FONT_SIZE_MULTIPLIER}
          style={[styles.dividerText, { color: theme.colors.textTertiary }]}
        >
          {DIVIDER_LABEL}
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
      </View>

      <Animated.View
        style={{
          opacity: kakaoOpacity,
          transform: [{ translateY: kakaoTranslate }],
        }}
        pointerEvents={pointerEventsEnabled ? 'auto' : 'none'}
      >
        <SocialLoginButton
          variant="kakao"
          onPress={onKakaoPress}
          loading={loadingProvider === 'kakao'}
          disabled={isLoading || socialLoginUnavailable}
          visuallyMuted={socialLoginUnavailable}
          reduceMotion={config.reduceMotion}
          pointerEventsDisabled={!pointerEventsEnabled}
        />
      </Animated.View>

      <View style={{ height: BUTTON_GAP }} />

      <Animated.View
        style={{
          opacity: naverOpacity,
          transform: [{ translateY: naverTranslate }],
        }}
        pointerEvents={pointerEventsEnabled ? 'auto' : 'none'}
      >
        <SocialLoginButton
          variant="naver"
          onPress={onNaverPress}
          loading={loadingProvider === 'naver'}
          disabled={isLoading || socialLoginUnavailable}
          visuallyMuted={socialLoginUnavailable}
          reduceMotion={config.reduceMotion}
          pointerEventsDisabled={!pointerEventsEnabled}
        />
      </Animated.View>

      {showAppleButton && (
        <>
          <View style={{ height: BUTTON_GAP }} />
          <Animated.View
            style={{
              opacity: appleOpacity,
              transform: [{ translateY: appleTranslate }],
            }}
            pointerEvents={pointerEventsEnabled ? 'auto' : 'none'}
            testID="login-apple-native-button-wrap"
          >
            {/*
              Apple 네이티브 버튼 — `AppleAuthenticationButton` 은 Apple HIG 자산·다국어·다크모드를
              자동 적용한다. `Type.CONTINUE` 사용 시 디바이스 locale 한국어에서 "Apple로 계속하기"
              자동 렌더 (영문 locale 시 "Continue with Apple"). 외부에서 locale·카피·폰트·내부 정렬을
              조정할 수 없으므로 height·width·cornerRadius 만 다른 버튼과 통일한다 (SDK 한계 — §AQ-2).
              한국어 카피를 강제로 보고 싶으면 시뮬레이터/디바이스 시스템 언어를 한국어로 설정해야 한다.
              SocialLoginButton 의 `variant="apple"` 는 SIWA 가 비활성/미지원일 때만 사용.
            */}
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={APPLE_NATIVE_BUTTON_CORNER_RADIUS}
              style={styles.appleButton}
              onPress={() => {
                if (isLoading || socialLoginUnavailable) {
                  return;
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
                  /* noop */
                });
                onApplePress();
              }}
            />
            {loadingProvider === 'apple' && (
              <View
                pointerEvents="none"
                style={[
                  styles.appleLoadingOverlay,
                  { borderRadius: APPLE_NATIVE_BUTTON_CORNER_RADIUS },
                ]}
              >
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              </View>
            )}
          </Animated.View>
        </>
      )}

      {Boolean(errorMessage) && (
        <View style={styles.errorContainer} accessibilityLiveRegion="polite">
          <Text
            maxFontSizeMultiplier={LOGIN_BUTTONS_MAX_FONT_SIZE_MULTIPLIER}
            style={[styles.errorText, { color: theme.colors.error }]}
          >
            {errorMessage}
          </Text>
        </View>
      )}

      {/*
        하단 인증 링크 — 웹 frontend (`UnifiedLogin.js` 의 `.mg-v2-login-links`) 와 동일 구조.
        expo-app 에 일반 회원가입/비밀번호 찾기 화면이 없으므로 `Linking.openURL` 로
        웹 `${webBaseUrl}/register`, `${webBaseUrl}/forgot-password` 를 외부 브라우저에서 연다.
        토글/자격증명 폼이 제거되어(§AQ-3) 본 영역이 첫 진입 시 자연스럽게 보인다(§AQ-4).
      */}
      <View style={styles.authLinksRow} testID="login-auth-links">
        <Pressable
          onPress={handleSignupPress}
          accessibilityLabel={SIGNUP_LINK_LABEL}
          accessibilityRole="link"
          hitSlop={8}
          testID="login-link-signup"
        >
          <Text
            maxFontSizeMultiplier={LOGIN_BUTTONS_MAX_FONT_SIZE_MULTIPLIER}
            style={[styles.authLinkText, { color: theme.colors.textSecondary }]}
          >
            {SIGNUP_LINK_LABEL}
          </Text>
        </Pressable>
        <View
          style={[styles.authLinkSeparator, { backgroundColor: theme.colors.divider }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <Pressable
          onPress={handleForgotPasswordPress}
          accessibilityLabel={FORGOT_PASSWORD_LINK_LABEL}
          accessibilityRole="link"
          hitSlop={8}
          testID="login-link-forgot-password"
        >
          <Text
            maxFontSizeMultiplier={LOGIN_BUTTONS_MAX_FONT_SIZE_MULTIPLIER}
            style={[styles.authLinkText, { color: theme.colors.textSecondary }]}
          >
            {FORGOT_PASSWORD_LINK_LABEL}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
  },
  appleButton: {
    width: '100%',
    height: BUTTON_HEIGHT,
  },
  appleLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.common.modalBackdrop,
  },
  errorContainer: {
    paddingVertical: 8,
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...textStyles.dividerCaption,
    marginHorizontal: 12,
  },
  authLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  authLinkText: {
    ...textStyles.authLink,
  },
  authLinkSeparator: {
    width: 1,
    height: 12,
  },
});
