/**
 * forceLogout — 서버 세션 무효화 후 로그인 리다이렉트
 */
import duplicateLoginManager from '../duplicateLoginManager';

jest.mock('../sessionManager', () => ({
  sessionManager: {
    postLogoutInvalidateServerSession: jest.fn().mockResolvedValue(undefined),
    applyClientLogoutCleanupPreserveSubdomain: jest.fn(),
    setPostLogoutGateBeforeRedirect: jest.fn()
  }
}));

jest.mock('../sessionRedirect', () => ({
  redirectToLoginPageOnce: jest.fn().mockReturnValue(true)
}));

jest.mock('../ajax', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock('../notification', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('duplicateLoginManager.forceLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    duplicateLoginManager.stopChecking();
  });

  it('서버 logout 무효화 후 reason=duplicate-login 으로 이동한다', async () => {
    const { sessionManager } = require('../sessionManager');
    const { redirectToLoginPageOnce } = require('../sessionRedirect');

    await duplicateLoginManager.forceLogout();

    expect(sessionManager.postLogoutInvalidateServerSession).toHaveBeenCalled();
    expect(sessionManager.applyClientLogoutCleanupPreserveSubdomain).toHaveBeenCalled();
    expect(sessionManager.setPostLogoutGateBeforeRedirect).toHaveBeenCalled();
    expect(redirectToLoginPageOnce).toHaveBeenCalledWith({ search: '?reason=duplicate-login' });
  });
});
