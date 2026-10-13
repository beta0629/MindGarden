/**
 * 로그인 후 원래 주소로 돌아가기 — 내부 경로만 허용, 소셜 왕복 보관, 공통 착지점 연동.
 *
 * @author CoreSolution
 * @since 2026-10-13
 */

import {
  LOGIN_RETURN_PATH_STORAGE_KEY,
  LOGIN_RETURN_PATH_TTL_MS,
  consumeLoginReturnPath,
  rememberLoginReturnPathFromUrl,
  sanitizeLoginReturnPath
} from '../loginReturnPath';
import { redirectToDynamicDashboard } from '../dashboardUtils';

jest.mock('../ajax', () => ({ apiGet: jest.fn() }));

const ORIGIN = 'https://tenant.example.test';
let originalLocation;

const setUrl = (pathAndQuery) => {
  const url = new URL(pathAndQuery, ORIGIN);
  window.location = {
    origin: ORIGIN,
    protocol: 'https:',
    host: url.host,
    hostname: url.hostname,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    href: url.href
  };
};

beforeEach(() => {
  originalLocation = window.location;
  delete window.location;
  setUrl('/login');
  window.sessionStorage.clear();
});

afterEach(() => {
  window.location = originalLocation;
  jest.restoreAllMocks();
});

describe('sanitizeLoginReturnPath', () => {
  it.each([
    ['/client/offers', '/client/offers'],
    ['/client/offers?x=1#a', '/client/offers?x=1#a']
  ])('내부 경로 %s 는 통과', (input, expected) => {
    expect(sanitizeLoginReturnPath(input)).toBe(expected);
  });

  it.each([
    'https://evil.example/x',
    '//evil.example/x',
    '/\\evil.example',
    'javascript:alert(1)',
    'data:text/html,x',
    'client/offers',
    '/login',
    '/login?redirect=%2Fclient%2Foffers',
    '/auth/oauth2/callback?code=1',
    '',
    null,
    123
  ])('%p 는 막는다', (input) => {
    expect(sanitizeLoginReturnPath(input)).toBe('');
  });
});

describe('consumeLoginReturnPath', () => {
  it('주소의 ?redirect= 를 쓴다', () => {
    setUrl(`/login?redirect=${encodeURIComponent('/client/offers')}`);
    expect(consumeLoginReturnPath()).toBe('/client/offers');
  });

  it('외부 주소 ?redirect= 는 버린다', () => {
    setUrl(`/login?redirect=${encodeURIComponent('//evil.example')}`);
    expect(consumeLoginReturnPath()).toBe('');
  });

  it('소셜 로그인 왕복: 떠날 때 맡기고 콜백에서 한 번만 꺼낸다', () => {
    setUrl(`/login?redirect=${encodeURIComponent('/client/offers')}`);
    rememberLoginReturnPathFromUrl();
    setUrl('/auth/oauth2/callback?code=abc');
    expect(consumeLoginReturnPath()).toBe('/client/offers');
    expect(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY)).toBeNull();
    expect(consumeLoginReturnPath()).toBe('');
  });

  it('맡긴 값이 유효 시간을 넘으면 쓰지 않는다', () => {
    window.sessionStorage.setItem(LOGIN_RETURN_PATH_STORAGE_KEY,
      JSON.stringify({ path: '/client/offers', savedAt: Date.now() - LOGIN_RETURN_PATH_TTL_MS - 1 }));
    setUrl('/auth/oauth2/callback');
    expect(consumeLoginReturnPath()).toBe('');
  });

  it('저장소에 직접 넣은 외부 주소도 막는다', () => {
    window.sessionStorage.setItem(LOGIN_RETURN_PATH_STORAGE_KEY,
      JSON.stringify({ path: 'https://evil.example', savedAt: Date.now() }));
    setUrl('/auth/oauth2/callback');
    expect(consumeLoginReturnPath()).toBe('');
  });

  it('redirect 없이 떠나면 이전에 맡긴 값을 지운다', () => {
    window.sessionStorage.setItem(LOGIN_RETURN_PATH_STORAGE_KEY,
      JSON.stringify({ path: '/client/offers', savedAt: Date.now() }));
    setUrl('/login');
    rememberLoginReturnPathFromUrl();
    expect(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY)).toBeNull();
  });
});

describe('redirectToDynamicDashboard — 원래 주소 복귀', () => {
  it('?redirect= 가 있으면 역할 대시보드 대신 그 주소로 간다', async() => {
    setUrl(`/login?redirect=${encodeURIComponent('/client/offers')}`);
    const navigate = jest.fn();
    await redirectToDynamicDashboard({ user: { role: 'CLIENT' } }, navigate);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/client/offers', { replace: true });
  });

  it('외부 주소면 기존대로 역할 대시보드로 간다', async() => {
    setUrl(`/login?redirect=${encodeURIComponent('https://evil.example')}`);
    const navigate = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await redirectToDynamicDashboard({ user: { role: 'CLIENT' } }, navigate);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0]).not.toContain('evil');
  });
});
