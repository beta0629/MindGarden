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
