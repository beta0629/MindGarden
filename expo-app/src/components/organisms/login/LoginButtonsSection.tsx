/**
 * SNS 로그인 버튼 stagger 영역 + 트리거 — V2 B2 Breathing Circle 아래 노출.
 *
 * <p>V1 의 "구분선 + 토글 + 인라인 폼 + 회원가입 링크" 구성을 모두 폐기 (§H6 / §H8 / §A.5)하고
 * V2 §A.4 4 provider (카카오/네이버/Google/Apple) + §B 트리거만 유지.
 * 이메일/휴대폰 로그인은 부모(`login.tsx`) 가 `CredentialSheet` 로 표시.</p>
 *
 * <p>SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260610_V2.md
 *  - §A.4 4 provider 균등 노출
 *  - §A.5 회원가입 링크 제거
 *  - §A.6 이메일 폼 트리거 진입
 *  - §A.7 보조 링크 2개만 (FooterLinks 컴포넌트)
 *  - §D.1 stagger 120ms 4 provider
 *  - §F.1 묶음 중앙 정렬</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import { fontFamily, fontSize } from '@/theme/typography';
import { SocialLoginButton } from '@/components/molecules/SocialLoginButton';
import { GoogleLoginButtonContainer } from '@/components/organisms/login/GoogleLoginButtonContainer';
import { CredentialSheetTrigger } from '@/components/atoms/CredentialSheetTrigger';
import type { GoogleSignInOutcome } from '@/services/auth/googleSignIn';
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

const MAX_FONT_SIZE_MULTIPLIER = 1.6;

/** Apple 네이티브 버튼 css cornerRadius — 다른 버튼과 동일 (V2 §F.1) */
const APPLE_NATIVE_BUTTON_CORNER_RADIUS = BUTTON_BORDER_RADIUS;

/**
 * 4 provider 등장 인덱스 (V2 §A.4 / §I.4):
 *  0 = kakao, 1 = naver, 2 = google, 3 = apple (iOS only)
 */
const KAKAO_INDEX = 0;
const NAVER_INDEX = 1;
const GOOGLE_INDEX = 2;
const APPLE_INDEX = 3;

export type LoginProvider = 'kakao' | 'naver' | 'google' | 'apple' | 'credentials';

export interface LoginButtonsSectionProps {
  readonly config: LoginAnimationConfig;
  /** Apple 네이티브 버튼 사용 가능 여부 (iOS 13+) */
  readonly showAppleButton: boolean;
  /** SNS 모듈을 사용할 수 없는 환경(Expo Go 등) — 카카오/네이버/Google 시각적으로 흐리게 */
  readonly socialLoginUnavailable: boolean;
  /** Expo Go 환경 등에서 사용자에게 보여줄 안내 배너(있으면 SNS 버튼 위) */
  readonly unavailableBanner?: ReactNode;
  /** 일반 로딩 상태 — 전체 버튼 disabled */
  readonly isLoading: boolean;
  /** 현재 로딩 중인 provider — 해당 버튼만 ActivityIndicator */
  readonly loadingProvider: LoginProvider | null;
  /** 에러 메시지 (null 이면 비표시) */
  readonly errorMessage: string | null;

  readonly onKakaoPress: () => void;
  readonly onNaverPress: () => void;
  /**
   * Google 로그인 진입 직전 — 부모가 isLoading=true / loadingProvider='google' 처리.
   *
   * <p>**Build #16 (2026-06-10) — Native SDK 마이그레이션**: Google 버튼은
   * {@link GoogleLoginButtonContainer} 내부에서 `signInWithGoogle()` 를 직접 호출하고 outcome
   * 을 부모로 전달한다. Native SDK 는 mount throw 가 없으므로 훅 가드는 환경 변수 게이트로만 단순화.</p>
   */
  readonly onGoogleSignInStart: () => void;
  /** Google OAuth 결과(또는 미구성 안내) — 부모가 BE 호출·라우팅·에러 처리 */
  readonly onGoogleAuthOutcome: (outcome: GoogleSignInOutcome) => void;
  readonly onApplePress: () => void;

