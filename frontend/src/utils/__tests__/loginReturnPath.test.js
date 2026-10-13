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
  isReturnPathAllowedForPrefixes,
  rememberLoginReturnPathFromUrl,
  sanitizeLoginReturnPath
} from '../loginReturnPath';
import { redirectToDynamicDashboard, resolveLoginReturnAllowedPrefixes } from '../dashboardUtils';

const CLIENT = ['/client/'];

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

describe('sanitizeLoginReturnPath — 반례', () => {
  it.each([
    ['/client/offers', '/client/offers'],
    ['/client/offers?tab=1', '/client/offers?tab=1']
  ])('내부 경로 %s 는 통과', (input, expected) => {
    expect(sanitizeLoginReturnPath(input)).toBe(expected);
  });

  it.each([
    ['외부 URL', 'https://evil.com'],
    ['프로토콜 상대', '//evil.com'],
    ['슬래시+백슬래시', '/\\evil.com'],
    ['백슬래시 주소', '\\\\evil.com'],
    ['경로 중 백슬래시', '/client\\..\\admin'],
    ['인코딩 %2F%2F', '%2F%2Fevil.com'],
    ['경로 안 인코딩 %2F%2F', '/%2F%2Fevil.com'],
    ['이중 인코딩', '/%252F%252Fevil.com'],
    ['인코딩 백슬래시', '/%5Cevil.com'],
    ['javascript:', 'javascript:alert(1)'],
    ['인코딩 javascript:', 'javascript%3Aalert(1)'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['상대 경로', 'client/offers'],
    ['상위 이동', '/client/../admin/dashboard'],
    ['로그인(무한 반복)', '/login'],
    ['로그인+redirect(무한 반복)', '/login?redirect=%2Flogin'],
    ['로그아웃(무한 반복)', '/logout'],
    ['OAuth 콜백', '/auth/oauth2/callback?code=1'],
    ['빈 값', ''],
    ['문자열 아님', null]
  ])('%s(%p) 는 막는다', (_label, input) => {
    expect(sanitizeLoginReturnPath(input)).toBe('');
  });

  it('토큰·개인정보 쿼리와 해시는 버리고 경로만 남긴다', () => {
    expect(sanitizeLoginReturnPath('/client/offers?token=abc&access_token=x&code=1&state=s&email=a@b.c&phone=010&tab=2#id_token=z'))
      .toBe('/client/offers?tab=2');
  });
});

describe('역할 허용 목록', () => {
  it('내담자는 /client/ 아래만', () => {
    expect(isReturnPathAllowedForPrefixes('/client/offers', CLIENT)).toBe(true);
    expect(isReturnPathAllowedForPrefixes('/admin/dashboard', CLIENT)).toBe(false);
    expect(isReturnPathAllowedForPrefixes('/clientx/a', CLIENT)).toBe(false);
    expect(isReturnPathAllowedForPrefixes('/client/offers', [])).toBe(false);
  });

  it('역할별 접근 구역 SSOT를 허용 접두로 쓴다', () => {
    expect(resolveLoginReturnAllowedPrefixes({ role: 'CLIENT' })).toEqual(['/client/']);
    expect(resolveLoginReturnAllowedPrefixes({ role: 'ADMIN' })).toEqual(['/admin/', '/erp/']);
    expect(resolveLoginReturnAllowedPrefixes({ role: 'STAFF' })).toEqual(['/admin/']);
    expect(resolveLoginReturnAllowedPrefixes({ role: 'CONSULTANT' })).toEqual(['/consultant/']);
    expect(resolveLoginReturnAllowedPrefixes(null)).toEqual([]);
  });

  it('ADMIN 은 /erp/dashboard?month= 복귀를 허용하고 STAFF 는 /erp/ 를 거부', () => {
    const adminPrefixes = resolveLoginReturnAllowedPrefixes({ role: 'ADMIN' });
    const staffPrefixes = resolveLoginReturnAllowedPrefixes({ role: 'STAFF' });
    expect(isReturnPathAllowedForPrefixes('/erp/dashboard?month=2026-09', adminPrefixes)).toBe(true);
    expect(isReturnPathAllowedForPrefixes('/erp/dashboard?month=2026-09', staffPrefixes)).toBe(false);
    expect(isReturnPathAllowedForPrefixes('/admin/dashboard', staffPrefixes)).toBe(true);
  });

  it('HQ_ADMIN 등 관리자 계열도 /erp/ 복귀 허용', () => {
    const prefixes = resolveLoginReturnAllowedPrefixes({ role: 'HQ_ADMIN' });
    expect(prefixes).toEqual(['/admin/', '/erp/']);
    expect(isReturnPathAllowedForPrefixes('/erp/financial', prefixes)).toBe(true);
  });
});

describe('consumeLoginReturnPath', () => {
  it('주소의 ?redirect= 를 쓴다', () => {
    setUrl(`/login?redirect=${encodeURIComponent('/client/offers')}`);
    expect(consumeLoginReturnPath(CLIENT)).toBe('/client/offers');
  });

  it('외부 주소 ?redirect= 는 버린다', () => {
    setUrl(`/login?redirect=${encodeURIComponent('//evil.com')}`);
    expect(consumeLoginReturnPath(CLIENT)).toBe('');
  });

  it('소셜 왕복: 저장소에는 토큰을 뺀 경로만 남고, 한 번 쓰면 지운다', () => {
    setUrl(`/login?redirect=${encodeURIComponent('/client/offers?token=secret&tab=1')}`);
    rememberLoginReturnPathFromUrl();
    const stored = JSON.parse(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY));
    expect(stored.path).toBe('/client/offers?tab=1');
    expect(JSON.stringify(stored)).not.toContain('secret');
    setUrl('/auth/oauth2/callback?code=abc');
    expect(consumeLoginReturnPath(CLIENT)).toBe('/client/offers?tab=1');
    expect(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY)).toBeNull();
    expect(consumeLoginReturnPath(CLIENT)).toBe('');
  });

  it('허용 밖이어도 맡긴 값은 지운다', () => {
    window.sessionStorage.setItem(LOGIN_RETURN_PATH_STORAGE_KEY,
      JSON.stringify({ path: '/admin/dashboard', savedAt: Date.now() }));
    setUrl('/auth/oauth2/callback');
    expect(consumeLoginReturnPath(CLIENT)).toBe('');
    expect(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY)).toBeNull();
  });

  it('맡긴 값이 유효 시간을 넘으면 쓰지 않는다', () => {
    window.sessionStorage.setItem(LOGIN_RETURN_PATH_STORAGE_KEY,
      JSON.stringify({ path: '/client/offers', savedAt: Date.now() - LOGIN_RETURN_PATH_TTL_MS - 1 }));
    setUrl('/auth/oauth2/callback');
    expect(consumeLoginReturnPath(CLIENT)).toBe('');
  });

  it('저장소에 직접 넣은 외부 주소도 막는다', () => {
    window.sessionStorage.setItem(LOGIN_RETURN_PATH_STORAGE_KEY,
      JSON.stringify({ path: 'https://evil.com', savedAt: Date.now() }));
    setUrl('/auth/oauth2/callback');
    expect(consumeLoginReturnPath(CLIENT)).toBe('');
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

  it('ADMIN 이 /erp/dashboard?month=2026-09 로 복귀한다', async() => {
    setUrl(`/login?redirect=${encodeURIComponent('/erp/dashboard?month=2026-09')}`);
    const navigate = jest.fn();
    await redirectToDynamicDashboard({ user: { role: 'ADMIN' } }, navigate);
    expect(navigate).toHaveBeenCalledWith('/erp/dashboard?month=2026-09', { replace: true });
  });

  it('STAFF 가 /erp/ 로 가려 하면 역할 기본 화면으로 간다', async() => {
    setUrl(`/login?redirect=${encodeURIComponent('/erp/dashboard?month=2026-09')}`);
    const navigate = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await redirectToDynamicDashboard({ user: { role: 'STAFF' } }, navigate);
    expect(navigate).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
  });

  it('내담자가 /admin 으로 가려 하면 역할 기본 화면으로 간다', async() => {
    setUrl(`/login?redirect=${encodeURIComponent('/admin/dashboard')}`);
    const navigate = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await redirectToDynamicDashboard({ user: { role: 'CLIENT' } }, navigate);
    expect(navigate).toHaveBeenCalledWith('/client/dashboard', { replace: true });
  });

  it('외부 주소·프로토콜 상대(//) 는 역할 대시보드로 간다', async() => {
    setUrl(`/login?redirect=${encodeURIComponent('https://evil.example')}`);
    const navigate = jest.fn();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await redirectToDynamicDashboard({ user: { role: 'CLIENT' } }, navigate);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0]).not.toContain('evil');

    setUrl(`/login?redirect=${encodeURIComponent('//evil.com/phish')}`);
    const navigate2 = jest.fn();
    await redirectToDynamicDashboard({ user: { role: 'ADMIN' } }, navigate2);
    expect(navigate2).toHaveBeenCalledWith('/admin/dashboard', { replace: true });
  });

  it('소셜 remember+consume: ADMIN /erp/ 복귀가 동일 허용 접두로 통과', async() => {
    setUrl(`/login?redirect=${encodeURIComponent('/erp/dashboard?month=2026-09')}`);
    rememberLoginReturnPathFromUrl();
    setUrl('/auth/oauth2/callback?code=abc');
    const navigate = jest.fn();
    await redirectToDynamicDashboard({ user: { role: 'ADMIN' } }, navigate);
    expect(navigate).toHaveBeenCalledWith('/erp/dashboard?month=2026-09', { replace: true });
    expect(window.sessionStorage.getItem(LOGIN_RETURN_PATH_STORAGE_KEY)).toBeNull();
  });
});
