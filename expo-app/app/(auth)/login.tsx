/**
 * 소셜 로그인 화면
 * 카카오·네이버 로그인 + ID/PW 접힘 영역
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { ChevronDown, ChevronUp, Mail, Lock } from 'lucide-react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { AppBrandMark } from '@/components/molecules/AppBrandMark';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { useTenantStore } from '@/stores/useTenantStore';
import {
  AuthService,
  type SocialUserInfoDraft,
  type DuplicateLoginRetryContext,
} from '@/services/AuthService';
import { navigateAfterAuthenticated } from '@/utils/navigateAfterAuth';
import {
  OAUTH_APPLE_BACKGROUND,
  OAUTH_APPLE_FOREGROUND,
  OAUTH_KAKAO_BACKGROUND,
  OAUTH_KAKAO_FOREGROUND,
  OAUTH_NAVER_BACKGROUND,
  OAUTH_NAVER_FOREGROUND,
} from '@/constants/oauthProviderBrand';
import { isAppleSignInAvailableSync } from '@/services/auth/appleSignIn';
import { sanitizeSocialIdentityString } from '@/utils/socialIdentitySanitize';

const DUPLICATE_LOGIN_MODAL_TITLE = '이미 로그인된 기기가 있습니다';
const DUPLICATE_LOGIN_FALLBACK_BODY =
  '다른 곳에서 로그인되어 있습니다. 기존 세션을 종료하고 새로 로그인하시겠습니까?';
const DUPLICATE_LOGIN_CONFIRM_LABEL = '기존 세션 종료하고 로그인';
const DUPLICATE_LOGIN_CANCEL_LABEL = '취소';
const DUPLICATE_LOGIN_RETRY_FAILED_FALLBACK =
  '재로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';

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

export default function LoginScreen() {
  const theme = useTheme();
  const { tenantName } = useTenantStore();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [duplicateLoginPrompt, setDuplicateLoginPrompt] = useState<DuplicateLoginPrompt | null>(
    null,
  );
  const [isConfirmingDuplicateLogin, setIsConfirmingDuplicateLogin] = useState(false);

  const inExpoGo = isExpoGoApp();

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
        // expo-router typed routes 가 새 라우트(`apple-phone-link`)를 generated 하기 전까지
        // unknown → Href 로 캐스팅한다. prebuild/restart 후 자동 해소.
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
        // 사용자가 시트를 닫은 경우는 토스트만 띄우지 않는다.
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.bgMain }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.content}>
          <View style={styles.header}>
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <AppBrandMark variant="hero" style={{ marginBottom: theme.spacing.sm }} />
            </Animated.View>
            {Boolean(tenantName) && (
              <Animated.Text
                entering={FadeInDown.delay(200).duration(500)}
                style={[styles.tenantName, { color: theme.colors.textSecondary }]}
              >
                {tenantName}
              </Animated.Text>
            )}
          </View>

          {inExpoGo && (
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
                style={{
                  fontFamily: theme.fontFamily.semibold,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textMain,
                  marginBottom: 6,
                }}
              >
                Expo Go로 열려 있어요
              </Text>
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.textSecondary,
                  lineHeight: 18,
                }}
              >
                카카오·네이버는 네이티브 모듈이라 Expo Go에서는 사용할 수 없습니다. 시뮬레이터/폰
                홈의 MindGarden 앱을 실행하거나, 터미널에서 npx expo run:ios 후 그 앱으로 접속해
                주세요. 이메일 로그인은 가능합니다.
              </Text>
            </View>
          )}

          <Animated.View entering={SlideInDown.delay(300).duration(500)} style={styles.buttonGroup}>
            <Pressable
              style={[
                styles.socialButton,
                {
                  backgroundColor: OAUTH_KAKAO_BACKGROUND,
                  opacity: inExpoGo ? 0.45 : 1,
                },
              ]}
              onPress={handleKakaoLogin}
              disabled={isLoading || inExpoGo}
              accessibilityLabel="카카오로 로그인"
              accessibilityRole="button"
            >
              {loadingProvider === 'kakao' ? (
                <ActivityIndicator color={OAUTH_KAKAO_FOREGROUND} />
              ) : (
                <Text style={[styles.socialButtonText, { color: OAUTH_KAKAO_FOREGROUND }]}>
                  카카오로 로그인
                </Text>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.socialButton,
                {
                  backgroundColor: OAUTH_NAVER_BACKGROUND,
                  opacity: inExpoGo ? 0.45 : 1,
                },
              ]}
              onPress={handleNaverLogin}
              disabled={isLoading || inExpoGo}
              accessibilityLabel="네이버로 로그인"
              accessibilityRole="button"
            >
              {loadingProvider === 'naver' ? (
                <ActivityIndicator color={OAUTH_NAVER_FOREGROUND} />
              ) : (
                <Text style={[styles.socialButtonText, { color: OAUTH_NAVER_FOREGROUND }]}>
                  네이버로 로그인
                </Text>
              )}
            </Pressable>

            {/* Apple Sign In — iOS 전용 가시. Apple App Store 4.8 (T1) 대응. */}
            {isAppleSignInAvailableSync() && (
              <Pressable
                style={[
                  styles.socialButton,
                  {
                    backgroundColor: OAUTH_APPLE_BACKGROUND,
                    opacity: inExpoGo ? 0.45 : 1,
                  },
                ]}
                onPress={handleAppleLogin}
                disabled={isLoading || inExpoGo}
                accessibilityLabel="Apple로 계속하기"
                accessibilityRole="button"
              >
                {loadingProvider === 'apple' ? (
                  <ActivityIndicator color={OAUTH_APPLE_FOREGROUND} />
                ) : (
                  <Text style={[styles.socialButtonText, { color: OAUTH_APPLE_FOREGROUND }]}>
                    Apple로 계속하기
                  </Text>
                )}
              </Pressable>
            )}

            {Boolean(errorMessage) && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errorMessage}
                </Text>
              </Animated.View>
            )}

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>또는</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
            </View>

            <Pressable
              style={[styles.toggleButton, { borderColor: theme.colors.border }]}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setShowCredentials(!showCredentials);
              }}
              accessibilityLabel="다른 방법으로 로그인"
              accessibilityRole="button"
            >
              <Text style={[styles.toggleButtonText, { color: theme.colors.textSecondary }]}>
                다른 방법으로 로그인
              </Text>
              {showCredentials ? (
                <ChevronUp size={18} color={theme.colors.textTertiary} />
              ) : (
                <ChevronDown size={18} color={theme.colors.textTertiary} />
              )}
            </Pressable>

            {showCredentials && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.credentialForm}>
                <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                  <Mail size={18} color={theme.colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textMain }]}
                    placeholder="이메일 또는 휴대폰 번호"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="default"
                    accessibilityLabel="이메일 또는 휴대폰 번호 입력"
                  />
                </View>
                <View style={[styles.inputContainer, { borderColor: theme.colors.border }]}>
                  <Lock size={18} color={theme.colors.textTertiary} />
                  <TextInput
                    style={[styles.input, { color: theme.colors.textMain }]}
                    placeholder="비밀번호"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={handleCredentialLogin}
                    accessibilityLabel="비밀번호 입력"
                  />
                </View>
                <Pressable
                  style={[styles.credentialLoginButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleCredentialLogin}
                  disabled={isLoading}
                  accessibilityLabel="로그인"
                  accessibilityRole="button"
                >
                  {loadingProvider === 'credentials' ? (
                    <ActivityIndicator color={theme.colors.textOnPrimary} />
                  ) : (
                    <Text
                      style={[
                        styles.credentialLoginButtonText,
                        { color: theme.colors.textOnPrimary },
                      ]}
                    >
                      로그인
                    </Text>
                  )}
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>

          <Pressable
            style={styles.changeTenantButton}
            onPress={() => router.replace('/(auth)/tenant-select' as Href)}
            accessibilityLabel="기관 변경"
            accessibilityRole="button"
          >
            <Text style={[styles.changeTenantText, { color: theme.colors.textTertiary }]}>
              다른 기관으로 변경
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tenantName: {
    fontSize: fontSizeTokens.base,
    fontWeight: '500',
  },
  expoGoBanner: {
    marginBottom: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonGroup: {
    gap: 12,
  },
  socialButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  socialButtonText: {
    fontSize: fontSizeTokens.base,
    fontWeight: '600',
  },
  errorContainer: {
    paddingVertical: 8,
  },
  errorText: {
    fontSize: fontSizeTokens.sm,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: fontSizeTokens.xs,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 6,
  },
  toggleButtonText: {
    fontSize: fontSizeTokens.sm,
    fontWeight: '500',
  },
  credentialForm: {
    gap: 12,
    paddingTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: fontSizeTokens.base,
  },
  credentialLoginButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  credentialLoginButtonText: {
    fontSize: fontSizeTokens.base,
    fontWeight: '600',
  },
  changeTenantButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  changeTenantText: {
    fontSize: fontSizeTokens.sm,
    fontWeight: '400',
  },
});
