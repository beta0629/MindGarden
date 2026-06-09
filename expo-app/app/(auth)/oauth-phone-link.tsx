/**
 * provider-agnostic OAuth 휴대폰 매칭 — 휴대폰 번호 입력 + OTP 인증 화면.
 *
 * <p>OAuth 콜백(`AuthService.login*`) 응답이 {@code requiresOAuthPhoneVerification=true}
 * 일 때 진입한다. Apple/Google/Kakao/Naver 4 종 provider 공통.</p>
 *
 * <p>디자인 톤은 Apple 베이스(`apple-phone-link.tsx`) 와 100% 동일. 디자이너 산출물
 * ({@code docs/design-system/OAUTH_PHONE_VERIFICATION_UX_SPEC.md}) §2~§7 을 따른다.
 * provider 식별은 텍스트만 (D-2=(ii)) — 제목/카피/aria-label 에 provider 표시명을 포함하고
 * 브랜드 로고·색은 본 Phase 스코프 외.</p>
 *
 * 흐름:
 *  1) 휴대폰 번호 입력 → "인증번호 발송" → {@code AuthService.sendOAuthPhoneOtp}
 *  2) OTP 단계 전환 → 6자리 입력 + 카운트다운 + 재발송(쿨다운) → {@code AuthService.verifyOAuthPhoneOtp}
 *  3) 결과 분기:
 *     - 정상 로그인 → {@code navigateAfterAuthenticated()}
 *     - {@code requiresPhoneAccountSelection} → {@code /(auth)/oauth-account-selection}
 *     - 실패 → 인라인 에러 메시지 + 운영 PII 노출 금지(마스킹 표시만)
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';
import { AuthService } from '@/services/AuthService';
import { navigateAfterAuthenticated } from '@/utils/navigateAfterAuth';
import { OtpCodeInput, OTP_CODE_LENGTH } from '@/components/molecules/OtpCodeInput';
import { maskKoreanMobileForDisplay } from '@/utils/phoneNormalize';
import {
  OAUTH_OTP_DEFAULT_EXPIRES_SECONDS,
  applyOAuthServerExpiresIn,
  applyOAuthServerResendCooldown,
  applyOAuthServerRetryAfter,
  canResendOAuthOtp,
  formatOAuthOtpCountdown,
  parseOAuthPhoneProvider,
  resolveOAuthProviderDisplayName,
  tickOAuthOtpCountdown,
  validateKoreanMobileInputForOAuth,
} from '@/utils/oauthPhoneOtp';
import type { OAuthPhoneProvider } from '@/api/auth/oauthAuth';

const PHONE_LABEL = '휴대폰 번호';
const PHONE_PLACEHOLDER = '01012345678';
const SEND_BUTTON = '인증번호 발송';
const SENDING_BUTTON = '발송 중…';
const OTP_TITLE = '인증번호 확인';
const OTP_DESCRIPTION_PREFIX = '문자로 전송된 6자리 인증번호를 입력해 주세요.';
const VERIFY_BUTTON = '확인';
const VERIFYING_BUTTON = '확인 중…';
const RESEND_BUTTON = '인증번호 재발송';
const CHANGE_PHONE_BUTTON = '휴대폰 번호 변경';
const CANCEL_BUTTON = '로그인으로';
const PRIVATE_RELAY_HINT = 'Apple Private Relay 이메일이 사용됩니다.';
const ERROR_INVALID_ENTRY = '유효하지 않은 진입입니다.';
const ERROR_SESSION_EXPIRED = '인증 세션이 만료되었습니다. 인증번호를 다시 받아 주세요.';
const ERROR_TOKEN_EXPIRED = '인증 세션이 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.';
const ERROR_OTP_LENGTH = '인증번호 6자리를 입력해 주세요.';
const ERROR_OTP_EXPIRED = '인증번호가 만료되었습니다.';
const ARIA_OTP_EXPIRED = '인증번호 만료됨';

/** aria-live 카운트다운 — 스크린리더에 10초 단위로만 announce(과도한 갱신 방지). */
const ARIA_TIMER_ANNOUNCE_INTERVAL_SECONDS = 10;

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

