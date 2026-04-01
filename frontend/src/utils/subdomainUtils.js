/**
 * 테넌트 서브도메인 판별 유틸 (회원가입/로그인 등 인증 페이지 공통)
 * 백엔드 TenantContextFilter.extractTenantSubdomain 패턴과 동기화
 * @author CoreSolution
 * @since 2025-03-05
 */

/** 테넌트 도메인 접미사 목록 */
export const SUBDOMAIN_SUFFIXES = [
  '.dev.core-solution.co.kr',
  '.core-solution.co.kr'
];

/** 기본 서브도메인(테넌트로 간주하지 않음) */
export const DEFAULT_SUBDOMAINS = ['dev', 'app', 'api', 'staging', 'www'];

/** 잘못된 경로 안내 메시지 */
export const WRONG_PATH_MESSAGE = '잘못된 경로입니다. 테넌트 주소(서브도메인)로 접속해 주세요.';

/** 잘못된 경로 시 홈으로 리다이렉트 전 대기 시간(ms) */
export const WRONG_PATH_REDIRECT_DELAY_MS = 1800;

/**
 * 현재 창 호스트에서 테넌트 서브도메인 추출 (X-Tenant-Subdomain 헤더용).
 * api.dev.core-solution.co.kr 등 기본 서브도메인은 제외하여 빈 문자열 반환.
 * @returns {string} 서브도메인 또는 빈 문자열
 */
export function getTenantSubdomainFromHost() {
  const hostname =
    typeof globalThis !== 'undefined' && globalThis.window && globalThis.window.location
      ? globalThis.window.location.hostname
      : '';
  if (!hostname) return '';
  const hostWithoutPort = hostname.split(':')[0];
  for (const suffix of SUBDOMAIN_SUFFIXES) {
    if (hostWithoutPort.endsWith(suffix)) {
      const subdomain = hostWithoutPort.slice(0, -suffix.length);
      if (DEFAULT_SUBDOMAINS.includes(subdomain)) return '';
      return subdomain || '';
    }
  }
  return '';
}

/** 현재 호스트가 테넌트 도메인 접미사 중 하나로 끝나는지 여부 */
export function isOnTenantCapableDomain() {
  if (typeof globalThis === 'undefined' || !globalThis.window || !globalThis.window.location) return false;
  const hostname = globalThis.window.location.hostname.split(':')[0];
  return SUBDOMAIN_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

/** 로컬 개발 환경 여부 (localhost, 127.0.0.1) — 잘못된 경로로 간주하지 않음 */
export function isLocalhost() {
  if (typeof globalThis === 'undefined' || !globalThis.window || !globalThis.window.location) return false;
  const hostname = globalThis.window.location.hostname.split(':')[0];
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * 테넌트 도메인인데 유효한 서브도메인이 없을 때 true (잘못된 경로)
 * @returns {boolean}
 */
export function shouldRedirectWrongPath() {
  return !isLocalhost() && isOnTenantCapableDomain() && getTenantSubdomainFromHost() === '';
}

/**
 * 호스트명이 테넌트 도메인 접미사 중 무엇으로 끝나는지 반환.
 * @param {string} hostname 포트 제외 호스트명
 * @returns {string|undefined} SUBDOMAIN_SUFFIXES의 항목 또는 없으면 undefined
 */
export function getMatchedSubdomainSuffixFromHostname(hostname) {
  if (!hostname) return undefined;
  const host = hostname.split(':')[0];
  return SUBDOMAIN_SUFFIXES.find((suffix) => host.endsWith(suffix));
}

/**
 * 로그아웃 등 테넌트 라벨 기준 로그인 페이지용 origin(scheme + host + port) 생성.
 * 현재 창과 동일한 프로토콜·포트·도메인 패밀리(dev.core-solution / core-solution)를 유지한다.
 * 호스트가 접미사와 맞지 않으면 목록의 마지막 항목(운영 .core-solution.co.kr)을 사용한다.
 *
 * @param {string} tenantSubdomain 테넌트 서브도메인 라벨 (예: mindgarden)
 * @returns {string|null} origin 또는 null
 * @author CoreSolution
 * @since 2026-04-01
 */
export function buildTenantAuthBaseUrl(tenantSubdomain) {
  if (!tenantSubdomain || typeof tenantSubdomain !== 'string') {
    return null;
  }
  if (typeof globalThis === 'undefined' || !globalThis.window?.location) {
    return null;
  }
  const { protocol, hostname, port } = globalThis.window.location;
  const host = hostname.split(':')[0];
  const matchedSuffix =
    getMatchedSubdomainSuffixFromHostname(host) ?? SUBDOMAIN_SUFFIXES.at(-1);
  const portPart = port ? `:${port}` : '';
  return `${protocol}//${tenantSubdomain}${matchedSuffix}${portPart}`;
}
