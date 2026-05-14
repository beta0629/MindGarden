/**
 * 소셜 간편 가입 — 약관 동의 중심, 비밀번호 미전송(SNS A안) + 가입 후 social-login 재호출
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { useMemo, useState } from 'react';
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
  Linking,
} from 'react-native';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { getApiBaseUrl } from '@/config/apiBaseUrl';
import {
  AuthService,
  type SocialAuthProvider,
  type SocialSignupRequestBody,
} from '@/services/AuthService';
import { navigateAfterAuthenticated } from '@/utils/navigateAfterAuth';

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

function webOriginFromApiBase(): string {
  try {
    return new URL(getApiBaseUrl()).origin;
  } catch {
    return '';
  }
}

function resolveLegalUrls(): { terms: string; privacy: string } {
  const termsEnv = process.env.EXPO_PUBLIC_TERMS_URL?.trim();
  const privacyEnv = process.env.EXPO_PUBLIC_PRIVACY_URL?.trim();
  if (termsEnv && privacyEnv) {
    return { terms: termsEnv, privacy: privacyEnv };
  }
  const origin = webOriginFromApiBase();
  return {
    terms: termsEnv || (origin ? `${origin}/terms` : ''),
    privacy: privacyEnv || (origin ? `${origin}/privacy` : ''),
  };
}

function normalizePhoneDigits(input: string): string {
  return input.replace(/\D/g, '');
}

/** 표시명: SDK 닉네임·이메일 로컬파트로 최소 길이 보장 */
function defaultDisplayName(email: string, nickname: string): string {
  const nick = nickname.trim();
  if (nick.length >= 2) return nick;
  const local = email.split('@')[0]?.trim() ?? '';
  if (local.length >= 2) return local;
  return nick || local || '회원';
}

