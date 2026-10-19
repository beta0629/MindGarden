/**
 * 재발급 토큰은 현재 사용자가 있을 때만 세션에 반영한다.
 *
 * @author CoreSolution
 * @since 2026-10-19
 */

import { persistReissuedSessionTokens } from '../persistReissuedSessionTokens';
import sessionManager from '../sessionManager';

jest.mock('../sessionManager', () => ({
  __esModule: true,
  default: {
    getUser: jest.fn(),
    setUser: jest.fn()
  }
}));

describe('persistReissuedSessionTokens', () => {
  const currentUser = { id: 'user-1' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('accessToken 이 없으면 setUser 를 호출하지 않는다', async() => {
    await persistReissuedSessionTokens(null);
    await persistReissuedSessionTokens({});
    await persistReissuedSessionTokens({ refreshToken: 'refresh-1' });

    expect(sessionManager.getUser).not.toHaveBeenCalled();
    expect(sessionManager.setUser).not.toHaveBeenCalled();
  });

  test('accessToken 이 있어도 현재 사용자가 없으면 setUser 를 호출하지 않는다', async() => {
    sessionManager.getUser.mockReturnValue(null);

    await persistReissuedSessionTokens({
      accessToken: 'access-1',
      refreshToken: 'refresh-1'
    });

    expect(sessionManager.getUser).toHaveBeenCalledTimes(1);
    expect(sessionManager.setUser).not.toHaveBeenCalled();
  });

  test('현재 사용자에게 accessToken 과 refreshToken 을 저장한다', async() => {
    sessionManager.getUser.mockReturnValue(currentUser);

    await persistReissuedSessionTokens({
      accessToken: 'access-1',
      refreshToken: 'refresh-1'
    });

    expect(sessionManager.setUser).toHaveBeenCalledWith(currentUser, {
      accessToken: 'access-1',
      refreshToken: 'refresh-1'
    });
  });
});