  /** 트리거 (이메일/휴대폰 Sheet 열기) — Sheet 열림 상태 */
  readonly credentialSheetExpanded: boolean;
  readonly onCredentialSheetTriggerPress: () => void;

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
    onGoogleSignInStart,
    onGoogleAuthOutcome,
    onApplePress,
    credentialSheetExpanded,
    onCredentialSheetTriggerPress,
    style,
    testID,
  } = props;

  const theme = useTheme();

  const kakaoOpacity = useRef(new Animated.Value(0)).current;
  const kakaoTranslate = useRef(new Animated.Value(BUTTON_INITIAL_TRANSLATE_Y)).current;
  const naverOpacity = useRef(new Animated.Value(0)).current;
  const naverTranslate = useRef(new Animated.Value(BUTTON_INITIAL_TRANSLATE_Y)).current;
  const googleOpacity = useRef(new Animated.Value(0)).current;
  const googleTranslate = useRef(new Animated.Value(BUTTON_INITIAL_TRANSLATE_Y)).current;
  const appleOpacity = useRef(new Animated.Value(0)).current;
  const appleTranslate = useRef(new Animated.Value(BUTTON_INITIAL_TRANSLATE_Y)).current;
  const triggerOpacity = useRef(new Animated.Value(0)).current;
  const [pointerEventsEnabled, setPointerEventsEnabled] = useState(false);

  useEffect(() => {
    const initialTranslate = config.buttonTranslateOnFadeIn ? BUTTON_INITIAL_TRANSLATE_Y : 0;
    [kakaoOpacity, naverOpacity, googleOpacity, appleOpacity, triggerOpacity].forEach((v) =>
      v.setValue(0),
    );
    [kakaoTranslate, naverTranslate, googleTranslate, appleTranslate].forEach((v) =>
      v.setValue(initialTranslate),
    );
    setPointerEventsEnabled(false);

    const items: { opacity: Animated.Value; translate: Animated.Value; index: number }[] = [
      { opacity: kakaoOpacity, translate: kakaoTranslate, index: KAKAO_INDEX },
      { opacity: naverOpacity, translate: naverTranslate, index: NAVER_INDEX },
      { opacity: googleOpacity, translate: googleTranslate, index: GOOGLE_INDEX },
    ];
    if (showAppleButton) {
      items.push({
        opacity: appleOpacity,
        translate: appleTranslate,
        index: APPLE_INDEX,
      });
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

    // 트리거는 마지막 SNS 등장 후 fade-in
    const lastIndex = showAppleButton ? APPLE_INDEX : GOOGLE_INDEX;
    const triggerDelay = computeButtonFadeInDelayMs(lastIndex, config) + BUTTON_FADE_IN_DURATION_MS;
    anims.push(
      Animated.timing(triggerOpacity, {
        toValue: 1,
        duration: BUTTON_FADE_IN_DURATION_MS,
        easing: LOGIN_EASING.fade,
        delay: triggerDelay,
        useNativeDriver: true,
      }),
    );

    const composite = Animated.parallel(anims);
    composite.start();

    const enableTimer = setTimeout(() => {
      setPointerEventsEnabled(true);
    }, config.interactionEnableAtMs);

    return () => {
      clearTimeout(enableTimer);
      composite.stop();
    };
  }, [
    appleOpacity,
    appleTranslate,
    config,
    googleOpacity,
    googleTranslate,
    kakaoOpacity,
    kakaoTranslate,
    naverOpacity,
    naverTranslate,
    showAppleButton,
    triggerOpacity,
  ]);

  const handleApplePressWrap = useCallback(() => {
    if (isLoading || socialLoginUnavailable) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      /* noop */
    });
    onApplePress();
  }, [isLoading, onApplePress, socialLoginUnavailable]);

  return (
    <View style={[styles.root, style]} testID={testID ?? 'login-buttons-section'}>
      {unavailableBanner}

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

      <View style={{ height: BUTTON_GAP }} />

      <Animated.View
        style={{
          opacity: googleOpacity,
          transform: [{ translateY: googleTranslate }],
        }}
        pointerEvents={pointerEventsEnabled ? 'auto' : 'none'}
      >
        <GoogleLoginButtonContainer
          onSignInStart={onGoogleSignInStart}
          onAuthOutcome={onGoogleAuthOutcome}
          loading={loadingProvider === 'google'}
          disabled={isLoading}
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
              자동 렌더 (영문 locale 시 "Continue with Apple" — V2 §H5 SDK 한계 명시).
              fallback `SocialLoginButton variant="apple"` 은 SIWA 비활성/미지원 단말에서만 사용.
            */}
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={APPLE_NATIVE_BUTTON_CORNER_RADIUS}
              style={styles.appleButton}
              onPress={handleApplePressWrap}
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
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            style={[styles.errorText, { color: theme.colors.error }]}
          >
            {errorMessage}
          </Text>
        </View>
      )}

      <Animated.View
        style={{ opacity: triggerOpacity }}
        pointerEvents={pointerEventsEnabled ? 'auto' : 'none'}
      >
        <CredentialSheetTrigger
          expanded={credentialSheetExpanded}
          onPress={onCredentialSheetTriggerPress}
          disabled={isLoading}
        />
      </Animated.View>
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
});
