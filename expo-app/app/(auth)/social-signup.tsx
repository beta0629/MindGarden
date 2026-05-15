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
import { normalizeKoreanMobileDigits } from '@/utils/phoneNormalize';

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

const SOCIAL_SIGNUP_STACK_LOG_MAX = 800;

/**
 * 간편가입 예외를 로그·UI용 문자열로 정리한다 (axios 인터셉터 등 비-Error reject 대응).
 *
 * @param e catch로 받은 값
 * @returns logText — logcat/Metro용 다줄 평문, userMessage — 사용자에게 보여줄 한 줄(없으면 빈 문자열)
 */
function formatSocialSignupFailure(e: unknown): { logText: string; userMessage: string } {
  const httpLine = (status: number) => `HTTP ${status}`;

  if (e instanceof Error) {
    const stackRaw = e.stack ?? '';
    const stackTruncated =
      stackRaw.length > SOCIAL_SIGNUP_STACK_LOG_MAX
        ? `${stackRaw.slice(0, SOCIAL_SIGNUP_STACK_LOG_MAX)}…(truncated)`
        : stackRaw;
    const parts = [e.name, e.message, stackTruncated].filter((line) => line.length > 0);
    const logText = parts.join('\n').trim() || String(e);
    return { logText, userMessage: e.message.trim() };
  }

  if (typeof e !== 'object' || e === null) {
    let dump = '';
    try {
      dump = JSON.stringify(e);
    } catch {
      dump = String(e);
    }
    const logText = (dump || String(e)).trim() || String(e);
    const userMessage = typeof e === 'string' ? e.trim() : '';
    return { logText, userMessage };
  }

  const rec = e as Record<string, unknown>;
  const statusNum =
    typeof rec.status === 'number' && Number.isFinite(rec.status) ? rec.status : null;

  let userMessage = '';
  if (typeof rec.message === 'string' && rec.message.trim()) {
    userMessage = rec.message.trim();
  } else {
    const orig = rec.originalError;
    if (orig && typeof orig === 'object') {
      const o = orig as Record<string, unknown>;
      const response = o.response;
      if (response && typeof response === 'object') {
        const r = response as Record<string, unknown>;
        const data = r.data;
        if (data && typeof data === 'object') {
          const d = data as Record<string, unknown>;
          const m = d.message;
          if (typeof m === 'string' && m.trim()) {
            userMessage = m.trim();
          }
        }
      }
    }
  }

  if (statusNum !== null) {
    const http = httpLine(statusNum);
    userMessage = userMessage ? `${userMessage} (${http})` : http;
  }

  let dump = '';
  try {
    dump = JSON.stringify(rec);
  } catch {
    dump = String(e);
  }
  const logLines: string[] = [];
  const body = (dump || String(e)).trim() || String(e);
  logLines.push(body);
  if (statusNum !== null) {
    logLines.push(httpLine(statusNum));
  }
  const logText = logLines.join('\n').trim() || String(e);

  return { logText, userMessage };
}

/** 일부 실기기·환경에서 햅틱 미지원 시 예외 → 가입 흐름을 실패로 오인하지 않도록 삼킨다. */
async function safeNotificationAsync(
  feedbackType: Haptics.NotificationFeedbackType,
): Promise<void> {
  try {
    await Haptics.notificationAsync(feedbackType);
  } catch {
    /* noop */
  }
}

export default function SocialSignupScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    provider?: string | string[];
    email?: string | string[];
    nickname?: string | string[];
    socialId?: string | string[];
    profileImageUrl?: string | string[];
    phone?: string | string[];
    initialDisplayName?: string | string[];
  }>();

  const provider = useMemo((): SocialAuthProvider => {
    const p = firstParam(params.provider).toUpperCase();
    return p === 'NAVER' ? 'NAVER' : 'KAKAO';
  }, [params.provider]);

  const initialEmail = useMemo(() => firstParam(params.email), [params.email]);
  const initialNickname = useMemo(() => firstParam(params.nickname), [params.nickname]);
  const initialDisplayNameParam = useMemo(
    () => firstParam(params.initialDisplayName),
    [params.initialDisplayName],
  );
  const initialPhoneParam = useMemo(() => firstParam(params.phone), [params.phone]);
  const socialId = useMemo(() => firstParam(params.socialId), [params.socialId]);
  const profileImageUrl = useMemo(
    () => firstParam(params.profileImageUrl),
    [params.profileImageUrl],
  );

  const [email, setEmail] = useState(() => initialEmail);
  const [displayName, setDisplayName] = useState(() => {
    const fromRoute = initialDisplayNameParam.trim();
    if (fromRoute.length >= 2) return fromRoute;
    return defaultDisplayName(initialEmail, initialNickname);
  });
  const [phone, setPhone] = useState(() => {
    const normalized =
      normalizeKoreanMobileDigits(initialPhoneParam) ?? normalizePhoneDigits(initialPhoneParam);
    return normalized;
  });
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const legal = useMemo(() => resolveLegalUrls(), []);

  const openLegalInApp = (type: 'terms' | 'privacy') => {
    const fullUrl = type === 'terms' ? legal.terms : legal.privacy;
    if (!fullUrl) {
      setError('약관 링크가 설정되어 있지 않습니다. 관리자에게 문의해 주세요.');
      return;
    }
    router.push({
      pathname: '/(auth)/legal-webview',
      params: {
        url: encodeURIComponent(fullUrl),
        title: type === 'terms' ? '이용약관' : '개인정보 처리방침',
      },
    });
  };

  const validate = (): string | null => {
    if (!privacy || !terms) {
      return '서비스 이용약관 및 개인정보 처리방침에 동의해 주세요.';
    }
    if (!email.trim()) return '이메일을 입력해 주세요.';
    const dn = displayName.trim();
    if (dn.length < 2) return '이름(표시명)은 2자 이상 입력해 주세요.';
    const digits = normalizePhoneDigits(phone);
    if (!digits.length) {
      return '휴대폰 번호를 입력해 주세요.';
    }
    if (digits.length !== 11 || !digits.startsWith('01')) {
      return '휴대폰 번호는 01로 시작하는 11자리 숫자여야 합니다.';
    }
    if (!socialId) return '소셜 식별자가 없습니다. 로그인 화면으로 돌아가 다시 시도해 주세요.';
    return null;
  };

  const onSubmit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      await safeNotificationAsync(Haptics.NotificationFeedbackType.Warning);
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
        phone: digits,
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
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const again = await AuthService.loginWithProviderAfterSignup(provider);
      if (again.kind !== 'authenticated') {
        setError(
          again.kind === 'error'
            ? `${again.message} 가입은 완료되었습니다. 로그인 화면에서 ${provider === 'KAKAO' ? '카카오' : '네이버'}로 다시 로그인해 주세요.`
            : '가입은 완료되었습니다. 로그인 화면에서 동일 SNS 버튼으로 다시 로그인해 주세요.',
        );
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Warning);
        router.replace('/(auth)/login' as Href);
        return;
      }

      await safeNotificationAsync(Haptics.NotificationFeedbackType.Success);
      await navigateAfterAuthenticated();
    } catch (e: unknown) {
      const { logText, userMessage } = formatSocialSignupFailure(e);
      console.warn('[SocialSignup]', logText);
      console.error('[SocialSignup]', logText);
      const trimmed = userMessage.trim();
      setError(
        trimmed
          ? `가입 처리 중: ${trimmed}`
          : '가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      );
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
            휴대폰 (필수, 11자리)
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
            onPress={() => openLegalInApp('terms')}
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
            onPress={() => openLegalInApp('privacy')}
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
