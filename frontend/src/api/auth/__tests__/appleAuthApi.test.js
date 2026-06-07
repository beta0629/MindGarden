/**
 * appleAuthApi — StandardizedApi 호출 mock 단위 테스트.
 *
 * Apple App Store 4.8 (T1) 대응.
 */
import StandardizedApi from '../../../utils/standardizedApi';
import { signInWithApple, exchangeAppleAuthorizationCode } from '../appleAuthApi';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

describe('appleAuthApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithApple', () => {
    test('identityToken 없이 호출하면 즉시 에러를 던진다', async () => {
      await expect(signInWithApple({})).rejects.toThrow(/identityToken/);
      expect(StandardizedApi.post).not.toHaveBeenCalled();
    });

    test('정의된 필드만 백엔드로 전송한다 (undefined 제거)', async () => {
      StandardizedApi.post.mockResolvedValueOnce({ success: true, accessToken: 'a', refreshToken: 'r' });
      await signInWithApple({
        identityToken: 'token-1',
        nonce: 'nonce-1',
        givenName: '',
        familyName: '',
        email: 'user@example.com'
      });
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        '/api/v1/auth/oauth/apple/login',
        expect.objectContaining({
          identityToken: 'token-1',
          nonce: 'nonce-1',
          email: 'user@example.com'
        })
      );
      const body = StandardizedApi.post.mock.calls[0][1];
      expect(body.givenName).toBeUndefined();
      expect(body.familyName).toBeUndefined();
    });

    test('StandardizedApi 응답을 그대로 반환한다', async () => {
      StandardizedApi.post.mockResolvedValueOnce({
        success: true,
        accessToken: 'a',
        refreshToken: 'r',
        user: { id: 1 }
      });
      const result = await signInWithApple({ identityToken: 'token-1' });
      expect(result.success).toBe(true);
      expect(result.user.id).toBe(1);
    });
  });

  describe('exchangeAppleAuthorizationCode', () => {
    test('authorizationCode 없이 호출하면 에러', async () => {
      await expect(exchangeAppleAuthorizationCode({})).rejects.toThrow(/authorizationCode/);
    });

    test('/callback 엔드포인트로 전송한다', async () => {
      StandardizedApi.post.mockResolvedValueOnce({ success: true });
      await exchangeAppleAuthorizationCode({
        authorizationCode: 'code-1',
        nonce: 'nonce-1'
      });
      expect(StandardizedApi.post).toHaveBeenCalledWith(
        '/api/v1/auth/oauth/apple/callback',
        expect.objectContaining({ authorizationCode: 'code-1', nonce: 'nonce-1' })
      );
    });
  });
});
