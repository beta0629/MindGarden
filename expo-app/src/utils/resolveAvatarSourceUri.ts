/**
 * resolveAvatarSourceUri — 프로필 이미지 URI 정규화 (P0 핫픽스 — 2026-06-09)
 *
 * <p>BE 가 DB `users.profile_image_url` 에 저장하는 값은 상대 path
 * (`/api/v1/files/profile-images/{fileName}`) 표준이다. 브라우저는 같은 origin
 * 으로 자동 보강하지만, React Native (`expo-image`) 는 origin 없는 상대 path 를
 * 가져오지 못해 이미지가 표시되지 않는다 (운영 P0 — 사용자 id=20 사례).</p>
 *
 * <p>이 helper 는 다음 정책을 적용한다:
 * <ul>
 *   <li>빈 문자열 / null / undefined → null (호출부에서 이니셜 fallback)</li>
 *   <li>이미 절대 URL (`http://`, `https://`, `data:`, `file:`, `content:`, `ph:`)
 *       → 그대로 반환 (예: 카카오 CDN, expo-image-picker 로컬 URI)</li>
 *   <li>`//` 로 시작하는 protocol-relative URL → `https:` prepend</li>
 *   <li>`/` 로 시작하는 절대 path → `apiBaseUrl` origin prepend</li>
 *   <li>그 외 (상대 segment) → 안전상 null 반환 (예측 불가능한 경로 차단)</li>
 * </ul>
 * </p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */

/**
 * 호스트 origin 을 추출해 path 와 안전하게 결합한다.
 * 잘못된 baseUrl 이 들어와도 throw 하지 않고 path 만 반환한다.
 */
function buildAbsoluteFromAbsolutePath(absolutePath: string, apiBaseUrl: string): string {
  const base = (apiBaseUrl ?? '').trim();
  if (!base) {
    return absolutePath;
  }
  const withScheme = /^https?:\/\//i.test(base) ? base : `https://${base}`;
  try {
    const origin = new URL(withScheme).origin;
    return `${origin}${absolutePath}`;
  } catch {
    return absolutePath;
  }
}

/**
 * 프로필 이미지 URI 를 expo-image 가 가져갈 수 있는 절대 URL 로 정규화한다.
 *
 * @param uri DB·API 응답의 원본 값 (절대/상대/null 가능)
 * @param apiBaseUrl `getApiBaseUrl()` 결과. origin 추출용.
 * @returns 정규화된 절대 URL. 비어 있거나 형식이 잘못된 경우 null.
 */
export function resolveAvatarSourceUri(
  uri: string | null | undefined,
  apiBaseUrl: string,
): string | null {
  if (uri == null) {
    return null;
  }
  const trimmed = String(uri).trim();
  if (!trimmed) {
    return null;
  }

  if (/^(https?:|data:|file:|content:|ph:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return buildAbsoluteFromAbsolutePath(trimmed, apiBaseUrl);
  }

  // 예측 불가능한 상대 segment 는 origin 결합이 의도와 다를 수 있어 차단한다.
  return null;
}
