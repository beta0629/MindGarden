/**
 * 만료 로그아웃과 401 리다이렉트의 순서 경합.
 * 어느 쪽이 먼저여도 mg.loginReturnPath 와 redirect 가 남고, 사유는 duplicate-login 이 아니다.
 * 진짜 중복 로그인(만료 호출이 뒤따르지 않는 search)만 reason=duplicate-login 이다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

const { LOGIN_RETURN_URL_PARAM } = require('../../constants/consultationLogAutosaveConstants');
const { DUPLICATE_LOGIN_REDIRECT_SEARCH } = require('../../constants/session');
const { LOGIN_RETURN_PATH_STORAGE_KEY } = require('../loginReturnPath');

const duplicateLoginParams = () => new URLSearchParams(
  DUPLICATE_LOGIN_REDIRECT_SEARCH.charAt(0) === '?'
    ? DUPLICATE_LOGIN_REDIRECT_SEARCH.slice(1)
    : DUPLICATE_LOGIN_REDIRECT_SEARCH
);

const hasDuplicateLoginReason = (params) => {
  const expected = duplicateLoginParams();
  const keys = [...expected.keys()];
  return keys.length > 0 && keys.every((key) => params.get(key) === expected.get(key));
};

const HOST = 'tenant.example.test';
const ORIGIN = `https://${HOST}`;
const TARGET_PATH = '/admin/user-management';
const TARGET_SEARCH = '?type=client&page=2';
const TARGET = `${TARGET_PATH}${TARGET_SEARCH}`;

let originalLocation;

const loadModule = () => {
  jest.resetModules();
  return require('../sessionRedirect');
};

const setLocation = (pathname, search) => {
  delete window.location;
  window.location = {
    hostname: HOST,
    host: HOST,
    protocol: 'https:',
    origin: ORIGIN,
    pathname,
    search,
    hash: '',
    href: `${ORIGIN}${pathname}${search}`
  };
};

const expectReturnKept = () => {
  const url = new URL(window.location.href);
  expect(url.origin).toBe(ORIGIN);
  expect(url.pathname).toBe('/login');
  expect(hasDuplicateLoginReason(url.searchParams)).toBe(false);
  expect(url.searchParams.get(LOGIN_RETURN_URL_PARAM)).toBe(TARGET);
  const stored = JSON.parse(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY));
  expect(stored.path).toBe(TARGET);
};

describe('만료 리다이렉트 순서 경합', () => {
  beforeEach(() => {
    originalLocation = window.location;
    window.sessionStorage.clear();
    setLocation(TARGET_PATH, TARGET_SEARCH);
  });

  afterEach(() => {
    window.location = originalLocation;
    window.sessionStorage.clear();
  });

  test('401 처리가 먼저(duplicate-login search)여도 만료 returnUrl 이 복귀 경로를 남긴다', () => {
    const { redirectToLoginPageOnce } = loadModule();

    redirectToLoginPageOnce({ search: DUPLICATE_LOGIN_REDIRECT_SEARCH });
    redirectToLoginPageOnce({ returnUrl: TARGET });

    expectReturnKept();
  });

  test('redirectToLoginPageOnce 가 먼저여도 뒤의 401 duplicate-login search 가 복귀 경로를 지우지 않는다', () => {
    const { redirectToLoginPageOnce } = loadModule();

    redirectToLoginPageOnce({ returnUrl: TARGET });
    redirectToLoginPageOnce({ search: DUPLICATE_LOGIN_REDIRECT_SEARCH });

    expectReturnKept();
  });

  test('만료로 표시된 401 처리만 있어도 duplicate-login 이 아니고 현재 화면을 남긴다', () => {
    const { redirectToLoginPageOnce } = loadModule();

    expect(redirectToLoginPageOnce({
      search: DUPLICATE_LOGIN_REDIRECT_SEARCH,
      expiry: true
    })).toBe(true);

    expectReturnKept();
  });

  test('뒤따르는 만료 호출이 없는 중복 로그인 search 만 reason=duplicate-login 이다', () => {
    const { redirectToLoginPageOnce } = loadModule();

    redirectToLoginPageOnce({ search: DUPLICATE_LOGIN_REDIRECT_SEARCH });

    const url = new URL(window.location.href);
    expect(url.pathname).toBe('/login');
    expect(hasDuplicateLoginReason(url.searchParams)).toBe(true);
    expect(url.searchParams.get(LOGIN_RETURN_URL_PARAM)).toBeNull();
    expect(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY)).toBeNull();
  });
});
