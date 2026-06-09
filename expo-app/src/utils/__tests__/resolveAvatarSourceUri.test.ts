/**
 * resolveAvatarSourceUri — 회귀 테스트 (P0 — 2026-06-09)
 */
import { resolveAvatarSourceUri } from '../resolveAvatarSourceUri';

const API_BASE = 'https://app.core-solution.co.kr';

describe('resolveAvatarSourceUri', () => {
  it('null/undefined/빈 문자열은 null 반환 (이니셜 fallback)', () => {
    expect(resolveAvatarSourceUri(null, API_BASE)).toBeNull();
    expect(resolveAvatarSourceUri(undefined, API_BASE)).toBeNull();
    expect(resolveAvatarSourceUri('', API_BASE)).toBeNull();
    expect(resolveAvatarSourceUri('   ', API_BASE)).toBeNull();
  });

  it('이미 https 절대 URL 은 그대로 반환 (카카오 CDN 등)', () => {
    const url = 'http://k.kakaocdn.net/dn/abc/profile.jpg';
    expect(resolveAvatarSourceUri(url, API_BASE)).toBe(url);
  });

  it('https 절대 URL 도 그대로 반환', () => {
    const url = 'https://cdn.example.com/p.png';
    expect(resolveAvatarSourceUri(url, API_BASE)).toBe(url);
  });

  it('expo-image-picker 로컬 URI (file:, content:, ph:) 는 그대로 반환', () => {
    expect(resolveAvatarSourceUri('file:///tmp/a.jpg', API_BASE)).toBe('file:///tmp/a.jpg');
    expect(resolveAvatarSourceUri('content://media/external/0/1', API_BASE))
      .toBe('content://media/external/0/1');
    expect(resolveAvatarSourceUri('ph://ABCDEF', API_BASE)).toBe('ph://ABCDEF');
  });

  it('data: dataURI 는 그대로 반환', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgo';
    expect(resolveAvatarSourceUri(dataUri, API_BASE)).toBe(dataUri);
  });

  it('protocol-relative URL 은 https: 를 붙여 반환', () => {
    expect(resolveAvatarSourceUri('//cdn.example.com/p.png', API_BASE))
      .toBe('https://cdn.example.com/p.png');
  });

  it('운영 P0: BE 저장 상대 path 를 API origin 으로 절대화한다', () => {
    const path = '/api/v1/files/profile-images/tenant_20_xxx.jpg';
    expect(resolveAvatarSourceUri(path, API_BASE))
      .toBe('https://app.core-solution.co.kr/api/v1/files/profile-images/tenant_20_xxx.jpg');
  });

  it('apiBaseUrl 에 scheme 이 없어도 https 로 보강한 origin 을 사용한다', () => {
    expect(resolveAvatarSourceUri('/api/v1/files/profile-images/x.jpg', 'app.core-solution.co.kr'))
      .toBe('https://app.core-solution.co.kr/api/v1/files/profile-images/x.jpg');
  });

  it('apiBaseUrl 이 trailing slash 인 경우에도 origin 만 사용한다', () => {
    expect(resolveAvatarSourceUri('/api/v1/files/profile-images/x.jpg', 'https://dev.core-solution.co.kr/'))
      .toBe('https://dev.core-solution.co.kr/api/v1/files/profile-images/x.jpg');
  });

  it('apiBaseUrl 이 비어 있어도 throw 없이 path 그대로 반환', () => {
    expect(resolveAvatarSourceUri('/api/v1/files/profile-images/x.jpg', ''))
      .toBe('/api/v1/files/profile-images/x.jpg');
  });

  it('예측 불가능한 상대 segment 는 null (안전 차단)', () => {
    expect(resolveAvatarSourceUri('relative/path.jpg', API_BASE)).toBeNull();
    expect(resolveAvatarSourceUri('./profile.png', API_BASE)).toBeNull();
    expect(resolveAvatarSourceUri('../up.png', API_BASE)).toBeNull();
  });

  it('잘못된 apiBaseUrl 이라도 path 만 반환 (throw 금지)', () => {
    expect(resolveAvatarSourceUri('/p.jpg', 'not a url at all'))
      .toBe('/p.jpg');
  });
});
