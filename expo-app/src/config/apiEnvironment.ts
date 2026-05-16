/**
 * API 베이스 URL·Metro 여부로 배포 환경 UI 라벨을 만든다.
 * 개발/운영 서버 혼동 방지용 상단 띠에 사용.
 */
import { getApiBaseUrl } from './apiBaseUrl';

export type ApiDeploymentKind = 'dev-metro' | 'dev-api' | 'prod';

export interface ApiDeploymentUi {
  kind: ApiDeploymentKind;
  headline: string;
  detail: string;
}

function hostnameFromApiBase(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    const stripped = url.replace(/^https?:\/\//i, '').trim();
    return stripped.split('/')[0] ?? stripped;
  }
}

function isProductionApiHost(hostname: string): boolean {
  return hostname === 'app.core-solution.co.kr';
}

/** 운영 릴리스 APK에서는 상단 띠를 숨긴다(개발·Metro만 표시). */
export function shouldShowApiEnvironmentBanner(): boolean {
  if (__DEV__) {
    return true;
  }
  const host = hostnameFromApiBase(getApiBaseUrl());
  return !isProductionApiHost(host);
}

/**
 * 현재 번들·`getApiBaseUrl()` 기준 환경 표시용 문구.
 * - `__DEV__`: Metro 개발 번들(호스트는 `getApiBaseUrl()`과 동일 표시)
 * - 릴리스: `app.core-solution.co.kr` → 운영(띠 미표시), 그 외 → 개발 API
 */
export function getApiDeploymentUi(): ApiDeploymentUi {
  const base = getApiBaseUrl();
  const host = hostnameFromApiBase(base);

  if (__DEV__) {
    return {
      kind: 'dev-metro',
      headline: '개발 (Metro)',
      detail: host,
    };
  }

  if (isProductionApiHost(host)) {
    return {
      kind: 'prod',
      headline: '운영 서버',
      detail: host,
    };
  }

  return {
    kind: 'dev-api',
    headline: '개발 서버',
    detail: host,
  };
}
