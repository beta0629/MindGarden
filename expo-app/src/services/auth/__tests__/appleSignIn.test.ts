/**
 * appleSignIn — `AppleAuthentication.signInAsync()` mock 단위 테스트.
 *
 * Apple App Store 4.8 (T1) 대응.
 */

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

jest.mock('expo-apple-authentication', () => ({
  __esModule: true,
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 'FULL_NAME', EMAIL: 'EMAIL' },
}));

// 모듈을 require 형태로 import 해 mock 이 적용된 인스턴스를 사용한다.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AppleAuthentication = require('expo-apple-authentication');

import {
  APPLE_SIGN_IN_CANCELLED,
  isAppleSignInAvailable,
  isAppleSignInAvailableSync,
  performAppleNativeSignIn,
} from '../appleSignIn';

describe('appleSignIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('isAppleSignInAvailableSync: iOS 에서 true', () => {
    expect(isAppleSignInAvailableSync()).toBe(true);
  });

  test('isAppleSignInAvailable: 네이티브 isAvailableAsync 결과를 반환한다', async () => {
    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);
    await expect(isAppleSignInAvailable()).resolves.toBe(true);

    (AppleAuthentication.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await expect(isAppleSignInAvailable()).resolves.toBe(false);
  });

  test('performAppleNativeSignIn: signInAsync 결과를 정규화한다', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: 'id-token-xyz',
      authorizationCode: 'auth-code-xyz',
      email: 'user@example.com',
      fullName: { givenName: '길동', familyName: '홍' },
      user: 'apple-user-001',
    });

    const result = await performAppleNativeSignIn();

    expect(result.identityToken).toBe('id-token-xyz');
    expect(result.authorizationCode).toBe('auth-code-xyz');
    expect(result.email).toBe('user@example.com');
    expect(result.givenName).toBe('길동');
    expect(result.familyName).toBe('홍');
    expect(result.user).toBe('apple-user-001');
    expect(result.nonce).toMatch(/^[A-Za-z0-9]+$/);
    expect(result.nonce.length).toBeGreaterThanOrEqual(32);
  });

  test('performAppleNativeSignIn: signInAsync 호출 시 nonce·scope 가 함께 전달된다', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: 'id-1',
      authorizationCode: 'code-1',
      user: 'u-1',
    });

    await performAppleNativeSignIn();

    const opts = (AppleAuthentication.signInAsync as jest.Mock).mock.calls[0][0];
    expect(opts.nonce).toEqual(expect.any(String));
    expect(opts.requestedScopes).toEqual([
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ]);
  });

  test('performAppleNativeSignIn: identityToken 이 없으면 에러를 던진다', async () => {
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValueOnce({
      identityToken: null,
      authorizationCode: 'code',
      user: 'u',
    });

    await expect(performAppleNativeSignIn()).rejects.toThrow(/identityToken/);
  });

  test('performAppleNativeSignIn: 사용자 취소(ERR_REQUEST_CANCELED) 는 APPLE_SIGN_IN_CANCELLED 로 매핑', async () => {
    const err: Error & { code?: string } = new Error('cancelled');
    err.code = 'ERR_REQUEST_CANCELED';
    (AppleAuthentication.signInAsync as jest.Mock).mockRejectedValueOnce(err);

    await expect(performAppleNativeSignIn()).rejects.toThrow(APPLE_SIGN_IN_CANCELLED);
  });
});
