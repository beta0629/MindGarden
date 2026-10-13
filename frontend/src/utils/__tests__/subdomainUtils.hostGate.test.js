/**
 * Host gate SSOT — extractTenantSubdomainFromHostname 호스트 매트릭스
 * TenantContextFilter · OAuth2DomainUtil 접미사 순서와 동기
 *
 * @author CoreSolution
 * @since 2026-09-09
 */

import {
  DEFAULT_SUBDOMAINS,
  SUBDOMAIN_SUFFIXES,
  buildTenantAuthBaseUrl,
  extractTenantSubdomainFromHostname,
  getMatchedSubdomainSuffixFromHostname,
  getTenantSubdomainFromHost
} from '../subdomainUtils';

describe('SUBDOMAIN_SUFFIXES SSOT', () => {
  it('긴 접미사가 앞선다 (dev → staging → prod)', () => {
    expect(SUBDOMAIN_SUFFIXES).toEqual([
      '.dev.core-solution.co.kr',
      '.staging.core-solution.co.kr',
      '.core-solution.co.kr'
    ]);
  });

  it('DEFAULT_SUBDOMAINS 는 TenantContextFilter 예약 라벨과 동기', () => {
    expect(DEFAULT_SUBDOMAINS).toEqual(['dev', 'app', 'api', 'staging', 'www']);
  });
});

describe('extractTenantSubdomainFromHostname', () => {
  it.each([
    ['mindgarden.dev.core-solution.co.kr', 'mindgarden'],
    ['mindgarden.core-solution.co.kr', 'mindgarden'],
    ['mindgarden.staging.core-solution.co.kr', 'mindgarden'],
    ['MindGarden.DEV.core-solution.co.kr', 'mindgarden'],
    ['mindgarden.dev.core-solution.co.kr:443', 'mindgarden'],
    ['mindgarden.staging.core-solution.co.kr:8443', 'mindgarden']
  ])('%s → %s', (hostname, expected) => {
    expect(extractTenantSubdomainFromHostname(hostname)).toBe(expected);
  });

  it.each([
    ['dev.core-solution.co.kr'],
    ['www.core-solution.co.kr'],
    ['api.dev.core-solution.co.kr'],
    ['staging.core-solution.co.kr'],
    ['staging.staging.core-solution.co.kr'],
    ['core-solution.co.kr'],
    ['apply.e-trinity.co.kr'],
    ['dev.e-trinity.co.kr'],
    ['ops.e-trinity.co.kr'],
    ['localhost'],
    [''],
    [null],
    [undefined]
  ])('%s → 빈 문자열 (테넌트 로비 아님)', (hostname) => {
    expect(extractTenantSubdomainFromHostname(hostname)).toBe('');
  });

  it('다단 라벨은 거부', () => {
    expect(extractTenantSubdomainFromHostname('a.b.dev.core-solution.co.kr')).toBe('');
  });

  describe('REACT_APP_TENANT_HOST_ALIASES', () => {
    const previousAliases = process.env.REACT_APP_TENANT_HOST_ALIASES;

    afterEach(() => {
      if (previousAliases === undefined) {
        delete process.env.REACT_APP_TENANT_HOST_ALIASES;
      } else {
        process.env.REACT_APP_TENANT_HOST_ALIASES = previousAliases;
      }
    });

    it('별칭 호스트 → mindgarden (suffix 전)', () => {
      process.env.REACT_APP_TENANT_HOST_ALIASES =
        'mindgarden-dev.core-solution.co.kr:mindgarden';
      expect(extractTenantSubdomainFromHostname('mindgarden-dev.core-solution.co.kr')).toBe(
        'mindgarden'
      );
      expect(extractTenantSubdomainFromHostname('mindgarden-dev.core-solution.co.kr:443')).toBe(
        'mindgarden'
      );
    });

    it('별칭 미설정 시 mindgarden-dev 는 mindgarden-dev 라벨', () => {
      delete process.env.REACT_APP_TENANT_HOST_ALIASES;
      expect(extractTenantSubdomainFromHostname('mindgarden-dev.core-solution.co.kr')).toBe(
        'mindgarden-dev'
      );
    });
  });
});

describe('buildTenantAuthBaseUrl alias host preserve', () => {
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(globalThis.window, 'location');
  const previousAliases = process.env.REACT_APP_TENANT_HOST_ALIASES;

  function setMockLocationFromHref(href) {
    const url = new URL(href);
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      writable: true,
      value: {
        href: url.href,
        origin: url.origin,
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash
      }
    });
  }

  afterEach(() => {
    if (originalLocationDescriptor) {
      Object.defineProperty(globalThis.window, 'location', originalLocationDescriptor);
    }
    if (previousAliases === undefined) {
      delete process.env.REACT_APP_TENANT_HOST_ALIASES;
    } else {
      process.env.REACT_APP_TENANT_HOST_ALIASES = previousAliases;
    }
  });

  it('별칭 호스트에서 요청 라벨이 일치하면 현재 origin 유지 (prod 재조립 금지)', () => {
    process.env.REACT_APP_TENANT_HOST_ALIASES =
      'mindgarden-dev.core-solution.co.kr:mindgarden';
    setMockLocationFromHref('https://mindgarden-dev.core-solution.co.kr/login');
    expect(buildTenantAuthBaseUrl('mindgarden')).toBe(
      'https://mindgarden-dev.core-solution.co.kr'
    );
  });
});

describe('getMatchedSubdomainSuffixFromHostname staging', () => {
  it('staging 호스트는 staging 접미사', () => {
    expect(getMatchedSubdomainSuffixFromHostname('mindgarden.staging.core-solution.co.kr')).toBe(
      '.staging.core-solution.co.kr'
    );
  });
});

describe('getTenantSubdomainFromHost window bridge', () => {
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(globalThis.window, 'location');

  function setHostname(hostname) {
    Object.defineProperty(globalThis.window, 'location', {
      configurable: true,
      writable: true,
      value: { hostname }
    });
  }

  afterEach(() => {
    if (originalLocationDescriptor) {
      Object.defineProperty(globalThis.window, 'location', originalLocationDescriptor);
    }
  });

  it('window.hostname 을 순수 추출기에 위임', () => {
    setHostname('mindgarden.dev.core-solution.co.kr');
    expect(getTenantSubdomainFromHost()).toBe('mindgarden');
  });

  it('e-trinity 는 빈 문자열', () => {
    setHostname('apply.e-trinity.co.kr');
    expect(getTenantSubdomainFromHost()).toBe('');
  });
});
