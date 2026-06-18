/**
 * 프로필 이미지 multipart 업로드 입력 정규화 (P0 영구 대책 Phase 2 — 2026-06-09).
 *
 * <p>{@link import('@/api/hooks/useProfileImageUpload').useProfileImageUpload} 가 호출 시 사용한다.
 * Hook 내부에서 직접 작성하면 jest 환경(node)에서 React Native FormData·@tanstack/react-query 의존성
 * 때문에 단위 테스트가 어려워, 순수 함수만 별도 모듈로 분리한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */

/** 서버 BE 와 동일하게 PNG/JPG/WEBP 만 허용한다. */
export const PROFILE_IMAGE_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PROFILE_IMAGE_DEFAULT_MIME = 'image/jpeg';

export type ProfileImageMime = (typeof PROFILE_IMAGE_ALLOWED_MIME)[number];

/** MIME 으로부터 표시용 확장자(소문자) 를 결정한다. */
export function resolveExtensionFromMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}

/** timestamp 기반 기본 파일명을 생성한다. */
export function buildDefaultFileName(mime: string, nowMs: number = Date.now()): string {
  return `profile_${nowMs}.${resolveExtensionFromMime(mime)}`;
}

/**
 * expo-image-picker 결과를 multipart FormData 에 그대로 append 할 수 있는
 * `{ uri, name, type }` 형태로 정규화한다.
 *
 * @param input {@code uri} 는 필수, {@code mimeType}/{@code fileName} 은 선택.
 * @param nowMs 기본 파일명 생성에 사용할 timestamp (테스트 결정성 확보용)
 * @returns FormData append 직전 검증·정규화된 페이로드
 * @throws {Error} {@code uri} 가 비어 있는 경우
 */
export function normalizeProfileImageUploadPayload(
  input: { uri?: string; mimeType?: string | null; fileName?: string | null } | null | undefined,
  nowMs: number = Date.now(),
): { uri: string; name: string; type: ProfileImageMime } {
  if (!input || !input.uri || input.uri.trim() === '') {
    throw new Error('업로드할 이미지를 선택해주세요.');
  }
  const rawMime = (input.mimeType ?? PROFILE_IMAGE_DEFAULT_MIME).toLowerCase();
  const type: ProfileImageMime = (PROFILE_IMAGE_ALLOWED_MIME as readonly string[]).includes(rawMime)
    ? (rawMime as ProfileImageMime)
    : PROFILE_IMAGE_DEFAULT_MIME;
  const name = input.fileName && input.fileName.trim() !== ''
    ? input.fileName
    : buildDefaultFileName(type, nowMs);
  return { uri: input.uri, name, type };
}
