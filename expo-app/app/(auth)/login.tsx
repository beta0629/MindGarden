/**
 * 소셜 로그인 화면 — MindGardenLoginPage 컨테이너.
 *
 * 본 페이지는 UI 분리·모션 합산만 담당하고 비즈니스 로직(`AuthService.loginWith*`)은
 * 그대로 호출한다. UI 구조는 다음 4개 모듈로 분리:
 *   - {@link AnimatedPastelBackground} — 흐르는 파스텔 그라데이션
 *   - {@link LogoSection} — 그라데이션 나비 로고 + 2단 한글 타이포(타이틀/서브타이틀)
 *   - {@link LoginButtonsSection} — 카카오/네이버/Apple stagger + 자격증명 폼
 *   - {@link SocialLoginButton} — Atom (molecules 위치)
 *
 * SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md.
 *
 * Reduce Motion 분기는 {@link resolveLoginAnimationConfig} 단일 진입점만 사용한다.
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useTheme } from '@/theme';
import { fontFamily, fontSize as fontSizeTokens } from '@/theme/typography';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import {
  AuthService,
  type SocialUserInfoDraft,
  type DuplicateLoginRetryContext,
} from '@/services/AuthService';
import { navigateAfterAuthenticated } from '@/utils/navigateAfterAuth';
import { isAppleSignInAvailableSync } from '@/services/auth/appleSignIn';
import { sanitizeSocialIdentityString } from '@/utils/socialIdentitySanitize';
import { AnimatedPastelBackground } from '@/components/organisms/login/AnimatedPastelBackground';
import { LogoSection } from '@/components/organisms/login/LogoSection';
import { LoginButtonsSection } from '@/components/organisms/login/LoginButtonsSection';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import {
  CONTENT_HORIZONTAL_PADDING_MOBILE,
  CONTENT_HORIZONTAL_PADDING_TABLET,
  CONTENT_MAX_WIDTH_TABLET,
  CONTENT_VERTICAL_PADDING,
  HEADER_TO_BUTTONS_GAP,
  LAYOUT_TABLET_DEVICE_WIDTH,
  resolveLoginAnimationConfig,
  type LoginAnimationConfig,
} from '@/components/organisms/login/loginAnimationConstants';

const DUPLICATE_LOGIN_MODAL_TITLE = '이미 로그인된 기기가 있습니다';
const DUPLICATE_LOGIN_FALLBACK_BODY =
  '다른 곳에서 로그인되어 있습니다. 기존 세션을 종료하고 새로 로그인하시겠습니까?';
const DUPLICATE_LOGIN_CONFIRM_LABEL = '기존 세션 종료하고 로그인';
const DUPLICATE_LOGIN_CANCEL_LABEL = '취소';
const DUPLICATE_LOGIN_RETRY_FAILED_FALLBACK =
  '재로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
const CHANGE_TENANT_LABEL = '다른 기관으로 변경';
const EXPO_GO_BANNER_TITLE = 'Expo Go로 열려 있어요';
const EXPO_GO_BANNER_BODY =
  '카카오·네이버는 네이티브 모듈이라 Expo Go에서는 사용할 수 없습니다. 시뮬레이터/폰 홈의 MindGarden 앱을 실행하거나, 터미널에서 npx expo run:ios 후 그 앱으로 접속해 주세요. 이메일 로그인은 가능합니다.';
const MAX_FONT_SIZE_MULTIPLIER = 1.6;

interface DuplicateLoginPrompt {
  message: string;
  retryContext: DuplicateLoginRetryContext;
}

function isExpoGoApp(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/** 일부 실기기·환경에서 햅틱 미지원 시 예외 → 로그인 성공을 실패로 오인하지 않도록 삼킨다. */
async function safeNotificationAsync(
  feedbackType: Haptics.NotificationFeedbackType,
): Promise<void> {
  try {
    await Haptics.notificationAsync(feedbackType);
  } catch {
    /* noop */
  }
}

