import Constants from 'expo-constants';

const DEFAULT_SUCCESS_SCHEME = 'mindgarden://payment/success';
const DEFAULT_FAIL_SCHEME = 'mindgarden://payment/fail';

/**
 * 토스페이먼츠 클라이언트 키 (test_ck_*, live_ck_*).
 * EAS Secret / 로컬 `.env` → `EXPO_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY` 또는 `app.config` extra.
 * 운영 live 키는 저장소에 커밋하지 말 것.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
export function getTossPaymentsClientKey(): string {
  const fromExtra = Constants.expoConfig?.extra?.tossPaymentsClientKey;
  if (typeof fromExtra === 'string' && fromExtra.trim() !== '') {
    return fromExtra.trim();
  }
  const fromEnv = process.env.EXPO_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim();
  }
  return '';
}

export function isTossPaymentsClientKeyConfigured(): boolean {
  const k = getTossPaymentsClientKey();
  return k.length > 0 && !k.includes('PLACEHOLDER');
}

export function getTossPaymentSuccessUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.tossPaymentSuccessUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim() !== '') {
    return fromExtra.trim();
  }
  const fromEnv = process.env.EXPO_PUBLIC_TOSS_PAYMENT_SUCCESS_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim();
  }
  return DEFAULT_SUCCESS_SCHEME;
}

export function getTossPaymentFailUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.tossPaymentFailUrl;
  if (typeof fromExtra === 'string' && fromExtra.trim() !== '') {
    return fromExtra.trim();
  }
  const fromEnv = process.env.EXPO_PUBLIC_TOSS_PAYMENT_FAIL_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.trim();
  }
  return DEFAULT_FAIL_SCHEME;
}
