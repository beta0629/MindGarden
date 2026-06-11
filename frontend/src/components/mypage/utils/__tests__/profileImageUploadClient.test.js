/**
 * profileImageUploadClient — Web 프로필 이미지 업로드 클라이언트 검증 단위 테스트.
 *
 * <p>P0 영구 대책 Phase 2 (2026-06-09) — base64 dataURI 흐름을 multipart 업로드로 전환하면서
 * 새로 추가된 클라이언트 검증·페이로드 빌더 모듈에 대한 회귀 가드.</p>
 *
 * 검증 범위:
 *  - {@code buildProfileImageUploadEndpoint} — URL 패턴 (BE Controller 매핑과 1:1)
 *  - {@code validateProfileImageFile} — null/사이즈 초과/허용 MIME 외 거부 + 정상 통과
 *  - {@code extractProfileImageUrlFromUploadResponse} — envelope/raw 두 형태 모두 처리
 *
 * @author MindGarden
 * @since 2026-06-09
 */
import {
  PROFILE_IMAGE_ALLOWED_MIME,
  PROFILE_IMAGE_MAX_BYTES,
  buildProfileImageUploadEndpoint,
  extractProfileImageUrlFromUploadResponse,
  validateProfileImageFile,
} from '../profileImageUploadClient';

describe('profileImageUploadClient — P0 Phase 2 클라이언트 검증', () => {
  describe('buildProfileImageUploadEndpoint', () => {
    test('숫자 userId 로 /api/v1/users/profile/{userId}/image 를 생성한다', () => {
      expect(buildProfileImageUploadEndpoint(42)).toBe('/api/v1/users/profile/42/image');
    });

    test('문자열 userId 도 그대로 사용한다', () => {
      expect(buildProfileImageUploadEndpoint('00099')).toBe('/api/v1/users/profile/00099/image');
    });
  });

  describe('validateProfileImageFile', () => {
    const buildFile = (sizeBytes, type = 'image/jpeg') => {
      const file = new File(['x'], 'avatar.jpg', { type });
      Object.defineProperty(file, 'size', { value: sizeBytes });
      return file;
    };

    test('null/undefined 입력은 명시적 에러 메시지를 반환', () => {
      expect(validateProfileImageFile(null)).toEqual(expect.stringContaining('파일을 선택'));
      expect(validateProfileImageFile(undefined)).toEqual(expect.stringContaining('파일을 선택'));
    });

    test('5MB(=5242880 bytes) 까지는 통과', () => {
      expect(validateProfileImageFile(buildFile(PROFILE_IMAGE_MAX_BYTES))).toBeNull();
    });

    test('5MB + 1 바이트는 거부', () => {
      const msg = validateProfileImageFile(buildFile(PROFILE_IMAGE_MAX_BYTES + 1));
      expect(msg).toEqual(expect.stringContaining('5MB'));
    });

    test('허용된 MIME(PNG/JPEG/WEBP) 은 통과', () => {
      PROFILE_IMAGE_ALLOWED_MIME.forEach((mime) => {
        expect(validateProfileImageFile(buildFile(1024, mime))).toBeNull();
      });
    });

    test('허용되지 않는 MIME(GIF) 은 거부', () => {
      const msg = validateProfileImageFile(buildFile(1024, 'image/gif'));
      expect(msg).toEqual(expect.stringContaining('PNG'));
    });

    test('type 이 빈 문자열인 경우 사이즈만 검증 (드래그-드롭 후 MIME 누락 케이스)', () => {
      expect(validateProfileImageFile(buildFile(1024, ''))).toBeNull();
    });
  });

  describe('extractProfileImageUrlFromUploadResponse', () => {
    test('envelope 응답에서 data.profileImageUrl 을 추출', () => {
      const raw = { success: true, data: { profileImageUrl: '/api/v1/files/profile-images/t_1_uuid.png' } };
      expect(extractProfileImageUrlFromUploadResponse(raw))
        .toBe('/api/v1/files/profile-images/t_1_uuid.png');
    });

    test('이미 unwrap 된 응답에서도 profileImageUrl 을 추출', () => {
      const raw = { profileImageUrl: 'https://cdn.example/u/100.jpg' };
      expect(extractProfileImageUrlFromUploadResponse(raw))
        .toBe('https://cdn.example/u/100.jpg');
    });

    test('null/undefined/문자열 입력은 null', () => {
      expect(extractProfileImageUrlFromUploadResponse(null)).toBeNull();
      expect(extractProfileImageUrlFromUploadResponse(undefined)).toBeNull();
      expect(extractProfileImageUrlFromUploadResponse('plain-string')).toBeNull();
    });

    test('profileImageUrl 이 문자열 아님(숫자) 이면 null', () => {
      expect(extractProfileImageUrlFromUploadResponse({ data: { profileImageUrl: 123 } })).toBeNull();
    });
  });
});
