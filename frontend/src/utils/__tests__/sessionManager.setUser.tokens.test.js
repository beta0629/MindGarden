/**
 * sessionManager.setUser — access/refresh 토큰 저장 및 sessionId-only 호출 시 덮어쓰기 방지
 */
import { sessionManager } from '../sessionManager';

describe('sessionManager.setUser token persistence', () => {
  beforeEach(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userInfo');
    sessionManager.user = null;
  });

  it('persists non-empty accessToken and refreshToken', () => {
    sessionManager.setUser({ id: 1, email: 'a@b.com' }, {
      accessToken: 'access-abc',
      refreshToken: 'refresh-xyz',
      sessionId: 'sess-1'
    });

    expect(localStorage.getItem('accessToken')).toBe('access-abc');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-xyz');
    expect(localStorage.getItem('sessionId')).toBe('sess-1');
  });

  it('does not overwrite accessToken when tokens={sessionId only}', () => {
    localStorage.setItem('accessToken', 'keep-me');
    localStorage.setItem('refreshToken', 'keep-refresh');

    sessionManager.setUser({ id: 2 }, { sessionId: 'sess-2' });

    expect(localStorage.getItem('accessToken')).toBe('keep-me');
    expect(localStorage.getItem('refreshToken')).toBe('keep-refresh');
    expect(localStorage.getItem('sessionId')).toBe('sess-2');
  });

  it('does not write "undefined" string when accessToken is missing', () => {
    sessionManager.setUser({ id: 3 }, { sessionId: 'sess-3' });

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
