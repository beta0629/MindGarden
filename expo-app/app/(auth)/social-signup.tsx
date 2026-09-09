/**
 * 소셜 간편 가입 — 약관 동의 중심, 비밀번호 미전송(SNS A안) + 가입 후 social-login 재호출
 *
 * <p>이용약관·개인정보 「보기」는 테넌트 merchantLegal SSOT(UnifiedModal) 만 사용한다.
 * 플랫폼 terms/privacy URL·WebView 폴백 금지.</p>
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { useCallback, useMemo, useState } from 'react';
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
import {
  AuthService,
  type SocialAuthProvider,
  type SocialSignupRequestBody,
} from '@/services/AuthService';
import { navigateAfterAuthenticated } from '@/utils/navigateAfterAuth';
import { normalizeKoreanMobileDigits } from '@/utils/phoneNormalize';
import { sanitizeSocialIdentityString } from '@/utils/socialIdentitySanitize';
import { UnifiedModal } from '@/components/common/modals/UnifiedModal';
import { MerchantLegalFooter } from '@/components/molecules/MerchantLegalFooter';
import {
  CLOSED_GUIDE_MODAL,
  openMerchantLegalGuideModal,
  type MerchantLegalGuideModalState,
} from '@/components/molecules/merchantLegalFooterHelpers';
import { useMerchantLegal } from '@/hooks/useMerchantLegal';
import { formatMerchantLegalDisclosureText } from '@/utils/merchantLegal';

/** 동의 「보기」 — 이용약관 모달 제목 */
const CONSENT_VIEW_TITLE_TERMS = '이용 안내';

/** 동의 「보기」 — 개인정보 모달 제목 */
const CONSENT_VIEW_TITLE_PRIVACY = '사업자·약관 안내';

/** 테넌트 merchantLegal 이 비어 있을 때 조용한 오류 */
const MERCHANT_LEGAL_EMPTY_ERROR =
  '등록된 사업자·약관 안내가 없습니다. 센터에 문의해 주세요.';

/**
 * 라우터 파라미터를 안전하게 추출한다.
 *
 * <p>SNS SDK·BE 응답에서 닉네임·이름이 null/undefined일 때 일부 직렬화 경로(객체→URLSearchParams 등)에서
 * "null"/"undefined" 문자열로 변환되어 화면에 그대로 노출되는 사고를 차단한다.</p>
 *
 * @param v 라우터에서 받은 단일 값 또는 배열
 * @returns 사용 가능한 문자열(없으면 빈 문자열)
 */
function firstParam(v: string | string[] | undefined): string {
  const raw = Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
  return sanitizeSocialIdentityString(raw);
}

function normalizePhoneDigits(input: string): string {
  return input.replace(/\D/g, '');
}

const GUIDE_MODAL_BODY_WEB =
  Platform.OS === 'web'
    ? ({ whiteSpace: 'pre-wrap' } as Record<string, string>)
    : null;

/** 표시명: SDK 닉네임·이메일 로컬파트로 최소 길이 보장. "null"/"undefined" 문자열은 빈 값으로 간주한다. */
function defaultDisplayName(email: string, nickname: string): string {
  const nick = sanitizeSocialIdentityString(nickname);
  if (nick.length >= 2) return nick;
  const local = sanitizeSocialIdentityString(email.split('@')[0] ?? '');
  if (local.length >= 2) return local;
  return nick || local || '';
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
  const [guideModal, setGuideModal] =
    useState<MerchantLegalGuideModalState>(CLOSED_GUIDE_MODAL);

  const { legal: merchantLegal, centerName: merchantCenterName, tenantCode } =
    useMerchantLegal();

  /**
   * 이용약관·개인정보 「보기」 공통 — 테넌트 merchantLegal 평문만 UnifiedModal 로 표시.
   * 플랫폼 privacy·terms URL·WebView 폴백 없음.
   *
   * @param title 모달 제목
   */
  const openTenantMerchantLegalDisclosure = useCallback(
    (title: string) => {
      const body = formatMerchantLegalDisclosureText(
        merchantCenterName,
        merchantLegal,
      );
      const next = openMerchantLegalGuideModal(title, body);
      if (!next.isOpen) {
        setError(MERCHANT_LEGAL_EMPTY_ERROR);
        return;
      }
      setError(null);
      setGuideModal(next);
    },
    [merchantCenterName, merchantLegal],
  );

  const openTenantTermsGuide = useCallback(() => {
    openTenantMerchantLegalDisclosure(CONSENT_VIEW_TITLE_TERMS);
  }, [openTenantMerchantLegalDisclosure]);

  const openTenantPrivacyGuide = useCallback(() => {
    openTenantMerchantLegalDisclosure(CONSENT_VIEW_TITLE_PRIVACY);
  }, [openTenantMerchantLegalDisclosure]);

  const closeGuideModal = useCallback(() => {
    setGuideModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

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
            placeholder="휴대폰 번호"
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
            onPress={openTenantTermsGuide}
            hitSlop={8}
            accessibilityLabel="이용 안내 전문"
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
            onPress={openTenantPrivacyGuide}
            hitSlop={8}
            accessibilityLabel="사업자·약관 안내 전문"
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

        {tenantCode ? (
          <MerchantLegalFooter
            centerName={merchantCenterName}
            legal={merchantLegal}
            compact
            style={styles.legalFooter}
          />
        ) : null}
      </ScrollView>

      {guideModal.isOpen ? (
        <UnifiedModal
          isOpen
          onClose={closeGuideModal}
          title={guideModal.title}
          actions={[
            {
              label: '확인',
              onPress: closeGuideModal,
              variant: 'primary',
            },
          ]}
        >
          <ScrollView style={styles.guideModalScroll} showsVerticalScrollIndicator>
            <Text
              testID="merchant-legal-guide-modal-body"
              style={[
                styles.guideModalBody,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.regular,
                },
                GUIDE_MODAL_BODY_WEB,
              ]}
            >
              {guideModal.body}
            </Text>
          </ScrollView>
        </UnifiedModal>
      ) : null}
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
  legalFooter: { marginTop: 24 },
  guideModalScroll: { maxHeight: 320 },
  guideModalBody: { fontSize: fontSizeTokens.sm, lineHeight: 22 },
});
