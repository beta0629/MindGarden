/**
 * authTokenRefresh 단위 테스트 — 경로·응답 파싱·skip URL
 */
import { AUTH_API } from '../../constants/api';
import {
  extractTokensFromRefreshBody,
  shouldSkipTokenRefreshOn401
} from '../authTokenRefresh';

describe('authTokenRefresh', () => {
  it('AUTH_API.REFRESH_TOKEN 은 /api/v1/auth/refresh-token', () => {
    expect(AUTH_API.REFRESH_TOKEN).toBe('/api/v1/auth/refresh-token');
  });

  it('refresh-token URL 은 401 refresh 스킵', () => {
    expect(shouldSkipTokenRefreshOn401('/api/v1/auth/refresh-token')).toBe(true);
    expect(shouldSkipTokenRefreshOn401('https://x.example/api/v1/auth/refresh-token')).toBe(true);
  });

  it('일반 API URL 은 refresh 대상', () => {
    expect(shouldSkipTokenRefreshOn401('/api/v1/admin/consultants')).toBe(false);
  });

  it('ApiResponse.data 래퍼에서 토큰 추출', () => {
    expect(
      extractTokensFromRefreshBody({
        success: true,
        data: { accessToken: 'a1', refreshToken: 'r1' }
      })
    ).toEqual({ accessToken: 'a1', refreshToken: 'r1' });
  });

  it('flat 본문·token 별칭 지원', () => {
    expect(
      extractTokensFromRefreshBody({ token: 'a2', refreshToken: 'r2' })
    ).toEqual({ accessToken: 'a2', refreshToken: 'r2' });
  });
});
