/**
 * 공용 요청 모듈 401 opt-in({@code throwOnUnauthorized}) — 실제 ajax·csrfTokenManager·sessionRedirect 경로.
 * 네트워크(fetch)만 가짜. 비-localhost 호스트(운영과 같은 분기)에서 확인한다.
 *
 * <ul>
 *   <li>옵션 없음(다른 모든 화면): 기존과 같이 세션 재확인 후 /login 이동 + null 반환.</li>
 *   <li>옵션 있음: 이동하지 않고 구분 가능한 오류(status 401·code AUTH_REQUIRED)를 던진다.</li>
 *   <li>refresh 가 성공하면 옵션이 있어도 원 요청을 재시도한다(옵션이 refresh 를 건너뛰지 않음).</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
import { FETCH_INIT_SKIP_FORM_SESSION_HOOK } from '../../constants/session';

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

let originalLocation;
let originalFetch;
let fetchMock;
let targetResponses;
let currentUserStatus;

const loadAjax = () => {
  jest.resetModules();
  return {
    ajax: require('../ajax'),
    StandardizedApi: require('../standardizedApi').default
  };
};

const targetCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes(TARGET));

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
  currentUserStatus = 401;
  originalFetch = global.fetch;
  fetchMock = jest.fn(async(url) => {
    const u = String(url);
    if (u.includes('/api/v1/auth/csrf-token')) {
      return jsonResponse(200, { success: true, data: { token: 'csrf-test' } });
    }
    if (u.includes(TARGET)) {
      return targetResponses.shift() || jsonResponse(401, { success: false });
    }
    if (u.includes('/api/v1/auth/refresh-token')) {
      return jsonResponse(200, { success: true, data: { accessToken: 'a2', refreshToken: 'r2' } });
    }
    if (u.includes('/api/v1/auth/current-user')) {
      return jsonResponse(currentUserStatus, { success: currentUserStatus === 200 });
    }
    return jsonResponse(404, {});
  });
  global.fetch = fetchMock;
});

afterEach(() => {
  global.fetch = originalFetch;
  window.location = originalLocation;
  localStorage.clear();
  sessionStorage.clear();
});

describe('ajax throwOnUnauthorized (공용 요청 모듈 401 opt-in)', () => {
  test('옵션 없음: 다른 화면의 apiPut 401 은 기존처럼 /login 으로 보내고 null 을 돌려준다', async() => {
    const { ajax } = loadAjax();

    const result = await ajax.apiPut(TARGET, { a: 1 });

    expect(result).toBeNull();
    expect(window.location.href).toBe(`${ORIGIN}/login`);
  });

  test.each([
    ['apiGet', (ajax) => ajax.apiGet(TARGET, {}, { throwOnUnauthorized: true })],
    ['apiPost', (ajax) => ajax.apiPost(TARGET, { a: 1 }, { throwOnUnauthorized: true })],
    ['apiPut', (ajax) => ajax.apiPut(TARGET, { a: 1 }, { throwOnUnauthorized: true })],
    ['apiPatch', (ajax) => ajax.apiPatch(TARGET, { a: 1 }, { throwOnUnauthorized: true })],
    ['apiDelete', (ajax) => ajax.apiDelete(TARGET, { throwOnUnauthorized: true })]
  ])('옵션 있음: %s 401 은 이동하지 않고 구분 가능한 오류를 던진다', async(_name, call) => {
    const { ajax } = loadAjax();

    const error = await call(ajax).then(() => null, (e) => e);

    expect(error).not.toBeNull();
    expect(ajax.isAuthRequiredError(error)).toBe(true);
    expect(error.status).toBe(401);
    expect(error.code).toBe(ajax.AJAX_AUTH_REQUIRED_CODE);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/v1/auth/current-user'))).toBe(false);
  });

  test('옵션 있음: 변경 요청 fetch init 에 폼 제출 훅 제외 표식이 붙고, 옵션 키 자체는 fetch 로 새지 않는다', async() => {
    const { ajax } = loadAjax();

    await ajax.apiPut(TARGET, { a: 1 }, { throwOnUnauthorized: true }).catch(() => null);

    const [, init] = targetCalls()[0];
    expect(init[FETCH_INIT_SKIP_FORM_SESSION_HOOK]).toBe(true);
    expect(init.throwOnUnauthorized).toBeUndefined();
  });

  test('옵션 없음: 변경 요청에는 표식이 없다(폼 제출 훅 동작 유지)', async() => {
    const { ajax } = loadAjax();

    await ajax.apiPut(TARGET, { a: 1 });

    const [, init] = targetCalls()[0];
    expect(init[FETCH_INIT_SKIP_FORM_SESSION_HOOK]).toBeUndefined();
  });

  test('옵션 있음이어도 refresh 가 성공하면 원 요청을 1회 재시도해 결과를 돌려준다', async() => {
    localStorage.setItem('refreshToken', 'r1');
    targetResponses = [
      jsonResponse(401, { success: false }),
      jsonResponse(200, { success: true, data: { version: 3 } })
    ];
    const { ajax } = loadAjax();

    const result = await ajax.apiPut(TARGET, { a: 1 }, { throwOnUnauthorized: true });

    expect(result).toEqual({ version: 3 });
    expect(targetCalls()).toHaveLength(2);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
  });

  test('반례: 세션이 살아 있는 403(권한 부족)은 옵션이 있어도 401 로 분류하지 않고 이동하지 않는다', async() => {
    currentUserStatus = 200;
    targetResponses = [jsonResponse(403, { success: false, message: '권한 없음' })];
    const { ajax } = loadAjax();

    const error = await ajax.apiPut(TARGET, { a: 1 }, { throwOnUnauthorized: true }).then(() => null, (e) => e);

    expect(error).not.toBeNull();
    expect(ajax.isAuthRequiredError(error)).toBe(false);
    expect(error.status).toBe(403);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
  });

  test('반례: 세션이 끊긴 403 은 옵션이 있으면 이동하지 않고 인증 만료 오류로 던진다(보관 백업 기회 보장)', async() => {
    targetResponses = [jsonResponse(403, { success: false })];
    const { ajax } = loadAjax();

    const error = await ajax.apiPut(TARGET, { a: 1 }, { throwOnUnauthorized: true }).then(() => null, (e) => e);

    expect(ajax.isAuthRequiredError(error)).toBe(true);
    expect(error.status).toBe(401);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
  });

  test('옵션 없음: 세션이 끊긴 403 은 기존처럼 /login 으로 보내고 null 을 돌려준다', async() => {
    targetResponses = [jsonResponse(403, { success: false })];
    const { ajax } = loadAjax();

    const result = await ajax.apiPut(TARGET, { a: 1 });

    expect(result).toBeNull();
    expect(window.location.href).toBe(`${ORIGIN}/login`);
  });

  test('StandardizedApi 를 거쳐도 401 구분 표식(authRequired·code)이 유지된다', async() => {
    const { ajax, StandardizedApi } = loadAjax();

    const error = await StandardizedApi.put(TARGET, { a: 1 }, { throwOnUnauthorized: true })
      .then(() => null, (e) => e);

    expect(ajax.isAuthRequiredError(error)).toBe(true);
    expect(error.status).toBe(401);
    expect(error.code).toBe(ajax.AJAX_AUTH_REQUIRED_CODE);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
  });
});
