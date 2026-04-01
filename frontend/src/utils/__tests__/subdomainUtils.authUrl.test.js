/**
 * 테넌트 인증 base URL·접미사 매칭 — sessionManager 로그아웃 리다이렉트와 정합
 */
import {
  buildTenantAuthBaseUrl,
  getMatchedSubdomainSuffixFromHostname,
  SUBDOMAIN_SUFFIXES
} from '../subdomainUtils';

describe('getMatchedSubdomainSuffixFromHostname', () => {
  it('빈 값·null은 undefined', () => {
    expect(getMatchedSubdomainSuffixFromHostname('')).toBeUndefined();
    expect(getMatchedSubdomainSuffixFromHostname(null)).toBeUndefined();
  });

  it('dev 접미사로 끝나면 해당 접미사 반환', () => {
    expect(getMatchedSubdomainSuffixFromHostname('mindgarden.dev.core-solution.co.kr')).toBe(
      '.dev.core-solution.co.kr'
    );
  });

  it('운영 접미사로 끝나면 해당 접미사 반환', () => {
    expect(getMatchedSubdomainSuffixFromHostname('mindgarden.core-solution.co.kr')).toBe(
      '.core-solution.co.kr'
    );
  });

  it('매칭 없으면 undefined', () => {
    expect(getMatchedSubdomainSuffixFromHostname('localhost')).toBeUndefined();
  });

  it('호스트에 포트가 붙어도 포트 제거 후 매칭', () => {
    expect(getMatchedSubdomainSuffixFromHostname('x.dev.core-solution.co.kr:3000')).toBe(
      '.dev.core-solution.co.kr'
    );
  });
});

describe('buildTenantAuthBaseUrl', () => {
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(globalThis.window, 'location');

  function setMockLocationFromHref(href) {
    const url = new URL(href);
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ancestorOrigins: [],
        href: url.href,
        origin: url.origin,
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
        toString: () => url.href
      }
    });
  }

  afterEach(() => {
    if (originalLocationDescriptor) {
      Object.defineProperty(globalThis.window, 'location', originalLocationDescriptor);
    }
  });

  it('tenantSubdomain이 비어 있으면 null', () => {
    setMockLocationFromHref('https://a.dev.core-solution.co.kr/');
    expect(buildTenantAuthBaseUrl('')).toBeNull();
    expect(buildTenantAuthBaseUrl(null)).toBeNull();
  });

  it('location 이 없으면 null (SSR 등)', () => {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      writable: true,
      value: undefined
    });
    expect(buildTenantAuthBaseUrl('mindgarden')).toBeNull();
  });

  it('dev 패턴 호스트면 dev 접미사·프로토콜·포트 유지', () => {
    setMockLocationFromHref('http://app.dev.core-solution.co.kr:5173/path');
    expect(buildTenantAuthBaseUrl('t1')).toBe('http://t1.dev.core-solution.co.kr:5173');
  });

  it('운영 패턴 호스트면 운영 접미사 사용', () => {
    setMockLocationFromHref('https://mindgarden.core-solution.co.kr/login');
    expect(buildTenantAuthBaseUrl('other')).toBe('https://other.core-solution.co.kr');
  });

  it('접미사 불일치 호스트는 SUBDOMAIN_SUFFIXES 마지막 항목으로 폴백', () => {
    setMockLocationFromHref('https://example.com:8443/');
    const fallback = SUBDOMAIN_SUFFIXES.at(-1);
    expect(buildTenantAuthBaseUrl('tenant')).toBe(`https://tenant${fallback}:8443`);
  });
});
