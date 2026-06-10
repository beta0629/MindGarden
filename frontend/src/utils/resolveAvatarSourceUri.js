/**
 * resolveAvatarSourceUri — 프로필 이미지 URI 정규화 (웹 SSOT, 2026-06-10)
 *
 * <p>BE 가 DB `users.profile_image_url` 에 저장하는 값은 상대 path
 * (`/api/v1/files/profile-images/{fileName}`) 가 표준이다. 같은 origin 인
 * 경우 브라우저는 자동으로 origin 을 보강하지만, dev 환경(프론트 3000 ·
 * BE 8080) 처럼 origin 이 다를 때나, 캐시 버스팅·`<img src>` 가 아닌
 * 위치(예: `srcset`, JS 로직)에 사용할 때는 절대 URL 로 일원화하는 편이
 * 안전하다. expo-app 의 `resolveAvatarSourceUri.ts` 와 동일한 정책을
 * 적용해 SSOT 를 맞춘다.</p>
 *
 * <p>적용 정책:
 * <ul>
 *   <li>빈 문자열 / null / undefined / 'null' / 'undefined' → null
 *       (호출부에서 이니셜 fallback)</li>
 *   <li>이미 절대 URL (`http://`, `https://`, `data:`, `blob:`, `file:`,
 *       `content:`, `ph:`) → 그대로 반환</li>
 *   <li>`//` 로 시작하는 protocol-relative URL → `https:` prepend</li>
 *   <li>`/` 로 시작하는 절대 path → `apiBaseUrl` 의 origin 이 있으면
 *       prepend, 비어 있으면 path 만 반환 (브라우저가 같은 origin 으로
 *       자동 해석)</li>
 *   <li>그 외 (예측 불가능한 상대 segment) → null</li>
 * </ul>
 * </p>
 *
 * @author Core Solution
 * @since 2026-06-10
 */

import { getApiBaseUrl } from '../constants/api';

/**
 * 호스트 origin 을 추출해 path 와 안전하게 결합한다.
 * 잘못된 baseUrl 이 들어와도 throw 하지 않고 path 만 반환한다.
 *
 * @param {string} absolutePath `/` 로 시작하는 절대 path
 * @param {string} apiBaseUrl `getApiBaseUrl()` 결과
 * @returns {string} 절대 URL 또는 path
 */
function buildAbsoluteFromAbsolutePath(absolutePath, apiBaseUrl) {
  const base = (apiBaseUrl == null ? '' : String(apiBaseUrl)).trim();
  if (!base) {
    return absolutePath;
  }
  const withScheme = /^https?:\/\//i.test(base) ? base : `https://${base}`;
  try {
    const { origin } = new URL(withScheme);
    return `${origin}${absolutePath}`;
  } catch {
    return absolutePath;
  }
}

/**
 * 프로필 이미지 URI 를 `<img src>` 가 안정적으로 가져갈 수 있는 형태로
 * 정규화한다. expo-app 의 동명 유틸과 동일한 동작을 보장한다.
 *
 * @param {string|null|undefined} uri DB·API 응답의 원본 값
 * @param {string} [apiBaseUrl] 선택적 baseUrl (테스트·SSR 용)
 * @returns {string|null} 정규화된 URL 또는 null
 */
export function resolveAvatarSourceUri(uri, apiBaseUrl) {
  if (uri == null) {
    return null;
  }
  const trimmed = String(uri).trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed === 'null' || trimmed === 'undefined') {
    return null;
  }

  if (/^(https?:|data:|blob:|file:|content:|ph:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  const base = apiBaseUrl != null ? apiBaseUrl : getApiBaseUrl();

  if (trimmed.startsWith('/')) {
    return buildAbsoluteFromAbsolutePath(trimmed, base);
  }

  return null;
}

export default resolveAvatarSourceUri;
