/**
 * socialLogin.handleOAuthCallback — 콜백 흐름은 그대로 동작하고, OAuth code·state·codeVerifier·토큰·세션 id 는
 * 어떤 콘솔 레벨에도 남지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */

jest.mock('../ajax', () => ({
  __esModule: true,
  authAPI: { logout: jest.fn() }
}));

jest.mock('../common', () => ({
  __esModule: true,
  storage: { set: jest.fn(), get: jest.fn(), remove: jest.fn() },
  sessionStorage: { set: jest.fn(), get: jest.fn(), remove: jest.fn() }
}));

jest.mock('../session', () => ({
  __esModule: true,
  setLoginSession: jest.fn(),
  redirectToDashboard: jest.fn(),
  logSessionInfo: jest.fn(),
  clearSession: jest.fn()
}));

jest.mock('../sessionRedirect', () => ({
  __esModule: true,
  redirectToLoginPageOnce: jest.fn()
}));

jest.mock('../notification', () => ({
  __esModule: true,
  default: { show: jest.fn() }
}));

jest.mock('../apiCache', () => ({
  __esModule: true,
  cachedApiCall: jest.fn(),
  CACHE_CONFIG: { OAUTH2_CONFIG: { ttl: 60_000 } }
}));

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: { t: (key) => key }
}));

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: { post: jest.fn() }
}));

const { sessionStorage: mockedSessionStorage } = require('../common');
const mockedSession = require('../session');
const mockedApi = require('../standardizedApi').default;
const { handleOAuthCallback } = require('../socialLogin');

const CODE = 'fixture-oauth-code';
const STATE = 'fixture-oauth-state';
const CODE_VERIFIER = 'fixture-pkce-verifier';
const ACCESS_TOKEN = 'fixture-access-token';
const REFRESH_TOKEN = 'fixture-refresh-token';
const SESSION_ID = 'fixture-session-id';
const SECRETS = [CODE, STATE, CODE_VERIFIER, ACCESS_TOKEN, REFRESH_TOKEN, SESSION_ID];
const CONSOLE_METHODS = ['log', 'info', 'debug', 'warn', 'error'];

const consoleOutput = (spies) => spies
  .flatMap((spy) => spy.mock.calls)
  .map((args) => args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' '))
  .join('\n');

describe('handleOAuthCallback 민감값 콘솔 미노출', () => {
  let spies;

  beforeEach(() => {
    spies = CONSOLE_METHODS.map((method) => jest.spyOn(console, method).mockImplementation(() => {}));
    mockedSessionStorage.get.mockImplementation((key) => {
      if (key === 'oauth_state') return STATE;
      if (key === 'pkce_code_verifier') return CODE_VERIFIER;
      return null;
    });
    mockedSession.setLoginSession.mockReturnValue(true);
  });

  afterEach(() => {
    spies.forEach((spy) => spy.mockRestore());
  });

  it('로그인 성공: 서버에 code·state·verifier 를 보내고 세션을 세우지만 콘솔에는 남기지 않는다', async() => {
    const userInfo = { id: 7, role: 'CLIENT', sessionId: SESSION_ID };
    mockedApi.post.mockResolvedValue({
      success: true,
      data: { userInfo, accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN, sessionId: SESSION_ID }
    });

    await handleOAuthCallback('KAKAO', CODE, STATE);

    expect(mockedApi.post).toHaveBeenCalledWith(
      expect.any(String),
      { provider: 'KAKAO', code: CODE, state: STATE, codeVerifier: CODE_VERIFIER },
      { unwrapApiEnvelope: false }
    );
    expect(mockedSession.setLoginSession).toHaveBeenCalledWith(userInfo, {
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN
    });
    expect(mockedSession.redirectToDashboard).toHaveBeenCalledWith(userInfo);
    const output = consoleOutput(spies);
    SECRETS.forEach((secret) => expect(output).not.toContain(secret));
  });

  it('간편 회원가입 필요: 회원가입 정보를 돌려주고 code·state·verifier 는 콘솔에 남기지 않는다', async() => {
    mockedApi.post.mockResolvedValue({
      success: false,
      data: { requiresSignup: true, socialUserInfo: { provider: 'KAKAO' } }
    });

    const result = await handleOAuthCallback('KAKAO', CODE, STATE);

    expect(result).toEqual({ requiresSignup: true, socialUserInfo: { provider: 'KAKAO' } });
    const output = consoleOutput(spies);
    SECRETS.forEach((secret) => expect(output).not.toContain(secret));
  });

  it('state 불일치: 서버 호출 없이 거부한다', async() => {
    await expect(handleOAuthCallback('KAKAO', CODE, 'other-state')).rejects.toThrow();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });
});
