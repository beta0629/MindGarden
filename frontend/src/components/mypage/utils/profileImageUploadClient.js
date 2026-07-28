/**
 * Web 프로필 이미지 업로드 클라이언트 검증·페이로드 빌더 (P0 영구 대책 Phase 2 — 2026-06-09).
 *
 * <p>{@code ProfileImageUpload.js} 가 사용하는 순수 함수들. 가독성·테스트 용이성을 위해 추출.
 * BE {@code ProfileImageStorageConstants} 와 정책(5MB · PNG/JPG/WEBP) 1:1 동기화를 유지한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * 멀티파트 업로드 endpoint 빌더.
 * @param {number|string} userId
 * @returns {string}
 */
export const buildProfileImageUploadEndpoint = (userId) =>
  `/api/v1/users/profile/${userId}/image`;

/**
 * 클라이언트 사이드 검증 (사이즈/MIME). 에러 메시지가 있으면 사용자에게 표시 후 업로드를 막는다.
 *
 * @param {File|null|undefined} file
 * @returns {string|null} 에러 메시지 (검증 통과 시 null)
 */
export const validateProfileImageFile = (file) => {
  if (!file) {
    return '파일을 선택해 주세요.';
  }
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    return '파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.';
  }
  if (file.type && !PROFILE_IMAGE_ALLOWED_MIME.includes(file.type)) {
    return '지원하지 않는 파일 형식입니다. PNG, JPG, WEBP만 업로드 가능합니다.';
  }
  return null;
};

/**
 * StandardizedApi.postFormData 응답에서 profileImageUrl 을 추출한다.
 * BE 응답 envelope `{ success, data: { profileImageUrl } }` 와 envelope 미언래핑 케이스 모두 지원.
 *
 * @param {*} response
 * @returns {string|null}
 */
export const extractProfileImageUrlFromUploadResponse = (response) => {
  if (!response || typeof response !== 'object') {
    return null;
  }
  if (typeof response.profileImageUrl === 'string') {
    return response.profileImageUrl;
  }
  const data = response.data;
  if (data && typeof data === 'object' && typeof data.profileImageUrl === 'string') {
    return data.profileImageUrl;
  }
  return null;
};
