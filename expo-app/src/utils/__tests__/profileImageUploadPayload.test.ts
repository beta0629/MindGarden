import {
  PROFILE_IMAGE_ALLOWED_MIME,
  PROFILE_IMAGE_DEFAULT_MIME,
  buildDefaultFileName,
  normalizeProfileImageUploadPayload,
  resolveExtensionFromMime,
} from '../profileImageUploadPayload';

describe('profileImageUploadPayload — multipart 정규화 (P0 Phase 2)', () => {
  const FROZEN_NOW = 1_780_000_000_000;

  describe('resolveExtensionFromMime', () => {
    it('PNG → png, WEBP → webp, 기타 → jpg', () => {
      expect(resolveExtensionFromMime('image/png')).toBe('png');
      expect(resolveExtensionFromMime('image/webp')).toBe('webp');
      expect(resolveExtensionFromMime('image/jpeg')).toBe('jpg');
      expect(resolveExtensionFromMime('image/gif')).toBe('jpg');
      expect(resolveExtensionFromMime('')).toBe('jpg');
    });
  });

  describe('buildDefaultFileName', () => {
    it('timestamp + 확장자 패턴으로 생성한다', () => {
      expect(buildDefaultFileName('image/png', FROZEN_NOW)).toBe(`profile_${FROZEN_NOW}.png`);
      expect(buildDefaultFileName('image/jpeg', FROZEN_NOW)).toBe(`profile_${FROZEN_NOW}.jpg`);
    });
  });

  describe('normalizeProfileImageUploadPayload', () => {
    it('uri 누락 시 명시적 에러를 던진다', () => {
      expect(() => normalizeProfileImageUploadPayload(null)).toThrow('업로드할 이미지를 선택해주세요.');
      expect(() => normalizeProfileImageUploadPayload(undefined)).toThrow('업로드할 이미지');
      expect(() => normalizeProfileImageUploadPayload({ uri: '   ' })).toThrow('업로드할 이미지');
    });

    it('허용된 MIME(소문자) 은 그대로 사용한다', () => {
      const result = normalizeProfileImageUploadPayload({
        uri: 'file:///tmp/a.png',
        mimeType: 'image/png',
      }, FROZEN_NOW);
      expect(result).toEqual({
        uri: 'file:///tmp/a.png',
        name: `profile_${FROZEN_NOW}.png`,
        type: 'image/png',
      });
    });

    it('대문자 MIME 도 소문자로 정규화한다', () => {
      const result = normalizeProfileImageUploadPayload({
        uri: 'file:///tmp/a.webp',
        mimeType: 'IMAGE/WEBP',
      }, FROZEN_NOW);
      expect(result.type).toBe('image/webp');
      expect(result.name).toBe(`profile_${FROZEN_NOW}.webp`);
    });

    it('허용되지 않는 MIME (GIF, HEIC) 은 image/jpeg 로 fallback', () => {
      const gif = normalizeProfileImageUploadPayload({
        uri: 'file:///tmp/a.gif',
        mimeType: 'image/gif',
      }, FROZEN_NOW);
      expect(gif.type).toBe(PROFILE_IMAGE_DEFAULT_MIME);
      expect(gif.name).toBe(`profile_${FROZEN_NOW}.jpg`);

      const heic = normalizeProfileImageUploadPayload({
        uri: 'file:///tmp/a.heic',
        mimeType: 'image/heic',
      }, FROZEN_NOW);
      expect(heic.type).toBe(PROFILE_IMAGE_DEFAULT_MIME);
    });

    it('mimeType 누락 시 image/jpeg 기본값 + 표시용 파일명 자동 생성', () => {
      const result = normalizeProfileImageUploadPayload({
        uri: 'ph://abc',
      }, FROZEN_NOW);
      expect(result.type).toBe('image/jpeg');
      expect(result.name).toBe(`profile_${FROZEN_NOW}.jpg`);
    });

    it('fileName 이 제공되면 그대로 사용한다', () => {
      const result = normalizeProfileImageUploadPayload({
        uri: 'file:///tmp/a.png',
        mimeType: 'image/png',
        fileName: 'custom-name.png',
      });
      expect(result.name).toBe('custom-name.png');
    });

    it('fileName 이 공백 문자열이면 기본 파일명을 생성한다', () => {
      const result = normalizeProfileImageUploadPayload({
        uri: 'file:///tmp/a.png',
        mimeType: 'image/png',
        fileName: '   ',
      }, FROZEN_NOW);
      expect(result.name).toBe(`profile_${FROZEN_NOW}.png`);
    });

    it('PROFILE_IMAGE_ALLOWED_MIME 화이트리스트 항상 3개로 고정', () => {
      expect(PROFILE_IMAGE_ALLOWED_MIME).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    });
  });
});
