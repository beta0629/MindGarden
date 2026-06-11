/**
 * Push-first OTP 1회 조회·표시 화면.
 *
 * <p>{@code NotificationService.navigateToOtpDelivery} 분기로 진입한다.
 * push payload {@code data.otpToken} 을 라우트 파라미터로 받아
 * {@code GET /api/v1/auth/otp/current} 로 6자리 OTP 를 1회 조회·표시한다.
 * 인증 흐름(로그인·휴대전화 변경 등) 의 호출자 화면에 사용자가 직접 6자리를 입력하므로,
 * 본 화면은 조회된 OTP 를 노출만 한다 — 자동 전달·복사·외부 공유 없음.</p>
 *
 * <p>실패(만료·소비됨·네트워크) 시 SMS 폴백 안내만 표기한다. 평문 OTP 는 로그 출력 금지.</p>
 *
 * @author MindGarden
 * @since 2026-06-12
 */
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { fetchCurrentOtp } from '../../src/services/AuthOtpService';
import { useTheme } from '../../src/theme';

type FetchStatus = 'idle' | 'loading' | 'success' | 'failed';

interface OtpScreenParams extends Record<string, string | string[] | undefined> {
  otpToken?: string;
  purpose?: string;
}

/** 백엔드 {@link OtpPurpose} 코드 → 사용자 안내 문구 (로그·식별자가 아닌 표시 목적). */
const PURPOSE_DESCRIPTION_FALLBACK = '본인확인';
const PURPOSE_DESCRIPTIONS: Readonly<Record<string, string>> = {
  login_verification: '로그인 본인확인',
  phone_change: '휴대전화 변경 본인확인',
  signup_verification: '회원가입 본인확인',
  generic: PURPOSE_DESCRIPTION_FALLBACK,
};

function resolvePurposeLabel(raw: string | undefined): string {
  if (!raw) {
    return PURPOSE_DESCRIPTION_FALLBACK;
  }
  return PURPOSE_DESCRIPTIONS[raw] ?? PURPOSE_DESCRIPTION_FALLBACK;
}

function pickStringParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default function OtpCurrentScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<OtpScreenParams>();
  const otpToken = pickStringParam(params.otpToken);
  const purposeLabel = resolvePurposeLabel(pickStringParam(params.purpose));

  const [status, setStatus] = useState<FetchStatus>('idle');
  const [otp, setOtp] = useState<string | null>(null);

  const loadOtp = useCallback(async () => {
    if (!otpToken) {
      setStatus('failed');
      setOtp(null);
      return;
    }
    setStatus('loading');
    const result = await fetchCurrentOtp(otpToken);
    if (!result) {
      setStatus('failed');
      setOtp(null);
      return;
    }
    setOtp(result.otp);
    setStatus('success');
  }, [otpToken]);

  useEffect(() => {
    void loadOtp();
  }, [loadOtp]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }, []);

  const renderContent = () => {
    if (status === 'loading' || status === 'idle') {
      return (
        <View style={styles.center} accessibilityRole="progressbar">
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.helper,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
              },
            ]}
          >
            인증번호를 불러오는 중입니다.
          </Text>
        </View>
      );
    }
    if (status === 'success' && otp) {
      return (
        <View style={styles.center}>
          <Text
            style={[
              styles.purpose,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.medium,
                fontSize: theme.fontSize.sm,
              },
            ]}
          >
            {purposeLabel}
          </Text>
          <Text
            style={[
              styles.code,
              {
                color: theme.colors.primaryDark,
                fontFamily: theme.fontFamily.bold,
                fontSize: theme.fontSize['5xl'],
              },
            ]}
            accessibilityRole="header"
            accessibilityLabel={`인증번호 ${otp.split('').join(' ')}`}
            selectable
          >
            {otp}
          </Text>
          <Text
            style={[
              styles.helper,
              {
                color: theme.colors.textSecondary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
              },
            ]}
          >
            5분 안에 인증 화면에 직접 입력해 주세요.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Text
          style={[
            styles.purpose,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.medium,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          {purposeLabel}
        </Text>
        <Text
          style={[
            styles.errorTitle,
            {
              color: theme.colors.error,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.lg,
            },
          ]}
          accessibilityRole="alert"
        >
          인증번호를 표시할 수 없습니다.
        </Text>
        <Text
          style={[
            styles.helper,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          만료되었거나 이미 사용된 알림입니다. 인증 화면에서 다시 요청하면 SMS 로 발송됩니다.
        </Text>
        {otpToken ? (
          <Pressable
            onPress={loadOtp}
            style={[styles.actionButton, { borderColor: theme.colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="인증번호 다시 불러오기"
          >
            <Text
              style={[
                styles.actionButtonLabel,
                {
                  color: theme.colors.textMain,
                  fontFamily: theme.fontFamily.medium,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            >
              다시 시도
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgMain }]} accessibilityViewIsModal>
      {renderContent()}
      <Pressable
        onPress={handleClose}
        style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="닫기"
      >
        <Text
          style={[
            styles.closeButtonLabel,
            {
              color: theme.colors.textOnPrimary,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            },
          ]}
        >
          닫기
        </Text>
      </Pressable>
    </View>
  );
}

const CODE_LETTER_SPACING = 6;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  purpose: {
    marginBottom: 4,
  },
  code: {
    letterSpacing: CODE_LETTER_SPACING,
  },
  helper: {
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  errorTitle: {
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonLabel: {
    textAlign: 'center',
  },
  closeButton: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonLabel: {
    textAlign: 'center',
  },
});