export default function SocialSignupScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    provider?: string | string[];
    email?: string | string[];
    nickname?: string | string[];
    socialId?: string | string[];
    profileImageUrl?: string | string[];
  }>();

  const provider = useMemo((): SocialAuthProvider => {
    const p = firstParam(params.provider).toUpperCase();
    return p === 'NAVER' ? 'NAVER' : 'KAKAO';
  }, [params.provider]);

  const initialEmail = useMemo(() => firstParam(params.email), [params.email]);
  const initialNickname = useMemo(() => firstParam(params.nickname), [params.nickname]);
  const socialId = useMemo(() => firstParam(params.socialId), [params.socialId]);
  const profileImageUrl = useMemo(
    () => firstParam(params.profileImageUrl),
    [params.profileImageUrl],
  );

  const [email, setEmail] = useState(() => initialEmail);
  const [displayName, setDisplayName] = useState(() =>
    defaultDisplayName(initialEmail, initialNickname),
  );
  const [phone, setPhone] = useState('');
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const legal = useMemo(() => resolveLegalUrls(), []);

  const openUrl = async (url: string) => {
    if (!url) {
      setError('약관 링크가 설정되어 있지 않습니다. 관리자에게 문의해 주세요.');
      return;
    }
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      setError('링크를 열 수 없습니다.');
      return;
    }
    await Linking.openURL(url);
  };

  const validate = (): string | null => {
    if (!privacy || !terms) {
      return '서비스 이용약관 및 개인정보 처리방침에 동의해 주세요.';
    }
    if (!email.trim()) return '이메일을 입력해 주세요.';
    const dn = displayName.trim();
    if (dn.length < 2) return '이름(표시명)은 2자 이상 입력해 주세요.';
    const digits = normalizePhoneDigits(phone);
    if (phone.trim() && (digits.length !== 11 || !digits.startsWith('01'))) {
      return '휴대폰 번호는 01로 시작하는 11자리 숫자여야 합니다. 비워 두면 제외됩니다.';
    }
    if (!socialId) return '소셜 식별자가 없습니다. 로그인 화면으로 돌아가 다시 시도해 주세요.';
    return null;
  };

  const onSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dn = displayName.trim();
      const digits = normalizePhoneDigits(phone);
      const body: SocialSignupRequestBody = {
        provider,
        providerUserId: socialId,
        providerUsername: dn,
        email: email.trim(),
        name: dn,
        nickname: dn,
        ...(digits.length === 11 ? { phone: digits } : {}),
        providerProfileImage: profileImageUrl || undefined,
        branchCode: '',
        privacyConsent: privacy,
        termsConsent: terms,
        marketingConsent: marketing,
        agreeTerms: terms,
        agreeMarketing: marketing,
      };

      const signupRes = await AuthService.socialSignup(body);
      if (!signupRes.success) {
        setError(signupRes.message ?? '가입에 실패했습니다.');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const again = await AuthService.loginWithProviderAfterSignup(provider);
      if (again.kind !== 'authenticated') {
        setError(
          again.kind === 'error'
            ? `${again.message} 가입은 완료되었습니다. 로그인 화면에서 ${provider === 'KAKAO' ? '카카오' : '네이버'}로 다시 로그인해 주세요.`
            : '가입은 완료되었습니다. 로그인 화면에서 동일 SNS 버튼으로 다시 로그인해 주세요.',
        );
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        router.replace('/(auth)/login' as Href);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await navigateAfterAuthenticated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.bgMain }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.textMain }]}>간편 가입</Text>
        <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
          {provider === 'KAKAO' ? '카카오' : '네이버'} 계정으로 처음 방문하셨습니다. 약관에 동의하면
          가입이 완료되며, 이후에는 같은 SNS 버튼으로 로그인할 수 있습니다.
        </Text>

        <View style={[styles.field, { borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>이름(표시명)</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.textMain }]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="닉네임 또는 이름"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>

        <View style={[styles.field, { borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>이메일</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.textMain }]}
            value={email}
            onChangeText={setEmail}
            placeholder="이메일"
            placeholderTextColor={theme.colors.textTertiary}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={[styles.field, { borderColor: theme.colors.border }]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            휴대폰 (선택, 11자리)
          </Text>
          <TextInput
            style={[styles.input, { color: theme.colors.textMain }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="01012345678"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={[styles.row, styles.consentRow]}>
          <Pressable
            onPress={() => setTerms(!terms)}
            style={styles.checkRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: terms }}
          >
            <Text style={{ color: theme.colors.textMain }}>{terms ? '☑' : '☐'} </Text>
            <Text style={{ color: theme.colors.textMain, flex: 1 }}>이용약관에 동의합니다.</Text>
          </Pressable>
          <Pressable
            onPress={() => openUrl(legal.terms)}
            hitSlop={8}
            accessibilityLabel="이용약관 전문"
          >
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>보기</Text>
          </Pressable>
        </View>

        <View style={[styles.row, styles.consentRow]}>
          <Pressable
            onPress={() => setPrivacy(!privacy)}
            style={styles.checkRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: privacy }}
          >
            <Text style={{ color: theme.colors.textMain }}>{privacy ? '☑' : '☐'} </Text>
            <Text style={{ color: theme.colors.textMain, flex: 1 }}>
              개인정보 처리방침에 동의합니다.
            </Text>
          </Pressable>
          <Pressable
            onPress={() => openUrl(legal.privacy)}
            hitSlop={8}
            accessibilityLabel="개인정보 전문"
          >
            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>보기</Text>
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable
            onPress={() => setMarketing(!marketing)}
            style={styles.checkRow}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: marketing }}
          >
            <Text style={{ color: theme.colors.textMain }}>{marketing ? '☑' : '☐'} </Text>
            <Text style={{ color: theme.colors.textMain, flex: 1 }}>
              마케팅 수신에 동의합니다. (선택)
            </Text>
          </Pressable>
        </View>

        {Boolean(error) && (
          <Text style={[styles.error, { color: theme.colors.error }]} accessibilityRole="alert">
            {error}
          </Text>
        )}

        <Pressable
          style={[styles.submit, { backgroundColor: theme.colors.primary }]}
          onPress={onSubmit}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="가입 완료"
        >
          {busy ? (
            <ActivityIndicator color={theme.colors.textOnPrimary} />
          ) : (
            <Text style={[styles.submitText, { color: theme.colors.textOnPrimary }]}>
              가입하고 로그인
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.back}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
        >
          <Text style={{ color: theme.colors.textTertiary }}>취소</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  title: { fontSize: fontSizeTokens['2xl'], fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: fontSizeTokens.sm, lineHeight: 20, marginBottom: 20 },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  label: { fontSize: fontSizeTokens.xs, marginBottom: 4 },
  input: { fontSize: fontSizeTokens.base },
  row: { marginBottom: 10 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, flex: 1 },
  error: { marginTop: 8, marginBottom: 8, fontSize: fontSizeTokens.sm },
  submit: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  submitText: { fontSize: fontSizeTokens.base, fontWeight: '600' },
  back: { alignItems: 'center', marginTop: 16, padding: 12 },
});
