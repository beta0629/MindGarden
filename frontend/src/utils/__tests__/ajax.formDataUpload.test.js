/**
 * @jest-environment jsdom
 *
 * FormData 업로드(apiPostFormData · apiUpload) — Content-Type 미강제, Bearer 부착, 비-OK 시 throw.
 * 네트워크(fetch)만 가짜. 비-localhost 호스트에서 확인한다.
 *
 * @author CoreSolution
 * @since 2026-10-20
 */

const HOST = 'tenant.example.test';
const ORIGIN = `https://${HOST}`;
const PAGE = '/admin/dashboard';
const TARGET = '/api/v1/test/upload';
const ACCESS_TOKEN = 'test-access-token-formdata';

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

const loadAjax = () => {
  jest.resetModules();
  return require('../ajax');
};

const targetCalls = () => fetchMock.mock.calls.filter(([url]) => String(url).includes(TARGET));

const headerKeysLower = (headers) => Object.keys(headers || {}).map((k) => k.toLowerCase());

const makeFormData = () => {
  const formData = new FormData();
  formData.append('file', new Blob(['upload-bytes']), 'sample.bin');
  return formData;
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
  localStorage.setItem('accessToken', ACCESS_TOKEN);
  targetResponses = [jsonResponse(200, { success: true, data: { id: 1 } })];
  originalFetch = global.fetch;
  fetchMock = jest.fn(async(url) => {
    const u = String(url);
    if (u.includes('/api/v1/auth/csrf-token')) {
      return jsonResponse(200, { success: true, data: { token: 'csrf-test' } });
    }
    if (u.includes(TARGET)) {
      return targetResponses.shift() || jsonResponse(200, { success: true });
    }
    if (u.includes('/api/v1/auth/refresh-token')) {
      return jsonResponse(401, { success: false });
    }
    if (u.includes('/api/v1/auth/current-user')) {
      return jsonResponse(200, { success: true });
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

describe('ajax FormData / upload', () => {
  test.each([
    ['apiPostFormData', (ajax, formData) => ajax.apiPostFormData(TARGET, formData)],
    ['apiUpload', (ajax, formData) => ajax.apiUpload(TARGET, formData)]
  ])('%s 는 Content-Type 을 넣지 않고 Bearer·FormData·credentials 를 붙인다', async(_name, call) => {
    const ajax = loadAjax();
    const formData = makeFormData();

    const result = await call(ajax, formData);

    expect(result).toEqual({ success: true, data: { id: 1 } });
    const calls = targetCalls();
    expect(calls.length).toBeGreaterThanOrEqual(1);
    const [, init] = calls[0];
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.credentials).toBe('include');
    expect(init.method).toBe('POST');
    expect(headerKeysLower(init.headers)).not.toContain('content-type');
    expect(init.headers.Authorization || init.headers.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
  });

  test.each([
    { name: 'apiPostFormData', status: 400, call: (ajax, formData) => ajax.apiPostFormData(TARGET, formData) },
    { name: 'apiUpload', status: 400, call: (ajax, formData) => ajax.apiUpload(TARGET, formData) },
    { name: 'apiPostFormData', status: 500, call: (ajax, formData) => ajax.apiPostFormData(TARGET, formData) },
    { name: 'apiUpload', status: 500, call: (ajax, formData) => ajax.apiUpload(TARGET, formData) }
  ])('$name 는 HTTP $status 응답에서 던진다', async({ status, call }) => {
    targetResponses = [jsonResponse(status, { success: false, message: `upload failed ${status}` })];
    const ajax = loadAjax();
    const formData = makeFormData();

    const error = await call(ajax, formData).then(() => null, (caught) => caught);

    expect(error).not.toBeNull();
    expect(error.status).toBe(status);
    expect(window.location.href).toBe(`${ORIGIN}${PAGE}`);
  });
});