/**
 * 라우트 파라미터로 전달하기 전에 SNS 프로필 필드를 안전 문자열로 정리한다.
 *
 * <p>SDK·BE 직렬화 사고로 들어온 "null"/"undefined" 리터럴을 빈 문자열로 치환하여,
 * 가입 화면 입력값에 그대로 노출되지 않도록 한다.</p>
 */
function socialSignupRouteParams(info: SocialUserInfoDraft) {
  const base = {
    provider: info.provider,
    email: sanitizeSocialIdentityString(info.email),
    nickname: sanitizeSocialIdentityString(info.nickname),
    socialId: sanitizeSocialIdentityString(info.providerUserId),
    profileImageUrl: sanitizeSocialIdentityString(info.profileImageUrl ?? ''),
  };
  const phone = sanitizeSocialIdentityString(info.phone);
  const initialDisplayName = sanitizeSocialIdentityString(info.initialDisplayName);
  return {
    ...base,
    ...(phone ? { phone } : {}),
    ...(initialDisplayName ? { initialDisplayName } : {}),
  };
}

export default function MindGardenLoginPage() {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const config: LoginAnimationConfig = useMemo(
    () => resolveLoginAnimationConfig(reduceMotion),
    [reduceMotion],
  );

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<
    'kakao' | 'naver' | 'apple' | 'credentials' | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [duplicateLoginPrompt, setDuplicateLoginPrompt] = useState<DuplicateLoginPrompt | null>(
    null,
  );
  const [isConfirmingDuplicateLogin, setIsConfirmingDuplicateLogin] = useState(false);

  const inExpoGo = isExpoGoApp();
  const isTablet = windowWidth >= LAYOUT_TABLET_DEVICE_WIDTH;
  const contentHorizontalPadding = isTablet
    ? CONTENT_HORIZONTAL_PADDING_TABLET
    : CONTENT_HORIZONTAL_PADDING_MOBILE;
  const appleAvailable = isAppleSignInAvailableSync();

  const handleLoginSuccess = async () => {
    await navigateAfterAuthenticated();
  };

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setLoadingProvider('kakao');
    setErrorMessage(null);

    try {
      const result = await AuthService.loginWithKakao();
      if (result.kind === 'authenticated') {
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Success);
        await handleLoginSuccess();
      } else if (result.kind === 'requiresSignup') {
        router.push({
          pathname: '/(auth)/social-signup',
          params: socialSignupRouteParams(result.socialUserInfo),
        });
      } else if (result.kind === 'requiresPhoneAccountSelection') {
        router.push({
          pathname: '/(auth)/oauth-account-selection',
          params: {
            selectionToken: result.selectionToken,
            provider: 'KAKAO',
          },
        });
      } else if (result.kind === 'requiresOAuthPhoneVerification') {
        router.push({
          pathname: '/(auth)/oauth-phone-link',
          params: {
            provider: result.provider,
            phoneVerificationToken: result.phoneVerificationToken,
            email: result.socialUserInfo.email ?? '',
            name: result.socialUserInfo.name ?? '',
          },
        } as unknown as Href);
      } else if (result.kind === 'requiresDuplicateLoginConfirmation') {
        setDuplicateLoginPrompt({
          message: result.message,
          retryContext: result.retryContext,
        });
      } else if (result.kind === 'error') {
        setErrorMessage(result.message ?? '카카오 로그인에 실패했습니다.');
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      console.error('[Login] kakao', e);
      const detail =
        e instanceof Error && e.message.trim() ? ` (${e.message.trim().slice(0, 100)})` : '';
      setErrorMessage(`카카오 로그인 중 오류가 발생했습니다.${detail}`);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setLoadingProvider('apple');
    setErrorMessage(null);

    try {
      const result = await AuthService.loginWithApple();
      if (result.kind === 'authenticated') {
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Success);
        await handleLoginSuccess();
      } else if (result.kind === 'requiresSignup') {
        router.push({
          pathname: '/(auth)/social-signup',
          params: socialSignupRouteParams(result.socialUserInfo),
        });
      } else if (result.kind === 'requiresPhoneAccountSelection') {
        router.push({
          pathname: '/(auth)/oauth-account-selection',
          params: {
            selectionToken: result.selectionToken,
            provider: 'APPLE',
          },
        });
      } else if (result.kind === 'requiresApplePhoneVerification') {
        router.push({
          pathname: '/(auth)/apple-phone-link',
          params: {
            phoneVerificationToken: result.phoneVerificationToken,
            email: result.socialUserInfo.email ?? '',
            name: result.socialUserInfo.name ?? '',
          },
        } as unknown as Href);
      } else if (result.kind === 'requiresOAuthPhoneVerification') {
        router.push({
          pathname: '/(auth)/oauth-phone-link',
          params: {
            provider: result.provider,
            phoneVerificationToken: result.phoneVerificationToken,
            email: result.socialUserInfo.email ?? '',
            name: result.socialUserInfo.name ?? '',
          },
        } as unknown as Href);
      } else if (result.kind === 'requiresDuplicateLoginConfirmation') {
        setDuplicateLoginPrompt({
          message: result.message,
          retryContext: result.retryContext,
        });
      } else if (result.kind === 'error') {
        if (!/취소/.test(result.message ?? '')) {
          setErrorMessage(result.message ?? 'Apple 로그인에 실패했습니다.');
          await safeNotificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (e) {
      console.error('[Login] apple', e);
      const detail =
        e instanceof Error && e.message.trim() ? ` (${e.message.trim().slice(0, 100)})` : '';
      setErrorMessage(`Apple 로그인 중 오류가 발생했습니다.${detail}`);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleNaverLogin = async () => {
    setIsLoading(true);
    setLoadingProvider('naver');
    setErrorMessage(null);

    try {
      const result = await AuthService.loginWithNaver();
      if (result.kind === 'authenticated') {
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Success);
        await handleLoginSuccess();
      } else if (result.kind === 'requiresSignup') {
        router.push({
          pathname: '/(auth)/social-signup',
          params: socialSignupRouteParams(result.socialUserInfo),
        });
      } else if (result.kind === 'requiresPhoneAccountSelection') {
        router.push({
          pathname: '/(auth)/oauth-account-selection',
          params: {
            selectionToken: result.selectionToken,
            provider: 'NAVER',
          },
        });
      } else if (result.kind === 'requiresOAuthPhoneVerification') {
        router.push({
          pathname: '/(auth)/oauth-phone-link',
          params: {
            provider: result.provider,
            phoneVerificationToken: result.phoneVerificationToken,
            email: result.socialUserInfo.email ?? '',
            name: result.socialUserInfo.name ?? '',
          },
        } as unknown as Href);
      } else if (result.kind === 'requiresDuplicateLoginConfirmation') {
        setDuplicateLoginPrompt({
          message: result.message,
          retryContext: result.retryContext,
        });
      } else if (result.kind === 'error') {
        setErrorMessage(result.message ?? '네이버 로그인에 실패했습니다.');
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      console.error('[Login] naver', e);
      const detail =
        e instanceof Error && e.message.trim() ? ` (${e.message.trim().slice(0, 100)})` : '';
      setErrorMessage(`네이버 로그인 중 오류가 발생했습니다.${detail}`);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleCredentialLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setLoadingProvider('credentials');
    setErrorMessage(null);

    try {
      const result = await AuthService.loginWithCredentials(email.trim(), password);
      if (result.kind === 'authenticated') {
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Success);
        await handleLoginSuccess();
      } else if (result.kind === 'requiresDuplicateLoginConfirmation') {
        setDuplicateLoginPrompt({
          message: result.message,
          retryContext: result.retryContext,
        });
      } else {
        setErrorMessage(result.message ?? '로그인에 실패했습니다.');
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      console.error('[Login] credential', e);
      setErrorMessage('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleConfirmDuplicateLogin = async () => {
    if (!duplicateLoginPrompt) {
      return;
    }
    setIsConfirmingDuplicateLogin(true);
    setErrorMessage(null);
    try {
      const result = await AuthService.confirmDuplicateLoginAndRetry(
        duplicateLoginPrompt.retryContext,
      );
      if (result.kind === 'authenticated') {
        setDuplicateLoginPrompt(null);
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Success);
        await handleLoginSuccess();
      } else {
        setDuplicateLoginPrompt(null);
        setErrorMessage(result.message ?? DUPLICATE_LOGIN_RETRY_FAILED_FALLBACK);
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      console.error('[Login] duplicate-login retry', e);
      setDuplicateLoginPrompt(null);
      setErrorMessage(DUPLICATE_LOGIN_RETRY_FAILED_FALLBACK);
    } finally {
      setIsConfirmingDuplicateLogin(false);
    }
  };

  const handleCancelDuplicateLogin = () => {
    if (isConfirmingDuplicateLogin) {
      return;
    }
    setDuplicateLoginPrompt(null);
  };

  const expoGoBanner = inExpoGo ? (
    <View
      style={[
        styles.expoGoBanner,
        {
          backgroundColor: theme.colors.primaryLight + '35',
          borderColor: theme.colors.primary,
        },
      ]}
      accessibilityRole="alert"
    >
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={{
          fontFamily: theme.fontFamily.semibold,
          fontSize: theme.fontSize.sm,
          color: theme.colors.textMain,
          marginBottom: 6,
        }}
      >
        {EXPO_GO_BANNER_TITLE}
      </Text>
      <Text
        maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
        style={{
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
          lineHeight: 18,
        }}
      >
        {EXPO_GO_BANNER_BODY}
      </Text>
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      <AnimatedPastelBackground config={config} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: contentHorizontalPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.contentInner,
                isTablet ? { maxWidth: CONTENT_MAX_WIDTH_TABLET, alignSelf: 'center' } : null,
              ]}
            >
              <LogoSection config={config} />

              <View style={{ height: HEADER_TO_BUTTONS_GAP }} />

              <LoginButtonsSection
                config={config}
                showAppleButton={appleAvailable}
                socialLoginUnavailable={inExpoGo}
                unavailableBanner={expoGoBanner}
                isLoading={isLoading}
                loadingProvider={loadingProvider}
                errorMessage={errorMessage}
                onKakaoPress={handleKakaoLogin}
                onNaverPress={handleNaverLogin}
                onApplePress={handleAppleLogin}
                showCredentials={showCredentials}
                onToggleCredentials={() => setShowCredentials((v) => !v)}
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                onSubmitCredentials={handleCredentialLogin}
              />

              <Pressable
                style={styles.changeTenantButton}
                onPress={() => router.replace('/(auth)/tenant-select' as Href)}
                accessibilityLabel={CHANGE_TENANT_LABEL}
                accessibilityRole="button"
              >
                <Text
                  maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                  style={[styles.changeTenantText, { color: theme.colors.textTertiary }]}
                >
                  {CHANGE_TENANT_LABEL}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <UnifiedModal
        isOpen={duplicateLoginPrompt != null}
        onClose={handleCancelDuplicateLogin}
        title={DUPLICATE_LOGIN_MODAL_TITLE}
        loading={isConfirmingDuplicateLogin}
        backdropClick={false}
        showCloseButton={false}
        actions={[
          {
            label: DUPLICATE_LOGIN_CONFIRM_LABEL,
            onPress: handleConfirmDuplicateLogin,
            variant: 'primary',
            disabled: isConfirmingDuplicateLogin,
          },
          {
            label: DUPLICATE_LOGIN_CANCEL_LABEL,
            onPress: handleCancelDuplicateLogin,
            variant: 'secondary',
            disabled: isConfirmingDuplicateLogin,
          },
        ]}
      >
        <Text
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          style={{
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMain,
            lineHeight: 22,
          }}
        >
          {duplicateLoginPrompt?.message?.trim() || DUPLICATE_LOGIN_FALLBACK_BODY}
        </Text>
      </UnifiedModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: CONTENT_VERTICAL_PADDING,
  },
  contentInner: {
    alignSelf: 'stretch',
  },
  expoGoBanner: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  changeTenantButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  changeTenantText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSizeTokens.sm,
  },
});
