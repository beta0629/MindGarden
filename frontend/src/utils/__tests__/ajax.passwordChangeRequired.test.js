/**
 * 자격 증명 변경 403 은 메서드와 상관없이 비밀번호 변경 모달 이벤트를 한 번 연다.
 * 네트워크(fetch)만 가짜. 비-localhost 호스트에서 세션이 살아 있으면 로그인으로 보내지 않는다.
 *
 * @author CoreSolution
 * @since 2026-10-20
 */
import { PASSWORD_CHANGE_REQUIRED_CODE, PASSWORD_CHANGE_REQUIRED_EVENT } from '../../constants/passwordChangeRequired';

const HOST = 'tenant.example.test';
const ORIGIN = `https://${HOST}`;
const PAGE = '/admin/dashboard';
const TARGET = '/api/v1/test/resource';

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => (String(name).toLowerCase() === 'content-type' ? 'application/json' : null) },
  json: async() => body,
  text: async() => JSON.stringify(body)
});

const credentialChangeBody = () => ({
  success: false,
  errorCode: PASSWORD_CHANGE_REQUIRED_CODE,
  message: PASSWORD_CHANGE_REQUIRED_CODE
});

let originalLocation;
let originalFetch;
let fetchMock;
let targetResponses;
let currentUserStatus;
let credentialEventCount;

const loadAjax = () => {
  jest.resetModules();
  return require('../ajax');
};

const onCredentialEvent = () => {
  credentialEventCount += 1;
};

beforeEach(() => {
  originalLocation = window.location;
  delete window.location;
  window.location = {
    hostname: HOST,
    host: HOST,
    protocol: 'https:',
    origin: ORIGIN,
    pathname: PAGE,
    search: '',
    hash: '',
    href: `${ORIGIN}${PAGE}`,
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn()
  };
  localStorage.clear();
  sessionStorage.clear();
  targetResponses = [];
  currentUserStatus = 200;
  credentialEventCount = 0;
  window.addEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, onCredentialEvent);
  originalFetch = global.fetch;
  fetchMock = jest.fn(async(url) => {
    const u = String(url);
    if (u.includes('/api/v1/auth/csrf-token')) {
      return jsonResponse(200, { success: true, data: { token: 'csrf-test' } });
    }
    if (u.includes(TARGET)) {
      return targetResponses.shift() || jsonResponse(403, credentialChangeBody());
    }
    if (u.includes('/api/v1/auth/refresh-token')) {
      return jsonResponse(401, { success: false });
    }
    if (u.includes('/api/v1/auth/current-user')) {
      return jsonResponse(currentUserStatus, { success: currentUserStatus === 200 });
    }
    return jsonResponse(404, {});
  });
  global.fetch = fetchMock;
});

afterEach(() => {
  window.removeEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, onCredentialEvent);
  global.fetch = originalFetch;
  window.location = originalLocation;
  localStorage.clear();
  sessionStorage.clear();
});

describe('ajax 자격 증명 변경 403', () => {
  test.each([
    ['apiPost', (ajax) => ajax.apiPost(TARGET, { a: 1 })],
    ['apiPut', (ajax) => ajax.apiPut(TARGET, { a: 1 })],
    ['apiPatch', (ajax) => ajax.apiPatch(TARGET, { a: 1 })],
    ['apiDelete', (ajax) => ajax.apiDelete(TARGET)]
  ])('%s 는 이벤트를 한 번 보내고 403 을 던지며 로그인으로 이동하지 않는다', async(_name, call) => {
    targetResponses = [jsonResponse(403, credentialChangeBody())];
    const ajax = loadAjax();

    const error = await call(ajax).then(() => null, (caught) => caught);

    expect(error).not.toBeNull();
    expect(error.status).toBe(403);
    expect(error.response.data.errorCode).toBe(PASSWORD_CHANGE_REQUIRED_CODE);
    expect(credentialEventCount).toBe(1);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
  });

  test('apiGet 은 이벤트를 한 번만 보낸다', async() => {
    targetResponses = [jsonResponse(403, credentialChangeBody())];
    const ajax = loadAjax();

    const error = await ajax.apiGet(TARGET).then(() => null, (caught) => caught);

    expect(error).not.toBeNull();
    expect(error.status).toBe(403);
    expect(credentialEventCount).toBe(1);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
  });

  test('다른 errorCode 의 403 은 이벤트를 보내지 않는다', async() => {
    targetResponses = [jsonResponse(403, { success: false, message: '권한 없음', errorCode: 'ACCESS_DENIED' })];
    const ajax = loadAjax();

    const error = await ajax.apiPost(TARGET, { a: 1 }).then(() => null, (caught) => caught);

    expect(error).not.toBeNull();
    expect(error.status).toBe(403);
    expect(credentialEventCount).toBe(0);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
  });

  test('401 은 이벤트를 보내지 않고 기존처럼 로그인으로 보낸다', async() => {
    currentUserStatus = 401;
    targetResponses = [jsonResponse(401, { success: false })];
    const ajax = loadAjax();

    const result = await ajax.apiPost(TARGET, { a: 1 });

    expect(result).toBeNull();
    expect(credentialEventCount).toBe(0);
    expect(window.location.href).toBe(`${ORIGIN}/login?redirect=${encodeURIComponent(PAGE)}`);
  });
});
