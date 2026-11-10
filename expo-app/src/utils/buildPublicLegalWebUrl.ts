/**
 * 공개 /legal/* 웹 URL — 테넌트 서브도메인 호스트 우선
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import { getWebBaseUrl } from '@/config/webBaseUrl';

/** 환경 마커 라벨 — tenantCode 로 교체 (prepend 금지) */
const APEX_FIRST_LABELS = new Set(['dev', 'www', 'staging', 'app', 'api']);

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * 공개 법적 경로를 HTTPS 절대 URL로 만든다.
 * tenantCode 가 있으면 `{tenant}.{apex}/legal/...` 호스트로 맞춘다
 * (웹 `fetchTenantPublicHomeMeta` 가 Host 서브도메인으로 테넌트를 읽음).
 *
 * 호스트 규칙:
 * - 첫 라벨이 APEX_FIRST_LABELS(app/dev/www/staging/api) → 해당 라벨을 tenant 로 **교체**
 *   (`app.core-solution.co.kr` + mindgarden → `mindgarden.core-solution.co.kr`)
 * - 이미 테넌트형 호스트(라벨 ≥4, 첫 라벨이 env 마커 아님) → 첫 라벨만 교체
 * - bare apex → tenant 를 prepend
 *
 * @param legalPath `/legal/terms` 등
 * @param tenantCode 선택 테넌트 코드(서브도메인)
 * @returns https URL
 */
export function buildPublicLegalWebUrl(
  legalPath: string,
  tenantCode?: string | null,
): string {
  const base = getWebBaseUrl();
  const path = legalPath.startsWith('/') ? legalPath : `/${legalPath}`;
  const code = tenantCode?.trim() ?? '';

  try {
    const u = new URL(base);
    if (code) {
      const parts = u.hostname.split('.');
      const first = parts[0] ?? '';
      if (parts.length >= 3 && APEX_FIRST_LABELS.has(first)) {
        u.hostname = `${code}.${parts.slice(1).join('.')}`;
      } else if (parts.length >= 4) {
        parts[0] = code;
        u.hostname = parts.join('.');
      } else if (parts.length >= 2) {
        u.hostname = `${code}.${u.hostname}`;
      }
    }
    return `${stripTrailingSlash(u.origin)}${path}`;
  } catch {
    return `${stripTrailingSlash(base)}${path}`;
  }
}
