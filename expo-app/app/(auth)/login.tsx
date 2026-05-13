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
import { useTheme } from '../../src/theme';
import { fontSize as fontSizeTokens } from '../../src/theme/typography';
import { useTenantStore } from '../../src/stores/useTenantStore';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { AuthService } from '../../src/services/AuthService';
import { NotificationService } from '../../src/services/NotificationService';
import {
  OAUTH_KAKAO_BACKGROUND,
  OAUTH_KAKAO_FOREGROUND,
  OAUTH_NAVER_BACKGROUND,
  OAUTH_NAVER_FOREGROUND,
} from '../../src/constants/oauthProviderBrand';

export default function LoginScreen() {
  const theme = useTheme();
  const { tenantName } = useTenantStore();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSuccess = async () => {
    const { role } = useAuthStore.getState();
    await NotificationService.registerToken();

    if (role === 'consultant') {
      router.replace('/(consultant)/(home)' as Href);
    } else {
      router.replace('/(client)/(home)' as Href);
    }
  };

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    setLoadingProvider('kakao');
    setErrorMessage(null);

    try {
      const result = await AuthService.loginWithKakao();
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await handleLoginSuccess();
      } else if (result.requiresSignup) {
        setErrorMessage('가입되지 않은 계정입니다. 관리자에게 문의해주세요.');
      } else {
        setErrorMessage(result.message ?? '카카오 로그인에 실패했습니다.');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setErrorMessage('카카오 로그인 중 오류가 발생했습니다.');
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
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await handleLoginSuccess();
      } else if (result.requiresSignup) {
        setErrorMessage('가입되지 않은 계정입니다. 관리자에게 문의해주세요.');
      } else {
        setErrorMessage(result.message ?? '네이버 로그인에 실패했습니다.');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setErrorMessage('네이버 로그인 중 오류가 발생했습니다.');
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
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await handleLoginSuccess();
      } else {
        setErrorMessage(result.message ?? '로그인에 실패했습니다.');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setErrorMessage('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
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
            <Animated.Text
              entering={FadeInDown.delay(100).duration(500)}
              style={[styles.logo, { color: theme.colors.primary }]}
              accessibilityRole="header"
            >
              MindGarden
            </Animated.Text>
            {Boolean(tenantName) && (
              <Animated.Text
                entering={FadeInDown.delay(200).duration(500)}
                style={[styles.tenantName, { color: theme.colors.textSecondary }]}
              >
                {tenantName}
              </Animated.Text>
            )}
          </View>

          <Animated.View entering={SlideInDown.delay(300).duration(500)} style={styles.buttonGroup}>
            <Pressable
              style={[styles.socialButton, { backgroundColor: OAUTH_KAKAO_BACKGROUND }]}
              onPress={handleKakaoLogin}
              disabled={isLoading}
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
              style={[styles.socialButton, { backgroundColor: OAUTH_NAVER_BACKGROUND }]}
              onPress={handleNaverLogin}
              disabled={isLoading}
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

            {Boolean(errorMessage) && (
              <Animated.View entering={FadeIn.duration(300)} style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errorMessage}
                </Text>
              </Animated.View>
            )}

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>
                또는
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.divider }]} />
            </View>

            <Pressable
              style={[styles.toggleButton, { borderColor: theme.colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                      style={[styles.credentialLoginButtonText, { color: theme.colors.textOnPrimary }]}
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
  logo: {
    fontSize: fontSizeTokens['4xl'],
    fontWeight: '700',
    marginBottom: 8,
  },
  tenantName: {
    fontSize: fontSizeTokens.base,
    fontWeight: '500',
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
