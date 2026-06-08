/**
 * Apple SIWA 휴대폰 매칭 — 휴대폰 번호 입력 + OTP 인증 화면.
 *
 * <p>Apple `/login` 응답이 `requiresPhoneVerification=true` 일 때 진입한다.
 * 디자인 톤은 `social-signup` / `oauth-account-selection` 과 동일 (전용 ScrollView, UnifiedModal 미사용).</p>
 *
 * 흐름:
 *  1) 휴대폰 번호 입력 → "인증번호 발송" → `AuthService.sendApplePhoneOtp`
 *  2) OTP 단계 전환 → 6자리 입력 + 카운트다운 + 재발송(쿨다운) → `AuthService.verifyApplePhoneOtp`
 *  3) 결과 분기:
 *     - 정상 로그인 → `navigateAfterAuthenticated()` (토큰은 AuthService 가 저장)
 *     - `requiresPhoneAccountSelection` → `/(auth)/oauth-account-selection` 재사용
 *     - 실패 → 인라인 에러 메시지
 *
 * @author MindGarden
 * @since 2026-06-08
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
  APPLE_OTP_DEFAULT_EXPIRES_SECONDS,
  APPLE_OTP_RESEND_COOLDOWN_SECONDS,
  applyServerExpiresIn,
  applyServerRetryAfter,
  canResendOtp,
  formatOtpCountdown,
  tickOtpCountdown,
  validateKoreanMobileInput,
} from '@/utils/applePhoneOtp';

const SCREEN_TITLE = 'Apple 계정 연결';
const SCREEN_DESCRIPTION =
  '가입된 휴대폰 번호로 본인 확인 후 Apple 계정에 연결합니다. 인증번호는 SMS 로 발송됩니다.';
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

export default function ApplePhoneLinkScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    phoneVerificationToken?: string | string[];
    email?: string | string[];
    name?: string | string[];
  }>();

  const phoneVerificationToken = useMemo(
    () => firstParam(params.phoneVerificationToken),
    [params.phoneVerificationToken],
  );
  const prefillEmail = useMemo(() => firstParam(params.email).trim(), [params.email]);
  const prefillName = useMemo(() => firstParam(params.name).trim(), [params.name]);

  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpChallengeToken, setOtpChallengeToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [remainingExpiresSeconds, setRemainingExpiresSeconds] = useState(
    APPLE_OTP_DEFAULT_EXPIRES_SECONDS,
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
        setRemainingExpiresSeconds((prev) => tickOtpCountdown(prev).next);
      }, 1000);
      resendIntervalRef.current = setInterval(() => {
        setResendCooldownSeconds((prev) => tickOtpCountdown(prev).next);
      }, 1000);
    },
    [clearExpiresInterval, clearResendInterval],
  );

  const handleSendOtp = useCallback(async () => {
    if (!phoneVerificationToken) {
      setError('Apple 인증 정보가 만료되었습니다. 로그인 화면에서 다시 시도해 주세요.');
      return;
    }
    const validationError = validateKoreanMobileInput(phoneInput);
    if (validationError) {
      setError(validationError);
      await safeNotificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await AuthService.sendApplePhoneOtp(phoneVerificationToken, phoneInput.trim());
      if (result.kind === 'sent') {
        setOtpChallengeToken(result.otpChallengeToken);
        setOtpInput('');
        setStep('otp');
        startTimers(
          applyServerExpiresIn(result.expiresInSeconds),
          APPLE_OTP_RESEND_COOLDOWN_SECONDS,
        );
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      if (result.kind === 'cooldown') {
        setError(result.message);
        setResendCooldownSeconds(applyServerRetryAfter(result.retryAfterSeconds));
        await safeNotificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      setError(result.message);
      await safeNotificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBusy(false);
    }
  }, [phoneInput, phoneVerificationToken, startTimers]);

  const handleVerifyOtp = useCallback(async () => {
    if (!phoneVerificationToken || !otpChallengeToken) {
      setError('인증 세션이 만료되었습니다. 인증번호를 다시 받아 주세요.');
      return;
    }
    if (otpInput.length !== OTP_CODE_LENGTH) {
      setError('인증번호 6자리를 입력해 주세요.');
      await safeNotificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await AuthService.verifyApplePhoneOtp(
        phoneVerificationToken,
        otpChallengeToken,
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
            provider: 'APPLE',
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
    clearExpiresInterval,
    clearResendInterval,
    otpChallengeToken,
    otpInput,
    phoneVerificationToken,
  ]);

  const handleResend = useCallback(async () => {
    if (!canResendOtp(resendCooldownSeconds, busy)) {
      return;
    }
    await handleSendOtp();
  }, [busy, handleSendOtp, resendCooldownSeconds]);

  const handleChangePhone = useCallback(() => {
    clearExpiresInterval();
    clearResendInterval();
    setStep('phone');
    setOtpInput('');
    setOtpChallengeToken(null);
    setRemainingExpiresSeconds(APPLE_OTP_DEFAULT_EXPIRES_SECONDS);
    setResendCooldownSeconds(0);
    setError(null);
  }, [clearExpiresInterval, clearResendInterval]);

  const handleCancel = useCallback(() => {
    clearExpiresInterval();
    clearResendInterval();
    router.replace('/(auth)/login' as Href);
  }, [clearExpiresInterval, clearResendInterval]);

  if (!phoneVerificationToken) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.bgMain }]}>
        <Text style={{ color: theme.colors.error }}>유효하지 않은 진입입니다.</Text>
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
    busy || otpInput.length !== OTP_CODE_LENGTH || !otpChallengeToken || isOtpExpired;
  const sendDisabled = busy;
  const resendEnabled = step === 'otp' && canResendOtp(resendCooldownSeconds, busy);
  const maskedPhone = step === 'otp' ? maskKoreanMobileForDisplay(phoneInput) : null;

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
        <Text style={[styles.title, { color: theme.colors.textMain }]}>{SCREEN_TITLE}</Text>
        <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>
          {SCREEN_DESCRIPTION}
        </Text>

        {(prefillEmail || prefillName) && (
          <View
            style={[
              styles.prefillBox,
              {
                backgroundColor: theme.colors.bgSub,
                borderColor: theme.colors.border,
              },
            ]}
            accessibilityLabel="Apple 계정 정보"
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
              {maskedPhone ? ` (${maskedPhone})` : ''}
            </Text>

            <OtpCodeInput
              value={otpInput}
              onChange={setOtpInput}
              onComplete={() => {
                if (!busy && otpChallengeToken && !isOtpExpired) {
                  void handleVerifyOtp();
                }
              }}
              disabled={busy || isOtpExpired}
              autoFocus
              hasError={Boolean(error)}
              style={styles.otpInput}
              accessibilityLabel="인증번호 6자리 입력"
            />

            <View style={styles.timerRow}>
              <Text
                style={[
                  styles.timerText,
                  {
                    color: isOtpExpired ? theme.colors.error : theme.colors.textSecondary,
                  },
                ]}
                accessibilityLabel={
                  isOtpExpired
                    ? '인증번호 만료됨'
                    : `남은 시간 ${formatOtpCountdown(remainingExpiresSeconds)}`
                }
              >
                {isOtpExpired
                  ? '인증번호가 만료되었습니다.'
                  : `남은 시간 ${formatOtpCountdown(remainingExpiresSeconds)}`}
              </Text>
              <Pressable
                onPress={handleResend}
                disabled={!resendEnabled}
                accessibilityRole="button"
                accessibilityLabel={
                  resendEnabled
                    ? RESEND_BUTTON
                    : `${RESEND_BUTTON} (재발송까지 ${formatOtpCountdown(resendCooldownSeconds)})`
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
                    : `${RESEND_BUTTON} ${formatOtpCountdown(resendCooldownSeconds)}`}
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

        {/* 발송 진행 중 노출되는 본문 라벨 — 발송 버튼이 비활성화된 동안 추가 안내 */}
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
