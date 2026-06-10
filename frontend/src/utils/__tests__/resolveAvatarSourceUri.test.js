/**
 * resolveAvatarSourceUri 단위 테스트 (웹 SSOT)
 *
 * @author Core Solution
 * @since 2026-06-10
 */

jest.mock('../../constants/api', () => ({
  __esModule: true,
  getApiBaseUrl: () => 'http://localhost:8080',
  API_BASE_URL: 'http://localhost:8080'
}));

import { resolveAvatarSourceUri } from '../resolveAvatarSourceUri';

describe('resolveAvatarSourceUri', () => {
  describe('빈 값 처리', () => {
    test('null → null', () => {
      expect(resolveAvatarSourceUri(null)).toBeNull();
    });

    test('undefined → null', () => {
      expect(resolveAvatarSourceUri(undefined)).toBeNull();
    });

    test('빈 문자열 → null', () => {
      expect(resolveAvatarSourceUri('')).toBeNull();
    });

    test('공백만 → null', () => {
      expect(resolveAvatarSourceUri('   ')).toBeNull();
    });

    test("'null' 문자열 → null (BE 직렬화 사고 방어)", () => {
      expect(resolveAvatarSourceUri('null')).toBeNull();
    });

    test("'undefined' 문자열 → null", () => {
      expect(resolveAvatarSourceUri('undefined')).toBeNull();
    });
  });

  describe('절대 URL 통과', () => {
    test('https URL 그대로 반환', () => {
      const url = 'https://cdn.example.com/img/abc.png';
      expect(resolveAvatarSourceUri(url)).toBe(url);
    });

    test('http URL 그대로 반환', () => {
      const url = 'http://k.kakaocdn.net/dn/profile.jpg';
      expect(resolveAvatarSourceUri(url)).toBe(url);
    });

    test('data URI 그대로 반환 (업로드 미리보기 등)', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
      expect(resolveAvatarSourceUri(dataUri)).toBe(dataUri);
    });

    test('blob URL 그대로 반환', () => {
      const blob = 'blob:http://localhost:3000/abc-123';
      expect(resolveAvatarSourceUri(blob)).toBe(blob);
    });

    test('protocol-relative // 는 https: prepend', () => {
      const input = '//cdn.example.com/img/x.png';
      expect(resolveAvatarSourceUri(input)).toBe('https://cdn.example.com/img/x.png');
    });
  });

  describe('상대 path 절대화', () => {
    test('/api/v1/files/profile-images/foo.png → 절대 URL', () => {
      const path = '/api/v1/files/profile-images/foo.png';
      expect(resolveAvatarSourceUri(path)).toBe(`http://localhost:8080${path}`);
    });

    test('/uploads/profile/bar.png → 절대 URL', () => {
      const path = '/uploads/profile/bar.png';
      expect(resolveAvatarSourceUri(path)).toBe(`http://localhost:8080${path}`);
    });

    test('apiBaseUrl 빈 문자열이면 path 그대로 반환', () => {
      const path = '/api/v1/files/profile-images/baz.png';
      expect(resolveAvatarSourceUri(path, '')).toBe(path);
    });

    test('apiBaseUrl 에 path 붙어 있어도 origin 만 사용', () => {
      const path = '/uploads/x.png';
      expect(resolveAvatarSourceUri(path, 'https://example.com/some/sub/path')).toBe(
        'https://example.com/uploads/x.png'
      );
    });

    test('apiBaseUrl 이 scheme 없을 때 https prepend', () => {
      const path = '/uploads/y.png';
      expect(resolveAvatarSourceUri(path, 'example.com')).toBe('https://example.com/uploads/y.png');
    });

    test('apiBaseUrl 이 잘못된 형식이면 path 만 반환 (throw 금지)', () => {
      const path = '/uploads/z.png';
      expect(resolveAvatarSourceUri(path, 'not a url at all !!!')).toBe(path);
    });
  });

  describe('예측 불가능한 입력 차단', () => {
    test('상대 segment (예: foo/bar.png) → null', () => {
      expect(resolveAvatarSourceUri('foo/bar.png')).toBeNull();
    });

    test('javascript: scheme 은 정책상 차단 (절대 URL 매칭 미해당)', () => {
      expect(resolveAvatarSourceUri('javascript:alert(1)')).toBeNull();
    });
  });
});