/** 일부 실기기·환경에서 햅틱 미지원 시 예외 → 흐름을 실패로 오인하지 않도록 삼킨다. */
async function safeNotificationAsync(
  feedbackType: Haptics.NotificationFeedbackType,
): Promise<void> {
  try {
    await Haptics.notificationAsync(feedbackType);
  } catch {
    /* noop */
  }
}

type Step = 'phone' | 'otp';

export default function OAuthPhoneLinkScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    provider?: string | string[];
    phoneVerificationToken?: string | string[];
    email?: string | string[];
    name?: string | string[];
  }>();

  const provider = useMemo<OAuthPhoneProvider | null>(
    () => parseOAuthPhoneProvider(firstParam(params.provider)),
    [params.provider],
  );
  const providerDisplayName = useMemo(
    () => (provider ? resolveOAuthProviderDisplayName(provider) : ''),
    [provider],
  );
  const phoneVerificationToken = useMemo(
    () => firstParam(params.phoneVerificationToken),
    [params.phoneVerificationToken],
  );
  const prefillEmail = useMemo(() => firstParam(params.email).trim(), [params.email]);
  const prefillName = useMemo(() => firstParam(params.name).trim(), [params.name]);

  const screenTitle = providerDisplayName ? `${providerDisplayName} 계정 연결` : '계정 연결';
  const screenDescription = providerDisplayName
    ? `본인 확인을 위해 가입된 휴대폰 번호로 SMS 인증 코드를 보내드립니다. ${providerDisplayName} 계정 정보와 연결됩니다.`
    : '본인 확인을 위해 가입된 휴대폰 번호로 SMS 인증 코드를 보내드립니다.';
  const prefillAriaLabel = providerDisplayName ? `${providerDisplayName} 계정 정보` : '계정 정보';

  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [remainingExpiresSeconds, setRemainingExpiresSeconds] = useState(
    OAUTH_OTP_DEFAULT_EXPIRES_SECONDS,
  );
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState(0);
  const expiresIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearExpiresInterval = useCallback(() => {
    if (expiresIntervalRef.current) {
      clearInterval(expiresIntervalRef.current);
      expiresIntervalRef.current = null;
    }
  }, []);

  const clearResendInterval = useCallback(() => {
    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current);
      resendIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearExpiresInterval();
      clearResendInterval();
    };
  }, [clearExpiresInterval, clearResendInterval]);

  const startTimers = useCallback(
    (expiresInSeconds: number, cooldownSeconds: number) => {
      clearExpiresInterval();
      clearResendInterval();

      setRemainingExpiresSeconds(expiresInSeconds);
      setResendCooldownSeconds(cooldownSeconds);

      expiresIntervalRef.current = setInterval(() => {
        setRemainingExpiresSeconds((prev) => tickOAuthOtpCountdown(prev).next);
      }, 1000);
      resendIntervalRef.current = setInterval(() => {
        setResendCooldownSeconds((prev) => tickOAuthOtpCountdown(prev).next);
      }, 1000);
    },
    [clearExpiresInterval, clearResendInterval],
  );

  const handleSendOtp = useCallback(async () => {
    if (!provider) {
      setError(ERROR_INVALID_ENTRY);
      return;
    }
    if (!phoneVerificationToken) {
      setError(ERROR_TOKEN_EXPIRED);
      return;
    }
    const validationError = validateKoreanMobileInputForOAuth(phoneInput);
    if (validationError) {
      setError(validationError);
      await safeNotificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await AuthService.sendOAuthPhoneOtp(
        provider,
        phoneVerificationToken,
        phoneInput.trim(),
      );
      if (result.kind === 'sent') {
        setChallengeToken(result.challengeToken);
        setOtpInput('');
        setMaskedPhone(result.maskedPhone ?? maskKoreanMobileForDisplay(phoneInput) ?? null);
        setStep('otp');
        startTimers(
          applyOAuthServerExpiresIn(result.expiresInSeconds),
          applyOAuthServerResendCooldown(result.resendCooldownSeconds),
        );
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      if (result.kind === 'cooldown') {
        setError(result.message);
        setResendCooldownSeconds(applyOAuthServerRetryAfter(result.retryAfterSeconds));
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      setError(result.message);
      await safeNotificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  }, [phoneInput, phoneVerificationToken, provider, startTimers]);

  const handleVerifyOtp = useCallback(async () => {
    if (!provider) {
      setError(ERROR_INVALID_ENTRY);
      return;
    }
    if (!phoneVerificationToken || !challengeToken) {
      setError(ERROR_SESSION_EXPIRED);
      return;
    }
    if (otpInput.length !== OTP_CODE_LENGTH) {
      setError(ERROR_OTP_LENGTH);
      await safeNotificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await AuthService.verifyOAuthPhoneOtp(
        provider,
        phoneVerificationToken,
        challengeToken,
        otpInput,
      );
      if (result.kind === 'authenticated') {
        clearExpiresInterval();
        clearResendInterval();
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuthenticated();
        return;
      }
      if (result.kind === 'requiresPhoneAccountSelection') {
        clearExpiresInterval();
        clearResendInterval();
        router.replace({
          pathname: '/(auth)/oauth-account-selection',
          params: {
            selectionToken: result.selectionToken,
            provider: result.provider,
          },
        });
        return;
      }
      setError(result.message);
      await safeNotificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  }, [
    challengeToken,
    clearExpiresInterval,
    clearResendInterval,
    otpInput,
    phoneVerificationToken,
    provider,
  ]);

  const handleResend = useCallback(async () => {
    if (!canResendOAuthOtp(resendCooldownSeconds, busy)) {
      return;
    }
    await handleSendOtp();
  }, [busy, handleSendOtp, resendCooldownSeconds]);

  const handleChangePhone = useCallback(() => {
    clearExpiresInterval();
    clearResendInterval();
    setStep('phone');
    setOtpInput('');
    setChallengeToken(null);
    setMaskedPhone(null);
    setRemainingExpiresSeconds(OAUTH_OTP_DEFAULT_EXPIRES_SECONDS);
    setResendCooldownSeconds(0);
    setError(null);
  }, [clearExpiresInterval, clearResendInterval]);

  const handleCancel = useCallback(() => {
    clearExpiresInterval();
    clearResendInterval();
    router.replace('/(auth)/login' as Href);
  }, [clearExpiresInterval, clearResendInterval]);

  if (!provider || !phoneVerificationToken) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.bgMain }]}>
        <Text style={{ color: theme.colors.error }}>{ERROR_INVALID_ENTRY}</Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace('/(auth)/login' as Href)}
          accessibilityRole="button"
          accessibilityLabel={CANCEL_BUTTON}
        >
          <Text style={{ color: theme.colors.primary }}>{CANCEL_BUTTON}</Text>
        </Pressable>
      </View>
    );
  }

  const isOtpExpired = step === 'otp' && remainingExpiresSeconds <= 0;
  const verifyDisabled =
    busy || otpInput.length !== OTP_CODE_LENGTH || !challengeToken || isOtpExpired;
  const sendDisabled = busy;
  const resendEnabled = step === 'otp' && canResendOAuthOtp(resendCooldownSeconds, busy);
  const displayMaskedPhone =
    step === 'otp' ? (maskedPhone ?? maskKoreanMobileForDisplay(phoneInput)) : null;

  // 디자이너 §2.6 — 스크린리더에 10초 단위로만 announce. 그 외 초는 visual 만 갱신.
  const timerAriaLabel = isOtpExpired
    ? ARIA_OTP_EXPIRED
    : remainingExpiresSeconds % ARIA_TIMER_ANNOUNCE_INTERVAL_SECONDS === 0
      ? `남은 시간 ${formatOAuthOtpCountdown(remainingExpiresSeconds)}`
      : undefined;

  const showPrivateRelayHint = provider === 'APPLE' && Boolean(prefillEmail);
  const showPrefillBox = Boolean(prefillEmail || prefillName);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.bgMain }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.textMain }]}>{screenTitle}</Text>
        <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>{screenDescription}</Text>

        {showPrefillBox && (
          <View
            style={[
              styles.prefillBox,
              {
                backgroundColor: theme.colors.bgSub,
                borderColor: theme.colors.border,
              },
            ]}
            accessibilityLabel={prefillAriaLabel}
          >
            {Boolean(prefillName) && (
              <Text style={[styles.prefillLabel, { color: theme.colors.textTertiary }]}>이름</Text>
            )}
            {Boolean(prefillName) && (
              <Text style={[styles.prefillValue, { color: theme.colors.textMain }]}>
                {prefillName}
              </Text>
            )}
            {Boolean(prefillEmail) && (
              <Text
                style={[
                  styles.prefillLabel,
                  { color: theme.colors.textTertiary, marginTop: prefillName ? 8 : 0 },
                ]}
              >
                이메일
              </Text>
            )}
            {Boolean(prefillEmail) && (
              <Text style={[styles.prefillValue, { color: theme.colors.textMain }]}>
                {prefillEmail}
              </Text>
            )}
            {showPrivateRelayHint && (
              <Text style={[styles.privateRelayHint, { color: theme.colors.textTertiary }]}>
                {PRIVATE_RELAY_HINT}
              </Text>
            )}
          </View>
        )}

        {step === 'phone' && (
          <View style={styles.section}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>
              {PHONE_LABEL}
            </Text>
            <View style={[styles.inputBox, { borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.textMain }]}
                placeholder={PHONE_PLACEHOLDER}
                placeholderTextColor={theme.colors.textTertiary}
                value={phoneInput}
                onChangeText={(v) => setPhoneInput(v.replace(/\D/g, '').slice(0, 11))}
                keyboardType="phone-pad"
                maxLength={11}
                autoFocus
                editable={!busy}
                accessibilityLabel="휴대폰 번호 11자리 입력"
              />
            </View>

            {Boolean(error) && (
              <Text style={[styles.error, { color: theme.colors.error }]} accessibilityRole="alert">
                {error}
              </Text>
            )}

            <Pressable
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: sendDisabled ? 0.5 : 1,
                },
              ]}
              onPress={handleSendOtp}
              disabled={sendDisabled}
              accessibilityRole="button"
              accessibilityLabel={SEND_BUTTON}
            >
              {busy ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: theme.colors.textOnPrimary }]}>
                  {SEND_BUTTON}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {step === 'otp' && (
          <View style={styles.section}>
            <Text style={[styles.otpTitle, { color: theme.colors.textMain }]}>{OTP_TITLE}</Text>
            <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
              {OTP_DESCRIPTION_PREFIX}
              {displayMaskedPhone ? ` (${displayMaskedPhone})` : ''}
            </Text>

            <OtpCodeInput
              value={otpInput}
              onChange={setOtpInput}
              onComplete={() => {
                if (!busy && challengeToken && !isOtpExpired) {
                  void handleVerifyOtp();
                }
              }}
              disabled={busy || isOtpExpired}
              autoFocus
              hasError={Boolean(error)}
              style={styles.otpInput}
              accessibilityLabel="인증번호 6자리 입력"
            />

            <View
              style={styles.timerRow}
              accessibilityLiveRegion="polite"
              accessible
              accessibilityLabel={timerAriaLabel}
            >
              <Text
                style={[
                  styles.timerText,
                  {
                    color: isOtpExpired ? theme.colors.error : theme.colors.textSecondary,
                  },
                ]}
              >
                {isOtpExpired
                  ? ERROR_OTP_EXPIRED
                  : `남은 시간 ${formatOAuthOtpCountdown(remainingExpiresSeconds)}`}
              </Text>
              <Pressable
                onPress={handleResend}
                disabled={!resendEnabled}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel={
                  resendEnabled
                    ? RESEND_BUTTON
                    : `${RESEND_BUTTON} (재발송까지 ${formatOAuthOtpCountdown(resendCooldownSeconds)})`
                }
              >
                <Text
                  style={[
                    styles.resendText,
                    {
                      color: resendEnabled ? theme.colors.primary : theme.colors.textTertiary,
                    },
                  ]}
                >
                  {resendEnabled
                    ? RESEND_BUTTON
                    : `${RESEND_BUTTON} ${formatOAuthOtpCountdown(resendCooldownSeconds)}`}
                </Text>
              </Pressable>
            </View>

            {Boolean(error) && (
              <Text style={[styles.error, { color: theme.colors.error }]} accessibilityRole="alert">
                {error}
              </Text>
            )}

            <Pressable
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: verifyDisabled ? 0.5 : 1,
                },
              ]}
              onPress={handleVerifyOtp}
              disabled={verifyDisabled}
              accessibilityRole="button"
              accessibilityLabel={VERIFY_BUTTON}
            >
              {busy ? (
                <ActivityIndicator color={theme.colors.textOnPrimary} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: theme.colors.textOnPrimary }]}>
                  {busy ? VERIFYING_BUTTON : VERIFY_BUTTON}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleChangePhone}
              disabled={busy}
              style={styles.changePhoneBtn}
              accessibilityRole="button"
              accessibilityLabel={CHANGE_PHONE_BUTTON}
            >
              <Text style={[styles.changePhoneText, { color: theme.colors.textTertiary }]}>
                {CHANGE_PHONE_BUTTON}
              </Text>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={handleCancel}
          style={styles.backBtn}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={CANCEL_BUTTON}
        >
          <Text style={{ color: theme.colors.textTertiary }}>{CANCEL_BUTTON}</Text>
        </Pressable>

        {busy && step === 'phone' && (
          <Text style={[styles.busyHint, { color: theme.colors.textTertiary }]}>
            {SENDING_BUTTON}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 24, paddingTop: 56, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: fontSizeTokens['2xl'], fontWeight: '700', marginBottom: 8 },
  sub: { fontSize: fontSizeTokens.sm, lineHeight: 20, marginBottom: 16 },
  prefillBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  prefillLabel: {
    fontSize: fontSizeTokens.xs,
    marginBottom: 2,
  },
  prefillValue: {
    fontSize: fontSizeTokens.sm,
    fontWeight: '500',
  },
  privateRelayHint: {
    fontSize: fontSizeTokens.xs,
    marginTop: 8,
  },
  section: { gap: 12 },
  fieldLabel: {
    fontSize: fontSizeTokens.sm,
    fontWeight: '500',
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    fontSize: fontSizeTokens.base,
  },
  otpTitle: {
    fontSize: fontSizeTokens.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  otpInput: {
    marginTop: 8,
    marginBottom: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  timerText: {
    fontSize: fontSizeTokens.sm,
  },
  resendText: {
    fontSize: fontSizeTokens.sm,
    fontWeight: '600',
  },
  error: {
    fontSize: fontSizeTokens.sm,
  },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  primaryBtnText: { fontSize: fontSizeTokens.base, fontWeight: '600' },
  changePhoneBtn: { alignItems: 'center', padding: 12 },
  changePhoneText: { fontSize: fontSizeTokens.sm },
  backBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  busyHint: { textAlign: 'center', marginTop: 8, fontSize: fontSizeTokens.xs },
});
