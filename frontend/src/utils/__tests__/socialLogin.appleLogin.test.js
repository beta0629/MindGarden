/**
 * socialLogin.appleLogin — server-side auth-code 흐름 단위 테스트 (Google PR #204 패턴, 2026-06-11).
 *
 * <p>Apple JS SDK `usePopup=true` + `web_message` 흐름이 멀티테넌트 와일드카드 환경에서
 * popup parent origin 과 redirect_uri origin 동일성 강제로 거절되어, 카카오/네이버/Google 와
 * 동일한 BE authorize URL 호출 + 전체 페이지 redirect 패턴으로 전환됐다. 본 테스트는 fetch 를
 * mock 하여 BE 응답 분기별 동작(정상 redirect / 응답 오류 / 서브도메인 가드)을 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
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
  cachedApiCall: jest.fn().mockResolvedValue({ apple: { clientId: 'fake' } }),
  CACHE_CONFIG: { OAUTH2_CONFIG: { ttl: 60_000 } }
}));

jest.mock('../../i18n', () => ({
  __esModule: true,
  default: {
    t: (key) => key
  }
}));

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: { post: jest.fn() }
}));

const { sessionStorage: mockedSessionStorage } = require('../common');
const mockedNotification = require('../notification').default;
const { appleLogin } = require('../socialLogin');

describe('appleLogin — server-side auth-code 흐름 (Google PR #204 패턴)', () => {
  let originalLocation;
  let originalFetch;

  beforeEach(() => {
    mockedSessionStorage.set.mockClear();
    mockedNotification.show.mockClear();

    originalLocation = window.location;
    delete window.location;
    window.location = {
      hostname: 'mindgarden.core-solution.co.kr',
      href: 'https://mindgarden.core-solution.co.kr/login'
    };

    originalFetch = global.fetch;
  });

  afterEach(() => {
    window.location = originalLocation;
    global.fetch = originalFetch;
  });

  test('BE authorize 응답의 authUrl 로 window.location.href 가 설정되고 state 가 저장된다.', async () => {
    const authUrl = 'https://appleid.apple.com/auth/authorize?client_id=co.kr.coresolution.app.signin'
      + '&state=tenant-encoded.nonce&response_mode=form_post';
    const stateValue = 'tenant-encoded.nonce';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          authUrl,
          state: stateValue,
          nonce: 'apple-nonce-1',
          provider: 'APPLE'
        }
      })
    });

    await appleLogin();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = global.fetch.mock.calls[0];
    expect(calledUrl).toMatch(/\/api\/v1\/auth\/oauth2\/apple\/authorize$/);
    expect(calledOptions.credentials).toBe('include');
    expect(calledOptions.headers.Accept).toBe('application/json');

    expect(mockedSessionStorage.set).toHaveBeenCalledWith('oauth_state', stateValue);
    expect(window.location.href).toBe(authUrl);
  });

  test('default 서브도메인(`www.*`)에서는 BE 호출 없이 친화 메시지를 표시한다.', async () => {
    window.location.hostname = 'www.core-solution.co.kr';
    global.fetch = jest.fn();

    await appleLogin();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockedNotification.show).toHaveBeenCalled();
  });

  test('localhost 환경에서는 서브도메인 가드를 스킵하고 BE 호출 진행.', async () => {
    window.location.hostname = 'localhost';
    const authUrl = 'https://appleid.apple.com/auth/authorize?client_id=local';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { authUrl, state: 'local-state', nonce: 'local-nonce', provider: 'APPLE' }
      })
    });

    await appleLogin();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(authUrl);
  });

  test('BE 가 비정상(success=false 또는 authUrl 누락) 응답을 주면 redirect 하지 않는다.', async () => {
    const initialHref = window.location.href;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: false, message: '인증 URL 생성 실패' })
    });

    await appleLogin();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(initialHref);
    expect(mockedNotification.show).toHaveBeenCalled();
  });

  test('BE 가 4xx 응답을 주면 친화 메시지를 표시하고 redirect 하지 않는다.', async () => {
    const initialHref = window.location.href;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: '테넌트 정보가 없습니다. 반드시 서브도메인으로 접속 후 소셜 로그인을 진행해주세요.' })
    });

    await appleLogin();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(initialHref);
    expect(mockedNotification.show).toHaveBeenCalled();
  });
});
