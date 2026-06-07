/**
 * Sign in with Apple — iOS 네이티브 `signInAsync()` 래퍼 + nonce 생성.
 *
 * Apple App Store Guideline 4.8 (T1) 대응. Apple HIG 에 따라
 *  1) 호출마다 nonce 를 생성하고
 *  2) `expo-apple-authentication` 네이티브 시트를 띄워 identityToken / authorizationCode 를 받고
 *  3) 사용자가 처음 동의한 경우에만 fullName·email 을 함께 반환한다.
 *
 * 보안:
 *  - nonce 는 호출마다 새로 생성하고 백엔드에서 `id_token.payload.nonce_supported` 와 검증한다.
 *  - identityToken 의 실제 서명·issuer·audience 검증은 모두 서버측에서 수행한다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

/** iOS 13+ 만 `signInAsync()` 호출 가능. Android·Expo Go 에서는 사용 금지. */
export function isAppleSignInAvailableSync(): boolean {
  return Platform.OS === 'ios';
}

/**
 * 디바이스가 실제로 Sign in with Apple 을 지원하는지(iOS 13+).
 * 시뮬레이터·구형 iOS 14 미만에서는 `false` 반환.
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (!isAppleSignInAvailableSync()) {
    return false;
  }
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Apple 로그인 결과 — 백엔드 `AppleSignInRequest` 와 동일 키 체계. */
export interface AppleNativeSignInPayload {
  identityToken: string;
  authorizationCode: string;
  nonce: string;
  givenName: string;
  familyName: string;
  email: string;
  /** Apple 측 user identifier — 디버깅·재시도용 (백엔드에서는 identityToken `sub` 를 SoT 로 사용) */
  user: string;
}

/** Apple 시트가 사용자에 의해 취소된 경우의 식별 문자열(에러 메시지에 포함) */
export const APPLE_SIGN_IN_CANCELLED = 'APPLE_SIGN_IN_CANCELLED';

const NONCE_LENGTH = 32;
/** A–Z a–z 0–9 만 사용 (Apple 권장 — base64url 호환). */
const NONCE_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateRawNonce(length = NONCE_LENGTH): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += NONCE_CHARSET.charAt(Math.floor(Math.random() * NONCE_CHARSET.length));
  }
  return out;
}

/**
 * 네이티브 Apple 시트를 띄우고 identityToken 을 받는다.
 *
 * Apple `signInAsync()` 는 사용자가 취소하면 `ERR_REQUEST_CANCELED` 를 throw 한다.
 * 호출자는 메시지에 {@link APPLE_SIGN_IN_CANCELLED} 가 포함되어 있는지로 취소 여부를 판단할 수 있다.
 *
 * @throws iOS 가 아니거나 디바이스가 SIWA 미지원이면 throw
 * @throws 사용자가 시트를 닫으면 throw
 */
export async function performAppleNativeSignIn(): Promise<AppleNativeSignInPayload> {
  if (!isAppleSignInAvailableSync()) {
    throw new Error('Sign in with Apple 은 iOS 에서만 사용할 수 있습니다.');
  }

  const nonce = generateRawNonce();

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce,
    });

    if (!credential.identityToken) {
      throw new Error('Apple 에서 identityToken 을 발급받지 못했습니다.');
    }

    return {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode ?? '',
      nonce,
      givenName: credential.fullName?.givenName ?? '',
      familyName: credential.fullName?.familyName ?? '',
      email: credential.email ?? '',
      user: credential.user,
    };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'ERR_REQUEST_CANCELED') {
      throw new Error(APPLE_SIGN_IN_CANCELLED);
    }
    throw err;
  }
}
