/**
 * SNS 로그인 버튼 stagger 영역 + Divider + 이메일 토글 + 자격증명 폼.
 *
 * 본 컴포넌트는 비즈니스 로직(`handleKakaoLogin` 등)을 직접 호출하지 않고 props 로 받는다.
 * UI 분기·등장 모션·pointerEvents 가드만 담당한다.
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §3 / §10.
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import { ChevronDown, ChevronUp, Lock, Mail } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { colors as themeColors } from '@/theme/tokens';
import { fontFamily, fontSize } from '@/theme/typography';
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
const DIVIDER_LABEL = '또는';
const TOGGLE_EXPAND_LABEL = '다른 방법으로 로그인';
const EMAIL_PLACEHOLDER = '이메일 또는 휴대폰 번호';
const PASSWORD_PLACEHOLDER = '비밀번호';
const CREDENTIAL_SUBMIT_LABEL = '로그인';

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
  readonly loadingProvider: 'kakao' | 'naver' | 'apple' | 'credentials' | null;
  /** 에러 메시지 (null 이면 비표시) */
  readonly errorMessage: string | null;

  readonly onKakaoPress: () => void;
  readonly onNaverPress: () => void;
  readonly onApplePress: () => void;

  /** 이메일/PW 폼 제어 */
  readonly showCredentials: boolean;
  readonly onToggleCredentials: () => void;
  readonly email: string;
  readonly onEmailChange: (value: string) => void;
  readonly password: string;
  readonly onPasswordChange: (value: string) => void;
  readonly onSubmitCredentials: () => void;

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
    showCredentials,
    onToggleCredentials,
    email,
    onEmailChange,
    password,
    onPasswordChange,
    onSubmitCredentials,
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

  const handleTogglePress = (_e: GestureResponderEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      /* noop */
    });
    onToggleCredentials();
  };

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
              자동 적용한다. SocialLoginButton 의 `variant="apple"` 는 SIWA 가 비활성/미지원일 때만 사용.
            */}
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
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

      <Pressable
        style={[styles.toggleButton, { borderColor: theme.colors.border }]}
        onPress={handleTogglePress}
        accessibilityLabel={TOGGLE_EXPAND_LABEL}
        accessibilityRole="button"
        accessibilityState={{ expanded: showCredentials }}
        testID="login-toggle-credentials"
      >
        <Text
          maxFontSizeMultiplier={LOGIN_BUTTONS_MAX_FONT_SIZE_MULTIPLIER}
          style={[styles.toggleButtonText, { color: theme.colors.textSecondary }]}
        >
          {TOGGLE_EXPAND_LABEL}
        </Text>
        {showCredentials ? (
          <ChevronUp size={18} color={theme.colors.textTertiary} />
        ) : (
          <ChevronDown size={18} color={theme.colors.textTertiary} />
        )}
      </Pressable>

      {showCredentials && (
        <View style={styles.credentialForm}>
          <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
            <Mail size={18} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.colors.textMain }]}
              placeholder={EMAIL_PLACEHOLDER}
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={onEmailChange}
              autoCapitalize="none"
              keyboardType="default"
              accessibilityLabel={EMAIL_PLACEHOLDER}
              maxFontSizeMultiplier={LOGIN_BUTTONS_MAX_FONT_SIZE_MULTIPLIER}
            />
          </View>
          <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
            <Lock size={18} color={theme.colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.colors.textMain }]}
              placeholder={PASSWORD_PLACEHOLDER}
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={onPasswordChange}
              secureTextEntry
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={onSubmitCredentials}
              accessibilityLabel={PASSWORD_PLACEHOLDER}
              maxFontSizeMultiplier={LOGIN_BUTTONS_MAX_FONT_SIZE_MULTIPLIER}
            />
          </View>
          <Pressable
            style={[styles.credentialLoginButton, { backgroundColor: theme.colors.primary }]}
            onPress={onSubmitCredentials}
            disabled={isLoading}
            accessibilityLabel={CREDENTIAL_SUBMIT_LABEL}
            accessibilityRole="button"
          >
            {loadingProvider === 'credentials' ? (
              <ActivityIndicator color={theme.colors.textOnPrimary} />
            ) : (
              <Text
                maxFontSizeMultiplier={LOGIN_BUTTONS_MAX_FONT_SIZE_MULTIPLIER}
                style={[styles.credentialLoginButtonText, { color: theme.colors.textOnPrimary }]}
              >
                {CREDENTIAL_SUBMIT_LABEL}
              </Text>
            )}
          </Pressable>
        </View>
      )}
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
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: 14,
    gap: 6,
  },
  toggleButtonText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  credentialForm: {
    gap: 12,
    paddingTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
  },
  credentialLoginButton: {
    borderRadius: BUTTON_BORDER_RADIUS,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  credentialLoginButtonText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
  },
});
